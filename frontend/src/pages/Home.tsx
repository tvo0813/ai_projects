import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { STORE_NAME, STORE_TAGLINE, STORE_SLUG, GRAB_URL } from '../config/store'
import { getMenuItems, type MenuItem } from '../api/menu'
import ChatBot from '../components/ChatBot'

// ─── Store content ────────────────────────────────────────────────────────────

interface StoreContent {
  heroLabel: string
  storyTitle: string
  storyParagraphs: string[]
  pillars: { title: string; desc: string; svgPath: string }[]
  stats: { value: number; suffix: string; label: string }[]
  marqueeItems: string[]
}

const STORE_CONTENT: Record<string, StoreContent> = {
  'phin-and-beans': {
    heroLabel: 'Handcrafted with care',
    storyTitle: 'Born from the streets of Vietnam',
    storyParagraphs: [
      'It started with a memory — the smell of a phin drip slowly filling a small glass on a plastic stool outside a Saigon café at 7 in the morning. Strong, sweet, unhurried. Vietnam doesn\'t rush its coffee, and neither do we.',
      'Every drink we serve is made the way it was meant to be made: with a proper phin filter, real condensed milk, and ingredients we\'re proud of.',
      'Vietnamese coffee culture is about slowing down, connecting, and savoring something made with care. That\'s what we bring to every cup, every day.',
    ],
    pillars: [
      { title: 'Rooted in Vietnam', desc: 'Every recipe traces back to the streets of Saigon and Hanoi — where coffee isn\'t just a drink, it\'s a daily ritual.', svgPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
      { title: 'Fresh, Always', desc: 'We brew to order, source seasonally, and never cut corners. What\'s in your cup was made for you.', svgPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
      { title: 'Authentic to the Last Drop', desc: 'From our phin-drip method to our condensed milk ratio — we do it the Vietnamese way, exactly as it was meant to be.', svgPath: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3' },
      { title: 'Here for Our Community', desc: 'We\'re your neighborhood spot. We know your order, your name, and we\'re honored you choose to spend your morning with us.', svgPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    ],
    stats: [
      { value: 12, suffix: '+', label: 'Years of craft' },
      { value: 40, suffix: 'k', label: 'Cups poured' },
      { value: 3, suffix: '', label: 'Locations' },
      { value: 100, suffix: '%', label: 'Vietnamese beans' },
    ],
    marqueeItems: ['Single Origin · Da Lat', 'Slow Drip · Phin Method', 'Condensed Milk · Real Only', 'Iced Ca Phe Sua Da', 'Hot Bac Xiu', 'Cot Dua Cold Brew', 'From Saigon With Love', 'Brewing Since Day One'],
  },
  'phin-drips': {
    heroLabel: 'Bold drip, every time',
    storyTitle: 'The art of the slow drip',
    storyParagraphs: [
      'Phin Drips was built on one simple belief: great coffee shouldn\'t be rushed. The Vietnamese phin filter is patience in metal form — grounds, hot water, and time.',
      'We source our beans directly from the Central Highlands of Vietnam — Da Lat and Buon Ma Thuot — where the altitude and red soil produce some of the world\'s most distinctive robusta and arabica.',
      'Whether you take it black over ice, layered with condensed milk, or blended with coconut cream, every cup starts the same way: a slow, honest drip.',
    ],
    pillars: [
      { title: 'Slow Drip, Bold Flavor', desc: 'Our phin method takes longer — and tastes better for it. No shortcuts, no compromises.', svgPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
      { title: 'Vietnamese Highland Beans', desc: 'Sourced from Da Lat and Buon Ma Thuot farms known for their rich, earthy robusta and bright arabica.', svgPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
      { title: 'Hot or Iced, Always Fresh', desc: 'Every cup is brewed to order. We don\'t batch brew or hold coffee — what you get is made the moment you order.', svgPath: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3' },
      { title: 'Your Daily Ritual', desc: 'We\'re not a chain. We\'re a neighborhood drip bar — the kind of place you come back to every morning.', svgPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    ],
    stats: [
      { value: 8, suffix: '+', label: 'Years of craft' },
      { value: 25, suffix: 'k', label: 'Cups poured' },
      { value: 2, suffix: '', label: 'Locations' },
      { value: 3, suffix: '', label: 'Bean origins' },
    ],
    marqueeItems: ['Da Lat Arabica', 'Buon Ma Thuot Robusta', 'Slow Drip · No Shortcuts', 'Black Over Ice', 'Coconut Cream Cold Brew', 'Vietnamese Highland Beans', 'Patience in a Cup', 'Bold Every Time'],
  },
}

const DEFAULT_CONTENT = STORE_CONTENT['phin-and-beans']

// ─── Canvas particle system ───────────────────────────────────────────────────

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let W = 0, H = 0
    const PARTICLE_COUNT = 55
    const mouse = { x: -9999, y: -9999 }

    interface Particle {
      x: number; y: number
      vx: number; vy: number
      size: number; alpha: number
      baseAlpha: number; speed: number
    }

    let particles: Particle[] = []

    function init() {
      W = canvas!.width  = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: Math.random() * 1.8 + 0.4,
        baseAlpha: Math.random() * 0.35 + 0.08,
        alpha: 0,
        speed: Math.random() * 0.3 + 0.1,
      }))
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        // drift alpha toward baseAlpha
        p.alpha += (p.baseAlpha - p.alpha) * 0.04

        // mouse repulsion
        const dx = p.x - mouse.x, dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 100) {
          const force = (100 - dist) / 100
          p.x += dx * force * 0.018
          p.y += dy * force * 0.018
          p.alpha = Math.min(p.baseAlpha + force * 0.35, 0.7)
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(200,169,110,${p.alpha})`
        ctx!.fill()
      }

      // connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 110) {
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.strokeStyle = `rgba(200,169,110,${0.06 * (1 - d / 110)})`
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }

    init()
    draw()

    const onResize = () => init()
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    window.addEventListener('resize', onResize)
    canvas.addEventListener('mousemove', onMouseMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      canvas!.removeEventListener('mousemove', onMouseMove)
    }
  }, [canvasRef])
}

// ─── Magnetic cursor ──────────────────────────────────────────────────────────

function MagneticCursor() {
  const dotRef   = useRef<HTMLDivElement>(null)
  const ringRef  = useRef<HTMLDivElement>(null)
  const pos      = useRef({ x: 0, y: 0 })
  const ringPos  = useRef({ x: 0, y: 0 })
  const raf      = useRef(0)

  useEffect(() => {
    const dot  = dotRef.current!
    const ring = ringRef.current!

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      dot.style.left  = e.clientX + 'px'
      dot.style.top   = e.clientY + 'px'
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const hoverable = el?.closest('a,button,[role="button"],.glass-card,.luxury-drink-card')
      ring.classList.toggle('hovered', !!hoverable)
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const animate = () => {
      ringPos.current.x = lerp(ringPos.current.x, pos.current.x, 0.14)
      ringPos.current.y = lerp(ringPos.current.y, pos.current.y, 0.14)
      ring.style.left = ringPos.current.x + 'px'
      ring.style.top  = ringPos.current.y + 'px'
      raf.current = requestAnimationFrame(animate)
    }
    animate()

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div id="cursor-dot"  ref={dotRef}  />
      <div id="cursor-ring" ref={ringRef} />
    </>
  )
}

// ─── Scroll progress bar ──────────────────────────────────────────────────────

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  return <motion.div id="scroll-progress" style={{ scaleX }} />
}

// ─── Drip drop & steam ────────────────────────────────────────────────────────

function DripDrop({ delay, xOffset = 0 }: { delay: number; xOffset?: number }) {
  return (
    <motion.ellipse
      cx={100 + xOffset} cy={0}
      rx={2.8} ry={4.5}
      fill="#C8A96E"
      animate={{ cy: [2, 88], ry: [4.5, 3.2, 5.5], opacity: [0, 0.9, 0.9, 0] }}
      transition={{ duration: 1.8, delay, repeat: Infinity, repeatDelay: 1.4, ease: 'easeIn' }}
    />
  )
}

function SteamWisp({ x, delay }: { x: number; delay: number }) {
  return (
    <motion.path
      d={`M${x} 0 Q${x - 4} -9 ${x} -18 Q${x + 4} -27 ${x} -36`}
      stroke="rgba(200,169,110,0.45)" strokeWidth="1.6" fill="none" strokeLinecap="round"
      animate={{ opacity: [0, 0.55, 0], y: [0, -8] }}
      transition={{ duration: 2.8, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}

// ─── Auto-brewing phin ────────────────────────────────────────────────────────

function AutoPhin() {
  const CYCLE = 12
  return (
    <svg viewBox="0 0 200 360" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 260, height: 'auto', filter: 'drop-shadow(0 28px 50px rgba(0,0,0,0.75))' }}
      aria-label="Vietnamese phin filter dripping coffee">
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
      <path d="M62 180 L67 324 L133 324 L138 180 Z" fill="none" stroke="rgba(200,169,110,0.28)" strokeWidth="1.4" />
      <path d="M62 180 L67 324 L133 324 L138 180 Z" fill="url(#apGlass)" />
      <motion.rect x="67.5" y="0" width="65" height="322" fill="url(#apCoffee)" clipPath="url(#apGlassClip)"
        style={{ transformOrigin: 'bottom' }}
        animate={{ scaleY: [0.04, 0.72, 0.04] }}
        transition={{ duration: CYCLE, repeat: Infinity, ease: 'easeInOut', times: [0, 0.78, 1] }} />
      <motion.ellipse cx="100" ry="2.5" rx="32" fill="rgba(200,169,110,0.22)"
        animate={{ cy: [318, 252, 318] }}
        transition={{ duration: CYCLE, repeat: Infinity, ease: 'easeInOut', times: [0, 0.78, 1] }} />
      <line x1="62" y1="180" x2="138" y2="180" stroke="rgba(200,169,110,0.4)" strokeWidth="1.4" />
      <line x1="63" y1="183" x2="137" y2="183" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
      <rect x="70"  y="156" width="5" height="26" rx="2" fill="#828282" />
      <rect x="125" y="156" width="5" height="26" rx="2" fill="#828282" />
      <rect x="65" y="72"  width="70" height="88" rx="3" fill="url(#apMetal)" />
      <rect x="65" y="72"  width="7"  height="88" rx="2" fill="rgba(0,0,0,0.22)" />
      <rect x="128" y="72" width="7"  height="88" rx="2" fill="rgba(0,0,0,0.18)" />
      <rect x="72"  y="74" width="56" height="84" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="67"  y="155" width="66" height="5" rx="1.5" fill="#6A6A6A" />
      {[76, 83, 90, 97, 104, 111, 118, 125].map((x) => (
        <circle key={x} cx={x} cy="157.5" r="1.1" fill="rgba(0,0,0,0.55)" />
      ))}
      <rect x="68"  y="102" width="64" height="50" rx="2" fill="rgba(52,24,8,0.75)" />
      <rect x="69"  y="103" width="62" height="3"  fill="rgba(70,35,12,0.5)" />
      <rect x="60"  y="60"  width="80" height="14" rx="3" fill="url(#apLid)" />
      <rect x="60"  y="60"  width="80" height="5"  rx="3" fill="rgba(255,255,255,0.1)" />
      <rect x="87"  y="46"  width="26" height="16" rx="5" fill="#8E8E8E" />
      <rect x="88"  y="47"  width="24" height="5"  rx="3" fill="rgba(255,255,255,0.12)" />
      <g transform="translate(0,157)">
        <DripDrop delay={0}   xOffset={0}  />
        <DripDrop delay={0.9} xOffset={-1} />
        <DripDrop delay={1.8} xOffset={1}  />
      </g>
      <g transform="translate(0,178)">
        <SteamWisp x={82}  delay={0}   />
        <SteamWisp x={100} delay={0.9} />
        <SteamWisp x={118} delay={1.7} />
      </g>
      <text x="100" y="348" textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="7.5"
        fontWeight="600" fill="rgba(200,169,110,0.4)" letterSpacing="2">
        SLOW DRIP · VIETNAMESE PHIN
      </text>
    </svg>
  )
}

// ─── Floating coffee bean ─────────────────────────────────────────────────────

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

const FLOATING_BEANS = [
  { size: 72,  rotation: 18,  opacity: 0.22, depth: 28, top: '12%', left: '6%',   right: undefined },
  { size: 44,  rotation: -32, opacity: 0.16, depth: 48, top: '72%', left: '4%',   right: undefined },
  { size: 88,  rotation: 50,  opacity: 0.14, depth: 18, top: '18%', left: undefined, right: '7%'  },
  { size: 38,  rotation: -18, opacity: 0.20, depth: 58, top: '62%', left: undefined, right: '6%'  },
  { size: 60,  rotation: 68,  opacity: 0.12, depth: 36, top: '48%', left: '12%',  right: undefined },
  { size: 50,  rotation: -8,  opacity: 0.15, depth: 32, top: '32%', left: undefined, right: '18%' },
  { size: 32,  rotation: 42,  opacity: 0.18, depth: 55, top: '82%', left: '30%',  right: undefined },
  { size: 66,  rotation: -55, opacity: 0.11, depth: 22, top: '8%',  left: '42%',  right: undefined },
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
    <motion.div style={{ position: 'absolute', top: bean.top, left: bean.left, right: bean.right, zIndex: 4, x, y, pointerEvents: 'none' }}>
      <CoffeeBean size={bean.size} rotation={bean.rotation} opacity={bean.opacity} />
    </motion.div>
  )
}

// ─── Animated title ───────────────────────────────────────────────────────────

const letterVariants = {
  hidden:  { opacity: 0, y: 50, rotateX: -25 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { duration: 0.6, delay: i * 0.042, ease: [0.22, 1, 0.36, 1] },
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
                <motion.span key={ci} custom={ci} variants={letterVariants} style={{ display: 'inline-block' }}>{ch}</motion.span>
              )
            })}
          </span>
        )
      })}
    </span>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 1800
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - t, 3)
          setCount(Math.round(eased * target))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

// ─── Marquee strip ────────────────────────────────────────────────────────────

function MarqueeStrip({ items }: { items: string[] }) {
  const doubled = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(200,169,110,0.12)', borderBottom: '1px solid rgba(200,169,110,0.12)', padding: '0.9rem 0', background: 'rgba(200,169,110,0.04)', userSelect: 'none' }}>
      <div className="marquee-track" aria-hidden="true">
        {doubled.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0', padding: '0 2.5rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(200,169,110,0.55)' }}>
            {item}
            <svg width="4" height="4" viewBox="0 0 4 4" style={{ marginLeft: '2.5rem', flexShrink: 0 }}><circle cx="2" cy="2" r="2" fill="rgba(200,169,110,0.4)" /></svg>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Horizontal drag gallery ──────────────────────────────────────────────────

function DragGallery({ items }: { items: MenuItem[] }) {
  const trackRef   = useRef<HTMLDivElement>(null)
  const isDown     = useRef(false)
  const startX     = useRef(0)
  const scrollLeft = useRef(0)

  const onDown = useCallback((e: React.MouseEvent) => {
    isDown.current = true
    startX.current = e.pageX - (trackRef.current?.offsetLeft ?? 0)
    scrollLeft.current = trackRef.current?.scrollLeft ?? 0
  }, [])
  const onLeave = useCallback(() => { isDown.current = false }, [])
  const onUp    = useCallback(() => { isDown.current = false }, [])
  const onMove  = useCallback((e: React.MouseEvent) => {
    if (!isDown.current || !trackRef.current) return
    e.preventDefault()
    const x    = e.pageX - trackRef.current.offsetLeft
    const walk = (x - startX.current) * 1.4
    trackRef.current.scrollLeft = scrollLeft.current - walk
  }, [])

  return (
    <div ref={trackRef} className="drag-scroll"
      onMouseDown={onDown} onMouseLeave={onLeave} onMouseUp={onUp} onMouseMove={onMove}
      style={{ display: 'flex', gap: '1.25rem', padding: '1rem 1.5rem 1.5rem' }}>
      {items.map((item, i) => (
        <motion.div key={item.item_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          style={{ flexShrink: 0, width: 200 }}>
          <Link to="/menu" style={{ textDecoration: 'none', display: 'block' }}>
            <div className="luxury-drink-card shimmer-card" style={{ userSelect: 'none' }}>
              <div style={{
                height: 160,
                background: item.image_url
                  ? `url(${item.image_url}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #2E1710, #0E0806)',
                position: 'relative',
              }}>
                {!item.image_url && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.3)" strokeWidth="1.2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,8,6,0.85) 0%, transparent 55%)' }} />
                {item.tags?.includes('popular') && (
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 999, background: 'rgba(200,169,110,0.2)', color: 'var(--amber)', border: '1px solid rgba(200,169,110,0.35)' }}>Popular</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '0.9rem 1rem 1rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--cream-warm)', marginBottom: '0.25rem', lineHeight: 1.35 }}>{item.name}</p>
                <p style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '0.875rem' }}>${item.price.toFixed(2)}</p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [signatures, setSignatures] = useState<MenuItem[]>([])
  const [heroLoaded, setHeroLoaded] = useState(false)
  const content = STORE_CONTENT[STORE_SLUG] ?? DEFAULT_CONTENT
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useParticleCanvas(canvasRef)

  const { scrollY } = useScroll()
  const heroBgY      = useTransform(scrollY, [0, 700], [0, 130])
  const heroContentY = useTransform(scrollY, [0, 600], [0, 55])

  const rawMX = useRef(0), rawMY = useRef(0)
  const springX = useSpring(0, { stiffness: 38, damping: 18 })
  const springY = useSpring(0, { stiffness: 38, damping: 18 })

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
      <MagneticCursor />
      <ScrollProgress />

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="luxury-hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {/* Particle canvas */}
        <canvas ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3, pointerEvents: 'none' }}
          aria-hidden="true" />

        {/* Hero background photo */}
        <motion.div style={{ position: 'absolute', inset: 0, y: heroBgY, zIndex: 0 }}>
          <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80"
            alt="" aria-hidden="true"
            onLoad={() => setHeroLoaded(true)}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            style={{ width: '100%', height: '115%', objectFit: 'cover', objectPosition: 'center', display: 'block', opacity: heroLoaded ? 1 : 0, transition: 'opacity 0.8s ease' }} />
        </motion.div>

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(14,8,6,0.82) 0%, rgba(14,8,6,0.6) 50%, rgba(14,8,6,0.96) 100%)' }} />

        {/* Blobs */}
        <div className="luxury-blob luxury-blob-1" style={{ zIndex: 2 }} />
        <div className="luxury-blob luxury-blob-2" style={{ zIndex: 2 }} />
        <div className="luxury-blob luxury-blob-3" style={{ zIndex: 2 }} />

        {/* Floating beans */}
        {FLOATING_BEANS.map((bean, i) => (
          <FloatingBean key={i} bean={bean} springX={springX} springY={springY} />
        ))}

        {/* Hero content */}
        <motion.div className="luxury-hero-content container"
          style={{ y: heroContentY, position: 'relative', zIndex: 5, textAlign: 'center', padding: '8rem 1.5rem 9rem' }}>

          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.4em' }}
            animate={{ opacity: 1, letterSpacing: '0.22em' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '2.25rem', fontFamily: 'var(--font-body)' }}>
            {content.heroLabel}
          </motion.p>

          <motion.h1 initial="hidden" animate="visible"
            style={{ fontSize: 'clamp(3.2rem, 10vw, 8rem)', fontWeight: 300, lineHeight: 1.0, letterSpacing: '-0.015em', color: 'var(--cream-warm)', marginBottom: '2rem', perspective: 1000, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            <AnimatedTitle text={STORE_NAME} />
          </motion.h1>

          <motion.hr className="amber-rule"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'center', margin: '0 auto 2rem' }} />

          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            style={{ fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: 'rgba(245,237,214,0.6)', maxWidth: 480, margin: '0 auto 3.5rem', lineHeight: 1.85, fontWeight: 300, fontFamily: 'var(--font-body)' }}>
            {STORE_TAGLINE}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 1.05 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/menu">
              <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 48px rgba(200,169,110,0.45)' }} whileTap={{ scale: 0.96 }}
                style={{ padding: '0.9rem 2.5rem', background: 'linear-gradient(135deg, var(--amber), var(--amber-dark))', color: 'var(--espresso)', border: 'none', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'none', fontFamily: 'var(--font-body)' }}>
                Explore Menu
              </motion.button>
            </Link>
            <Link to="/locations">
              <motion.button whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.09)' }} whileTap={{ scale: 0.96 }}
                style={{ padding: '0.9rem 2.5rem', background: 'rgba(255,255,255,0.04)', color: 'var(--cream-warm)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'none', backdropFilter: 'blur(8px)', fontFamily: 'var(--font-body)' }}>
                Find a Location
              </motion.button>
            </Link>
            {GRAB_URL && (
              <a href={GRAB_URL} target="_blank" rel="noopener noreferrer">
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 32px rgba(200,169,110,0.25)' }} whileTap={{ scale: 0.96 }}
                  style={{ padding: '0.9rem 2.5rem', background: 'transparent', color: 'var(--amber)', border: '1px solid rgba(200,169,110,0.4)', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'none', fontFamily: 'var(--font-body)' }}>
                  Order Now
                </motion.button>
              </a>
            )}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7, duration: 0.8 }}
          style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'rgba(245,237,214,0.3)' }}>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Discover</span>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(200,169,110,0.55), transparent)' }} />
        </motion.div>
      </section>

      {/* ═══ MARQUEE ════════════════════════════════════════════════════════ */}
      <MarqueeStrip items={content.marqueeItems} />

      {/* ═══ STORY ══════════════════════════════════════════════════════════ */}
      <section className="luxury-section" style={{ padding: '7rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '5rem', alignItems: 'center', marginBottom: '6rem' }}>
            {/* Text */}
            <motion.div initial={{ opacity: 0, x: -36 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.75 }}>
              <p className="section-label" style={{ marginBottom: '1.25rem' }}>Our story</p>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: '1rem', color: 'var(--cream-warm)', fontWeight: 300, fontFamily: 'var(--font-display)', fontStyle: 'italic', lineHeight: 1.15 }}>
                {content.storyTitle}
              </h2>
              <hr className="amber-rule" style={{ marginBottom: '2.25rem' }} />
              {content.storyParagraphs.map((para, i) => (
                <motion.p key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.13 }}
                  style={{ fontSize: '0.97rem', color: 'rgba(245,237,214,0.6)', lineHeight: 1.95, fontWeight: 300, marginBottom: i < content.storyParagraphs.length - 1 ? '1.3rem' : 0, fontFamily: 'var(--font-body)' }}>
                  {para}
                </motion.p>
              ))}
            </motion.div>

            {/* Phin animation */}
            <motion.div initial={{ opacity: 0, x: 36 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <motion.div
                animate={{ opacity: [0.25, 0.55, 0.25] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', bottom: 10, left: '15%', right: '15%', height: 36, background: 'radial-gradient(ellipse, rgba(200,169,110,0.6), transparent 70%)', filter: 'blur(14px)', pointerEvents: 'none' }} />
              <AutoPhin />
            </motion.div>
          </div>

          {/* Pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {content.pillars.map((p, i) => (
              <motion.div key={p.title} className="glass-card shimmer-card"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ padding: '2.25rem 1.75rem', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={p.svgPath} />
                  </svg>
                </div>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.7rem', color: 'var(--amber-light)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: '0.83rem', color: 'rgba(245,237,214,0.5)', lineHeight: 1.75, fontFamily: 'var(--font-body)' }}>
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CHATBOT ════════════════════════════════════════════════════════ */}
      {/* To re-enable: change `false` back to `true` */}
      {false && (
        <section className="luxury-section" style={{ padding: '0 1.5rem 7rem' }}>
          <ChatBot />
        </section>
      )}

      {/* ═══ SIGNATURE DRINKS (drag gallery) ════════════════════════════════ */}
      {signatures.length > 0 && (
        <section className="luxury-section" style={{ padding: '4rem 0 8rem' }}>
          <div className="container" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', marginBottom: '2.5rem' }}>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p className="section-label" style={{ marginBottom: '0.6rem' }}>House specials</p>
                <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', color: 'var(--cream-warm)', fontWeight: 300, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                  Signature Drinks
                </h2>
              </div>
              <Link to="/menu">
                <motion.button whileHover={{ borderColor: 'var(--amber)', background: 'rgba(200,169,110,0.08)' }}
                  style={{ padding: '0.6rem 1.5rem', background: 'transparent', color: 'var(--amber)', border: '1px solid rgba(200,169,110,0.3)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', cursor: 'none', transition: 'all 0.22s ease', fontFamily: 'var(--font-body)' }}>
                  See full menu →
                </motion.button>
              </Link>
            </motion.div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(245,237,214,0.25)', marginTop: '0.5rem', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>
              Drag to explore
            </p>
          </div>
          <DragGallery items={signatures} />
        </section>
      )}

      {/* ═══ FULL-WIDTH CTA BAND ════════════════════════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '6rem 1.5rem', background: 'var(--espresso-mid)', borderTop: '1px solid rgba(200,169,110,0.08)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(200,169,110,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <motion.div className="container"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p className="section-label" style={{ marginBottom: '1.25rem' }}>Ready to experience it?</p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', color: 'var(--cream-warm)', fontWeight: 300, fontStyle: 'italic', fontFamily: 'var(--font-display)', marginBottom: '1.75rem', lineHeight: 1.1 }}>
            Your cup is waiting.
          </h2>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/menu">
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 48px rgba(200,169,110,0.4)' }} whileTap={{ scale: 0.97 }}
                style={{ padding: '0.9rem 2.5rem', background: 'linear-gradient(135deg, var(--amber), var(--amber-dark))', color: 'var(--espresso)', border: 'none', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'none', fontFamily: 'var(--font-body)' }}>
                View Menu
              </motion.button>
            </Link>
            <Link to="/locations">
              <motion.button whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.09)' }} whileTap={{ scale: 0.97 }}
                style={{ padding: '0.9rem 2.5rem', background: 'rgba(255,255,255,0.04)', color: 'var(--cream-warm)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'none', backdropFilter: 'blur(8px)', fontFamily: 'var(--font-body)' }}>
                Visit Us
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Amber accent line */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--amber), var(--amber-dark), transparent)', opacity: 0.35 }} />
    </div>
  )
}
