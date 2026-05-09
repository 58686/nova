import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../hooks/useLocale'
import { useAIConfigStore } from '../stores/aiConfigStore'
import { useAppStore } from '../stores/appStore'

interface HeaderProps {
  activePanel?: 'preview' | 'versions'
  onToggleVersions?: () => void
  onOpenAIConfig?: () => void
}

export default function Header({ activePanel = 'preview', onToggleVersions, onOpenAIConfig }: HeaderProps) {
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
    <header className="shell-panel flex h-[84px] shrink-0 items-center justify-between rounded-[28px] px-4 md:px-5">
      <div className="flex min-w-0 items-center gap-4">
        <button className="btn-icon shrink-0" onClick={toggleSidebar} title={text('切换侧边栏', 'Toggle sidebar')}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
            style={{ background: 'var(--gradient-brand)', boxShadow: 'var(--shadow-md)' }}
          >
            <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
              <path d="M4 4h4v16H4V4Zm4 0h4l6 16h-4L9.5 8.5 8 20H4L8 4Z" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-gradient">Nova</h1>
              <span className="badge badge-accent">{text('专注构建', 'Focused Builder')}</span>
            </div>
            <p className="truncate text-sm" style={{ color: 'var(--text-secondary)' }}>
              {currentProject?.name || text('项目工作区，集中管理提示词、预览与版本。', 'Project workspace for prompts, preview, and version control.')}
            </p>
          </div>
        </div>

        {currentProject && (
          <>
            <div className="hidden h-10 w-px md:block" style={{ background: 'var(--border-subtle)' }} />
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
