import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BREW_SECONDS = 4 * 60
const RING_R = 72
const CIRCUMFERENCE = 2 * Math.PI * RING_R

// Single animated drip drop
function Drip({ delay, brewing }: { delay: number; brewing: boolean }) {
  return (
    <motion.g>
      <motion.ellipse
        cx="100" cy="0"
        rx="3.5" ry="5"
        fill="#C8A96E"
        opacity={0.85}
        animate={brewing
          ? { cy: [0, 95], ry: [5, 3.5, 6], opacity: [0, 0.85, 0.85, 0] }
          : { cy: [0, 75], ry: [5, 3.5, 5.5], opacity: [0, 0.55, 0.55, 0] }
        }
        transition={{
          duration: brewing ? 1.1 : 2.2,
          delay,
          repeat: Infinity,
          repeatDelay: brewing ? 0.6 : 1.8,
          ease: 'easeIn',
        }}
      />
    </motion.g>
  )
}

// SVG phin filter illustration
function PhinSVG({ brewing, done }: { brewing: boolean; done: boolean }) {
  return (
    <svg
      viewBox="0 0 200 340"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 220, height: 'auto' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="phinBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#5A5A5A" />
          <stop offset="40%"  stopColor="#9A9A9A" />
          <stop offset="60%"  stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#6A6A6A" />
        </linearGradient>
        <linearGradient id="phinLid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#6A6A6A" />
          <stop offset="50%"  stopColor="#B0B0B0" />
          <stop offset="100%" stopColor="#707070" />
        </linearGradient>
        <linearGradient id="coffeeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#3D1E0A" />
          <stop offset="100%" stopColor="#1A0A04" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(200,169,110,0.08)" />
          <stop offset="40%"  stopColor="rgba(200,169,110,0.18)" />
          <stop offset="60%"  stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(200,169,110,0.06)" />
        </linearGradient>
        <clipPath id="glassClip">
          <path d="M65 180 L70 310 L130 310 L135 180 Z" />
        </clipPath>
      </defs>

      {/* ── Glass / cup ── */}
      {/* Glass body outline */}
      <path
        d="M65 178 L70 312 L130 312 L135 178 Z"
        fill="none"
        stroke="rgba(200,169,110,0.3)"
        strokeWidth="1.5"
      />
      {/* Glass fill sheen */}
      <path d="M65 178 L70 312 L130 312 L135 178 Z" fill="url(#glassGrad)" />

      {/* Coffee liquid inside glass — animates rising when brewing */}
      <motion.rect
        x="70.5" y="0" width="59" height="309.5"
        fill="url(#coffeeGrad)"
        clipPath="url(#glassClip)"
        initial={{ scaleY: 0.05, originY: 1 }}
        animate={brewing
          ? { scaleY: 0.55 }
          : done
            ? { scaleY: 0.55 }
            : { scaleY: 0.05 }
        }
        style={{ transformOrigin: 'bottom' }}
        transition={{ duration: BREW_SECONDS, ease: 'linear' }}
      />

      {/* Coffee surface shimmer */}
      {(brewing || done) && (
        <motion.ellipse
          cx="100" cy="0"
          rx="29" ry="3"
          fill="rgba(200,169,110,0.18)"
          animate={{ cy: done ? 248 : [295, 248] }}
          transition={{ duration: done ? 0 : BREW_SECONDS, ease: 'linear' }}
        />
      )}

      {/* Glass rim highlights */}
      <line x1="65" y1="178" x2="135" y2="178" stroke="rgba(200,169,110,0.45)" strokeWidth="1.5" />
      <line x1="66" y1="181" x2="134" y2="181" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

      {/* ── Phin stand legs (rest on glass rim) ── */}
      <rect x="73" y="154" width="5"  height="26" rx="2" fill="#888" />
      <rect x="122" y="154" width="5" height="26" rx="2" fill="#888" />

      {/* ── Phin body ── */}
      <rect x="68" y="70" width="64" height="88" rx="3" fill="url(#phinBody)" />
      {/* inner shadow left */}
      <rect x="68" y="70" width="6"  height="88" rx="2" fill="rgba(0,0,0,0.25)" />
      {/* inner shadow right */}
      <rect x="126" y="70" width="6" height="88" rx="2" fill="rgba(0,0,0,0.2)" />
      {/* face sheen */}
      <rect x="74" y="72" width="52" height="84" rx="2" fill="rgba(255,255,255,0.04)" />

      {/* Phin body bottom plate */}
      <rect x="70" y="153" width="60" height="5" rx="1.5" fill="#707070" />
      {/* Perforations on bottom plate */}
      {[79, 86, 93, 100, 107, 114, 121].map((x) => (
        <circle key={x} cx={x} cy="155.5" r="1.2" fill="rgba(0,0,0,0.5)" />
      ))}

      {/* Coffee grounds texture inside body */}
      <rect x="71" y="100" width="58" height="50" rx="2" fill="rgba(58,28,10,0.7)" />
      <rect x="72" y="101" width="56" height="2"  fill="rgba(80,40,15,0.5)" />

      {/* ── Phin lid ── */}
      <rect x="63" y="58" width="74" height="14" rx="3" fill="url(#phinLid)" />
      <rect x="63" y="58" width="74" height="4"  rx="3" fill="rgba(255,255,255,0.1)" />

      {/* Lid handle */}
      <rect x="89" y="44" width="22" height="16" rx="5" fill="#909090" />
      <rect x="90" y="45" width="20" height="5"  rx="3" fill="rgba(255,255,255,0.12)" />

      {/* ── Drip drops ── */}
      <g transform="translate(0, 155)">
        <Drip delay={0}   brewing={brewing} />
        <Drip delay={brewing ? 0.55 : 1.2} brewing={brewing} />
        {brewing && <Drip delay={1.1} brewing={brewing} />}
      </g>

      {/* ── Done: steam wisps ── */}
      {done && (
        <>
          <motion.path
            d="M85 170 Q81 160 85 152 Q89 144 85 136"
            stroke="rgba(200,169,110,0.5)" strokeWidth="1.8" fill="none" strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: [0, 0.6, 0], pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0 }}
          />
          <motion.path
            d="M100 165 Q96 155 100 146 Q104 137 100 129"
            stroke="rgba(200,169,110,0.4)" strokeWidth="1.8" fill="none" strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: [0, 0.5, 0], pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}
          />
          <motion.path
            d="M115 170 Q111 160 115 152 Q119 144 115 136"
            stroke="rgba(200,169,110,0.35)" strokeWidth="1.8" fill="none" strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: [0, 0.45, 0], pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1.1 }}
          />
        </>
      )}
    </svg>
  )
}

