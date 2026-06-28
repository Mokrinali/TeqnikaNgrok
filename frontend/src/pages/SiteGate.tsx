import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import NumPad from '../components/NumPad'
import Toast from '../components/Toast'
import { verifySite } from '../api/auth'

export default function SiteGate() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const svgRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/teqnika/construction-anim.svg')
      .then(r => r.text())
      .then(svg => { if (svgRef.current) svgRef.current.innerHTML = svg })
      .catch(() => {})
  }, [])

  const submit = async () => {
    if (code.length !== 4) return
    setLoading(true)
    setError('')
    try {
      const session = await verifySite(code)
      if (session.isAdmin) navigate('/admin/sites')
      else navigate('/kiosk')
    } catch (e: any) {
      setError(e.message || 'კოდი არასწორია')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>

      {error && <Toast message={error} type="error" onClose={() => setError('')} />}

      {/* Navbar */}
      <nav style={{
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #d2d2d7', padding: '0 1rem',
        display: 'flex', alignItems: 'center',
        minHeight: 52, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: '#1d1d1f' }}>
          ტექნიკის ტაბელი
        </span>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginBottom: '1.75rem' }}>
          <div style={{ width: 22, height: 8, borderRadius: 4, background: '#0071e3' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d2d2d7' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d2d2d7' }} />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#1d1d1f' }}>
            სამშენებლო ობიექტი
          </div>
          <div style={{ fontSize: '1rem', color: '#6e6e73', marginTop: '0.3rem' }}>
            შეიყვანე ობიექტის კოდი
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 22, boxShadow: '0 4px 32px rgba(0,0,0,0.09)', padding: '1.5rem' }}>
          <NumPad value={code} onChange={setCode} maxLength={4} placeholder="_ _ _ _" />
          <button
            onClick={submit}
            disabled={code.length !== 4 || loading}
            style={{
              display: 'block', width: '100%', border: 'none', marginTop: '0.75rem',
              borderRadius: 980, padding: '0.9rem 1.5rem',
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              background: code.length !== 4 ? '#a0c4f1' : '#0071e3',
              color: '#fff', transition: 'background 0.2s',
            }}
          >
            {loading ? '...' : 'შესვლა →'}
          </button>
        </div>

        {/* SVG animation */}
        <div ref={svgRef} style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }} />
      </div>
    </div>
  )
}
