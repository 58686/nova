import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAIConfigStore, AIConfigPreset } from './aiConfigStore'
import type { AIConfig } from '../services/ai'

vi.mock('../services/secureDataMigration', () => ({
  saveSecurePresets: vi.fn().mockResolvedValue(undefined),
  loadSecurePresets: vi.fn().mockResolvedValue(null),
}))

const openAIConfig: AIConfig = {
  provider: 'openai',
  apiKey: 'sk-live-test',
  baseUrl: 'https://api.openai.com',
  apiPath: '/v1/chat/completions',
  model: 'gpt-4o',
  temperature: 0.5,
  maxTokens: 1024,
  timeout: 30000,
}

function preset(id: string, apiKey = ''): AIConfigPreset {
  return {
    id,
    name: id,
    config: {
      ...openAIConfig,
      apiKey,
    },
    isActive: false,
    createdAt: 1,
  }
}

describe('useAIConfigStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAIConfigStore.setState({
      presets: [preset('empty-active'), preset('configured', 'sk-existing')],
      activePresetId: 'empty-active',
      isInitialized: true,
    })
  })

  it('activates a newly added provider preset immediately', () => {
    useAIConfigStore.getState().addPreset('New Provider', openAIConfig)

    const state = useAIConfigStore.getState()
    const created = state.presets.find(item => item.name === 'New Provider')

    expect(created).toBeTruthy()
    expect(state.activePresetId).toBe(created?.id)
    expect(state.getActiveConfig().apiKey).toBe('sk-live-test')
    expect(localStorage.getItem('nova-active-preset')).toBe(created?.id)
  })

  it('uses an updated configured preset when the current active preset has no key', () => {
    useAIConfigStore.getState().updatePreset('configured', {
      config: {
        ...openAIConfig,
        apiKey: 'sk-updated',
      },
    })

    const state = useAIConfigStore.getState()

    expect(state.activePresetId).toBe('configured')
    expect(state.getActiveConfig().apiKey).toBe('sk-updated')
    expect(localStorage.getItem('nova-active-preset')).toBe('configured')
  })
})
