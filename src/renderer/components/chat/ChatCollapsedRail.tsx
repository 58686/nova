import { useLocale } from '../../hooks/useLocale'

interface ChatCollapsedRailProps {
  onToggle: () => void
}

export default function ChatCollapsedRail({ onToggle }: ChatCollapsedRailProps) {
  const { text } = useLocale()
  return (
    <aside className="shell-panel flex w-10 shrink-0 flex-col items-center overflow-hidden rounded-[28px] py-3 gap-4">
      <button
        className="btn-icon"
        onClick={onToggle}
        title={text('展开工作区', 'Expand workspace')}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
        </svg>
      </button>
      <span
        className="mt-2 text-[10px] uppercase tracking-[0.16em] select-none"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'var(--text-disabled)' }}
      >
        {text('工作区', 'Workspace')}
      </span>
    </aside>
  )
}
