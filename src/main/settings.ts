import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface NovaSettings {
  dataDir: string | null
}

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'nova-settings.json')
}

export function loadSettings(): NovaSettings {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { dataDir: null }
  }
}

export function saveSettings(settings: NovaSettings): void {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}
