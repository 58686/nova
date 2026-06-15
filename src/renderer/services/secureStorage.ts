/**
 * Secure storage wrapper for renderer process.
 * Encrypts sensitive data like API keys before storing in localStorage.
 */

const ENCRYPTION_PREFIX = 'enc:'

/**
 * Check if encryption is available on this system.
 */
export async function isEncryptionAvailable(): Promise<boolean> {
  if (!window.electronAPI?.isEncryptionAvailable) return false
  return window.electronAPI.isEncryptionAvailable()
}

/**
 * Securely store a value in localStorage with encryption.
 * Falls back to plain text if encryption is not available.
 *
 * @param key - localStorage key
 * @param value - value to encrypt and store
 */
export async function secureSetItem(key: string, value: string): Promise<void> {
  if (!window.electronAPI?.encryptString) {
    // Fallback: store plain text if no Electron API
    localStorage.setItem(key, value)
    return
  }

  const result = await window.electronAPI.encryptString(value)
  if (result.success && result.encrypted) {
    localStorage.setItem(key, ENCRYPTION_PREFIX + result.encrypted)
  } else {
    console.warn('Encryption failed, storing in plain text:', result.error)
    localStorage.setItem(key, value)
  }
}

/**
 * Retrieve and decrypt a value from localStorage.
 * Automatically detects encrypted vs plain text.
 *
 * @param key - localStorage key
 * @returns Decrypted value or null if not found
 */
export async function secureGetItem(key: string): Promise<string | null> {
  const stored = localStorage.getItem(key)
  if (!stored) return null

  // Check if this is encrypted data
  if (!stored.startsWith(ENCRYPTION_PREFIX)) {
    // Plain text - return as-is (legacy data)
    return stored
  }

  if (!window.electronAPI?.decryptString) {
    console.error('Cannot decrypt: Electron API not available')
    return null
  }

  const encryptedData = stored.slice(ENCRYPTION_PREFIX.length)
  const result = await window.electronAPI.decryptString(encryptedData)

  if (result.success && result.decrypted) {
    return result.decrypted
  } else {
    console.error('Decryption failed:', result.error)
    return null
  }
}

/**
 * Migrate a plain text localStorage value to encrypted storage.
 * Use this during app initialization to upgrade existing keys.
 *
 * @param key - localStorage key to migrate
 */
export async function migrateToEncrypted(key: string): Promise<boolean> {
  const stored = localStorage.getItem(key)
  if (!stored) return false

  // Already encrypted
  if (stored.startsWith(ENCRYPTION_PREFIX)) {
    return true
  }

  try {
    await secureSetItem(key, stored)
    console.log(`Migrated ${key} to encrypted storage`)
    return true
  } catch (error) {
    console.error(`Failed to migrate ${key}:`, error)
    return false
  }
}

/**
 * Remove a secure item from localStorage.
 */
export function secureRemoveItem(key: string): void {
  localStorage.removeItem(key)
}
