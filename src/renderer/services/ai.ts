import { aiLogger } from './logger'

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
export function addLog(type: 'info' | 'error' | 'success' | 'request', message: string, data?: unknown) {
  // Use structured logger
  if (type === 'error') {
    aiLogger.error(message, data)
  } else {
    aiLogger.info(`[${type}] ${message}`, data)
  }

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
      temperature: 0.5,
      maxTokens: 16384,
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
      temperature: 0.5,
      maxTokens: 16384,
    },
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    description: '性价比高，代码能力强',
    config: {
      provider: 'deepseek',
      model: 'deepseek-coder',
      temperature: 0.5,
      maxTokens: 16384,
    },
  },
  {
    id: 'qwen-max',
    name: '通义千问 Max',
    description: '阿里云最强模型',
    config: {
      provider: 'qwen',
      model: 'qwen-max',
      temperature: 0.5,
      maxTokens: 16384,
    },
  },
  {
    id: 'glm4',
    name: 'GLM-4',
    description: '智谱最新模型',
    config: {
      provider: 'zhipu',
      model: 'glm-4',
      temperature: 0.5,
      maxTokens: 16384,
    },
  },
  {
    id: 'kimi-128k',
    name: 'Kimi 128K',
    description: '支持超长上下文',
    config: {
      provider: 'moonshot',
      model: 'moonshot-v1-128k',
      temperature: 0.5,
      maxTokens: 16384,
    },
  },
]

// 获取预设
export function getPresets(): ConfigPreset[] {
  const saved = localStorage.getItem('nova-presets')
  if (saved) {
    try {
      const customPresets = JSON.parse(saved)
      return [...DEFAULT_PRESETS, ...customPresets]
    } catch (error) {
      console.warn('Failed to parse saved presets, using defaults:', error)
      return DEFAULT_PRESETS
    }
  }
  return DEFAULT_PRESETS
}

// 保存自定义预设
export function savePreset(preset: ConfigPreset): void {
  try {
    const saved = localStorage.getItem('nova-presets')
    const presets: ConfigPreset[] = saved ? JSON.parse(saved) : []
    presets.push(preset)
    localStorage.setItem('nova-presets', JSON.stringify(presets))
  } catch (error) {
    console.error('Failed to save preset:', error)
  }
}

// 删除预设
export function deletePreset(id: string): void {
  try {
    const saved = localStorage.getItem('nova-presets')
    if (saved) {
      const presets: ConfigPreset[] = JSON.parse(saved)
      localStorage.setItem('nova-presets', JSON.stringify(presets.filter(p => p.id !== id)))
    }
  } catch (error) {
    console.error('Failed to delete preset:', error)
  }
}

// 获取提供商配置
export function getProviderConfig(provider: AIProvider): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.id === provider)
}
