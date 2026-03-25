const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const axios = require('axios');
const chokidar = require('chokidar');

// Set app name to match product name for consistent userData path
app.name = 'FiveM Script Agent';

let mainWindow;
const versionInfoPath = path.join(__dirname, 'version.json');

function loadVersionInfo() {
  try {
    return JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'));
  } catch (_) {
    return {};
  }
}

function parseVersion(version) {
  return String(version || '0.0.0')
    .replace(/[^0-9.]/g, '')
    .split('.')
    .map((part) => Number.parseInt(part || '0', 10));
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

function normalizeVersion(version) {
  return String(version || '').trim().replace(/^v/i, '');
}

function getGitHubConfig() {
  const versionInfo = loadVersionInfo();
  const github = versionInfo.github || {};
  const owner = String(github.owner || '').trim();
  const repo = String(github.repo || '').trim();
  const assetPattern = String(github.assetPattern || 'FiveM Script Agent Setup {version}.exe').trim();

  if (!owner || !repo) return null;

  return { owner, repo, assetPattern };
}

function buildExpectedAssetName(pattern, version) {
  return pattern.replace('{version}', normalizeVersion(version));
}

function getUpdatesDir() {
  const updatesDir = path.join(app.getPath('userData'), 'updates');
  fs.mkdirSync(updatesDir, { recursive: true });
  return updatesDir;
}

async function fetchGitHubRelease() {
  const github = getGitHubConfig();
  if (!github) {
    return {
      configured: false,
      available: false,
      source: 'github',
      message: 'إعدادات GitHub Releases غير مكتملة.',
    };
  }

  const url = `https://api.github.com/repos/${github.owner}/${github.repo}/releases/latest`;
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'FiveM-Script-Agent',
      'Accept': 'application/vnd.github+json',
    },
    timeout: 15000,
  });

  const release = response.data || {};
  const releaseVersion = normalizeVersion(release.tag_name || release.name || '');
  const currentVersion = normalizeVersion(app.getVersion());

  if (!releaseVersion) {
    return {
      configured: true,
      available: false,
      source: 'github',
      message: 'تعذر قراءة رقم الإصدار من GitHub Release.',
    };
  }

  const expectedAssetName = buildExpectedAssetName(github.assetPattern, releaseVersion);
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const matchingAsset =
    assets.find((asset) => asset.name === expectedAssetName) ||
    assets.find((asset) => asset.name?.endsWith('.exe') && asset.name.includes(releaseVersion)) ||
    assets.find((asset) => asset.name?.endsWith('.exe'));

  if (compareVersions(releaseVersion, currentVersion) <= 0) {
    return {
      configured: true,
      available: false,
      source: 'github',
      currentVersion,
      latestVersion: releaseVersion,
      message: `أنت تستخدم أحدث إصدار منشور على GitHub (v${currentVersion}).`,
    };
  }

  if (!matchingAsset?.browser_download_url) {
    return {
      configured: true,
      available: false,
      source: 'github',
      currentVersion,
      latestVersion: releaseVersion,
      message: `تم العثور على Release جديد v${releaseVersion} لكن لم أجد ملف setup مناسب.`,
    };
  }

  return {
    configured: true,
    available: true,
    source: 'github',
    currentVersion,
    latestVersion: releaseVersion,
    releaseName: release.name || release.tag_name || `v${releaseVersion}`,
    releaseUrl: release.html_url || '',
    downloadUrl: matchingAsset.browser_download_url,
    assetName: matchingAsset.name,
    installerPath: path.join(getUpdatesDir(), matchingAsset.name),
    message: `يتوفر إصدار أحدث على GitHub: v${releaseVersion}`,
  };
}

async function downloadUpdateFile(downloadUrl, destinationPath) {
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

  const response = await axios({
    method: 'get',
    url: downloadUrl,
    responseType: 'stream',
    headers: {
      'User-Agent': 'FiveM-Script-Agent',
      'Accept': 'application/octet-stream, application/vnd.github+json',
    },
    timeout: 30000,
  });

  const totalSize = Number.parseInt(response.headers['content-length'] || '0', 10);
  const writer = fs.createWriteStream(destinationPath);
  let downloadedSize = 0;

  response.data.on('data', (chunk) => {
    downloadedSize += chunk.length;
    const progress = totalSize > 0 ? downloadedSize / totalSize : 0;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app-update-progress', progress);
    }
  });

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
    response.data.on('error', reject);
    response.data.pipe(writer);
  });

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app-update-progress', 1);
  }

  return destinationPath;
}

