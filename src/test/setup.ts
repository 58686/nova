import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Electron API
global.window = global.window || {}
window.electronAPI = {
  saveFile: vi.fn(),
  loadFile: vi.fn(),
  exportHtml: vi.fn(),
  proxyRequest: vi.fn(),
  proxyStream: vi.fn(),
  openInBrowser: vi.fn(),
  exportPdf: vi.fn(),
  getAppVersion: vi.fn(),
  checkForUpdates: vi.fn(),
  installUpdate: vi.fn(),
  onUpdateAvailable: vi.fn(),
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  selectDataDir: vi.fn(),
  createProjectDir: vi.fn(),
  writeProjectFile: vi.fn(),
  readProjectFile: vi.fn(),
  listProjectDirs: vi.fn(),
  deleteProjectDir: vi.fn(),
  encryptString: vi.fn(),
  decryptString: vi.fn(),
  isEncryptionAvailable: vi.fn(),
} as any

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch
global.fetch = vi.fn()
