import { AIConfig, AIProvider, Message, ModelsResponse, TestResult } from './ai'

export const DEFAULT_SYSTEM_PROMPT = `You are an expert UI designer and frontend engineer who writes production-quality HTML and CSS.

CORE PRINCIPLES:
- Take your time. Build the page deliberately — structure first, then visual polish, then output. Do not rush.
- Be thorough. Cover responsive breakpoints, interactive states, and edge cases. Pixel-perfect intentionality.
- Never output placeholders. Every line of content — names, numbers, labels, paragraphs — must read like a real product.
- Self-contained: one complete HTML file, all CSS in <style>, zero external JS. Google Fonts @import is the only allowed external resource.
- Pure HTML/CSS only. No React, Vue, Svelte, JSX, or template variables of any kind.
- Follow the detailed output rules in the user's message exactly — they exist for a reason.`

const ANTHROPIC_MODELS = [
  'claude-opus-4-8',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'claude-opus-4-5',
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307',
]

export type ImageData = {
  base64: string
  mimeType: string
}

// Providers that support image input in their messages API
const VISION_PROVIDERS = new Set<AIProvider>(['anthropic', 'openai', 'openrouter', 'custom', 'moonshot', 'qwen', 'deepseek', 'baichuan'])

export function supportsVision(provider: AIProvider): boolean {
  return VISION_PROVIDERS.has(provider)
}

