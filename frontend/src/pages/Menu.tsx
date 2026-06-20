import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getMenuItems, getCategories, type MenuItem } from '../api/menu'
import MenuCard from '../components/menu/MenuCard'

const CATEGORY_ICONS: Record<string, string> = {
  espresso: '☕',
  matcha: '🍵',
  cold: '🧊',
  tea: '🫖',
  pastry: '🥐',
  food: '🍽️',
}

export default function Menu() {
  const [items, setItems]           = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActive] = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => { getCategories().then(setCategories) }, [])

  useEffect(() => {
    setLoading(true)
    getMenuItems(activeCategory || undefined)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [activeCategory])

  const label = (cat: string) => cat.charAt(0).toUpperCase() + cat.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)' }}>
      {/* Header */}
      <section style={{
        background: 'var(--green-dark)',
        color: 'var(--white)',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
      }}>
        <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '0.75rem' }}>
          Crafted with care
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--white)' }}>Our Menu</h1>
      </section>

      {/* Category pills */}
      <div style={{
        background: 'var(--white)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 68,
        zIndex: 10,
        padding: '1rem 1.5rem',
      }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`pill${!activeCategory ? ' active' : ''}`}
              onClick={() => setActive(null)}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`pill${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActive(cat)}
              >
                {CATEGORY_ICONS[cat] || ''} {label(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <div className="spinner" />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p style={{ fontSize: '1.1rem' }}>No items in this category right now.</p>
          </div>
        ) : (
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            {items.map((item) => <MenuCard key={item.item_id} item={item} />)}
          </motion.div>
        )}
      </div>
    </div>
  )
}
