import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadSettings, saveSettings, NovaSettings } from './settings'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Nova',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('save-file', async (event, content: string, defaultName?: string) => {
  if (!mainWindow) return { success: false, error: 'Window not available' }

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'design.json',
    filters: [
      { name: 'DevUI Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf-8')
    return { success: true, path: result.filePath }
  }

  return { success: false }
})

ipcMain.handle('load-file', async () => {
  if (!mainWindow) return { success: false, error: 'Window not available' }

  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'DevUI Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8')
    return { success: true, content, path: result.filePaths[0] }
  }

  return { success: false }
})

ipcMain.handle('export-html', async (event, html: string, defaultName?: string) => {
  if (!mainWindow) return { success: false, error: 'Window not available' }

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'design.html',
    filters: [
      { name: 'HTML Files', extensions: ['html'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, html, 'utf-8')
    return { success: true, path: result.filePath }
  }

  return { success: false }
})

// ── URL Validation for Proxy (SSRF protection) ────────────────────────────────

function isUrlSafe(urlString: string): boolean {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return false
  }

  // Only allow https (or http for localhost in dev)
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV === 'development' && url.protocol === 'http:')) {
    return false
  }

  // Block private IP ranges and localhost
  const hostname = url.hostname.toLowerCase()

  // Block localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.startsWith('127.')) {
    return false
  }

  // Block private IPv4 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number)
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) {
      return false
    }
  }

  // Block link-local IPv6
  if (hostname.startsWith('fe80:') || hostname.startsWith('fc00:') || hostname.startsWith('fd00:')) {
    return false
  }

  return true
}

// Streaming proxy — sends chunks back to renderer via sender events while request is in flight
ipcMain.handle(
  'proxy-stream',
  async (
    event,
    payload: {
      id: string
      url: string
      method?: string
      headers?: Record<string, string>
      body?: string
      timeout?: number
    },
  ) => {
    if (!isUrlSafe(payload.url)) {
      return {
        ok: false,
        status: 403,
        body: JSON.stringify({ error: { message: 'Forbidden: URL not allowed by security policy' } }),
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), payload.timeout || 300000)
    try {
      const response = await fetch(payload.url, {
        method: payload.method || 'POST',
        headers: payload.headers,
        body: payload.body,
        signal: controller.signal,
      })
      if (!response.ok || !response.body) {
        const body = await response.text()
        return { ok: false, status: response.status, body }
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (event.sender.isDestroyed()) break
          event.sender.send(`proxy-stream-chunk:${payload.id}`, decoder.decode(value, { stream: true }))
        }
      } finally {
        reader.releaseLock()
      }
      return { ok: true, status: response.status }
    } catch (error: any) {
      return {
        ok: false,
        status: error?.name === 'AbortError' ? 504 : 500,
        body: JSON.stringify({ error: { message: error?.name === 'AbortError' ? 'Request timed out' : error?.message } }),
      }
    } finally {
      clearTimeout(timeoutId)
    }
  },
)

ipcMain.handle(
  'proxy-request',
  async (
    event,
    payload: {
      url: string
      method?: string
      headers?: Record<string, string>
      body?: string
      timeout?: number
    },
  ) => {
    if (!isUrlSafe(payload.url)) {
      return {
        ok: false,
        status: 403,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: { message: 'Forbidden: URL not allowed by security policy' } }),
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), payload.timeout || 300000)

    try {
      const response = await fetch(payload.url, {
        method: payload.method || 'GET',
        headers: payload.headers,
        body: payload.body,
        signal: controller.signal,
      })

      return {
        ok: response.ok,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text(),
      }
    } catch (error: any) {
      return {
        ok: false,
        status: error?.name === 'AbortError' ? 504 : 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error?.name === 'AbortError' ? 'Request timed out' : error?.message || 'Proxy request failed',
          },
        }),
      }
    } finally {
      clearTimeout(timeoutId)
    }
  },
)

// ── Open in browser ───────────────────────────────────────────────────────────

ipcMain.handle('open-in-browser', async (event, html: string) => {
  const tmpFile = path.join(os.tmpdir(), `nova-preview-${Date.now()}.html`)
  try {
    fs.writeFileSync(tmpFile, html, 'utf-8')
    const fileUrl = 'file:///' + tmpFile.replace(/\\/g, '/')
    await shell.openExternal(fileUrl)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to open in browser' }
  }
})

// ── PDF export ────────────────────────────────────────────────────────────────

