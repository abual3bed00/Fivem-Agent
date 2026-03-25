// ═══════════════════════════════════════════════════════════════════════════
//  FiveM Script Agent — app.js (File tree, tabs, toolbar, context menu)
// ═══════════════════════════════════════════════════════════════════════════

const api = window.electronAPI;

// ─── State ────────────────────────────────────────────────────────────────
let currentFolder = null;
let openTabs = [];     // { path, name, content, unsaved }
let activeTabPath = null;
let contextTarget = null;
window.appVersion = "0.0.0";

// ─── DOM refs ──────────────────────────────────────────────────────────────
const fileTree       = document.getElementById('file-tree');
const tabsBar        = document.getElementById('tabs-bar');
const noTabsMsg      = document.getElementById('no-tabs-msg');
const contextMenu    = document.getElementById('context-menu');
const setupOverlay   = document.getElementById('setup-overlay');
const termOutput     = document.getElementById('terminal-output');
const statusDot      = document.getElementById('status-dot');
const statusText     = document.getElementById('status-text');

// ─── Terminal Log ─────────────────────────────────────────────────────────
function log(msg, type = '') {
  const line = document.createElement('div');
  line.className = `term-line ${type}`;
  const ts = new Date().toLocaleTimeString('ar-SA');
  line.innerHTML = `[${ts}] ${msg}`;
  termOutput.appendChild(line);
  termOutput.scrollTop = termOutput.scrollHeight;
}

window.log = log;

// ─── Toolbar buttons ──────────────────────────────────────────────────────
document.getElementById('btn-minimize').onclick = () => api.minimize();
document.getElementById('btn-maximize').onclick = () => api.maximize();
document.getElementById('btn-close').onclick    = () => api.close();

document.getElementById('btn-new-resource').onclick = () => openModal('modal-newresource');
document.getElementById('btn-open-folder').onclick = openFolderDialog;
document.getElementById('btn-new-file').onclick    = () => openModal('modal-newfile');
document.getElementById('btn-save').onclick        = saveCurrentFile;
document.getElementById('btn-templates').onclick   = () => openModal('modal-templates');
document.getElementById('btn-collapse-sidebar').onclick = () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
};
document.getElementById('btn-collapse-chat').onclick = () => {
  toggleChat();
};

function toggleChat() {
  document.getElementById('chat-panel').classList.toggle('hidden');
}
document.getElementById('btn-clear-terminal').onclick = () => {
  termOutput.innerHTML = '';
  log('تم مسح السجل.', 'info');
};
document.getElementById('btn-new-chat').onclick = () => {
  api.resetChat().then(() => {
    document.getElementById('chat-messages').innerHTML = '';
    log('تمت إعادة المحادثة.', 'success');
  });
};

// --- Panel Toggles ---
document.getElementById('btn-toggle-chat').onclick = () => {
  toggleChat();
};

document.getElementById('btn-toggle-terminal').onclick = () => {
  const term = document.getElementById('terminal-panel');
  const main = document.querySelector('.main-layout');
  term.classList.toggle('hidden');
  main.classList.toggle('full-height');
};

document.getElementById('btn-check-updates').onclick = async () => {
  await checkForAppUpdates(true);
};

function showUpdateSplash(message) {
  const overlay = document.getElementById('setup-overlay');
  const statusEl = document.getElementById('setup-status');
  const progressEl = document.getElementById('download-progress');

  overlay.style.display = 'flex';
  statusEl.innerHTML = message;
  progressEl.style.width = '0%';
}

function hideUpdateSplash() {
  setupOverlay.style.display = 'none';
  document.getElementById('download-progress').style.width = '0%';
}

function updateUpdateButton(hasUpdate) {
  const button = document.getElementById('btn-check-updates');
  button.innerHTML = hasUpdate
    ? '<i class="fa-solid fa-download"></i> تنزيل التحديث'
    : '<i class="fa-solid fa-rotate"></i> فحص التحديث';
}

async function initializeAppVersion() {
  try {
    const result = await api.getAppVersion();
    if (result?.version) {
      window.appVersion = result.version;
    }
  } catch (_) {
    // Keep fallback version when version bridge is unavailable.
  }
}

