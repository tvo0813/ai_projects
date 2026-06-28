import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { STORE_NAME, STORE_TAGLINE, STORE_SLUG } from '../../config/store'

const SOCIAL = [
  {
    label: 'Instagram',
    href:  'https://instagram.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href:  'https://facebook.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href:  'https://tiktok.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
      </svg>
    ),
  },
]

const STORE_TAGLINES: Record<string, string> = {
  'phin-and-beans': 'Vietnamese-inspired craft coffee, made slow and served with heart.',
  'phin-drips':     'The Central Highlands in every cup. Slow drip, bold character.',
}

export default function Footer() {
  const tagline = STORE_TAGLINES[STORE_SLUG] ?? STORE_TAGLINE

  return (
    <footer style={{ background: 'var(--espresso)', borderTop: '1px solid rgba(200,169,110,0.1)', padding: '4.5rem 1.5rem 2.5rem', color: 'var(--cream-warm)' }}>
      <div className="container" style={{ maxWidth: 1200 }}>

        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--amber), var(--amber-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--espresso)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--cream-warm)', letterSpacing: '0.01em' }}>
                {STORE_NAME}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'rgba(245,237,214,0.42)', lineHeight: 1.75, maxWidth: 220, fontFamily: 'var(--font-body)' }}>
              {tagline}
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {SOCIAL.map(s => (
                <motion.a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  whileHover={{ y: -2, color: 'var(--amber)' }}
                  style={{ color: 'rgba(245,237,214,0.3)', transition: 'color 0.18s', cursor: 'none' }}>
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,169,110,0.45)', marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>
              Explore
            </p>
            {[{ to: '/', label: 'Home' }, { to: '/menu', label: 'Menu' }, { to: '/deals', label: 'Deals' }, { to: '/locations', label: 'Locations' }].map(({ to, label }) => (
              <div key={to} style={{ marginBottom: '0.65rem' }}>
                <Link to={to} style={{ fontSize: '0.84rem', color: 'rgba(245,237,214,0.45)', fontFamily: 'var(--font-body)', fontWeight: 400, transition: 'color 0.18s', cursor: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--amber-light)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,214,0.45)')}>
                  {label}
                </Link>
              </div>
            ))}
          </div>

          {/* Legal */}
          <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,169,110,0.45)', marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>
              Legal
            </p>
            {[{ to: '/privacy', label: 'Privacy Policy' }, { to: '/careers', label: 'Careers' }].map(({ to, label }) => (
              <div key={to} style={{ marginBottom: '0.65rem' }}>
                <Link to={to} style={{ fontSize: '0.84rem', color: 'rgba(245,237,214,0.45)', fontFamily: 'var(--font-body)', fontWeight: 400, transition: 'color 0.18s', cursor: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--amber-light)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,214,0.45)')}>
                  {label}
                </Link>
              </div>
            ))}
          </div>

          {/* Tagline pull-quote */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: 'rgba(200,169,110,0.35)', lineHeight: 1.45, letterSpacing: '0.01em' }}>
              "Coffee is not a drink.<br />It's a ritual."
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,169,110,0.15), transparent)', marginBottom: '2rem' }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(245,237,214,0.22)', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>
            © 2026 {STORE_NAME}. All rights reserved.
          </p>
          <p style={{ fontSize: '0.72rem', color: 'rgba(200,169,110,0.2)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Crafted with care · Vietnam
          </p>
        </div>
      </div>
    </footer>
  )
}
