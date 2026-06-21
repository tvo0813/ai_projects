import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MenuItem } from '../../api/menu'

interface Props { item: MenuItem }

export default function MenuCard({ item }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.div
        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.3 }}
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          padding: '1rem 0.5rem',
          borderRadius: 'var(--radius-lg)',
          transition: 'background 0.15s',
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Circular image */}
        <div style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: item.image_url
            ? `url(${item.image_url}) center/cover no-repeat`
            : 'var(--green-xlight)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {!item.image_url && <span style={{ fontSize: '2.5rem', opacity: 0.4 }}>☕</span>}
          {!item.is_available && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>Sold out</span>
            </div>
          )}
        </div>

        {/* Name + price */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            marginBottom: '0.2rem',
          }}>
            {item.name}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            ${item.price.toFixed(2)}
          </p>
        </div>
      </motion.div>

      {/* Detail modal */}
      <AnimatePresence>
        {open && (
          <ItemModal item={item} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

function ItemModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 400,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Image */}
        <div style={{
          height: 220,
          background: item.image_url
            ? `url(${item.image_url}) center/cover no-repeat`
            : 'var(--green-xlight)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!item.image_url && <span style={{ fontSize: '3rem', opacity: 0.3 }}>☕</span>}
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3, flex: 1, paddingRight: '1rem' }}>
              {item.name}
            </h3>
            <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1.05rem', flexShrink: 0 }}>
              ${item.price.toFixed(2)}
            </span>
          </div>

          {item.description && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {item.description}
            </p>
          )}

          {item.tags?.includes('popular') && (
            <div style={{ marginTop: '1rem' }}>
              <span className="badge badge-gold">Popular</span>
            </div>
          )}

          {!item.is_available && (
            <div style={{ marginTop: '0.75rem' }}>
              <span className="badge badge-red">Currently unavailable</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.65rem' }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
