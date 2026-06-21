import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getLocations, type Location } from '../api/locations'

function LocationCard({ loc, index }: { loc: Location; index: number }) {
  const [embedSrc, setEmbedSrc] = useState(
    loc.maps_embed_url_keyed || loc.maps_embed_url_legacy
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Map embed */}
      <div style={{ width: '100%', height: 320, background: 'var(--cream)' }}>
        <iframe
          title={loc.name}
          src={embedSrc}
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onError={() => {
            if (embedSrc !== loc.maps_embed_url_legacy) {
              setEmbedSrc(loc.maps_embed_url_legacy)
            }
          }}
        />
      </div>

      {/* Info */}
      <div style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--green-dark)' }}>
          {loc.name}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Address */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }}>📍</span>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {loc.address}<br />
                {loc.city}, {loc.state} {loc.zip}
              </p>
              <a
                href={loc.maps_link_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600, marginTop: '0.3rem', display: 'inline-block' }}
              >
                Get directions →
              </a>
            </div>
          </div>

          {/* Hours */}
          {loc.hours && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }}>🕐</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{loc.hours}</p>
            </div>
          )}

          {/* Phone */}
          {loc.phone && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>📞</span>
              <a
                href={`tel:${loc.phone}`}
                style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}
              >
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
      style={{ textAlign: 'center', padding: '5rem 1.5rem', maxWidth: 480, margin: '0 auto' }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📍</div>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--green-dark)', marginBottom: '0.75rem' }}>
        Coming soon
      </h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>
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
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <section style={{
        background: 'var(--green-dark)',
        color: 'var(--white)',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
      }}>
        <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '0.75rem' }}>
          Find us
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--white)' }}>Our Locations</h1>
      </section>

      <div className="container" style={{ padding: '3rem 1.5rem 5rem', maxWidth: 860 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <div className="spinner" />
          </div>
        ) : locations.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {locations.map((loc, i) => (
              <LocationCard key={loc.full_address} loc={loc} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
