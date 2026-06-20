import CartSidebar from '../components/cart/CartSidebar'

export default function Cart() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--brown-800), var(--brown-600))',
        color: 'var(--cream)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '2.5rem' }}>Your Cart</h1>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 640 }}>
        <div className="card">
          <CartSidebar />
        </div>
      </div>
    </div>
  )
}
