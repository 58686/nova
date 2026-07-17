import { useLocale } from '../../hooks/useLocale'
import { PAGE_TEMPLATES, PAGE_TYPE_CONFIGS, type PageTemplate } from '../../services/pageTypes'

interface TemplateLibraryOverlayProps {
  templateFilter: string
  setTemplateFilter: (filter: string) => void
  onClose: () => void
  onApply: (tpl: PageTemplate) => void
  isGenerating: boolean
}

export default function TemplateLibraryOverlay({
  templateFilter,
  setTemplateFilter,
  onClose,
  onApply,
  isGenerating,
}: TemplateLibraryOverlayProps) {
  const { text, locale } = useLocale()
  const isZh = locale === 'zh-CN'
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col rounded-[28px] overflow-hidden"
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{text('一键起始', 'Quick Start')}</p>
          <h3 className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{text('模板库', 'Template Library')}</h3>
        </div>
        <button
          className="btn-icon"
          onClick={onClose}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 py-2 shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { id: 'all', label: text('全部', 'All') },
          { id: 'landing', label: text('落地页', 'Landing') },
          { id: 'app', label: text('App', 'App') },
          { id: 'email', label: text('邮件', 'Email') },
          { id: 'ecommerce', label: text('电商', 'E-com') },
          { id: 'portfolio', label: text('主页', 'Portfolio') },
          { id: 'component', label: text('组件', 'Component') },
          { id: 'slide', label: text('幻灯片', 'Slides') },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            className="rounded-full px-3 py-1 text-xs whitespace-nowrap shrink-0 transition-colors"
            style={{
              background: templateFilter === tab.id ? 'var(--accent-primary)' : 'var(--bg-hover)',
              color: templateFilter === tab.id ? '#fff' : 'var(--text-secondary)',
            }}
            onClick={() => setTemplateFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {PAGE_TEMPLATES
            .filter(t => templateFilter === 'all' || t.pageType === templateFilter)
            .map(tpl => (
              <button
                key={tpl.id}
                type="button"
                className="rounded-[14px] border overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                onClick={() => onApply(tpl)}
                disabled={isGenerating}
              >
                {/* Gradient preview */}
                <div
                  className="h-[72px] w-full flex items-center justify-center"
                  style={{ background: tpl.gradient }}
                >
                  <span className="text-2xl select-none" role="img">
                    {PAGE_TYPE_CONFIGS(false).find(c => c.id === tpl.pageType)?.icon || '📄'}
                  </span>
                </div>
                {/* Info */}
                <div className="px-2.5 py-2">
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {isZh ? tpl.name : tpl.nameEn}
                  </p>
                  <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>
                    {isZh ? tpl.description : tpl.descriptionEn}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
