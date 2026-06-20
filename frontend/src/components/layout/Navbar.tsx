import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useCartStore } from '../../store/useCartStore'
import { STORE_NAME } from '../../config/store'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const items = useCartStore((s) => s.items)
  const navigate = useNavigate()
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <nav style={{
      background: 'var(--brown-900)',
      color: 'var(--cream)',
      padding: '0 1.5rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-lg)',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>☕</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--brown-200)' }}>
          {STORE_NAME}
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/menu" style={{ color: 'var(--brown-200)', fontWeight: 500 }}>Menu</Link>
        <Link to="/deals" style={{ color: 'var(--brown-200)', fontWeight: 500 }}>Deals</Link>
        {user ? (
          <>
            <Link to="/orders" style={{ color: 'var(--brown-200)', fontWeight: 500 }}>My Orders</Link>
            {user.is_admin && <Link to="/admin" style={{ color: 'var(--brown-300)', fontWeight: 500 }}>Admin</Link>}
            <button
              onClick={() => { logout(); navigate('/') }}
              style={{ background: 'none', border: '1px solid var(--brown-400)', color: 'var(--brown-200)', borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ color: 'var(--brown-200)', fontWeight: 500 }}>Login</Link>
        )}
        <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>🛒</span>
          {cartCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: 'var(--brown-400)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}>
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  )
}
