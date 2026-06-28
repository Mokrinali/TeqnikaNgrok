import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import NumPad from '../components/NumPad'
import Toast from '../components/Toast'
import { getContractorByCode } from '../api/contractors'
import { getEquipmentByContractor } from '../api/equipment'
import { getOpenEntry } from '../api/logs'
import { getActiveWorkTypes } from '../api/worktypes'

export default function Kiosk() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const svgRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/teqnika-ngrok/construction-anim.svg')
      .then(r => r.text())
      .then(svg => { if (svgRef.current) svgRef.current.innerHTML = svg })
      .catch(() => {})
  }, [])

  const submit = async () => {
    if (code.length !== 9 && code.length !== 11) return
    setLoading(true)
    setError('')
    try {
      const contractor = await getContractorByCode(code)

      if (contractor.is_both) {
        navigate('/kiosk/choose', { state: { contractor, code } })
        return
      }

      if (contractor.is_trip) {
        const workTypes = await getActiveWorkTypes()
        if (!workTypes.length) throw new Error('სამუშაოს ტიპი არ არის — დაუკავშირდი ადმინს')
        navigate('/kiosk/trip', { state: { contractor, code, workTypes } })
        return
      }

      const equipment = await getEquipmentByContractor(contractor.id)
      if (!equipment.length) throw new Error('ამ კონტრაქტორს ტექნიკა არ აქვს')

      const items = await Promise.all(
        equipment.map(async (eq) => ({
          equipment: eq,
          open_entry: await getOpenEntry(eq.id),
        }))
      )
      navigate('/kiosk/confirm', { state: { contractor, code, items } })
    } catch (e: any) {
      setError(e.message || 'კოდი ვერ მოიძებნა')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginBottom: '1.75rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34c759' }} />
        <div style={{ width: 22, height: 8, borderRadius: 4, background: '#0071e3' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d2d2d7' }} />
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#1d1d1f' }}>
          კონტრაქტორის კოდი
        </div>
        <div style={{ fontSize: '1rem', color: '#6e6e73', marginTop: '0.3rem' }}>
          შეიყვანე 9 ან 11-ნიშნა კოდი
        </div>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 22, boxShadow: '0 4px 32px rgba(0,0,0,0.09)', padding: '1.5rem' }}>
        <NumPad value={code} onChange={setCode} maxLength={11} placeholder="" />
        <button
          onClick={submit}
          disabled={(code.length !== 9 && code.length !== 11) || loading}
          style={{
            display: 'block', width: '100%', border: 'none', marginTop: '0.75rem',
            borderRadius: 980, padding: '0.9rem 1.5rem',
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            background: (code.length !== 9 && code.length !== 11) ? '#a0c4f1' : '#0071e3',
            color: '#fff', transition: 'background 0.2s',
          }}
        >
          {loading ? '...' : 'ძიება →'}
        </button>
      </div>

      {/* SVG animation */}
      <div ref={svgRef} style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }} />
    </div>
  )
}
