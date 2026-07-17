import type { Message } from '../../services/ai'

interface MessageListProps {
  messages: Message[]
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export default function MessageList({ messages, messagesEndRef }: MessageListProps) {
  return (
    <div className="space-y-2">
      {messages.map((msg, index) => (
        <div
          key={msg.id ?? String(index)}
          className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <svg className="h-3 w-3 fill-white" viewBox="0 0 24 24">
                <path d="M4 4h4v16H4V4Zm4 0h4l6 16h-4L9.5 8.5 8 20H4L8 4Z" />
              </svg>
            </div>
          )}
          <div
            className="max-w-[85%] rounded-[14px] px-3 py-2 text-sm leading-5"
            style={{
              background: msg.role === 'user' ? 'var(--bg-accent-soft)' : 'rgba(255,255,255,0.6)',
              color: 'var(--text-primary)',
              border: msg.role === 'assistant' ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            {msg.summary || msg.content}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
