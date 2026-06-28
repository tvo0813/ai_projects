import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getLocations, type Location } from '../api/locations'

// keyed URL is useless when key= is blank — fall back to legacy embed
function resolveMapSrc(loc: Location): string {
  const keyed = loc.maps_embed_url_keyed
  if (keyed && !keyed.includes('key=&') && !keyed.endsWith('key=')) return keyed
  return loc.maps_embed_url_legacy
}

function LocationCard({ loc, index }: { loc: Location; index: number }) {
  const [embedSrc] = useState(() => resolveMapSrc(loc))

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(200,169,110,0.1)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Map */}
      <div style={{ width: '100%', height: 340, background: 'rgba(14,8,6,0.6)', position: 'relative' }}>
        <iframe
          title={loc.name}
          src={embedSrc}
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block', opacity: 0.92 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      {/* Info */}
      <div style={{ padding: '2rem 2rem 2.25rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 400, fontStyle: 'italic', marginBottom: '1.5rem', color: 'var(--cream-warm)', fontFamily: 'var(--font-display)' }}>
          {loc.name}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Address */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'rgba(245,237,214,0.7)', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                {loc.address}<br />{loc.city}, {loc.state} {loc.zip}
              </p>
              <a href={loc.maps_link_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', color: 'var(--amber)', fontWeight: 600, marginTop: '0.4rem', display: 'inline-block', letterSpacing: '0.04em', fontFamily: 'var(--font-body)', cursor: 'none' }}>
                Get directions →
              </a>
            </div>
          </div>

          {/* Hours */}
          {loc.hours && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'rgba(245,237,214,0.7)', lineHeight: 1.6, fontFamily: 'var(--font-body)', paddingTop: '0.5rem' }}>
                {loc.hours}
              </p>
            </div>
          )}

          {/* Phone */}
          {loc.phone && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l1.11-1.08a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z"/>
                </svg>
              </div>
              <a href={`tel:${loc.phone}`} style={{ fontSize: '0.9rem', color: 'rgba(245,237,214,0.7)', fontFamily: 'var(--font-body)', cursor: 'none' }}>
                {loc.phone}
              </a>
            </div>
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
      style={{ textAlign: 'center', padding: '6rem 1.5rem', maxWidth: 480, margin: '0 auto' }}
    >
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 300, fontStyle: 'italic', color: 'var(--cream-warm)', marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
        Coming soon
      </h2>
      <p style={{ color: 'rgba(245,237,214,0.45)', lineHeight: 1.75, fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
        We're working on bringing our coffee to more neighborhoods. Stay tuned.
      </p>
    </motion.div>
  )
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .catch(() => setLocations([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--espresso)' }}>
      {/* Page header */}
      <section style={{ background: 'var(--espresso-mid)', padding: '4.5rem 1.5rem 3.5rem', textAlign: 'center', borderBottom: '1px solid rgba(200,169,110,0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(200,169,110,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(200,169,110,0.55)', marginBottom: '1rem', fontFamily: 'var(--font-body)' }}>
            Find us
          </p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 300, fontStyle: 'italic', color: 'var(--cream-warm)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
            Our Locations
          </h1>
        </motion.div>
      </section>

      <div className="container" style={{ padding: '3.5rem 1.5rem 6rem', maxWidth: 860 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(200,169,110,0.2)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : locations.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {locations.map((loc, i) => (
              <LocationCard key={loc.full_address} loc={loc} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