export default function PhinBrewTimer() {
  const [phase, setPhase] = useState<'idle' | 'brewing' | 'done'>('idle')
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const remaining = BREW_SECONDS - elapsed
  const progressFraction = elapsed / BREW_SECONDS
  const dashOffset = CIRCUMFERENCE * (1 - progressFraction)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  const start = () => {
    setPhase('brewing')
    setElapsed(0)
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e >= BREW_SECONDS - 1) {
          clearInterval(intervalRef.current!)
          setPhase('done')
          return BREW_SECONDS
        }
        return e + 1
      })
    }, 1000)
  }

  const reset = () => {
    clearInterval(intervalRef.current!)
    setPhase('idle')
    setElapsed(0)
  }

  useEffect(() => () => { clearInterval(intervalRef.current!) }, [])

  return (
    <section style={{
      background: 'linear-gradient(180deg, var(--espresso) 0%, var(--espresso-mid) 100%)',
      padding: '6rem 1.5rem',
      borderTop: '1px solid rgba(200,169,110,0.08)',
    }}>
      <div className="container" style={{ maxWidth: 900 }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <p className="section-label" style={{ color: 'var(--amber)', marginBottom: '0.75rem' }}>
            Brew with us
          </p>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', color: 'var(--cream-warm)', fontWeight: 700 }}>
            The 4-Minute Ritual
          </h2>
          <p style={{ color: 'rgba(245,237,214,0.5)', fontSize: '0.95rem', marginTop: '0.75rem', fontWeight: 300 }}>
            Start the timer. Watch your phin drip. Drink when it's ready.
          </p>
        </motion.div>

        {/* Two columns: phin + timer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '3rem',
          alignItems: 'center',
        }}>

          {/* Phin illustration */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
          >
            {/* Glow under cup */}
            <motion.div
              animate={phase === 'brewing' ? { opacity: [0.3, 0.6, 0.3] } : { opacity: 0.2 }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{
                position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 24,
                background: 'radial-gradient(ellipse, rgba(200,169,110,0.6), transparent 70%)',
                filter: 'blur(8px)',
                pointerEvents: 'none',
              }}
            />
            <PhinSVG brewing={phase === 'brewing'} done={phase === 'done'} />
          </motion.div>

          {/* Timer UI */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}
          >
            {/* Progress ring */}
            <div style={{ position: 'relative', width: 200, height: 200 }}>
              <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track ring */}
                <circle
                  cx="100" cy="100" r={RING_R}
                  fill="none"
                  stroke="rgba(200,169,110,0.1)"
                  strokeWidth="6"
                />
                {/* Progress ring */}
                <motion.circle
                  cx="100" cy="100" r={RING_R}
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#C8A96E" />
                    <stop offset="100%" stopColor="#E8D5A3" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.25rem',
              }}>
                <AnimatePresence mode="wait">
                  {phase === 'done' ? (
                    <motion.div
                      key="done"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      style={{ textAlign: 'center' }}
                    >
                      <div style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>☕</div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--amber)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Ready!
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="timer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ textAlign: 'center' }}
                    >
                      <p style={{
                        fontSize: '2.6rem', fontWeight: 700,
                        color: 'var(--cream-warm)',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1,
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                      </p>
                      <p style={{ fontSize: '0.65rem', color: 'rgba(245,237,214,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.4rem' }}>
                        {phase === 'brewing' ? 'dripping...' : 'minutes'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Status label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={phase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: '0.82rem',
                  color: 'rgba(245,237,214,0.45)',
                  textAlign: 'center',
                  maxWidth: 220,
                  lineHeight: 1.6,
                }}
              >
                {phase === 'idle'
                  ? 'Hit start when you set your phin. We\'ll count down the perfect steep.'
                  : phase === 'brewing'
                    ? 'Your phin is dripping. Step away. Come back when it calls.'
                    : 'Your coffee is ready. Stir gently, sip slowly.'}
              </motion.p>
            </AnimatePresence>

            {/* CTA button */}
            <motion.button
              onClick={phase === 'idle' ? start : reset}
              whileHover={{ scale: 1.04, boxShadow: phase === 'idle' ? '0 0 28px rgba(200,169,110,0.35)' : undefined }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '0.85rem 2.5rem',
                background: phase === 'idle'
                  ? 'linear-gradient(135deg, var(--amber), var(--amber-dark))'
                  : 'rgba(255,255,255,0.06)',
                color: phase === 'idle' ? 'var(--espresso)' : 'rgba(245,237,214,0.7)',
                border: phase === 'idle' ? 'none' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {phase === 'idle' ? 'Start Brew' : phase === 'brewing' ? 'Cancel' : 'Brew Again'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