function getUpdateCandidateDirs() {
  const home = app.getPath('home');

  return [
    path.join(app.getPath('userData'), 'updates'),
    app.getPath('downloads'),
    path.join(home, '.gemini', 'antigravity', 'scratch', 'FiveM-Agent', 'dist'),
    path.join(home, 'Documents', 'New project', 'dist'),
  ];
}

function findLatestInstaller() {
  const installers = [];

  for (const dir of getUpdateCandidateDirs()) {
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const match = entry.name.match(/^FiveM Script Agent Setup\s+([0-9.]+)\.exe$/i);
      if (!match) continue;

      const fullPath = path.join(dir, entry.name);
      const stats = fs.statSync(fullPath);
      installers.push({
        path: fullPath,
        version: match[1],
        modifiedAt: stats.mtimeMs,
      });
    }
  }

  installers.sort((left, right) => {
    const byVersion = compareVersions(right.version, left.version);
    if (byVersion !== 0) return byVersion;
    return right.modifiedAt - left.modifiedAt;
  });

  return installers[0] || null;
}

function getInstalledBuildTime() {
  try {
    return fs.statSync(process.execPath).mtimeMs;
  } catch (_) {
    return 0;
  }
}

function getUpdateStatus() {
  const currentVersion = app.getVersion();
  const latestInstaller = findLatestInstaller();

  if (!latestInstaller) {
    return {
      available: false,
      currentVersion,
      message: 'لم يتم العثور على ملف تحديث محلي.',
    };
  }

  const versionDiff = compareVersions(latestInstaller.version, currentVersion);

  if (versionDiff > 0) {
    return {
      available: true,
      currentVersion,
      latestVersion: latestInstaller.version,
      installerPath: latestInstaller.path,
      message: `يتوفر إصدار أحدث: v${latestInstaller.version}`,
    };
  }

  return {
    available: false,
    currentVersion,
    latestVersion: latestInstaller.version,
    installerPath: latestInstaller.path,
    message: `أنت تستخدم أحدث إصدار محلي متاح (v${currentVersion}).`,
  };
}

async function resolveUpdateStatus() {
  try {
    const githubStatus = await fetchGitHubRelease();
    if (githubStatus.configured) {
      return githubStatus;
    }
  } catch (e) {
    return {
      success: false,
      source: 'github',
      error: `GitHub update check failed: ${e.message}`,
    };
  }

  return getUpdateStatus();
}

