import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register } from '../api/auth'
import { useAuthStore } from '../store/useAuthStore'
import { STORE_NAME } from '../config/store'

export default function Register() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const [loading, setLoading] = useState(false)

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const data = await register(form)
      setAuth(data.user, data.access_token)
      toast.success('Welcome to the crew! 🎉')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'var(--green-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem',
            margin: '0 auto 1rem',
          }}>⭐</div>
          <h1 style={{ fontSize: '1.7rem' }}>Join {STORE_NAME}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Free account · Daily spin rewards
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label>Full name</label>
              <input type="text" value={form.full_name} onChange={update('full_name')} required placeholder="Jane Doe" autoComplete="name" />
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={update('email')} required placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="form-group">
              <label>Phone <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 555 000 0000" autoComplete="tel" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={update('password')} required placeholder="At least 8 characters" minLength={8} autoComplete="new-password" />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.25rem' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="spinner" style={{ width: 18, height: 18, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                  Creating account…
                </span>
              ) : 'Create free account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--green)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
