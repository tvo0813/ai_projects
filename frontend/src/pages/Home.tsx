import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { STORE_NAME, STORE_TAGLINE } from '../config/store'

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--brown-900) 0%, var(--brown-700) 100%)',
        color: 'var(--cream)',
        padding: '6rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p style={{ color: 'var(--brown-300)', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Handcrafted with Love
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.2 }}>
            {STORE_NAME}
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--brown-200)', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            {STORE_TAGLINE}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/menu" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
              Explore Menu
            </Link>
            <Link to="/deals" className="btn btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem', borderColor: 'var(--brown-300)', color: 'var(--brown-200)' }}>
              🎰 Spin to Win
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--white)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '3rem' }}>Why {STORE_NAME}?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '🌿', title: 'Ethically Sourced', desc: 'Direct-trade relationships with farmers across 12 countries.' },
              { icon: '☕', title: 'Expert Roasters', desc: 'Small-batch roasting for peak flavor and freshness.' },
              { icon: '📱', title: 'Order Ahead', desc: 'Skip the wait — order online and pick up in minutes.' },
              { icon: '🎰', title: 'Spin & Win', desc: 'Daily deals and rewards just for being a loyal customer.' },
            ].map((f) => (
              <motion.div
                key={f.title}
                className="card"
                style={{ padding: '2rem', textAlign: 'center' }}
                whileHover={{ y: -4 }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Preview */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--cream)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Fan Favourites</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>A taste of what awaits you.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {[
              { name: 'Matcha Latte', price: 5.50, emoji: '🍵', tags: 'Ceremonial grade' },
              { name: 'Cold Brew', price: 5.00, emoji: '🧊', tags: '12-hr steep' },
              { name: 'Cappuccino', price: 5.00, emoji: '☕', tags: 'Double shot' },
              { name: 'Croissant', price: 4.00, emoji: '🥐', tags: 'Freshly baked' },
            ].map((item) => (
              <div key={item.name} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.emoji}</div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{item.tags}</p>
                <p style={{ color: 'var(--brown-500)', fontWeight: 700 }}>${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <Link to="/menu" className="btn btn-primary">View Full Menu →</Link>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: 'var(--green-matcha)',
        color: 'white',
        padding: '4rem 1.5rem',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready for Your First Sip?</h2>
        <p style={{ opacity: 0.9, marginBottom: '2rem', fontSize: '1.1rem' }}>Create an account for loyalty rewards and daily spin deals.</p>
        <Link to="/register" className="btn" style={{ background: 'white', color: 'var(--green-matcha)', fontWeight: 600, padding: '0.9rem 2.5rem', fontSize: '1rem' }}>
          Join the Brew Crew →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--brown-900)', color: 'var(--brown-300)', padding: '2rem 1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
        <p>© {new Date().getFullYear()} {STORE_NAME}. All rights reserved.</p>
      </footer>
    </div>
  )
}
