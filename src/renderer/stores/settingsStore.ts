import { create } from 'zustand'

interface SettingsState {
  dataDir: string | null
  isLoaded: boolean
  load: () => Promise<void>
  selectAndSave: () => Promise<boolean>
  clearDataDir: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  dataDir: null,
  isLoaded: false,

  load: async () => {
    if (!window.electronAPI?.getSettings) {
      set({ isLoaded: true })
      return
    }
    try {
      const settings = await window.electronAPI.getSettings()
      set({ dataDir: settings?.dataDir ?? null, isLoaded: true })
    } catch {
      set({ isLoaded: true })
    }
  },

  selectAndSave: async () => {
    if (!window.electronAPI?.selectDataDir) return false
    const dirPath = await window.electronAPI.selectDataDir()
    if (!dirPath) return false
    await window.electronAPI.saveSettings?.({ dataDir: dirPath })
    set({ dataDir: dirPath })
    return true
  },

  clearDataDir: async () => {
    await window.electronAPI?.saveSettings?.({ dataDir: null })
    set({ dataDir: null })
  },
}))
