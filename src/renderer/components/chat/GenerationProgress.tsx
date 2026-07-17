import { useLocale } from '../../hooks/useLocale'
import type { GenerationTimelineStep } from '../../stores/appStore'

interface GenerationProgressProps {
  isAnalyzing: boolean
  isGenerating: boolean
  activeGenerationLabel: string | null
  generationTimeline: GenerationTimelineStep[]
}

export default function GenerationProgress({
  isAnalyzing,
  isGenerating,
  activeGenerationLabel,
  generationTimeline,
}: GenerationProgressProps) {
  const { text } = useLocale()
  return (
    <div className="flex gap-2 justify-start">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
        style={{ background: 'var(--gradient-brand)' }}
      >
        <svg className="h-3 w-3 fill-white" viewBox="0 0 24 24">
          <path d="M4 4h4v16H4V4Zm4 0h4l6 16h-4L9.5 8.5 8 20H4L8 4Z" />
        </svg>
      </div>
      {isGenerating && generationTimeline.length > 0 ? (
        <div
          className="flex-1 rounded-[14px] px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border-subtle)' }}
        >
          {activeGenerationLabel && (
            <p className="mb-2 text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
              {activeGenerationLabel}
            </p>
          )}
          <div className="space-y-1.5">
            {generationTimeline.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className="shrink-0">
                  {step.status === 'completed' ? (
                    <svg className="h-3 w-3" style={{ color: 'var(--accent)' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : step.status === 'active' ? (
                    <span className="thinking-dot block" style={{ background: 'var(--accent)' }} />
                  ) : step.status === 'error' ? (
                    <span className="h-2 w-2 rounded-full block" style={{ background: '#ef4444' }} />
                  ) : (
                    <span className="h-2 w-2 rounded-full block" style={{ background: 'var(--border-subtle)' }} />
                  )}
                </div>
                <span
                  className="text-[11px]"
                  style={{
                    color: step.status === 'pending' ? 'var(--text-disabled)' :
                           step.status === 'completed' ? 'var(--text-secondary)' :
                           'var(--text-primary)',
                    fontWeight: step.status === 'active' ? 500 : 400,
                  }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="flex items-center gap-1.5 rounded-[14px] px-4 py-2.5"
          style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border-subtle)' }}
        >
          <span className="thinking-dot" />
          <span className="thinking-dot" style={{ animationDelay: '0.15s' }} />
          <span className="thinking-dot" style={{ animationDelay: '0.3s' }} />
          <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {isAnalyzing ? text('分析中…', 'Analyzing…') : text('生成中…', 'Generating…')}
          </span>
        </div>
      )}
    </div>
  )
}
