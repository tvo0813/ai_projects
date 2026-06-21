import { motion } from 'framer-motion'

const BENEFITS = [
  { icon: '☕', text: 'Free drinks every shift' },
  { icon: '📚', text: 'Paid training from day one' },
  { icon: '📈', text: 'Room to grow with us' },
  { icon: '🤝', text: 'Tight-knit, supportive team' },
  { icon: '🎉', text: 'Team events & bonding' },
]

const STEPS = [
  { n: '1', title: 'Send your email', desc: 'Email us.' },
  { n: '2', title: 'Interview', desc: 'If your application looks like a good fit, we\'ll reach out to set up a time. We keep it relaxed — just a casual conversation over coffee.' },
  { n: '3', title: 'Our decision', desc: 'We\'ll follow up with you shortly after. If it\'s a great fit, we\'ll reach out with next steps to get you started.' },
]

export default function Careers() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Hero */}
      <section style={{
        background: 'var(--green-dark)',
        color: 'var(--white)',
        padding: '5rem 1.5rem 6rem',
        textAlign: 'center',
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '0.75rem' }}>
            Join the team
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--white)', marginBottom: '1.25rem' }}>
            Grow with us
          </h1>
          <p style={{
            color: 'var(--green-light)',
            fontSize: '1.1rem',
            maxWidth: 540,
            margin: '0 auto',
            lineHeight: 1.75,
          }}>
            We're looking for hard-working, passionate people who love great coffee and love serving their community.
            If that sounds like you, we'd love to hear from you.
          </p>
        </motion.div>
      </section>

      {/* Why join */}
      <section style={{ background: 'var(--white)', padding: '5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.45 }}
            style={{ textAlign: 'center', marginBottom: '3.5rem' }}
          >
            <p className="section-label" style={{ marginBottom: '0.75rem' }}>Why us</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: '1rem' }}>
              More than a job
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
              We grow culture, we influence community, and we serve with heart.
              Every person on our team is part of what makes this place special.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}>
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.text}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.07 }}
                style={{
                  background: 'var(--cream)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{b.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to apply */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.45 }}
            style={{ textAlign: 'center', marginBottom: '3.5rem' }}
          >
            <p className="section-label" style={{ marginBottom: '0.75rem' }}>The process</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>How it works</h2>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'flex-start',
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--green-dark)', color: 'var(--white)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1rem',
                }}>
                  {s.n}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.975rem', fontWeight: 700, fontFamily: 'inherit', marginBottom: '0.3rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Apply CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.45 }}
            style={{
              background: 'var(--green-dark)',
              borderRadius: 'var(--radius-xl)',
              padding: '3rem 2.5rem',
              textAlign: 'center',
              color: 'var(--white)',
            }}
          >
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--white)', marginBottom: '1rem' }}>
              Ready to apply?
            </h2>
            <p style={{ color: 'var(--green-light)', lineHeight: 1.75, marginBottom: '0.75rem', fontSize: '0.975rem' }}>
              Send us an email at{' '}
              <a href="mailto:test111@gmail.com" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                test111@gmail.com
              </a>
            </p>
            <p style={{ color: 'var(--green-light)', lineHeight: 1.85, fontSize: '0.9rem', maxWidth: 480, margin: '0 auto 2rem' }}>
              Please include your <strong style={{ color: 'var(--white)' }}>resume</strong>,{' '}
              <strong style={{ color: 'var(--white)' }}>position of interest</strong>,{' '}
              <strong style={{ color: 'var(--white)' }}>availability</strong>, and whether you're seeking{' '}
              <strong style={{ color: 'var(--white)' }}>part-time or full-time</strong>.{' '}
              We read every application personally.
            </p>
            <a
              href="mailto:test111@gmail.com?subject=Job Application&body=Hi Phin and Beans team,%0D%0A%0D%0AI am interested in applying for [position]. I am looking for [part-time / full-time] work.%0D%0A%0D%0A[Write a short paragraph about yourself and why you'd like to join the team]%0D%0A%0D%0APlease find my resume attached.%0D%0A%0D%0AThank you!"
              className="btn btn-primary"
              style={{ fontSize: '0.95rem', padding: '0.8rem 2.25rem', fontWeight: 700, display: 'inline-flex' }}
            >
              Apply now
            </a>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
