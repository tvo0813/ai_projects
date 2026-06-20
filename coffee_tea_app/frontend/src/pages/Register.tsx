import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register } from '../api/auth'
import { useAuthStore } from '../store/useAuthStore'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
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
      toast.success('Account created! Welcome to the Brew Crew 🎉')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--cream-dark)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🌿</span>
          <h1 style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>Join the Brew Crew</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Free account. Daily spin rewards.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={form.full_name} onChange={update('full_name')} required placeholder="Jane Doe" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={update('email')} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 555 000 0000" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={update('password')} required placeholder="At least 8 characters" minLength={8} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', fontSize: '1rem', padding: '0.9rem' }}>
            {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--brown-500)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
