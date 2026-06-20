import { Link } from 'react-router-dom'
import { useCartStore } from '../../store/useCartStore'

export default function CartSidebar() {
  const { items, removeItem, updateQty, total, dealCode, dealDiscount, clearDeal } = useCartStore()

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
        <h3 style={{ marginBottom: '0.5rem' }}>Your cart is empty</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Add something delicious!</p>
        <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
      </div>
    )
  }

  const subtotal = total()
  const finalTotal = subtotal - dealDiscount

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem' }}>Your Order</h2>

      {items.map((item) => (
        <div key={item.item_id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          background: 'var(--cream-dark)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600 }}>{item.item_name}</p>
            {Object.entries(item.customizations).length > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {Object.entries(item.customizations).map(([k, v]) => `${k}: ${v}`).join(', ')}
              </p>
            )}
            <p style={{ color: 'var(--brown-500)', fontWeight: 500 }}>${(item.unit_price * item.quantity).toFixed(2)}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => updateQty(item.item_id, item.quantity - 1)}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--brown-300)', background: 'white', fontWeight: 700 }}
            >−</button>
            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
            <button
              onClick={() => updateQty(item.item_id, item.quantity + 1)}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--brown-300)', background: 'white', fontWeight: 700 }}
            >+</button>
          </div>
          <button onClick={() => removeItem(item.item_id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
        </div>
      ))}

      <div style={{ borderTop: '1px solid var(--brown-200)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {dealCode && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--green-matcha)' }}>
            <span>Deal: {dealCode} <button onClick={clearDeal} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button></span>
            <span>-${dealDiscount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
          <span>Total</span>
          <span>${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <Link to="/checkout" className="btn btn-primary" style={{ textAlign: 'center', justifyContent: 'center', fontSize: '1rem' }}>
        Proceed to Checkout →
      </Link>
    </div>
  )
}
