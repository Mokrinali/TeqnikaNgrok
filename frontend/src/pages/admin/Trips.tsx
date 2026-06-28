import { useState, useEffect } from 'react'
import Toast from '../../components/Toast'
import { getTrips, createTrip, updateTrip, deleteTrip, getActiveTripContractors } from '../../api/trips'
import { getActiveWorkTypes } from '../../api/worktypes'
import { getSites } from '../../api/sites'
import { getSession } from '../../api/auth'
import type { TripLog, Contractor, WorkType, Site } from '../../types'

const now      = new Date()
const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-01`
const today    = now.toISOString().split('T')[0]
const empty    = { contractor_id: 0, work_type_id: 0, date: today, trip_count: '', price_per_trip: '', notes: '' }

const fmtDate = (s: string) => {
  const [y, m, d] = s.split('-')
  return `${d}.${m}.${y}`
}

export default function Trips() {
  const [trips, setTrips]           = useState<TripLog[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [workTypes, setWorkTypes]   = useState<WorkType[]>([])
  const [sites, setSites]           = useState<Site[]>([])
  const [form, setForm]             = useState<any>(empty)
  const [editId, setEditId]         = useState<number | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [pending, setPending]       = useState({ from: firstDay, to: today, contractor_id: '', site_id: '' })
  const [applied, setApplied]       = useState({ from: firstDay, to: today, contractor_id: '', site_id: '' })
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const session = getSession()

  const load = (f = applied) => {
    const params: any = { from_dt: f.from, to_dt: f.to }
    if (f.contractor_id) params.contractor_id = parseInt(f.contractor_id)
    if (f.site_id) params.site_id = parseInt(f.site_id)
    getTrips(params).then(setTrips)
  }

  const applyFilter = () => { setApplied(pending); load(pending) }

  useEffect(() => {
    load()
    getActiveTripContractors().then(setContractors)
    getActiveWorkTypes().then(setWorkTypes)
    if (session?.isAdmin) getSites().then(setSites)
  }, [])

  const submit = async () => {
    try {
      const payload = { ...form, trip_count: parseInt(form.trip_count), price_per_trip: parseFloat(form.price_per_trip) }
      if (editId) await updateTrip(editId, payload)
      else await createTrip(payload)
      setToast({ msg: 'შენახულია', type: 'success' })
      setForm(empty); setEditId(null); setShowForm(false); load()
    } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  const startEdit = (t: TripLog) => {
    setForm({ contractor_id: t.contractor_id, work_type_id: t.work_type_id, date: t.date, trip_count: String(t.trip_count), price_per_trip: String(t.price_per_trip), notes: t.notes || '' })
    setEditId(t.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('წაიშალოს?')) return
    try { await deleteTrip(id); load() } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  const openExcel = () => {
    const qs = new URLSearchParams({ from_dt: applied.from, to_dt: applied.to })
    const token = JSON.parse(localStorage.getItem('teknika_session') || '{}').token
    if (token) qs.set('_token', token)
    if (applied.contractor_id) qs.set('contractor_id', applied.contractor_id)
    if (applied.site_id) qs.set('site_id', applied.site_id)
    window.open(`/teqnika/api/reports/export-trips-excel?${qs}`)
  }

  const total      = trips.reduce((s, t) => s + t.total, 0)
  const totalTrips = trips.reduce((s, t) => s + t.trip_count, 0)

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1d1d1f', margin: 0 }}>რეისები</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={openExcel} style={{ background: '#34C759', color: '#fff', border: 'none', borderRadius: 20, padding: '0.5rem 1.1rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
            Excel ↓
          </button>
          <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} style={{ background: '#0071e3', color: '#fff', border: 'none', borderRadius: 20, padding: '0.5rem 1.1rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
            + ახალი
          </button>
        </div>
      </div>

      {/* Filter card */}
      <div className="card p-4 mb-4">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '0.3rem' }}>დასაწყისი</div>
            <input type="date" className="inp" style={{ minWidth: 130 }} value={pending.from} onChange={e => setPending({ ...pending, from: e.target.value })} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '0.3rem' }}>დასასრული</div>
            <input type="date" className="inp" style={{ minWidth: 130 }} value={pending.to} onChange={e => setPending({ ...pending, to: e.target.value })} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '0.3rem' }}>კონტრაქტორი</div>
            <select className="inp" style={{ minWidth: 160 }} value={pending.contractor_id} onChange={e => setPending({ ...pending, contractor_id: e.target.value })}>
              <option value="">ყველა</option>
              {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {session?.isAdmin && sites.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '0.3rem' }}>ობიექტი</div>
              <select className="inp" style={{ minWidth: 140 }} value={pending.site_id} onChange={e => setPending({ ...pending, site_id: e.target.value })}>
                <option value="">ყველა</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <button onClick={applyFilter} style={{ background: '#0071e3', color: '#fff', border: 'none', borderRadius: 10, padding: '0.65rem 1.2rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
            ფილტრი
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 mb-4">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem', color: '#1d1d1f' }}>
            {editId ? 'რეისის რედაქტირება' : 'ახალი რეისი'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <select className="inp" value={form.contractor_id} onChange={e => setForm({ ...form, contractor_id: parseInt(e.target.value) })}>
              <option value={0}>— კონტრაქტორი —</option>
              {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="inp" value={form.work_type_id} onChange={e => {
              const wt = workTypes.find(w => w.id === parseInt(e.target.value))
              setForm({ ...form, work_type_id: parseInt(e.target.value), price_per_trip: wt?.default_price ? String(wt.default_price) : form.price_per_trip })
            }}>
              <option value={0}>— სამუშაოს ტიპი —</option>
              {workTypes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="date" className="inp" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <input className="inp" placeholder="რეისების რაოდენობა" type="number" inputMode="numeric" value={form.trip_count} onChange={e => setForm({ ...form, trip_count: e.target.value })} />
            <input className="inp" placeholder="ფასი / რეისი (₾)" type="number" inputMode="decimal" value={form.price_per_trip} onChange={e => setForm({ ...form, price_per_trip: e.target.value })} />
            <input className="inp" placeholder="შენიშვნა" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={submit} style={{ flex: 1, padding: '0.75rem', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>შენახვა</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.75rem', background: '#F2F2F7', color: '#1d1d1f', border: 'none', borderRadius: 12, fontSize: '0.9rem', cursor: 'pointer' }}>გაუქმება</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary bar */}
      {trips.length > 0 && (
        <div className="card mb-3" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #34C759' }}>
          <span style={{ color: '#6e6e73', fontSize: '0.9rem' }}>სულ რეისები: <strong style={{ color: '#1d1d1f' }}>{totalTrips}</strong></span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#34C759' }}>{total.toFixed(2)} ₾</span>
        </div>
      )}

      {/* Trip cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {trips.map(t => (
          <div key={t.id} className="card" style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1d1d1f' }}>{t.contractor_name}</span>
                {t.plate_number && (
                  <span style={{ background: '#1d1d1f', borderRadius: 20, padding: '0.1rem 0.65rem', fontSize: '0.75rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {t.plate_number}
                  </span>
                )}
                <span style={{ background: 'none', border: '1px solid #d2d2d7', borderRadius: 20, padding: '0.1rem 0.6rem', fontSize: '0.75rem', color: '#555', whiteSpace: 'nowrap' }}>
                  {t.work_type_name}
                </span>
              </div>
              <div style={{ fontSize: '0.83rem', color: '#6e6e73', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span>📅 {fmtDate(t.date)}</span>
                <span>🔢 {t.trip_count} რეისი</span>
                <span>{t.price_per_trip.toFixed(2)}₾/რეისი</span>
                <span style={{ color: '#34C759', fontWeight: 600 }}>= {t.total.toFixed(2)} ₾</span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
              <button
                onClick={() => startEdit(t)}
                style={{ border: '1.5px solid #0071e3', borderRadius: 20, padding: '0.3rem 0.85rem', background: 'none', color: '#0071e3', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                რედაქტირება
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                style={{ border: 'none', borderRadius: 20, padding: '0.3rem 0.85rem', background: '#FF3B30', color: '#fff', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                წაშლა
              </button>
            </div>
          </div>
        ))}
        {!trips.length && <div style={{ textAlign: 'center', color: '#8E8E93', padding: '3rem 0' }}>ჩანაწერი არ არის</div>}
      </div>
    </div>
  )
}
