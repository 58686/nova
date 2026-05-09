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
})
