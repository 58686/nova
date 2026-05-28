// AI提供商类型
export type AIProvider = 
  | 'anthropic' 
  | 'openai' 
  | 'openrouter'
  | 'deepseek'
  | 'zhipu'      // 智谱
  | 'qwen'       // 通义千问
  | 'moonshot'   // Kimi
  | 'minimax'
  | 'baichuan'
  | 'nvidia'     // 英伟达
  | 'custom'

// 日志函数
export function addLog(type: 'info' | 'error' | 'success' | 'request', message: string, data?: any) {
  if (import.meta.env.DEV) console.log(`[Nova ${type.toUpperCase()}]`, message, data || '')
  // 触发自定义事件，让调试面板可以捕获
  window.dispatchEvent(new CustomEvent('nova-log', { detail: { type, message, data } }))
}

// 提供商配置
export interface ProviderConfig {
  id: AIProvider
  name: string
  baseUrl: string
  requiresKey: boolean
  headers?: Record<string, string>
  description?: string
}

// AI配置
export interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl: string
  apiPath?: string  // API路径，如 /v1/chat/completions
  model: string
  temperature: number
  maxTokens: number
  
  // 自定义提供商配置
  customName?: string      // 自定义提供商名称
  customModels?: string[]  // 自定义模型列表（从API拉取）
  
  // 高级配置
  proxy?: string           // 代理地址
  timeout?: number         // 超时时间(ms)
  customHeaders?: Record<string, string>  // 自定义请求头
  systemPrompt?: string    // 自定义系统提示词
}

// 模型列表响应
export interface ModelsResponse {
  success: boolean
  models: string[]
  error?: string
}

// 配置预设
export interface ConfigPreset {
  id: string
  name: string
  description?: string
  config: Partial<AIConfig>
  icon?: string
  isDefault?: boolean
}

// 消息
export interface Message {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  summary?: string
}

// 测试结果
export interface TestResult {
  success: boolean
  latency?: number    // 响应时间(ms)
  error?: string
  model?: string
  response?: string
}

// 提供商定义
export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    requiresKey: true,
    description: 'Claude系列模型，高质量代码生成',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    requiresKey: true,
    description: 'GPT系列模型',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api',
    requiresKey: true,
    description: '聚合多个AI提供商的统一接口',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    requiresKey: true,
    description: 'DeepSeek代码模型，性价比高',
  },
  {
    id: 'zhipu',
    name: '智谱AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    requiresKey: true,
    description: '智谱GLM系列模型',
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    requiresKey: true,
    description: '阿里云通义千问系列',
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn',
    requiresKey: true,
    description: 'Kimi系列模型，支持长文本',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    requiresKey: true,
    description: 'MiniMax系列模型',
  },
  {
    id: 'baichuan',
    name: '百川智能',
    baseUrl: 'https://api.baichuan-ai.com/v1',
    requiresKey: true,
    description: '百川系列模型',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com',
    requiresKey: true,
    description: '英伟达NIM推理平台',
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    requiresKey: true,
    description: '自定义OpenAI兼容接口',
  },
]

