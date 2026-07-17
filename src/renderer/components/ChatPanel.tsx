import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useLocale } from '../hooks/useLocale'
import { useGenerationEngine } from '../hooks/useGenerationEngine'
import { ImageData, RuntimeAIService } from '../services/runtimeAI'
import {
  buildPageContext,
  buildStructuredPrompt,
  isNewPageRequest,
} from '../utils/chatPanelUtils'
import {
  buildPromptForType,
  buildTweakPromptForType,
  HTML_SAFETY_RULES,
  PAGE_TYPE_CONFIGS,
  PageTemplate,
  QuickTweak,
  VISUAL_QUALITY_RULES,
} from '../services/pageTypes'
import {
  BriefFormState,
  useAppStore,
} from '../stores/appStore'
import type { Message } from '../services/ai'
import { useUIStore } from '../stores/uiStore'
import { useGenerationStore } from '../stores/generationStore'
import BriefFormPanel from './brief/BriefFormPanel'
import ChatCollapsedRail from './chat/ChatCollapsedRail'
import ChatInputCard from './chat/ChatInputCard'
import EmptyState from './chat/EmptyState'
import GenerationProgress from './chat/GenerationProgress'
import MessageList from './chat/MessageList'
import TemplateLibraryOverlay from './chat/TemplateLibraryOverlay'

