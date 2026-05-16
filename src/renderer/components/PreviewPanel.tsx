import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocale } from '../hooks/useLocale'
import { Locale, pickLocale } from '../locale'
import { useAppStore } from '../stores/appStore'

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

type ViewportOption = {
  id: ViewportMode
  label: string
  hint: string
  deviceWidth: number | null
}

type PreviewDiagnostics = {
  visibleTextLength: number
  scriptCount: number
  canvasCount: number
  likelyScriptDependent: boolean
}

interface PreviewPanelProps {
  focused?: boolean
}

function getViewportOptions(locale: Locale): ViewportOption[] {
  return [
    {
      id: 'desktop',
      label: pickLocale(locale, '桌面', 'Desktop'),
      hint: pickLocale(locale, '自适应', 'Fluid'),
      deviceWidth: null,
    },
    {
      id: 'tablet',
      label: pickLocale(locale, '平板', 'Tablet'),
      hint: '768 px',
      deviceWidth: 768,
    },
    {
      id: 'mobile',
      label: pickLocale(locale, '手机', 'Mobile'),
      hint: '390 px',
      deviceWidth: 390,
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

  return { visibleTextLength, scriptCount, canvasCount, likelyScriptDependent }
}

function buildPreviewDocument(html: string, safeMode: boolean): string {
  if (!html.trim()) return ''

  let previewHtml = html.trim()

  if (safeMode) {
    previewHtml = previewHtml.replace(/<script\b[\s\S]*?<\/script>/gi, '')
  }

  const navScript = `<script data-nova-nav>(function(){document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');if(!h||h.startsWith('#')||h.startsWith('javascript:')||h.startsWith('mailto:')||h.startsWith('tel:')||/^https?:\/\//.test(h))return;e.preventDefault();window.parent.postMessage({type:'nova-navigate',href:h},'*');},true);})();<\/script>`

  const injectedHead = `
${navScript}
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
  const { activeVersionId, currentProject, generatedCode, setError, setSuccess, versions,
    currentPageId, projectPages, setCurrentPage, addPage, deletePage } = useAppStore()
  const { locale, text } = useLocale()
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')
  const [frameKey, setFrameKey] = useState(0)
  const [showSource, setShowSource] = useState(false)
  const [showAddPage, setShowAddPage] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [newPagePath, setNewPagePath] = useState('')
  const [pathTouched, setPathTouched] = useState(false)
  const addPageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showAddPage) return
    const handler = (e: MouseEvent) => {
      if (addPageRef.current && !addPageRef.current.contains(e.target as Node)) {
        setShowAddPage(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAddPage])

  // Listen for in-page navigation from iframe
  const handleIframeNav = useCallback((e: MessageEvent) => {
    if (e.data?.type !== 'nova-navigate') return
    const href = (e.data.href as string).split('?')[0].split('#')[0]
    const normalized = href.replace(/\.html?$/, '').replace(/^\.\//, '').replace(/^\/+/, '') || 'index'
    const matchPath = normalized === 'index' ? '/' : `/${normalized}`
    const page = projectPages.find((p) => p.path === matchPath)
    if (page) setCurrentPage(page.id)
  }, [projectPages, setCurrentPage])

  useEffect(() => {
    window.addEventListener('message', handleIframeNav)
    return () => window.removeEventListener('message', handleIframeNav)
  }, [handleIframeNav])

  const handleAddPage = () => {
    const name = newPageName.trim() || '新页面'
    const raw = newPagePath.trim()
    const path = raw ? (raw.startsWith('/') ? raw : `/${raw}`) : `/${slugify(name)}`
    addPage(name, path)
    setShowAddPage(false)
    setNewPageName('')
    setNewPagePath('')
    setPathTouched(false)
  }

  // Measure the rail container width for scale calculation
  const railRef = useRef<HTMLDivElement>(null)
  const [railWidth, setRailWidth] = useState(900)

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setRailWidth(w)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const viewportOptions = useMemo(() => getViewportOptions(locale), [locale])
  const diagnostics = useMemo(() => getPreviewDiagnostics(generatedCode), [generatedCode])

  const metadata = useMemo(() => {
    const title = getDocumentTitle(generatedCode, locale)
    const lineCount = generatedCode ? generatedCode.split(/\r?\n/).length : 0
    const sectionCount = (generatedCode.match(/<(section|article|main)\b/gi) || []).length
    const activeVersion = versions.find((version) => version.id === activeVersionId) || null

    return { activeVersion, lineCount, sectionCount, title }
  }, [activeVersionId, generatedCode, locale, versions])

  const activeViewport = viewportOptions.find((o) => o.id === viewportMode) || viewportOptions[0]
  const hasPreview = generatedCode.trim().length > 0
  const useSafePreview = hasPreview && diagnostics.likelyScriptDependent
  const previewDocument = useMemo(
    () => (hasPreview ? buildPreviewDocument(generatedCode, useSafePreview) : ''),
    [generatedCode, hasPreview, useSafePreview],
  )
  // Always include allow-scripts so the injected navigation interception script runs.
  // Safe mode already strips dangerous external scripts from the HTML itself.
  const sandboxPolicy = 'allow-forms allow-modals allow-pointer-lock allow-popups allow-scripts'

  // Scale factor for tablet/mobile: shrink to fit the rail
  const deviceWidth = activeViewport.deviceWidth
  const scale = deviceWidth ? Math.min(1, (railWidth - 32) / deviceWidth) : 1

  useEffect(() => {
    if (useSafePreview) setShowSource(true)
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

  const handleOpenInBrowser = async () => {
    if (!hasPreview) {
      setError(text('请先生成页面。', 'Generate a page first.'))
      return
    }
    try {
      if (window.electronAPI?.openInBrowser) {
        const result = await window.electronAPI.openInBrowser(generatedCode)
        if (!result.success) {
          setError(result.error || text('无法在浏览器中打开。', 'Failed to open in browser.'))
        }
        return
      }
      // Fallback for non-Electron environments
      const blob = new Blob([generatedCode], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (error) {
      setError(error instanceof Error ? error.message : text('打开失败。', 'Failed to open.'))
    }
  }

  const bodyClassName = focused && !showSource ? 'min-h-0 flex-1 overflow-hidden p-3 md:p-4' : 'min-h-0 flex-1 overflow-auto p-4 md:p-5'
  const previewStackClassName = focused ? 'flex h-full min-h-0 flex-col gap-3' : 'flex h-full min-h-0 flex-col gap-4'
  const frameRailClassName = focused
    ? 'relative flex min-h-0 flex-1 overflow-hidden rounded-[26px] border'
    : 'relative flex min-h-[560px] flex-1 overflow-hidden rounded-[26px] border'

  return (
    <section className={`shell-panel flex min-w-0 flex-1 flex-col overflow-hidden ${focused ? 'rounded-[30px]' : 'rounded-[28px]'}`}>
      <div className="border-b px-4 py-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          {/* Left: title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="shrink-0 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                {text('预览', 'Preview')}
              </p>
              <h2 className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {hasPreview ? metadata.title : text('等待生成', 'Waiting')}
              </h2>
            </div>
            {hasPreview && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="badge badge-accent">{activeViewport.label}{deviceWidth && scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}</span>
                <span className="badge badge-accent">{metadata.lineCount} {text('行', 'ln')}</span>
                <span className="badge badge-accent">{metadata.sectionCount} {text('块', 'blocks')}</span>
                {useSafePreview && <span className="badge badge-success">{text('安全模式', 'Safe')}</span>}
                <span className="badge badge-accent" style={{ color: 'var(--text-disabled)' }}>
                  {formatUpdatedAt(currentProject?.updatedAt, locale)}
                </span>
              </div>
            )}
          </div>

          {/* Right: controls */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Viewport switcher — icon only */}
            <div className="flex items-center gap-0.5 rounded-[12px] p-0.5" style={{ background: 'rgba(255,255,255,0.4)' }}>
              {viewportOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="flex items-center justify-center rounded-[9px] p-1.5 transition-all"
                  title={`${option.label} ${option.hint}`}
                  style={{
                    background: viewportMode === option.id ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: viewportMode === option.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: viewportMode === option.id ? 'var(--shadow-sm)' : 'none',
                  }}
                  onClick={() => setViewportMode(option.id)}
                >
                  {option.id === 'desktop' && (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4M9 17v4m6-4v4M9 21h6" />
                    </svg>
                  )}
                  {option.id === 'tablet' && (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.5 19.5h3M3.75 6.75h16.5M3.75 17.25h16.5M6.75 3h10.5a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 17.25 21H6.75a2.25 2.25 0 0 1-2.25-2.25V5.25A2.25 2.25 0 0 1 6.75 3Z" />
                    </svg>
                  )}
                  {option.id === 'mobile' && (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="mx-1 h-5 w-px" style={{ background: 'var(--border-subtle)' }} />

            {/* Icon-only action buttons */}
            <button className="btn-icon" disabled={!hasPreview} onClick={() => setFrameKey((v) => v + 1)} title={text('刷新', 'Refresh')} type="button">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v6h6M20 20v-6h-6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 9a8 8 0 0 0-13.657-5.657L4 6m16 12-2.343-2.343A8 8 0 0 1 4 15" />
              </svg>
            </button>
            <button className="btn-icon" disabled={!hasPreview} onClick={handleCopyHtml} title={text('复制 HTML', 'Copy HTML')} type="button">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
              </svg>
            </button>
            <button className="btn-icon" data-active={showSource} disabled={!hasPreview} onClick={() => setShowSource((v) => !v)} title={showSource ? text('关闭代码', 'Hide code') : text('查看代码', 'View code')} type="button">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 9 4 12l4 3m8-6 4 3-4 3M14 5l-4 14" />
              </svg>
            </button>
            <button className="btn-icon" disabled={!hasPreview} onClick={handleOpenInBrowser} title={text('在浏览器中打开', 'Open in browser')} type="button">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </button>

            <div className="mx-1 h-5 w-px" style={{ background: 'var(--border-subtle)' }} />

            <button className="btn btn-primary" disabled={!hasPreview} onClick={handleExportHtml} type="button">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v12m0 0 4-4m-4 4-4-4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 17v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
              </svg>
              {text('导出', 'Export')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Page tabs bar ─────────────────────────────────────── */}
      {currentProject && projectPages.length > 0 && (
        <div
          className="flex shrink-0 items-stretch overflow-x-auto border-b px-2"
          style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,0.15)', minHeight: '40px' }}
        >
          {projectPages.map((page) => {
            const isActive = page.id === currentPageId
            const hasCode = page.code.trim().length > 0
            return (
              <div key={page.id} className="group relative flex shrink-0 items-stretch">
                <button
                  onClick={() => setCurrentPage(page.id)}
                  title={page.path}
                  className="flex h-full items-center gap-1.5 px-3 text-xs font-medium transition-colors"
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    borderBottom: isActive ? '2px solid rgba(200,121,65,0.85)' : '2px solid transparent',
                    paddingRight: projectPages.length > 1 ? '24px' : undefined,
                  }}
                >
                  <svg className="h-3 w-3 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                  </svg>
                  <span className={isActive ? 'font-semibold' : ''}>{page.name}</span>
                  {!hasCode && (
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: 'rgba(200,121,65,0.45)' }} />
                  )}
                </button>
                {projectPages.length > 1 && (
                  <button
                    onClick={() => deletePage(page.id)}
                    className="absolute right-1 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-50 hover:!opacity-100"
                    style={{ color: 'var(--text-muted)' }}
                    title={text('删除页面', 'Delete page')}
                  >
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}

          {/* Add page */}
          <div ref={addPageRef} className="relative ml-1 flex items-center">
            <button
              onClick={() => { setShowAddPage((v) => !v); setNewPageName(''); setNewPagePath(''); setPathTouched(false) }}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title={text('添加新页面', 'Add new page')}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {showAddPage && (
              <div
                className="absolute left-0 top-full z-30 mt-1 w-52 rounded-[20px] border p-3"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
              >
                <p className="mb-2.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {text('新建页面', 'New page')}
                </p>
                <div className="space-y-2">
                  <input
                    autoFocus
                    className="input w-full text-xs"
                    placeholder={text('页面名称', 'Page name')}
                    value={newPageName}
                    onChange={(e) => {
                      setNewPageName(e.target.value)
                      if (!pathTouched) setNewPagePath(e.target.value ? `/${slugify(e.target.value)}` : '')
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddPage(); if (e.key === 'Escape') setShowAddPage(false) }}
                  />
                  <input
                    className="input w-full text-xs"
                    placeholder="/about"
                    value={newPagePath}
                    onChange={(e) => { setNewPagePath(e.target.value); setPathTouched(true) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddPage(); if (e.key === 'Escape') setShowAddPage(false) }}
                  />
                  <div className="flex gap-2 pt-0.5">
                    <button className="btn btn-primary h-7 flex-1 text-xs" onClick={handleAddPage}>
                      {text('创建', 'Create')}
                    </button>
                    <button className="btn btn-ghost h-7 text-xs" onClick={() => setShowAddPage(false)}>
                      {text('取消', 'Cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={bodyClassName}>
        {hasPreview ? (
          <div className={previewStackClassName}>
            {useSafePreview && (
              <div className="panel-card rounded-[22px] border px-4 py-3" style={{ borderColor: 'rgba(181, 135, 109, 0.22)' }}>
                <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                  {text(
                    '检测到这份 HTML 更依赖脚本、画布或延迟渲染，已自动切到安全预览并禁用脚本。导出时仍会保留原始 HTML。',
                    'This HTML appears script-dependent or canvas-driven, so preview switched to safe mode with scripts disabled. Export still keeps the original HTML.',
                  )}
                </p>
              </div>
            )}

            {/* Preview rail / Code view — mutually exclusive */}
            {showSource ? null : <div
              ref={railRef}
              className={frameRailClassName}
              style={{ borderColor: 'var(--border-subtle)', background: 'rgba(120, 98, 85, 0.06)' }}
            >
              {viewportMode === 'desktop' ? (
                /* Desktop: full-width fluid iframe */
                <div className="flex flex-1 items-stretch justify-center overflow-hidden rounded-[22px] border bg-white shadow-[0_20px_60px_rgba(61,43,32,0.12)]" style={{ borderColor: 'rgba(99,82,71,0.12)', margin: '12px', width: 'calc(100% - 24px)' }}>
                  <iframe
                    key={`${frameKey}-${useSafePreview ? 'safe' : 'raw'}`}
                    className="h-full min-h-0 w-full bg-white"
                    sandbox={sandboxPolicy}
                    srcDoc={previewDocument}
                    title={metadata.title}
                    style={{ border: 'none' }}
                  />
                </div>
              ) : (
                /* Tablet / Mobile: scaled device frame */
                <div className="flex flex-1 items-stretch" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '12px',
                      bottom: '12px',
                      width: deviceWidth!,
                      transform: `translateX(-50%) scale(${scale})`,
                      transformOrigin: 'top center',
                    }}
                  >
                    {/* Device chrome */}
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: viewportMode === 'mobile' ? '36px' : '20px',
                        border: `${viewportMode === 'mobile' ? '8px' : '6px'} solid rgba(40,30,25,0.85)`,
                        overflow: 'hidden',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06)',
                        background: '#1a1a1a',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Status bar (mobile only) */}
                      {viewportMode === 'mobile' && (
                        <div
                          style={{
                            height: '28px',
                            background: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {/* Dynamic island */}
                          <div style={{ width: '88px', height: '24px', background: '#000', borderRadius: '20px', border: '2px solid #1a1a1a' }} />
                        </div>
                      )}
                      {/* Tablet camera bar */}
                      {viewportMode === 'tablet' && (
                        <div style={{ height: '16px', background: '#111', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2a2a2a', border: '1px solid #333' }} />
                        </div>
                      )}

                      {/* Page iframe */}
                      <div style={{ flex: 1, overflow: 'hidden', background: 'white' }}>
                        <iframe
                          key={`${frameKey}-${viewportMode}-${useSafePreview ? 'safe' : 'raw'}`}
                          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                          sandbox={sandboxPolicy}
                          srcDoc={previewDocument}
                          title={metadata.title}
                        />
                      </div>

                      {/* Home bar (mobile only) */}
                      {viewportMode === 'mobile' && (
                        <div style={{ height: '24px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: '120px', height: '4px', borderRadius: '2px', background: '#444' }} />
                        </div>
                      )}
                    </div>

                    {/* Scale label */}
                    {scale < 0.99 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-28px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          background: 'rgba(255,255,255,0.7)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                        }}
                      >
                        {deviceWidth}px · {Math.round(scale * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>}

            {showSource && (
              <div className={`${frameRailClassName} flex-col overflow-hidden`} style={{ borderColor: 'var(--border-subtle)', background: '#1e1e2e' }}>
                <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
                      <div className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
                      <div className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
                    </div>
                    <span className="text-xs" style={{ color: '#585b70' }}>index.html</span>
                    <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'rgba(255,255,255,0.06)', color: '#6c7086' }}>
                      {text(`${metadata.lineCount} 行`, `${metadata.lineCount} lines`)}
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors"
                    style={{ color: '#a6adc8', background: 'rgba(255,255,255,0.06)' }}
                    onClick={handleCopyHtml}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2M6 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
                    </svg>
                    {text('复制', 'Copy')}
                  </button>
                </div>
                <pre
                  className="min-h-0 flex-1 overflow-auto p-4 text-xs leading-6"
                  style={{ fontFamily: 'var(--font-mono)', color: '#cdd6f4', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
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
