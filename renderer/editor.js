// ═══════════════════════════════════════════════════════════════════════════
//  FiveM Script Agent — editor.js (CodeMirror integration)
// ═══════════════════════════════════════════════════════════════════════════

let cmEditor = null;

function initEditor() {
  const el = document.getElementById('cm-editor');
  cmEditor = CodeMirror(el, {
    value: '',
    theme: 'dracula',
    lineNumbers: true,
    mode: 'lua',
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    autoCloseBrackets: true,
    matchBrackets: true,
    styleActiveLine: true,
    lineWrapping: false,
    extraKeys: {
      'Ctrl-/': 'toggleComment',
      'Ctrl-S': () => window.saveCurrentFile && window.saveCurrentFile(),
      'Tab': (cm) => {
        if (cm.somethingSelected()) cm.indentSelection('add');
        else cm.replaceSelection('    ', 'end');
      },
    },
  });

  // Cursor position in status bar
  cmEditor.on('cursorActivity', () => {
    const cur = cmEditor.getCursor();
    document.getElementById('sb-cursor').textContent = `سطر ${cur.line + 1}، عمود ${cur.ch + 1}`;
  });

  // Mark unsaved on change
  cmEditor.on('change', () => {
    if (window.markUnsaved) window.markUnsaved();
  });
}

// Called transitioning to a new file tab
window.setEditorContent = (content, mode = 'lua') => {
  if (!cmEditor) initEditor();
  cmEditor.setValue(content || '');
  cmEditor.setOption('mode', mode);
  cmEditor.clearHistory();
  setTimeout(() => cmEditor.refresh(), 50);
};

window.getEditorContent = () => {
  return cmEditor ? cmEditor.getValue() : '';
};

// Insert text at cursor (used by AI "Apply" button)
window.insertToEditor = (text) => {
  if (!cmEditor) return;
  const cur = cmEditor.getCursor();
  cmEditor.replaceRange(text, cur);
};

// Replace entire editor content
window.replaceEditorContent = (text) => {
  if (!cmEditor) return;
  cmEditor.setValue(text);
  if (window.markUnsaved) window.markUnsaved();
};

// Init on load
initEditor();
log('📝 محرر الكود جاهز', 'success');
