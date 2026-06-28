import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendChatMessage, type ChatMessage } from '../api/chat'
import { STORE_NAME } from '../config/store'

// ── Static mode: show an offline card instead of the live chatbot ──
const STATIC = import.meta.env.VITE_STATIC_MODE === 'true'

const SUGGESTIONS = [
  'What are your most popular drinks?',
  'Do you have anything dairy-free?',
  'What\'s your best iced coffee?',
  'Tell me about your matcha options.',
]

function ChatBotOffline() {
  return (
    <section style={{ padding: '5rem 1.5rem' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card"
          style={{ padding: '3rem 2rem', textAlign: 'center' }}
        >
          <div style={{ fontSize: '2.8rem', marginBottom: '1.25rem' }}>☕</div>
          <p className="section-label" style={{ color: 'var(--amber)', marginBottom: '0.75rem' }}>
            Ask anything
          </p>
          <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: 'var(--cream-warm)', marginBottom: '1rem', fontWeight: 700 }}>
            Menu Assistant
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'rgba(245,237,214,0.55)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 1.75rem', fontWeight: 300 }}>
            Our AI menu assistant runs locally in-store via Ollama.
            Visit us or order online to chat with it in real time.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/menu" style={{
              padding: '0.7rem 1.75rem',
              background: 'linear-gradient(135deg, var(--amber), var(--amber-dark))',
              color: 'var(--espresso)', borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem', fontWeight: 700,
              letterSpacing: '0.04em', textDecoration: 'none',
            }}>
              Browse Menu
            </a>
            <a href="/locations" style={{
              padding: '0.7rem 1.75rem',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--cream-warm)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem', fontWeight: 600,
              letterSpacing: '0.04em', textDecoration: 'none',
            }}>
              Find a Location
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default function ChatBot() {
  if (STATIC) return <ChatBotOffline />
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
    <section style={{ padding: '5rem 1.5rem' }}>
      <div className="container" style={{ maxWidth: 720 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
        >
          <p className="section-label" style={{ color: 'var(--amber)', marginBottom: '0.75rem' }}>Ask anything</p>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', marginBottom: '0.75rem', color: 'var(--cream-warm)', fontWeight: 300, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            Menu Assistant
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(245,237,214,0.5)', lineHeight: 1.75, maxWidth: 480, margin: '0 auto', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
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
            border: '1px solid rgba(200,169,110,0.12)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 16px 60px rgba(0,0,0,0.55)',
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
            background: 'rgba(14,8,6,0.4)',
          }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.4)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>
                  </svg>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'rgba(245,237,214,0.4)', marginBottom: '1.5rem', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
                  Hi! I'm the {STORE_NAME} menu assistant.<br />Ask me anything about our drinks.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        background: 'rgba(200,169,110,0.07)',
                        border: '1px solid rgba(200,169,110,0.2)',
                        borderRadius: '9999px',
                        padding: '0.4rem 0.9rem',
                        fontSize: '0.78rem',
                        color: 'rgba(200,169,110,0.65)',
                        cursor: 'none',
                        transition: 'all 0.18s',
                        fontFamily: 'var(--font-body)',
                        letterSpacing: '0.02em',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,169,110,0.14)'; e.currentTarget.style.color = 'var(--amber)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,169,110,0.07)'; e.currentTarget.style.color = 'rgba(200,169,110,0.65)' }}
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
                      style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                      <div style={{
                        maxWidth: '80%',
                        padding: '0.7rem 1.1rem',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, var(--amber), var(--amber-dark))'
                          : 'rgba(255,255,255,0.06)',
                        color: msg.role === 'user' ? 'var(--espresso)' : 'rgba(245,237,214,0.8)',
                        fontSize: '0.875rem',
                        lineHeight: 1.65,
                        border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                        fontFamily: 'var(--font-body)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '0.7rem 1.1rem', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(200,169,110,0.5)', display: 'inline-block', animation: `chatbounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
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
            />
            <button type="submit" disabled={!input.trim() || loading} className="chatbot-send-btn">
              Send
            </button>
          </form>
        </motion.div>

      </div>

      <style>{`
        @keyframes chatbounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        .chatbot-input-bar {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-top: 1px solid rgba(200,169,110,0.1);
          background: rgba(14,8,6,0.5);
        }
        .chatbot-input {
          flex: 1;
          min-width: 0;
          border: 1px solid rgba(200,169,110,0.18);
          border-radius: 9999px;
          padding: 0.65rem 1.1rem;
          font-size: 0.875rem;
          outline: none;
          background: rgba(255,255,255,0.04);
          color: var(--cream-warm);
          transition: border-color 0.18s, background 0.18s;
          font-family: var(--font-body);
          cursor: text;
        }
        .chatbot-input::placeholder { color: rgba(200,169,110,0.3); }
        .chatbot-input:focus { border-color: rgba(200,169,110,0.45); background: rgba(255,255,255,0.06); }
        .chatbot-send-btn {
          padding: 0.65rem 1.35rem;
          font-size: 0.8rem;
          border-radius: 9999px;
          flex-shrink: 0;
          white-space: nowrap;
          background: linear-gradient(135deg, var(--amber), var(--amber-dark));
          color: var(--espresso);
          border: none;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-family: var(--font-body);
          cursor: none;
          transition: opacity 0.18s;
        }
        .chatbot-send-btn:disabled { opacity: 0.4; }
        @media (max-width: 480px) {
          .chatbot-input-bar { gap: 0.5rem; padding: 0.75rem; }
          .chatbot-send-btn { padding: 0.65rem 0.9rem; font-size: 0.75rem; }
        }
      `}</style>
    </section>
  )
}
