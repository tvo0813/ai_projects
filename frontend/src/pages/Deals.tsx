import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getPublicDeals, type PublicDeal } from '../api/deals'

const DISCOUNT_ICON: Record<string, string> = {
  percentage:   '％',
  fixed_amount: '＄',
  free_item:    '🎁',
}

const BADGE_COLOR: Record<string, { bg: string; color: string }> = {
  Daily:    { bg: '#D4E9E2', color: '#1E3932' },
  Weekly:   { bg: '#E8C99A', color: '#5C3A10' },
  Ongoing:  { bg: '#EEF7F2', color: '#2E6D5E' },
  Birthday: { bg: '#FCE8F0', color: '#8B1A4A' },
  Loyalty:  { bg: '#F5E7CA', color: '#7A5C1E' },
}

function DealCard({ deal, index }: { deal: PublicDeal; index: number }) {
  const icon    = DISCOUNT_ICON[deal.discount_type] ?? '✦'
  const badge   = deal.badge ? (BADGE_COLOR[deal.badge] ?? BADGE_COLOR.Ongoing) : null

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        display: 'flex',
        gap: '1.25rem',
        alignItems: 'flex-start',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.09)' }}
    >
      {/* Icon circle */}
      <div style={{
        width: 52, height: 52, flexShrink: 0,
        borderRadius: '50%',
        background: 'var(--green-xlight)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem',
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit' }}>
            {deal.title}
          </h3>
          {badge && deal.badge && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: badge.bg, color: badge.color,
            }}>
              {deal.badge}
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.75rem' }}>
          {deal.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            fontWeight: 700, fontSize: '0.95rem',
            color: 'var(--green)',
          }}>
            {deal.label}
          </span>
          {deal.expires_at && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        textAlign: 'center',
        padding: '5rem 1.5rem',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>☕</div>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--green-dark)', marginBottom: '0.75rem' }}>
        No deals today
      </h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>
        We're brewing up something special. Check back soon — great deals are always just around the corner.
      </p>
    </motion.div>
  )
}

export default function Deals() {
  const [deals, setDeals]   = useState<PublicDeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicDeals()
      .then(setDeals)
      .catch(() => setDeals([]))
      .finally(() => setLoading(false))
  }, [])

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
          Offers & promotions
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--white)', marginBottom: '0.5rem' }}>
          Today's Deals
        </h1>
        <p style={{ color: 'var(--green-light)', fontSize: '1.05rem' }}>
          Exclusive offers for our customers — show this page to your barista.
        </p>
      </section>

      <div className="container" style={{ padding: '3rem 1.5rem 5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <div className="spinner" />
          </div>
        ) : deals.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxWidth: 720,
              margin: '0 auto',
            }}
          >
            {deals.map((deal, i) => (
              <DealCard key={deal.title} deal={deal} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
