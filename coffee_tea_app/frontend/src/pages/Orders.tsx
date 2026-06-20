import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders, type Order } from '../api/orders'
import { useAuthStore } from '../store/useAuthStore'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../constants/orderStatus'

export default function Orders() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getMyOrders().then(setOrders).finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <h2>Please log in to view your orders</h2>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--brown-800), var(--brown-600))',
        color: 'var(--cream)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Orders</h1>
        <p style={{ color: 'var(--brown-200)' }}>{user.full_name} · {user.loyalty_points} loyalty points</p>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 720 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>☕</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No orders yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your first brew awaits!</p>
            <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => (
              <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>Order #{order.id}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.35rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: ORDER_STATUS_COLORS[order.status] + '22',
                    color: ORDER_STATUS_COLORS[order.status],
                  }}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>{item.item_name} × {item.quantity}</span>
                      <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