export class RuntimeAIService {
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = { ...config }
  }

  async testConnection(): Promise<TestResult> {
    const start = Date.now()
    const timeout = 30000 // 30s timeout
    const attempt = async (): Promise<string> => {
      return this.generate('回复"连接成功"四个字', [], true)
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection test timed out after 30s')), timeout)
    )

    try {
      const response = await Promise.race([attempt(), timeoutPromise])
      return { success: true, latency: Date.now() - start, model: this.config.model, response: response.slice(0, 100) }
    } catch {
      // One retry after 1s
      await new Promise(r => setTimeout(r, 1000))
      try {
        const response = await Promise.race([attempt(), timeoutPromise])
        return { success: true, latency: Date.now() - start, model: this.config.model, response: response.slice(0, 100) }
      } catch (error: unknown) {
        return { success: false, latency: Date.now() - start, error: error instanceof Error ? error.message : '连接失败' }
      }
    }
  }

  async generate(prompt: string, history: Message[] = [], isTest = false, imageData?: ImageData): Promise<string> {
    const messages: Message[] = [...history, { role: 'user', content: prompt }]

    switch (this.config.provider) {
      case 'anthropic':
        return this.callAnthropic(messages, isTest, imageData)
      case 'openrouter':
        return this.callOpenRouter(messages, isTest, imageData)
      case 'zhipu':
        return this.callZhipu(messages, isTest)
      case 'openai':
      case 'deepseek':
      case 'qwen':
      case 'moonshot':
      case 'minimax':
      case 'baichuan':
      case 'nvidia':
      case 'custom':
        return this.callOpenAICompatible(messages, isTest, imageData)
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`)
    }
  }

  async *stream(prompt: string, history: Message[] = [], signal?: AbortSignal, imageData?: ImageData): AsyncGenerator<string, void, unknown> {
    const messages: Message[] = [...history, { role: 'user', content: prompt }]

    // When running in Electron, use IPC streaming proxy so chunks arrive progressively
    if (typeof window !== 'undefined' && window.electronAPI?.proxyStream) {
      switch (this.config.provider) {
        case 'anthropic':
          yield* this.streamAnthropicViaIPC(messages, signal, imageData)
          return
        case 'openrouter':
          yield* this.streamOpenAIViaIPC(messages, signal, `${this.normalizeBaseUrl(this.config.baseUrl)}/v1/chat/completions`, {
            Authorization: `Bearer ${this.config.apiKey}`,
            'HTTP-Referer': 'https://devui.app',
            'X-Title': 'Nova',
          }, imageData)
          return
        case 'openai':
        case 'deepseek':
        case 'qwen':
        case 'moonshot':
        case 'minimax':
        case 'baichuan':
        case 'nvidia':
        case 'custom':
          yield* this.streamOpenAIViaIPC(messages, signal, this.buildChatUrl(), this.getAuthHeaders(this.config.provider), imageData)
          return
        default:
          yield await this.generate(prompt, history)
          return
      }
    }

    switch (this.config.provider) {
      case 'anthropic':
        yield* this.streamAnthropic(messages, signal, imageData)
        break
      case 'openrouter':
        yield* this.streamOpenAICompatible(messages, signal, `${this.normalizeBaseUrl(this.config.baseUrl)}/v1/chat/completions`, {
          Authorization: `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://devui.app',
          'X-Title': 'Nova',
        }, imageData)
        break
      case 'openai':
      case 'deepseek':
      case 'qwen':
      case 'moonshot':
      case 'minimax':
      case 'baichuan':
      case 'nvidia':
      case 'custom':
        yield* this.streamOpenAICompatible(messages, signal, this.buildChatUrl(), this.getAuthHeaders(this.config.provider), imageData)
        break
      default:
        yield await this.generate(prompt, history)
    }
  }

  // ── IPC streaming helpers (Electron packaged app) ─────────────────────────

  private ipcStreamRaw(url: string, headers: Record<string, string>, body: object, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
    const api = window.electronAPI!
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const queue: string[] = []
    let done = false
    let wakeup: (() => void) | null = null

    const onChunk = (chunk: string) => { queue.push(chunk); wakeup?.(); wakeup = null }

    const streamPromise = api.proxyStream(
      { id, url, method: 'POST', headers, body: JSON.stringify(body), timeout: 300000 },
      onChunk,
    ).then((res) => {
      if (!res.ok) throw new Error(`API error (${res.status}): ${(res.body ?? '').slice(0, 200)}`)
    }).finally(() => { done = true; wakeup?.(); wakeup = null })

    signal?.addEventListener('abort', () => { done = true; wakeup?.(); wakeup = null })

    return (async function* () {
      while (true) {
        if (queue.length > 0) { yield queue.shift()!; continue }
        if (done) break
        await new Promise<void>((r) => { wakeup = r })
      }
      await streamPromise
    })()
  }

  private async *streamAnthropicViaIPC(messages: Message[], signal?: AbortSignal, imageData?: ImageData): AsyncGenerator<string, void, unknown> {
    const url = `${this.normalizeBaseUrl(this.config.baseUrl)}/v1/messages`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01',
      ...this.config.customHeaders,
    }
    const body = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: true,
      system: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      messages: this.buildAnthropicMessages(messages, imageData),
    }
    let buf = ''
    for await (const raw of this.ipcStreamRaw(url, headers, body, signal)) {
      buf += raw
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data || data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') yield parsed.delta.text as string
        } catch { /* skip */ }
      }
    }
  }

  private async *streamOpenAIViaIPC(messages: Message[], signal: AbortSignal | undefined, url: string, extraHeaders: Record<string, string>, imageData?: ImageData): AsyncGenerator<string, void, unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extraHeaders, ...this.config.customHeaders }
    const body = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: true,
      messages: this.buildOpenAIMessages(messages, imageData),
    }
    let buf = ''
    for await (const raw of this.ipcStreamRaw(url, headers, body, signal)) {
      buf += raw
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data || data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const text = parsed.choices?.[0]?.delta?.content
          if (text) yield text as string
        } catch { /* skip */ }
      }
    }
  }

  private buildAnthropicMessages(messages: Message[], imageData?: ImageData) {
    const sliced = messages.slice(-10)
    return sliced.map((m, i) => {
      if (i === sliced.length - 1 && m.role === 'user' && imageData) {
        return {
          role: m.role,
          content: [
            { type: 'image', source: { type: 'base64', media_type: imageData.mimeType, data: imageData.base64 } },
            { type: 'text', text: m.content },
          ],
        }
      }
      return { role: m.role, content: m.content }
    })
  }

  private buildOpenAIMessages(messages: Message[], imageData?: ImageData) {
    const sliced = messages.slice(-5)
    return sliced.map((m, i) => {
      if (i === sliced.length - 1 && m.role === 'user' && imageData) {
        return {
          role: m.role,
          content: [
            { type: 'image_url', image_url: { url: `data:${imageData.mimeType};base64,${imageData.base64}` } },
            { type: 'text', text: m.content },
          ],
        }
      }
      return { role: m.role, content: m.content }
    })
  }

  private async *streamAnthropic(messages: Message[], signal?: AbortSignal, imageData?: ImageData): AsyncGenerator<string, void, unknown> {
    const url = this.getProxyUrl(`${this.normalizeBaseUrl(this.config.baseUrl)}/v1/messages`)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        ...this.config.customHeaders,
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: true,
        system: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        messages: this.buildAnthropicMessages(messages, imageData),
      }),
      signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`API error (${response.status}): ${text.slice(0, 300)}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              yield parsed.delta.text as string
            }
          } catch { /* skip malformed SSE lines */ }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private async *streamOpenAICompatible(
    messages: Message[],
    signal: AbortSignal | undefined,
    url: string,
    extraHeaders: Record<string, string>,
    imageData?: ImageData,
  ): AsyncGenerator<string, void, unknown> {
    const proxyUrl = this.getProxyUrl(url)
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...this.config.customHeaders,
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: true,
        messages: [
          { role: 'system', content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
          ...this.buildOpenAIMessages(messages, imageData),
        ],
      }),
      signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`API error (${response.status}): ${text.slice(0, 300)}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const text = parsed.choices?.[0]?.delta?.content
            if (text) yield text
          } catch { /* skip malformed SSE lines */ }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async fetchModels(): Promise<ModelsResponse> {
    if (this.config.provider === 'anthropic') {
      return { success: true, models: ANTHROPIC_MODELS }
    }

    try {
      const url = this.getModelsUrl(this.config.provider)
      const headers = this.getAuthHeaders(this.config.provider)
      const response = await this.performRequest(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        return {
          success: false,
          models: this.getDefaultModels(this.config.provider),
          error: `API error (${response.status}): ${await response.text()}`,
        }
      }

      const data = await response.json()
      const models = this.parseModels(data)

      return {
        success: true,
        models: models.length > 0 ? models : this.getDefaultModels(this.config.provider),
      }
    } catch (error: unknown) {
      return {
        success: true,
        models: this.getDefaultModels(this.config.provider),
        error: error instanceof Error ? error.message : 'Failed to fetch models',
      }
    }
  }

  extractHTML(response: string): string {
    let cleaned = response.trim()
    cleaned = cleaned.replace(/^```(?:html|HTML)?\s*\n?/g, '')
    cleaned = cleaned.replace(/\n?```\s*$/g, '')
    cleaned = cleaned.trim()

    const fullHtml = cleaned.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
    if (fullHtml) {
      cleaned = fullHtml[0].trim()
    } else {
      const htmlTag = cleaned.match(/<html[\s\S]*<\/html>/i)
      if (htmlTag) {
        cleaned = htmlTag[0].trim()
      }
    }

    cleaned = this.normalizeHTMLDocument(cleaned)

    if (!cleaned.includes('</html>') || !cleaned.includes('</body>')) {
      cleaned = this.fixIncompleteHTML(cleaned)
    }

    if (!cleaned.includes('<!DOCTYPE')) {
      cleaned = this.wrapInHTML(cleaned)
    }

    return cleaned
  }

  private async callAnthropic(messages: Message[], isTest: boolean, imageData?: ImageData): Promise<string> {
    const response = await this.performRequest(`${this.normalizeBaseUrl(this.config.baseUrl)}/v1/messages`, {
      method: 'POST',
      headers: {
        ...this.getBaseHeaders(),
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: isTest ? 100 : this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        messages: this.buildAnthropicMessages(messages, isTest ? undefined : imageData),
      }),
    })

    const data = await this.parseResponse(response)
    return this.extractText(data, 'anthropic')
  }

  private async callOpenAICompatible(messages: Message[], isTest: boolean, imageData?: ImageData): Promise<string> {
    const response = await this.performRequest(this.buildChatUrl(), {
      method: 'POST',
      headers: {
        ...this.getBaseHeaders(),
        ...this.getAuthHeaders(this.config.provider),
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: isTest ? 100 : this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          { role: 'system', content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
          ...this.buildOpenAIMessages(messages, isTest ? undefined : imageData),
        ],
        ...(this.config.provider === 'nvidia' ? { stream: false } : {}),
      }),
    })

    const data = await this.parseResponse(response)
    return this.extractText(data, 'openai')
  }

  private async callOpenRouter(messages: Message[], isTest: boolean, imageData?: ImageData): Promise<string> {
    const response = await this.performRequest(`${this.normalizeBaseUrl(this.config.baseUrl)}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        ...this.getBaseHeaders(),
        Authorization: `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://devui.app',
        'X-Title': 'Nova',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: isTest ? 100 : this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          { role: 'system', content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
          ...this.buildOpenAIMessages(messages, isTest ? undefined : imageData),
        ],
      }),
    })

    const data = await this.parseResponse(response)
    return this.extractText(data, 'openai')
  }

  private async callZhipu(messages: Message[], isTest: boolean): Promise<string> {
    const response = await this.performRequest(`${this.normalizeBaseUrl(this.config.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        ...this.getBaseHeaders(),
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: isTest ? 100 : this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          { role: 'system', content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    })

    const data = await this.parseResponse(response)
    return this.extractText(data, 'openai')
  }

  private async parseResponse(response: Response): Promise<unknown> {
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API error (${response.status})`

      try {
        const data = JSON.parse(errorText)
        if (data && typeof data === 'object' && 'error' in data) {
          const error = data.error
          errorMessage = typeof error === 'string' ? error : (error?.message || errorMessage)
        }
      } catch {
        errorMessage = `${errorMessage}: ${errorText.slice(0, 300)}`
      }

      throw new Error(errorMessage)
    }

    return response.json()
  }

  private extractText(data: unknown, path: string): string {
    if (!data || typeof data !== 'object') return ''

    // For Anthropic: data.content?.[0]?.text
    if (path === 'anthropic') {
      const obj = data as Record<string, unknown>
      if ('content' in obj && Array.isArray(obj.content) && obj.content[0]) {
        const first = obj.content[0] as Record<string, unknown>
        return typeof first.text === 'string' ? first.text : ''
      }
    }

    // For OpenAI-compatible: data.choices?.[0]?.message?.content
    if (path === 'openai') {
      const obj = data as Record<string, unknown>
      if ('choices' in obj && Array.isArray(obj.choices) && obj.choices[0]) {
        const choice = obj.choices[0] as Record<string, unknown>
        const message = choice.message as Record<string, unknown> | undefined
        return message && typeof message.content === 'string' ? message.content : ''
      }
    }

    return ''
  }

  private async performRequest(targetUrl: string, options: RequestInit): Promise<Response> {
    if (typeof window !== 'undefined' && window.electronAPI?.proxyRequest) {
      const result = await window.electronAPI.proxyRequest({
        url: targetUrl,
        method: options.method,
        headers: options.headers as Record<string, string> | undefined,
        body: typeof options.body === 'string' ? options.body : undefined,
        timeout: this.config.timeout || 300000,
      })

      return new Response(result.body, {
        status: result.status,
        headers: result.headers,
      })
    }

    const proxyUrl = this.getProxyUrl(targetUrl)
    return fetch(proxyUrl, options)
  }

  private getProxyUrl(targetUrl: string): string {
    const origin =
      typeof window !== 'undefined' && window.location?.origin?.startsWith('http')
        ? window.location.origin
        : ''

    return `${origin}/api/proxy?url=${encodeURIComponent(targetUrl)}`
  }

  private getBaseHeaders(): Record<string, string> {
    const normalized: Record<string, string> = {}
    for (const [k, v] of Object.entries(this.config.customHeaders || {})) {
      normalized[k.toLowerCase()] = v
    }
    return {
      'content-type': 'application/json',
      ...normalized,
    }
  }

  private getAuthHeaders(provider: AIProvider): Record<string, string> {
    if (provider === 'anthropic') {
      return {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      }
    }

    return {
      Authorization: `Bearer ${this.config.apiKey}`,
    }
  }

  private buildChatUrl(): string {
    const apiPath = this.config.apiPath || '/v1/chat/completions'

    // Prevent path injection: block // (protocol-relative), javascript:, data:
    if (apiPath.includes('//') || /^(javascript|data|file):/i.test(apiPath)) {
      throw new Error('Invalid API path: potential injection detected')
    }

    return `${this.normalizeBaseUrl(this.config.baseUrl)}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`
  }

  private getModelsUrl(provider: AIProvider): string {
    const base = this.normalizeBaseUrl(this.config.baseUrl)

    switch (provider) {
      case 'openai':
      case 'openrouter':
      case 'deepseek':
      case 'moonshot':
      case 'nvidia':
      case 'custom':
        return `${base}/v1/models`
      case 'zhipu':
      case 'qwen':
      case 'minimax':
      case 'baichuan':
        return `${base}/models`
      default:
        return `${base}/v1/models`
    }
  }

  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  }

  private parseModels(data: unknown): string[] {
    if (!data || typeof data !== 'object') {
      return []
    }

    const extractModelId = (item: unknown): string | undefined => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        return (typeof obj.id === 'string' ? obj.id : undefined) || (typeof obj.model === 'string' ? obj.model : undefined)
      }
      return undefined
    }

    let models: (string | undefined)[] = []

    if ('data' in data && Array.isArray(data.data)) {
      models = data.data.map(extractModelId)
    } else if ('models' in data && Array.isArray(data.models)) {
      models = data.models.map(extractModelId)
    } else if (Array.isArray(data)) {
      models = data.map(extractModelId)
    }

    return [...new Set(models.filter((m): m is string => typeof m === 'string' && m.length > 0))]
  }

  private getDefaultModels(provider: AIProvider): string[] {
    switch (provider) {
      case 'anthropic':
        return ANTHROPIC_MODELS
      case 'openai':
        return ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
      case 'openrouter':
        return ['anthropic/claude-opus-4-8', 'anthropic/claude-sonnet-4-6', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro-1.5']
      case 'deepseek':
        return ['deepseek-reasoner', 'deepseek-coder', 'deepseek-chat']
      case 'zhipu':
        return ['glm-4', 'glm-4-flash', 'glm-4v']
      case 'qwen':
        return ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long']
      case 'moonshot':
        return ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
      case 'minimax':
        return ['abab6.5s-chat', 'abab6.5-chat', 'abab5.5-chat']
      case 'baichuan':
        return ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan2-Turbo']
      case 'nvidia':
        return ['meta/llama-3.1-70b-instruct', 'meta/llama-3.1-8b-instruct', 'mistralai/mixtral-8x22b-instruct-v0.1']
      case 'custom':
        return ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'gpt-4o', 'gpt-4o-mini', 'deepseek-coder']
      default:
        return ['gpt-4o', 'gpt-4o-mini']
    }
  }

  private fixIncompleteHTML(html: string): string {
    const lines = html.split('\n')
    let lastCompleteLine = lines.length - 1

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i].trim()
      if (line.endsWith(';') || line.endsWith('}') || line.endsWith('>') || line.endsWith('{') || line === '') {
        lastCompleteLine = i
        break
      }
    }

    let fixed = lines.slice(0, lastCompleteLine + 1).join('\n')

    if (fixed.includes('<style') && !fixed.includes('</style>')) fixed += '\n</style>'
    if (fixed.includes('<body') && !fixed.includes('</body>')) fixed += '\n</body>'
    if (fixed.includes('<html') && !fixed.includes('</html>')) fixed += '\n</html>'

    // Ensure the result has minimum viable structure — if body is effectively empty, return original
    const hasBody = /<body[\s>]/i.test(fixed)
    const hasContent = /<(h[1-6]|p|div|section|main|header|nav|ul|ol|table)\b/i.test(fixed)
    if (hasBody && !hasContent) return html

    return fixed
  }

  private normalizeHTMLDocument(html: string): string {
    let normalized = html.trim()

    if (/<style[\s\S]*?<\/style>/i.test(normalized)) {
      normalized = normalized.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_match, attrs, css) => {
        const repairedCss = this.trimBrokenCss(css)
        return `<style${attrs}>${repairedCss}</style>`
      })
    }

    if (!/<body[\s>]/i.test(normalized) && /<html[\s\S]*<\/html>/i.test(normalized)) {
      normalized = this.ensureBodyTag(normalized)
    }

    return normalized
  }

  private trimBrokenCss(css: string): string {
    const lines = css.split('\n')
    let depth = 0
    let lastBalancedLine = -1

    lines.forEach((line, index) => {
      const opens = (line.match(/{/g) || []).length
      const closes = (line.match(/}/g) || []).length
      depth += opens - closes

      if (depth === 0) {
        lastBalancedLine = index
      }
    })

    if (lastBalancedLine === -1) {
      return css.trim()
    }

    return lines.slice(0, lastBalancedLine + 1).join('\n').trim()
  }

  private ensureBodyTag(html: string): string {
    if (/<body[\s>]/i.test(html)) return html

    const htmlCloseMatch = html.match(/<\/html>\s*$/i)
    const htmlWithoutClose = htmlCloseMatch ? html.slice(0, htmlCloseMatch.index) : html
    const headCloseMatch = htmlWithoutClose.match(/<\/head>/i)

    if (!headCloseMatch) {
      return html
    }

    const headCloseIndex = headCloseMatch.index ?? -1
    if (headCloseIndex < 0) {
      return html
    }

    const bodyContent = htmlWithoutClose.slice(headCloseIndex + headCloseMatch[0].length).trim()
    const beforeBody = htmlWithoutClose.slice(0, headCloseIndex + headCloseMatch[0].length)

    return `${beforeBody}
<body>
${bodyContent}
</body>
</html>`
  }

  private wrapInHTML(content: string): string {
    if (content.includes('<style')) {
      return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${content}
</body>
</html>`
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
</style>
</head>
<body>
${content}
</body>
</html>`
  }
}
