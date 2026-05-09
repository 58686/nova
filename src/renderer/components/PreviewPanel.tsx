import { useEffect, useMemo, useState } from 'react'
import { useLocale } from '../hooks/useLocale'
import { Locale, pickLocale } from '../locale'
import { useAppStore } from '../stores/appStore'

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

type PreviewDiagnostics = {
  visibleTextLength: number
  scriptCount: number
  canvasCount: number
  likelyScriptDependent: boolean
}

interface PreviewPanelProps {
  focused?: boolean
}

function getViewportOptions(locale: Locale) {
  return [
    {
      id: 'desktop' as const,
      label: pickLocale(locale, '桌面', 'Desktop'),
      width: '100%',
      hint: pickLocale(locale, '自适应画布', 'Fluid canvas'),
    },
    {
      id: 'tablet' as const,
      label: pickLocale(locale, '平板', 'Tablet'),
      width: '860px',
      hint: '860 px',
    },
    {
      id: 'mobile' as const,
      label: pickLocale(locale, '手机', 'Mobile'),
      width: '430px',
      hint: '430 px',
    },
  ]
}

function getDocumentTitle(html: string, locale: Locale): string {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch?.[1].replace(/\s+/g, ' ').trim()

  if (title) return title

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  return h1Match?.[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || pickLocale(locale, '页面预览', 'Generated page preview')
}

function formatUpdatedAt(timestamp: number | undefined, locale: Locale): string {
  if (!timestamp) return pickLocale(locale, '尚未保存', 'Not saved yet')

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getVisibleTextLength(html: string): number {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const content = (bodyMatch?.[1] || html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return content.length
}

function getPreviewDiagnostics(html: string): PreviewDiagnostics {
  const normalized = html.toLowerCase()
  const visibleTextLength = getVisibleTextLength(html)
  const scriptCount = (html.match(/<script\b/gi) || []).length
  const canvasCount = (html.match(/<canvas\b/gi) || []).length
  const hasExternalScript = /<script[^>]+src=/i.test(html)
  const hasFrameworkShell = /<div[^>]+id=["'](root|app|__next)["'][^>]*>\s*<\/div>/i.test(html)
  const hasChartingLibrary =
    /(echarts|chart\.js|chartjs|highcharts|apexcharts|plotly|d3(?:\.js)?|three(?:\.js)?|pixi(?:\.js)?|vega|gsap)/.test(normalized)
  const hasDelayedReveal =
    /(opacity\s*:\s*0|visibility\s*:\s*hidden|display\s*:\s*none|animation\s*:|transform\s*:\s*translate)/.test(normalized)
  const hasMeaningfulStructure = /<(h1|h2|h3|p|section|article|main|button|a|li)\b/i.test(html)

  const likelyScriptDependent =
    hasFrameworkShell ||
    (canvasCount > 0 && visibleTextLength < 180) ||
    (scriptCount > 0 && hasExternalScript && visibleTextLength < 220) ||
    (scriptCount >= 1 && hasChartingLibrary && visibleTextLength < 260) ||
    (scriptCount >= 1 && hasDelayedReveal && visibleTextLength < 160) ||
    (scriptCount >= 2 && !hasMeaningfulStructure)

  return {
    visibleTextLength,
    scriptCount,
    canvasCount,
    likelyScriptDependent,
  }
}

function buildPreviewDocument(html: string, safeMode: boolean): string {
  if (!html.trim()) return ''

  let previewHtml = html.trim()

  if (safeMode) {
    previewHtml = previewHtml.replace(/<script\b[\s\S]*?<\/script>/gi, '')
  }

  const injectedHead = `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style data-nova-preview>
html, body { min-height: 100%; }
body { margin: 0; overflow-x: hidden; }
img, svg, video, canvas { max-width: 100%; }
${safeMode ? `
* { animation: none !important; transition: none !important; }
body * { opacity: 1 !important; visibility: visible !important; }
html { background: #f6f1ea; }
body { background: #ffffff !important; color: #171717 !important; }
` : ''}
</style>`

  if (!/<html[\s>]/i.test(previewHtml)) {
    return `<!DOCTYPE html>
<html lang="en">
<head>${injectedHead}</head>
<body>${previewHtml}</body>
</html>`
  }

  if (/<head[^>]*>/i.test(previewHtml)) {
    return previewHtml.replace(/<head([^>]*)>/i, `<head$1>${injectedHead}`)
  }

  return previewHtml.replace(/<html([^>]*)>/i, `<html$1><head>${injectedHead}</head>`)
}

export default function PreviewPanel({ focused = false }: PreviewPanelProps) {
  const { activeVersionId, currentProject, generatedCode, setError, setSuccess, versions } = useAppStore()
  const { locale, text } = useLocale()
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [frameKey, setFrameKey] = useState(0)
  const [showSource, setShowSource] = useState(false)

  const viewportOptions = useMemo(() => getViewportOptions(locale), [locale])
  const diagnostics = useMemo(() => getPreviewDiagnostics(generatedCode), [generatedCode])

  const metadata = useMemo(() => {
    const title = getDocumentTitle(generatedCode, locale)
    const lineCount = generatedCode ? generatedCode.split(/\r?\n/).length : 0
    const sectionCount = (generatedCode.match(/<(section|article|main)\b/gi) || []).length
    const activeVersion = versions.find((version) => version.id === activeVersionId) || null

    return { activeVersion, lineCount, sectionCount, title }
  }, [activeVersionId, generatedCode, locale, versions])

  const activeViewport = viewportOptions.find((option) => option.id === viewportMode) || viewportOptions[0]
  const hasPreview = generatedCode.trim().length > 0
  const useSafePreview = hasPreview && diagnostics.likelyScriptDependent
  const previewDocument = useMemo(
    () => (hasPreview ? buildPreviewDocument(generatedCode, useSafePreview) : ''),
    [generatedCode, hasPreview, useSafePreview],
  )
  const sandboxPolicy = useSafePreview
    ? 'allow-forms allow-modals allow-pointer-lock allow-popups'
    : 'allow-forms allow-modals allow-pointer-lock allow-popups allow-scripts'

  useEffect(() => {
    if (useSafePreview) {
      setShowSource(true)
    }
  }, [useSafePreview])

  const handleCopyHtml = async () => {
    if (!hasPreview) {
      setError(text('请先生成页面，再复制 HTML。', 'Generate a page before copying HTML.'))
      return
    }

    try {
      await navigator.clipboard.writeText(generatedCode)
      setSuccess(text('HTML 已复制到剪贴板', 'HTML copied to clipboard'))
    } catch {
      setError(text('当前环境无法复制 HTML。', 'Unable to copy HTML from this runtime.'))
    }
  }

  const handleExportHtml = async () => {
    if (!hasPreview) {
      setError(text('请先生成页面，再导出 HTML。', 'Generate a page before exporting HTML.'))
      return
    }

    const baseName = slugify(currentProject?.name || metadata.title || 'nova-preview') || 'nova-preview'
    const filename = `${baseName}.html`

    try {
      if (window.electronAPI?.exportHtml) {
        const result = await window.electronAPI.exportHtml(generatedCode, filename)

        if (result.success) {
          setSuccess(
            result.path
              ? text(`HTML 已导出到 ${result.path}`, `HTML exported to ${result.path}`)
              : text('HTML 已导出', 'HTML exported'),
          )
        }

        return
      }

      const blob = new Blob([generatedCode], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
      setSuccess(text('已开始下载 HTML', 'HTML download started'))
    } catch (error) {
      setError(error instanceof Error ? error.message : text('导出 HTML 失败。', 'Failed to export HTML.'))
    }
  }

  const bodyClassName = focused && !showSource ? 'min-h-0 flex-1 overflow-hidden p-3 md:p-4' : 'min-h-0 flex-1 overflow-auto p-4 md:p-5'
  const previewStackClassName = focused ? 'flex h-full min-h-0 flex-col gap-3' : 'flex h-full min-h-0 flex-col gap-4'
  const frameRailClassName = focused
    ? 'flex min-h-0 flex-1 items-stretch justify-center rounded-[26px] border p-2 md:p-3'
    : 'flex min-h-[560px] flex-1 items-stretch justify-center rounded-[26px] border p-3 md:p-4'

  return (
    <section className={`shell-panel flex min-w-0 flex-1 flex-col overflow-hidden ${focused ? 'rounded-[30px]' : 'rounded-[28px]'}`}>
      <div className={`border-b ${focused ? 'px-4 py-3 md:px-5' : 'px-5 py-4'}`} style={{ borderColor: 'var(--border-subtle)' }}>
        <div className={`flex ${focused ? 'flex-wrap items-center justify-between gap-3' : 'flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'}`}>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              {text('实时预览', 'Live Preview')}
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {hasPreview ? metadata.title : text('预览画布正在等待生成', 'Preview canvas waiting for generation')}
            </h2>
            {!focused && (
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {hasPreview
                  ? currentProject?.description || text('在这里检查当前成果、切换视口宽度，并导出最终 HTML。', 'Inspect the current artifact, switch viewport widths, and export the final HTML.')
                  : text('先从左侧 brief 生成页面，结果会直接渲染在这里。', 'Generate a page from the brief on the left and it will render here immediately.')}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewportOptions.map((option) => (
              <button
                key={option.id}
                className="toolbar-chip"
                data-active={viewportMode === option.id}
                onClick={() => setViewportMode(option.id)}
                type="button"
              >
                <span>{option.label}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {option.hint}
                </span>
              </button>
            ))}

            <button className="btn btn-ghost" disabled={!hasPreview} onClick={() => setFrameKey((value) => value + 1)} type="button">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v6h6M20 20v-6h-6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 9a8 8 0 0 0-13.657-5.657L4 6m16 12-2.343-2.343A8 8 0 0 1 4 15" />
              </svg>
              {text('刷新', 'Refresh')}
            </button>

            <button className="btn btn-ghost" disabled={!hasPreview} onClick={handleCopyHtml} type="button">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
              </svg>
              {text('复制 HTML', 'Copy HTML')}
            </button>

            <button className="btn btn-ghost" disabled={!hasPreview} onClick={() => setShowSource((value) => !value)} type="button">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 9 4 12l4 3m8-6 4 3-4 3M14 5l-4 14" />
              </svg>
              {showSource ? text('隐藏 HTML', 'Hide HTML') : text('查看 HTML', 'View HTML')}
            </button>

            <button className="btn btn-primary" disabled={!hasPreview} onClick={handleExportHtml} type="button">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v12m0 0 4-4m-4 4-4-4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 17v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
              </svg>
              {text('导出 HTML', 'Export HTML')}
            </button>
          </div>
        </div>

        <div className={`flex flex-wrap gap-2 ${focused ? 'mt-3' : 'mt-4'}`}>
          <span className="badge badge-accent">{activeViewport.label}</span>
          <span className="badge badge-accent">{text(`${metadata.lineCount} 行`, `${metadata.lineCount} lines`)}</span>
          <span className="badge badge-accent">{text(`${metadata.sectionCount} 个布局区块`, `${metadata.sectionCount} layout blocks`)}</span>
          {diagnostics.scriptCount > 0 && <span className="badge badge-accent">{text(`${diagnostics.scriptCount} 个脚本`, `${diagnostics.scriptCount} scripts`)}</span>}
          {diagnostics.canvasCount > 0 && <span className="badge badge-accent">{text(`${diagnostics.canvasCount} 个画布`, `${diagnostics.canvasCount} canvases`)}</span>}
          {useSafePreview && <span className="badge badge-success">{text('安全预览', 'Safe Preview')}</span>}
          <span className="badge badge-accent">
            {metadata.activeVersion ? text('已选中版本', 'Version selected') : text('未保存预览', 'Unsaved preview')}
          </span>
          <span className="badge badge-accent">
            {text(`更新于 ${formatUpdatedAt(currentProject?.updatedAt, locale)}`, `Updated ${formatUpdatedAt(currentProject?.updatedAt, locale)}`)}
          </span>
        </div>
      </div>

      <div className={bodyClassName}>
        {hasPreview ? (
          <div className={previewStackClassName}>
            {useSafePreview && (
              <div className="panel-card rounded-[22px] border px-4 py-3" style={{ borderColor: 'rgba(181, 135, 109, 0.22)' }}>
                <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                  {text(
                    '检测到这份 HTML 更依赖脚本、画布或延迟渲染，我已经自动切到安全预览并禁用了脚本，避免再次只看到黑屏。导出时仍会保留原始 HTML。',
                    'This HTML looks script-dependent or canvas-driven, so preview switched to safe mode with scripts disabled to avoid another blank screen. Export still keeps the original HTML.',
                  )}
                </p>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {text(
                    `可见文本约 ${diagnostics.visibleTextLength} 字符，脚本 ${diagnostics.scriptCount} 个，画布 ${diagnostics.canvasCount} 个。`,
                    `Visible text ~${diagnostics.visibleTextLength} chars, scripts ${diagnostics.scriptCount}, canvases ${diagnostics.canvasCount}.`,
                  )}
                </p>
              </div>
            )}

            <div
              className={frameRailClassName}
              style={{ borderColor: 'var(--border-subtle)', background: 'rgba(120, 98, 85, 0.06)' }}
            >
              <div
                className={`animate-scale-in max-w-full min-h-0 overflow-hidden rounded-[24px] border bg-white shadow-[0_28px_70px_rgba(61,43,32,0.14)] transition-all duration-300 ${focused ? 'flex-1' : ''}`}
                style={{
                  borderColor: 'rgba(99, 82, 71, 0.12)',
                  width: activeViewport.width,
                  height: '100%',
                  flex: activeViewport.id === 'desktop' ? '1 1 auto' : undefined,
                }}
              >
                <iframe
                  key={`${frameKey}-${useSafePreview ? 'safe' : 'raw'}`}
                  className="h-full min-h-0 w-full bg-white"
                  sandbox={sandboxPolicy}
                  srcDoc={previewDocument}
                  title={metadata.title}
                />
              </div>
            </div>

            {showSource && (
              <div className="panel-card rounded-[24px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                      {text('源码视图', 'Source View')}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {text('生成后的 HTML', 'Generated HTML')}
                    </h3>
                  </div>
                  <span className="badge badge-accent">{text(`${metadata.lineCount} 行`, `${metadata.lineCount} lines`)}</span>
                </div>
                <pre
                  className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-[18px] px-3 py-3 text-xs leading-6"
                  style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
                >
                  {generatedCode}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="panel-card flex h-full min-h-[420px] flex-col items-center justify-center rounded-[26px] px-6 py-10 text-center">
            <div
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-[28px]"
              style={{ background: 'linear-gradient(135deg, rgba(217, 183, 159, 0.24), rgba(166, 124, 116, 0.18))' }}
            >
              <svg className="h-10 w-10" fill="none" stroke="currentColor" style={{ color: 'var(--accent-dark)' }} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h16v14H4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9h8M8 13h5" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {text('还没有生成页面', 'No page has been generated yet')}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {text(
                '先在左侧填写 brief、选择方向并生成页面。生成后的 HTML 会立刻渲染在这里，保存过的版本也能随时恢复回当前预览。',
                'Fill out the brief on the left, choose a direction, and generate a page. The resulting HTML will render here immediately, and saved versions can be restored into this preview at any time.',
              )}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="badge badge-accent">{currentProject ? currentProject.name : text('先创建或选择项目', 'Create or pick a project')}</span>
              <span className="badge badge-accent">{text(`${versions.length} 个已保存版本`, `${versions.length} saved versions`)}</span>
              <span className="badge badge-accent">{text('可导出 HTML', 'Export-ready HTML')}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
