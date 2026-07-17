import { useLocale } from '../../hooks/useLocale'
import type { QuickTweak } from '../../services/pageTypes'
import type { ImageData } from '../../services/runtimeAI'
import { useGenerationStore } from '../../stores/generationStore'

interface ChatInputCardProps {
  chatInput: string
  setChatInput: (value: string) => void
  attachedImage: (ImageData & { previewUrl: string }) | null
  setAttachedImage: (img: (ImageData & { previewUrl: string }) | null) => void
  isGenerating: boolean
  isAnalyzing: boolean
  visionSupported: boolean
  hasContent: boolean
  onSend: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  tweaks: QuickTweak[]
  onTweak: (tweak: QuickTweak) => void
}

export default function ChatInputCard({
  chatInput,
  setChatInput,
  attachedImage,
  setAttachedImage,
  isGenerating,
  isAnalyzing,
  visionSupported,
  hasContent,
  onSend,
  fileInputRef,
  onImageSelect,
  tweaks,
  onTweak,
}: ChatInputCardProps) {
  const { text } = useLocale()

  return (
    <div className="shrink-0 px-3 pb-3 pt-2 space-y-2" style={{ background: 'var(--bg-surface)' }}>

      {/* Quick tweak chips — horizontal scroll, no wrap */}
      {hasContent && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {tweaks.map((tweak) => (
            <button
              key={tweak.id}
              type="button"
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.72)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onClick={() => onTweak(tweak)}
              disabled={isGenerating}
            >
              {tweak.label}
            </button>
          ))}
        </div>
      )}

      {/* Unified input card */}
      <div
        className="rounded-[20px] border transition-shadow"
        style={{
          background: 'rgba(255,255,255,0.82)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(61,43,32,0.07)',
        }}
      >
        {/* Image preview inside card */}
        {attachedImage && (
          <div className="flex items-center gap-2 border-b px-3 pt-2.5 pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="relative shrink-0">
              <img
                src={attachedImage.previewUrl}
                alt=""
                className="h-10 w-10 rounded-[8px] object-cover"
                style={{ border: '1px solid var(--border-subtle)' }}
              />
              <button
                type="button"
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-white text-[10px] leading-none"
                style={{ background: 'var(--text-secondary)' }}
                onClick={() => setAttachedImage(null)}
              >
                ×
              </button>
            </div>
            <span
              className="text-xs"
              style={{ color: attachedImage && !visionSupported ? '#c45c0a' : 'var(--text-muted)' }}
            >
              {attachedImage && !visionSupported
                ? text('⚠️ 当前 AI 不支持图像，建议切换到 Claude 或 GPT-4o', '⚠️ Provider does not support images — switch to Claude or GPT-4o')
                : text('图片已附加，发送后以图生页', 'Image attached — will generate from image')}
            </span>
          </div>
        )}

        {/* Textarea */}
        <textarea
          className="block w-full resize-none bg-transparent px-4 pt-3 text-sm outline-none"
          style={{
            minHeight: '52px',
            maxHeight: '140px',
            color: 'var(--text-primary)',
            caretColor: 'var(--accent)',
          }}
          value={chatInput}
          onChange={(e) => {
            setChatInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isGenerating && !isAnalyzing) {
              if (chatInput.trim() || attachedImage) {
                e.preventDefault()
                onSend()
              }
            }
          }}
          placeholder={
            hasContent
              ? text('告诉 Nova 要改什么，或上传图片参考…', 'Tell Nova what to change, or upload an image…')
              : text('描述页面概念，或上传设计图…', 'Describe your page concept, or upload a design…')
          }
          disabled={isGenerating || isAnalyzing}
          rows={1}
        />

        {/* Bottom toolbar inside card */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left: attach + hint */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={onImageSelect}
            />
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: attachedImage ? 'var(--accent-light)' : visionSupported ? 'var(--text-secondary)' : 'var(--text-disabled)' }}
              onClick={() => visionSupported && fileInputRef.current?.click()}
              disabled={isGenerating || !visionSupported}
              title={visionSupported ? text('上传图片', 'Upload image') : text('当前提供商不支持图像输入', 'Current provider does not support image input')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </button>
            {isGenerating ? (
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {text('生成中…', 'Generating…')}
                </span>
              </div>
            ) : (
              <span className="text-[11px] select-none" style={{ color: 'var(--text-disabled)' }}>
                {text('Enter 发送 · Shift+Enter 换行', 'Enter to send · Shift+Enter for newline')}
              </span>
            )}
          </div>

          {/* Right: send / stop */}
          {isGenerating ? (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
              style={{ background: 'rgba(203,111,111,0.12)', color: '#c0504d' }}
              onClick={() => useGenerationStore.getState().abortController?.abort()}
              title={text('停止生成', 'Stop')}
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-30"
              style={(() => {
                const canSend = !!(chatInput.trim() || attachedImage) && !(attachedImage && !visionSupported && !chatInput.trim())
                return {
                  background: canSend ? 'var(--gradient-brand)' : 'rgba(0,0,0,0.08)',
                  color: canSend ? 'white' : 'var(--text-disabled)',
                  boxShadow: canSend ? 'var(--shadow-sm)' : 'none',
                }
              })()}
              onClick={onSend}
              disabled={(!chatInput.trim() && !attachedImage) || (!!attachedImage && !visionSupported && !chatInput.trim())}
              title={attachedImage && !visionSupported ? text('当前 AI 不支持图像，请先切换到 Claude 或 GPT-4o', 'Provider does not support images — switch to Claude or GPT-4o') : text('发送', 'Send')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
