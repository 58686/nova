import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Locale, pickLocale } from '../locale'
import { useLocale } from '../hooks/useLocale'
import { useAppStore } from '../stores/appStore'
import { Version } from '../stores/appStore'

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

function buildDoc(code: string): string {
  if (!code.trim()) return ''
  return code.includes('<!DOCTYPE') ? code : `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${code}</body></html>`
}

function diffStats(codeA: string, codeB: string) {
  const linesA = new Set(codeA.split('\n'))
  const linesB = new Set(codeB.split('\n'))
  const added = [...linesB].filter(l => !linesA.has(l)).length
  const removed = [...linesA].filter(l => !linesB.has(l)).length
  return { added, removed }
}

export default function VersionHistory() {
  const { versions, restoreVersion, deleteVersion, currentProject, activeVersionId } = useAppStore(useShallow(s => ({
    versions: s.versions,
    restoreVersion: s.restoreVersion,
    deleteVersion: s.deleteVersion,
    currentProject: s.currentProject,
    activeVersionId: s.activeVersionId,
  })))
  const { locale, text } = useLocale()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false)
  const [versionA, setVersionA] = useState<Version | null>(null)
  const [versionB, setVersionB] = useState<Version | null>(null)

  function toggleCompareMode() {
    setCompareMode(prev => !prev)
    setVersionA(null)
    setVersionB(null)
  }

  function handleSelectForCompare(version: Version) {
    if (versionA?.id === version.id) {
      setVersionA(null)
      return
    }
    if (versionB?.id === version.id) {
      setVersionB(null)
      return
    }
    if (!versionA) {
      setVersionA(version)
      return
    }
    if (!versionB) {
      setVersionB(version)
      return
    }
    // Both already selected — replace A, keep B
    setVersionA(version)
  }

  function getCompareRole(version: Version): 'A' | 'B' | null {
    if (versionA?.id === version.id) return 'A'
    if (versionB?.id === version.id) return 'B'
    return null
  }

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

  const reversedVersions = [...versions].reverse()
  const bothSelected = versionA !== null && versionB !== null
  const stats = bothSelected ? diffStats(versionA.code, versionB.code) : null

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {text('已保存版本', 'Saved Versions')}
            </h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {text(`${versions.length} 个快照`, `${versions.length} snapshots`)}
            </p>
          </div>

          {/* Compare toggle button */}
          <button
            onClick={toggleCompareMode}
            className="rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200"
            style={{
              background: compareMode ? 'rgba(209, 162, 79, 0.15)' : 'var(--bg-hover)',
              color: compareMode ? 'var(--warning)' : 'var(--text-muted)',
              border: `1px solid ${compareMode ? 'rgba(209, 162, 79, 0.4)' : 'var(--border-subtle)'}`,
            }}
          >
            {text('对比', 'Compare')}
          </button>
        </div>

        {/* Compare mode hint */}
        {compareMode && (
          <p className="mt-2 text-[10px]" style={{ color: 'var(--warning)' }}>
            {!versionA
              ? text('点击版本卡片选择 A 版本', 'Click a card to select Version A')
              : !versionB
              ? text('再选一个版本作为 B', 'Now pick Version B')
              : text('两个版本已选定', 'Both versions selected')}
          </p>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Comparison panel — shown at top when both A and B selected */}
        {compareMode && bothSelected && versionA && versionB && stats && (
          <div
            className="border-b"
            style={{
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-surface)',
            }}
          >
            {/* Stats row */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{
                background: 'rgba(209, 162, 79, 0.08)',
                borderBottom: '1px solid rgba(209, 162, 79, 0.2)',
              }}
            >
              <div className="flex items-center gap-3 text-[11px]">
                <span style={{ color: '#5b9b7a' }}>
                  ⬆ {stats.added} {text('行新增', 'lines added')}
                </span>
                <span style={{ color: 'var(--danger)' }}>
                  ⬇ {stats.removed} {text('行移除', 'lines removed')}
                </span>
              </div>
              <button
                onClick={() => { setVersionA(null); setVersionB(null) }}
                className="rounded-md px-2 py-1 text-[10px] transition-colors"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
              >
                {text('关闭', 'Close')}
              </button>
            </div>

            {/* Two-column preview */}
            <div className="flex" style={{ height: '300px' }}>
              {/* Version A */}
              <div
                className="flex flex-1 flex-col"
                style={{ borderRight: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-1.5"
                  style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(59, 130, 246, 0.06)' }}
                >
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}
                  >
                    A
                  </span>
                  <span className="truncate text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    {(() => {
                      const idx = versions.findIndex(v => v.id === versionA.id)
                      const vNum = idx >= 0 ? `V${idx + 1}` : 'V?'
                      return `${vNum} — ${versionA.description}`
                    })()}
                  </span>
                </div>
                <iframe
                  srcDoc={buildDoc(versionA.code)}
                  sandbox="allow-scripts"
                  className="flex-1 w-full border-none"
                  style={{ background: '#fff' }}
                  title="Version A preview"
                />
                <div
                  className="px-3 py-1 text-[10px]"
                  style={{ color: 'var(--text-disabled)', borderTop: '1px solid var(--border-subtle)' }}
                >
                  {versionA.code.split('\n').length} {text('行', 'lines')}
                </div>
              </div>

              {/* Version B */}
              <div className="flex flex-1 flex-col">
                <div
                  className="flex items-center gap-2 px-3 py-1.5"
                  style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(249, 115, 22, 0.06)' }}
                >
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}
                  >
                    B
                  </span>
                  <span className="truncate text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    {(() => {
                      const idx = versions.findIndex(v => v.id === versionB.id)
                      const vNum = idx >= 0 ? `V${idx + 1}` : 'V?'
                      return `${vNum} — ${versionB.description}`
                    })()}
                  </span>
                </div>
                <iframe
                  srcDoc={buildDoc(versionB.code)}
                  sandbox="allow-scripts"
                  className="flex-1 w-full border-none"
                  style={{ background: '#fff' }}
                  title="Version B preview"
                />
                <div
                  className="px-3 py-1 text-[10px]"
                  style={{ color: 'var(--text-disabled)', borderTop: '1px solid var(--border-subtle)' }}
                >
                  {versionB.code.split('\n').length} {text('行', 'lines')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Version list */}
        <div className="space-y-2 p-3">
          {reversedVersions.map((version, index) => {
            const isActive = version.id === activeVersionId
            const compareRole = compareMode ? getCompareRole(version) : null
            const isSelectedA = compareRole === 'A'
            const isSelectedB = compareRole === 'B'

            let cardBorder = isActive ? 'var(--border-accent)' : 'var(--border-subtle)'
            let cardBg = isActive ? 'rgba(255,255,255,0.84)' : 'var(--bg-surface)'
            if (isSelectedA) {
              cardBorder = 'rgba(59, 130, 246, 0.6)'
              cardBg = 'rgba(59, 130, 246, 0.05)'
            } else if (isSelectedB) {
              cardBorder = 'rgba(249, 115, 22, 0.6)'
              cardBg = 'rgba(249, 115, 22, 0.05)'
            }

            return (
              <div
                key={version.id}
                className="group rounded-xl p-3 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  if (compareMode) {
                    handleSelectForCompare(version)
                  } else {
                    restoreVersion(version.id)
                  }
                }}
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: (isActive && !compareMode) ? 'var(--shadow-sm)' : 'none',
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
                      {isSelectedA && (
                        <span
                          className="rounded px-1 py-0.5 text-[10px] font-bold"
                          style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}
                        >
                          A
                        </span>
                      )}
                      {isSelectedB && (
                        <span
                          className="rounded px-1 py-0.5 text-[10px] font-bold"
                          style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}
                        >
                          B
                        </span>
                      )}
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

                  {compareMode ? (
                    /* Compare mode: show A/B selection button */
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {compareRole ? (
                        <button
                          onClick={() => handleSelectForCompare(version)}
                          className="rounded-md px-2 py-1 text-[10px] font-bold transition-colors"
                          style={{
                            background: compareRole === 'A' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                            color: compareRole === 'A' ? '#3b82f6' : '#f97316',
                          }}
                        >
                          {compareRole}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectForCompare(version)}
                          className="rounded-md px-2 py-1 text-[10px] font-medium transition-colors opacity-0 group-hover:opacity-100"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                        >
                          {!versionA ? 'A' : !versionB ? 'B' : 'A'}
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Normal mode: restore / delete */
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => restoreVersion(version.id)}
                        className="rounded-md px-2 py-1 text-[10px] font-medium transition-colors"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent-light)' }}
                      >
                        {text('恢复', 'Restore')}
                      </button>

                      {showDeleteConfirm === version.id ? (
                        <div className="flex flex-col items-end gap-1">
                          {isActive && (
                            <span className="text-[10px] font-medium" style={{ color: '#ef4444' }}>
                              {text('⚠️ 正在删除当前版本', '⚠️ This is the active version')}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                deleteVersion(version.id)
                                setShowDeleteConfirm(null)
                              }}
                              className="rounded-md px-2 py-1 text-[10px] text-white"
                              style={{ background: '#ef4444' }}
                            >
                              {isActive ? text('仍然删除', 'Delete anyway') : text('删除', 'Delete')}
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="rounded-md px-2 py-1 text-[10px]"
                              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                            >
                              {text('取消', 'Cancel')}
                            </button>
                          </div>
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
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
