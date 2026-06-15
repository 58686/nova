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