// 默认预设
export const DEFAULT_PRESETS: ConfigPreset[] = [
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: '推荐用于UI生成，质量最高',
    config: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 4096,
    },
    isDefault: true,
  },
  {
    id: 'gpt4o',
    name: 'GPT-4o',
    description: 'OpenAI最新模型',
    config: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    description: '性价比高，代码能力强',
    config: {
      provider: 'deepseek',
      model: 'deepseek-coder',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
  {
    id: 'qwen-max',
    name: '通义千问 Max',
    description: '阿里云最强模型',
    config: {
      provider: 'qwen',
      model: 'qwen-max',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
  {
    id: 'glm4',
    name: 'GLM-4',
    description: '智谱最新模型',
    config: {
      provider: 'zhipu',
      model: 'glm-4',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
  {
    id: 'kimi-128k',
    name: 'Kimi 128K',
    description: '支持超长上下文',
    config: {
      provider: 'moonshot',
      model: 'moonshot-v1-128k',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
]

const SYSTEM_PROMPT = `你是一个专业的UI设计师。根据用户描述创建完整的HTML页面。

规则：
1. 只输出HTML代码，不要任何解释
2. 以 <!DOCTYPE html> 开头
3. 以 </html> 结尾
4. 所有CSS写在 <style> 标签内
5. 设计要美观、现代、专业
6. 使用渐变、阴影、圆角等现代设计元素
7. 确保响应式设计

示例输入：创建一个登录页面
示例输出：
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>登录</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-box { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 360px; }
h2 { margin-bottom: 24px; color: #1a1a2e; }
input { width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
button { width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
</style>
</head>
<body>
<div class="login-box">
  <h2>登录</h2>
  <input type="email" placeholder="邮箱">
  <input type="password" placeholder="密码">
  <button>登录</button>
</div>
</body>
</html>`

const DEFAULT_SYSTEM_PROMPT = `你是一名资深产品设计师和前端设计工程师。你的任务是根据用户描述，直接生成一个可以预览的高质量 HTML 页面。

硬性输出要求：
1. 只输出完整 HTML，不要输出解释、注释、Markdown 代码块或额外说明。
2. 必须从 <!DOCTYPE html> 开始，到 </html> 结束。
3. 所有 CSS 写在 <style> 中，不依赖外部资源、框架或 CDN。
4. 页面必须可直接在现代浏览器中打开并正常显示。

页面质量要求：
1. 页面不是简单线框图，而是接近真实产品的完整设计稿。
2. 默认补全完整结构，避免只生成零散模块。
3. 文案要真实、自然、有层级，不要全是“标题”“描述”“按钮”这种占位词。
4. 视觉上要高级、柔和、耐看，注重留白、层次、圆角、阴影、配色和排版节奏。
5. 布局需要稳定，重点内容明确，按钮、卡片、标签、表单、统计区等细节完整。
6. 默认做好响应式，至少兼顾桌面、平板、手机。
7. 适度加入动效和交互反馈，但不要喧宾夺主。
8. 保证对比度、可读性和可点击性，不要为了炫技牺牲可用性。

实现要求：
1. 优先使用语义化 HTML。
2. 样式变量化，适当使用 CSS 变量管理颜色、圆角、阴影、间距。
3. 页面应包含真实的间距系统、卡片层级、按钮状态、输入框状态和 hover/focus 效果。
4. 如用户没有指定，默认选择更柔和的现代风格，而不是冰冷生硬的深色科技模板。
5. 如果是官网或落地页，默认补全 hero、亮点、内容区、CTA、页脚等常见模块。
6. 如果是控制台或仪表盘，默认补全顶部概览、统计卡片、图表区、列表区和筛选区。
7. 如果是移动端页面，优先按移动端信息密度和触控体验设计。

请直接开始输出完整 HTML。`

export class AIService {
  private config: AIConfig

  constructor(config?: Partial<AIConfig>) {
    this.config = { ...getDefaultConfig(), ...config }
  }

  updateConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config }
  }

  getConfig(): AIConfig {
    return { ...this.config }
  }

  // 测试连接
  async testConnection(): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const response = await this.generate('回复"连接成功"两个字', [], true)
      const latency = Date.now() - startTime
      
      return {
        success: true,
        latency,
        model: this.config.model,
        response: response.slice(0, 100),
      }
    } catch (error: any) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
      }
    }
  }

  // 流式生成
  async generateStream(
    prompt: string, 
    history: Message[] = [], 
    onChunk: (chunk: string) => void,
    onDone: (fullText: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const messages: Message[] = [
      ...history.slice(-3),
      { role: 'user', content: prompt }
    ]

    try {
      const url = this.getApiUrl()
      const headers = this.getApiHeaders()
      
      // 增加max_tokens到4000，确保代码完整
      const body = {
        model: this.config.model,
        max_tokens: 4000,
        temperature: this.config.temperature,
        messages: [
          { role: 'system', content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
          ...messages,
        ],
      }

      if (import.meta.env.DEV) console.log('[AI] Sending request to:', url)
      if (import.meta.env.DEV) console.log('[AI] Model:', this.config.model)
      if (import.meta.env.DEV) console.log('[AI] Max tokens:', body.max_tokens)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        console.error('[AI] API Error:', error)
        
        let errorMsg = `API错误 (${response.status})`
        try {
          const errorData = JSON.parse(error)
          if (errorData.error) {
            errorMsg = errorData.error.message || errorData.error
          }
        } catch {
          errorMsg += `: ${error.slice(0, 200)}`
        }
        
        if (response.status === 504) {
          throw new Error(`请求超时，请尝试使用更快的模型或简化描述`)
        } else if (response.status === 429) {
          throw new Error(`请求过于频繁，请稍后再试`)
        } else if (response.status === 401) {
          throw new Error(`API Key无效，请检查配置`)
        } else if (response.status === 404) {
          throw new Error(`API端点不存在，请检查API地址和路径`)
        }
        
        throw new Error(errorMsg)
      }

      const data = await response.json()
      if (import.meta.env.DEV) console.log('[AI] Response received')

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API返回格式错误，请检查模型配置')
      }

      const content = data.choices[0].message.content
      if (import.meta.env.DEV) console.log('[AI] Content length:', content.length)
      
      // 模拟流式输出 - 更快的更新频率
      const chunks = content.match(/.{1,50}/gs) || []
      let fullText = ''
      
      for (const chunk of chunks) {
        fullText += chunk
        onChunk(chunk)
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      onDone(fullText)
    } catch (error: any) {
      console.error('[AI] Error:', error)
      if (error.name === 'AbortError') {
        onError('请求超时，请尝试使用更快的模型或简化描述')
      } else {
        onError(error.message || '生成失败')
      }
    }
  }

  private getApiUrl(): string {
    // 使用自定义API路径或默认路径
    const apiPath = this.config.apiPath || '/v1/chat/completions'
    
    // 确保路径以/开头
    const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`
    
    // 构建完整URL
    const baseUrl = this.config.baseUrl.endsWith('/') 
      ? this.config.baseUrl.slice(0, -1) 
      : this.config.baseUrl
    
    const fullUrl = `${baseUrl}${normalizedPath}`
    
    // 通过代理发送请求
    return `/api/proxy?url=${encodeURIComponent(fullUrl)}`
  }

  private getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.provider === 'anthropic') {
      headers['x-api-key'] = this.config.apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }

  private getRequestBody(messages: Message[], stream: boolean = false): any {
    const systemPrompt = this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT

    if (this.config.provider === 'anthropic') {
      return {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream,
      }
    }

    return {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream,
    }
  }

  private extractStreamContent(data: any): string {
    if (this.config.provider === 'anthropic') {
      if (data.type === 'content_block_delta' && data.delta?.text) {
        return data.delta.text
      }
    } else {
      if (data.choices?.[0]?.delta?.content) {
        return data.choices[0].delta.content
      }
    }
    return ''
  }

  async generate(prompt: string, history: Message[] = [], isTest = false): Promise<string> {
    const messages: Message[] = [
      ...history,
      { role: 'user', content: prompt }
    ]

    // 根据提供商选择调用方式
    switch (this.config.provider) {
      case 'anthropic':
        return this.callAnthropic(messages, isTest)
      case 'openai':
      case 'deepseek':
      case 'qwen':
      case 'moonshot':
      case 'minimax':
      case 'baichuan':
      case 'nvidia':
      case 'custom':
        return this.callOpenAICompatible(messages, isTest)
      case 'openrouter':
        return this.callOpenRouter(messages, isTest)
      case 'zhipu':
        return this.callZhipu(messages, isTest)
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`)
    }
  }

  private getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.customHeaders,
      ...additionalHeaders,
    }
    return headers
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const timeout = this.config.timeout || 60000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // 使用代理避免CORS问题
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`
      
      const response = await fetch(proxyUrl, {
        ...options,
        signal: controller.signal,
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async callAnthropic(messages: Message[], isTest = false): Promise<string> {
    const url = `${this.config.baseUrl}/v1/messages`
    
    const body: any = {
      model: this.config.model,
      max_tokens: isTest ? 100 : this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.getHeaders({
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      }),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API错误 (${response.status}): ${error}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  private async callOpenAICompatible(messages: Message[], isTest = false): Promise<string> {
    const url = this.getApiUrl()
    
    // 限制历史消息数量，避免请求过大
    const maxHistory = 5
    const recentMessages = messages.slice(-maxHistory)
    
    const body: any = {
      model: this.config.model,
      max_tokens: isTest ? 100 : this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        { role: 'system', content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
        ...recentMessages,
      ],
    }

    // NVIDIA特殊处理
    if (this.config.provider === 'nvidia') {
      body.stream = false
    }

    // 调试日志
    if (import.meta.env.DEV) console.log('[AI] Request:', {
      url,
      provider: this.config.provider,
      model: this.config.model,
      messageCount: recentMessages.length,
    })

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.getHeaders({
        'Authorization': `Bearer ${this.config.apiKey}`,
      }),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[AI] API Error:', error)
      
      // 解析错误信息
      let errorMsg = `API错误 (${response.status})`
      try {
        const errorData = JSON.parse(error)
        if (errorData.error) {
          errorMsg = errorData.error.message || errorData.error
        }
      } catch {
        errorMsg += `: ${error.slice(0, 200)}`
      }
      
      // 针对不同错误提供解决建议
      if (response.status === 504) {
        throw new Error(`请求超时：AI模型响应时间过长。请尝试：1) 使用更快的模型 2) 简化你的描述 3) 稍后重试`)
      } else if (response.status === 429) {
        throw new Error(`请求过于频繁，请稍后再试`)
      } else if (response.status === 401) {
        throw new Error(`API Key无效，请检查配置`)
      } else if (response.status === 404) {
        throw new Error(`API端点不存在，请检查API地址和路径`)
      }
      
      throw new Error(errorMsg)
    }

    const data = await response.json()
    if (import.meta.env.DEV) console.log('[AI] Response received')

    // 检查响应格式
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API返回格式错误，请检查模型配置')
    }
    
    return data.choices[0].message.content
  }

  private async callOpenRouter(messages: Message[], isTest = false): Promise<string> {
    const url = `${this.config.baseUrl}/v1/chat/completions`
    
    const body: any = {
      model: this.config.model,
      max_tokens: isTest ? 100 : this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        { role: 'system', content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
        ...messages,
      ],
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.getHeaders({
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://devui.app',
        'X-Title': 'DevUI',
      }),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API错误 (${response.status}): ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async callZhipu(messages: Message[], isTest = false): Promise<string> {
    const url = `${this.config.baseUrl}/chat/completions`
    
    const body: any = {
      model: this.config.model,
      max_tokens: isTest ? 100 : this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        { role: 'system', content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
        ...messages,
      ],
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.getHeaders({
        'Authorization': `Bearer ${this.config.apiKey}`,
      }),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`智谱API错误 (${response.status}): ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  // 拉取模型列表
  async fetchModels(): Promise<ModelsResponse> {
    try {
      let url = ''
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.config.customHeaders,
      }

      // 根据提供商选择拉取方式
      switch (this.config.provider) {
        case 'anthropic':
          // Anthropic没有公开的模型列表API，使用预设列表
          return {
            success: true,
            models: [
              'claude-3-5-sonnet-20241022',
              'claude-3-opus-20240229',
              'claude-3-haiku-20240307',
              'claude-3-5-haiku-20241022',
            ],
          }
        
        case 'openai':
          url = `${this.config.baseUrl}/v1/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        case 'openrouter':
          url = `${this.config.baseUrl}/v1/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        case 'deepseek':
          url = `${this.config.baseUrl}/v1/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        case 'zhipu':
          url = `${this.config.baseUrl}/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        case 'qwen':
          url = `${this.config.baseUrl}/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        case 'moonshot':
          url = `${this.config.baseUrl}/v1/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        case 'minimax':
          url = `${this.config.baseUrl}/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        case 'baichuan':
          url = `${this.config.baseUrl}/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        case 'nvidia':
          url = `${this.config.baseUrl}/v1/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        case 'custom':
          url = `${this.config.baseUrl}/v1/models`
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        
        default:
          return {
            success: false,
            models: [],
            error: '不支持的提供商',
          }
      }

      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.text()
        return {
          success: false,
          models: [],
          error: `API错误 (${response.status}): ${error}`,
        }
      }

      const data = await response.json()
      
      // 解析不同格式的响应
      let models: string[] = []
      
      if (data.data && Array.isArray(data.data)) {
        // OpenAI格式
        models = data.data.map((m: any) => m.id || m.model)
      } else if (data.models && Array.isArray(data.models)) {
        // 某些API的格式
        models = data.models.map((m: any) => typeof m === 'string' ? m : m.id || m.model)
      } else if (Array.isArray(data)) {
        // 直接数组格式
        models = data.map((m: any) => typeof m === 'string' ? m : m.id || m.model)
      }

      // 过滤掉无效值并去重
      models = [...new Set(models.filter(Boolean))]

      // 如果没有获取到模型，返回默认列表
      if (models.length === 0) {
        return {
          success: true,
          models: this.getDefaultModels(),
        }
      }

      return {
        success: true,
        models,
      }
    } catch (error: any) {
      // 如果请求失败，返回默认列表
      return {
        success: true,
        models: this.getDefaultModels(),
        error: `拉取失败: ${error.message}，显示默认模型列表`,
      }
    }
  }

  // 获取默认模型列表
  private getDefaultModels(): string[] {
    switch (this.config.provider) {
      case 'anthropic':
        return [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-haiku-20240307',
          'claude-3-5-haiku-20241022',
        ]
      case 'openai':
        return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
      case 'openrouter':
        return [
          'anthropic/claude-3.5-sonnet',
          'openai/gpt-4o',
          'google/gemini-pro-1.5',
          'meta-llama/llama-3.1-405b-instruct',
        ]
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
        return [
          'meta/llama-3.1-405b-instruct',
          'meta/llama-3.1-70b-instruct',
          'meta/llama-3.1-8b-instruct',
          'meta/llama-3-8b-instruct',
          'meta/llama-3-70b-instruct',
          'mistralai/mixtral-8x22b-instruct-v0.1',
          'mistralai/mistral-large-latest',
          'mistralai/mistral-7b-instruct-v0.2',
          'google/gemma-2-27b-it',
          'google/gemma-2-9b-it',
          'nvidia/nemotron-4-340b-instruct',
          'nvidia/nemotron-4-15b-instruct',
          'microsoft/phi-3-mini-128k-instruct',
          'deepseek-ai/deepseek-coder-33b-instruct',
        ]
      case 'custom':
        return ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'deepseek-coder']
      default:
        return []
    }
  }

  extractHTML(response: string): string {
    // 清理响应
    let cleaned = response.trim()
    
    if (import.meta.env.DEV) console.log('[extractHTML] Input length:', cleaned.length)
    if (import.meta.env.DEV) console.log('[extractHTML] Input preview:', cleaned.substring(0, 100))

    // 1. 移除开头的代码块标记
    cleaned = cleaned.replace(/^```(?:html|HTML)?\s*\n?/g, '')
    
    // 2. 移除结尾的代码块标记
    cleaned = cleaned.replace(/\n?```\s*$/g, '')
    
    // 3. 再次清理
    cleaned = cleaned.trim()
    
    if (import.meta.env.DEV) console.log('[extractHTML] After cleanup:', cleaned.substring(0, 100))

    // 4. 尝试匹配完整的HTML文档
    const htmlMatch = cleaned.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
    if (htmlMatch) {
      if (import.meta.env.DEV) console.log('[extractHTML] Found complete HTML')
      return htmlMatch[0].trim()
    }

    // 5. 尝试匹配 <html>...</html>
    const htmlTagMatch = cleaned.match(/<html[\s\S]*<\/html>/i)
    if (htmlTagMatch) {
      if (import.meta.env.DEV) console.log('[extractHTML] Found html tag')
      return htmlTagMatch[0].trim()
    }

    // 6. 检查HTML是否完整
    const hasDoctype = cleaned.includes('<!DOCTYPE')
    const hasHtmlClose = cleaned.includes('</html>')
    const hasBodyClose = cleaned.includes('</body>')
    
    if (import.meta.env.DEV) console.log('[extractHTML] hasDoctype:', hasDoctype, 'hasHtmlClose:', hasHtmlClose, 'hasBodyClose:', hasBodyClose)

    // 7. 如果HTML不完整，尝试修复
    if (!hasHtmlClose || !hasBodyClose) {
      if (import.meta.env.DEV) console.log('[extractHTML] HTML incomplete, fixing...')
      cleaned = this.fixIncompleteHTML(cleaned)
    }

    // 8. 确保有完整的HTML结构
    if (!cleaned.includes('<!DOCTYPE')) {
      if (import.meta.env.DEV) console.log('[extractHTML] Wrapping in HTML')
      cleaned = this.wrapInHTML(cleaned)
    }

    if (import.meta.env.DEV) console.log('[extractHTML] Output length:', cleaned.length)
    return cleaned
  }

  // 修复不完整的HTML
  private fixIncompleteHTML(html: string): string {
    // 移除可能被截断的最后一行
    const lines = html.split('\n')
    let lastCompleteLine = lines.length - 1
    
    // 从后往前找，找到最后一个完整的行（以 ; 或 } 或 > 结尾）
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.endsWith(';') || line.endsWith('}') || line.endsWith('>') || line.endsWith('{') || line === '') {
        lastCompleteLine = i
        break
      }
    }
    
    // 截取到最后一个完整行
    let fixed = lines.slice(0, lastCompleteLine + 1).join('\n')
    
    // 补全缺失的标签
    // 检查并补全 style 标签
    if (fixed.includes('<style') && !fixed.includes('</style>')) {
      fixed += '\n</style>'
    }
    
    // 检查并补全 body 标签
    if (fixed.includes('<body') && !fixed.includes('</body>')) {
      fixed += '\n</body>'
    }
    
    // 检查并补全 html 标签
    if (fixed.includes('<html') && !fixed.includes('</html>')) {
      fixed += '\n</html>'
    }
    
    return fixed
  }

  // 将内容包装成完整的HTML
  private wrapInHTML(content: string): string {
    // 如果内容已经包含<style>，直接包装
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
    
    // 否则添加基础样式
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

// 默认配置
function getDefaultConfig(): AIConfig {
  return {
    provider: 'anthropic',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 4096,
    timeout: 60000,
  }
}

// 单例
let aiServiceInstance: AIService | null = null

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    const savedConfig = localStorage.getItem('nova-ai-config')
    const config = savedConfig ? JSON.parse(savedConfig) : {}
    aiServiceInstance = new AIService(config)
  }
  return aiServiceInstance
}

export function resetAIService(): void {
  aiServiceInstance = null
}

// 获取预设
export function getPresets(): ConfigPreset[] {
  const saved = localStorage.getItem('nova-presets')
  if (saved) {
    return [...DEFAULT_PRESETS, ...JSON.parse(saved)]
  }
  return DEFAULT_PRESETS
}

// 保存自定义预设
export function savePreset(preset: ConfigPreset): void {
  const saved = localStorage.getItem('nova-presets')
  const presets: ConfigPreset[] = saved ? JSON.parse(saved) : []
  presets.push(preset)
  localStorage.setItem('nova-presets', JSON.stringify(presets))
}

// 删除预设
export function deletePreset(id: string): void {
  const saved = localStorage.getItem('nova-presets')
  if (saved) {
    const presets: ConfigPreset[] = JSON.parse(saved)
    localStorage.setItem('nova-presets', JSON.stringify(presets.filter(p => p.id !== id)))
  }
}

// 获取提供商配置
export function getProviderConfig(provider: AIProvider): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.id === provider)
}
