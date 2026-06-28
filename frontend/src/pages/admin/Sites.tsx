import { useState, useEffect } from 'react'
import Toast from '../../components/Toast'
import { getSites, createSite, updateSite, deleteSite } from '../../api/sites'
import type { Site } from '../../types'

const empty = { name: '', code: '', is_active: true }

export default function Sites() {
  const [sites, setSites] = useState<Site[]>([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = () => getSites().then(setSites)
  useEffect(() => { load() }, [])

  const submit = async () => {
    try {
      if (editId) await updateSite(editId, form)
      else await createSite(form)
      setToast({ msg: editId ? 'ცვლილება შენახულია' : 'ობიექტი დამატებულია', type: 'success' })
      setForm(empty); setEditId(null); setShowForm(false); load()
    } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  const startEdit = (s: Site) => {
    setForm({ name: s.name, code: s.code, is_active: s.is_active })
    setEditId(s.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('წაიშალოს?')) return
    try { await deleteSite(id); load() } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">სამშენებლო ობიექტები</h1>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} className="px-4 py-2 bg-[#007AFF] text-white rounded-[12px] text-sm font-semibold">
          + ობიექტი
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-4">
          <div className="text-sm font-semibold mb-3">{editId ? 'რედაქტირება' : 'ახალი ობიექტი'}</div>
          <div className="space-y-3">
            <input className="inp" placeholder="სახელი" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="inp" placeholder="კოდი (4 ციფრი)" maxLength={4} inputMode="numeric"
              value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
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
        {sites.map(s => (
          <div key={s.id} className="card px-4 py-3 flex items-center gap-3">
            <span className="badge badge-blue text-base font-bold px-3 py-1">{s.code}</span>
            <span className="flex-1 font-medium">{s.name}</span>
            <span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>
              {s.is_active ? 'აქტიური' : 'არააქტ.'}
            </span>
            <button onClick={() => startEdit(s)} className="text-[#007AFF] text-sm">✏️</button>
            <button onClick={() => handleDelete(s.id)} className="text-[#FF3B30] text-sm">🗑</button>
          </div>
        ))}
        {!sites.length && <div className="text-center text-gray-400 py-8">ობიექტი არ არის</div>}
      </div>
    </div>
  )
}
