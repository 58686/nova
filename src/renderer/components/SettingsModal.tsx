import { useState, useCallback } from 'react'
import { useLocale } from '../hooks/useLocale'
import { useSettingsStore } from '../stores/settingsStore'
import { SHORTCUTS } from '../hooks/useKeyboard'

const APP_VERSION = '0.2.6'

function getStorageUsage(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!
    total += key.length + (localStorage.getItem(key)?.length ?? 0)
  }
  return total
}

const STORAGE_QUOTA = 5 * 1024 * 1024 // ~5 MB estimated

interface SettingsModalProps {
  onClose: () => void
}

type Tab = 'general' | 'storage' | 'shortcuts'

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { text, locale, setLocale } = useLocale()
  const { dataDir, selectAndSave, clearDataDir } = useSettingsStore()

  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [storageUsed, setStorageUsed] = useState(() => getStorageUsage())
  const [clearConfirm, setClearConfirm] = useState(false)

  const refreshStorage = useCallback(() => {
    setStorageUsed(getStorageUsage())
    setClearConfirm(false)
  }, [])

  const handleClearData = useCallback(() => {
    if (!clearConfirm) {
      setClearConfirm(true)
      return
    }
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('nova-')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    window.location.reload()
  }, [clearConfirm])

  const usedKB = (storageUsed / 1024).toFixed(1)
  const usedPct = Math.min(100, (storageUsed / STORAGE_QUOTA) * 100)
  const barColor =
    usedPct > 80 ? 'var(--danger)' : usedPct > 50 ? 'var(--warning)' : 'var(--success)'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: text('通用', 'General') },
    { id: 'storage', label: text('存储', 'Storage') },
    { id: 'shortcuts', label: text('快捷键', 'Shortcuts') },
  ]

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
      style={{ background: 'rgba(52, 43, 40, 0.28)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="shell-panel animate-scale-in flex w-full max-w-xl flex-col overflow-hidden rounded-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <p
              className="text-xs uppercase tracking-[0.18em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {text('系统', 'System')}
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {text('设置', 'Settings')}
            </h2>
          </div>
          <button
            aria-label={text('关闭', 'Close')}
            className="btn-icon"
            onClick={onClose}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 px-6 pt-4 pb-0"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 text-sm font-medium rounded-full transition-all"
                style={
                  isActive
                    ? {
                        background: 'rgba(255,255,255,0.88)',
                        color: 'var(--text-primary)',
                        boxShadow: '0 2px 8px rgba(119,90,72,0.10)',
                      }
                    : {
                        color: 'var(--text-muted)',
                        background: 'transparent',
                      }
                }
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: '60vh' }}>

          {/* ── Tab 1: General ── */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* App identity */}
              <div
                className="rounded-[18px] px-5 py-4 flex items-center gap-4"
                style={{ background: 'var(--bg-accent-soft)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-[14px] flex items-center justify-center"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3L4 7v5c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7l-8-4z"
                      fill="rgba(255,255,255,0.9)"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Nova · AI {text('页面生成器', 'Page Generator')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    v{APP_VERSION}
                  </p>
                </div>
              </div>

              {/* Language selector */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {text('语言', 'Language')}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn flex-1"
                    onClick={() => setLocale('zh-CN')}
                    style={
                      locale === 'zh-CN'
                        ? { background: 'var(--gradient-brand)', color: 'var(--text-inverse)', boxShadow: 'var(--shadow-sm)' }
                        : { background: 'rgba(255,255,255,0.44)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }
                    }
                  >
                    中文
                  </button>
                  <button
                    type="button"
                    className="btn flex-1"
                    onClick={() => setLocale('en-US')}
                    style={
                      locale === 'en-US'
                        ? { background: 'var(--gradient-brand)', color: 'var(--text-inverse)', boxShadow: 'var(--shadow-sm)' }
                        : { background: 'rgba(255,255,255,0.44)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }
                    }
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Storage ── */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              {/* localStorage usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {text('本地存储', 'Local Storage')}
                  </p>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={refreshStorage}
                    title={text('刷新', 'Refresh')}
                    style={{ width: 'auto', padding: '0 8px', height: 28, fontSize: 11, color: 'var(--text-muted)' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {text('刷新', 'Refresh')}
                  </button>
                </div>
                <div
                  className="rounded-[14px] p-3 space-y-2"
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>{text('已使用', 'Used')}: {usedKB} KB</span>
                    <span>{text('估算上限', 'Est. quota')}: ~5 MB</span>
                  </div>
                  {/* Progress bar */}
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--border-subtle)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${usedPct}%`, background: barColor }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {usedPct.toFixed(1)}% {text('已用', 'used')}
                  </p>
                </div>
              </div>

              {/* Data directory */}
              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {text('项目数据目录', 'Project Data Directory')}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {text(
                      '每个新项目将在此目录下自动创建以时间（年月日时分秒）命名的子文件夹，统一存储页面 HTML、版本历史和对话记录。',
                      'Each new project automatically creates a timestamped subfolder here, storing page HTML, version history, and conversation logs.',
                    )}
                  </p>
                </div>

                {dataDir ? (
                  <div className="space-y-2">
                    <div
                      className="rounded-[14px] px-3 py-2.5 font-mono text-xs break-all"
                      style={{
                        background: 'rgba(255,255,255,0.5)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {dataDir}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn flex-1" onClick={selectAndSave}>
                        {text('更换目录', 'Change Directory')}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={clearDataDir}
                        style={{ color: 'var(--danger)' }}
                      >
                        {text('清除', 'Clear')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      className="rounded-[14px] border-2 border-dashed px-4 py-3 text-sm text-center"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      {text('未设置数据目录', 'No directory configured')}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary w-full"
                      onClick={selectAndSave}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z"
                        />
                      </svg>
                      {text('选择目录', 'Choose Directory')}
                    </button>
                  </div>
                )}
              </section>

              {/* Info note */}
              <div
                className="rounded-[14px] px-4 py-3 text-xs leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.3)', color: 'var(--text-muted)' }}
              >
                {text(
                  'AI 配置和 API 密钥保存在浏览器本地存储中，不受此设置影响。未设置数据目录时，项目数据仅存储在本地浏览器存储中。',
                  'AI configuration and API keys are stored in browser local storage and are not affected by this setting. Without a data directory, project data is stored only in browser local storage.',
                )}
              </div>

              {/* Clear all data */}
              <div className="space-y-2">
                {clearConfirm && (
                  <div
                    className="rounded-[14px] px-4 py-3 text-xs leading-relaxed"
                    style={{
                      background: 'rgba(203, 111, 111, 0.10)',
                      border: '1px solid rgba(203,111,111,0.25)',
                      color: 'var(--danger)',
                    }}
                  >
                    {text(
                      '警告：此操作将清除所有 Nova 数据（项目、版本、AI 配置），且不可恢复。再次点击确认。',
                      'Warning: This will permanently delete all Nova data (projects, versions, AI config). This cannot be undone. Click again to confirm.',
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className="btn w-full"
                  onClick={handleClearData}
                  style={{
                    color: 'var(--danger)',
                    border: '1px solid rgba(203,111,111,0.30)',
                    background: clearConfirm ? 'rgba(203,111,111,0.12)' : 'rgba(255,255,255,0.44)',
                  }}
                >
                  {clearConfirm
                    ? text('确认清除所有数据', 'Confirm Clear All Data')
                    : text('清除所有数据', 'Clear All Data')}
                </button>
              </div>
            </div>
          )}

          {/* ── Tab 3: Shortcuts ── */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {text(
                  'Mac 上 Ctrl 键对应 ⌘ Command。',
                  'On Mac, Ctrl corresponds to ⌘ Command.',
                )}
              </p>
              <div className="space-y-1">
                {SHORTCUTS.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-[14px] px-4 py-3"
                    style={{
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.28)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          <kbd
                            className="inline-flex items-center justify-center rounded-[8px] px-2 py-0.5 text-xs font-semibold font-mono"
                            style={{
                              background: 'rgba(255,255,255,0.88)',
                              border: '1px solid var(--border-strong)',
                              color: 'var(--text-primary)',
                              boxShadow: '0 1px 3px rgba(119,90,72,0.12)',
                              minWidth: 28,
                            }}
                          >
                            {key}
                          </kbd>
                          {ki < shortcut.keys.length - 1 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
