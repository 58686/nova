import { Dispatch, SetStateAction, useState } from 'react'
import { useLocale } from '../hooks/useLocale'
import { Locale, pickLocale } from '../locale'
import { AIConfig, AIProvider, PROVIDERS } from '../services/ai'
import { DEFAULT_SYSTEM_PROMPT, RuntimeAIService } from '../services/runtimeAI'
import { AIConfigPreset, useAIConfigStore } from '../stores/aiConfigStore'

type ConnectionResult = {
  id: string
  success: boolean
  message: string
} | null

const DEFAULT_EDIT_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com',
  apiPath: '/v1/chat/completions',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 60000,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
}

function getProviderLabel(provider: AIProvider, locale: Locale): string {
  const labels: Record<AIProvider, { zh: string; en: string }> = {
    anthropic: { zh: 'Anthropic', en: 'Anthropic' },
    openai: { zh: 'OpenAI', en: 'OpenAI' },
    openrouter: { zh: 'OpenRouter', en: 'OpenRouter' },
    deepseek: { zh: 'DeepSeek', en: 'DeepSeek' },
    zhipu: { zh: '智谱 AI', en: 'Zhipu AI' },
    qwen: { zh: '通义千问', en: 'Qwen' },
    moonshot: { zh: 'Moonshot (Kimi)', en: 'Moonshot (Kimi)' },
    minimax: { zh: 'MiniMax', en: 'MiniMax' },
    baichuan: { zh: '百川智能', en: 'Baichuan' },
    nvidia: { zh: 'NVIDIA NIM', en: 'NVIDIA NIM' },
    custom: { zh: '自定义兼容接口', en: 'Custom Compatible API' },
  }

  return pickLocale(locale, labels[provider].zh, labels[provider].en)
}

