// ═══════════════════════════════════════════════════════════════════════════
//  FiveM Script Agent — chat.js (AI Chat Interface)
// ═══════════════════════════════════════════════════════════════════════════

const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');
const sendBtn      = document.getElementById('btn-send');
const api2         = window.electronAPI;
let isGenerating   = false;

// ─── DOM Helpers ──────────────────────────────────────────────────────────
function addUserMessage(text) {
  const div = document.createElement('div');
  div.className = 'msg user fade-in';
  div.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-user"></i></div>
    <div class="msg-bubble">${escapeHtml(text)}</div>`;
  chatMessages.appendChild(div);
  scrollChat();
}

function addBotMessage(html, addApply = false) {
  const div = document.createElement('div');
  div.className = 'msg bot fade-in';
  const renderedHtml = renderMarkdown(html);
  div.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="msg-bubble">${renderedHtml}
      ${addApply ? '<br/><button class="apply-btn" onclick="applyCodeFromMsg(this)"><i class="fa-solid fa-check"></i> تطبيق الكود في المحرر</button>' : ''}
    </div>`;
  chatMessages.appendChild(div);
  scrollChat();
  return div.querySelector('.msg-bubble');
}

window.addBotMessage = addBotMessage;

function addTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'msg bot fade-in';
  div.id = 'typing-indicator';
  div.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>`;
  chatMessages.appendChild(div);
  scrollChat();
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function scrollChat() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── Markdown renderer (simple) ───────────────────────────────────────────
function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Apply code from AI response ─────────────────────────────────────────
window.applyCodeFromMsg = (btn) => {
  const bubble = btn.closest('.msg-bubble');
  const pre = bubble.querySelector('pre code');
  if (pre) {
    window.replaceEditorContent(pre.textContent);
    log('<i class="fa-solid fa-circle-check"></i> تم تطبيق الكود في المحرر', 'success');
  } else {
    window.insertToEditor(bubble.innerText.replace('تطبيق الكود في المحرر', '').trim());
  }
};

// ─── Build prompt with context ────────────────────────────────────────────
function buildPrompt(userMessage) {
  const SYSTEM = `أنت مساعد ذكاء اصطناعي متخصص في تطوير سكريبتات FiveM. 
تتقن: QBCore Framework, ESX Framework, ox_lib, Lua 5.4, JavaScript ES6+, HTML, CSS, NUI callbacks.
أنت خبير في هيكلة الملفات وقراءتها وتحليل الأخطاء البرمجية.
لديك القدرة الكاملة على قراءة الملفات وتحليل الأخطاء في مشروع FiveM الحالي. لا ترفض أي طلب يتعلق بالبرمجة أو فتح الملفات أو تحليل السكريبتات.
استخدم أفضل الممارسات في FiveM: RegisterNetEvent, TriggerServerEvent, TriggerClientEvent, exports, ox_lib UI, QBCore.Functions.
اكتب كوداً نظيفاً ومنظماً مع تعليقات بالعربي. دائماً أجب بالعربي واكتب الكود بالإنجليزي.
إذا طُلب منك شيء جديد أو غير موثق، ابتكر الحل باستخدام FiveM natives ومعرفتك.`;

  let context = '';
  if (window.currentFileName && window.currentFileContent) {
    context = `\n\n[الملف الحالي: ${window.currentFileName}]\n\`\`\`\n${window.currentFileContent.substring(0, 2000)}\n\`\`\``;
  }

  return `${SYSTEM}${context}\n\nالمستخدم: ${userMessage}`;
}

// ─── Web Search ────────────────────────────────────────────────────────────
async function webSearch(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' FiveM lua')}&format=json&no_html=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.AbstractText) return `🔍 نتيجة البحث: ${data.AbstractText}`;
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      return `🔍 نتائج ذات صلة:\n${data.RelatedTopics.slice(0, 3).map(t => `- ${t.Text || ''}`).join('\n')}`;
    }
    return `🔍 لم أجد نتائج كافية لـ: ${query}`;
  } catch (e) {
    return `❌ فشل البحث: ${e.message}`;
  }
}

