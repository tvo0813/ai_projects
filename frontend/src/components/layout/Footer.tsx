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

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/menu"  style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Menu</Link>
          <Link to="/deals" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rewards</Link>
          <a href="#" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Privacy Policy</a>
          <a href="#" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Accessibility</a>
        </div>
      </div>
    </footer>
  )
}
