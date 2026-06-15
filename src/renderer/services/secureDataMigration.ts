import { secureSetItem, secureGetItem, migrateToEncrypted } from '../services/secureStorage'
import { AIConfigPreset } from '../stores/aiConfigStore'

const SECURE_KEYS = [
  'nova-ai-presets', // Contains API keys in preset configs
]

/**
 * Migrate sensitive data to encrypted storage.
 * Run this on app initialization.
 */
export async function migrateSecureData(): Promise<void> {
  console.log('Starting secure data migration...')

  let migratedCount = 0
  for (const key of SECURE_KEYS) {
    const success = await migrateToEncrypted(key)
    if (success) migratedCount++
  }

  console.log(`Migrated ${migratedCount}/${SECURE_KEYS.length} keys to encrypted storage`)
}

/**
 * Save AI presets with encrypted API keys.
 */
export async function saveSecurePresets(presets: AIConfigPreset[]): Promise<void> {
  const serialized = JSON.stringify(presets)
  await secureSetItem('nova-ai-presets', serialized)
}

/**
 * Load AI presets and decrypt API keys.
 */
export async function loadSecurePresets(): Promise<AIConfigPreset[] | null> {
  const serialized = await secureGetItem('nova-ai-presets')
  if (!serialized) return null

  try {
    return JSON.parse(serialized)
  } catch (error) {
    console.error('Failed to parse presets:', error)
    return null
  }
}
