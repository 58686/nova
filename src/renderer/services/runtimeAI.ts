import { AIConfig, AIProvider, Message, ModelsResponse, TestResult } from './ai'

const DEFAULT_SYSTEM_PROMPT =
  'You are an expert UI designer and frontend engineer. Return only the requested HTML or text with no markdown fences unless explicitly requested.'

const ANTHROPIC_MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307',
  'claude-3-5-haiku-20241022',
]

export class RuntimeAIService {
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = { ...config }
  }

  async testConnection(): Promise<TestResult> {
    const start = Date.now()

    try {
      const response = await this.generate('回复“连接成功”四个字', [], true)
      return {
        success: true,
        latency: Date.now() - start,
        model: this.config.model,
        response: response.slice(0, 100),
      }
    } catch (error: any) {
      return {
        success: false,
        latency: Date.now() - start,
        error: error?.message || '连接失败',
      }
    }
  }

  async generate(prompt: string, history: Message[] = [], isTest = false): Promise<string> {
    const messages: Message[] = [...history, { role: 'user', content: prompt }]

    switch (this.config.provider) {
      case 'anthropic':
        return this.callAnthropic(messages, isTest)
      case 'openrouter':
        return this.callOpenRouter(messages, isTest)
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
        return this.callOpenAICompatible(messages, isTest)
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`)
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
    } catch (error: any) {
      return {
        success: true,
        models: this.getDefaultModels(this.config.provider),
        error: error?.message || 'Failed to fetch models',
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

  private async callAnthropic(messages: Message[], isTest: boolean): Promise<string> {
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
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    })

    const data = await this.parseResponse(response)
    return data.content?.[0]?.text || ''
  }

  private async callOpenAICompatible(messages: Message[], isTest: boolean): Promise<string> {
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
          ...messages.slice(-5),
        ],
        ...(this.config.provider === 'nvidia' ? { stream: false } : {}),
      }),
    })

    const data = await this.parseResponse(response)
    return data.choices?.[0]?.message?.content || ''
  }

  private async callOpenRouter(messages: Message[], isTest: boolean): Promise<string> {
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
          ...messages,
        ],
      }),
    })

    const data = await this.parseResponse(response)
    return data.choices?.[0]?.message?.content || ''
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
    return data.choices?.[0]?.message?.content || ''
  }

  private async parseResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API error (${response.status})`

      try {
        const data = JSON.parse(errorText)
        if (data.error) {
          errorMessage = data.error.message || data.error
        }
      } catch {
        errorMessage = `${errorMessage}: ${errorText.slice(0, 300)}`
      }

      throw new Error(errorMessage)
    }

    return response.json()
  }

  private async performRequest(targetUrl: string, options: RequestInit): Promise<Response> {
    if (typeof window !== 'undefined' && window.electronAPI?.proxyRequest) {
      const result = await window.electronAPI.proxyRequest({
        url: targetUrl,
        method: options.method,
        headers: options.headers as Record<string, string> | undefined,
        body: typeof options.body === 'string' ? options.body : undefined,
        timeout: this.config.timeout || 60000,
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
    return {
      'Content-Type': 'application/json',
      ...this.config.customHeaders,
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

  private parseModels(data: any): string[] {
    let models: string[] = []

    if (Array.isArray(data?.data)) {
      models = data.data.map((item: any) => item.id || item.model)
    } else if (Array.isArray(data?.models)) {
      models = data.models.map((item: any) => (typeof item === 'string' ? item : item.id || item.model))
    } else if (Array.isArray(data)) {
      models = data.map((item: any) => (typeof item === 'string' ? item : item.id || item.model))
    }

    return [...new Set(models.filter(Boolean))]
  }

  private getDefaultModels(provider: AIProvider): string[] {
    switch (provider) {
      case 'anthropic':
        return ANTHROPIC_MODELS
      case 'openai':
        return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
      case 'openrouter':
        return ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro-1.5']
      case 'deepseek':
        return ['deepseek-coder', 'deepseek-chat']
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
        return ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'deepseek-coder']
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
