import SpinWheel from '../components/deals/SpinWheel'

const HOW_STEPS = [
  { step: '1', title: 'Come visit us', desc: 'Stop by any of our locations for your daily coffee or tea.' },
  { step: '2', title: 'Spin daily', desc: 'One free spin per day — no account needed.' },
  { step: '3', title: 'Win rewards', desc: 'Discounts, free drinks, free items, and surprise bonuses.' },
  { step: '4', title: 'Redeem in store', desc: 'Show your winning code to our barista when you order.' },
]

export default function Deals() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)' }}>
      {/* Header */}
      <section style={{
        background: 'var(--green-dark)',
        color: 'var(--white)',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
      }}>
        <p className="section-label" style={{ color: 'var(--green-light)', marginBottom: '0.75rem' }}>
          Daily rewards
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--white)', marginBottom: '0.5rem' }}>
          Spin & Win
        </h1>
        <p style={{ color: 'var(--green-light)', fontSize: '1.05rem' }}>
          Spin the wheel every day for your chance at free drinks and discounts.
        </p>
      </section>

      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        {/* Wheel */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
          <SpinWheel />
        </div>

        {/* How it works */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '3.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p className="section-label" style={{ marginBottom: '0.5rem' }}>Simple</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)' }}>How it works</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            maxWidth: 860,
            margin: '0 auto',
          }}>
            {HOW_STEPS.map((s) => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 44, height: 44,
                  borderRadius: '50%',
                  background: 'var(--green-dark)',
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1rem',
                  margin: '0 auto 1rem',
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'inherit', marginBottom: '0.4rem' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
