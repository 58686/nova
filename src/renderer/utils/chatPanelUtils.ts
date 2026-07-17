import { Locale } from '../locale'
import { BriefFormState, GenerationTimelineStep, Page } from '../stores/appStore'
import { DirectionPreset, buildPromptForType } from '../services/pageTypes'

// ── Timeline helpers ──────────────────────────────────────────────────────────

export function getTimelineDefinitions(locale: Locale): Omit<GenerationTimelineStep, 'status'>[] {
  const isZh = locale === 'zh-CN'

  return [
    {
      id: 'brief',
      label: isZh ? '理解 brief' : 'Understand brief',
      description: isZh ? '整理目标、受众和页面模块，锁定这次生成意图。' : 'Clarify the goal, audience, and required sections for this generation pass.',
    },
    {
      id: 'structure',
      label: isZh ? '生成结构' : 'Build structure',
      description: isZh ? '搭建信息架构、模块顺序和首屏叙事节奏。' : 'Lay out the information architecture, section order, and hero narrative.',
    },
    {
      id: 'visual',
      label: isZh ? '润色视觉' : 'Refine visuals',
      description: isZh ? '统一风格、排版、卡片层次和交互细节。' : 'Refine styling, spacing, card layers, and interaction details.',
    },
    {
      id: 'html',
      label: isZh ? '输出 HTML' : 'Output HTML',
      description: isZh ? '清理结果，生成可预览、可导出的完整页面。' : 'Clean the result and produce a full previewable HTML artifact.',
    },
  ]
}

export function buildTimeline(definitions: Omit<GenerationTimelineStep, 'status'>[]): GenerationTimelineStep[] {
  return definitions.map((step, index) => ({
    ...step,
    status: index === 0 ? 'active' : 'pending',
  }))
}

export function updateTimelineStep(
  timeline: GenerationTimelineStep[],
  setGenerationTimeline: (steps: GenerationTimelineStep[]) => void,
  stepId: string,
  status: GenerationTimelineStep['status'],
) {
  setGenerationTimeline(
    timeline.map((step) => ({
      ...step,
      status: step.id === stepId ? status : step.status,
    })),
  )
}

export function failActiveTimeline(
  timeline: GenerationTimelineStep[],
  setGenerationTimeline: (steps: GenerationTimelineStep[]) => void,
) {
  setGenerationTimeline(
    timeline.map((step) => ({
      ...step,
      status: step.status === 'active' ? 'error' : step.status,
    })),
  )
}

// ── Project / prompt helpers ──────────────────────────────────────────────────

export function buildProjectName(brief: BriefFormState, locale: Locale) {
  const fallback = locale === 'zh-CN' ? '落地页草稿' : 'Landing Page Draft'
  const base = brief.product.trim() || brief.goal.trim() || fallback
  return base.slice(0, 36)
}

export function buildStructuredPrompt(brief: BriefFormState, direction: DirectionPreset, pageContext = '') {
  // Falls back to the landing page prompt builder which includes all safety rules
  return buildPromptForType({ ...brief, pageType: brief.pageType || 'landing' }, direction, pageContext)
}

// ── Internal link extraction ──────────────────────────────────────────────────

export type LinkedPageInfo = { path: string; linkText: string }

export function extractInternalLinks(html: string): LinkedPageInfo[] {
  const results: LinkedPageInfo[] = []
  const seen = new Set<string>()
  // Match full <a> tags to get href + visible text
  const re = /<a\b[^>]*href=["']([^"'#?][^"']*?)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim()
    const innerHtml = m[2] || ''
    const linkText = innerHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 40)

    if (!href) continue
    if (/^https?:\/\//i.test(href) || /^(mailto:|tel:|javascript:|#)/i.test(href)) continue
    // Skip non-page file extensions
    if (/\.(log|txt|json|csv|xml|pdf|png|jpg|gif|svg|ico|css|js|woff|ttf|map)$/i.test(href)) continue

    const clean = href.replace(/\.html?$/i, '').replace(/^\.\//, '')
    const path = clean.startsWith('/') ? clean : `/${clean}`
    if (path === '/' || seen.has(path)) continue
    seen.add(path)
    results.push({ path, linkText })
  }
  return results
}

// ── Standalone page detection ─────────────────────────────────────────────────

// Pages that should have independent, full-screen layouts (no shared nav/sidebar)
const STANDALONE_PAGE_PATTERNS = [
  /login|signin|sign-in|log-in/i,
  /register|signup|sign-up/i,
  /404|not-?found|error/i,
  /welcome|onboard/i,
  /forgot|reset-?pass/i,
  /verify|confirm/i,
  /landing|splash|intro/i,
]

