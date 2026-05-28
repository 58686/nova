import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from '../hooks/useLocale'
import { Locale } from '../locale'
import { ImageData, RuntimeAIService, supportsVision } from '../services/runtimeAI'
import {
  buildPromptForType,
  buildTweakPromptForType,
  DirectionPreset,
  OUTPUT_LANGUAGES,
  PAGE_TEMPLATES,
  PAGE_TYPE_CONFIGS,
  PageTemplate,
  QuickTweak,
} from '../services/pageTypes'
import { useAIConfigStore } from '../stores/aiConfigStore'
import {
  BriefFormState,
  DEFAULT_BRIEF_FORM,
  GenerationTimelineStep,
  Page,
  useAppStore,
} from '../stores/appStore'


function getTimelineDefinitions(locale: Locale): Omit<GenerationTimelineStep, 'status'>[] {
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function buildTimeline(definitions: Omit<GenerationTimelineStep, 'status'>[]): GenerationTimelineStep[] {
  return definitions.map((step, index) => ({
    ...step,
    status: index === 0 ? 'active' : 'pending',
  }))
}

function buildProjectName(brief: BriefFormState, locale: Locale) {
  const fallback = locale === 'zh-CN' ? '落地页草稿' : 'Landing Page Draft'
  const base = brief.product.trim() || brief.goal.trim() || fallback
  return base.slice(0, 36)
}

function buildStructuredPrompt(brief: BriefFormState, direction: DirectionPreset, pageContext = '') {
  // Falls back to the landing page prompt builder which includes all safety rules
  return buildPromptForType({ ...brief, pageType: brief.pageType || 'landing' }, direction, pageContext)
}


type LinkedPageInfo = { path: string; linkText: string }

function extractInternalLinks(html: string): LinkedPageInfo[] {
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

function isStandalonePage(path: string, name: string): boolean {
  const text = `${path} ${name}`
  return STANDALONE_PAGE_PATTERNS.some((re) => re.test(text))
}

function buildPageContext(pages: Page[], currentPageId: string | null): string {
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

function isNewPageRequest(instruction: string): boolean {
  return /新(的|建|增|加)?页面|添加.{0,4}页面|跳转.{0,6}(新|其他|另一个)页面|创建.{0,6}页面|button.*new.*page|add.*page|create.*page|link.*to.*new/i.test(instruction)
}

function getVisibleTextLength(html: string): number {
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

function getScriptCount(html: string): number {
  return (html.match(/<script\b/gi) || []).length
}

function getCanvasCount(html: string): number {
  return (html.match(/<canvas\b/gi) || []).length
}

function looksLikeBlankShell(html: string): boolean {
  const normalized = html.toLowerCase()
  const visibleTextLength = getVisibleTextLength(html)
  const scriptCount = getScriptCount(html)
  const canvasCount = getCanvasCount(html)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyContentLength = (bodyMatch?.[1] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '').length
  const hasRootShell = /<div[^>]+id=["'](root|app|__next)["'][^>]*>\s*<\/div>/i.test(html)
  const hasFrameworkScript =
    /(reactdom|createroot|hydrateroot|vue\.createapp|new vue|svelte|type=["']module["'])/.test(normalized)
  const hasChartingLibrary =
    /(echarts|chart\.js|chartjs|highcharts|apexcharts|plotly|d3(?:\.js)?|three(?:\.js)?|pixi(?:\.js)?|vega|framer-motion|gsap)/.test(normalized)
  const hasExternalScript = /<script[^>]+src=/i.test(html)
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

function buildStaticRecoveryPrompt(originalPrompt: string, html: string) {
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

function updateTimelineStep(
  setGenerationTimeline: (steps: GenerationTimelineStep[]) => void,
  stepId: string,
  status: GenerationTimelineStep['status'],
) {
  const { generationTimeline } = useAppStore.getState()
  setGenerationTimeline(
    generationTimeline.map((step) => ({
      ...step,
      status: step.id === stepId ? status : step.status,
    })),
  )
}

function failActiveTimeline(setGenerationTimeline: (steps: GenerationTimelineStep[]) => void) {
  const { generationTimeline } = useAppStore.getState()
  setGenerationTimeline(
    generationTimeline.map((step) => ({
      ...step,
      status: step.status === 'active' ? 'error' : step.status,
    })),
  )
}

export default function ChatPanel() {
  const {
    aiConfig,
    addMessage,
    addProject,
    addVersion,
    briefForm,
    currentProject,
    generatedCode,
    isGenerating,
    messages,
    setAbortController,
    setActiveGenerationLabel,
    setBriefForm,
    setError,
    setGeneratedCode,
    setGenerating,
    setGenerationTimeline,
    setSuccess,
    updateProject,
    currentPageId,
    projectPages,
    setCurrentPage,
    updateCurrentPageCode,
    updatePageCode,
    addPage,
    deletePage,
    chatCollapsed,
    toggleChatCollapsed,
  } = useAppStore()
  const { activePresetId, presets, getActiveConfig } = useAIConfigStore()
  const { locale, text } = useLocale()

  const isZh = locale === 'zh-CN'
  const pageTypeConfigs = useMemo(() => PAGE_TYPE_CONFIGS(isZh), [isZh])
  const activeTypeConfig = useMemo(
    () => pageTypeConfigs.find(c => c.id === briefForm.pageType) || pageTypeConfigs[0],
    [briefForm.pageType, pageTypeConfigs],
  )
  const directionPresets = activeTypeConfig.directions
  const quickTweaks = activeTypeConfig.tweaks
  const timelineDefinitions = useMemo(() => getTimelineDefinitions(locale), [locale])

  const selectedDirection = useMemo(
    () => directionPresets.find((preset) => preset.id === briefForm.directionId) || directionPresets[0],
    [briefForm.directionId, directionPresets],
  )
  const hasContent = generatedCode.trim().length > 0

  const [briefOpen, setBriefOpen] = useState(!hasContent)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateFilter, setTemplateFilter] = useState<string>('all')

  const prevHasContent = useRef(hasContent)
  useEffect(() => {
    if (!prevHasContent.current && hasContent) {
      setBriefOpen(false)
    }
    prevHasContent.current = hasContent
  }, [hasContent])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const runtimeConfig = useMemo(() => getActiveConfig() || aiConfig, [activePresetId, aiConfig, getActiveConfig, presets])

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState<ImageData & { previewUrl: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const commaIdx = dataUrl.indexOf(',')
      const base64 = dataUrl.slice(commaIdx + 1)
      const mimeType = file.type || 'image/png'
      setAttachedImage({ base64, mimeType, previewUrl: dataUrl })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const visionSupported = supportsVision(runtimeConfig.provider)

  const runGeneration = async (prompt: string, label: string, description: string, imageData?: ImageData, skipUserMessage = false) => {
    if (!runtimeConfig?.apiKey) {
      setError(text('请先配置 AI 提供商再开始生成。', 'Please configure an AI provider before generating.'))
      return
    }

    let project = currentProject
    if (!project) {
      addProject({
        name: buildProjectName(briefForm, locale),
        description: briefForm.goal || description,
        code: '',
      })
      project = useAppStore.getState().currentProject
    }

    if (!project) {
      setError(text('无法为当前成果创建项目。', 'Unable to create a project for this artifact.'))
      return
    }

    const controller = new AbortController()
    const service = new RuntimeAIService(runtimeConfig)

    // Show user message immediately so the chat feels responsive
    if (!skipUserMessage) addMessage({ role: 'user', content: label })

    setError(null)
    setSuccess(null)
    setGenerating(true)
    setAbortController(controller)
    setActiveGenerationLabel(label)
    setGenerationTimeline(buildTimeline(timelineDefinitions))

    // Track page stubs created during linked-page generation so we can clean them up on abort/error
    const stubPageIds: string[] = []

    try {
      // Brief is already in hand — complete immediately
      updateTimelineStep(setGenerationTimeline, 'brief', 'completed')
      updateTimelineStep(setGenerationTimeline, 'structure', 'active')

      let rawBuffer = ''
      let lastPreviewUpdate = 0
      let structureDone = false
      let visualDone = false
      for await (const chunk of service.stream(prompt, messages.slice(-4), controller.signal, imageData)) {
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
        rawBuffer += chunk

        // First tokens → structure forming
        if (!structureDone) {
          structureDone = true
          updateTimelineStep(setGenerationTimeline, 'structure', 'completed')
          updateTimelineStep(setGenerationTimeline, 'visual', 'active')
        }
        // 400+ chars → HTML skeleton visible, visual refinement starting
        if (!visualDone && rawBuffer.length > 400) {
          visualDone = true
          updateTimelineStep(setGenerationTimeline, 'visual', 'completed')
          updateTimelineStep(setGenerationTimeline, 'html', 'active')
        }

        const now = Date.now()
        if (now - lastPreviewUpdate > 600) {
          const partial = service.extractHTML(rawBuffer)
          if (partial.length > 200) setGeneratedCode(partial)
          lastPreviewUpdate = now
        }
      }

      let html = service.extractHTML(rawBuffer)
      if (looksLikeBlankShell(html)) {
        let recoveryBuffer = ''
        for await (const chunk of service.stream(buildStaticRecoveryPrompt(prompt, html), messages.slice(-2), controller.signal)) {
          recoveryBuffer += chunk
        }
        html = service.extractHTML(recoveryBuffer)
      }
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')

      setGeneratedCode(html)
      updateCurrentPageCode(html)
      updateProject(project.id, {
        description,
        name: project.name || buildProjectName(briefForm, locale),
      })
      addVersion({
        code: html,
        description,
        generationTarget: 'full-page',
        generationMode: 'single',
      })
      // User message was already added at the start; add assistant response now
      addMessage({ role: 'assistant', content: description, summary: `${selectedDirection.name} / ${description}` })

      updateTimelineStep(setGenerationTimeline, 'html', 'completed')

      // Notify user of completion
      addMessage({
        role: 'assistant',
        content: text('✅ 页面已生成完成！你可以在右侧预览效果，或继续告诉我需要调整的地方。', '✅ Page generated! Preview it on the right, or tell me what to change.'),
        summary: text('✅ 页面生成完成', '✅ Page generated'),
      })

      // Auto-detect linked pages from generated HTML and generate their content
      const linkedLinks = extractInternalLinks(html)
      const afterMainPages = useAppStore.getState().projectPages
      const existingPaths = new Set(afterMainPages.map((p) => p.path))
      const newLinks = linkedLinks.filter((l) => !existingPaths.has(l.path))

      if (newLinks.length === 0) {
        setSuccess(text(`${label} 已完成`, `${label} completed`))
      } else {
        // Create page stubs using the link text as the page name
        type CreatedEntry = { pageId: string; linkText: string; path: string }
        const created: CreatedEntry[] = []
        for (const link of newLinks) {
          const name = link.linkText || link.path.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          addPage(name, link.path)
          const p = useAppStore.getState().projectPages.find((pg) => pg.path === link.path)
          if (p) {
            created.push({ pageId: p.id, linkText: link.linkText, path: link.path })
            stubPageIds.push(p.id)
          }
        }

        const refHtml = html
        const currentPageName = afterMainPages.find((p) => p.id === currentPageId)?.name ?? '首页'
        setActiveGenerationLabel(text('生成关联页面…', 'Generating linked pages…'))

        for (const entry of created) {
          if (controller.signal.aborted) break
          const newPage = useAppStore.getState().projectPages.find((p) => p.id === entry.pageId)
          if (!newPage) continue

          const linkedPrompt = [
            `Create the "${newPage.name}" page (path: ${newPage.path}) for this multi-page product.`,
            entry.linkText ? `The navigation link that leads here is labeled: "${entry.linkText}". The page content should match this label's purpose and scope.` : '',
            `This page is navigated to from the "${currentPageName}" page.`,
            briefForm.product ? `Product/brand: ${briefForm.product}.` : '',
            briefForm.audience ? `Target audience: ${briefForm.audience}.` : '',
            briefForm.goal ? `Overall product goal: ${briefForm.goal}.` : '',
            '',
            '⚠️ CRITICAL — VISUAL CONSISTENCY (non-negotiable):',
            'This page MUST be visually identical in design system to the reference page below.',
            '1. Copy the EXACT same sidebar/navigation HTML structure — same links, same icons, same layout.',
            '2. Use the EXACT same color palette, CSS variables, and typography.',
            '3. Use the EXACT same card, table, badge, and button component styles.',
            '4. Only change the main content area to reflect this specific page\'s purpose.',
            'Do NOT redesign the layout. Do NOT use different colors or fonts. Treat it as extending the same product.',
            'The output must be one complete standalone HTML document with all CSS embedded.',
            '',
            `--- REFERENCE HTML: "${currentPageName}" (replicate its design system completely) ---`,
            refHtml.slice(0, 8000),
            '--- END REFERENCE ---',
          ].filter(Boolean).join('\n')

          let linkedBuffer = ''
          for await (const chunk of service.stream(linkedPrompt, [], controller.signal)) {
            if (controller.signal.aborted) break
            linkedBuffer += chunk
          }
          if (controller.signal.aborted) break

          const linkedHtml = service.extractHTML(linkedBuffer)
          if (linkedHtml) {
            useAppStore.getState().updatePageCode(entry.pageId, linkedHtml)
          }
        }

        if (!controller.signal.aborted) {
          setSuccess(text(
            `${label} 已完成，自动生成了 ${created.length} 个关联页面`,
            `${label} done — auto-generated ${created.length} linked page(s)`,
          ))
        }
      }
    } catch (error) {
      // Clean up empty page stubs created before the abort/error
      stubPageIds.forEach((id) => {
        const p = useAppStore.getState().projectPages.find((pg) => pg.id === id)
        if (p && !p.code.trim()) deletePage(id)
      })
      if ((error as Error).name !== 'AbortError') {
        failActiveTimeline(setGenerationTimeline)
        setError((error as Error).message || text('生成失败', 'Generation failed'))
      }
    } finally {
      setAbortController(null)
      setGenerating(false)
      setActiveGenerationLabel(null)
    }
  }

  const handleGenerate = async () => {
    const pageContext = buildPageContext(projectPages, currentPageId)
    const prompt = buildPromptForType(briefForm, selectedDirection, pageContext)
    const description = `${selectedDirection.name} / ${briefForm.goal || text('新概念', 'New concept')}`
    await runGeneration(prompt, text(`生成 ${selectedDirection.name}`, `Generate ${selectedDirection.name}`), description)
  }

  const handleTweak = async (tweak: QuickTweak) => {
    if (!generatedCode) return
    const prompt = buildTweakPromptForType(briefForm, selectedDirection, tweak, generatedCode)
    const description = `${tweak.label} / ${briefForm.goal || text('当前页面优化', 'Current page refinement')}`
    await runGeneration(prompt, text(`微调：${tweak.label}`, `Tweak: ${tweak.label}`), description)
  }

  const handleApplyTemplate = async (tpl: PageTemplate) => {
    const typeConfigs = PAGE_TYPE_CONFIGS(isZh)
    const typeConfig = typeConfigs.find(c => c.id === tpl.pageType) || typeConfigs[0]
    const direction = typeConfig.directions.find(d => d.id === tpl.directionId) || typeConfig.directions[0]
    const newBrief: BriefFormState = {
      ...briefForm,
      pageType: tpl.pageType,
      directionId: direction.id,
      product: tpl.brief.product,
      audience: tpl.brief.audience,
      goal: tpl.brief.goal,
      sections: tpl.brief.sections,
      notes: tpl.brief.notes,
    }
    setBriefForm(newBrief)
    setShowTemplates(false)
    setBriefOpen(true)
    const pageContext = buildPageContext(projectPages, currentPageId)
    const prompt = buildPromptForType(newBrief, direction, pageContext)
    const label = isZh ? tpl.name : tpl.nameEn
    await runGeneration(prompt, label, label)
  }

  const [chatInput, setChatInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [pendingGenContext, setPendingGenContext] = useState<string | null>(null)

  // Lightweight AI call to check if we need clarification
  const runClarificationCheck = async (instruction: string): Promise<{ needsClarification: boolean; question: string }> => {
    if (!runtimeConfig?.apiKey) return { needsClarification: false, question: '' }
    const service = new RuntimeAIService(runtimeConfig)
    const prompt = [
      'You are a web page design assistant. A user wants to create a web page.',
      'Analyze if their request has enough detail to create a useful page.',
      'If the request is specific enough (mentions purpose, content type, or clear intent), respond exactly: [READY]',
      'If you need more details, respond exactly: [ASK] followed by a concise question in the same language the user used.',
      '',
      `User: "${instruction}"`,
      briefForm.product ? `Product context: ${briefForm.product}` : '',
      briefForm.audience ? `Audience: ${briefForm.audience}` : '',
    ].filter(Boolean).join('\n')
    try {
      const response = await service.generate(prompt, [], false)
      if (response.includes('[ASK]')) {
        const question = response.split('[ASK]')[1]?.trim() || text(
          '请描述一下您想要的页面内容和用途，我可以为您更好地生成。',
          'Could you describe what kind of page you want and its purpose?',
        )
        return { needsClarification: true, question }
      }
    } catch { /* proceed with generation on error */ }
    return { needsClarification: false, question: '' }
  }

  // Handle new page creation from chat (e.g. "给按钮加跳转到注册页面")
  const handleNewPageCreation = async (instruction: string) => {
    if (!runtimeConfig?.apiKey) return
    setIsAnalyzing(true)
    let pageName = text('新页面', 'New Page')
    let pagePath = `/${Date.now().toString(36)}`
    // Try to extract page name from instruction
    const nameMatch = instruction.match(/(?:跳转|链接|去|到|新建|创建|添加).{0,2}["「]?([^"」]{2,12})["」]?页面/)
    if (nameMatch) {
      pageName = nameMatch[1].trim()
      pagePath = '/' + pageName.replace(/\s+/g, '-').toLowerCase()
    }
    setIsAnalyzing(false)

    addPage(pageName, pagePath)
    const newPages = useAppStore.getState().projectPages
    const newPage = newPages.find((p) => p.path === pagePath)
    if (!newPage) return

    addMessage({ role: 'assistant', content: text(`正在为你创建「${pageName}」页面…`, `Creating "${pageName}" page…`), summary: text(`📄 创建 ${pageName}`, `📄 Creating ${pageName}`) })

    const pageContext = buildPageContext(newPages, newPage.id)
    const prompt = [
      `Create the "${pageName}" page (path: ${pagePath}).`,
      `Purpose based on user request: ${instruction}`,
      briefForm.product ? `Product: ${briefForm.product}` : '',
      briefForm.audience ? `Audience: ${briefForm.audience}` : '',
      pageContext,
      'Output a complete HTML document with embedded CSS. Keep it fully static.',
    ].filter(Boolean).join('\n')

    setCurrentPage(newPage.id)
    await runGeneration(prompt, text(`生成 ${pageName}`, `Generate ${pageName}`), pageName, undefined, true)
  }

  const handleCustomChat = async () => {
    if (!chatInput.trim() && !attachedImage) return
    if (isGenerating || isAnalyzing) return

    const instruction = chatInput.trim()
    const imageToSend = attachedImage
    setChatInput('')
    setAttachedImage(null)

    // Add user message immediately so chat feels responsive
    addMessage({ role: 'user', content: instruction || text('以图生页面', 'Create page from image') })

    // If user is replying to AI's clarification question
    if (pendingGenContext) {
      const fullContext = `${pendingGenContext}\nUser's additional details: ${instruction}`
      setPendingGenContext(null)
      if (generatedCode.trim()) {
        const prompt = [
          `Revise the HTML page based on: "${fullContext}"`,
          `Visual direction: ${selectedDirection.name}. ${selectedDirection.prompt}`,
          'Return the complete improved HTML document. Keep it fully static, no framework syntax, no external JS.',
          'Every HTML element must use a proper tag name — never output attribute syntax as visible text.',
          'CURRENT HTML:', generatedCode.slice(0, 12000),
        ].join('\n')
        await runGeneration(prompt, instruction, instruction, undefined, true)
      } else {
        const extraNotes = briefForm.notes ? `${briefForm.notes}\n${fullContext}` : fullContext
        const prompt = buildStructuredPrompt({ ...briefForm, notes: extraNotes }, selectedDirection)
        await runGeneration(prompt, instruction, instruction, undefined, true)
      }
      return
    }

    // Handle image attachment
    if (imageToSend) {
      const label = instruction || text('以图生页面', 'Create page from image')
      const prompt = [
        instruction ? `Based on the provided image and this instruction: "${instruction}",` : 'Based on the provided image,',
        generatedCode.trim() ? 'revise the existing landing page HTML to match the design shown in the image.' : 'create a complete landing page HTML that captures the style, layout, and visual design shown in the image.',
        `Apply this visual direction: ${selectedDirection.name}. ${selectedDirection.prompt}`,
        'Output a complete, fully static HTML document with embedded CSS.',
        generatedCode.trim() ? `\nCurrent HTML to revise:\n${generatedCode.slice(0, 8000)}` : '',
      ].filter(Boolean).join('\n')
      await runGeneration(prompt, label, label, imageToSend, true)
      return
    }

    // Check if this is a "create new page" request (don't modify existing pages)
    if (isNewPageRequest(instruction) && generatedCode.trim()) {
      await handleNewPageCreation(instruction)
      return
    }

    // For first-time generation without existing code, check if we need clarification
    if (!generatedCode.trim()) {
      setIsAnalyzing(true)
      try {
        const result = await runClarificationCheck(instruction)
        if (result.needsClarification) {
          addMessage({ role: 'assistant', content: result.question })
          setPendingGenContext(instruction)
          setIsAnalyzing(false)
          return
        }
      } catch { /* proceed on error */ }
      setIsAnalyzing(false)

      const extraNotes = briefForm.notes ? `${briefForm.notes}\n${instruction}` : instruction
      const prompt = buildStructuredPrompt({ ...briefForm, notes: extraNotes }, selectedDirection)
      await runGeneration(prompt, instruction, instruction, undefined, true)
      return
    }

    // Modify existing page
    const prompt = [
      `Revise the HTML page based on this instruction: "${instruction}"`,
      `Visual direction: ${selectedDirection.name}. ${selectedDirection.prompt}`,
      'Return the complete improved HTML document.',
      'RULES: fully static HTML, no React/Vue/Svelte, no external JS or CDN scripts, no template variables.',
      'Every HTML element must use a proper tag name — never output HTML attribute syntax as visible text content.',
      'CURRENT HTML (revise this):',
      generatedCode.slice(0, 12000),
    ].join('\n')
    await runGeneration(prompt, instruction, instruction, undefined, true)
  }

  if (chatCollapsed) {
    return (
      <aside className="shell-panel flex w-10 shrink-0 flex-col items-center overflow-hidden rounded-[28px] py-3 gap-4">
        <button
          className="btn-icon"
          onClick={toggleChatCollapsed}
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

  return (
    <section className="shell-panel relative flex min-w-0 w-[340px] xl:w-[360px] 2xl:w-[370px] shrink-0 flex-col overflow-hidden rounded-[28px]">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b px-5 py-3 shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              Nova
            </p>
            <h2 className="mt-0.5 truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {currentProject?.name || text('还没有项目', 'No project yet')}
            </h2>
            {projectPages.length > 1 && (() => {
              const currentPage = projectPages.find((p) => p.id === currentPageId)
              return currentPage ? (
                <p className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                  </svg>
                  <span className="truncate">{currentPage.name}</span>
                  <span style={{ color: 'var(--text-disabled)' }}>{currentPage.path}</span>
                </p>
              ) : null
            })()}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`badge ${isGenerating ? 'badge-success' : 'badge-accent'}`}>
              {isGenerating ? text('生成中', 'Generating') : text('已就绪', 'Ready')}
            </span>
            <button
              className="btn-icon"
              onClick={toggleChatCollapsed}
              title={text('折叠工作区', 'Collapse workspace')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 18-6-6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Brief form (collapsible) */}
          <div className="panel-card rounded-[24px] overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              onClick={() => setBriefOpen((prev) => !prev)}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('页面 Brief', 'Page Brief')}
                </p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {briefOpen ? text('收起', 'Collapse') : text('展开 Brief', 'Expand Brief')}
                </p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 transition-transform duration-200"
                style={{
                  color: 'var(--text-muted)',
                  transform: briefOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {briefOpen && (
              <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between pt-3">
                  <button
                    className="rounded-full px-3 py-1 text-xs flex items-center gap-1.5 transition-colors"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                    onClick={() => setShowTemplates(true)}
                    type="button"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    {text('模板库', 'Templates')}
                  </button>
                  <button
                    className="rounded-full px-3 py-1 text-xs"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                    onClick={() => setBriefForm(DEFAULT_BRIEF_FORM)}
                    type="button"
                  >
                    {text('重置', 'Reset')}
                  </button>
                </div>

                {/* Page type selector */}
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                    {text('页面类型', 'Page Type')}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {pageTypeConfigs.map((typeConfig) => {
                      const isActiveType = typeConfig.id === briefForm.pageType
                      return (
                        <button
                          key={typeConfig.id}
                          type="button"
                          className="rounded-[12px] border px-2 py-2 text-center text-xs transition-all"
                          onClick={() => {
                            const newDefault = typeConfig.directions[0]
                            setBriefForm({
                              pageType: typeConfig.id,
                              directionId: newDefault.id,
                              sections: typeConfig.defaultSections,
                            })
                          }}
                          style={{
                            background: isActiveType ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.4)',
                            borderColor: isActiveType ? 'var(--border-accent)' : 'var(--border-subtle)',
                            boxShadow: isActiveType ? 'var(--shadow-sm)' : 'none',
                            color: isActiveType ? 'var(--text-primary)' : 'var(--text-muted)',
                          }}
                        >
                          <div className="text-base leading-none mb-1">{typeConfig.icon}</div>
                          <div className="font-medium leading-tight" style={{ fontSize: 10 }}>
                            {isZh ? typeConfig.label : typeConfig.labelEn}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dynamic brief fields based on page type */}
                {activeTypeConfig.briefFields.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1.5 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                      {isZh ? field.label : field.labelEn}
                    </label>
                    {field.multiline ? (
                      <textarea
                        className="input min-h-[72px] px-3 py-2"
                        value={briefForm[field.key] as string}
                        onChange={(e) => setBriefForm({ [field.key]: e.target.value } as Partial<BriefFormState>)}
                        placeholder={isZh ? field.placeholder : field.placeholderEn}
                      />
                    ) : (
                      <input
                        className="input h-10 px-3"
                        value={briefForm[field.key] as string}
                        onChange={(e) => setBriefForm({ [field.key]: e.target.value } as Partial<BriefFormState>)}
                        placeholder={isZh ? field.placeholder : field.placeholderEn}
                      />
                    )}
                  </div>
                ))}

                {/* Language + Dark mode row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                      {text('内容语言', 'Content Lang')}
                    </label>
                    <select
                      className="input h-9 px-2 text-xs"
                      value={briefForm.outputLang}
                      onChange={(e) => setBriefForm({ outputLang: e.target.value })}
                    >
                      {OUTPUT_LANGUAGES.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                      {text('暗色', 'Dark')}
                    </label>
                    <button
                      type="button"
                      className="flex h-9 w-16 items-center justify-center rounded-[10px] border text-xs font-medium transition-all"
                      onClick={() => setBriefForm({ darkMode: !briefForm.darkMode })}
                      style={{
                        background: briefForm.darkMode ? '#1e293b' : 'rgba(255,255,255,0.4)',
                        borderColor: briefForm.darkMode ? '#334155' : 'var(--border-subtle)',
                        color: briefForm.darkMode ? '#e2e8f0' : 'var(--text-muted)',
                      }}
                    >
                      {briefForm.darkMode ? '🌙 ON' : '☀️ OFF'}
                    </button>
                  </div>
                </div>

                {/* Direction picker */}
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                    {text('视觉方向', 'Visual Direction')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {directionPresets.map((preset) => {
                      const isActive = preset.id === briefForm.directionId
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          className="rounded-[16px] border px-3 py-2.5 text-left transition-all"
                          onClick={() => setBriefForm({ directionId: preset.id })}
                          style={{
                            background: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.52)',
                            borderColor: isActive ? 'var(--border-accent)' : 'var(--border-subtle)',
                            boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                              {preset.name}
                            </span>
                            {isActive && (
                              <svg className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent)' }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-snug line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                            {preset.summary}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button className="btn btn-primary w-full mt-1" onClick={handleGenerate} disabled={isGenerating}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7Z" />
                  </svg>
                  {isGenerating ? text('生成中...', 'Generating...') : text('根据 brief 生成', 'Generate from brief')}
                </button>
              </div>
            )}
          </div>

          {/* Chat messages */}
          {messages.length > 0 && (
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
                      style={{ background: 'var(--gradient-brand)' }}
                    >
                      <svg className="h-3 w-3 fill-white" viewBox="0 0 24 24">
                        <path d="M4 4h4v16H4V4Zm4 0h4l6 16h-4L9.5 8.5 8 20H4L8 4Z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className="max-w-[85%] rounded-[14px] px-3 py-2 text-sm leading-5"
                    style={{
                      background: msg.role === 'user' ? 'var(--bg-accent-soft)' : 'rgba(255,255,255,0.6)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {msg.summary || msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Thinking animation */}
          {(isAnalyzing || isGenerating) && (
            <div className="flex gap-2 justify-start">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
                style={{ background: 'var(--gradient-brand)' }}
              >
                <svg className="h-3 w-3 fill-white" viewBox="0 0 24 24">
                  <path d="M4 4h4v16H4V4Zm4 0h4l6 16h-4L9.5 8.5 8 20H4L8 4Z" />
                </svg>
              </div>
              <div
                className="flex items-center gap-1.5 rounded-[14px] px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.6)' }}
              >
                <span className="thinking-dot" />
                <span className="thinking-dot" style={{ animationDelay: '0.15s' }} />
                <span className="thinking-dot" style={{ animationDelay: '0.3s' }} />
                <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isAnalyzing ? text('分析中…', 'Analyzing…') : text('生成中…', 'Generating…')}
                </span>
              </div>
            </div>
          )}

          <div className="h-2" />
        </div>
      </div>

      {/* ── Fixed footer ───────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-3 pt-2 space-y-2" style={{ background: 'var(--bg-surface)' }}>

        {/* Quick tweak chips — horizontal scroll, no wrap */}
        {hasContent && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {quickTweaks.map((tweak) => (
              <button
                key={tweak.id}
                type="button"
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onClick={() => handleTweak(tweak)}
                disabled={isGenerating}
              >
                {tweak.label}
              </button>
            ))}
          </div>
        )}

        {/* Unified input card */}
        <div
          className="rounded-[20px] border transition-shadow"
          style={{
            background: 'rgba(255,255,255,0.82)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 2px 8px rgba(61,43,32,0.07)',
          }}
        >
          {/* Image preview inside card */}
          {attachedImage && (
            <div className="flex items-center gap-2 border-b px-3 pt-2.5 pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="relative shrink-0">
                <img
                  src={attachedImage.previewUrl}
                  alt=""
                  className="h-10 w-10 rounded-[8px] object-cover"
                  style={{ border: '1px solid var(--border-subtle)' }}
                />
                <button
                  type="button"
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-white text-[10px] leading-none"
                  style={{ background: 'var(--text-secondary)' }}
                  onClick={() => setAttachedImage(null)}
                >
                  ×
                </button>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {attachedImage && !visionSupported
                  ? text('当前 AI 不支持图像，建议切换到 Claude 或 GPT-4o', 'Provider does not support images — switch to Claude or GPT-4o')
                  : text('图片已附加，发送后以图生页', 'Image attached — will generate from image')}
              </span>
            </div>
          )}

          {/* Textarea */}
          <textarea
            className="block w-full resize-none bg-transparent px-4 pt-3 text-sm outline-none"
            style={{
              minHeight: '52px',
              maxHeight: '140px',
              color: 'var(--text-primary)',
              caretColor: 'var(--accent)',
            }}
            value={chatInput}
            onChange={(e) => {
              setChatInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isGenerating && !isAnalyzing) {
                if (chatInput.trim() || attachedImage) {
                  e.preventDefault()
                  handleCustomChat()
                }
              }
            }}
            placeholder={
              hasContent
                ? text('告诉 Nova 要改什么，或上传图片参考…', 'Tell Nova what to change, or upload an image…')
                : text('描述页面概念，或上传设计图…', 'Describe your page concept, or upload a design…')
            }
            disabled={isGenerating || isAnalyzing}
            rows={1}
          />

          {/* Bottom toolbar inside card */}
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            {/* Left: attach + hint */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                style={{ color: attachedImage ? 'var(--accent-light)' : 'var(--text-disabled)' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                title={text('上传图片', 'Upload image')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </button>
              {isGenerating ? (
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--accent)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {text('生成中…', 'Generating…')}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] select-none" style={{ color: 'var(--text-disabled)' }}>
                  {navigator.platform.startsWith('Mac')
                    ? text('⌘ Enter 发送', '⌘ Enter to send')
                    : text('Ctrl+Enter 发送', 'Ctrl+Enter to send')}
                </span>
              )}
            </div>

            {/* Right: send / stop */}
            {isGenerating ? (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
                style={{ background: 'rgba(203,111,111,0.12)', color: '#c0504d' }}
                onClick={() => useAppStore.getState().abortController?.abort()}
                title={text('停止生成', 'Stop')}
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-30"
                style={(() => {
                  const canSend = !!(chatInput.trim() || attachedImage) && !(attachedImage && !visionSupported && !chatInput.trim())
                  return {
                    background: canSend ? 'var(--gradient-brand)' : 'rgba(0,0,0,0.08)',
                    color: canSend ? 'white' : 'var(--text-disabled)',
                    boxShadow: canSend ? 'var(--shadow-sm)' : 'none',
                  }
                })()}
                onClick={handleCustomChat}
                disabled={(!chatInput.trim() && !attachedImage) || (!!attachedImage && !visionSupported && !chatInput.trim())}
                title={attachedImage && !visionSupported ? text('当前 AI 不支持图像，请先切换到 Claude 或 GPT-4o', 'Provider does not support images — switch to Claude or GPT-4o') : text('发送 (Ctrl+Enter)', 'Send (Ctrl+Enter)')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Template Library Overlay ────────────────────────── */}
      {showTemplates && (
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
              onClick={() => setShowTemplates(false)}
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
                    className="rounded-[14px] border overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                    onClick={() => handleApplyTemplate(tpl)}
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
      )}
    </section>
  )
}
