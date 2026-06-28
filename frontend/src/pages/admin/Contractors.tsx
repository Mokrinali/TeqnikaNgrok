import { useState, useEffect } from 'react'
import Toast from '../../components/Toast'
import { getContractors, createContractor, updateContractor, deleteContractor } from '../../api/contractors'
import { getSites } from '../../api/sites'
import { getSession } from '../../api/auth'
import type { Contractor, Site } from '../../types'

const TYPES = ['ფიზიკური პირი', 'ინდივიდუალური მეწარმე', 'მცირე მეწარმე', 'შპს']
const MODES = ['დღიური', 'რეისული', 'ორივე']
const empty = { contractor_type: 'ფიზიკური პირი', contractor_mode: 'დღიური', name: '', id_code: '', phone: '', plate_number: '', notes: '', is_active: true, site_id: 0 }

export default function Contractors() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [form, setForm] = useState<any>(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const session = getSession()

  const load = () => getContractors().then(setContractors)
  useEffect(() => {
    load()
    if (session?.isAdmin) getSites().then(setSites)
  }, [])

  const submit = async () => {
    try {
      if (editId) await updateContractor(editId, form)
      else await createContractor(form)
      setToast({ msg: 'შენახულია', type: 'success' })
      setForm(empty); setEditId(null); setShowForm(false); load()
    } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  const startEdit = (c: Contractor) => {
    setForm({ contractor_type: c.contractor_type, contractor_mode: c.contractor_mode, name: c.name, id_code: c.id_code, phone: c.phone || '', plate_number: c.plate_number || '', notes: c.notes || '', is_active: c.is_active, site_id: c.site_id })
    setEditId(c.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('წაიშალოს?')) return
    try { await deleteContractor(id); load() } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  const modeIcon: Record<string, string> = { 'დღიური': '🚜', 'რეისული': '🚛', 'ორივე': '🚜🚛' }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">კონტრაქტორები</h1>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} className="px-4 py-2 bg-[#007AFF] text-white rounded-[12px] text-sm font-semibold">
          + კონტრაქტორი
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-4">
          <div className="text-sm font-semibold mb-3">{editId ? 'რედაქტირება' : 'ახალი კონტრაქტორი'}</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">სამუშაოს ტიპი</div>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map(m => (
                  <button key={m} type="button" onClick={() => setForm({ ...form, contractor_mode: m })}
                    className={`py-2 rounded-[10px] text-sm font-medium ${form.contractor_mode === m ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7]'}`}>
                    {modeIcon[m]} {m}
                  </button>
                ))}
              </div>
            </div>
            <select className="inp" value={form.contractor_type} onChange={e => setForm({ ...form, contractor_type: e.target.value })}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input className="inp" placeholder="სახელი" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="inp" placeholder="პირადი / საიდენტ. კოდი" inputMode="numeric" value={form.id_code} onChange={e => setForm({ ...form, id_code: e.target.value })} />
            <input className="inp" placeholder="ტელეფონი" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input className="inp" placeholder="სახელმწიფო ნომერი" value={form.plate_number} onChange={e => setForm({ ...form, plate_number: e.target.value })} />
            <input className="inp" placeholder="შენიშვნა" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            {session?.isAdmin && (
              <select className="inp" value={form.site_id} onChange={e => setForm({ ...form, site_id: parseInt(e.target.value) })}>
                <option value={0}>— ობიექტი —</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              აქტიური
            </label>
            <div className="flex gap-2">
              <button onClick={submit} className="flex-1 py-3 bg-[#007AFF] text-white rounded-[12px] font-semibold text-sm">შენახვა</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-[#F2F2F7] rounded-[12px] text-sm">გაუქმება</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {contractors.map(c => (
          <div key={c.id} className="card px-4 py-3 flex items-center gap-3">
            <span className="text-lg">{modeIcon[c.contractor_mode]}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.name}</div>
              <div className="text-xs text-gray-400">{c.id_code} {c.plate_number && `· ${c.plate_number}`}</div>
            </div>
            <span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'აქტ.' : 'არააქტ.'}</span>
            <button onClick={() => startEdit(c)} className="text-[#007AFF] text-sm">✏️</button>
            <button onClick={() => handleDelete(c.id)} className="text-[#FF3B30] text-sm">🗑</button>
          </div>
        ))}
        {!contractors.length && <div className="text-center text-gray-400 py-8">კონტრაქტორი არ არის</div>}
      </div>
    </div>
  )
}
