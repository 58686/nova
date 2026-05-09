export type Locale = 'zh-CN' | 'en-US'

export const DEFAULT_LOCALE: Locale = 'zh-CN'

export function isChineseLocale(locale: Locale): boolean {
  return locale === 'zh-CN'
}

export function pickLocale<T>(locale: Locale, zhValue: T, enValue: T): T {
  return isChineseLocale(locale) ? zhValue : enValue
}

export function formatWithLocale(
  locale: Locale,
  value: Date | number,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'number' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale, options).format(date)
}
