import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { STORE_NAME, STORE_TAGLINE, STORE_SLUG } from '../config/store'
import { getMenuItems, type MenuItem } from '../api/menu'
import ChatBot from '../components/ChatBot'

interface StoreContent {
  heroLabel: string
  storyTitle: string
  storyParagraphs: string[]
  pillars: { icon: string; title: string; desc: string }[]
}

const STORE_CONTENT: Record<string, StoreContent> = {
  'phin-and-beans': {
    heroLabel: 'Handcrafted with care',
    storyTitle: 'Born from the streets of Vietnam',
    storyParagraphs: [
      'It started with a memory — the smell of a phin drip slowly filling a small glass on a plastic stool outside a Saigon café at 7 in the morning. Strong, sweet, unhurried. Vietnam doesn\'t rush its coffee, and neither do we.',
      'We opened our doors because we wanted to share that feeling with our community — not a watered-down version of it, but the real thing. Every drink we serve is made the way it was meant to be made: with a proper phin filter, real condensed milk, and ingredients we\'re proud of.',
      'Vietnamese coffee culture is about more than caffeine — it\'s about slowing down, connecting, and savoring something made with care. That\'s what we bring to every cup, every day, for everyone who walks through our door.',
    ],
    pillars: [
      { icon: '🇻🇳', title: 'Rooted in Vietnam', desc: 'Every recipe traces back to the streets of Saigon and Hanoi — where coffee isn\'t just a drink, it\'s a daily ritual.' },
      { icon: '🌿', title: 'Fresh, Always', desc: 'We brew to order, source seasonally, and never cut corners. What\'s in your cup was made for you, not a shelf.' },
      { icon: '☕', title: 'Authentic to the Last Drop', desc: 'From our phin-drip method to our condensed milk ratio — we do it the Vietnamese way, exactly as it was meant to be.' },
      { icon: '🤝', title: 'Here for Our Community', desc: 'We\'re your neighborhood spot. We know your order, your name, and we\'re honored you choose to spend your morning with us.' },
    ],
  },
  'phin-drips': {
    heroLabel: 'Bold drip, every time',
    storyTitle: 'The art of the slow drip',
    storyParagraphs: [
      'Phin Drips was built on one simple belief: great coffee shouldn\'t be rushed. The Vietnamese phin filter is patience in metal form — grounds, hot water, and time. The result is something no espresso machine can replicate.',
      'We source our beans directly from the Central Highlands of Vietnam — Da Lat and Buon Ma Thuot — where the altitude and red soil produce some of the world\'s most distinctive robusta and arabica. From farm to phin, every step is intentional.',
      'Whether you take it black over ice, layered with condensed milk, or blended with coconut cream, every cup starts the same way: a slow, honest drip. That\'s the Phin Drips promise.',
    ],
    pillars: [
      { icon: '⏳', title: 'Slow Drip, Bold Flavor', desc: 'Our phin method takes longer — and tastes better for it. No shortcuts, no compromises.' },
      { icon: '🏔️', title: 'Vietnamese Highland Beans', desc: 'Sourced from Da Lat and Buon Ma Thuot farms known for their rich, earthy robusta and bright arabica.' },
      { icon: '🧊', title: 'Hot or Iced, Always Fresh', desc: 'Every cup is brewed to order. We don\'t batch brew or hold coffee — what you get is made the moment you order.' },
      { icon: '🤝', title: 'Your Daily Ritual', desc: 'We\'re not a chain. We\'re a neighborhood drip bar — the kind of place you come back to every morning.' },
    ],
  },
  'daboba': {
    heroLabel: 'Fresh boba, bold flavors',
    storyTitle: 'Where every sip is an adventure',
    storyParagraphs: [
      'Daboba started with a simple craving — boba that actually tastes like what it\'s made of. Real taro, real matcha, real fruit. Not powders, not syrups from a bag. We set out to make boba that\'s worth the walk.',
      'We hand-roll our tapioca pearls daily and cook them fresh every few hours. Our milk teas are brewed from loose-leaf tea, our fruit teas are made with real blended fruit, and our sugar levels are adjustable because you deserve a drink that\'s exactly yours.',
      'Boba culture is joyful, social, and creative — and that\'s exactly the vibe we want every time you walk in. Come alone, come with friends, try something new. There\'s always something worth sipping.',
    ],
    pillars: [
      { icon: '🧋', title: 'Real Ingredients Only', desc: 'Fresh taro, loose-leaf tea, real fruit — no artificial powders. You can taste the difference.' },
      { icon: '⚪', title: 'Pearls Made Daily', desc: 'Our tapioca pearls are hand-rolled and cooked fresh every few hours for that perfect chewy bite.' },
      { icon: '🎨', title: 'Your Drink, Your Way', desc: 'Adjust sweetness, ice level, milk type, and toppings. Every order is built for you, not the menu.' },
      { icon: '✨', title: 'Good Vibes Only', desc: 'Daboba is a place to slow down, catch up, and treat yourself. Every visit should feel like a little celebration.' },
    ],
  },
}

