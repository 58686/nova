import { useMemo } from 'react'
import { useLocale } from '../hooks/useLocale'
import { Locale } from '../locale'
import { RuntimeAIService } from '../services/runtimeAI'
import { useAIConfigStore } from '../stores/aiConfigStore'
import {
  BriefFormState,
  DEFAULT_BRIEF_FORM,
  GenerationTimelineStep,
  useAppStore,
} from '../stores/appStore'

type DirectionPreset = {
  id: string
  name: string
  summary: string
  visualCue: string
  prompt: string
}

type QuickTweak = {
  id: string
  label: string
  instruction: string
}

function getDirectionPresets(locale: Locale): DirectionPreset[] {
  const isZh = locale === 'zh-CN'

  return [
    {
      id: 'editorial-premium',
      name: isZh ? '高级感' : 'Editorial Premium',
      summary: isZh ? '留白充足，层次克制，像高端品牌官网。' : 'Airy spacing, refined hierarchy, and a premium brand-site feel.',
      visualCue: 'Editorial / Premium',
      prompt:
        'Use an editorial premium art direction with elegant typography, restrained palette, refined spacing, layered cards, and a polished high-end brand feel.',
    },
    {
      id: 'clean-minimal',
      name: isZh ? '更简洁' : 'Clean Minimal',
      summary: isZh ? '信息密度更轻，模块更少，更干净。' : 'Lower information density, fewer motifs, and a cleaner composition.',
      visualCue: 'Minimal / Clean',
      prompt:
        'Keep the composition minimal and calm with fewer visual motifs, cleaner blocks, concise copy, and stronger whitespace discipline.',
    },
    {
      id: 'saas-conversion',
      name: isZh ? '偏 SaaS' : 'SaaS Product',
      summary: isZh ? '更像软件官网，强调产品结构与可信度。' : 'Feels more like a software landing page with strong hierarchy and credibility.',
      visualCue: 'SaaS / Product',
      prompt:
        'Shape it like a modern SaaS landing page with strong product hierarchy, proof blocks, feature storytelling, UI-like cards, and operational credibility.',
    },
    {
      id: 'bold-campaign',
      name: isZh ? '强转化' : 'Campaign Conversion',
      summary: isZh ? '主视觉更强，CTA 更突出，节奏更抓人。' : 'Bolder hero treatment, clearer CTA pressure, and more campaign energy.',
      visualCue: 'Campaign / Conversion',
      prompt:
        'Push for a campaign-oriented conversion page with a bolder hero, higher contrast CTA moments, persuasive social proof, urgency cues, and denser conversion framing.',
    },
  ]
}

function getQuickTweaks(locale: Locale): QuickTweak[] {
  const isZh = locale === 'zh-CN'

  return [
    {
      id: 'premium',
      label: isZh ? '更高级' : 'More Premium',
      instruction: 'Elevate the page to feel more premium, more intentional, and more design-led without hurting readability.',
    },
    {
      id: 'minimal',
      label: isZh ? '更简洁' : 'More Minimal',
      instruction: 'Reduce visual noise, simplify the structure, and make the page feel cleaner and more focused.',
    },
    {
      id: 'saas',
      label: isZh ? '更偏 SaaS' : 'More SaaS',
      instruction: 'Make the page feel more like a polished SaaS product landing page with clearer product hierarchy and proof modules.',
    },
    {
      id: 'conversion',
      label: isZh ? '更强转化' : 'More Conversion',
      instruction: 'Increase conversion intent with sharper messaging, more compelling CTA hierarchy, and stronger persuasion blocks.',
    },
  ]
}

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

