import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { AIConfig, AIProvider } from '../services/ai'
import { saveSecurePresets, loadSecurePresets } from '../services/secureDataMigration'

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
  isInitialized: boolean

  // 操作
  addPreset: (name: string, config: AIConfig) => void
  updatePreset: (id: string, updates: Partial<AIConfigPreset>) => void
  deletePreset: (id: string) => void
  setActivePreset: (id: string) => void
  getActiveConfig: () => AIConfig
  initializeSecureStore: () => Promise<void>
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
      temperature: 0.5,
      maxTokens: 16384,
      timeout: 300000,
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
      temperature: 0.5,
      maxTokens: 16384,
      timeout: 300000,
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
      temperature: 0.5,
      maxTokens: 16384,
      timeout: 300000,
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
      temperature: 0.5,
      maxTokens: 16384,
      timeout: 300000,
    },
    isActive: false,
    createdAt: Date.now(),
  },
]

function loadPresets(): AIConfigPreset[] {
  // Note: This loads synchronously on store creation.
  // Actual encrypted data is loaded asynchronously via initializeSecureStore().
  // We start with defaults and upgrade once decryption completes.
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

async function savePresetsSecure(presets: AIConfigPreset[]) {
  try {
    await saveSecurePresets(presets)
  } catch (e) {
    console.warn('Failed to save encrypted presets, falling back to plain text:', e)
    // Fallback: save without encryption
    try {
      localStorage.setItem('nova-ai-presets', JSON.stringify(presets))
    } catch (fallbackError) {
      console.error('Failed to save presets:', fallbackError)
    }
  }
}

// Debounced save: avoid race condition when presets are modified rapidly
let saveTimer: ReturnType<typeof setTimeout> | null = null
function savePresetsDebounced(presets: AIConfigPreset[]) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    savePresetsSecure(presets)
  }, 500)
}

export const useAIConfigStore = create<AIConfigStore>((set, get) => ({
  presets: loadPresets(),
  activePresetId: localStorage.getItem('nova-active-preset') || null,
  isInitialized: false,

  initializeSecureStore: async () => {
    try {
      const securePresets = await loadSecurePresets()
      if (securePresets && securePresets.length > 0) {
        // Preserve current activePresetId if it still exists
        const currentActive = get().activePresetId
        const stillExists = securePresets.some(p => p.id === currentActive)
        set({
          presets: securePresets,
          activePresetId: stillExists ? currentActive : null,
          isInitialized: true,
        })
      } else {
        set({ isInitialized: true })
      }
    } catch (e) {
      console.warn('Failed to load secure presets, using defaults:', e)
      set({ isInitialized: true })
    }
  },

  addPreset: (name, config) => {
    const newPreset: AIConfigPreset = {
      id: nanoid(),
      name,
      config,
      isActive: false,
      createdAt: Date.now(),
    }

    const presets = [...get().presets, newPreset]
    set({ presets })
    savePresetsDebounced(presets) // Use encrypted save
  },
  
  updatePreset: (id, updates) => {
    const presets = get().presets.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
    set({ presets })
    savePresetsDebounced(presets) // Use encrypted save
  },

  deletePreset: (id) => {
    const presets = get().presets.filter(p => p.id !== id)
    const activePresetId = get().activePresetId === id ? null : get().activePresetId

    set({ presets, activePresetId })
    savePresetsDebounced(presets) // Use encrypted save
    
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
    savePresetsDebounced(presets) // Use encrypted save
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
    
    // Return first preset config, or a minimal default
    return presets[0]?.config ?? {
      provider: 'anthropic' as AIProvider,
      apiKey: '',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.5,
      maxTokens: 16384,
      timeout: 300000,
    }
  },
}))
