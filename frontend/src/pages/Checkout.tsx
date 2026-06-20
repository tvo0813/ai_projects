import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCartStore } from '../store/useCartStore'
import { useAuthStore } from '../store/useAuthStore'
import { validateCode } from '../api/deals'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, total, dealCode, dealDiscount, setDeal, clearDeal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    special_instructions: '',
  })
  const [dealInput, setDealInput] = useState(dealCode || '')
  const [checkingDeal, setCheckingDeal] = useState(false)
  const [loading, setLoading] = useState(false)

  const subtotal = total()
  const finalTotal = subtotal - dealDiscount

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <h2>Your cart is empty</h2>
        <Link to="/menu" className="btn btn-primary">Go to Menu</Link>
      </div>
    )
  }

  const applyDeal = async () => {
    if (!dealInput.trim()) return
    setCheckingDeal(true)
    try {
      const result = await validateCode(dealInput.trim())
      const discountAmt = result.discount_type === 'percentage'
        ? subtotal * (result.discount_value / 100)
        : Math.min(result.discount_value, subtotal)
      setDeal(dealInput.trim(), discountAmt)
      toast.success(`Deal applied: ${result.title}`)
    } catch {
      toast.error('Invalid or expired deal code')
    } finally {
      setCheckingDeal(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // In production, this integrates with Stripe Elements.
      // For demo we simulate a successful payment flow.
      await new Promise((r) => setTimeout(r, 1500))
      clearCart()
      toast.success('Order placed! See you soon ☕')
      navigate('/orders')
    } catch {
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream-dark)', padding: '2rem 1.5rem' }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          {/* Left: form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3>Your Details</h3>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Special Instructions</label>
                <textarea
                  value={form.special_instructions}
                  onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                  placeholder="Allergies, extra shots, etc."
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--brown-200)', borderRadius: 'var(--radius-md)', resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Payment</h3>
              <div style={{
                background: 'var(--cream-dark)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                border: '2px dashed var(--brown-300)',
                marginBottom: '1rem',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  💳 Stripe payment form loads here in production.<br />
                  Connect your Stripe publishable key to activate Apple Pay, Google Pay & cards.
                </p>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '1rem' }}
              >
                {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : `Place Order — $${finalTotal.toFixed(2)}`}
              </button>
            </div>
          </form>

          {/* Right: order summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
              {items.map((item) => (
                <div key={item.item_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--cream-dark)' }}>
                  <span>{item.item_name} × {item.quantity}</span>
                  <span style={{ fontWeight: 500 }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                {dealDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--green-matcha)' }}>
                    <span>Discount</span><span>-${dealDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', paddingTop: '0.5rem', borderTop: '1.5px solid var(--brown-200)' }}>
                  <span>Total</span><span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Deal Code</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={dealInput}
                  onChange={(e) => setDealInput(e.target.value.toUpperCase())}
                  placeholder="BREW-XXXXXXXX"
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-outline" onClick={applyDeal} disabled={checkingDeal} style={{ whiteSpace: 'nowrap' }}>
                  {checkingDeal ? '...' : 'Apply'}
                </button>
              </div>
              {dealCode && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green-matcha)' }}>
                  <span>✓ {dealCode} applied</span>
                  <button onClick={clearDeal} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer' }}>✕</button>
                </div>
              )}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Win codes from the <Link to="/deals" style={{ color: 'var(--brown-500)' }}>Spin Wheel</Link>!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