async function checkForAppUpdates(isManual = false) {
  log('جاري فحص وجود تحديثات للتطبيق...', 'info');

  try {
    const result = await api.checkAppUpdate();
    if (!result.success) {
      log(`تعذر فحص التحديثات: ${result.error}`, 'warn');
      return;
    }

    updateUpdateButton(result.available);

    if (result.available) {
      const sourceLabel = result.source === 'github' ? 'على GitHub' : 'محليًا';
      const promptText = `تم العثور على تحديث جديد ${sourceLabel} من v${window.appVersion} إلى v${result.latestVersion}. هل تريد تنزيله وتثبيته الآن؟`;

      log(result.message, 'success');

      if (!isManual && !confirm(promptText)) {
        return;
      }

      showUpdateSplash('<i class="fa-solid fa-download pulse"></i> جاري تنزيل التحديث...');

      const removeProgressListener = api.onAppUpdateProgress((progress) => {
        const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
        document.getElementById('download-progress').style.width = `${percent}%`;
      });

      let installerPath = result.installerPath;

      if (result.downloadUrl) {
        const downloadResult = await api.downloadAppUpdate({
          downloadUrl: result.downloadUrl,
          installerPath: result.installerPath,
        });

        if (!downloadResult.success) {
          removeProgressListener();
          hideUpdateSplash();
          log(`فشل تنزيل التحديث: ${downloadResult.error}`, 'error');
          return;
        }

        installerPath = downloadResult.installerPath;
      } else {
        document.getElementById('download-progress').style.width = '100%';
      }

      removeProgressListener();
      showUpdateSplash('<i class="fa-solid fa-box-open pulse"></i> اكتمل التنزيل، جاري بدء التثبيت...');

      const installResult = await api.installAppUpdate(installerPath);

      if (!installResult.success) {
        hideUpdateSplash();
        log(`فشل تشغيل التحديث: ${installResult.error}`, 'error');
      }
      return;
    }

    if (isManual) {
      log(result.message, 'success');
    }
  } catch (_) {
    log('تعذر فحص التحديثات حالياً.', 'warn');
  }
}


// Start with terminal hidden by default
const term = document.getElementById('terminal-panel');
const main = document.querySelector('.main-layout');
term.classList.add('hidden');
main.classList.add('full-height');


// Quick action buttons
document.getElementById('qb-new-resource').onclick = () => openModal('modal-newresource');
document.getElementById('qb-new-lua').onclick = () => newFileFromTemplate('client.lua');
document.getElementById('qb-new-ui').onclick  = () => newFileFromTemplate('ui.html');
document.getElementById('qb-open').onclick    = openFolderDialog;

// ─── Keyboard Shortcuts ────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveCurrentFile(); }
  if (e.key === 'Escape') { closeAllMenus(); }
});

// ─── Open Folder ──────────────────────────────────────────────────────────
async function openFolderDialog() {
  const result = await api.openFolderDialog();
  if (!result.success) return;
  currentFolder = result.path;
  log(`فتح المجلد: ${result.path}`, 'success');
  await renderFileTree(currentFolder, fileTree);
}

// ─── Render File Tree ─────────────────────────────────────────────────────
const FILE_ICONS = {
  '.lua': '<i class="fa-solid fa-moon"></i>',
  '.js': '<i class="fa-brands fa-js"></i>',
  '.ts': '<i class="fa-solid fa-bolt"></i>',
  '.html': '<i class="fa-solid fa-globe"></i>',
  '.css': '<i class="fa-solid fa-palette"></i>',
  '.json': '<i class="fa-solid fa-list-check"></i>',
  '.md': '<i class="fa-solid fa-file-pen"></i>',
  '.txt': '<i class="fa-solid fa-file-lines"></i>',
  '.png': '<i class="fa-solid fa-image"></i>',
  '.jpg': '<i class="fa-solid fa-image"></i>',
  '.ico': '<i class="fa-solid fa-circle-user"></i>',
  '.cfg': '<i class="fa-solid fa-gears"></i>',
  '.sql': '<i class="fa-solid fa-database"></i>',
  '.xml': '<i class="fa-solid fa-file-code"></i>',
};
function fileIcon(name, isDir, ext) {
  if (isDir) return '<i class="fa-solid fa-folder"></i>';
  return FILE_ICONS[ext] || '<i class="fa-solid fa-file"></i>';
}

