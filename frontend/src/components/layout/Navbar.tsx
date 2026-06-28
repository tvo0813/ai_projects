import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { STORE_NAME, GRAB_URL } from '../../config/store'

export default function Navbar() {
  const location  = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  const navLinks = [
    { to: '/',          label: 'Home' },
    { to: '/menu',      label: 'Menu' },
    { to: '/deals',     label: 'Deals' },
    { to: '/locations', label: 'Locations' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <>
      <style>{`
        .nav-desktop-links { display: flex; align-items: center; gap: 2rem; }
        .nav-desktop-right  { display: flex; align-items: center; gap: 0.75rem; }
        .nav-mobile-right   { display: none; align-items: center; gap: 0.6rem; }
        .nav-mobile-drawer  { display: none; }
        @media (max-width: 700px) {
          .nav-desktop-links { display: none; }
          .nav-desktop-right  { display: none; }
          .nav-mobile-right   { display: flex; }
          .nav-mobile-drawer.open { display: flex; }
        }
        .nav-link {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: color 0.18s;
          position: relative;
          padding: 0.25rem 0;
          font-family: var(--font-body);
          cursor: none;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0;
          width: 100%; height: 1px;
          background: var(--amber);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.22s cubic-bezier(0.22,1,0.36,1);
        }
        .nav-link:hover::after,
        .nav-link.active::after { transform: scaleX(1); }
        .nav-link.active { color: var(--amber); }
      `}</style>

      <motion.nav
        animate={{
          background: scrolled ? 'rgba(14,8,6,0.94)' : 'rgba(14,8,6,0.75)',
          borderBottomColor: scrolled ? 'rgba(200,169,110,0.14)' : 'rgba(200,169,110,0.07)',
          boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.55)' : 'none',
        }}
        transition={{ duration: 0.3 }}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '0 1.5rem',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid rgba(200,169,110,0.07)',
        }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', flexShrink: 0 }}>
          <motion.div whileHover={{ rotate: 10, scale: 1.08 }} transition={{ type: 'spring', stiffness: 300 }}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--amber), var(--amber-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--espresso)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>
            </svg>
          </motion.div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--cream-warm)', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
            {STORE_NAME}
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="nav-desktop-links">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className={`nav-link${isActive(to) ? ' active' : ''}`}
              style={{ color: isActive(to) ? 'var(--amber)' : 'rgba(245,237,214,0.55)' }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="nav-desktop-right">
          {GRAB_URL && (
            <a href={GRAB_URL} target="_blank" rel="noopener noreferrer">
              <motion.span whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(200,169,110,0.35)' }} whileTap={{ scale: 0.96 }}
                style={{ display: 'inline-block', padding: '0.5rem 1.4rem', background: 'linear-gradient(135deg, var(--amber), var(--amber-dark))', color: 'var(--espresso)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', cursor: 'none' }}>
                Order
              </motion.span>
            </a>
          )}
        </div>

        {/* Mobile right */}
        <div className="nav-mobile-right">
          {GRAB_URL && (
            <a href={GRAB_URL} target="_blank" rel="noopener noreferrer">
              <span style={{ display: 'inline-block', padding: '0.45rem 1rem', background: 'linear-gradient(135deg, var(--amber), var(--amber-dark))', color: 'var(--espresso)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                Order
              </span>
            </a>
          )}
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'none', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ display: 'block', width: 22, height: 1.5, background: 'var(--amber)', borderRadius: 2, transition: 'transform 0.22s', transform: menuOpen ? 'rotate(45deg) translate(4.5px, 4.5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 1.5, background: 'var(--amber)', borderRadius: 2, transition: 'opacity 0.22s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 1.5, background: 'var(--amber)', borderRadius: 2, transition: 'transform 0.22s', transform: menuOpen ? 'rotate(-45deg) translate(4.5px, -4.5px)' : 'none' }} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="nav-mobile-drawer open"
            style={{ position: 'fixed', top: 64, left: 0, right: 0, background: 'rgba(14,8,6,0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(200,169,110,0.1)', zIndex: 99, padding: '0.75rem 1.5rem 1.5rem', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            {navLinks.map(({ to, label }, i) => (
              <motion.div key={to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                <Link to={to} onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: isActive(to) ? 700 : 500, color: isActive(to) ? 'var(--amber)' : 'rgba(245,237,214,0.6)', padding: '0.9rem 0', borderBottom: '1px solid rgba(200,169,110,0.07)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                  {label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