const DEFAULT_CONTENT = STORE_CONTENT['phin-and-beans']

// One drip drop — falls from bottom of phin to top of coffee level, loops forever
function DripDrop({ delay, xOffset = 0 }: { delay: number; xOffset?: number }) {
  return (
    <motion.ellipse
      cx={100 + xOffset} cy={0}
      rx={2.8} ry={4.5}
      fill="#C8A96E"
      animate={{
        cy:      [2,   88],
        ry:      [4.5, 3.2, 5.5],
        opacity: [0,   0.9, 0.9, 0],
      }}
      transition={{
        duration:    1.8,
        delay,
        repeat:      Infinity,
        repeatDelay: 1.4,
        ease:        'easeIn',
      }}
    />
  )
}

// Steam wisp that fades in/out above the cup
function SteamWisp({ x, delay }: { x: number; delay: number }) {
  return (
    <motion.path
      d={`M${x} 0 Q${x - 4} -9 ${x} -18 Q${x + 4} -27 ${x} -36`}
      stroke="rgba(200,169,110,0.45)"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
      animate={{ opacity: [0, 0.55, 0], y: [0, -8] }}
      transition={{ duration: 2.8, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}

// Fully automatic looping phin — brews forever, no interaction needed
function AutoPhin() {
  // Coffee level cycles: empty → full → empty over ~12s
  const CYCLE = 12

  return (
    <svg
      viewBox="0 0 200 360"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 260, height: 'auto', filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.65))' }}
      aria-label="Vietnamese phin filter dripping coffee"
    >
      <defs>
        <linearGradient id="apMetal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#4A4A4A" />
          <stop offset="35%"  stopColor="#909090" />
          <stop offset="55%"  stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#585858" />
        </linearGradient>
        <linearGradient id="apLid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#606060" />
          <stop offset="50%"  stopColor="#B8B8B8" />
          <stop offset="100%" stopColor="#686868" />
        </linearGradient>
        <linearGradient id="apCoffee" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#4A2810" />
          <stop offset="100%" stopColor="#1A0804" />
        </linearGradient>
        <linearGradient id="apGlass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(200,169,110,0.07)" />
          <stop offset="45%"  stopColor="rgba(255,255,255,0.13)" />
          <stop offset="100%" stopColor="rgba(200,169,110,0.05)" />
        </linearGradient>
        <clipPath id="apGlassClip">
          <path d="M62 182 L67 322 L133 322 L138 182 Z" />
        </clipPath>
      </defs>

      {/* ── Glass / cup ── */}
      <path d="M62 180 L67 324 L133 324 L138 180 Z" fill="none" stroke="rgba(200,169,110,0.28)" strokeWidth="1.4" />
      <path d="M62 180 L67 324 L133 324 L138 180 Z" fill="url(#apGlass)" />

      {/* Coffee fill — cycles empty→full→empty */}
      <motion.rect
        x="67.5" y="0" width="65" height="322"
        fill="url(#apCoffee)"
        clipPath="url(#apGlassClip)"
        style={{ transformOrigin: 'bottom' }}
        animate={{ scaleY: [0.04, 0.72, 0.04] }}
        transition={{ duration: CYCLE, repeat: Infinity, ease: 'easeInOut', times: [0, 0.78, 1] }}
      />

      {/* Coffee surface shimmer line */}
      <motion.ellipse
        cx="100" ry="2.5" rx="32"
        fill="rgba(200,169,110,0.22)"
        animate={{ cy: [318, 252, 318] }}
        transition={{ duration: CYCLE, repeat: Infinity, ease: 'easeInOut', times: [0, 0.78, 1] }}
      />

      {/* Glass rim */}
      <line x1="62" y1="180" x2="138" y2="180" stroke="rgba(200,169,110,0.4)" strokeWidth="1.4" />
      <line x1="63" y1="183" x2="137" y2="183" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />

      {/* ── Phin stand legs ── */}
      <rect x="70"  y="156" width="5" height="26" rx="2" fill="#828282" />
      <rect x="125" y="156" width="5" height="26" rx="2" fill="#828282" />

      {/* ── Phin body ── */}
      <rect x="65" y="72" width="70" height="88" rx="3" fill="url(#apMetal)" />
      {/* side shadows */}
      <rect x="65" y="72" width="7"  height="88" rx="2" fill="rgba(0,0,0,0.22)" />
      <rect x="128" y="72" width="7" height="88" rx="2" fill="rgba(0,0,0,0.18)" />
      {/* face sheen */}
      <rect x="72" y="74" width="56" height="84" rx="2" fill="rgba(255,255,255,0.04)" />

      {/* Phin bottom filter plate */}
      <rect x="67" y="155" width="66" height="5" rx="1.5" fill="#6A6A6A" />
      {/* Perforation holes */}
      {[76, 83, 90, 97, 104, 111, 118, 125].map((x) => (
        <circle key={x} cx={x} cy="157.5" r="1.1" fill="rgba(0,0,0,0.55)" />
      ))}

      {/* Coffee grounds inside */}
      <rect x="68"  y="102" width="64" height="50" rx="2" fill="rgba(52,24,8,0.75)" />
      <rect x="69"  y="103" width="62" height="3"  fill="rgba(70,35,12,0.5)" />

      {/* ── Phin lid ── */}
      <rect x="60" y="60" width="80" height="14" rx="3" fill="url(#apLid)" />
      <rect x="60" y="60" width="80" height="5"  rx="3" fill="rgba(255,255,255,0.1)" />

      {/* Lid handle */}
      <rect x="87" y="46" width="26" height="16" rx="5" fill="#8E8E8E" />
      <rect x="88" y="47" width="24" height="5"  rx="3" fill="rgba(255,255,255,0.12)" />

      {/* ── Perpetual drip drops ── */}
      <g transform="translate(0,157)">
        <DripDrop delay={0}   xOffset={0}  />
        <DripDrop delay={0.9} xOffset={-1} />
        <DripDrop delay={1.8} xOffset={1}  />
      </g>

      {/* ── Steam wisps above cup, always visible ── */}
      <g transform="translate(0,178)">
        <SteamWisp x={82}  delay={0}   />
        <SteamWisp x={100} delay={0.9} />
        <SteamWisp x={118} delay={1.7} />
      </g>

      {/* ── Caption ── */}
      <text
        x="100" y="348"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="7.5"
        fontWeight="600"
        fill="rgba(200,169,110,0.4)"
        letterSpacing="2"
      >
        SLOW DRIP · VIETNAMESE PHIN
      </text>
    </svg>
  )
}

// SVG coffee bean — rendered inline, no external deps
function CoffeeBean({ size = 48, rotation = 0, opacity = 0.5 }: { size?: number; rotation?: number; opacity?: number }) {
  const h = size * 0.62
  return (
    <svg width={size} height={h} viewBox="0 0 60 37" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotation}deg)`, opacity, display: 'block' }}>
      <ellipse cx="30" cy="18.5" rx="28.5" ry="17.5" fill="#2A1208" stroke="#C8A96E" strokeWidth="1.2" />
      <path d="M30 2.5 C18 9 18 28 30 34.5" stroke="#C8A96E" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M30 2.5 C42 9 42 28 30 34.5" stroke="#9E7A3F" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

// Floating beans config — position, size, depth factor for parallax
const FLOATING_BEANS = [
  { size: 72, rotation: 18,  opacity: 0.28, depth: 28, top: '12%', left:  '6%',  right: undefined },
  { size: 44, rotation: -32, opacity: 0.20, depth: 48, top: '72%', left:  '4%',  right: undefined },
  { size: 88, rotation: 50,  opacity: 0.18, depth: 18, top: '18%', left:  undefined, right: '7%'  },
  { size: 38, rotation: -18, opacity: 0.25, depth: 58, top: '62%', left:  undefined, right: '6%'  },
  { size: 60, rotation: 68,  opacity: 0.15, depth: 36, top: '48%', left:  '12%', right: undefined },
  { size: 50, rotation: -8,  opacity: 0.18, depth: 32, top: '32%', left:  undefined, right: '18%' },
  { size: 32, rotation: 42,  opacity: 0.22, depth: 55, top: '82%', left:  '30%', right: undefined },
  { size: 66, rotation: -55, opacity: 0.14, depth: 22, top: '8%',  left:  '42%', right: undefined },
]

type BeanConfig = typeof FLOATING_BEANS[number]

function FloatingBean({ bean, springX, springY }: {
  bean: BeanConfig
  springX: ReturnType<typeof useSpring>
  springY: ReturnType<typeof useSpring>
}) {
  const x = useTransform(springX, v => v * -bean.depth)
  const y = useTransform(springY, v => v * -bean.depth)
  return (
    <motion.div
      style={{
        position: 'absolute',
        top: bean.top,
        left: bean.left,
        right: bean.right,
        zIndex: 4,
        x, y,
        pointerEvents: 'none',
      }}
    >
      <CoffeeBean size={bean.size} rotation={bean.rotation} opacity={bean.opacity} />
    </motion.div>
  )
}

const letterVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -20 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { duration: 0.55, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] },
  }),
}

function AnimatedTitle({ text }: { text: string }) {
  const words = text.split(' ')
  let charIndex = 0
  return (
    <span style={{ display: 'block' }}>
      {words.map((word, wi) => {
        const wordChars = word.split('')
        return (
          <span key={wi} style={{ display: 'inline-block', marginRight: wi < words.length - 1 ? '0.3em' : 0 }}>
            {wordChars.map((ch) => {
              const ci = charIndex++
              return (
                <motion.span key={ci} custom={ci} variants={letterVariants} style={{ display: 'inline-block' }}>
                  {ch}
                </motion.span>
              )
            })}
          </span>
        )
      })}
    </span>
  )
}

export default function Home() {
  const [signatures, setSignatures] = useState<MenuItem[]>([])
  const content = STORE_CONTENT[STORE_SLUG] ?? DEFAULT_CONTENT

  // Scroll parallax
  const { scrollY } = useScroll()
  const heroBgY     = useTransform(scrollY, [0, 700], [0, 140])   // bg photo drifts slower
  const heroContentY = useTransform(scrollY, [0, 600], [0, 60])   // content drifts slightly

  // Mouse parallax — spring-smoothed
  const rawMX = useRef(0)
  const rawMY = useRef(0)
  const springX = useSpring(0, { stiffness: 40, damping: 18 })
  const springY = useSpring(0, { stiffness: 40, damping: 18 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rawMX.current = (e.clientX / window.innerWidth  - 0.5)
      rawMY.current = (e.clientY / window.innerHeight - 0.5)
      springX.set(rawMX.current)
      springY.set(rawMY.current)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [springX, springY])

  useEffect(() => {
    getMenuItems('signature').then(setSignatures).catch(() => {})
  }, [])

  return (
    <div style={{ background: 'var(--espresso)' }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="luxury-hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {/* Full-bleed background photo — coffee beans, parallax scroll */}
        <motion.div
          style={{ position: 'absolute', inset: 0, y: heroBgY, zIndex: 0 }}
        >
          <img
            src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80"
            alt=""
            aria-hidden="true"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            style={{
              width: '100%', height: '115%',
              objectFit: 'cover', objectPosition: 'center',
              display: 'block',
            }}
          />
        </motion.div>

        {/* Dark gradient overlay on top of photo */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(20,12,8,0.78) 0%, rgba(20,12,8,0.65) 50%, rgba(20,12,8,0.92) 100%)',
        }} />

        {/* Animated gradient blobs */}
        <div className="luxury-blob luxury-blob-1" style={{ zIndex: 2 }} />
        <div className="luxury-blob luxury-blob-2" style={{ zIndex: 2 }} />
        <div className="luxury-blob luxury-blob-3" style={{ zIndex: 2 }} />

        {/* grain texture is handled by .luxury-hero::before in CSS */}

        {/* Mouse-parallax floating coffee beans */}
        {FLOATING_BEANS.map((bean, i) => (
          <FloatingBean key={i} bean={bean} springX={springX} springY={springY} />
        ))}

        {/* Hero content */}
        <motion.div
          className="luxury-hero-content container"
          style={{ y: heroContentY, position: 'relative', zIndex: 5, textAlign: 'center', padding: '7rem 1.5rem 8rem' }}
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.3em' }}
            animate={{ opacity: 1, letterSpacing: '0.18em' }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              fontSize: '0.75rem', fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--amber)', marginBottom: '2rem',
            }}
          >
            {content.heroLabel}
          </motion.p>

          <motion.h1
            initial="hidden"
            animate="visible"
            style={{
              fontSize: 'clamp(3rem, 9vw, 7rem)',
              fontWeight: 700, lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--cream-warm)',
              marginBottom: '1.75rem',
              perspective: 800,
            }}
          >
            <AnimatedTitle text={STORE_NAME} />
          </motion.h1>

          <motion.hr
            className="amber-rule"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'left', margin: '0 auto 1.75rem' }}
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'rgba(245,237,214,0.7)',
              maxWidth: 500, margin: '0 auto 3rem',
              lineHeight: 1.75, fontWeight: 300,
            }}
          >
            {STORE_TAGLINE}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.95 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/menu">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(200,169,110,0.4)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.85rem 2.25rem',
                  background: 'linear-gradient(135deg, var(--amber), var(--amber-dark))',
                  color: 'var(--espresso)', border: 'none',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.9rem', fontWeight: 700,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Explore Menu
              </motion.button>
            </Link>
            <Link to="/locations">
              <motion.button
                whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.85rem 2.25rem',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--cream-warm)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.9rem', fontWeight: 600,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Find a Location
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          style={{
            position: 'absolute', bottom: '2.5rem', left: '50%',
            transform: 'translateX(-50%)', zIndex: 5,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
            color: 'rgba(245,237,214,0.35)',
          }}
        >
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, rgba(200,169,110,0.6), transparent)' }}
          />
        </motion.div>
      </section>

      {/* ── Our story ──────────────────────────────────── */}
      <section className="luxury-section" style={{ padding: '7rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: 1100 }}>

          {/* Two-column: text + Vietnamese phin photo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '4rem', alignItems: 'center',
            marginBottom: '5rem',
          }}>
            {/* Text column */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7 }}
            >
              <p className="section-label" style={{ marginBottom: '1rem', color: 'var(--amber)' }}>Our story</p>
              <h2 style={{
                fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)',
                marginBottom: '0.75rem',
                color: 'var(--cream-warm)', fontWeight: 700,
              }}>
                {content.storyTitle}
              </h2>
              <hr className="amber-rule" style={{ marginBottom: '2rem' }} />
              {content.storyParagraphs.map((para, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  style={{
                    fontSize: '1rem',
                    color: 'rgba(245,237,214,0.65)',
                    lineHeight: 1.9, fontWeight: 300,
                    marginBottom: i < content.storyParagraphs.length - 1 ? '1.25rem' : 0,
                  }}
                >
                  {para}
                </motion.p>
              ))}
            </motion.div>

            {/* Auto-brewing phin column */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {/* Ambient glow under the cup */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', bottom: 20, left: '20%', right: '20%', height: 32,
                  background: 'radial-gradient(ellipse, rgba(200,169,110,0.55), transparent 70%)',
                  filter: 'blur(12px)',
                  pointerEvents: 'none',
                }}
              />
              <AutoPhin />
            </motion.div>
          </div>

          {/* Pillars — glassmorphism cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.25rem',
          }}>
            {content.pillars.map((p, i) => (
              <motion.div
                key={p.title}
                className="glass-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                style={{ padding: '2rem 1.5rem', textAlign: 'center' }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: 'rgba(200,169,110,0.1)',
                  border: '1px solid rgba(200,169,110,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', margin: '0 auto 1.25rem',
                }}>
                  {p.icon}
                </div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--amber-light)', letterSpacing: '0.02em' }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'rgba(245,237,214,0.55)', lineHeight: 1.7 }}>
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Menu chatbot ─────────────────────────────── */}
      <section className="luxury-section" style={{ padding: '0 1.5rem 6rem' }}>
        <ChatBot />
      </section>

      {/* ── Signature drinks ──────────────────────────── */}
      {signatures.length > 0 && (
        <section className="luxury-section" style={{ padding: '4rem 1.5rem 7rem' }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}
            >
              <div>
                <p className="section-label" style={{ marginBottom: '0.5rem', color: 'var(--amber)' }}>House specials</p>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: 'var(--cream-warm)' }}>Signature Drinks</h2>
              </div>
              <Link to="/menu">
                <motion.button
                  whileHover={{ background: 'rgba(200,169,110,0.12)', borderColor: 'var(--amber)' }}
                  style={{
                    padding: '0.6rem 1.4rem', background: 'transparent',
                    color: 'var(--amber)', border: '1px solid rgba(200,169,110,0.4)',
                    borderRadius: 'var(--radius-full)', fontSize: '0.85rem',
                    fontWeight: 600, letterSpacing: '0.03em',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  See full menu →
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            >
              {signatures.map((item) => (
                <motion.div
                  key={item.item_id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.35 }}
                >
                  <Link to="/menu" style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="luxury-drink-card">
                      <div style={{
                        height: 148,
                        background: item.image_url
                          ? `url(${item.image_url}) center/cover no-repeat`
                          : 'linear-gradient(135deg, var(--espresso-light), var(--espresso-mid))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.2rem',
                      }}>
                        {!item.image_url && '☕'}
                      </div>
                      <div style={{ padding: '1rem 1.1rem 1.1rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.3rem', color: 'var(--cream-warm)' }}>
                          {item.name}
                        </p>
                        <p style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '0.875rem' }}>
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Bottom ambient strip */}
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, transparent, var(--amber), var(--amber-dark), transparent)',
        opacity: 0.4,
      }} />

    </div>
  )
}
