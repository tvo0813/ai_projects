import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendChatMessage, type ChatMessage } from '../api/chat'
import { STORE_NAME } from '../config/store'

const SUGGESTIONS = [
  'What are your most popular drinks?',
  'Do you have anything dairy-free?',
  'What\'s your best iced coffee?',
  'Tell me about your matcha options.',
]

export default function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const reply = await sendChatMessage(updated)
      setMessages([...updated, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Sorry, I couldn\'t reach the menu assistant right now. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !loading) send(input.trim())
  }

  return (
    <section style={{ padding: '5rem 1.5rem', background: 'var(--white)' }}>
      <div className="container" style={{ maxWidth: 720 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
        >
          <p className="section-label" style={{ marginBottom: '0.75rem' }}>Ask anything</p>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '0.75rem' }}>
            Menu Assistant
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 480, margin: '0 auto' }}>
            Not sure what to order? Ask about ingredients, customizations, or just tell us what you're in the mood for.
          </p>
        </motion.div>

        {/* Chat window */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'var(--white)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          }}
        >
          {/* Messages area */}
          <div style={{
            minHeight: 320,
            maxHeight: 420,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--cream)',
          }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>☕</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Hi! I'm the {STORE_NAME} menu assistant.<br />Ask me anything about our drinks.
                </p>
                {/* Suggestion pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        background: 'var(--white)',
                        border: '1px solid var(--border)',
                        borderRadius: '9999px',
                        padding: '0.4rem 0.9rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--green)'; (e.target as HTMLElement).style.color = 'var(--green)' }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text-secondary)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        maxWidth: '80%',
                        padding: '0.65rem 1rem',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.role === 'user' ? 'var(--green-dark)' : 'var(--white)',
                        color: msg.role === 'user' ? 'var(--white)' : 'var(--text-primary)',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: 'flex', justifyContent: 'flex-start' }}
                  >
                    <div style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '18px 18px 18px 4px',
                      background: 'var(--white)',
                      border: '1px solid var(--border)',
                      display: 'flex', gap: '4px', alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'var(--text-muted)',
                          display: 'inline-block',
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input bar */}
          <form onSubmit={handleSubmit} className="chatbot-input-bar">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about our drinks..."
              disabled={loading}
              className="chatbot-input"
              onFocus={e => (e.target.style.borderColor = 'var(--green)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn btn-primary chatbot-send-btn"
            >
              Send
            </button>
          </form>
        </motion.div>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .chatbot-input-bar {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border);
          background: var(--white);
        }
        .chatbot-input {
          flex: 1;
          min-width: 0;
          border: 1px solid var(--border);
          border-radius: 9999px;
          padding: 0.6rem 1.1rem;
          font-size: 0.9rem;
          outline: none;
          background: var(--cream);
          color: var(--text-primary);
          transition: border-color 0.15s;
        }
        .chatbot-send-btn {
          padding: 0.6rem 1.25rem;
          font-size: 0.875rem;
          border-radius: 9999px;
          flex-shrink: 0;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .chatbot-input-bar {
            gap: 0.5rem;
            padding: 0.75rem 0.75rem;
          }
          .chatbot-send-btn {
            padding: 0.6rem 0.9rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </section>
  )
}
