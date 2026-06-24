import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MenuItem } from '../../api/menu'

interface Props { item: MenuItem }

export default function MenuCard({ item }: Props) {
  const [open, setOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // 3D tilt + specular state
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const px = (e.clientX - left) / width   // 0–1
    const py = (e.clientY - top)  / height  // 0–1
    setTilt({
      rotateX: (0.5 - py) * 18,  // tilt up/down ±9°
      rotateY: (px - 0.5) * 18,  // tilt left/right ±9°
    })
    setGlare({ x: px * 100, y: py * 100, opacity: 0.18 })
  }

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 })
    setGlare((g) => ({ ...g, opacity: 0 }))
  }

  return (
    <>
      <motion.div
        ref={cardRef}
        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.3 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setOpen(true)}
        animate={{
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
        }}
        whileTap={{ scale: 0.96 }}
        whileHover={{
          boxShadow: '0 12px 36px rgba(0,0,0,0.13)',
          borderColor: 'rgba(0,112,74,0.25)',
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          padding: '1.25rem 0.75rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* Specular glare layer — moves with mouse */}
        <div
          style={{
            position: 'absolute', inset: 0,
            borderRadius: 'var(--radius-lg)',
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity * 4}) 0%, rgba(255,255,255,${glare.opacity}) 40%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 2,
            transition: 'opacity 0.15s ease',
          }}
        />

        {/* Circular image */}
        <div style={{
          width: 130,
          height: 130,
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
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          transform: 'translateZ(8px)',
        }}>
          {!item.image_url && <span style={{ fontSize: '2.5rem', opacity: 0.4 }}>☕</span>}
          {!item.is_available && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,255,255,0.72)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>Sold out</span>
            </div>
          )}
        </div>

        {/* Name + price — lifted on Z axis for depth pop */}
        <div style={{ textAlign: 'center', transform: 'translateZ(6px)', position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: '0.88rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            marginBottom: '0.25rem',
          }}>
            {item.name}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--green)', fontWeight: 700 }}>
            ${item.price.toFixed(2)}
          </p>
        </div>

        {/* Popular badge lifted forward */}
        {item.tags?.includes('popular') && (
          <div style={{ position: 'absolute', top: 10, right: 10, transform: 'translateZ(10px)', zIndex: 3 }}>
            <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>Popular</span>
          </div>
        )}
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
        background: 'rgba(20,12,8,0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--espresso-mid, #1E1009)',
          border: '1px solid rgba(200,169,110,0.15)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: 400,
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Image */}
        <div style={{
          height: 220,
          background: item.image_url
            ? `url(${item.image_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--espresso-light, #3A1E0F), var(--espresso-mid, #1E1009))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {!item.image_url && <span style={{ fontSize: '3.5rem', opacity: 0.3 }}>☕</span>}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(20,12,8,0.7) 0%, transparent 50%)',
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3, flex: 1, paddingRight: '1rem', color: 'var(--cream-warm, #F5EDD6)' }}>
              {item.name}
            </h3>
            <span style={{ fontWeight: 700, color: 'var(--amber, #C8A96E)', fontSize: '1.1rem', flexShrink: 0 }}>
              ${item.price.toFixed(2)}
            </span>
          </div>

          {item.description && (
            <p style={{ fontSize: '0.9rem', color: 'rgba(245,237,214,0.55)', lineHeight: 1.65 }}>
              {item.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {item.tags?.includes('popular') && <span className="badge badge-gold">Popular</span>}
            {!item.is_available && <span className="badge badge-red">Currently unavailable</span>}
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', marginTop: '1.5rem', padding: '0.7rem',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(245,237,214,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.04em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
