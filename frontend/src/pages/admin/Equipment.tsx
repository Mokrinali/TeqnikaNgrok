import { useState, useEffect } from 'react'
import Toast from '../../components/Toast'
import { getEquipment, createEquipment, updateEquipment, deleteEquipment } from '../../api/equipment'
import { getContractors } from '../../api/contractors'
import type { Equipment, Contractor } from '../../types'

const empty = { name: '', type: '', plate_number: '', daily_rate: '', contractor_id: 0, is_active: true, notes: '' }

export default function EquipmentPage() {
  const [items, setItems]             = useState<Equipment[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [form, setForm]               = useState<any>(empty)
  const [editId, setEditId]           = useState<number | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = () => getEquipment().then(setItems)
  useEffect(() => { load(); getContractors().then(cs => setContractors(cs.filter(c => c.is_active))) }, [])

  const submit = async () => {
    try {
      const payload = { ...form, daily_rate: parseFloat(form.daily_rate) }
      if (editId) await updateEquipment(editId, payload)
      else await createEquipment(payload)
      setToast({ msg: 'შენახულია', type: 'success' })
      setForm(empty); setEditId(null); setShowForm(false); load()
    } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  const startEdit = (e: Equipment) => {
    setForm({ name: e.name, type: e.type || '', plate_number: e.plate_number || '', daily_rate: String(e.daily_rate), contractor_id: e.contractor_id, is_active: e.is_active, notes: e.notes || '' })
    setEditId(e.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('წაიშალოს?')) return
    try { await deleteEquipment(id); load() } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1d1d1f', margin: 0 }}>ტექნიკა</h1>
        <button
          onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }}
          style={{ background: '#0071e3', color: '#fff', border: 'none', borderRadius: 20, padding: '0.5rem 1.1rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          + დამატება
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 mb-4">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem', color: '#1d1d1f' }}>
            {editId ? 'რედაქტირება' : 'ახალი ტექნიკა'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <input className="inp" placeholder="სახელი" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="inp" placeholder="ტიპი (სურვილისამებრ)" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
            <input className="inp" placeholder="სახელმწიფო ნომერი" value={form.plate_number} onChange={e => setForm({ ...form, plate_number: e.target.value })} />
            <input className="inp" placeholder="დღიური ტარიფი (₾)" type="number" inputMode="decimal" value={form.daily_rate} onChange={e => setForm({ ...form, daily_rate: e.target.value })} />
            <select className="inp" value={form.contractor_id} onChange={e => setForm({ ...form, contractor_id: parseInt(e.target.value) })}>
              <option value={0}>— კონტრაქტორი —</option>
              {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="inp" placeholder="შენიშვნა" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#1d1d1f' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              აქტიური
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={submit} style={{ flex: 1, padding: '0.75rem', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>შენახვა</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.75rem', background: '#F2F2F7', color: '#1d1d1f', border: 'none', borderRadius: 12, fontSize: '0.9rem', cursor: 'pointer' }}>გაუქმება</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {items.map(eq => (
          <div key={eq.id} className="card" style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: eq.is_active ? 1 : 0.55 }}>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1d1d1f' }}>{eq.name}</span>
                {eq.type && (
                  <span style={{ background: '#f2f2f7', border: '1px solid #d2d2d7', borderRadius: 20, padding: '0.1rem 0.6rem', fontSize: '0.75rem', color: '#555', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {eq.type}
                  </span>
                )}
                {eq.plate_number && (
                  <span style={{ background: '#1d1d1f', borderRadius: 20, padding: '0.1rem 0.65rem', fontSize: '0.75rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                    {eq.plate_number}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6e6e73' }}>
                კონტრაქტორი: {eq.contractor?.name || '—'}
                {' '}
                <span style={{ color: '#34C759', fontWeight: 600 }}>{eq.daily_rate.toFixed(2)} ₾</span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
              <button
                onClick={() => startEdit(eq)}
                style={{ border: '1.5px solid #0071e3', borderRadius: 20, padding: '0.3rem 0.85rem', background: 'none', color: '#0071e3', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                რედაქტირება
              </button>
              <button
                onClick={() => handleDelete(eq.id)}
                style={{ border: 'none', borderRadius: 20, padding: '0.3rem 0.85rem', background: '#FF3B30', color: '#fff', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                წაშლა
              </button>
            </div>
          </div>
        ))}
        {!items.length && <div style={{ textAlign: 'center', color: '#8E8E93', padding: '3rem 0' }}>ტექნიკა არ არის</div>}
      </div>
    </div>
  )
}
