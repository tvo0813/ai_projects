import { useState, useEffect } from 'react'

export default function PrivacyPolicy() {
  const [text, setText] = useState('')

  useEffect(() => {
    fetch('/privacy-policy.txt')
      .then((r) => r.text())
      .then(setText)
      .catch(() => setText('Unable to load privacy policy. Please contact us directly.'))
  }, [])

  const sections = text.split('\n\n').filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <section style={{
        background: 'var(--green-dark)',
        color: 'var(--white)',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
      }}>
        <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '0.75rem' }}>Legal</p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--white)' }}>Privacy Policy</h1>
      </section>

      <div className="container" style={{ maxWidth: 760, padding: '4rem 1.5rem 5rem' }}>
        {text ? (
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'clamp(2rem, 4vw, 3rem)',
          }}>
            {sections.map((block, i) => {
              const lines = block.split('\n')
              const first = lines[0].trim()

              // All-caps lines are section headings
              if (first === first.toUpperCase() && first.length > 3 && !first.startsWith('-')) {
                return (
                  <div key={i} style={{ marginBottom: '2rem' }}>
                    {i > 0 && <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2rem' }} />}
                    <h2 style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--green)',
                      marginBottom: '0.75rem',
                      fontFamily: 'inherit',
                    }}>
                      {first}
                    </h2>
                    {lines.slice(1).map((line, j) => line.trim() && (
                      <p key={j} style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        {line}
                      </p>
                    ))}
                  </div>
                )
              }

              // Bullet lines
              if (lines.every(l => l.trim().startsWith('-') || l.trim() === '')) {
                return (
                  <ul key={i} style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                    {lines.filter(l => l.trim().startsWith('-')).map((l, j) => (
                      <li key={j} style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '0.3rem' }}>
                        {l.replace(/^-\s*/, '')}
                      </li>
                    ))}
                  </ul>
                )
              }

              // Regular paragraph
              return (
                <p key={i} style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1.25rem' }}>
                  {block}
                </p>
              )
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  )
}
