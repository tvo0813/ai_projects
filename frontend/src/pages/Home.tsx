import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { STORE_NAME, STORE_TAGLINE } from '../config/store'
import { getMenuItems, type MenuItem } from '../api/menu'
import ChatBot from '../components/ChatBot'

const PILLARS = [
  { icon: '🇻🇳', title: 'Rooted in Vietnam', desc: 'Every recipe traces back to the streets of Saigon and Hanoi — where coffee isn\'t just a drink, it\'s a daily ritual.' },
  { icon: '🌿', title: 'Fresh, Always', desc: 'We brew to order, source seasonally, and never cut corners. What\'s in your cup was made for you, not a shelf.' },
  { icon: '☕', title: 'Authentic to the Last Drop', desc: 'From our phin-drip method to our condensed milk ratio — we do it the Vietnamese way, exactly as it was meant to be.' },
  { icon: '🤝', title: 'Here for Our Community', desc: 'We\'re your neighborhood spot. We know your order, your name, and we\'re honored you choose to spend your morning with us.' },
]

export default function Home() {
  const [signatures, setSignatures] = useState<MenuItem[]>([])

  useEffect(() => {
    getMenuItems('signature').then(setSignatures).catch(() => {})
  }, [])

  return (
    <div>
      {/* ── Hero ───────────────────────────── */}
      <section style={{
        background: 'var(--green-dark)',
        color: 'var(--white)',
        padding: '5rem 1.5rem 6rem',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '1rem' }}>
            Handcrafted with care
          </p>
          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 700,
            marginBottom: '1.25rem',
            color: 'var(--white)',
          }}>
            {STORE_NAME}
          </h1>
          <p style={{
            fontSize: '1.15rem',
            color: 'var(--green-light)',
            maxWidth: 520,
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}>
            {STORE_TAGLINE}
          </p>
        </motion.div>
      </section>

      {/* ── Our story ───────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--white)' }}>
        <div className="container" style={{ maxWidth: 860 }}>

          {/* Story text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            style={{ textAlign: 'center', marginBottom: '4rem' }}
          >
            <p className="section-label" style={{ marginBottom: '0.75rem' }}>Our story</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: '1.75rem' }}>
              Born from the streets of Vietnam
            </h2>
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.85,
              maxWidth: 680,
              margin: '0 auto 1.25rem',
            }}>
              It started with a memory — the smell of a phin drip slowly filling a small glass on a plastic stool
              outside a Saigon café at 7 in the morning. Strong, sweet, unhurried. Vietnam doesn't rush its coffee,
              and neither do we.
            </p>
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.85,
              maxWidth: 680,
              margin: '0 auto 1.25rem',
            }}>
              We opened our doors because we wanted to share that feeling with our community — not a watered-down
              version of it, but the real thing. Every drink we serve is made the way it was meant to be made:
              with a proper phin filter, real condensed milk, and ingredients we're proud of.
            </p>
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.85,
              maxWidth: 680,
              margin: '0 auto',
            }}>
              Vietnamese coffee culture is about more than caffeine — it's about slowing down, connecting,
              and savoring something made with care. That's what we bring to every cup, every day,
              for everyone who walks through our door.
            </p>
          </motion.div>

          {/* Pillars */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
          }}>
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  width: 56, height: 56,
                  borderRadius: '50%',
                  background: 'var(--green-xlight)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                  margin: '0 auto 1rem',
                }}>
                  {p.icon}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{p.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Menu chatbot ────────────────────── */}
      <ChatBot />

      {/* ── Signature drinks ────────────────── */}
      {signatures.length > 0 && (
        <section style={{ padding: '4.5rem 1.5rem', background: 'var(--cream)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p className="section-label" style={{ marginBottom: '0.5rem' }}>House specials</p>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)' }}>Signature Drinks</h2>
              </div>
              <Link to="/menu" className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.55rem 1.25rem' }}>
                See full menu →
              </Link>
            </div>

            <motion.div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            >
              {signatures.map((item) => (
                <motion.div
                  key={item.item_id}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.09)' }}
                >
                  <Link to="/menu" style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="card" style={{ overflow: 'hidden' }}>
                      <div style={{
                        height: 140,
                        background: item.image_url ? `url(${item.image_url}) center/cover no-repeat` : 'var(--green-xlight)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem',
                      }}>
                        {!item.image_url && '☕'}
                      </div>
                      <div style={{ padding: '0.9rem 1rem 1rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
                          {item.name}
                        </p>
                        <p style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.875rem' }}>
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

    </div>
  )
}
