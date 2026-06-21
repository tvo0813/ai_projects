import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Deals from './pages/Deals'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Careers from './pages/Careers'

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1E3932',
            color: '#fff',
            borderRadius: '9999px',
            fontSize: '0.9rem',
            fontWeight: 500,
            padding: '0.65rem 1.25rem',
          },
          success: { iconTheme: { primary: '#00704A', secondary: '#fff' } },
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/menu"     element={<Menu />} />
        <Route path="/deals"    element={<Deals />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin"    element={<AdminDashboard />} />
        <Route path="/privacy"  element={<PrivacyPolicy />} />
        <Route path="/careers"  element={<Careers />} />
      </Routes>
      <Footer />
    </>
  )
}