export default function AIConfigManager() {
  const { presets, activePresetId, addPreset, updatePreset, deletePreset, setActivePreset } = useAIConfigStore()
  const { locale, text } = useLocale()

  const [editingPreset, setEditingPreset] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<ConnectionResult>(null)
  const [fetchedModels, setFetchedModels] = useState<string[]>(getDefaultModels('openai'))
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [editConfig, setEditConfig] = useState<AIConfig>(DEFAULT_EDIT_CONFIG)
  const [visiblePresetIds, setVisiblePresetIds] = useState<string[]>([])

  function togglePresetVisibility(id: string) {
    setVisiblePresetIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  async function handleFetchModels() {
    if (!editConfig.apiKey || !editConfig.baseUrl) {
      setFetchError(text('请先填写 API Key 和 Base URL。', 'Please enter the API key and base URL first.'))
      return
    }

    setIsFetchingModels(true)
    setFetchError(null)
    setFetchedModels([])

    try {
      const service = new RuntimeAIService(editConfig)
      const result = await service.fetchModels()

      if (result.success && result.models.length > 0) {
        setFetchedModels(result.models)
        if (!editConfig.model || !result.models.includes(editConfig.model)) {
          setEditConfig((prev) => ({ ...prev, model: result.models[0] }))
        }
        if (result.error) {
          setFetchError(result.error)
        }
        return
      }

      const fallbackModels = getDefaultModels(editConfig.provider)
      setFetchedModels(fallbackModels)
      setFetchError(result.error || text('没有获取到模型列表，已回退到默认模型。', 'No models were returned, so the default list was restored.'))
    } catch (error: unknown) {
      const fallbackModels = getDefaultModels(editConfig.provider)
      setFetchedModels(fallbackModels)
      setFetchError(error instanceof Error ? error.message : text('获取模型失败，已回退到默认模型。', 'Failed to fetch models, so the default list was restored.'))
    } finally {
      setIsFetchingModels(false)
    }
  }

  function handleProviderChange(provider: AIProvider) {
    const providerInfo = PROVIDERS.find((item) => item.id === provider)
    const defaultModels = getDefaultModels(provider)

    setFetchedModels(defaultModels)
    setFetchError(null)
    setEditConfig((prev) => ({
      ...prev,
      provider,
      baseUrl: providerInfo?.baseUrl || '',
      apiPath: provider === 'anthropic' ? '/v1/messages' : '/v1/chat/completions',
      model: defaultModels[0] || '',
    }))
  }

  function handleStartEdit(preset: AIConfigPreset) {
    setEditingPreset(preset.id)
    setEditConfig({
      ...DEFAULT_EDIT_CONFIG,
      ...preset.config,
      provider: preset.config.provider || DEFAULT_EDIT_CONFIG.provider,
      apiKey: preset.config.apiKey || '',
      baseUrl: preset.config.baseUrl || '',
      apiPath: preset.config.apiPath || (preset.config.provider === 'anthropic' ? '/v1/messages' : '/v1/chat/completions'),
      model: preset.config.model || '',
      temperature: preset.config.temperature ?? DEFAULT_EDIT_CONFIG.temperature,
      maxTokens: preset.config.maxTokens ?? DEFAULT_EDIT_CONFIG.maxTokens,
      timeout: preset.config.timeout ?? DEFAULT_EDIT_CONFIG.timeout,
    })
    setFetchedModels(getDefaultModels(preset.config.provider || 'openai'))
    setFetchError(null)
  }

  function handleSaveEdit() {
    if (!editingPreset) return
    updatePreset(editingPreset, { config: editConfig })
    setEditingPreset(null)
  }

  function handleAddNew() {
    if (!newName.trim()) return
    addPreset(newName.trim(), editConfig)
    setNewName('')
    setShowAddForm(false)
  }

  async function handleTestConnection(id: string, config: AIConfig) {
    setTestingId(id)
    setTestResult(null)

    try {
      const service = new RuntimeAIService(config)
      const result = await service.testConnection()
      setTestResult({
        id,
        success: result.success,
        message: result.success
          ? text(`连接成功 (${result.latency}ms)`, `Connection ok (${result.latency}ms)`)
          : result.error || text('连接失败', 'Connection failed'),
      })
    } catch (error: unknown) {
      setTestResult({
        id,
        success: false,
        message: error instanceof Error ? error.message : text('测试失败', 'Test failed'),
      })
    } finally {
      setTestingId(null)
    }
  }

  function openAddForm() {
    const defaultModels = getDefaultModels('openai')
    setFetchedModels(defaultModels)
    setFetchError(null)
    setEditConfig({
      ...DEFAULT_EDIT_CONFIG,
      model: defaultModels[0],
    })
    setShowAddForm(true)
  }

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-secondary)' }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {text('AI 配置管理', 'AI Config Manager')}
          </h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {text('管理多套模型配置，支持切换、查看密钥与连接测试。', 'Manage multiple provider presets, inspect keys, switch active configs, and run connection tests.')}
          </p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary h-8 px-3 text-xs">
          {text('+ 添加配置', '+ Add Config')}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {showAddForm && (
          <ConfigFormCard
            title={text('新建配置', 'New Config')}
            newName={newName}
            showNameInput
            editConfig={editConfig}
            fetchedModels={fetchedModels}
            isFetchingModels={isFetchingModels}
            fetchError={fetchError}
            onNameChange={setNewName}
            onProviderChange={handleProviderChange}
            onConfigChange={setEditConfig}
            onFetchModels={handleFetchModels}
            onPrimaryAction={handleAddNew}
            onSecondaryAction={() => setShowAddForm(false)}
            primaryLabel={text('保存', 'Save')}
            secondaryLabel={text('取消', 'Cancel')}
          />
        )}

        {presets.map((preset) => (
          <div
            key={preset.id}
            className="rounded-xl p-4 transition-all duration-200"
            style={{
              background: preset.id === activePresetId ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              border: preset.id === activePresetId ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
            }}
          >
            {editingPreset === preset.id ? (
              <ConfigFormCard
                title={text(`编辑配置 · ${preset.name}`, `Edit Config · ${preset.name}`)}
                editConfig={editConfig}
                fetchedModels={fetchedModels}
                isFetchingModels={isFetchingModels}
                fetchError={fetchError}
                onProviderChange={handleProviderChange}
                onConfigChange={setEditConfig}
                onFetchModels={handleFetchModels}
                onPrimaryAction={handleSaveEdit}
                onSecondaryAction={() => setEditingPreset(null)}
                primaryLabel={text('保存', 'Save')}
                secondaryLabel={text('取消', 'Cancel')}
              />
            ) : (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preset.name}
                    </h4>
                    {preset.id === activePresetId && <span className="badge badge-accent text-[10px]">{text('当前使用', 'Current')}</span>}
                  </div>

                  {preset.id !== activePresetId && (
                    <button
                      onClick={() => setActivePreset(preset.id)}
                      className="rounded px-2 py-1 text-[10px] font-medium transition-colors"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent-dark)' }}
                    >
                      {text('启用', 'Use')}
                    </button>
                  )}
                </div>

                <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{getProviderLabel(preset.config.provider, locale)}</span>
                  <span>·</span>
                  <span className="font-mono">{preset.config.model}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-disabled)' }}>
                  <span>
                    API Key:{' '}
                    {preset.config.apiKey
                      ? maskApiKey(preset.config.apiKey, visiblePresetIds.includes(preset.id))
                      : text('未配置', 'Not configured')}
                  </span>
                  {preset.config.apiKey && (
                    <button
                      type="button"
                      onClick={() => togglePresetVisibility(preset.id)}
                      className="rounded px-1.5 py-0.5 transition-colors"
                      style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
                    >
                      {visiblePresetIds.includes(preset.id) ? text('隐藏', 'Hide') : text('查看', 'View')}
                    </button>
                  )}
                </div>

                {testResult && testResult.id === preset.id && (
                  <div
                    className="mt-2 rounded p-2 text-xs"
                    style={{
                      background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: testResult.success ? '#10b981' : '#ef4444',
                    }}
                  >
                    {testResult.message}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(preset.id, preset.config as AIConfig)}
                    disabled={testingId === preset.id || !preset.config.apiKey}
                    className="rounded px-2 py-1 text-xs transition-colors"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                  >
                    {testingId === preset.id ? text('测试中...', 'Testing...') : text('测试连接', 'Test Connection')}
                  </button>

                  <button
                    onClick={() => handleStartEdit(preset)}
                    className="rounded px-2 py-1 text-xs transition-colors"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                  >
                    {text('编辑', 'Edit')}
                  </button>

                  {showDeleteConfirm === preset.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          deletePreset(preset.id)
                          setShowDeleteConfirm(null)
                        }}
                        className="rounded bg-red-500 px-2 py-1 text-xs text-white"
                      >
                        {text('确认删除', 'Confirm Delete')}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="rounded px-2 py-1 text-xs"
                        style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                      >
                        {text('取消', 'Cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(preset.id)}
                      className="rounded px-2 py-1 text-xs transition-colors"
                      style={{ color: 'var(--text-disabled)' }}
                    >
                      {text('删除', 'Delete')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

type ConfigFormCardProps = {
  title: string
  editConfig: AIConfig
  fetchedModels: string[]
  isFetchingModels: boolean
  fetchError: string | null
  onProviderChange: (provider: AIProvider) => void
  onConfigChange: Dispatch<SetStateAction<AIConfig>>
  onFetchModels: () => void
  onPrimaryAction: () => void
  onSecondaryAction: () => void
  primaryLabel: string
  secondaryLabel: string
  showNameInput?: boolean
  newName?: string
  onNameChange?: (value: string) => void
}

function ConfigFormCard({
  title,
  editConfig,
  fetchedModels,
  isFetchingModels,
  fetchError,
  onProviderChange,
  onConfigChange,
  onFetchModels,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
  secondaryLabel,
  showNameInput = false,
  newName = '',
  onNameChange,
}: ConfigFormCardProps) {
  const { locale, text } = useLocale()
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-accent)',
      }}
    >
      <h4 className="mb-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h4>

      <div className="space-y-3">
        {showNameInput && (
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--text-secondary)' }}>
              {text('配置名称', 'Config Name')}
            </label>
            <input
              type="text"
              value={newName}
              onChange={(event) => onNameChange?.(event.target.value)}
              placeholder={text('例如：我的 OpenAI', 'Example: My OpenAI')}
              className="input text-sm"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--text-secondary)' }}>
            {text('提供商', 'Provider')}
          </label>
          <select value={editConfig.provider} onChange={(event) => onProviderChange(event.target.value as AIProvider)} className="input text-sm">
            {PROVIDERS.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {getProviderLabel(provider.id, locale)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--text-secondary)' }}>
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={editConfig.apiKey}
              onChange={(event) => onConfigChange((prev) => ({ ...prev, apiKey: event.target.value }))}
              placeholder={text('输入 API Key', 'Enter API key')}
              className="input pr-12 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((prev) => !prev)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label={showApiKey ? text('隐藏 API Key', 'Hide API key') : text('显示 API Key', 'Show API key')}
              title={showApiKey ? text('隐藏 API Key', 'Hide API key') : text('显示 API Key', 'Show API key')}
            >
              {showApiKey ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18M10.585 10.587A2 2 0 0 0 13.414 13.414M16.681 16.673A9.72 9.72 0 0 1 12 18c-5 0-9-6-9-6a18.16 18.16 0 0 1 5.019-4.874M9.88 5.083A9.953 9.953 0 0 1 12 5c5 0 9 6 9 6a18.5 18.5 0 0 1-2.305 2.992" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.27 2.943 9.542 7-1.273 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--text-secondary)' }}>
            Base URL
          </label>
          <input
            type="text"
            value={editConfig.baseUrl}
            onChange={(event) => onConfigChange((prev) => ({ ...prev, baseUrl: event.target.value }))}
            placeholder="https://api.example.com"
            className="input text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--text-secondary)' }}>
            API Path
          </label>
          <input
            type="text"
            value={editConfig.apiPath || '/v1/chat/completions'}
            onChange={(event) => onConfigChange((prev) => ({ ...prev, apiPath: event.target.value }))}
            placeholder="/v1/chat/completions"
            className="input text-sm"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {text('模型', 'Model')}
            </label>
            <button
              onClick={onFetchModels}
              disabled={isFetchingModels || !editConfig.apiKey}
              className="rounded px-2 py-0.5 text-[10px] transition-colors"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent-dark)' }}
            >
              {isFetchingModels ? text('获取中...', 'Fetching...') : text('一键获取模型', 'Fetch Models')}
            </button>
          </div>

          {fetchedModels.length > 0 ? (
            <select
              value={editConfig.model}
              onChange={(event) => onConfigChange((prev) => ({ ...prev, model: event.target.value }))}
              className="input text-sm"
            >
              {fetchedModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={editConfig.model}
              onChange={(event) => onConfigChange((prev) => ({ ...prev, model: event.target.value }))}
              placeholder={text('模型名称', 'Model name')}
              className="input text-sm"
            />
          )}

          {fetchError && (
            <p className="mt-1 text-[10px]" style={{ color: '#f59e0b' }}>
              {fetchError}
            </p>
          )}
        </div>

        {/* ── Advanced: System Prompt (collapsible) ── */}
        <details className="group">
          <summary
            className="flex cursor-pointer items-center gap-1.5 text-xs select-none"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg className="h-3 w-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {text('高级设置', 'Advanced')}
          </summary>
          <div className="mt-2 space-y-2">
            <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
              {text('系统提示词 (System Prompt)', 'System Prompt')}
            </label>
            <textarea
              className="input min-h-[80px] px-3 py-2 text-xs leading-relaxed resize-y"
              value={editConfig.systemPrompt || ''}
              onChange={(event) => onConfigChange((prev) => ({ ...prev, systemPrompt: event.target.value || undefined }))}
              placeholder={text(
                '留空使用默认提示词。自定义提示词会完全替换默认值，请确保包含必要的输出格式要求。',
                'Leave empty for default. A custom prompt replaces the default entirely — make sure to include output format instructions.',
              )}
              rows={4}
            />
          </div>
        </details>

        <div className="flex gap-2">
          <button onClick={onPrimaryAction} className="btn btn-primary text-xs">
            {primaryLabel}
          </button>
          <button onClick={onSecondaryAction} className="btn btn-ghost text-xs">
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function maskApiKey(rawValue: string, visible: boolean): string {
  if (visible) return rawValue
  if (rawValue.length <= 8) return '********'
  return `${rawValue.slice(0, 4)}****${rawValue.slice(-4)}`
}

function getDefaultModels(provider: AIProvider): string[] {
  switch (provider) {
    case 'anthropic':
      return ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307', 'claude-3-5-haiku-20241022']
    case 'openai':
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    case 'openrouter':
      return ['anthropic/claude-opus-4-8', 'anthropic/claude-sonnet-4-6', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro-1.5']
    case 'nvidia':
      return ['meta/llama-3.1-70b-instruct', 'meta/llama-3.1-8b-instruct', 'mistralai/mixtral-8x22b-instruct-v0.1']
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
    case 'custom':
      return ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'gpt-4o', 'gpt-4o-mini', 'deepseek-coder']
    default:
      return ['gpt-4o', 'gpt-4o-mini']
  }
}
