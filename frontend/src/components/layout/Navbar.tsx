import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { STORE_NAME, GRAB_URL } from '../../config/store'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/deals', label: 'Deals' },
    { to: '/locations', label: 'Locations' },
    ...(user?.is_admin ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <style>{`
        .nav-desktop-links { display: flex; align-items: center; gap: 1.75rem; }
        .nav-desktop-right  { display: flex; align-items: center; gap: 0.65rem; }
        .nav-mobile-right   { display: none; align-items: center; gap: 0.6rem; }
        .nav-mobile-drawer  { display: none; }

        /* iPhone 17 (393px) · iPhone 17 Pro (402px) · all phones ≤ 700px */
        @media (max-width: 700px) {
          .nav-desktop-links { display: none; }
          .nav-desktop-right  { display: none; }
          .nav-mobile-right   { display: flex; }
          .nav-mobile-drawer.open { display: flex; }
        }
      `}</style>

      <nav style={{
        background: 'var(--white)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.25rem',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>

        {/* Logo */}
        <Link to="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--green-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0,
          }}>☕</div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.05rem', fontWeight: 700,
            color: 'var(--green-dark)', whiteSpace: 'nowrap',
          }}>
            {STORE_NAME}
          </span>
        </Link>

        {/* Desktop — center nav links */}
        <div className="nav-desktop-links">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              fontSize: '0.875rem', fontWeight: 600,
              color: isActive(to) ? 'var(--green)' : 'var(--text-primary)',
              padding: '0.25rem 0',
              borderBottom: isActive(to) ? '2px solid var(--green)' : '2px solid transparent',
              transition: 'color 0.15s', whiteSpace: 'nowrap',
            }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop — right actions */}
        <div className="nav-desktop-right">
          {GRAB_URL && (
            <a href={GRAB_URL} target="_blank" rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Order
            </a>
          )}
          {user?.is_admin && (
            <>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Hi, {user.full_name.split(' ')[0]}
              </span>
              <button onClick={() => { logout(); navigate('/') }}
                className="btn btn-ghost"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}>
                Sign out
              </button>
            </>
          )}
        </div>

        {/* Mobile — Order + hamburger */}
        <div className="nav-mobile-right">
          {GRAB_URL && (
            <a href={GRAB_URL} target="_blank" rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Order
            </a>
          )}
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0,
          }}>
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--green-dark)', borderRadius: 2, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--green-dark)', borderRadius: 2, transition: 'opacity 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--green-dark)', borderRadius: 2, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div className={`nav-mobile-drawer${menuOpen ? ' open' : ''}`} style={{
        position: 'fixed', top: 64, left: 0, right: 0,
        background: 'var(--white)', borderBottom: '1px solid var(--border)',
        zIndex: 99, padding: '0.75rem 1.25rem 1.25rem',
        flexDirection: 'column', gap: 0,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      }}>
        {navLinks.map(({ to, label }) => (
          <Link key={to} to={to} onClick={closeMenu} style={{
            fontSize: '1rem',
            fontWeight: isActive(to) ? 700 : 500,
            color: isActive(to) ? 'var(--green)' : 'var(--text-primary)',
            padding: '0.85rem 0',
            borderBottom: '1px solid var(--border)',
            textDecoration: 'none',
          }}>
            {label}
          </Link>
        ))}
        {user?.is_admin && (
          <button onClick={() => { logout(); navigate('/'); closeMenu() }} style={{
            marginTop: '1rem', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)',
            textAlign: 'left', padding: '0.5rem 0',
          }}>
            Sign out
          </button>
        )}
      </div>
    </>
  )
}
