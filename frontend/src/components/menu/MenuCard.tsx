import { motion } from 'framer-motion'
import type { MenuItem } from '../../api/menu'

const CATEGORY_EMOJI: Record<string, string> = {
  espresso: '☕',
  matcha: '🍵',
  cold: '🧊',
  tea: '🫖',
  pastry: '🥐',
  food: '🍽️',
}

interface Props { item: MenuItem }

export default function MenuCard({ item }: Props) {
  const emoji = CATEGORY_EMOJI[item.category] || '☕'

  return (
    <motion.div
      className="card"
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Image / placeholder */}
      <div style={{
        height: 180,
        background: item.image_url
          ? `url(${item.image_url}) center/cover no-repeat`
          : 'var(--green-xlight)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        position: 'relative',
      }}>
        {!item.image_url && emoji}
        {!item.is_available && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="badge badge-red" style={{ fontSize: '0.8rem' }}>Sold out</span>
          </div>
        )}
      </div>

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit' }}>{item.name}</h3>
          <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1rem', flexShrink: 0 }}>
            ${item.price.toFixed(2)}
          </span>
        </div>

        {item.description && (
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.5rem' }}>
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge badge-green">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
