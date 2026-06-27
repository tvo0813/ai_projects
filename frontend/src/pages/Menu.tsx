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
  const [items, setItems]           = useState<MenuItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeSection, setActive]  = useState('signature')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getMenuItems().then(setItems).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }) },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  const grouped = SECTIONS.reduce<Record<string, MenuItem[]>>((acc, { key }) => {
    acc[key] = items.filter(i => {
      if (!i.is_available) return false
      if (i.category === key) return true
      if (key !== 'signature' && i.category === 'signature' && i.tags?.includes(key)) return true
      return false
    })
    return acc
  }, {})

  const scrollTo = (key: string) => {
    const el = sectionRefs.current[key]
    if (!el) return
    const navHeight = (navRef.current?.offsetHeight ?? 0) + 68
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 16
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--espresso)' }}>
      {/* Page header */}
      <section style={{ background: 'var(--espresso-mid)', padding: '4.5rem 1.5rem 3.5rem', textAlign: 'center', borderBottom: '1px solid rgba(200,169,110,0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(200,169,110,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(200,169,110,0.55)', marginBottom: '1rem', fontFamily: 'var(--font-body)' }}>
            Crafted with care
          </p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 300, fontStyle: 'italic', color: 'var(--cream-warm)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
            Our Menu
          </h1>
        </motion.div>
      </section>

      {/* Sticky category nav */}
      <div ref={navRef} style={{ background: 'rgba(14,8,6,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(200,169,110,0.1)', position: 'sticky', top: 64, zIndex: 10, overflowX: 'auto' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 0, padding: 0 }}>
            {SECTIONS.map(({ key, label }) => {
              const hasItems = (grouped[key]?.length ?? 0) > 0
              const active = activeSection === key
              return (
                <button key={key} onClick={() => scrollTo(key)} disabled={!hasItems && !loading}
                  style={{
                    padding: '1rem 1.25rem',
                    background: 'none', border: 'none',
                    borderBottom: active ? '2px solid var(--amber)' : '2px solid transparent',
                    color: active ? 'var(--amber)' : 'rgba(245,237,214,0.4)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.78rem', whiteSpace: 'nowrap',
                    cursor: hasItems || loading ? 'none' : 'default',
                    opacity: !hasItems && !loading ? 0.25 : 1,
                    transition: 'color 0.18s, border-color 0.18s',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    fontFamily: 'var(--font-body)',
                  }}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Menu sections */}
      <div className="container" style={{ padding: '3rem 1.5rem 6rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(200,169,110,0.2)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem' }}>
            {SECTIONS.filter(({ key }) => (grouped[key]?.length ?? 0) > 0).map(({ key, label }, sectionIdx) => (
              <section key={key} id={key} ref={el => { sectionRefs.current[key] = el }}>
                {/* Section heading */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, fontStyle: 'italic', color: 'var(--cream-warm)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
                    {label}
                  </h2>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(200,169,110,0.25), transparent)' }} />
                </div>

                {/* Items grid */}
                <motion.div
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1.1rem', perspective: 1000 }}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: sectionIdx * 0.02 } } }}
                >
                  {grouped[key].map(item => <MenuCard key={item.item_id} item={item} />)}
                </motion.div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