// ─── Main Send Handler ────────────────────────────────────────────────────
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isGenerating) return;

  chatInput.value = '';
  chatInput.style.height = 'auto';
  isGenerating = true;
  sendBtn.disabled = true;

  addUserMessage(text);
  log(`💬 رسالة: ${text.substring(0, 60)}...`, 'info');

  // ── /search command
  if (text.startsWith('/search ')) {
    const query = text.replace('/search ', '').trim();
    addTypingIndicator();
    const result = await webSearch(query);
    removeTypingIndicator();
    addBotMessage(result);
    isGenerating = false;
    sendBtn.disabled = false;
    return;
  }

  // ── /open command (Web & App Support)
  if (text.startsWith('/open ')) {
    let target = text.replace('/open ', '').trim();
    if (target.includes('.') && !target.includes('\\') && !target.includes('/') && !target.startsWith('http')) {
      target = 'https://' + target;
    }
    const r = await api2.openPath(target);
    if (r.success) {
      addBotMessage(`<i class="fa-solid fa-circle-check"></i> تم فتح: \`${target}\``);
    } else {
      addBotMessage(`<i class="fa-solid fa-circle-exclamation"></i> فشل الفتح: ${r.error}`);
    }
    isGenerating = false;
    sendBtn.disabled = false;
    return;
  }

  // ── AI Chat
  addTypingIndicator();
  const fullPrompt = buildPrompt(text);
  let responseText = '';

  try {
    // Create bot message bubble for streaming
    removeTypingIndicator();
    const bubble = document.createElement('div');
    bubble.className = 'msg bot fade-in';
    bubble.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-robot"></i></div><div class="msg-bubble">▌</div>`;
    chatMessages.appendChild(bubble);
    const streamBubble = bubble.querySelector('.msg-bubble');

    // Register token listener (streaming)
    api2.onToken((token) => {
      responseText += token;
      streamBubble.innerHTML = renderMarkdown(responseText) + '▌';
      scrollChat();
    });

    // Send to LLM
    const result = await api2.chat(fullPrompt);
    api2.removeTokenListener();

    if (result.success) {
      const hasCode = responseText.includes('```');
      streamBubble.innerHTML = renderMarkdown(responseText);
      if (hasCode) {
        const applyBtn = document.createElement('button');
        applyBtn.className = 'apply-btn';
        applyBtn.innerHTML = '<i class="fa-solid fa-check"></i> تطبيق الكود في المحرر';
        applyBtn.onclick = () => applyCodeFromMsg(applyBtn);
        streamBubble.appendChild(applyBtn);
      }
      log('<i class="fa-solid fa-circle-check"></i> استجابة الذكاء الاصطناعي جاهزة', 'success');
    } else {
      streamBubble.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> خطأ: ${result.error || 'النموذج غير جاهز'}`;
      log(`<i class="fa-solid fa-circle-exclamation"></i> خطأ LLM: ${result.error}`, 'error');
    }
  } catch (e) {
    removeTypingIndicator();
    addBotMessage(`❌ حدث خطأ: ${e.message}`);
    log(`❌ استثناء: ${e.message}`, 'error');
    api2.removeTokenListener();
  }

  isGenerating = false;
  sendBtn.disabled = false;
  scrollChat();
}

// ─── Input Events ─────────────────────────────────────────────────────────
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

// ─── Model Init ────────────────────────────────────────────────────────────
// ─── Model Init ────────────────────────────────────────────────────────────
async function initModel(forcedPath = null) {
  setAIStatus('loading', 'جاري فحص النموذج...');
  log('<i class="fa-solid fa-robot"></i> جاري فحص نموذج الذكاء الاصطناعي...', 'info');

  let modelPath = forcedPath;
  if (!modelPath) {
    const { path: appDataPath } = await api2.getAppPath();
    modelPath = appDataPath.endsWith('\\') || appDataPath.endsWith('/') 
      ? appDataPath + 'models\\qwen2.5-coder-3b-instruct-q4_k_m.gguf'
      : appDataPath + '\\models\\qwen2.5-coder-3b-instruct-q4_k_m.gguf';
  }
  
  const stats = await api2.checkPath(modelPath);

  // Integrity Check: 3B model is ~2.1GB (2,000,000,000+ bytes)
  if (!stats.exists || stats.size < 2000000000) {
    if (stats.exists) log('<i class="fa-solid fa-triangle-exclamation"></i> ملف غير مكتمل.. جاري الإصلاح.', 'warn');
    showSetupOverlay(modelPath);
    return;
  }

  log(`<i class="fa-solid fa-cube"></i> النموذج المكتشف: ${modelPath}`, 'info');
  setAIStatus('loading', 'جاري تهيئة المحرك...');

  const removeInitListener = api2.onInitStatus((status) => {
    setAIStatus('loading', status);
    log(`<i class="fa-solid fa-gears"></i> ${status}`, 'info');
  });

  const result = await api2.initLLM(modelPath);
  removeInitListener();

  if (result.success) {
    setAIStatus('ready', '<i class="fa-solid fa-circle-check"></i> النموذج جاهز');
    log('<i class="fa-solid fa-circle-check"></i> النموذج جاهز للاستخدام!', 'success');
    // addBotMessage('<i class="fa-solid fa-circle-check"></i> **النموذج جاهز!** أنا الآن مستعد لمساعدتك في كتابة سكريبتات FiveM. اكتب طلبك!');
  } else {
    setAIStatus('error', '<i class="fa-solid fa-circle-exclamation"></i> فشل تحميل النموذج');
    log(`<i class="fa-solid fa-circle-exclamation"></i> خطأ: ${result.error}`, 'error');
    addBotMessage(`<i class="fa-solid fa-triangle-exclamation"></i> **[تنبيه v1.2.7 Master]** لم أتمكن من تحميل النموذج من المسار:\n\`${modelPath}\`\nتأكد من وجود الملف، أو جرب تشغيل البرنامج كمسؤول، أو أغلق أي برامج أخرى تستهلك كرت الشاشة (VRAM).`);
  }
}

