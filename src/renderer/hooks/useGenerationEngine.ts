import { useMemo } from 'react'
import { useLocale } from '../hooks/useLocale'
import { useAIConfigStore } from '../stores/aiConfigStore'
import { useAppStore } from '../stores/appStore'
import { useUIStore } from '../stores/uiStore'
import { useGenerationStore } from '../stores/generationStore'
import { ImageData, RuntimeAIService, supportsVision } from '../services/runtimeAI'
import { looksIncompleteGeneratedHTML, looksLikeBlankShell } from '../utils/htmlUtils'
import { PAGE_TYPE_CONFIGS } from '../services/pageTypes'
import {
  buildProjectName,
  buildStaticRecoveryPrompt,
  buildTimeline,
  extractInternalLinks,
  failActiveTimeline,
  getTimelineDefinitions,
  sanitizePromptInput,
  updateTimelineStep,
} from '../utils/chatPanelUtils'

export function useGenerationEngine() {
  const isGenerating = useGenerationStore(s => s.isGenerating)
  const { locale, text } = useLocale()
  const { getActiveConfig } = useAIConfigStore()

  const runtimeConfig = useMemo(() => getActiveConfig(), [getActiveConfig])
  const isZh = locale === 'zh-CN'
  const pageTypeConfigs = useMemo(() => PAGE_TYPE_CONFIGS(isZh), [isZh])
  const briefForm = useGenerationStore(s => s.briefForm)
  const selectedDirection = useMemo(() => {
    const activeTypeConfig = pageTypeConfigs.find(c => c.id === briefForm.pageType) || pageTypeConfigs[0]
    return activeTypeConfig.directions.find(p => p.id === briefForm.directionId) || activeTypeConfig.directions[0]
  }, [briefForm, pageTypeConfigs])
  const timelineDefinitions = useMemo(() => getTimelineDefinitions(locale), [locale])

  const visionSupported = supportsVision(runtimeConfig.provider)

  const runGeneration = async (
    prompt: string,
    label: string,
    description: string,
    imageData?: ImageData,
    skipUserMessage = false,
    pageContextHint = '',
    onResetClarification?: () => void,
  ) => {
    const {
      addMessage,
      addProject,
      addVersion,
      updateProject,
      updateCurrentPageCode,
      addPage,
      deletePage,
    } = useAppStore.getState()
    const { setError, setSuccess } = useUIStore.getState()
    const {
      setGenerating,
      setGeneratedCode,
      setGenerationTimeline,
      setAbortController,
      setActiveGenerationLabel,
    } = useGenerationStore.getState()

    if (useGenerationStore.getState().isGenerating) {
      console.warn('Generation already in progress, ignoring duplicate request')
      return
    }

    if (!runtimeConfig?.apiKey) {
      setError(text('请先配置 AI 提供商再开始生成。', 'Please configure an AI provider before generating.'))
      return
    }

    let project = useAppStore.getState().currentProject
    if (!project) {
      await addProject({
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

    if (!skipUserMessage) addMessage({ role: 'user', content: label })

    if (onResetClarification) onResetClarification()
    setError(null)
    setSuccess(null)
    setGenerating(true)
    setAbortController(controller)
    setActiveGenerationLabel(label)
    setGenerationTimeline(buildTimeline(timelineDefinitions))

    const stubPageIds: string[] = []
    const currentMessages = useAppStore.getState().messages
    const conversationHistory = currentMessages
      .filter((message) => message.content?.trim())
      .slice(-12)
      .map((message) => ({ ...message, content: (message.summary || message.content).slice(0, 1200) }))
    const previousGeneratedCode = useGenerationStore.getState().generatedCode
    let firstChunkTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      setActiveGenerationLabel(text('等待模型响应…', 'Waiting for model response…'))
    }, 20000)

    try {
      updateTimelineStep(useGenerationStore.getState().generationTimeline, setGenerationTimeline, 'brief', 'completed')
      updateTimelineStep(useGenerationStore.getState().generationTimeline, setGenerationTimeline, 'structure', 'active')

      let rawBuffer = ''
      let lastPreviewUpdate = 0
      let structureDone = false
      let visualDone = false
      for await (const chunk of service.stream(prompt, conversationHistory, controller.signal, imageData)) {
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
        if (firstChunkTimer) {
          clearTimeout(firstChunkTimer)
          firstChunkTimer = null
          setActiveGenerationLabel(label)
        }
        rawBuffer += chunk

        if (!structureDone) {
          structureDone = true
          updateTimelineStep(useGenerationStore.getState().generationTimeline, setGenerationTimeline, 'structure', 'completed')
          updateTimelineStep(useGenerationStore.getState().generationTimeline, setGenerationTimeline, 'visual', 'active')
        }
        if (!visualDone && rawBuffer.length > 400) {
          visualDone = true
          updateTimelineStep(useGenerationStore.getState().generationTimeline, setGenerationTimeline, 'visual', 'completed')
          updateTimelineStep(useGenerationStore.getState().generationTimeline, setGenerationTimeline, 'html', 'active')
        }

        const now = Date.now()
        if (now - lastPreviewUpdate > 600) {
          const partial = service.extractHTML(rawBuffer)
          if (partial.length > 200 && !looksIncompleteGeneratedHTML(partial) && !looksLikeBlankShell(partial)) {
            setGeneratedCode(partial)
          }
          lastPreviewUpdate = now
        }
      }

      let html = service.extractHTML(rawBuffer)
      if (looksLikeBlankShell(html) || looksIncompleteGeneratedHTML(html)) {
        let recoveryBuffer = ''
        const recoveryPrompt = looksIncompleteGeneratedHTML(html)
          ? [
              'The previous response was cut off or produced incomplete HTML/CSS.',
              'Regenerate the entire result from scratch as one complete, valid HTML document.',
              'The output must include <!DOCTYPE html>, <html>, <head>, <style>, <body>, and all closing tags.',
              'Do not continue from the broken output. Return the full corrected page only.',
              'Original request:',
              pageContextHint ? `${pageContextHint}\n\n${prompt}` : prompt,
              'Broken output excerpt:',
              html.slice(-3000),
            ].join('\n')
          : buildStaticRecoveryPrompt(
              pageContextHint ? `${pageContextHint}\n\n${prompt}` : prompt,
              html,
            )
        for await (const chunk of service.stream(recoveryPrompt, conversationHistory.slice(-6), controller.signal)) {
          if (controller.signal.aborted) break
          recoveryBuffer += chunk
        }
        const recoveredHtml = service.extractHTML(recoveryBuffer)
        if (!looksIncompleteGeneratedHTML(recoveredHtml) && !looksLikeBlankShell(recoveredHtml)) {
          html = recoveredHtml
        }
      }
      if (looksIncompleteGeneratedHTML(html)) {
        throw new Error(text('模型返回的 HTML/CSS 不完整，请调大 Max Tokens 或换一个支持长输出的模型。', 'The model returned incomplete HTML/CSS. Increase Max Tokens or use a model that supports longer output.'))
      }
      if (looksLikeBlankShell(html)) {
        throw new Error(text('模型返回的是空白页面或无效 HTML，请换一个模型、补充更具体的页面内容，或调大 Max Tokens 后重试。', 'The model returned a blank page or invalid HTML. Try another model, add more specific page content, or increase Max Tokens.'))
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
      addMessage({ role: 'assistant', content: description, summary: `${selectedDirection.name} / ${description}` })

      updateTimelineStep(useGenerationStore.getState().generationTimeline, setGenerationTimeline, 'html', 'completed')

      addMessage({
        role: 'assistant',
        content: text('✅ 页面已生成完成！你可以在右侧预览效果，或继续告诉我需要调整的地方。', '✅ Page generated! Preview it on the right, or tell me what to change.'),
        summary: text('✅ 页面生成完成', '✅ Page generated'),
      })

      const linkedLinks = extractInternalLinks(html)
      const afterMainPages = useAppStore.getState().projectPages
      const existingPaths = new Set(afterMainPages.map((p) => p.path))
      const newLinks = linkedLinks.filter((l) => !existingPaths.has(l.path))
      const currentPageId = useAppStore.getState().currentPageId

      if (newLinks.length === 0) {
        setSuccess(text(`${label} 已完成`, `${label} completed`))
      } else {
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
            `Create the "${sanitizePromptInput(newPage.name)}" page (path: ${newPage.path}) for this multi-page product.`,
            entry.linkText ? `The navigation link that leads here is labeled: "${sanitizePromptInput(entry.linkText)}". The page content should match this label's purpose and scope.` : '',
            `This page is navigated to from the "${sanitizePromptInput(currentPageName)}" page.`,
            briefForm.product ? `Product/brand: ${sanitizePromptInput(briefForm.product)}.` : '',
            briefForm.audience ? `Target audience: ${sanitizePromptInput(briefForm.audience)}.` : '',
            briefForm.goal ? `Overall product goal: ${sanitizePromptInput(briefForm.goal)}.` : '',
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
      stubPageIds.forEach((id) => {
        const p = useAppStore.getState().projectPages.find((pg) => pg.id === id)
        if (p && !p.code.trim()) deletePage(id)
      })
      if ((error as Error).name !== 'AbortError') {
        failActiveTimeline(useGenerationStore.getState().generationTimeline, setGenerationTimeline)
        setGeneratedCode(previousGeneratedCode)
        setError((error as Error).message || text('生成失败', 'Generation failed'))
      }
    } finally {
      if (firstChunkTimer) clearTimeout(firstChunkTimer)
      setAbortController(null)
      setGenerating(false)
      setActiveGenerationLabel(null)
    }
  }

  return { runGeneration, isGenerating, runtimeConfig, selectedDirection, visionSupported }
}
