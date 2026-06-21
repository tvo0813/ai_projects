import { motion } from 'framer-motion'
import type { MenuItem } from '../../api/menu'

interface Props { item: MenuItem }

export default function MenuCard({ item }: Props) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.10)' }}
    >
      {/* Image */}
      {item.image_url ? (
        <div style={{
          height: 200,
          background: `url(${item.image_url}) center/cover no-repeat`,
          position: 'relative',
        }}>
          {!item.is_available && <SoldOutOverlay />}
        </div>
      ) : (
        <div style={{
          height: 160,
          background: 'var(--green-xlight)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <span style={{ fontSize: '2.5rem', opacity: 0.5 }}>☕</span>
          {!item.is_available && <SoldOutOverlay />}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '1.1rem 1.25rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.975rem', fontWeight: 700, fontFamily: 'inherit', lineHeight: 1.3 }}>
            {item.name}
          </h3>
          <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.975rem', flexShrink: 0 }}>
            ${item.price.toFixed(2)}
          </span>
        </div>

        {item.description && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55, marginTop: '0.1rem' }}>
            {item.description}
          </p>
        )}

        {item.tags && item.tags.includes('popular') && (
          <div style={{ marginTop: 'auto', paddingTop: '0.6rem' }}>
            <span className="badge badge-gold">Popular</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function SoldOutOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(255,255,255,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="badge badge-red" style={{ fontSize: '0.8rem' }}>Sold out</span>
    </div>
  )
}