async function renderFileTree(dirPath, container, depth = 0) {
  if (depth === 0) {
    container.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'tree-item';
    header.style.cssText = 'font-weight:700;color:var(--text-primary);font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-top:10px;';
    header.textContent = '📁 ' + dirPath.split(/[\\/]/).pop();
    container.appendChild(header);
  }

  const result = await api.listDir(dirPath);
  if (!result.success) return;

  const sorted = result.entries.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sorted) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    item.style.paddingLeft = `${12 + depth * 14}px`;

    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.innerHTML = fileIcon(entry.name, entry.isDir, entry.ext);

    const name = document.createElement('span');
    name.className = 'tree-name';
    name.textContent = entry.name;

    item.appendChild(icon);
    item.appendChild(name);

    if (entry.isDir) {
      let expanded = false;
      const children = document.createElement('div');
      children.className = 'tree-folder-children';
      children.style.display = 'none';

      item.onclick = async (e) => {
        e.stopPropagation();
        expanded = !expanded;
        icon.innerHTML = expanded ? '<i class="fa-solid fa-folder-open"></i>' : '<i class="fa-solid fa-folder"></i>';
        children.style.display = expanded ? 'block' : 'none';
        if (expanded && children.children.length === 0) {
          await renderFileTree(entry.fullPath, children, depth + 1);
        }
      };
      container.appendChild(item);
      container.appendChild(children);
    } else {
      item.onclick = (e) => { e.stopPropagation(); openFileInEditor(entry.fullPath, entry.name); };
      container.appendChild(item);
    }

    // Context menu
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      contextTarget = entry;
      showContextMenu(e.clientX, e.clientY);
    });
  }
}

// ─── Context Menu ─────────────────────────────────────────────────────────
function showContextMenu(x, y) {
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
}
function closeAllMenus() {
  contextMenu.style.display = 'none';
  contextTarget = null;
}
document.addEventListener('click', closeAllMenus);

document.getElementById('ctx-open').onclick = () => {
  if (contextTarget && !contextTarget.isDir) openFileInEditor(contextTarget.fullPath, contextTarget.name);
  closeAllMenus();
};
document.getElementById('ctx-open-ext').onclick = async () => {
  if (contextTarget) await api.openFile(contextTarget.fullPath);
  closeAllMenus();
};
document.getElementById('ctx-rename').onclick = async () => {
  if (!contextTarget) return;
  const newName = prompt(`أدخل الاسم الجديد لـ "${contextTarget.name}":`, contextTarget.name);
  if (!newName || newName === contextTarget.name) return;
  const newPath = contextTarget.fullPath.replace(contextTarget.name, newName);
  const r = await api.renameFile(contextTarget.fullPath, newPath);
  if (r.success) { log(`✅ تمت إعادة التسمية: ${newPath}`, 'success'); await renderFileTree(currentFolder, fileTree); }
  else log(`❌ خطأ: ${r.error}`, 'error');
  closeAllMenus();
};
document.getElementById('ctx-move').onclick = async () => {
  if (!contextTarget) return;
  const dest = prompt(`أدخل مسار الوجهة لنقل "${contextTarget.name}":`, currentFolder + '\\');
  if (!dest) return;
  const destPath = dest.endsWith('\\') || dest.endsWith('/') ? dest + contextTarget.name : dest;
  const r = await api.moveFile(contextTarget.fullPath, destPath);
  if (r.success) { log(`✅ تم النقل إلى: ${destPath}`, 'success'); await renderFileTree(currentFolder, fileTree); }
  else log(`❌ خطأ: ${r.error}`, 'error');
  closeAllMenus();
};
document.getElementById('ctx-delete').onclick = async () => {
  if (!contextTarget) return;
  if (!confirm(`هل تريد حذف "${contextTarget.name}"؟ لا يمكن التراجع!`)) return;
  const r = await api.deleteFile(contextTarget.fullPath);
  if (r.success) {
    log(`🗑 تم الحذف: ${contextTarget.name}`, 'warn');
    closeTab(contextTarget.fullPath);
    await renderFileTree(currentFolder, fileTree);
  } else log(`❌ خطأ: ${r.error}`, 'error');
  closeAllMenus();
};