export default function ChatPanel() {
  const {
    addMessage,
    currentProject,
    messages,
    currentPageId,
    projectPages,
    setCurrentPage,
    addPage,
  } = useAppStore(useShallow((s) => ({
    addMessage: s.addMessage,
    currentProject: s.currentProject,
    messages: s.messages,
    currentPageId: s.currentPageId,
    projectPages: s.projectPages,
    setCurrentPage: s.setCurrentPage,
    addPage: s.addPage,
  })))
  const { setError, chatCollapsed, toggleChatCollapsed } = useUIStore(useShallow((s) => ({ setError: s.setError, chatCollapsed: s.chatCollapsed, toggleChatCollapsed: s.toggleChatCollapsed })))
  const { briefForm, generatedCode, activeGenerationLabel, generationTimeline, setBriefForm } = useGenerationStore(useShallow((s) => ({ briefForm: s.briefForm, generatedCode: s.generatedCode, activeGenerationLabel: s.activeGenerationLabel, generationTimeline: s.generationTimeline, setBriefForm: s.setBriefForm })))
  const { runGeneration, isGenerating, runtimeConfig, selectedDirection, visionSupported } = useGenerationEngine()
  const { locale, text } = useLocale()

  const isZh = locale === 'zh-CN'
  const pageTypeConfigs = useMemo(() => PAGE_TYPE_CONFIGS(isZh), [isZh])
  const activeTypeConfig = useMemo(
    () => pageTypeConfigs.find(c => c.id === briefForm.pageType) || pageTypeConfigs[0],
    [briefForm.pageType, pageTypeConfigs],
  )
  const quickTweaks = activeTypeConfig.tweaks
  const hasContent = generatedCode.trim().length > 0

  const [briefOpen, setBriefOpen] = useState(!hasContent)
  const [briefTab, setBriefTab] = useState<'content' | 'style'>('content')
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


  // Image attachment state
  const [attachedImage, setAttachedImage] = useState<ImageData & { previewUrl: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reject oversized files (> 5 MB) and clear any stale attachment
    if (file.size > 5 * 1024 * 1024) {
      setAttachedImage(null)
      setError(text('图片不能超过 5 MB，请重新选择。', 'Image must be under 5 MB. Please choose another file.'))
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onerror = () => {
      setAttachedImage(null)
      setError(text('图片读取失败，请重试。', 'Failed to read image. Please try again.'))
    }
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

  const [chatInput, setChatInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [pendingGenContext, setPendingGenContext] = useState<string | null>(null)
  const [clarificationDepth, setClarificationDepth] = useState(0)
  const resetClarification = () => { setPendingGenContext(null); setClarificationDepth(0) }

  const buildConversationContext = (latestInstruction: string) => {
    const state = useAppStore.getState()
    const currentPage = state.projectPages.find((page) => page.id === state.currentPageId)
    const recentMessages = state.messages.slice(-12)
    const formatMessage = (message: Message) => {
      const content = (message.summary || message.content || '').replace(/\s+/g, ' ').trim()
      return content ? `${message.role}: ${content.slice(0, 500)}` : ''
    }

    return [
      'CONVERSATION CONTEXT:',
      state.currentProject ? `Project: ${state.currentProject.name}.` : '',
      currentPage ? `Current page: "${currentPage.name}" (${currentPage.path}).` : '',
      briefForm.product ? `Product/name: ${briefForm.product}.` : '',
      briefForm.audience ? `Audience: ${briefForm.audience}.` : '',
      briefForm.goal ? `Goal: ${briefForm.goal}.` : '',
      '',
      'Recent chat:',
      ...recentMessages.map(formatMessage).filter(Boolean),
      '',
      `Latest user instruction: ${latestInstruction || '(image-based request)'}`,
      'Interpret short follow-ups such as "continue", "make it more premium", or "optimize this" as changes to the current page and current HTML. Do not start a new unrelated page unless the user explicitly asks to create a new page or regenerate from scratch.',
    ].filter(Boolean).join('\n')
  }

  const handleGenerate = async () => {
    const pageContext = buildPageContext(projectPages, currentPageId)
    const prompt = [
      buildConversationContext(briefForm.goal || text('根据 brief 生成', 'Generate from brief')),
      buildPromptForType(briefForm, selectedDirection, pageContext),
    ].join('\n\n')
    const description = `${selectedDirection.name} / ${briefForm.goal || text('新概念', 'New concept')}`
    await runGeneration(prompt, text(`生成 ${selectedDirection.name}`, `Generate ${selectedDirection.name}`), description, undefined, false, pageContext, resetClarification)
  }

  const handleTweak = async (tweak: QuickTweak) => {
    if (!generatedCode) return
    const prompt = [
      buildConversationContext(tweak.label),
      buildTweakPromptForType(briefForm, selectedDirection, tweak, generatedCode),
    ].join('\n\n')
    const description = `${tweak.label} / ${briefForm.goal || text('当前页面优化', 'Current page refinement')}`
    await runGeneration(prompt, text(`微调：${tweak.label}`, `Tweak: ${tweak.label}`), description, undefined, false, '', resetClarification)
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
    const label = isZh ? tpl.name : tpl.nameEn
    const prompt = [
      buildConversationContext(label),
      buildPromptForType(newBrief, direction, pageContext),
    ].join('\n\n')
    await runGeneration(prompt, label, label, undefined, false, pageContext, resetClarification)
  }

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
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Clarification check timed out')), 15000)
      )
      const response = await Promise.race([service.generate(prompt, [], false), timeoutPromise])
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

    setCurrentPage(newPage.id)
    const pageContext = buildPageContext(newPages, newPage.id)
    const prompt = [
      buildConversationContext(instruction),
      `Create the "${pageName}" page (path: ${pagePath}).`,
      `Purpose based on user request: ${instruction}`,
      briefForm.product ? `Product: ${briefForm.product}` : '',
      briefForm.audience ? `Audience: ${briefForm.audience}` : '',
      pageContext,
      'Output a complete HTML document with embedded CSS. Keep it fully static.',
    ].filter(Boolean).join('\n')

    setCurrentPage(newPage.id)
    await runGeneration(prompt, text(`生成 ${pageName}`, `Generate ${pageName}`), pageName, undefined, true, '', resetClarification)
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
          buildConversationContext(instruction),
          HTML_SAFETY_RULES,
          VISUAL_QUALITY_RULES,
          '',
          `Revise the HTML page based on: "${fullContext}"`,
          `Visual direction: ${selectedDirection.name}. ${selectedDirection.prompt}`,
          'Return the complete improved HTML document. Keep it fully static, no framework syntax, no external JS.',
          'Every HTML element must use a proper tag name — never output attribute syntax as visible text.',
          'CURRENT HTML:', generatedCode.slice(0, 16000),
        ].join('\n')
        await runGeneration(prompt, instruction, instruction, undefined, true, '', resetClarification)
      } else {
        const extraNotes = briefForm.notes ? `${briefForm.notes}\n${fullContext}` : fullContext
        const prompt = [
          buildConversationContext(instruction),
          buildStructuredPrompt({ ...briefForm, notes: extraNotes }, selectedDirection),
        ].join('\n\n')
        await runGeneration(prompt, instruction, instruction, undefined, true, '', resetClarification)
      }
      return
    }

    // Handle image attachment
    if (imageToSend) {
      const label = instruction || text('以图生页面', 'Create page from image')
      const prompt = [
        buildConversationContext(label),
        instruction ? `Based on the provided image and this instruction: "${instruction}",` : 'Based on the provided image,',
        generatedCode.trim() ? 'revise the existing landing page HTML to match the design shown in the image.' : 'create a complete landing page HTML that captures the style, layout, and visual design shown in the image.',
        `Apply this visual direction: ${selectedDirection.name}. ${selectedDirection.prompt}`,
        'Output a complete, fully static HTML document with embedded CSS.',
        generatedCode.trim() ? `\nCurrent HTML to revise:\n${generatedCode.slice(0, 8000)}` : '',
      ].filter(Boolean).join('\n')
      await runGeneration(prompt, label, label, imageToSend, true, '', resetClarification)
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
        if (clarificationDepth < 1) {
          const result = await runClarificationCheck(instruction)
          if (result.needsClarification) {
            addMessage({ role: 'assistant', content: result.question })
            setPendingGenContext(instruction)
            setClarificationDepth((d) => d + 1)
            setIsAnalyzing(false)
            return
          }
        }
      } catch { /* proceed on error */ }
      setIsAnalyzing(false)

      const extraNotes = briefForm.notes ? `${briefForm.notes}\n${instruction}` : instruction
      const prompt = [
        buildConversationContext(instruction),
        buildStructuredPrompt({ ...briefForm, notes: extraNotes }, selectedDirection),
      ].join('\n\n')
      await runGeneration(prompt, instruction, instruction, undefined, true, '', resetClarification)
      return
    }

    // Modify existing page
    const prompt = [
      buildConversationContext(instruction),
      HTML_SAFETY_RULES,
      VISUAL_QUALITY_RULES,
      '',
      'This is a follow-up edit to the current page. Preserve the current page identity, layout intent, useful content, and navigation unless the user explicitly asks to replace them.',
      `Revise the HTML page based on this instruction: "${instruction}"`,
      `Visual direction: ${selectedDirection.name}. ${selectedDirection.prompt}`,
      'Return the complete improved HTML document. Preserve the overall layout and sections that work well; only modify what the instruction asks for.',
      'CURRENT HTML (revise this):',
      generatedCode.slice(0, 16000),
    ].join('\n')
    await runGeneration(prompt, instruction, instruction, undefined, true, '', resetClarification)
  }

  if (chatCollapsed) {
    return <ChatCollapsedRail onToggle={toggleChatCollapsed} />
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
          <BriefFormPanel
            briefOpen={briefOpen}
            setBriefOpen={setBriefOpen}
            briefTab={briefTab}
            setBriefTab={setBriefTab}
            briefForm={briefForm}
            setBriefForm={setBriefForm}
            isGenerating={isGenerating}
            onShowTemplates={() => setShowTemplates(true)}
            onGenerate={handleGenerate}
          />

          {/* Empty state */}
          {messages.length === 0 && !isGenerating && !isAnalyzing && (
            <EmptyState onPickSuggestion={setChatInput} />
          )}

          {/* Chat messages */}
          {messages.length > 0 && (
            <MessageList messages={messages} messagesEndRef={messagesEndRef} />
          )}

          {/* Generation progress */}
          {(isAnalyzing || isGenerating) && (
            <GenerationProgress
              isAnalyzing={isAnalyzing}
              isGenerating={isGenerating}
              activeGenerationLabel={activeGenerationLabel}
              generationTimeline={generationTimeline}
            />
          )}

          <div className="h-2" />
        </div>
      </div>

      {/* ── Fixed footer ───────────────────────────────────── */}
      <ChatInputCard
        chatInput={chatInput}
        setChatInput={setChatInput}
        attachedImage={attachedImage}
        setAttachedImage={setAttachedImage}
        isGenerating={isGenerating}
        isAnalyzing={isAnalyzing}
        visionSupported={visionSupported}
        hasContent={hasContent}
        onSend={handleCustomChat}
        fileInputRef={fileInputRef}
        onImageSelect={handleImageSelect}
        tweaks={quickTweaks}
        onTweak={handleTweak}
      />

      {/* ── Template Library Overlay ────────────────────────── */}
      {showTemplates && (
        <TemplateLibraryOverlay
          templateFilter={templateFilter}
          setTemplateFilter={setTemplateFilter}
          onClose={() => setShowTemplates(false)}
          onApply={handleApplyTemplate}
          isGenerating={isGenerating}
        />
      )}
    </section>
  )
}
