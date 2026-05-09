import { DEFAULT_LOCALE, Locale, pickLocale } from '../locale'
import { useAppStore } from '../stores/appStore'

export function useLocale() {
  const locale = useAppStore((state) => state.locale)
  const setLocale = useAppStore((state) => state.setLocale)
  const isZh = locale === 'zh-CN'

  return {
    locale,
    isZh,
    setLocale,
    toggleLocale: () => setLocale(isZh ? 'en-US' : DEFAULT_LOCALE),
    text: <T,>(zhValue: T, enValue: T): T => pickLocale(locale, zhValue, enValue),
  }
}

export type { Locale }
