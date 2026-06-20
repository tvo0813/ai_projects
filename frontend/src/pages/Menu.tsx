import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getMenuItems, getCategories, type MenuItem } from '../api/menu'
import MenuCard from '../components/menu/MenuCard'

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    getMenuItems(activeCategory || undefined)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [activeCategory])

  const categoryLabel = (cat: string) =>
    cat.charAt(0).toUpperCase() + cat.slice(1)

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--brown-800), var(--brown-600))',
        color: 'var(--cream)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Our Menu</h1>
        <p style={{ color: 'var(--brown-200)', fontSize: '1.1rem' }}>Crafted with care, served with love</p>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', justifyContent: 'center' }}>
          <button
            className="btn"
            onClick={() => setActiveCategory(null)}
            style={{
              background: !activeCategory ? 'var(--brown-500)' : 'var(--white)',
              color: !activeCategory ? 'white' : 'var(--text-secondary)',
              border: '1.5px solid var(--brown-300)',
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className="btn"
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? 'var(--brown-500)' : 'var(--white)',
                color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                border: '1.5px solid var(--brown-300)',
              }}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {items.map((item) => (
              <MenuCard key={item.item_id} item={item} />
            ))}
          </motion.div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.2rem' }}>No items in this category right now.</p>
          </div>
        )}
      </div>
    </div>
  )
}
