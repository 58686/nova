import { useState } from 'react'
import { Locale, pickLocale } from '../locale'
import { useLocale } from '../hooks/useLocale'
import { useAppStore } from '../stores/appStore'

function formatTime(timestamp: number, locale: Locale): string {
  const date = new Date(timestamp)
  const diff = Date.now() - date.getTime()

  if (diff < 60000) return pickLocale(locale, '刚刚', 'Just now')
  if (diff < 3600000) return pickLocale(locale, `${Math.floor(diff / 60000)} 分钟前`, `${Math.floor(diff / 60000)} min ago`)
  if (diff < 86400000) return pickLocale(locale, `${Math.floor(diff / 3600000)} 小时前`, `${Math.floor(diff / 3600000)} hr ago`)

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function VersionHistory() {
  const { versions, restoreVersion, deleteVersion, currentProject, activeVersionId } = useAppStore()
  const { locale, text } = useLocale()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  if (!currentProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4" style={{ background: 'var(--bg-secondary)' }}>
        <svg className="mb-3 h-12 w-12" style={{ color: 'var(--text-disabled)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {text('先选择一个项目，再查看已保存版本。', 'Select a project to inspect saved versions.')}
        </p>
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4" style={{ background: 'var(--bg-secondary)' }}>
        <svg className="mb-3 h-12 w-12" style={{ color: 'var(--text-disabled)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {text('还没有保存任何版本。', 'No version has been saved yet.')}
        </p>
        <p className="mt-1 text-center text-xs" style={{ color: 'var(--text-disabled)' }}>
          {text('生成后的页面会自动记录在这里。', 'Generated pages will be recorded here automatically.')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-secondary)' }}>
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {text('已保存版本', 'Saved Versions')}
        </h3>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {text(`${versions.length} 个快照`, `${versions.length} snapshots`)}
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {[...versions].reverse().map((version, index) => {
          const isActive = version.id === activeVersionId

          return (
            <div
              key={version.id}
              className="group rounded-xl p-3 transition-all duration-200 cursor-pointer"
              onClick={() => restoreVersion(version.id)}
              style={{
                background: isActive ? 'rgba(255,255,255,0.84)' : 'var(--bg-surface)',
                border: `1px solid ${isActive ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="badge badge-accent text-[10px]">v{versions.length - index}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>
                      {formatTime(version.createdAt, locale)}
                    </span>
                    {isActive && <span className="badge badge-success text-[10px]">{text('当前', 'Current')}</span>}
                  </div>

                  <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {version.description}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-[10px]" style={{ color: 'var(--text-disabled)' }}>
                    <span>{text(`${version.code.split('\n').length} 行`, `${version.code.split('\n').length} lines`)}</span>
                    {version.generationTarget && <span>{version.generationTarget}</span>}
                    {version.generationMode && <span>{version.generationMode}</span>}
                    {version.variantLabel && <span>{version.variantLabel}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => restoreVersion(version.id)}
                    className="rounded-md px-2 py-1 text-[10px] font-medium transition-colors"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent-light)' }}
                  >
                    {text('恢复', 'Restore')}
                  </button>

                  {showDeleteConfirm === version.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          deleteVersion(version.id)
                          setShowDeleteConfirm(null)
                        }}
                        className="rounded-md px-2 py-1 text-[10px] text-white"
                        style={{ background: '#ef4444' }}
                      >
                        {text('删除', 'Delete')}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="rounded-md px-2 py-1 text-[10px]"
                        style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                      >
                        {text('取消', 'Cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(version.id)}
                      className="rounded-md px-2 py-1 text-[10px] transition-colors"
                      style={{ color: 'var(--text-disabled)' }}
                    >
                      {text('移除', 'Remove')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
