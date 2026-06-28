import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getPublicDeals, type PublicDeal } from '../api/deals'

const DISCOUNT_SVG: Record<string, React.ReactNode> = {
  percentage: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  ),
  fixed_amount: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  free_item: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
}

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Daily:    { bg: 'rgba(200,169,110,0.12)', color: 'var(--amber)',       border: 'rgba(200,169,110,0.3)' },
  Weekly:   { bg: 'rgba(158,122,63,0.12)', color: 'var(--amber-light)',  border: 'rgba(158,122,63,0.3)' },
  Ongoing:  { bg: 'rgba(200,169,110,0.08)', color: 'rgba(200,169,110,0.7)', border: 'rgba(200,169,110,0.2)' },
  Birthday: { bg: 'rgba(200,100,150,0.12)', color: '#e8a0c0',            border: 'rgba(200,100,150,0.3)' },
  Loyalty:  { bg: 'rgba(200,169,110,0.1)',  color: 'var(--amber-light)', border: 'rgba(200,169,110,0.25)' },
}

function DealCard({ deal, index }: { deal: PublicDeal; index: number }) {
  const icon  = DISCOUNT_SVG[deal.discount_type] ?? null
  const badge = deal.badge ? (BADGE_STYLES[deal.badge] ?? BADGE_STYLES.Ongoing) : null

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(200,169,110,0.18)' }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(200,169,110,0.1)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.75rem 2rem',
        display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
        transition: 'box-shadow 0.25s, transform 0.25s, border-color 0.25s',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Icon */}
      <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: '50%', background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.1rem' }}>
        {icon ?? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--cream-warm)' }}>
            {deal.title}
          </h3>
          {badge && deal.badge && (
            <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: 999, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontFamily: 'var(--font-body)' }}>
              {deal.badge}
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.875rem', color: 'rgba(245,237,214,0.5)', lineHeight: 1.65, marginBottom: '0.9rem', fontFamily: 'var(--font-body)' }}>
          {deal.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--amber)', fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}>
            {deal.label}
          </span>
          {deal.expires_at && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(245,237,214,0.3)', fontFamily: 'var(--font-body)' }}>
              Valid until {new Date(deal.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ textAlign: 'center', padding: '6rem 1.5rem', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>
        </svg>
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 300, fontStyle: 'italic', color: 'var(--cream-warm)', marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
        No deals today
      </h2>
      <p style={{ color: 'rgba(245,237,214,0.45)', lineHeight: 1.75, fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
        We're brewing up something special. Check back soon — great deals are always just around the corner.
      </p>
    </motion.div>
  )
}

export default function Deals() {
  const [deals, setDeals]     = useState<PublicDeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicDeals()
      .then(setDeals)
      .catch(() => setDeals([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--espresso)' }}>
      {/* Page header */}
      <section style={{ background: 'var(--espresso-mid)', padding: '4.5rem 1.5rem 3.5rem', textAlign: 'center', borderBottom: '1px solid rgba(200,169,110,0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(200,169,110,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(200,169,110,0.55)', marginBottom: '1rem', fontFamily: 'var(--font-body)' }}>
            Offers & promotions
          </p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 300, fontStyle: 'italic', color: 'var(--cream-warm)', fontFamily: 'var(--font-display)', lineHeight: 1.1, marginBottom: '0.75rem' }}>
            Today's Deals
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(245,237,214,0.45)', fontFamily: 'var(--font-body)', fontWeight: 300 }}>
            Exclusive offers — show this page to your barista.
          </p>
        </motion.div>
      </section>

      <div className="container" style={{ padding: '3.5rem 1.5rem 6rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(200,169,110,0.2)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : deals.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', maxWidth: 740, margin: '0 auto' }}
          >
            {deals.map((deal, i) => <DealCard key={deal.title} deal={deal} index={i} />)}
          </motion.div>
        )}
      </div>
    </div>
  )
}