ipcMain.handle('export-pdf', async (event, html: string, defaultName?: string) => {
  if (!mainWindow) return { success: false, error: 'Window not available' }

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'export.pdf',
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (result.canceled || !result.filePath) return { success: false }

  // Write HTML to a temp file, load it in a hidden window, print to PDF
  const tmpFile = path.join(os.tmpdir(), `nova-pdf-${Date.now()}.html`)
  fs.writeFileSync(tmpFile, html, 'utf-8')

  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  try {
    await pdfWindow.loadFile(tmpFile)
    const data = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      landscape: false,
    })
    fs.writeFileSync(result.filePath, data)
    return { success: true, path: result.filePath }
  } catch (error: any) {
    return { success: false, error: error?.message || 'PDF export failed' }
  } finally {
    pdfWindow.destroy()
    try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }
  }
})

// ── Settings ──────────────────────────────────────────────────────────────────

ipcMain.handle('get-settings', () => {
  return loadSettings()
})

ipcMain.handle('save-settings', (event, settings: NovaSettings) => {
  saveSettings(settings)
  return { success: true }
})

ipcMain.handle('select-data-dir', async () => {
  if (!mainWindow) return null

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: '选择项目数据目录 / Select Project Data Directory',
  })

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

// ── Project file I/O ──────────────────────────────────────────────────────────

ipcMain.handle('create-project-dir', () => {
  const settings = loadSettings()
  if (!settings.dataDir) return null

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dirName = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

  fs.mkdirSync(path.join(settings.dataDir, dirName, 'versions'), { recursive: true })

  return dirName
})

ipcMain.handle('write-project-file', (event, payload: { projectDirName: string; fileName: string; content: string }) => {
  const settings = loadSettings()
  if (!settings.dataDir) return { success: false, error: 'No data directory configured' }

  const filePath = path.join(settings.dataDir, payload.projectDirName, payload.fileName)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, payload.content, 'utf-8')
  return { success: true }
})

ipcMain.handle('read-project-file', (event, payload: { projectDirName: string; fileName: string }) => {
  const settings = loadSettings()
  if (!settings.dataDir) return null

  try {
    return fs.readFileSync(path.join(settings.dataDir, payload.projectDirName, payload.fileName), 'utf-8')
  } catch {
    return null
  }
})

ipcMain.handle('list-project-dirs', () => {
  const settings = loadSettings()
  if (!settings.dataDir) return []

  try {
    const entries = fs.readdirSync(settings.dataDir, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory() && /^\d{14}$/.test(e.name))
      .map((e) => {
        try {
          const meta = JSON.parse(fs.readFileSync(path.join(settings.dataDir!, e.name, 'meta.json'), 'utf-8'))
          return { dirName: e.name, meta }
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.dirName.localeCompare(b.dirName))
  } catch {
    return []
  }
})

ipcMain.handle('delete-project-dir', (event, payload: { projectDirName: string }) => {
  const settings = loadSettings()
  if (!settings.dataDir) return { success: false }

  try {
    fs.rmSync(path.join(settings.dataDir, payload.projectDirName), { recursive: true, force: true })
    return { success: true }
  } catch {
    return { success: false }
  }
})

// ── Auto updater (GitHub API, no native deps) ─────────────────────────────────

const RELEASES_API = 'https://api.github.com/repos/58686/nova/releases/latest'
const RELEASES_PAGE = 'https://github.com/58686/nova/releases/latest'

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

async function checkForUpdatesGitHub() {
  if (!app.isPackaged) return
  try {
    const res = await fetch(RELEASES_API, { headers: { 'User-Agent': 'Nova-App' } })
    if (!res.ok) return
    const release = await res.json() as { tag_name: string; body?: string }
    const latest = release.tag_name.replace(/^v/, '')
    if (compareVersions(latest, app.getVersion()) > 0) {
      mainWindow?.webContents.send('update-available', { version: latest, releaseNotes: release.body ?? '' })
    }
  } catch {
    // network unavailable — silently ignore
  }
}

function setupAutoUpdater() {
  if (!app.isPackaged) return
  checkForUpdatesGitHub()
  setInterval(checkForUpdatesGitHub, 4 * 60 * 60 * 1000)
}

ipcMain.handle('check-for-updates', () => checkForUpdatesGitHub())

ipcMain.handle('install-update', () => {
  shell.openExternal(RELEASES_PAGE)
})

ipcMain.handle('get-app-version', () => app.getVersion())

app.whenReady().then(() => {
  createWindow()
  setupAutoUpdater()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
