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
  openInBrowser: (html: string) =>
    ipcRenderer.invoke('open-in-browser', html),

  // Settings
  getSettings: () =>
    ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: { dataDir: string | null }) =>
    ipcRenderer.invoke('save-settings', settings),
  selectDataDir: () =>
    ipcRenderer.invoke('select-data-dir'),

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
})