function ensureModelsDir() {
  const modelsDir = path.join(app.getPath('userData'), 'models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  return modelsDir;
}
let ollamaProcess = null;

// ─── Create Main Window ───────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0d0d0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── Window Controls ──────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// ─── File Operations ──────────────────────────────────────────────────────────
ipcMain.handle('read-file', async (_, filePath) => {
  try {
    return { success: true, content: fs.readFileSync(filePath, 'utf-8') };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('write-file', async (_, filePath, content) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('create-file', async (_, filePath, content = '') => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('delete-file', async (_, filePath) => {
  try {
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('move-file', async (_, srcPath, destPath) => {
  try {
    fs.renameSync(srcPath, destPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('rename-file', async (_, oldPath, newPath) => {
  try {
    fs.renameSync(oldPath, newPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('list-dir', async (_, dirPath) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return {
      success: true,
      entries: entries.map((e) => ({
        name: e.name,
        isDir: e.isDirectory(),
        fullPath: path.join(dirPath, e.name),
        ext: path.extname(e.name).toLowerCase(),
      })),
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-file', async (_, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-program', async (_, program) => {
  try {
    exec(program);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'اختر مجلد المشروع',
  });
  if (result.canceled) return { success: false };
  return { success: true, path: result.filePaths[0] };
});

ipcMain.handle('save-file-dialog', async (_, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    title: 'حفظ الملف',
  });
  if (result.canceled) return { success: false };
  return { success: true, path: result.filePath };
});

ipcMain.handle('check-path-exists', async (_, p) => {
  try {
    if (fs.existsSync(p)) {
      const stats = fs.statSync(p);
      return { exists: true, size: stats.size };
    }
    return { exists: false, size: 0 };
  } catch (e) {
    return { exists: false, size: 0 };
  }
});

ipcMain.handle('get-app-path', async () => {
  return { path: app.getPath('userData') };
});

ipcMain.handle('get-app-version', async () => {
  return { version: app.getVersion() };
});

ipcMain.handle('check-app-update', async () => {
  try {
    return { success: true, ...(await resolveUpdateStatus()) };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('download-app-update', async (_, payload) => {
  try {
    const downloadUrl = payload?.downloadUrl;
    const installerPath = payload?.installerPath;

    if (!downloadUrl || !installerPath) {
      return { success: false, error: 'بيانات تنزيل التحديث غير مكتملة.' };
    }

    const downloadedPath = await downloadUpdateFile(downloadUrl, installerPath);
    return { success: true, installerPath: downloadedPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('install-app-update', async (_, installerPath) => {
  try {
    if (!installerPath || !fs.existsSync(installerPath)) {
      return { success: false, error: 'ملف التحديث غير موجود.' };
    }

    const escapedInstallerPath = installerPath.replace(/"/g, '""');
    const updateCommand = [
      'timeout /t 2 /nobreak >nul',
      'taskkill /f /im "FiveM Script Agent.exe" >nul 2>nul',
      `start "" "${escapedInstallerPath}"`,
    ].join(' && ');

    spawn('cmd.exe', ['/c', updateCommand], {
      detached: true,
      stdio: 'ignore',
    }).unref();

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }

    app.exit(0);

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ─── AI: Chat via node-llama-cpp ─────────────────────────────────────────────
let llamaModel = null;
let llamaContext = null;
let llamaSession = null;
let agentTools = null;

ipcMain.handle('init-llm', async (event, modelPath) => {
  try {
    const { getLlama, LlamaChatSession, defineChatSessionFunction } = await import('node-llama-cpp');
    
    agentTools = {
      readFile: defineChatSessionFunction({
        description: "قراءة محتوى ملف من جهاز المستخدم", // Read file content
        params: {
          type: "object",
          properties: {
            path: { type: "string", description: "المسار الكامل للملف" }
          }
        },
        handler: async (params) => {
          try {
            mainWindow.webContents.send('llm-token', `\n[⚙️ جاري قراءة الملف: ${params.path}]\n`);
            return fs.readFileSync(params.path, 'utf8');
          } catch(e) { return "Error: " + e.message; }
        }
      }),
      createFile: defineChatSessionFunction({
        description: "إنشاء ملف جديد أو تعديل ملف موجود وكتابة الكود بداخله", // Create or edit file
        params: {
          type: "object",
          properties: {
            path: { type: "string", description: "المسار الكامل للملف" },
            content: { type: "string", description: "المحتوى أو الكود الذي سيتم كتابته" }
          }
        },
        handler: async (params) => {
          try {
            mainWindow.webContents.send('llm-token', `\n[⚙️ جاري كتابة الملف: ${params.path}]\n`);
            fs.mkdirSync(path.dirname(params.path), { recursive: true });
            fs.writeFileSync(params.path, params.content, 'utf8');
            return "File created and written successfully.";
          } catch(e) { return "Error: " + e.message; }
        }
      }),
      listDir: defineChatSessionFunction({
        description: "عرض محتويات مجلد لمعرفة الملفات الموجودة فيه", // List directory
        params: {
          type: "object",
          properties: {
            path: { type: "string", description: "المسار الكامل للمجلد" }
          }
        },
        handler: async (params) => {
          try {
            mainWindow.webContents.send('llm-token', `\n[⚙️ جاري فحص المجلد: ${params.path}]\n`);
            return fs.readdirSync(params.path).join(", ");
          } catch(e) { return "Error: " + e.message; }
        }
      })
    };

    // Step 1: Initialize Llama
    mainWindow.webContents.send('init-status', 'جاري تهيئة محرك الذكاء الاصطناعي...');
    const llama = await getLlama({
      gpu: 'auto',
    });
    
    // Step 2: Load Model
    mainWindow.webContents.send('init-status', 'جاري سحب النموذج إلى الذاكرة (قد يستغرق 20 ثانية)...');
    llamaModel = await llama.loadModel({ modelPath });
    
    // Step 3: Create Context
    mainWindow.webContents.send('init-status', 'جاري تهيئة مساحة الدردشة...');
    // Use 4096 context to properly fit tool definitions and system prompt history
    llamaContext = await llamaModel.createContext({ contextSize: 4096 });
    
    // Step 4: Create Session
    const systemPrompt = `أنت مساعد ذكي مجهز بأدوات (Tools) متصلة بنظام التشغيل الخاص بالمستخدم: (readFile, createFile, listDir).
مهمتك الوحيدة عندما يطلب المستخدم تعديل أو قراءة أو فحص شيء ما، هي استدعاء هذه الدوال (Function Calling) بشكل مباشر، ولا شيء غير ذلك!
- ممنوع منعاً باتاً كتابة دوال Lua لقراءة الملفات.
- ممنوع إعطاء أمثلة للمستخدم حول كيفية قراءة الملفات في FiveM إلا إذا سأل عن ذلك بالتحديد.
- استخدم الأدوات فوراً وبصمت، ثم قدم النتيجة النهائية بشكل مختصر.`;

    llamaSession = new LlamaChatSession({ 
      contextSequence: llamaContext.getSequence(),
      systemPrompt: systemPrompt
    });
    
    mainWindow.webContents.send('init-status', 'جاهز!');
    return { success: true };
  } catch (e) {
    console.error('LLM Init Error:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('llm-chat', async (_, message) => {
  try {
    if (!llamaSession) return { success: false, error: 'Model not loaded' };
    
    let isFinal = false;
    let currentMessage = message;
    let finalOutput = '';
    let loopCount = 0;
    
    while (!isFinal && loopCount < 4) {
      loopCount++;
      let response = '';
      
      await llamaSession.prompt(currentMessage, {
        functions: agentTools,
        temperature: 0.3,
        topP: 0.8,
        onToken: (chunk) => {
          const text = llamaModel.detokenize(chunk);
          response += text;
          mainWindow.webContents.send('llm-token', text);
        },
      });
      
      finalOutput += response;
      
      const jsonRegex = /\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{[\s\S]*?\})\s*\}/g;
      const matches = [...response.matchAll(jsonRegex)];
      
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        const toolName = lastMatch[1];
        let toolArgs;
        try { toolArgs = JSON.parse(lastMatch[2]); } catch(e) {}
        
        if (toolArgs) {
          let resultStr = "Error executing tool internally";
          try {
            if (toolName === 'readFile') {
              mainWindow.webContents.send('llm-token', `\n[⚙️ تم التقاط أمر قراءة الملف... جاري التنفيذ]\n`);
              resultStr = fs.readFileSync(toolArgs.path, 'utf8');
            } else if (toolName === 'createFile') {
              mainWindow.webContents.send('llm-token', `\n[⚙️ تم التقاط أمر كتابة الملف... جاري التنفيذ]\n`);
              fs.mkdirSync(path.dirname(toolArgs.path), { recursive: true });
              fs.writeFileSync(toolArgs.path, toolArgs.content || '', 'utf8');
              resultStr = "Success: File written.";
            } else if (toolName === 'listDir') {
              mainWindow.webContents.send('llm-token', `\n[⚙️ تم التقاط أمر فحص المجلد... جاري التنفيذ]\n`);
              resultStr = fs.readdirSync(toolArgs.path).join(", ");
            } else {
               resultStr = "Error: Invalid tool. Try another one.";
            }
          } catch(err) {
            resultStr = "Execution Error: " + err.message;
          }
          currentMessage = `Tool executed successfully. Output:\n${resultStr}\n---\nقم باستكمال الرد للمستخدم بناءً على هذه النتيجة.`;
          continue;
        } else {
          isFinal = true;
        }
      } else {
        isFinal = true;
      }
    }
    
    return { success: true, response: finalOutput };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('llm-reset', async () => {
  try {
    const { LlamaChatSession } = await import('node-llama-cpp');
    const systemPrompt = `أنت مساعد ذكي مجهز بأدوات (Tools) متصلة بنظام التشغيل الخاص بالمستخدم: (readFile, createFile, listDir).
مهمتك الوحيدة عندما يطلب المستخدم تعديل أو قراءة أو فحص شيء ما، هي استدعاء هذه الدوال (Function Calling) بشكل مباشر، ولا شيء غير ذلك!
- ممنوع منعاً باتاً كتابة دوال Lua لقراءة الملفات.
- ممنوع إعطاء أمثلة للمستخدم حول كيفية قراءة الملفات في FiveM إلا إذا سأل عن ذلك بالتحديد.
- استخدم الأدوات فوراً وبصمت، ثم قدم النتيجة النهائية بشكل مختصر.`;

    llamaSession = new LlamaChatSession({ 
      contextSequence: llamaContext.getSequence(),
      systemPrompt: systemPrompt
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('download-model', async (e, folderPath) => {
  try {
    const { createModelDownloader } = await import('node-llama-cpp');
    
    // Ensure the folder exists before downloading
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const downloader = await createModelDownloader({
      modelUri: 'hf:Qwen/Qwen2.5-Coder-3B-Instruct-GGUF:q4_k_m',
      dirPath: folderPath,
      fileName: 'qwen2.5-coder-3b-instruct-q4_k_m.gguf',
      showCliProgress: false,
      onProgress: ({ totalSize, downloadedSize }) => {
        const progress = totalSize > 0 ? downloadedSize / totalSize : 0;
        mainWindow.webContents.send('download-progress', progress);
      }
    });

    const modelFilePath = await downloader.download();
    return { success: true, path: modelFilePath };
  } catch (err) {
    console.error('Download Error:', err);
    return { success: false, error: err.message };
  }
});
