import { useState, useEffect, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import api from '../../api/client'
import { STORE_NAME } from '../../config/store'
import { ORDER_STATUSES } from '../../constants/orderStatus'
import type { Order } from '../../api/orders'
import type { MenuItem } from '../../api/menu'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'orders' | 'menu' | 'deals'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)

  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', description: '', is_available: true })
  const [newDeal, setNewDeal] = useState({ code: '', deal_type: 'spin_to_win', title: '', discount_type: 'percentage', discount_value: '', win_probability: '0.5' })

  if (!user?.is_admin) return <Navigate to="/" />

  const loadOrders = () => {
    setLoading(true)
    api.get('/orders/').then((r) => setOrders(r.data)).finally(() => setLoading(false))
  }

  const loadMenu = () => {
    setLoading(true)
    api.get('/menu/').then((r) => setMenuItems(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'orders') loadOrders()
    if (tab === 'menu') loadMenu()
  }, [tab])

  const updateStatus = async (orderId: number, status: string) => {
    await api.patch(`/orders/${orderId}/status`, { status })
    toast.success('Status updated')
    loadOrders()
  }

  const toggleAvailability = async (itemId: string, current: boolean) => {
    await api.put(`/menu/${itemId}`, { is_available: !current })
    toast.success('Updated')
    loadMenu()
  }

  const createItem = async (e: FormEvent) => {
    e.preventDefault()
    await api.post('/menu/', { ...newItem, price: parseFloat(newItem.price) })
    toast.success('Item created')
    setNewItem({ name: '', category: '', price: '', description: '', is_available: true })
    loadMenu()
  }

  const createDeal = async (e: FormEvent) => {
    e.preventDefault()
    await api.post('/deals/', { ...newDeal, discount_value: parseFloat(newDeal.discount_value), win_probability: parseFloat(newDeal.win_probability) })
    toast.success('Deal created')
    setNewDeal({ code: '', deal_type: 'spin_to_win', title: '', discount_type: 'percentage', discount_value: '', win_probability: '0.5' })
  }

  const tabs = [
    { key: 'orders', label: '📋 Orders' },
    { key: 'menu', label: '☕ Menu' },
    { key: 'deals', label: '🎰 Deals' },
  ] as const

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ background: 'var(--brown-900)', color: 'var(--cream)', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--brown-300)' }}>{STORE_NAME} — Back Office</p>
      </div>

      <div style={{ borderBottom: '2px solid var(--brown-200)', background: 'var(--white)', display: 'flex', gap: '0' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'none',
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? 'var(--brown-500)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '3px solid var(--brown-500)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>}

        {tab === 'orders' && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Live Orders ({orders.length})</h2>
              <button className="btn btn-outline" onClick={loadOrders}>↻ Refresh</button>
            </div>
            {orders.map((order) => (
              <div key={order.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>Order #{order.id} — {order.customer_name || 'Guest'}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleString()}</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {order.items.map((i) => `${i.item_name} ×${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: 'var(--brown-500)' }}>${order.total_amount.toFixed(2)}</p>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brown-300)' }}
                    >
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'menu' && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Menu Items ({menuItems.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {menuItems.map((item) => (
                  <div key={item.item_id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>{item.name}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.category} · ${item.price}</p>
                    </div>
                    <button
                      className={`btn ${item.is_available ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => toggleAvailability(item.item_id, item.is_available)}
                      style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                    >
                      {item.is_available ? 'Mark Sold Out' : 'Mark Available'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Add New Item</h3>
              <form onSubmit={createItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group"><label>Name</label><input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required /></div>
                <div className="form-group"><label>Category</label><input type="text" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="espresso, matcha, pastry..." required /></div>
                <div className="form-group"><label>Price ($)</label><input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} step="0.01" required /></div>
                <div className="form-group"><label>Description</label><input type="text" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} /></div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Add Item</button>
              </form>
            </div>
          </div>
        )}

        {tab === 'deals' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Active Deals</h2>
              <p style={{ color: 'var(--text-muted)' }}>Deals are managed via the API. Use the form to create new spin-to-win deals for the wheel.</p>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Create Deal</h3>
              <form onSubmit={createDeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group"><label>Code</label><input type="text" value={newDeal.code} onChange={(e) => setNewDeal({ ...newDeal, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" required /></div>
                <div className="form-group"><label>Title</label><input type="text" value={newDeal.title} onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })} placeholder="20% Off Any Drink" required /></div>
                <div className="form-group">
                  <label>Discount Type</label>
                  <select value={newDeal.discount_type} onChange={(e) => setNewDeal({ ...newDeal, discount_type: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount ($)</option>
                  </select>
                </div>
                <div className="form-group"><label>Discount Value</label><input type="number" value={newDeal.discount_value} onChange={(e) => setNewDeal({ ...newDeal, discount_value: e.target.value })} step="0.01" required /></div>
                <div className="form-group"><label>Win Probability (0–1)</label><input type="number" value={newDeal.win_probability} onChange={(e) => setNewDeal({ ...newDeal, win_probability: e.target.value })} step="0.01" min="0" max="1" required /></div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Create Deal</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