export function isStandalonePage(path: string, name: string): boolean {
  const text = `${path} ${name}`
  return STANDALONE_PAGE_PATTERNS.some((re) => re.test(text))
}

// ── Input sanitization ────────────────────────────────────────────────────────

export function sanitizePromptInput(s: string): string {
  return s.replace(/["`\\]/g, ' ').replace(/\n+/g, ' ').trim().slice(0, 120)
}

// ── Multi-page context builder ────────────────────────────────────────────────

export function buildPageContext(pages: Page[], currentPageId: string | null): string {
  if (pages.length <= 1) return ''
  const current = pages.find((p) => p.id === currentPageId)
  const others = pages.filter((p) => p.id !== currentPageId)
  const standalone = isStandalonePage(current?.path ?? '', current?.name ?? '')

  const lines = [
    `This is the "${current?.name ?? 'current'}" page (path: ${current?.path ?? '/'}).`,
    'This is part of a multi-page website. Other pages in this project:',
    ...others.map((p) => `  - "${p.name}" → ${p.path}`),
    'Link to other pages with plain relative hrefs, e.g. <a href="/about">. Do not use absolute URLs for internal links.',
  ]

  if (standalone) {
    lines.push(
      '',
      'LAYOUT NOTE: This is a standalone page (login/register/error/landing). It should use a centered, full-screen layout WITHOUT any shared sidebar or main navigation. Match the color palette and typography of the project, but use an independent layout appropriate for this page type.',
    )
    // For standalone pages, only inject CSS tokens/variables as reference, not nav/sidebar structure
    const ref = [...others].sort((a, b) => b.code.length - a.code.length).find((p) => p.code.trim().length > 200 && !isStandalonePage(p.path, p.name))
    if (ref) {
      const headBlock = ref.code.match(/<head[^>]*>[\s\S]*?<\/head>/i)?.[0] ?? ''
      lines.push(
        '',
        `--- CSS TOKENS FROM "${ref.name}" (use same colors/fonts, NOT the layout) ---`,
        headBlock.slice(0, 3000),
        '--- END TOKENS ---',
      )
    }
  } else {
    // App-page: enforce full design consistency including nav/sidebar structure
    const ref = [...others].sort((a, b) => b.code.length - a.code.length).find((p) => p.code.trim().length > 200 && !isStandalonePage(p.path, p.name))
    if (ref) {
      const html = ref.code
      const headBlock = html.match(/<head[^>]*>[\s\S]*?<\/head>/i)?.[0] ?? ''
      const bodyOpen = html.match(/<body[^>]*>([\s\S]{0,2500})/i)?.[0] ?? ''
      const excerpt = (headBlock + '\n' + bodyOpen).slice(0, 7000)

      lines.push(
        '',
        '⚠️ CRITICAL — DESIGN CONSISTENCY:',
        `This new page MUST look like it belongs to the same product as the existing "${ref.name}" page.`,
        'Reuse EXACTLY: the same color palette, fonts, sidebar/nav HTML structure, card styles, spacing scale, and component patterns.',
        'Do NOT invent a new visual design. Copy the navigation, header, sidebar layout from the reference below and adapt only the page content.',
        `--- REFERENCE HTML (${ref.name}) — copy its design system ---`,
        excerpt,
        '--- END REFERENCE ---',
      )
    }
  }

  return lines.join('\n')
}

// ── New-page request detection ────────────────────────────────────────────────

export function isNewPageRequest(instruction: string): boolean {
  return /新(的|建|增|加)?页面|添加.{0,4}页面|跳转.{0,6}(新|其他|另一个)页面|创建.{0,6}页面|button.*new.*page|add.*page|create.*page|link.*to.*new/i.test(instruction)
}

// ── Blank-shell recovery prompt ───────────────────────────────────────────────

export function buildStaticRecoveryPrompt(originalPrompt: string, html: string) {
  return [
    'The previous HTML preview rendered as a blank or nearly blank shell.',
    'Regenerate it as fully rendered static HTML with inline CSS only.',
    'Do not use React, Vue, Svelte, a root div placeholder, framework bootstrapping, external JavaScript, or scripts that fill content after load.',
    'Do not use canvas, WebGL, or chart libraries. If charts are needed, render them as static HTML/CSS/SVG mockups.',
    'Make sure visible content appears immediately on first paint: hero heading, supporting text, sections, and CTA.',
    'Original request:',
    originalPrompt,
    'Rejected output excerpt:',
    html.slice(0, 2000),
  ].join('\n')
}