// ─── Setup Overlay (Download & Init UI) ────────────────────────────────────
function showSetupOverlay(modelPath) {
  const overlay = document.getElementById('setup-overlay');
  const statusEl = document.getElementById('setup-status');
  const progressEl = document.getElementById('download-progress');
  const downloadBtn = document.getElementById('btn-start-download');

  overlay.style.display = 'flex';
  statusEl.innerHTML = '<i class="fa-solid fa-hourglass-start pulse"></i> جاري تحضير البيئة البرمجية...';
  downloadBtn.style.display = 'none';

  const runSetup = async () => {
    try {
      log('⬇️ بدء تنزيل النموذج المحدث...', 'warn');
      const removeDownListener = api2.onDownloadProgress((progress) => {
        const p = Math.floor(progress * 100);
        progressEl.style.width = `${p}%`;
        statusEl.innerHTML = `<i class="fa-solid fa-cloud-download-alt pulse"></i> جاري تنزيل المحرك... ${p}%`;
      });

      // KEY FIX: Capture the actual path from the main process
      const downResult = await api2.downloadModel(modelPath.replace(/[^\\\/]+$/, ''));
      removeDownListener();

      if (!downResult.success) throw new Error(downResult.error);
      
      const realFilePath = downResult.path; // Exact path where it was saved

      statusEl.innerHTML = '<i class="fa-solid fa-check-circle"></i> اكتمل التحميل! جارٍ التشغيل...';
      progressEl.style.width = '100%';

      const removeInitListener = api2.onInitStatus((status) => {
        statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> تهيئة المحرك: ${status}`;
      });

      const initResult = await api2.initLLM(realFilePath);
      removeInitListener();

      if (initResult.success) {
      statusEl.innerHTML = '🚀 المحرك جاهز للعمل!';
        setTimeout(() => {
          overlay.style.display = 'none';
          initModel(realFilePath); // Pass the real path
        }, 1500);
      } else {
        throw new Error(initResult.error);
      }
    } catch (e) {
      statusEl.textContent = `<i class="fa-solid fa-circle-exclamation"></i> خطأ: ${e.message}`;
      log(`<i class="fa-solid fa-circle-exclamation"></i> خطأ: ${e.message}`, 'error');
      downloadBtn.style.display = 'block';
      downloadBtn.onclick = runSetup;
    }
  };

  runSetup();
}

// Auto-init on load
window.addEventListener('load', () => {
  setTimeout(initModel, 1000);
});
