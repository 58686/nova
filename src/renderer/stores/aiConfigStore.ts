import { create } from 'zustand'
import { AIConfig, AIProvider, PROVIDERS } from '../services/ai'

export interface AIConfigPreset {
  id: string
  name: string
  config: AIConfig
  isActive: boolean
  createdAt: number
}

interface AIConfigStore {
  presets: AIConfigPreset[]
  activePresetId: string | null
  
  // 操作
  addPreset: (name: string, config: AIConfig) => void
  updatePreset: (id: string, updates: Partial<AIConfigPreset>) => void
  deletePreset: (id: string) => void
  setActivePreset: (id: string) => void
  getActiveConfig: () => AIConfig | null
}

const DEFAULT_CONFIGS: AIConfigPreset[] = [
  {
    id: 'anthropic-default',
    name: 'Anthropic Claude',
    config: {
      provider: 'anthropic',
      apiKey: '',
      baseUrl: 'https://api.anthropic.com',
      apiPath: '/v1/messages',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 120000,
    },
    isActive: false,
    createdAt: Date.now(),
  },
  {
    id: 'openai-default',
    name: 'OpenAI GPT',
    config: {
      provider: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com',
      apiPath: '/v1/chat/completions',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 120000,
    },
    isActive: false,
    createdAt: Date.now(),
  },
  {
    id: 'nvidia-default',
    name: 'NVIDIA NIM',
    config: {
      provider: 'nvidia',
      apiKey: '',
      baseUrl: 'https://integrate.api.nvidia.com',
      apiPath: '/v1/chat/completions',
      model: 'meta/llama-3.1-70b-instruct',
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 180000,
    },
    isActive: false,
    createdAt: Date.now(),
  },
  {
    id: 'deepseek-default',
    name: 'DeepSeek',
    config: {
      provider: 'deepseek',
      apiKey: '',
      baseUrl: 'https://api.deepseek.com',
      apiPath: '/v1/chat/completions',
      model: 'deepseek-coder',
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 120000,
    },
    isActive: false,
    createdAt: Date.now(),
  },
]

function loadPresets(): AIConfigPreset[] {
  try {
    const saved = localStorage.getItem('nova-ai-presets')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load AI presets:', e)
  }
  return DEFAULT_CONFIGS
}

function savePresets(presets: AIConfigPreset[]) {
  try {
    localStorage.setItem('nova-ai-presets', JSON.stringify(presets))
  } catch (e) {
    console.warn('Failed to save AI presets:', e)
  }
}

export const useAIConfigStore = create<AIConfigStore>((set, get) => ({
  presets: loadPresets(),
  activePresetId: localStorage.getItem('nova-active-preset') || null,
  
  addPreset: (name, config) => {
    const newPreset: AIConfigPreset = {
      id: Date.now().toString(),
      name,
      config,
      isActive: false,
      createdAt: Date.now(),
    }
    
    const presets = [...get().presets, newPreset]
    set({ presets })
    savePresets(presets)
  },
  
  updatePreset: (id, updates) => {
    const presets = get().presets.map(p => 
      p.id === id ? { ...p, ...updates } : p
    )
    set({ presets })
    savePresets(presets)
  },
  
  deletePreset: (id) => {
    const presets = get().presets.filter(p => p.id !== id)
    const activePresetId = get().activePresetId === id ? null : get().activePresetId
    
    set({ presets, activePresetId })
    savePresets(presets)
    
    if (activePresetId) {
      localStorage.setItem('nova-active-preset', activePresetId)
    } else {
      localStorage.removeItem('nova-active-preset')
    }
  },
  
  setActivePreset: (id) => {
    const presets = get().presets.map(p => ({
      ...p,
      isActive: p.id === id,
    }))
    
    set({ presets, activePresetId: id })
    savePresets(presets)
    localStorage.setItem('nova-active-preset', id)
  },
  
  getActiveConfig: () => {
    const { presets, activePresetId } = get()
    
    if (activePresetId) {
      const preset = presets.find(p => p.id === activePresetId)
      if (preset) {
        return preset.config
      }
    }
    
    // 返回第一个有API Key的配置
    const configured = presets.find(p => p.config.apiKey)
    if (configured) {
      return configured.config
    }
    
    // 返回第一个配置
    return presets[0]?.config || null
  },
}))
