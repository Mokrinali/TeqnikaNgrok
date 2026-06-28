import { useState, useEffect } from 'react'
import Toast from '../../components/Toast'
import { getWorkTypes, createWorkType, updateWorkType, deleteWorkType } from '../../api/worktypes'
import type { WorkType } from '../../types'

const empty = { name: '', default_price: '', is_active: true }

export default function WorkTypes() {
  const [items, setItems] = useState<WorkType[]>([])
  const [form, setForm] = useState<any>(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = () => getWorkTypes().then(setItems)
  useEffect(() => { load() }, [])

  const submit = async () => {
    try {
      const payload = { ...form, default_price: parseFloat(form.default_price) || 0 }
      if (editId) await updateWorkType(editId, payload)
      else await createWorkType(payload)
      setToast({ msg: 'შენახულია', type: 'success' })
      setForm(empty); setEditId(null); setShowForm(false); load()
    } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  const startEdit = (w: WorkType) => {
    setForm({ name: w.name, default_price: String(w.default_price), is_active: w.is_active })
    setEditId(w.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('წაიშალოს?')) return
    try { await deleteWorkType(id); load() } catch (e: any) { setToast({ msg: e.message, type: 'error' }) }
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">სამუშაოს ტიპები</h1>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} className="px-4 py-2 bg-[#007AFF] text-white rounded-[12px] text-sm font-semibold">
          + ტიპი
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-4">
          <div className="space-y-3">
            <input className="inp" placeholder="სახელი" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="inp" placeholder="ნაგულისხმევი ფასი (₾)" type="number" inputMode="decimal" value={form.default_price} onChange={e => setForm({ ...form, default_price: e.target.value })} />
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
        {items.map(w => (
          <div key={w.id} className="card px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{w.name}</div>
              {w.default_price > 0 && <div className="text-xs text-gray-400">{w.default_price} ₾/რეისი</div>}
            </div>
            <span className={`badge ${w.is_active ? 'badge-green' : 'badge-gray'}`}>{w.is_active ? 'აქტ.' : 'არააქტ.'}</span>
            <button onClick={() => startEdit(w)} className="text-[#007AFF] text-sm">✏️</button>
            <button onClick={() => handleDelete(w.id)} className="text-[#FF3B30] text-sm">🗑</button>
          </div>
        ))}
        {!items.length && <div className="text-center text-gray-400 py-8">სამუშაოს ტიპი არ არის</div>}
      </div>
    </div>
  )
}