function buildStructuredPrompt(brief: BriefFormState, direction: DirectionPreset) {
  const sections = brief.sections
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')

  return [
    'Create a complete production-style single-page HTML experience.',
    `Product or brand: ${brief.product || 'A modern digital product'}.`,
    `Target audience: ${brief.audience || 'Prospective customers evaluating the offer'}.`,
    `Primary goal: ${brief.goal || 'Convince visitors and drive the main CTA'}.`,
    `Required sections: ${sections || 'Hero, trust proof, features, CTA, footer'}.`,
    `Visual direction preset: ${direction.name}. ${direction.prompt}`,
    brief.notes ? `Additional notes: ${brief.notes}` : '',
    'The output must be one complete HTML document with embedded CSS and realistic copy.',
    'Render the visible page directly with semantic HTML and inline CSS. Do not output a React/Vue/Svelte app shell, a root div placeholder, or framework-dependent code.',
    'Do not rely on external JavaScript to populate the page after load. Tiny vanilla JS is acceptable only for minor UI interactions.',
    'Do not use canvas, WebGL, Three.js, ECharts, Chart.js, D3, GSAP timelines, or any script-driven rendering for the main experience.',
    'If the design needs charts or dashboards, mock them with static HTML, CSS, and inline SVG so the preview is fully visible without scripts.',
    'Ensure the first screen is visibly populated with a heading, supporting copy, and at least one CTA using strong text contrast.',
    'Make the design responsive, polished, and ready for preview in a browser.',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildTweakPrompt(brief: BriefFormState, direction: DirectionPreset, tweak: QuickTweak, html: string) {
  return [
    'You are revising an existing landing page HTML artifact.',
    `Original brief context: product=${brief.product || 'unspecified'}, audience=${brief.audience || 'unspecified'}, goal=${brief.goal || 'unspecified'}.`,
    `Keep the chosen visual direction aligned with ${direction.name}. ${direction.prompt}`,
    `Tweak goal: ${tweak.instruction}`,
    'Return a full improved HTML document, not notes.',
    'Keep it fully static and directly previewable: no React/Vue/Svelte shells, no root placeholder, and no external JS required to reveal content.',
    'Avoid canvas- or library-driven rendering. If charts are needed, draw them with static HTML, CSS, and inline SVG only.',
    'Preserve the page purpose while improving layout, copy hierarchy, and visuals.',
    'Current HTML artifact:',
    html,
  ].join('\n')
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
    generationTimeline,
    isGenerating,
    messages,
    projects,
    setAbortController,
    setActiveGenerationLabel,
    setBriefForm,
    setError,
    setGeneratedCode,
    setGenerating,
    setGenerationTimeline,
    setSuccess,
    updateProject,
    variantCandidates,
    versions,
  } = useAppStore()
  const { activePresetId, presets, getActiveConfig } = useAIConfigStore()
  const { locale, text } = useLocale()

  const directionPresets = useMemo(() => getDirectionPresets(locale), [locale])
  const quickTweaks = useMemo(() => getQuickTweaks(locale), [locale])
  const timelineDefinitions = useMemo(() => getTimelineDefinitions(locale), [locale])

  const selectedDirection = useMemo(
    () => directionPresets.find((preset) => preset.id === briefForm.directionId) || directionPresets[0],
    [briefForm.directionId, directionPresets],
  )
  const hasContent = generatedCode.trim().length > 0

  const latestTimeline = useMemo(() => {
    const localizedMap = new Map(timelineDefinitions.map((step) => [step.id, step]))
    const baseTimeline = generationTimeline.length > 0 ? generationTimeline : buildTimeline(timelineDefinitions)

    return baseTimeline.map((step) => ({
      ...step,
      ...localizedMap.get(step.id),
      status: step.status,
    }))
  }, [generationTimeline, timelineDefinitions])

  const runtimeConfig = useMemo(() => getActiveConfig() || aiConfig, [activePresetId, aiConfig, getActiveConfig, presets])

  const runGeneration = async (prompt: string, label: string, description: string) => {
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

    setError(null)
    setSuccess(null)
    setGenerating(true)
    setAbortController(controller)
    setActiveGenerationLabel(label)
    setGenerationTimeline(buildTimeline(timelineDefinitions))

    try {
      await wait(180)
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      updateTimelineStep(setGenerationTimeline, 'brief', 'completed')
      updateTimelineStep(setGenerationTimeline, 'structure', 'active')

      await wait(180)
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      updateTimelineStep(setGenerationTimeline, 'structure', 'completed')
      updateTimelineStep(setGenerationTimeline, 'visual', 'active')

      const response = await service.generate(prompt, messages.slice(-4))
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')

      updateTimelineStep(setGenerationTimeline, 'visual', 'completed')
      updateTimelineStep(setGenerationTimeline, 'html', 'active')

      let html = service.extractHTML(response)
      if (looksLikeBlankShell(html)) {
        const recoveryResponse = await service.generate(buildStaticRecoveryPrompt(prompt, html), messages.slice(-2))
        html = service.extractHTML(recoveryResponse)
      }
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')

      setGeneratedCode(html)
      updateProject(project.id, {
        code: html,
        description,
        name: project.name || buildProjectName(briefForm, locale),
      })
      addVersion({
        code: html,
        description,
        generationTarget: 'full-page',
        generationMode: 'single',
      })
      addMessage({ role: 'user', content: label })
      addMessage({ role: 'assistant', content: description, summary: `${selectedDirection.name} / ${description}` })

      updateTimelineStep(setGenerationTimeline, 'html', 'completed')
      setSuccess(text(`${label} 已完成`, `${label} completed`))
    } catch (error) {
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
    const prompt = buildStructuredPrompt(briefForm, selectedDirection)
    const description = `${selectedDirection.name} / ${briefForm.goal || text('新的落地页概念', 'New landing page concept')}`
    await runGeneration(prompt, text(`生成 ${selectedDirection.name} 页面`, `Generate ${selectedDirection.name} page`), description)
  }

  const handleTweak = async (tweak: QuickTweak) => {
    if (!generatedCode) return
    const prompt = buildTweakPrompt(briefForm, selectedDirection, tweak, generatedCode)
    const description = `${tweak.label} / ${briefForm.goal || text('当前页面优化', 'Current page refinement')}`
    await runGeneration(prompt, text(`微调：${tweak.label}`, `Tweak: ${tweak.label}`), description)
  }

  const promptPreview = useMemo(() => buildStructuredPrompt(briefForm, selectedDirection), [briefForm, selectedDirection])

  return (
    <section className="shell-panel flex min-w-0 w-[340px] xl:w-[360px] 2xl:w-[370px] shrink-0 flex-col overflow-hidden rounded-[28px]">
      <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              {text('创作工作台', 'Artifact Studio')}
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {text('Brief、方向与微调', 'Brief, Direction, Tweaks')}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {text('把页面当成一个持续演化的成果，而不是一段段孤立提示词。', 'Treat the page as one evolving artifact instead of separate prompts and outputs.')}
            </p>
          </div>
          <span className={`badge ${isGenerating ? 'badge-success' : 'badge-accent'}`}>
            {isGenerating ? text('生成中', 'Generating') : text('已就绪', 'Ready')}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge badge-accent">{currentProject?.name || text('还没有项目', 'No project yet')}</span>
          <span className="badge badge-accent">{text(`${versions.length} 个版本`, `${versions.length} versions`)}</span>
          <span className="badge badge-accent">{text(`${variantCandidates.length} 个候选`, `${variantCandidates.length} candidates`)}</span>
          <span className="badge badge-accent">{text(`${projects.length} 个项目`, `${projects.length} projects`)}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
        <div className="space-y-5">
          <div className="panel-card rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('问题表单', 'Question Form')}
                </p>
                <h3 className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {text('首次生成', 'First-pass generation')}
                </h3>
              </div>
              <button
                className="rounded-full px-3 py-1 text-xs"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                onClick={() => setBriefForm(DEFAULT_BRIEF_FORM)}
                type="button"
              >
                {text('重置', 'Reset')}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('产品 / 品牌', 'Product / Brand')}
                </label>
                <input
                  className="input h-11 px-3"
                  value={briefForm.product}
                  onChange={(event) => setBriefForm({ product: event.target.value })}
                  placeholder={text('Nova Analytics、AI 发票工具、高端设计工作室...', 'Nova Analytics, AI invoicing app, premium design studio...')}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('目标受众', 'Audience')}
                </label>
                <input
                  className="input h-11 px-3"
                  value={briefForm.audience}
                  onChange={(event) => setBriefForm({ audience: event.target.value })}
                  placeholder={text('创业公司创始人、RevOps 团队、创作者、企业采购...', 'Startup founders, RevOps teams, creators, enterprise buyers...')}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('目标', 'Goal')}
                </label>
                <input
                  className="input h-11 px-3"
                  value={briefForm.goal}
                  onChange={(event) => setBriefForm({ goal: event.target.value })}
                  placeholder={text('推动预约演示、解释产品、发布新功能...', 'Drive demo bookings, explain the product, launch a new feature...')}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('必备区块', 'Required Sections')}
                </label>
                <input
                  className="input h-11 px-3"
                  value={briefForm.sections}
                  onChange={(event) => setBriefForm({ sections: event.target.value })}
                  placeholder={text('Hero、功能区、用户评价、定价、CTA...', 'Hero, feature grid, testimonials, pricing, CTA...')}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('补充说明', 'Notes')}
                </label>
                <textarea
                  className="input min-h-[126px] px-3 py-3"
                  value={briefForm.notes}
                  onChange={(event) => setBriefForm({ notes: event.target.value })}
                  placeholder={text('语气、参考站点、限制条件、文案风格、必须出现的证明信息...', 'Tone, references, constraints, desired copy style, must-have proof points...')}
                />
              </div>
            </div>
          </div>

          <div className="panel-card rounded-[24px] p-4">
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              {text('方向选择', 'Direction Picker')}
            </p>
            <h3 className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {text('视觉方向预设', 'Visual direction presets')}
            </h3>

            <div className="mt-4 space-y-2">
              {directionPresets.map((preset) => {
                const isActive = preset.id === briefForm.directionId
                return (
                  <button
                    key={preset.id}
                    className="w-full rounded-[20px] border p-3 text-left transition-all"
                    onClick={() => setBriefForm({ directionId: preset.id })}
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.52)',
                      borderColor: isActive ? 'var(--border-accent)' : 'var(--border-subtle)',
                      boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {preset.name}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {preset.visualCue}
                        </div>
                      </div>
                      {isActive && <span className="badge badge-success">{text('已选择', 'Selected')}</span>}
                    </div>
                    <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                      {preset.summary}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 rounded-[18px] px-3 py-3" style={{ background: 'rgba(255,255,255,0.46)' }}>
              <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                {text('当前方向提示词', 'Active direction prompt')}
              </div>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                {selectedDirection.prompt}
              </p>
            </div>

            <button className="btn btn-primary mt-4 w-full" onClick={handleGenerate} disabled={isGenerating}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7Z" />
              </svg>
              {isGenerating ? text('生成中...', 'Generating...') : text('根据 brief 生成', 'Generate from brief')}
            </button>
          </div>

          <div className="panel-card rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {text('快捷微调', 'Quick Tweaks')}
                </p>
                <h3 className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {text('一键精修', 'One-click refinement')}
                </h3>
              </div>
              {!hasContent && <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>{text('先生成页面', 'Generate first')}</span>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {quickTweaks.map((tweak) => (
                <button
                  key={tweak.id}
                  className="rounded-[18px] border px-3 py-3 text-left text-sm transition-all disabled:cursor-not-allowed disabled:opacity-55"
                  style={{ background: 'rgba(255,255,255,0.54)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  onClick={() => handleTweak(tweak)}
                  disabled={!hasContent || isGenerating}
                >
                  {tweak.label}
                </button>
              ))}
            </div>

            <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {hasContent
                ? text('每个 tweak 都会保留当前成果上下文，让模型在已有页面上继续修改，而不是从零开始。', 'Each tweak keeps the current artifact context and asks the model to revise the existing page, not start from zero.')
                : text('第一次生成完成后，这些动作会成为更快的精修入口。', 'Once the first page is generated, these actions become fast entry points for refinement.')}
            </p>
          </div>

          <div className="panel-card rounded-[24px] p-4">
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              {text('生成时间线', 'Generation Timeline')}
            </p>
            <h3 className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {text('明确的过程状态', 'Explicit process states')}
            </h3>

            <div className="mt-4 space-y-3">
              {latestTimeline.map((step, index) => {
                const isCompleted = step.status === 'completed'
                const isActive = step.status === 'active'
                const isError = step.status === 'error'

                return (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          background: isCompleted
                            ? 'rgba(91, 155, 122, 0.16)'
                            : isActive
                              ? 'rgba(181, 135, 109, 0.16)'
                              : isError
                                ? 'rgba(203, 111, 111, 0.16)'
                                : 'rgba(255,255,255,0.56)',
                          color: isCompleted
                            ? 'var(--success)'
                            : isActive
                              ? 'var(--accent-dark)'
                              : isError
                                ? 'var(--danger)'
                                : 'var(--text-disabled)',
                        }}
                      >
                        {isCompleted ? 'OK' : index + 1}
                      </div>
                      {index < latestTimeline.length - 1 && (
                        <div className="mt-2 h-8 w-px" style={{ background: 'var(--border-default)' }} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 rounded-[18px] px-3 py-2" style={{ background: 'rgba(255,255,255,0.42)' }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {step.label}
                        </div>
                        <span className={`badge ${isCompleted ? 'badge-success' : 'badge-accent'}`}>
                          {isCompleted ? text('完成', 'Done') : isActive ? text('进行中', 'Running') : isError ? text('出错', 'Error') : text('排队中', 'Queued')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="panel-card rounded-[24px] p-4">
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              {text('提示词预览', 'Prompt Preview')}
            </p>
            <pre
              className="mt-3 whitespace-pre-wrap rounded-[18px] px-3 py-3 text-xs leading-6"
              style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
            >
              {promptPreview}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