// ─── Tabs ─────────────────────────────────────────────────────────────────
function renderTabs() {
  tabsBar.innerHTML = '';
  if (openTabs.length === 0) {
    tabsBar.appendChild(noTabsMsg);
    return;
  }
  openTabs.forEach((tab) => {
    const el = document.createElement('div');
    el.className = `tab${tab.path === activeTabPath ? ' active' : ''}${tab.unsaved ? ' unsaved' : ''}`;
    el.innerHTML = `<span>${FILE_ICONS[tab.name.match(/\.[^.]+$/)?.[0]] || '<i class="fa-solid fa-file"></i>'} ${tab.name}</span>
                    <span class="tab-close" title="إغلاق"><i class="fa-solid fa-xmark"></i></span>`;
    el.onclick = (e) => { if (!e.target.classList.contains('tab-close')) switchTab(tab.path); };
    el.querySelector('.tab-close').onclick = (e) => { e.stopPropagation(); closeTab(tab.path); };
    tabsBar.appendChild(el);
  });
}

function switchTab(path) {
  // Save current editor content to the tab
  const prev = openTabs.find(t => t.path === activeTabPath);
  if (prev && window.getEditorContent) prev.content = window.getEditorContent();

  activeTabPath = path;
  const tab = openTabs.find(t => t.path === path);
  if (tab && window.setEditorContent) {
    window.setEditorContent(tab.content, getEditorMode(tab.name));
    updateStatusBar(tab.name);
  }
  renderTabs();
  document.getElementById('editor-placeholder').style.display = 'none';
  document.getElementById('cm-editor').style.display = 'block';
}

function closeTab(path) {
  const idx = openTabs.findIndex(t => t.path === path);
  if (idx === -1) return;
  openTabs.splice(idx, 1);
  if (activeTabPath === path) {
    activeTabPath = openTabs.length > 0 ? openTabs[Math.max(0, idx - 1)].path : null;
    if (activeTabPath) switchTab(activeTabPath);
    else {
      document.getElementById('editor-placeholder').style.display = 'flex';
      document.getElementById('cm-editor').style.display = 'none';
      updateStatusBar('');
    }
  }
  renderTabs();
}

// ─── Open File in Editor ──────────────────────────────────────────────────
async function openFileInEditor(filePath, name) {
  const existing = openTabs.find(t => t.path === filePath);
  if (existing) { switchTab(filePath); return; }

  const result = await api.readFile(filePath);
  if (!result.success) { log(`❌ فشل قراءة الملف: ${result.error}`, 'error'); return; }

  openTabs.push({ path: filePath, name, content: result.content, unsaved: false });
  log(`📄 فتح: ${name}`, 'info');

  // Provide context to chat
  document.getElementById('chat-context-bar').innerHTML =
    `<span>📄 الملف الحالي: <strong>${name}</strong></span>`;
  window.currentFileContent = result.content;
  window.currentFileName = name;

  switchTab(filePath);
}

window.openFileInEditor = openFileInEditor;

// ─── Save File ────────────────────────────────────────────────────────────
async function saveCurrentFile() {
  if (!activeTabPath) return;
  const tab = openTabs.find(t => t.path === activeTabPath);
  if (!tab) return;
  if (window.getEditorContent) tab.content = window.getEditorContent();
  const result = await api.writeFile(tab.path, tab.content);
  if (result.success) {
    tab.unsaved = false;
    renderTabs();
    log(`💾 تم الحفظ: ${tab.name}`, 'success');
  } else log(`❌ فشل الحفظ: ${result.error}`, 'error');
}
window.saveCurrentFile = saveCurrentFile;

// Mark unsaved
window.markUnsaved = () => {
  const tab = openTabs.find(t => t.path === activeTabPath);
  if (tab) { tab.unsaved = true; renderTabs(); }
};

