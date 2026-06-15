import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content: string, defaultName?: string) =>
    ipcRenderer.invoke('save-file', content, defaultName),
  loadFile: () =>
    ipcRenderer.invoke('load-file'),
  exportHtml: (html: string, defaultName?: string) =>
    ipcRenderer.invoke('export-html', html, defaultName),
  proxyRequest: (payload: {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: string
    timeout?: number
  }) => ipcRenderer.invoke('proxy-request', payload),
  proxyStream: (
    payload: { id: string; url: string; method?: string; headers?: Record<string, string>; body?: string; timeout?: number },
    onChunk: (chunk: string) => void,
  ) => {
    const channel = `proxy-stream-chunk:${payload.id}`
    const listener = (_: Electron.IpcRendererEvent, chunk: string) => onChunk(chunk)
    ipcRenderer.on(channel, listener)
    return ipcRenderer.invoke('proxy-stream', payload).finally(() => {
      ipcRenderer.removeListener(channel, listener)
    })
  },
  openInBrowser: (html: string) =>
    ipcRenderer.invoke('open-in-browser', html),
  exportPdf: (html: string, defaultName?: string) =>
    ipcRenderer.invoke('export-pdf', html, defaultName),

  // Settings
  getSettings: () =>
    ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: { dataDir: string | null }) =>
    ipcRenderer.invoke('save-settings', settings),
  selectDataDir: () =>
    ipcRenderer.invoke('select-data-dir'),

  // Auto updater
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (cb: (info: { version: string }) => void) => {
    ipcRenderer.on('update-available', (_, info) => cb(info))
  },

  // Project file I/O
  createProjectDir: () =>
    ipcRenderer.invoke('create-project-dir'),
  writeProjectFile: (payload: { projectDirName: string; fileName: string; content: string }) =>
    ipcRenderer.invoke('write-project-file', payload),
  readProjectFile: (payload: { projectDirName: string; fileName: string }) =>
    ipcRenderer.invoke('read-project-file', payload),
  listProjectDirs: () =>
    ipcRenderer.invoke('list-project-dirs'),
  deleteProjectDir: (payload: { projectDirName: string }) =>
    ipcRenderer.invoke('delete-project-dir', payload),

  // Secure storage (encryption)
  encryptString: (plaintext: string) =>
    ipcRenderer.invoke('encrypt-string', plaintext),
  decryptString: (encryptedData: string) =>
    ipcRenderer.invoke('decrypt-string', encryptedData),
  isEncryptionAvailable: () =>
    ipcRenderer.invoke('is-encryption-available'),
})
