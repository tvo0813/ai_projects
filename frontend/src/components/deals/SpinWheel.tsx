import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { spinForDeal, type SpinResult } from '../../api/deals'
import { useAuthStore } from '../../store/useAuthStore'

const SEGMENTS = [
  { label: '10% Off',    color: '#1E3932' },
  { label: 'Free Drink', color: '#00704A' },
  { label: '20% Off',    color: '#2E6D5E' },
  { label: 'Free Pastry',color: '#CBA258' },
  { label: 'Try Again',  color: '#D4E9E2', textColor: '#1E3932' },
  { label: '$2 Off',     color: '#1E3932' },
  { label: 'Try Again',  color: '#EEF7F2', textColor: '#1E3932' },
  { label: '15% Off',    color: '#00704A' },
]

export default function SpinWheel() {
  const { user } = useAuthStore()
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<SpinResult | null>(null)

  const handleSpin = async () => {
    if (!user) { toast.error('Sign in to spin!'); return }
    if (spinning) return
    setSpinning(true)
    setResult(null)

    const spins = 5 + Math.floor(Math.random() * 5)
    const randomAngle = Math.floor(Math.random() * 360)
    const newRotation = rotation + spins * 360 + randomAngle
    setRotation(newRotation)

    try {
      const res = await spinForDeal()
      setTimeout(() => {
        setResult(res)
        setSpinning(false)
        if (res.won) toast.success('You won a reward! 🎉', { duration: 5000 })
        else toast('Better luck next time!', { icon: '😔' })
      }, 3000)
    } catch {
      setTimeout(() => { setSpinning(false); toast.error('Try again.') }, 3000)
    }
  }

  const segmentAngle = 360 / SEGMENTS.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      {/* Wheel */}
      <div style={{ position: 'relative', width: 300, height: 300 }}>
        <div style={{
          position: 'absolute', top: -14, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10, color: 'var(--green-dark)', fontSize: '1.75rem',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
        }}>▼</div>

        <motion.div
          style={{
            width: 300, height: 300,
            borderRadius: '50%',
            border: '5px solid var(--green-dark)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: [0.17, 0.67, 0.35, 1.0] }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            {SEGMENTS.map((seg, i) => {
              const startAngle = i * segmentAngle - 90
              const endAngle   = startAngle + segmentAngle
              const startRad   = (startAngle * Math.PI) / 180
              const endRad     = (endAngle * Math.PI) / 180
              const x1 = 50 + 50 * Math.cos(startRad)
              const y1 = 50 + 50 * Math.sin(startRad)
              const x2 = 50 + 50 * Math.cos(endRad)
              const y2 = 50 + 50 * Math.sin(endRad)
              const midAngle = startAngle + segmentAngle / 2
              const midRad   = (midAngle * Math.PI) / 180
              const textX = 50 + 32 * Math.cos(midRad)
              const textY = 50 + 32 * Math.sin(midRad)
              return (
                <g key={i}>
                  <path
                    d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                    fill={seg.color}
                    stroke="white"
                    strokeWidth="0.4"
                  />
                  <text
                    x={textX} y={textY}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={seg.textColor || 'white'}
                    fontSize="4.5" fontWeight="bold"
                    transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                    style={{ pointerEvents: 'none' }}
                  >
                    {seg.label}
                  </text>
                </g>
              )
            })}
            <circle cx="50" cy="50" r="5.5" fill="var(--white)" stroke="var(--green-dark)" strokeWidth="1" />
          </svg>
        </motion.div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSpin}
        disabled={spinning}
        style={{ fontSize: '1rem', padding: '0.8rem 2.5rem', minWidth: 180 }}
      >
        {spinning ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="spinner" style={{ width: 18, height: 18, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
            Spinning…
          </span>
        ) : 'Spin to win'}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            style={{
              background: result.won ? 'var(--green-dark)' : 'var(--cream)',
              color: result.won ? 'var(--white)' : 'var(--text-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem 2.5rem',
              textAlign: 'center',
              maxWidth: 360,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {result.won ? (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                  {result.title}
                </h3>
                <p style={{ opacity: 0.85, marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {result.description}
                </p>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1.5rem',
                  fontFamily: 'monospace',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}>
                  {result.deal_code}
                </div>
                <p style={{ fontSize: '0.8rem', marginTop: '0.75rem', opacity: 0.7 }}>
                  Apply this code at checkout
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😔</div>
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{result.message}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try again tomorrow!</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
