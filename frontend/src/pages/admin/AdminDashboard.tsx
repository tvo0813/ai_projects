import { useState, useEffect, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import api from '../../api/client'
import { STORE_NAME } from '../../config/store'
import type { MenuItem } from '../../api/menu'

type Tab = 'menu' | 'deals'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('menu')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading]     = useState(false)

  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', description: '', is_available: true })
  const [newDeal, setNewDeal] = useState({ code: '', deal_type: 'spin_to_win', title: '', discount_type: 'percentage', discount_value: '', win_probability: '0.5' })

  if (!user?.is_admin) return <Navigate to="/" />

  const loadMenu = () => {
    setLoading(true)
    api.get('/menu/').then((r) => setMenuItems(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'menu') loadMenu()
  }, [tab])

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
    await api.post('/deals/', {
      ...newDeal,
      discount_value: parseFloat(newDeal.discount_value),
      win_probability: parseFloat(newDeal.win_probability),
    })
    toast.success('Deal created')
    setNewDeal({ code: '', deal_type: 'spin_to_win', title: '', discount_type: 'percentage', discount_value: '', win_probability: '0.5' })
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'menu',  label: 'Menu' },
    { key: 'deals', label: 'Deals' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'var(--green-dark)', color: 'var(--white)', padding: '2rem 1.5rem' }}>
        <div className="container">
          <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '0.5rem' }}>Back office</p>
          <h1 style={{ fontSize: '1.9rem', color: 'var(--white)' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--green-light)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{STORE_NAME}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 1.5rem' }}>
        <div className="container" style={{ display: 'flex', gap: '0' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'none',
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: '0.9rem',
                color: tab === t.key ? 'var(--green)' : 'var(--text-muted)',
                borderBottom: tab === t.key ? '2.5px solid var(--green)' : '2.5px solid transparent',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        )}

        {/* ── Menu tab ── */}
        {tab === 'menu' && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", marginBottom: '1rem' }}>
                Menu Items <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({menuItems.length})</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {menuItems.map((item) => (
                  <div key={item.item_id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {item.category} · ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      className={`btn ${item.is_available ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => toggleAvailability(item.item_id, item.is_available)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem', flexShrink: 0 }}
                    >
                      {item.is_available ? 'Mark sold out' : 'Mark available'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1rem', fontSize: '1.1rem' }}>Add item</h3>
              <form onSubmit={createItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="form-group"><label>Name</label><input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required /></div>
                <div className="form-group"><label>Category</label><input type="text" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="espresso, matcha, pastry…" required /></div>
                <div className="form-group"><label>Price ($)</label><input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} step="0.01" required /></div>
                <div className="form-group"><label>Description</label><input type="text" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} /></div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '0.25rem' }}>Add item</button>
              </form>
            </div>
          </div>
        )}

        {/* ── Deals tab ── */}
        {tab === 'deals' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", marginBottom: '0.75rem' }}>Deals</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Create spin-to-win deals for the rewards wheel. Active deals are selected randomly based on win probability when users spin.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1rem', fontSize: '1.1rem' }}>Create deal</h3>
              <form onSubmit={createDeal} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="form-group"><label>Code</label><input type="text" value={newDeal.code} onChange={(e) => setNewDeal({ ...newDeal, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" required /></div>
                <div className="form-group"><label>Title</label><input type="text" value={newDeal.title} onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })} placeholder="20% off any drink" required /></div>
                <div className="form-group">
                  <label>Discount type</label>
                  <select value={newDeal.discount_type} onChange={(e) => setNewDeal({ ...newDeal, discount_type: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed amount ($)</option>
                  </select>
                </div>
                <div className="form-group"><label>Value</label><input type="number" value={newDeal.discount_value} onChange={(e) => setNewDeal({ ...newDeal, discount_value: e.target.value })} step="0.01" required /></div>
                <div className="form-group"><label>Win probability (0–1)</label><input type="number" value={newDeal.win_probability} onChange={(e) => setNewDeal({ ...newDeal, win_probability: e.target.value })} step="0.01" min="0" max="1" required /></div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '0.25rem' }}>Create deal</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
