import { useMemo } from 'react'
import { useLocale } from '../../hooks/useLocale'
import {
  DESIGN_SYSTEMS,
  OUTPUT_LANGUAGES,
  PAGE_TYPE_CONFIGS,
} from '../../services/pageTypes'
import {
  BriefFormState,
  DEFAULT_BRIEF_FORM,
} from '../../stores/appStore'

interface BriefFormPanelProps {
  briefOpen: boolean
  setBriefOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  briefTab: 'content' | 'style'
  setBriefTab: (tab: 'content' | 'style') => void
  briefForm: BriefFormState
  setBriefForm: (form: Partial<BriefFormState>) => void
  isGenerating: boolean
  onShowTemplates: () => void
  onGenerate: () => void
}

export default function BriefFormPanel({
  briefOpen,
  setBriefOpen,
  briefTab,
  setBriefTab,
  briefForm,
  setBriefForm,
  isGenerating,
  onShowTemplates,
  onGenerate,
}: BriefFormPanelProps) {
  const { locale, text } = useLocale()

  const isZh = locale === 'zh-CN'
  const pageTypeConfigs = useMemo(() => PAGE_TYPE_CONFIGS(isZh), [isZh])
  const activeTypeConfig = useMemo(
    () => pageTypeConfigs.find(c => c.id === briefForm.pageType) || pageTypeConfigs[0],
    [briefForm.pageType, pageTypeConfigs],
  )
  const directionPresets = activeTypeConfig.directions

  return (
    <div className="panel-card rounded-[24px] overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setBriefOpen((prev) => !prev)}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
            {text('页面 Brief', 'Page Brief')}
          </p>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {briefOpen ? text('收起', 'Collapse') : text('展开 Brief', 'Expand Brief')}
          </p>
        </div>
        <svg
          className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--text-muted)',
            transform: briefOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {briefOpen && (
        <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Top row: Templates + Reset */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <button
              className="rounded-full px-3 py-1 text-xs flex items-center gap-1.5 transition-colors"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              onClick={onShowTemplates}
              type="button"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              {text('模板库', 'Templates')}
            </button>
            <button
              className="rounded-full px-3 py-1 text-xs"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              onClick={() => setBriefForm(DEFAULT_BRIEF_FORM)}
              type="button"
            >
              {text('重置', 'Reset')}
            </button>
          </div>

          {/* Tab bar */}
          <div className="mx-4 mb-3 flex gap-1 rounded-[12px] p-[3px]" style={{ background: 'var(--bg-hover)' }}>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-1.5 text-xs font-medium transition-all"
              onClick={() => setBriefTab('content')}
              style={{
                background: briefTab === 'content' ? 'rgba(255,255,255,0.9)' : 'transparent',
                color: briefTab === 'content' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: briefTab === 'content' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {text('内容', 'Content')}
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-1.5 text-xs font-medium transition-all"
              onClick={() => setBriefTab('style')}
              style={{
                background: briefTab === 'style' ? 'rgba(255,255,255,0.9)' : 'transparent',
                color: briefTab === 'style' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: briefTab === 'style' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              {text('样式', 'Style')}
              {((briefForm.designSystemId && briefForm.designSystemId !== 'default') || briefForm.darkMode) && (
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          </div>

          {/* ── Content Tab ── */}
          {briefTab === 'content' && (
            <div className="px-4 pb-4 space-y-3">
              {/* Page type selector */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('页面类型', 'Page Type')}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {pageTypeConfigs.map((typeConfig) => {
                    const isActiveType = typeConfig.id === briefForm.pageType
                    return (
                      <button
                        key={typeConfig.id}
                        type="button"
                        className="rounded-[12px] border px-1 py-2 text-center text-xs transition-all"
                        onClick={() => {
                          const newDefault = typeConfig.directions[0]
                          const oldDefault = activeTypeConfig.defaultSections
                          const shouldResetSections = !briefForm.sections.trim() || briefForm.sections === oldDefault
                          setBriefForm({
                            pageType: typeConfig.id,
                            directionId: newDefault.id,
                            ...(shouldResetSections ? { sections: typeConfig.defaultSections } : {}),
                          })
                        }}
                        style={{
                          background: isActiveType ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.4)',
                          borderColor: isActiveType ? 'var(--border-accent)' : 'var(--border-subtle)',
                          boxShadow: isActiveType ? 'var(--shadow-sm)' : 'none',
                          color: isActiveType ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                      >
                        <div className="text-base leading-none mb-1">{typeConfig.icon}</div>
                        <div className="font-medium leading-tight" style={{ fontSize: 10 }}>
                          {isZh ? typeConfig.label : typeConfig.labelEn}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dynamic brief fields */}
              {activeTypeConfig.briefFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                    {isZh ? field.label : field.labelEn}
                  </label>
                  {field.multiline ? (
                    <textarea
                      className="input min-h-[72px] px-3 py-2"
                      value={briefForm[field.key] as string}
                      onChange={(e) => setBriefForm({ [field.key]: e.target.value } as Partial<BriefFormState>)}
                      placeholder={isZh ? field.placeholder : field.placeholderEn}
                    />
                  ) : (
                    <input
                      className="input h-10 px-3"
                      value={briefForm[field.key] as string}
                      onChange={(e) => setBriefForm({ [field.key]: e.target.value } as Partial<BriefFormState>)}
                      placeholder={isZh ? field.placeholder : field.placeholderEn}
                    />
                  )}
                </div>
              ))}

              {/* Language + Dark mode */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                    {text('内容语言', 'Content Lang')}
                  </label>
                  <select
                    className="input h-9 px-2 text-xs"
                    value={briefForm.outputLang}
                    onChange={(e) => setBriefForm({ outputLang: e.target.value })}
                  >
                    {OUTPUT_LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                    {text('暗色', 'Dark')}
                  </label>
                  <button
                    type="button"
                    className="flex h-9 w-16 items-center justify-center rounded-[10px] border text-xs font-medium transition-all"
                    onClick={() => setBriefForm({ darkMode: !briefForm.darkMode })}
                    style={{
                      background: briefForm.darkMode ? '#1e293b' : 'rgba(255,255,255,0.4)',
                      borderColor: briefForm.darkMode ? '#334155' : 'var(--border-subtle)',
                      color: briefForm.darkMode ? '#e2e8f0' : 'var(--text-muted)',
                    }}
                  >
                    {briefForm.darkMode ? '🌙 ON' : '☀️ OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Style Tab ── */}
          {briefTab === 'style' && (
            <div className="px-4 pb-4 space-y-4">
              {/* Design system */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('设计系统', 'Design System')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DESIGN_SYSTEMS.map((ds) => {
                    const isActive = (briefForm.designSystemId || 'default') === ds.id
                    return (
                      <button
                        key={ds.id}
                        type="button"
                        title={isZh ? ds.description : ds.descriptionEn}
                        className="rounded-[10px] border px-2 py-1 text-xs transition-all"
                        onClick={() => setBriefForm({ designSystemId: ds.id })}
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.4)',
                          borderColor: isActive ? 'var(--border-accent)' : 'var(--border-subtle)',
                          boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {ds.emoji} {ds.name}
                      </button>
                    )
                  })}
                </div>
                {briefForm.designSystemId && briefForm.designSystemId !== 'default' && (() => {
                  const ds = DESIGN_SYSTEMS.find(d => d.id === briefForm.designSystemId)
                  return ds ? (
                    <p className="mt-2 text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                      {isZh ? ds.description : ds.descriptionEn}
                    </p>
                  ) : null
                })()}
              </div>

              {/* Visual direction */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('视觉方向', 'Visual Direction')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {directionPresets.map((preset) => {
                    const isActive = preset.id === briefForm.directionId
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className="rounded-[16px] border px-3 py-2.5 text-left transition-all"
                        onClick={() => setBriefForm({ directionId: preset.id })}
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.52)',
                          borderColor: isActive ? 'var(--border-accent)' : 'var(--border-subtle)',
                          boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {preset.name}
                          </span>
                          {isActive && (
                            <svg className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent)' }} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-snug line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {preset.summary}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Generate button — always visible */}
          <div className="px-4 pb-4">
            <button className="btn btn-primary w-full" onClick={onGenerate} disabled={isGenerating}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7Z" />
              </svg>
              {isGenerating ? text('生成中...', 'Generating...') : text('根据 brief 生成', 'Generate from brief')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
