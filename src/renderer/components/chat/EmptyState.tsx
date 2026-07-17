import { useLocale } from '../../hooks/useLocale'

interface EmptyStateProps {
  onPickSuggestion: (suggestion: string) => void
}

export default function EmptyState({ onPickSuggestion }: EmptyStateProps) {
  const { text } = useLocale()
  return (
    <div className="flex flex-col items-center py-8 text-center gap-3 px-4">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-[16px]"
        style={{ background: 'var(--gradient-brand)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
      >
        <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
          <path d="M4 4h4v16H4V4Zm4 0h4l6 16h-4L9.5 8.5 8 20H4L8 4Z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nova 已就绪</p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {text('在下方输入概念，或点击模板快速开始', 'Type a concept below or pick a template')}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {[
          text('SaaS 落地页', 'SaaS landing page'),
          text('产品详情页', 'Product detail page'),
          text('个人作品集', 'Portfolio site'),
        ].map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-full px-3 py-1 text-xs transition-all"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            onClick={() => onPickSuggestion(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
