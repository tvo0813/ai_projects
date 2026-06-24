import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { STORE_NAME, GRAB_URL } from '../../config/store'

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/deals', label: 'Deals' },
    { to: '/locations', label: 'Locations' },
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
        background: 'rgba(20,12,8,0.82)',
        borderBottom: '1px solid rgba(200,169,110,0.12)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
            background: 'linear-gradient(135deg, var(--amber, #C8A96E), var(--amber-dark, #9E7A3F))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0,
          }}>☕</div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.05rem', fontWeight: 700,
            color: 'var(--cream-warm, #F5EDD6)', whiteSpace: 'nowrap',
          }}>
            {STORE_NAME}
          </span>
        </Link>

        {/* Desktop — center nav links */}
        <div className="nav-desktop-links">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              fontSize: '0.875rem', fontWeight: 600,
              color: isActive(to) ? 'var(--amber, #C8A96E)' : 'rgba(245,237,214,0.65)',
              padding: '0.25rem 0',
              borderBottom: isActive(to) ? '2px solid var(--amber, #C8A96E)' : '2px solid transparent',
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
              style={{
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(135deg, var(--amber, #C8A96E), var(--amber-dark, #9E7A3F))',
                color: 'var(--espresso, #140C08)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem', fontWeight: 700,
                whiteSpace: 'nowrap', textDecoration: 'none',
                letterSpacing: '0.04em',
              }}>
              Order
            </a>
          )}
        </div>

        {/* Mobile — Order + hamburger */}
        <div className="nav-mobile-right">
          {GRAB_URL && (
            <a href={GRAB_URL} target="_blank" rel="noopener noreferrer"
              style={{
                padding: '0.45rem 0.9rem',
                background: 'linear-gradient(135deg, var(--amber, #C8A96E), var(--amber-dark, #9E7A3F))',
                color: 'var(--espresso, #140C08)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem', fontWeight: 700,
                whiteSpace: 'nowrap', textDecoration: 'none',
                letterSpacing: '0.04em',
              }}>
              Order
            </a>
          )}
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0,
          }}>
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--amber, #C8A96E)', borderRadius: 2, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--amber, #C8A96E)', borderRadius: 2, transition: 'opacity 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--amber, #C8A96E)', borderRadius: 2, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div className={`nav-mobile-drawer${menuOpen ? ' open' : ''}`} style={{
        position: 'fixed', top: 64, left: 0, right: 0,
        background: 'rgba(20,12,8,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(200,169,110,0.12)',
        zIndex: 99, padding: '0.75rem 1.25rem 1.25rem',
        flexDirection: 'column', gap: 0,
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      }}>
        {navLinks.map(({ to, label }) => (
          <Link key={to} to={to} onClick={closeMenu} style={{
            fontSize: '1rem',
            fontWeight: isActive(to) ? 700 : 500,
            color: isActive(to) ? 'var(--amber, #C8A96E)' : 'rgba(245,237,214,0.7)',
            padding: '0.85rem 0',
            borderBottom: '1px solid rgba(200,169,110,0.08)',
            textDecoration: 'none',
          }}>
            {label}
          </Link>
        ))}
      </div>
    </>
  )
}
