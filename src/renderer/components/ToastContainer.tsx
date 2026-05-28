import { useEffect, useState } from 'react'
import { useLocale } from '../hooks/useLocale'
import { useAppStore } from '../stores/appStore'

type ToastType = 'error' | 'success' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
}

export default function ToastContainer() {
  const { error, setError, success, setSuccess } = useAppStore()
  const { text } = useLocale()
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (!error) return

    const id = Date.now().toString()
    const capturedError = error
    setToasts((prev) => [...prev, { id, ...parseError(capturedError, text) }])

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 6000)

    return () => clearTimeout(timer)
  }, [error, text])

  useEffect(() => {
    if (!success) return

    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, type: 'success', message: success }])

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 3000)

    return () => clearTimeout(timer)
  }, [success])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex max-w-[380px] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-up flex items-start gap-3 rounded-xl border p-4 backdrop-blur-sm"
          style={{
            background: getBgColor(toast.type),
            borderColor: getBorderColor(toast.type),
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="mt-0.5 shrink-0">{getIcon(toast.type)}</div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium" style={{ color: getTextColor(toast.type) }}>
              {toast.message}
            </p>
            {toast.description && (
              <p className="mt-1 text-xs opacity-80" style={{ color: getTextColor(toast.type) }}>
                {toast.description}
              </p>
            )}
          </div>

          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
            className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
            style={{ color: getTextColor(toast.type) }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

function parseError(error: string, text: <T>(zhValue: T, enValue: T) => T): { type: ToastType; message: string; description?: string } {
  if (error.includes('daily_checkin_required') || error.includes('/checkin')) {
    return {
      type: 'warning',
      message: text('需要每日签到', 'Daily check-in required'),
      description: text('上游提供商要求先完成每日 Discord 签到，这个密钥才能继续使用。', 'The upstream provider requires a daily Discord check-in before this key can be used.'),
    }
  }

  if (error.includes('API Key') || error.includes('apiKey') || error.includes('401')) {
    return {
      type: 'warning',
      message: text('API 凭据有问题', 'API credentials issue'),
      description: text('检查当前提供商配置下的 API Key 是否有效并已保存。', 'Check whether the API key is valid and saved under the active provider configuration.'),
    }
  }

  if (error.includes('fetch') || error.includes('network') || error.includes('Network')) {
    return {
      type: 'error',
      message: text('网络请求失败', 'Network request failed'),
      description: text('确认网络连通，并检查当前运行环境是否能访问目标 API。', 'Verify connectivity and confirm the target API host is reachable from the current runtime.'),
    }
  }

  if (error.includes('timeout') || error.includes('Abort') || error.includes('504')) {
    return {
      type: 'warning',
      message: text('请求超时', 'Request timed out'),
      description: text('可以尝试更快的模型、更短的提示词，或换一个延迟更低的提供商。', 'Try a faster model, a shorter prompt, or a provider with lower latency.'),
    }
  }

  if (error.includes('404') || error.includes('model')) {
    return {
      type: 'warning',
      message: text('模型或接口不匹配', 'Model or endpoint mismatch'),
      description: text('当前模型名或 API 路径可能和所选提供商不匹配。', 'The current model name or API path may not match the selected provider.'),
    }
  }

  if (error.includes('quota') || error.includes('429') || error.includes('rate limit')) {
    return {
      type: 'warning',
      message: text('额度或频率已达上限', 'Quota or rate limit reached'),
      description: text('提供商因为额度或请求频率限制，拒绝了这次请求。', 'The provider rejected the request due to quota or request frequency limits.'),
    }
  }

  return {
    type: 'error',
    message: text('操作失败', 'Operation failed'),
    description: error,
  }
}

function getBgColor(type: ToastType): string {
  switch (type) {
    case 'error':
      return 'rgba(239, 68, 68, 0.1)'
    case 'success':
      return 'rgba(16, 185, 129, 0.1)'
    case 'warning':
      return 'rgba(245, 158, 11, 0.1)'
    case 'info':
      return 'rgba(99, 102, 241, 0.1)'
  }
}

function getBorderColor(type: ToastType): string {
  switch (type) {
    case 'error':
      return 'rgba(239, 68, 68, 0.2)'
    case 'success':
      return 'rgba(16, 185, 129, 0.2)'
    case 'warning':
      return 'rgba(245, 158, 11, 0.2)'
    case 'info':
      return 'rgba(99, 102, 241, 0.2)'
  }
}

function getTextColor(type: ToastType): string {
  switch (type) {
    case 'error':
      return '#ef4444'
    case 'success':
      return '#10b981'
    case 'warning':
      return '#f59e0b'
    case 'info':
      return '#6366f1'
  }
}

function getIcon(type: ToastType) {
  const color = getTextColor(type)

  switch (type) {
    case 'error':
      return (
        <svg className="h-5 w-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0 1 18 0z" />
        </svg>
      )
    case 'success':
      return (
        <svg className="h-5 w-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0 1 18 0z" />
        </svg>
      )
    case 'warning':
      return (
        <svg className="h-5 w-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    case 'info':
      return (
        <svg className="h-5 w-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0 1 18 0z" />
        </svg>
      )
  }
}
