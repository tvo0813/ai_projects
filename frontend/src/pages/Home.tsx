import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { STORE_NAME, STORE_TAGLINE, GRAB_URL } from '../config/store'

const PROMO_CARDS = [
  {
    bg: '#1E3932',
    accent: '#D4E9E2',
    emoji: '🍵',
    label: 'New arrival',
    title: 'Ceremonial Matcha',
    body: 'Kagoshima-grade matcha, whisked to perfection. Hot or iced.',
    cta: 'Order now',
    to: '/menu',
  },
  {
    bg: '#2E6D5E',
    accent: '#EEF7F2',
    emoji: '🧊',
    label: 'Customer favourite',
    title: 'Cold Brew Season',
    body: '12-hour steeped cold brew. Smooth, never bitter — year round.',
    cta: 'Try it',
    to: '/menu',
  },
  {
    bg: '#CBA258',
    accent: '#1E3932',
    emoji: '🎰',
    label: 'Rewards',
    title: 'Spin & Win Daily',
    body: 'Log in every day to spin for free drinks, discounts, and more.',
    cta: 'Spin now',
    to: '/deals',
  },
  {
    bg: '#F2F0EB',
    accent: '#1E3932',
    emoji: '🥐',
    label: 'Fresh daily',
    title: 'Pastries & Bites',
    body: 'Butter croissants, avocado toast, and seasonal specials — baked fresh.',
    cta: 'See food menu',
    to: '/menu',
  },
]

const FEATURES = [
  { icon: '🌿', title: 'Ethically Sourced', desc: 'Direct-trade relationships with farmers across 12 origins.' },
  { icon: '☕', title: 'Small-Batch Roasted', desc: 'Peak freshness in every cup — roasted to order.' },
  { icon: '📍', title: 'Find a Store', desc: 'Multiple locations — find the one nearest to you.' },
  { icon: '⭐', title: 'Loyalty Rewards', desc: 'Earn stars with every visit. Redeem for free drinks.' },
]

export default function Home() {
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
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {GRAB_URL ? (
              <a
                href={GRAB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ fontSize: '0.95rem', padding: '0.8rem 2rem', fontWeight: 700 }}
              >
                Order on Grab
              </a>
            ) : null}
            <Link
              to="/menu"
              className={GRAB_URL ? 'btn btn-outline-white' : 'btn btn-primary'}
              style={{ fontSize: '0.95rem', padding: '0.8rem 2rem' }}
            >
              View menu
            </Link>
            {!GRAB_URL && (
              <Link to="/deals" className="btn btn-outline-white" style={{ fontSize: '0.95rem', padding: '0.8rem 2rem' }}>
                Spin & Win
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── Promo card grid ─────────────────── */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--cream)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}>
            {PROMO_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                style={{
                  background: card.bg,
                  borderRadius: 'var(--radius-xl)',
                  padding: '2.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  minHeight: 260,
                }}
              >
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: card.accent,
                  opacity: 0.8,
                }}>
                  {card.label}
                </span>
                <div style={{ fontSize: '2.2rem' }}>{card.emoji}</div>
                <h2 style={{
                  fontSize: '1.4rem',
                  color: card.bg === '#F2F0EB' ? '#1E3932' : '#fff',
                  fontWeight: 700,
                }}>
                  {card.title}
                </h2>
                <p style={{
                  fontSize: '0.9rem',
                  color: card.bg === '#F2F0EB' ? '#4a4a4a' : card.accent,
                  lineHeight: 1.6,
                  flex: 1,
                }}>
                  {card.body}
                </p>
                <Link
                  to={card.to}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: card.bg === '#F2F0EB' ? 'var(--green-dark)' : card.accent,
                    textDecoration: 'underline',
                    textDecorationColor: 'transparent',
                    transition: 'text-decoration-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = 'currentColor')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = 'transparent')}
                >
                  {card.cta} →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ──────────────────────────── */}
      <section style={{ padding: '4.5rem 1.5rem', background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="section-label" style={{ marginBottom: '0.75rem' }}>Our promise</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>More than just coffee</h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
          }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
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
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fan favourites preview ───────────── */}
      <section style={{ padding: '4.5rem 1.5rem', background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="section-label" style={{ marginBottom: '0.5rem' }}>Popular now</p>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)' }}>Fan favourites</h2>
            </div>
            <Link to="/menu" className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.55rem 1.25rem' }}>
              See full menu →
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { name: 'Matcha Latte',  price: 5.50, emoji: '🍵', tag: 'Ceremonial grade' },
              { name: 'Cold Brew',     price: 5.00, emoji: '🧊', tag: '12-hr steep' },
              { name: 'Cappuccino',    price: 5.00, emoji: '☕', tag: 'Double shot' },
              { name: 'Chai Latte',    price: 5.00, emoji: '🫖', tag: 'Spiced masala' },
              { name: 'Croissant',     price: 4.00, emoji: '🥐', tag: 'Freshly baked' },
              { name: 'Iced Americano',price: 4.50, emoji: '🥤', tag: 'Over ice' },
            ].map((item) => (
              <Link
                key={item.name}
                to="/menu"
                className="card"
                style={{ padding: '1.25rem', textAlign: 'center', display: 'block', textDecoration: 'none' }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{item.emoji}</div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{item.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{item.tag}</p>
                <p style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.9rem' }}>${item.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rewards CTA ─────────────────────── */}
      <section style={{
        background: 'var(--green-dark)',
        color: 'var(--white)',
        padding: '5rem 1.5rem',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐</div>
          <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '0.75rem' }}>
            Daily rewards
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: '1rem', color: 'var(--white)' }}>
            Spin the wheel every day
          </h2>
          <p style={{ color: 'var(--green-light)', lineHeight: 1.7, marginBottom: '2rem', fontSize: '1.05rem' }}>
            Try your luck daily for free drinks, discounts, and surprise bonuses.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/deals" className="btn btn-primary" style={{ fontSize: '0.95rem', padding: '0.8rem 2rem' }}>
              Spin the wheel
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
