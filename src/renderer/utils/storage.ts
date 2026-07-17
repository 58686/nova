import { Locale, pickLocale } from '../locale'
import { useUIStore } from '../stores/uiStore'

/** Check if a caught error is a localStorage quota-exceeded exception */
export function isQuotaError(e: unknown): boolean {
  return e instanceof DOMException && (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    (e as DOMException & { code?: number }).code === 22
  )
}

/**
 * Safely write to localStorage. On quota-exceeded, displays a user-facing
 * error via the app store. Returns true on success, false on failure.
 */
export function safeSetLocalStorage(key: string, value: string, locale: Locale): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    if (isQuotaError(e)) {
      useUIStore.getState().setError(
        pickLocale(
          locale,
          '存储空间不足，内容可能未完全保存，建议导出备份。',
          'Storage quota exceeded — some changes may not be saved. Export to back up your work.',
        ),
      )
    } else {
      console.error(`Failed to save to localStorage (key: ${key}):`, e)
    }
    return false
  }
}
