import { useLocale } from '../hooks/useLocale'
import { useSettingsStore } from '../stores/settingsStore'

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { text } = useLocale()
  const { dataDir, selectAndSave, clearDataDir } = useSettingsStore()

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
      style={{ background: 'rgba(52, 43, 40, 0.28)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="shell-panel animate-scale-in flex w-full max-w-lg flex-col overflow-hidden rounded-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              {text('系统', 'System')}
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {text('数据存储设置', 'Data Storage')}
            </h2>
          </div>
          <button
            aria-label={text('关闭', 'Close')}
            className="btn-icon"
            onClick={onClose}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {text('项目数据目录', 'Project Data Directory')}
              </h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {text(
                  '每个新项目将在此目录下自动创建以时间（年月日时分秒）命名的子文件夹，统一存储页面 HTML、版本历史和对话记录。',
                  'Each new project automatically creates a timestamped subfolder (YYYYMMDDHHMMSS) here, storing page HTML, version history, and conversation logs.',
                )}
              </p>
            </div>

            {dataDir ? (
              <div className="space-y-2">
                <div
                  className="rounded-[14px] px-3 py-2.5 font-mono text-xs break-all"
                  style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                >
                  {dataDir}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn flex-1"
                    onClick={selectAndSave}
                  >
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z" />
                  </svg>
                  {text('选择目录', 'Choose Directory')}
                </button>
              </div>
            )}
          </section>

          <div
            className="rounded-[14px] px-4 py-3 text-xs leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.3)', color: 'var(--text-muted)' }}
          >
            {text(
              'AI 配置和 API 密钥保存在浏览器本地存储中，不受此设置影响。未设置数据目录时，项目数据仅存储在本地浏览器存储中。',
              'AI configuration and API keys are stored in browser local storage and are not affected by this setting. Without a data directory, project data is stored only in browser local storage.',
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