// ─── New File Modal ───────────────────────────────────────────────────────
document.getElementById('confirm-newfile').onclick = async () => {
  const name = document.getElementById('newfile-name').value.trim();
  if (!name) return;
  const dir = currentFolder || (await api.getAppPath()).path;
  const filePath = dir + '\\' + name;
  const result = await api.createFile(filePath, '');
  if (result.success) {
    await openFileInEditor(filePath, name);
    if (currentFolder) await renderFileTree(currentFolder, fileTree);
    log(`✅ تم إنشاء الملف: ${name}`, 'success');
  } else log(`❌ خطأ: ${result.error}`, 'error');
  closeModal('modal-newfile');
  document.getElementById('newfile-name').value = '';
};
document.getElementById('cancel-newfile').onclick = () => closeModal('modal-newfile');
document.getElementById('close-modal-newfile').onclick = () => closeModal('modal-newfile');

const RESOURCE_FRAMEWORKS = {
  standalone: {
    label: 'Standalone',
    dependencies: [],
    frameworkLine: '-- Framework: Standalone',
  },
  qbcore: {
    label: 'QBCore',
    dependencies: ['qb-core'],
    frameworkLine: '-- Framework: QBCore',
  },
  esx: {
    label: 'ESX',
    dependencies: ['es_extended'],
    frameworkLine: '-- Framework: ESX',
  },
  vrp: {
    label: 'vRP',
    dependencies: ['vrp'],
    frameworkLine: '-- Framework: vRP',
  },
};

function buildFxManifest(resourceName, frameworkKey) {
  const framework = RESOURCE_FRAMEWORKS[frameworkKey] || RESOURCE_FRAMEWORKS.standalone;
  const dependencies = framework.dependencies.length > 0
    ? `dependencies {\n${framework.dependencies.map((dep) => `    '${dep}'`).join(',\n')}\n}\n`
    : '';

  return [
    "fx_version 'cerulean'",
    "game 'gta5'",
    '',
    `name '${resourceName}'`,
    `description '${framework.label} resource generated by FiveM Script Agent'`,
    "version '1.0.0'",
    "author 'ii_abual3bed'",
    '',
    framework.frameworkLine,
    '',
    "lua54 'yes'",
    '',
    'client_scripts {',
    "    'client/client.lua'",
    '}',
    '',
    'server_scripts {',
    "    'server/server.lua'",
    '}',
    '',
    'shared_scripts {',
    "    'shared/config.lua',",
    "    'shared/shared.lua'",
    '}',
    '',
    "ui_page 'html/index.html'",
    '',
    'files {',
    "    'html/index.html',",
    "    'html/style.css',",
    "    'html/app.js'",
    '}',
    '',
    dependencies,
  ].join('\n');
}

function buildConfigLua(resourceName, frameworkKey) {
  return [
    'Config = {}',
    '',
    `Config.ResourceName = '${resourceName}'`,
    `Config.Framework = '${frameworkKey}'`,
    'Config.Debug = true',
    '',
    '-- Shared configuration goes here',
    '',
  ].join('\n');
}

function buildSharedLua(frameworkKey) {
  const frameworkLabel = RESOURCE_FRAMEWORKS[frameworkKey]?.label || 'Standalone';
  return [
    `-- Shared helpers for ${frameworkLabel}`,
    '',
    'Shared = Shared or {}',
    '',
    'function Shared.log(message)',
    "    print(('[FiveM Script Agent] %s'):format(message))",
    'end',
    '',
  ].join('\n');
}

function buildClientLua(frameworkKey) {
  const header = {
    standalone: '-- Standalone client bootstrap',
    qbcore: "local QBCore = exports['qb-core']:GetCoreObject()",
    esx: "local ESX = exports['es_extended']:getSharedObject()",
    vrp: "local Proxy = module('vrp', 'lib/Proxy')\nlocal vRP = Proxy.getInterface('vRP')",
  };

  return [
    header[frameworkKey] || header.standalone,
    '',
    'CreateThread(function()',
    `    print('${RESOURCE_FRAMEWORKS[frameworkKey]?.label || 'Standalone'} client started')`,
    'end)',
    '',
    '-- Add your client logic here',
    '',
  ].join('\n');
}

