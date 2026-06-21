import { Link } from 'react-router-dom'
import { STORE_NAME } from '../../config/store'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--white)',
      padding: '1.75rem 1.5rem',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/careers" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--green-dark)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Careers</Link>
          <Link to="/privacy" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--green-dark)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Privacy Policy</Link>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--green-dark)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--green-dark)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--green-dark)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
