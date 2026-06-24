import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getMenuItems, type MenuItem } from '../api/menu'
import MenuCard from '../components/menu/MenuCard'

const SECTIONS: { key: string; label: string }[] = [
  { key: 'signature', label: 'Signature Drinks' },
  { key: 'coffee',    label: 'Coffee' },
  { key: 'matcha',    label: 'Matcha' },
  { key: 'latte',     label: 'Latte' },
  { key: 'tea',       label: 'Tea' },
  { key: 'hot',       label: 'Hot Drinks' },
]

export default function Menu() {
  const [items, setItems]       = useState<MenuItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [activeSection, setActive] = useState('signature')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getMenuItems().then(setItems).finally(() => setLoading(false))
  }, [])

  // Highlight section nav pill as user scrolls
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    )
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  const grouped = SECTIONS.reduce<Record<string, MenuItem[]>>((acc, { key }) => {
    acc[key] = items.filter((i) => {
      if (!i.is_available) return false
      if (i.category === key) return true
      // Signature items also appear in their base section via tags
      if (key !== 'signature' && i.category === 'signature' && i.tags?.includes(key)) return true
      return false
    })
    return acc
  }, {})

  const scrollTo = (key: string) => {
    const el = sectionRefs.current[key]
    if (!el) return
    const navHeight = (navRef.current?.offsetHeight ?? 0) + 68 // 68 = navbar height
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 16
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <section style={{
        background: 'var(--green-dark)',
        color: 'var(--white)',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
      }}>
        <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '0.75rem' }}>
          Crafted with care
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--white)' }}>Our Menu</h1>
      </section>

      {/* Section nav */}
      <div
        ref={navRef}
        style={{
          background: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 68,
          zIndex: 10,
          overflowX: 'auto',
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', gap: '0', padding: '0' }}>
            {SECTIONS.map(({ key, label }) => {
              const hasItems = (grouped[key]?.length ?? 0) > 0
              return (
                <button
                  key={key}
                  onClick={() => scrollTo(key)}
                  disabled={!hasItems && !loading}
                  style={{
                    padding: '1rem 1.25rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeSection === key ? '2px solid var(--green-dark)' : '2px solid transparent',
                    color: activeSection === key ? 'var(--green-dark)' : 'var(--text-muted)',
                    fontWeight: activeSection === key ? 700 : 500,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    cursor: hasItems || loading ? 'pointer' : 'default',
                    opacity: !hasItems && !loading ? 0.35 : 1,
                    transition: 'color 0.15s, border-color 0.15s',
                    letterSpacing: '0.01em',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="container" style={{ padding: '3rem 1.5rem 5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            {SECTIONS.filter(({ key }) => (grouped[key]?.length ?? 0) > 0).map(({ key, label }, sectionIdx) => (
              <section
                key={key}
                id={key}
                ref={(el) => { sectionRefs.current[key] = el }}
              >
                {/* Section heading */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.75rem',
                }}>
                  <h2 style={{
                    fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
                    color: 'var(--green-dark)',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </h2>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                {/* Items grid */}
                <motion.div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                    gap: '1rem',
                    perspective: 1000,
                  }}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: sectionIdx * 0.02 } } }}
                >
                  {grouped[key].map((item) => (
                    <MenuCard key={item.item_id} item={item} />
                  ))}
                </motion.div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
