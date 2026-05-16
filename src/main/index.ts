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
  const result = await dialog.showSaveDialog(mainWindow!, {
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
  const result = await dialog.showOpenDialog(mainWindow!, {
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
  const result = await dialog.showSaveDialog(mainWindow!, {
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
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), payload.timeout || 60000)

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

// ── Settings ──────────────────────────────────────────────────────────────────

ipcMain.handle('get-settings', () => {
  return loadSettings()
})

ipcMain.handle('save-settings', (event, settings: NovaSettings) => {
  saveSettings(settings)
  return { success: true }
})

ipcMain.handle('select-data-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
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

app.whenReady().then(createWindow)

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
