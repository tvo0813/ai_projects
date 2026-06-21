import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { STORE_NAME, GRAB_URL } from '../../config/store'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const navLink = (to: string, label: string) => {
    const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
    return (
      <Link
        to={to}
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: active ? 'var(--green)' : 'var(--text-primary)',
          padding: '0.25rem 0',
          borderBottom: active ? '2px solid var(--green)' : '2px solid transparent',
          transition: 'color 0.15s',
        }}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav style={{
      background: 'var(--white)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      height: 68,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'var(--green-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
          flexShrink: 0,
        }}>☕</div>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--green-dark)',
        }}>
          {STORE_NAME}
        </span>
      </Link>

      {/* Center nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {navLink('/', 'Home')}
        {navLink('/menu', 'Menu')}
        {navLink('/deals', 'Deals')}
        {user?.is_admin && navLink('/admin', 'Admin')}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/deals" className="btn btn-outline" style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}>
          Locations
        </Link>
        {GRAB_URL && (
          <a
            href={GRAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem', fontWeight: 700 }}
          >
            Order
          </a>
        )}
        {user?.is_admin && (
          <>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Hi, {user.full_name.split(' ')[0]}
            </span>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="btn btn-ghost"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
