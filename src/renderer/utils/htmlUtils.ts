/**
 * Shared HTML utilities for analyzing generated HTML content
 */

export function getVisibleTextLength(html: string): number {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const content = (bodyMatch?.[1] || html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return content.length
}

export function getScriptCount(html: string): number {
  return (html.match(/<script\b/gi) || []).length
}

export function getCanvasCount(html: string): number {
  return (html.match(/<canvas\b/gi) || []).length
}

export function looksLikeBlankShell(html: string): boolean {
  // Slide presentations use display:none + JS navigation by design — never treat as blank
  if (/class=["'][^"']*\bslide\b[^"']*["']/.test(html) && /<section\b/i.test(html)) return false

  const normalized = html.toLowerCase()
  const visibleTextLength = getVisibleTextLength(html)
  const scriptCount = getScriptCount(html)
  const canvasCount = getCanvasCount(html)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyContentLength = (bodyMatch?.[1] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '').length
  const hasRootShell = /<div[^>]+id=["'](root|app|__next)["'][^>]*>\s*<\/div>/i.test(html)
  const hasFrameworkScript =
    /(reactdom|createroot|hydrateroot|vue\.createapp|new vue|svelte|type=["']module["'])/.test(normalized)
  const hasExternalScript = /<script[^>]+src=/i.test(html)
  // Only flag charting libraries when loaded via external script src (not inline mentions or CSS)
  const hasChartingLibrary =
    hasExternalScript &&
    /<script[^>]+src=["'][^"']*(?:echarts|chart\.js|chartjs|highcharts|apexcharts|plotly|d3(?:\.min)?\.js|three(?:\.min)?\.js|pixi|vega|gsap)[^"']*["']/i.test(html)
  const hasDelayedReveal =
    /(opacity\s*:\s*0|visibility\s*:\s*hidden|display\s*:\s*none|transform\s*:\s*translate|animation\s*:)/.test(normalized)
  const isCanvasOnly = canvasCount > 0 && visibleTextLength < 120
  const hasMeaningfulStructure = /<(h1|h2|h3|p|section|article|main|button|a)\b/i.test(html)

  return (
    (hasRootShell && hasFrameworkScript) ||
    (visibleTextLength < 60 && hasFrameworkScript) ||
    isCanvasOnly ||
    !bodyMatch ||
    bodyContentLength === 0 ||
    (!hasMeaningfulStructure && visibleTextLength < 40) ||
    (scriptCount > 0 && hasExternalScript && visibleTextLength < 220) ||
    (scriptCount >= 2 && hasChartingLibrary && visibleTextLength < 260) ||
    (scriptCount >= 1 && hasDelayedReveal && visibleTextLength < 140)
  )
}
