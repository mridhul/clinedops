import React, { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'

import { postAiHelpChat } from '@/api/aiHelp'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi — I'm your ClinEdOps AI Help assistant. Ask about the platform or the knowledge base your team has published (from DOCS at image build time). Answers use retrieval + Groq when the API is configured.",
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const AiHelpPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [draft, setDraft] = useState('')
  const [awaiting, setAwaiting] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, awaiting])

  const send = () => {
    const text = draft.trim()
    if (!text || awaiting) return

    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setDraft('')
    setSendError(null)
    setAwaiting(true)

    void postAiHelpChat(text)
      .then(({ reply }) => {
        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: 'assistant', content: reply },
        ])
      })
      .catch((err: unknown) => {
        const raw = err instanceof Error ? err.message : 'Request failed'
        const lower = raw.toLowerCase()
        let friendly =
          lower.includes('401') || lower.includes('unauthorized')
            ? 'Please sign in to use AI Help.'
            : raw
        if (
          lower.includes('failed to fetch') ||
          lower.includes('networkerror') ||
          lower.includes('load failed')
        ) {
          const base =
            import.meta.env.VITE_API_BASE_URL &&
            typeof import.meta.env.VITE_API_BASE_URL === 'string'
              ? import.meta.env.VITE_API_BASE_URL
              : '(VITE_API_BASE_URL not set)'
          friendly = `${friendly} The UI is calling **${base}**. If the API runs elsewhere or inside Docker only, set **VITE_API_BASE_URL** to the URL your browser can reach (e.g. http://localhost:8000/api/v1) and rebuild the frontend.`
        }
        setSendError(friendly)
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: 'assistant',
            content: friendly,
          },
        ])
      })
      .finally(() => {
        setAwaiting(false)
      })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="cd-section">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl primary-gradient flex items-center justify-center shadow-[0_4px_14px_rgba(0,93,182,0.2)]">
            <Sparkles className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-manrope font-extrabold tracking-tight text-foreground">
              AI Help
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-0.5">
              Answers from your DOCS-backed knowledge base via the API (Groq + RAG).
            </p>
          </div>
        </div>
      </div>

      {sendError ? (
        <p className="text-sm text-destructive max-w-3xl mx-auto" role="alert">
          {sendError}
        </p>
      ) : null}

      <Card className="border-0 shadow-premium glass-card overflow-hidden flex flex-col min-h-[min(70vh,640px)] max-h-[calc(100vh-12rem)]">
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-surface-low/30"
          aria-live="polite"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex w-full', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-surface-lowest border border-border/60 text-foreground rounded-bl-md',
                )}
              >
                {m.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : undefined}>
                    {line.split('**').map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="font-semibold">
                          {part}
                        </strong>
                      ) : (
                        <span key={j}>{part}</span>
                      ),
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {awaiting && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-border/60 bg-surface-lowest px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-flex gap-1" aria-hidden>
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                </span>
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-4 md:p-5 bg-surface-lowest/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message AI Help…"
              className="min-h-[52px] max-h-40 resize-y flex-1 rounded-xl border-border/60 bg-background/80"
              disabled={awaiting}
              rows={2}
              aria-label="Message to AI Help"
            />
            <Button
              type="button"
              onClick={send}
              disabled={awaiting || !draft.trim()}
              className="primary-gradient text-white rounded-xl px-6 h-11 sm:h-auto sm:self-stretch font-semibold shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" aria-hidden />
              Send
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Enter sends · Shift+Enter for a new line
          </p>
        </div>
      </Card>
    </div>
  )
}

export default AiHelpPage
