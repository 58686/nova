import { safeStorage } from 'electron'

/**
 * Secure storage service for encrypting sensitive data like API keys.
 * Uses Electron's safeStorage API which leverages OS-level encryption.
 */

export interface EncryptedData {
  encrypted: string
  version: number // For future migration support
}

const ENCRYPTION_VERSION = 1

/**
 * Encrypt a string using OS-level encryption.
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted data with version metadata
 */
export function encryptString(plaintext: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('Encryption not available on this system, storing in plain text')
    return JSON.stringify({ encrypted: plaintext, version: 0 })
  }

  const buffer = safeStorage.encryptString(plaintext)
  const encrypted = buffer.toString('base64')

  const data: EncryptedData = {
    encrypted,
    version: ENCRYPTION_VERSION,
  }

  return JSON.stringify(data)
}

/**
 * Decrypt a previously encrypted string.
 * @param encryptedData - JSON string from encryptString()
 * @returns Decrypted plaintext
 */
export function decryptString(encryptedData: string): string {
  try {
    const data: EncryptedData = JSON.parse(encryptedData)

    // Version 0 = unencrypted (fallback mode)
    if (data.version === 0) {
      return data.encrypted
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Cannot decrypt: encryption not available on this system')
    }

    const buffer = Buffer.from(data.encrypted, 'base64')
    return safeStorage.decryptString(buffer)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Check if encryption is available on this system.
 */
export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}
