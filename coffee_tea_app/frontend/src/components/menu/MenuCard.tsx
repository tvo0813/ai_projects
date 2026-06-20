import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import type { MenuItem } from '../../api/menu'
import { useCartStore } from '../../store/useCartStore'

const PLACEHOLDER_COLORS = ['#c4956a', '#4a7c59', '#8b4513', '#6b3700', '#a0522d']

interface Props { item: MenuItem }

export default function MenuCard({ item }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [customizations, setCustomizations] = useState<Record<string, string>>({})
  const [showOptions, setShowOptions] = useState(false)

  const hasOptions = item.config_json && Object.keys(item.config_json).length > 0

  const handleAdd = () => {
    addItem(item, 1, customizations)
    toast.success(`${item.name} added to cart!`)
    setShowOptions(false)
  }

  const bgColor = PLACEHOLDER_COLORS[item.name.charCodeAt(0) % PLACEHOLDER_COLORS.length]

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div style={{
        height: '180px',
        background: item.image_url ? `url(${item.image_url}) center/cover` : bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
      }}>
        {!item.image_url && (item.category === 'pastry' || item.category === 'food' ? '🥐' : '☕')}
      </div>

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.name}</h3>
          <span style={{ fontWeight: 700, color: 'var(--brown-500)', fontSize: '1.1rem' }}>
            ${item.price.toFixed(2)}
          </span>
        </div>

        {item.description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge badge-brown">{tag}</span>
            ))}
          </div>
        )}

        {!item.is_available && (
          <span className="badge badge-red" style={{ alignSelf: 'flex-start' }}>Sold Out</span>
        )}

        {showOptions && hasOptions && (
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(item.config_json!).map(([key, options]) => (
              <div key={key} className="form-group">
                <label style={{ textTransform: 'capitalize' }}>{key}</label>
                <select
                  value={customizations[key] || options[0]}
                  onChange={(e) => setCustomizations({ ...customizations, [key]: e.target.value })}
                >
                  {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
          {item.is_available ? (
            hasOptions && !showOptions ? (
              <button
                className="btn btn-primary"
                onClick={() => setShowOptions(true)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Customize & Add
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Add to Cart
              </button>
            )
          ) : (
            <button className="btn" style={{ width: '100%', background: '#ddd', color: '#999', cursor: 'not-allowed' }} disabled>
              Unavailable
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
