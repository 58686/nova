import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../hooks/useLocale'
import { useAIConfigStore } from '../stores/aiConfigStore'
import { useAppStore } from '../stores/appStore'

type UpdateState =
  | { status: 'idle' }
  | { status: 'available'; version: string }
  | { status: 'downloading'; percent: number }
  | { status: 'ready'; version: string }

function useUpdater() {
  const [update, setUpdate] = useState<UpdateState>({ status: 'idle' })
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return
    api.getAppVersion().then(setAppVersion).catch(() => {})
    api.onUpdateAvailable?.((info) => setUpdate({ status: 'available', version: info.version }))
    api.onUpdateProgress?.((info) => setUpdate({ status: 'downloading', percent: info.percent }))
    api.onUpdateDownloaded?.((info) => setUpdate({ status: 'ready', version: info.version }))
  }, [])

  return {
    update,
    appVersion,
    install: () => window.electronAPI?.installUpdate(),
    check: () => window.electronAPI?.checkForUpdates(),
  }
}

interface HeaderProps {
  activePanel?: 'preview' | 'versions' | 'canvas'
  onToggleVersions?: () => void
  onToggleCanvas?: () => void
  onOpenAIConfig?: () => void
  onOpenSettings?: () => void
}

export default function Header({ activePanel = 'preview', onToggleVersions, onToggleCanvas, onOpenAIConfig, onOpenSettings }: HeaderProps) {
  const {
    currentProject,
    generatedCode,
    projects,
    setCurrentProject,
    toggleSidebar,
    isPreviewFocused,
    togglePreviewFocus,
  } = useAppStore()
  const { presets, activePresetId, getActiveConfig } = useAIConfigStore()
  const { locale, text, toggleLocale } = useLocale()

  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const projectMenuRef = useRef<HTMLDivElement>(null)

  const activeConfig = getActiveConfig()
  const activePreset = presets.find((preset) => preset.id === activePresetId)
  const hasGeneratedCode = generatedCode.trim().length > 0
  const { update, appVersion, install, check } = useUpdater()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="shell-panel relative z-[50] flex h-[56px] shrink-0 items-center justify-between rounded-[22px] px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button className="btn-icon shrink-0" onClick={toggleSidebar} title={text('切换侧边栏', 'Toggle sidebar')}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </button>

        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px]"
            style={{ background: 'var(--gradient-brand)', boxShadow: 'var(--shadow-sm)' }}
          >
            <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
              <path d="M4 4h4v16H4V4Zm4 0h4l6 16h-4L9.5 8.5 8 20H4L8 4Z" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-[-0.02em] text-gradient">Nova</h1>
            <span className="badge badge-accent">{text('专注构建', 'Focused Builder')}</span>
          </div>
        </div>

        {currentProject && (
          <>
            <div className="hidden h-6 w-px md:block" style={{ background: 'var(--border-subtle)' }} />
            <div ref={projectMenuRef} className="relative hidden min-w-0 md:block">
              <button className="toolbar-chip max-w-[280px]" onClick={() => setShowProjectMenu((prev) => !prev)}>
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z" />
                </svg>
                <span className="truncate">{currentProject.name}</span>
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m19 9-7 7-7-7" />
                </svg>
              </button>

              {showProjectMenu && (
                <div
                  className="animate-slide-up absolute left-0 top-full z-[40] mt-3 w-80 rounded-[22px] border p-2"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
                >
                  <div className="px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                      {text('最近项目', 'Recent Projects')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {projects.slice(0, 8).map((project) => {
                      const isActive = project.id === currentProject.id

                      return (
                        <button
                          key={project.id}
                          className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-all"
                          onClick={() => {
                            setCurrentProject(project)
                            setShowProjectMenu(false)
                          }}
                          style={{
                            background: isActive ? 'var(--bg-accent-soft)' : 'transparent',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{project.name}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(project.updatedAt)}
                            </div>
                          </div>
                          {isActive && <span className="badge badge-accent">{text('当前', 'Active')}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-2 xl:flex">
          <button
            className="toolbar-chip"
            data-active={isPreviewFocused}
            disabled={!hasGeneratedCode}
            onClick={togglePreviewFocus}
            title={text('聚焦输出页面', 'Focus the output page')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 3H5a2 2 0 0 0-2 2v3m16 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M5 14v3a2 2 0 0 0 2 2h3" />
            </svg>
            <span>{isPreviewFocused ? text('退出聚焦', 'Exit Focus') : text('聚焦预览', 'Focus Preview')}</span>
          </button>

          <button className="toolbar-chip" data-active={activePanel === 'canvas'} onClick={onToggleCanvas}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            <span>{text('画布', 'Canvas')}</span>
          </button>

          <button className="toolbar-chip" data-active={activePanel === 'versions'} onClick={onToggleVersions}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{text('版本', 'Versions')}</span>
          </button>
        </div>

        <button className="toolbar-chip" onClick={toggleLocale} title={text('切换语言', 'Switch language')}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5h8m-4 0v14m-4-4h8m5-8h3m-1.5 0c0 3.2-1.1 5.8-3.5 8m0 0c-1.1-1.2-1.9-2.5-2.6-4m2.6 4a13.9 13.9 0 0 0 4.1 2.5" />
          </svg>
          <span>{text('语言', 'Language')}</span>
          <span className="badge badge-accent px-2 py-0.5">{locale === 'zh-CN' ? '中文' : 'EN'}</span>
        </button>

        <div
          className="hidden rounded-full px-3 py-2 text-xs sm:block"
          style={{ background: 'rgba(255,255,255,0.48)', color: 'var(--text-secondary)' }}
        >
          {generatedCode ? text('页面已就绪', 'Page ready') : text('等待生成', 'Waiting for generation')}
        </div>

        <button
          className="btn-icon"
          onClick={onOpenSettings}
          title={text('数据存储设置', 'Data Storage Settings')}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z" />
          </svg>
        </button>

        {/* Version + update badge */}
        {update.status === 'idle' && appVersion && (
          <button
            className="hidden rounded-full px-2.5 py-1 text-[11px] font-medium sm:block"
            style={{ background: 'rgba(255,255,255,0.35)', color: 'var(--text-muted)' }}
            onClick={check}
            title={text('检查更新', 'Check for updates')}
          >
            v{appVersion}
          </button>
        )}

        {update.status === 'available' && (
          <button
            className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold sm:flex"
            style={{ background: 'rgba(200,121,65,0.15)', color: 'var(--text-accent)' }}
            onClick={install}
            title={text('点击前往下载页面', 'Click to open download page')}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            {text(`发现新版本 v${update.version}`, `v${update.version} available`)}
          </button>
        )}

        {update.status === 'downloading' && (
          <div
            className="hidden items-center gap-2 rounded-full px-3 py-1 text-[11px] sm:flex"
            style={{ background: 'rgba(255,255,255,0.35)', color: 'var(--text-secondary)' }}
          >
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {text(`下载中 ${update.percent}%`, `Downloading ${update.percent}%`)}
          </div>
        )}

        {update.status === 'ready' && (
          <button
            className="hidden animate-pulse items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold sm:flex"
            style={{ background: 'var(--gradient-brand)', color: '#fff' }}
            onClick={install}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {text(`安装 v${update.version} 并重启`, `Install v${update.version} & restart`)}
          </button>
        )}

        <button className="btn btn-primary relative" onClick={onOpenAIConfig}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span className="max-w-[150px] truncate">{activePreset?.name || text('AI 配置', 'AI Config')}</span>
          {activeConfig?.apiKey && (
            <span
              className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
              style={{ background: 'rgba(255,250,246,0.95)', boxShadow: '0 0 0 3px rgba(255,250,246,0.18)' }}
            />
          )}
        </button>
      </div>
    </header>
  )
}
