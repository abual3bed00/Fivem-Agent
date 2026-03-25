const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // File operations
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  createFile: (path, content) => ipcRenderer.invoke('create-file', path, content),
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
  moveFile: (src, dest) => ipcRenderer.invoke('move-file', src, dest),
  renameFile: (old, nw) => ipcRenderer.invoke('rename-file', old, nw),
  listDir: (path) => ipcRenderer.invoke('list-dir', path),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  openProgram: (program) => ipcRenderer.invoke('open-program', program),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  saveFileDialog: (name) => ipcRenderer.invoke('save-file-dialog', name),
  checkPath: (path) => ipcRenderer.invoke('check-path-exists', path),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkAppUpdate: () => ipcRenderer.invoke('check-app-update'),
  downloadAppUpdate: (payload) => ipcRenderer.invoke('download-app-update', payload),
  installAppUpdate: (installerPath) => ipcRenderer.invoke('install-app-update', installerPath),

  // LLM / AI
  initLLM: (modelPath) => ipcRenderer.invoke('init-llm', modelPath),
  chat: (message) => ipcRenderer.invoke('llm-chat', message),
  resetChat: () => ipcRenderer.invoke('llm-reset'),
  onToken: (cb) => ipcRenderer.on('llm-token', (_, token) => cb(token)),
  removeTokenListener: () => ipcRenderer.removeAllListeners('llm-token'),
  downloadModel: (folderPath) => ipcRenderer.invoke('download-model', folderPath),
  onDownloadProgress: (cb) => {
    const listener = (_, progress) => cb(progress);
    ipcRenderer.on('download-progress', listener);
    return () => ipcRenderer.removeListener('download-progress', listener);
  },
  onInitStatus: (cb) => {
    const listener = (_, status) => cb(status);
    ipcRenderer.on('init-status', listener);
    return () => ipcRenderer.removeListener('init-status', listener);
  },
  onAppUpdateProgress: (cb) => {
    const listener = (_, progress) => cb(progress);
    ipcRenderer.on('app-update-progress', listener);
    return () => ipcRenderer.removeListener('app-update-progress', listener);
  },
  removeAppUpdateProgressListeners: () => ipcRenderer.removeAllListeners('app-update-progress'),
});
