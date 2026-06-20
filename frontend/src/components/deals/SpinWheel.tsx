import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { spinForDeal, type SpinResult } from '../../api/deals'
import { useAuthStore } from '../../store/useAuthStore'

const SEGMENTS = [
  { label: '10% Off', color: '#8b4513' },
  { label: 'Free Drink', color: '#4a7c59' },
  { label: '20% Off', color: '#c4956a' },
  { label: 'Free Pastry', color: '#6b3700' },
  { label: 'Try Again', color: '#deb887' },
  { label: '$2 Off', color: '#a0522d' },
  { label: 'Try Again', color: '#f5deb3' },
  { label: '15% Off', color: '#4a7c59' },
]

export default function SpinWheel() {
  const { user } = useAuthStore()
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<SpinResult | null>(null)

  const handleSpin = async () => {
    if (!user) { toast.error('Please log in to spin the wheel!'); return }
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
        if (res.won) {
          toast.success('🎉 You won a deal!', { duration: 5000 })
        } else {
          toast('Better luck next time!', { icon: '😔' })
        }
      }, 3000)
    } catch {
      setTimeout(() => {
        setSpinning(false)
        toast.error('Error spinning. Try again.')
      }, 3000)
    }
  }

  const segmentAngle = 360 / SEGMENTS.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <div style={{ position: 'relative', width: 320, height: 320 }}>
        {/* pointer */}
        <div style={{
          position: 'absolute',
          top: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          fontSize: '2rem',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}>▼</div>

        <motion.div
          style={{
            width: 320,
            height: 320,
            borderRadius: '50%',
            position: 'relative',
            overflow: 'hidden',
            border: '6px solid var(--brown-700)',
            boxShadow: 'var(--shadow-lg)',
          }}
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: [0.17, 0.67, 0.35, 1.0] }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            {SEGMENTS.map((seg, i) => {
              const startAngle = i * segmentAngle - 90
              const endAngle = startAngle + segmentAngle
              const startRad = (startAngle * Math.PI) / 180
              const endRad = (endAngle * Math.PI) / 180
              const x1 = 50 + 50 * Math.cos(startRad)
              const y1 = 50 + 50 * Math.sin(startRad)
              const x2 = 50 + 50 * Math.cos(endRad)
              const y2 = 50 + 50 * Math.sin(endRad)
              const midAngle = startAngle + segmentAngle / 2
              const midRad = (midAngle * Math.PI) / 180
              const textX = 50 + 32 * Math.cos(midRad)
              const textY = 50 + 32 * Math.sin(midRad)
              return (
                <g key={i}>
                  <path
                    d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                    fill={seg.color}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="5"
                    fontWeight="bold"
                    transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                    style={{ pointerEvents: 'none' }}
                  >
                    {seg.label}
                  </text>
                </g>
              )
            })}
            <circle cx="50" cy="50" r="6" fill="var(--brown-900)" />
          </svg>
        </motion.div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSpin}
        disabled={spinning}
        style={{ fontSize: '1.1rem', padding: '0.9rem 3rem' }}
      >
        {spinning ? 'Spinning...' : '🎰 Spin to Win!'}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              background: result.won ? 'linear-gradient(135deg, #4a7c59, #6fad80)' : 'var(--cream-dark)',
              color: result.won ? 'white' : 'var(--text-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem 2rem',
              textAlign: 'center',
              maxWidth: 360,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {result.won ? (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{result.title}</h3>
                <p style={{ opacity: 0.9, marginBottom: '1rem' }}>{result.description}</p>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1.5rem',
                  fontFamily: 'monospace',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                }}>
                  {result.deal_code}
                </div>
                <p style={{ fontSize: '0.85rem', marginTop: '0.75rem', opacity: 0.8 }}>
                  Use this code at checkout!
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😔</div>
                <p style={{ fontWeight: 500 }}>{result.message}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
