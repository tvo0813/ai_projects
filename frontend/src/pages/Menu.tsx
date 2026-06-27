import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getMenuItems, type MenuItem } from '../api/menu'
import MenuCard from '../components/menu/MenuCard'

function ItemModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,8,6,0.8)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 24 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--espresso-card)', border: '1px solid rgba(200,169,110,0.14)', borderRadius: 'var(--radius-2xl)', maxWidth: 400, width: '100%', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>

        <div style={{ height: 230, background: item.image_url ? `url(${item.image_url}) center/cover no-repeat` : 'linear-gradient(135deg, #2E1710, #0E0806)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!item.image_url && (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.2)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>
            </svg>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,8,6,0.85) 0%, transparent 50%)' }} />
          <button onClick={onClose} aria-label="Close"
            style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(14,8,6,0.65)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none', backdropFilter: 'blur(6px)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,237,214,0.6)" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.3, flex: 1, paddingRight: '1rem', color: 'var(--cream-warm)', fontFamily: 'var(--font-display)' }}>
              {item.name}
            </h3>
            <span style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '1.1rem', flexShrink: 0, fontFamily: 'var(--font-body)' }}>
              ${item.price.toFixed(2)}
            </span>
          </div>

          {item.description && (
            <p style={{ fontSize: '0.875rem', color: 'rgba(245,237,214,0.5)', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              {item.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
            {item.tags?.includes('popular') && (
              <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.22rem 0.6rem', borderRadius: 999, background: 'rgba(200,169,110,0.12)', color: 'var(--amber)', border: '1px solid rgba(200,169,110,0.25)', fontFamily: 'var(--font-body)' }}>Popular</span>
            )}
            {!item.is_available && (
              <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.22rem 0.6rem', borderRadius: 999, background: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1px solid rgba(220,38,38,0.2)', fontFamily: 'var(--font-body)' }}>Unavailable</span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

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
  const [selected, setSelected]     = useState<MenuItem | null>(null)
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
                  {grouped[key].map(item => <MenuCard key={item.item_id} item={item} onOpen={setSelected} />)}
                </motion.div>
              </section>
            ))}
          </div>
        )}
      </div>
      {createPortal(
        <AnimatePresence>
          {selected && <ItemModal item={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
