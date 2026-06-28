import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { MenuItem } from '../../api/menu'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

interface Props { item: MenuItem; onOpen: (item: MenuItem) => void }

export default function MenuCard({ item, onOpen }: Props) {
  const cardRef           = useRef<HTMLDivElement>(null)
  const [tilt, setTilt]   = useState({ rotateX: 0, rotateY: 0 })
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const px = (e.clientX - left) / width
    const py = (e.clientY - top)  / height
    setTilt({ rotateX: (0.5 - py) * 16, rotateY: (px - 0.5) * 16 })
    setGlare({ x: px * 100, y: py * 100, opacity: 0.22 })
  }

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 })
    setGlare(g => ({ ...g, opacity: 0 }))
  }

  return (
    <>
      <motion.div
        ref={cardRef}
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.32 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onOpen(item)}
        animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
        whileTap={{ scale: 0.97 }}
        whileHover={{ boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,169,110,0.18)' }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
          cursor: 'none', padding: '1.5rem 1rem',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          position: 'relative', overflow: 'hidden',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          transition: 'border-color 0.25s',
        }}>
        {/* Specular glare */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--radius-xl)',
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(200,169,110,${glare.opacity * 1.8}) 0%, rgba(200,169,110,${glare.opacity * 0.3}) 40%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 2,
          transition: 'opacity 0.18s ease',
        }} />

        {/* Image circle */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: item.image_url ? `url(${item.image_url.startsWith('http') ? item.image_url : BASE + item.image_url}) center/cover no-repeat` : 'rgba(46,23,16,0.8)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
          transform: 'translateZ(10px)',
          border: '1px solid rgba(200,169,110,0.12)',
        }}>
          {!item.image_url && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.3)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>
            </svg>
          )}
          {!item.is_available && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,8,6,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(245,237,214,0.55)', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Sold out</span>
            </div>
          )}
        </div>

        {/* Name + price */}
        <div style={{ textAlign: 'center', transform: 'translateZ(7px)', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cream-warm)', lineHeight: 1.35, marginBottom: '0.3rem', fontFamily: 'var(--font-body)' }}>
            {item.name}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
            ${item.price.toFixed(2)}
          </p>
        </div>

        {/* Popular badge */}
        {item.tags?.includes('popular') && (
          <div style={{ position: 'absolute', top: 10, right: 10, transform: 'translateZ(12px)', zIndex: 3 }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.18rem 0.5rem', borderRadius: 999, background: 'rgba(200,169,110,0.15)', color: 'var(--amber)', border: '1px solid rgba(200,169,110,0.3)', fontFamily: 'var(--font-body)' }}>
              Popular
            </span>
          </div>
        )}
      </motion.div>

    </>
  )
}

