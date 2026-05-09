import { useMemo, useState } from 'react'
import { useLocale } from '../hooks/useLocale'
import { RuntimeAIService } from '../services/runtimeAI'
import { useAIConfigStore } from '../stores/aiConfigStore'

export default function APITester() {
  const { presets, activePresetId, getActiveConfig } = useAIConfigStore()
  const { text } = useLocale()
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [testInput, setTestInput] = useState(text('请回复“连接成功”四个字。', 'Reply with the phrase "connection successful".'))

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === activePresetId) || null,
    [activePresetId, presets],
  )

  const handleTest = async () => {
    const config = getActiveConfig()
    if (!config) {
      setResult(text('错误：当前没有可用配置。', 'Error: no active configuration is available.'))
      return
    }

    if (!config.apiKey) {
      setResult(text('错误：当前配置还没有填写 API Key。', 'Error: the current configuration does not have an API key yet.'))
      return
    }

    setIsLoading(true)
    setResult(text('测试中...', 'Testing...'))

    try {
      const service = new RuntimeAIService(config)
      const response = await service.generate(testInput, [], true)

      setResult(
        [
          text('连接成功', 'Connection successful'),
          `Provider: ${config.provider}`,
          `Model: ${config.model}`,
          '',
          response,
        ].join('\n'),
      )
    } catch (error: any) {
      setResult(
        [
          text('连接失败', 'Connection failed'),
          `Provider: ${config.provider}`,
          `Model: ${config.model}`,
          '',
          error?.message || text('未知错误', 'Unknown error'),
        ].join('\n'),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <h3 className="mb-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {text('API 测试工具', 'API Tester')}
      </h3>

      <div className="space-y-3">
        <div
          className="rounded-lg px-3 py-2 text-xs"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <div>{text('当前配置：', 'Current preset: ')}{activePreset?.name || text('未指定，将回退到第一个可用配置', 'Not selected, falling back to the first available preset')}</div>
          <div className="mt-1 font-mono">
            {activePreset?.config.provider || 'unknown'} · {activePreset?.config.model || 'unknown'}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--text-secondary)' }}>
            {text('测试输入', 'Test Input')}
          </label>
          <input
            type="text"
            value={testInput}
            onChange={(event) => setTestInput(event.target.value)}
            className="input text-sm"
          />
        </div>

        <button onClick={handleTest} disabled={isLoading} className="btn btn-primary w-full text-xs">
          {isLoading ? text('测试中...', 'Testing...') : text('测试 API', 'Test API')}
        </button>

        {result && (
          <div
            className="max-h-[320px] overflow-y-auto whitespace-pre-wrap rounded-lg p-3 text-xs font-mono"
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {result}
          </div>
        )}

        <div
          className="rounded-lg p-3"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h4 className="mb-2 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {text('说明', 'Notes')}
          </h4>
          <div className="space-y-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <p>
              {text(
                '这里直接复用了运行时 AI 请求逻辑，不再单独拼一套只适配某个提供商的测试代码。',
                'This panel reuses the same runtime request path as generation, instead of maintaining a separate one-off test flow.',
              )}
            </p>
            <p>
              {text(
                '如果连接失败，优先检查 Provider、Base URL、API Path、模型名和 API Key 是否属于同一套接口协议。',
                'If the request fails, first verify that the provider, base URL, API path, model name, and API key all belong to the same API stack.',
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