function buildServerLua(frameworkKey) {
  const header = {
    standalone: '-- Standalone server bootstrap',
    qbcore: "local QBCore = exports['qb-core']:GetCoreObject()",
    esx: "local ESX = exports['es_extended']:getSharedObject()",
    vrp: "local Proxy = module('vrp', 'lib/Proxy')\nlocal Tunnel = module('vrp', 'lib/Tunnel')",
  };

  return [
    header[frameworkKey] || header.standalone,
    '',
    'CreateThread(function()',
    `    print('${RESOURCE_FRAMEWORKS[frameworkKey]?.label || 'Standalone'} server started')`,
    'end)',
    '',
    '-- Add your server logic here',
    '',
  ].join('\n');
}

function buildHtml(resourceName, frameworkKey) {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `  <title>${resourceName}</title>`,
    '  <link rel="stylesheet" href="style.css" />',
    '</head>',
    '<body>',
    '  <main class="app-shell">',
    `    <h1>${resourceName}</h1>`,
    `    <p>Framework: ${RESOURCE_FRAMEWORKS[frameworkKey]?.label || 'Standalone'}</p>`,
    '  </main>',
    '  <script src="app.js"></script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function buildCss() {
  return [
    ':root {',
    '  color-scheme: dark;',
    '  --bg: #111217;',
    '  --card: #1a1d24;',
    '  --accent: #f15a25;',
    '  --text: #f4f5f7;',
    '}',
    '',
    'body {',
    '  margin: 0;',
    "  font-family: 'Segoe UI', sans-serif;",
    '  background: radial-gradient(circle at top, #1e222d, var(--bg));',
    '  color: var(--text);',
    '}',
    '',
    '.app-shell {',
    '  min-height: 100vh;',
    '  display: grid;',
    '  place-content: center;',
    '  text-align: center;',
    '  gap: 12px;',
    '}',
    '',
    'h1 {',
    '  margin: 0;',
    '  color: var(--accent);',
    '}',
    '',
  ].join('\n');
}

function buildJs(resourceName) {
  return [
    "window.addEventListener('message', (event) => {",
    `  console.log('${resourceName} UI message:', event.data);`,
    '});',
    '',
    "console.log('NUI loaded successfully');",
    '',
  ].join('\n');
}

async function createResourceStructure(resourceName, frameworkKey) {
  const rootDir = currentFolder || (await api.getAppPath()).path;
  const resourceDir = `${rootDir}\\${resourceName}`;

  const files = [
    { path: `${resourceDir}\\fxmanifest.lua`, content: buildFxManifest(resourceName, frameworkKey) },
    { path: `${resourceDir}\\client\\client.lua`, content: buildClientLua(frameworkKey) },
    { path: `${resourceDir}\\server\\server.lua`, content: buildServerLua(frameworkKey) },
    { path: `${resourceDir}\\shared\\config.lua`, content: buildConfigLua(resourceName, frameworkKey) },
    { path: `${resourceDir}\\shared\\shared.lua`, content: buildSharedLua(frameworkKey) },
    { path: `${resourceDir}\\html\\index.html`, content: buildHtml(resourceName, frameworkKey) },
    { path: `${resourceDir}\\html\\style.css`, content: buildCss() },
    { path: `${resourceDir}\\html\\app.js`, content: buildJs(resourceName) },
    { path: `${resourceDir}\\README.md`, content: `# ${resourceName}\n\nGenerated with FiveM Script Agent for ${RESOURCE_FRAMEWORKS[frameworkKey]?.label || 'Standalone'}.\n` },
  ];

  for (const file of files) {
    const result = await api.createFile(file.path, file.content);
    if (!result.success) {
      throw new Error(result.error || `Failed to create ${file.path}`);
    }
  }

  return { resourceDir, entryFile: `${resourceDir}\\fxmanifest.lua` };
}

document.getElementById('confirm-newresource').onclick = async () => {
  const resourceName = document.getElementById('newresource-name').value.trim();
  const frameworkKey = document.getElementById('newresource-framework').value;

  if (!resourceName) return;

  try {
    const created = await createResourceStructure(resourceName, frameworkKey);
    log(`✅ تم إنشاء Resource كامل: ${resourceName} (${RESOURCE_FRAMEWORKS[frameworkKey].label})`, 'success');
    if (currentFolder) await renderFileTree(currentFolder, fileTree);
    await openFileInEditor(created.entryFile, 'fxmanifest.lua');
  } catch (e) {
    log(`❌ فشل إنشاء الريسورس: ${e.message}`, 'error');
  }

  closeModal('modal-newresource');
  document.getElementById('newresource-name').value = '';
  document.getElementById('newresource-framework').value = 'standalone';
};

