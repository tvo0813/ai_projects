import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import SpinWheel from '../components/deals/SpinWheel'

export default function Deals() {
  const { user } = useAuthStore()

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--brown-800), var(--green-matcha))',
        color: 'var(--cream)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎰 Deals & Rewards</h1>
        <p style={{ color: 'var(--brown-200)', fontSize: '1.1rem' }}>Spin the wheel for your chance to win!</p>
      </div>

      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        {!user && (
          <div style={{
            background: 'var(--brown-100)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            textAlign: 'center',
            marginBottom: '2rem',
            border: '1.5px solid var(--brown-300)',
          }}>
            <p style={{ marginBottom: '1rem', fontWeight: 500 }}>
              🔒 Log in to spin the wheel and claim deals
            </p>
            <Link to="/login" className="btn btn-primary">Login to Spin</Link>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SpinWheel />
        </div>

        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem' }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '1', title: 'Create Account', desc: 'Sign up free — takes 30 seconds.' },
              { step: '2', title: 'Spin Daily', desc: 'One free spin per day. Earn more by ordering.' },
              { step: '3', title: 'Win Rewards', desc: 'Discounts, free items, and surprise bonuses.' },
              { step: '4', title: 'Redeem at Checkout', desc: 'Use your unique code when you order online.' },
            ].map((s) => (
              <div key={s.step} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--brown-500)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: 700, margin: '0 auto 1rem',
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