document.getElementById('cancel-newresource').onclick = () => closeModal('modal-newresource');
document.getElementById('close-modal-newresource').onclick = () => closeModal('modal-newresource');

// ─── Templates ────────────────────────────────────────────────────────────
const TEMPLATES = [
  { name: 'fxmanifest.lua', icon: '⚙️', desc: 'ملف تعريف السكريبت' },
  { name: 'client.lua',     icon: '🌙', desc: 'كود جانب العميل' },
  { name: 'server.lua',     icon: '🖥️', desc: 'كود جانب السيرفر' },
  { name: 'shared.lua',     icon: '🔗', desc: 'كود مشترك' },
  { name: 'config.lua',     icon: '⚙️', desc: 'ملف الإعدادات' },
  { name: 'ui.html',        icon: '🌐', desc: 'واجهة NUI HTML' },
  { name: 'ui.css',         icon: '🎨', desc: 'تصميم NUI' },
  { name: 'ui.js',          icon: '🟨', desc: 'منطق NUI JavaScript' },
  { name: 'README.md',      icon: '📝', desc: 'توثيق المشروع' },
  { name: 'LICENSE',        icon: '📜', desc: 'رخصة المشروع' },
  { name: 'locales.lua',    icon: '🌍', desc: 'ترجمات اللعبة' },
  { name: 'database.sql',   icon: '🗃',  desc: 'قاعدة البيانات' },
];

function renderTemplates() {
  const grid = document.getElementById('template-grid');
  grid.innerHTML = '';
  TEMPLATES.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'tmpl-card';
    card.innerHTML = `<div class="tmpl-icon">${t.icon}</div>
                      <div class="tmpl-name">${t.name}</div>
                      <div class="tmpl-desc">${t.desc}</div>`;
    card.onclick = () => { newFileFromTemplate(t.name); closeModal('modal-templates'); };
    grid.appendChild(card);
  });
}
renderTemplates();

document.getElementById('close-modal-templates').onclick = () => closeModal('modal-templates');

async function newFileFromTemplate(templateName) {
  const tmplPath = `../templates/${templateName}`;
  const dir = currentFolder || (await api.getAppPath()).path;
  let content = '';

  try {
    const r = await fetch(tmplPath);
    if (r.ok) content = await r.text();
  } catch (_) { /* use empty */ }

  const filePath = dir + '\\' + templateName;
  await api.createFile(filePath, content);
  await openFileInEditor(filePath, templateName);
  if (currentFolder) await renderFileTree(currentFolder, fileTree);
  log(`✅ تم إنشاء: ${templateName} من القالب`, 'success');
}

// ─── Web Search button ─────────────────────────────────────────────────────
document.getElementById('btn-search-web').onclick = () => {
  const q = prompt('ابحث عن:');
  if (q) document.getElementById('chat-input').value = `/search ${q}`;
};

// ─── Modal helpers ─────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', (e) => { if (e.target === m) m.style.display = 'none'; });
});

// ─── Status bar helpers ────────────────────────────────────────────────────
function getEditorMode(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = { lua: 'lua', js: 'javascript', ts: 'javascript', html: 'htmlmixed', css: 'css', md: 'markdown', sql: 'sql' };
  return map[ext] || 'text';
}

function updateStatusBar(name) {
  document.getElementById('sb-file').textContent = name || 'لا يوجد ملف';
  document.getElementById('sb-lang').textContent = name ? getEditorMode(name).toUpperCase() : '-';
}

// ─── AI Status helpers ─────────────────────────────────────────────────────
function setAIStatus(state, text) {
  statusDot.className = `status-dot ${state}`;
  statusText.innerHTML = text;
}
window.setAIStatus = setAIStatus;

log('✅ واجهة المستخدم جاهزة', 'success');

initializeAppVersion().then(() => {
  checkForAppUpdates(false);
});
