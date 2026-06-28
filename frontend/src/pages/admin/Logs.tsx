import { useState, useEffect } from 'react'
import Toast from '../../components/Toast'
import { getLogs, updateLog, deleteLog } from '../../api/logs'
import { getContractors } from '../../api/contractors'
import { getSites } from '../../api/sites'
import { getSession } from '../../api/auth'
import type { EquipmentLog, Contractor, Site } from '../../types'

const today = new Date().toISOString().split('T')[0]

function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalDatetimeInput(val: string): string {
  return new Date(val).toISOString()
}

export default function Logs() {
  const [logs, setLogs] = useState<EquipmentLog[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [filters, setFilters] = useState({ from: today, to: today, contractor_id: '', site_id: '' })
  const [editLog, setEditLog] = useState<EquipmentLog | null>(null)
  const [editForm, setEditForm] = useState({ entry_timestamp: '', exit_timestamp: '' })
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const session = getSession()

  const load = async () => {
    const params: any = {
      from_dt: filters.from + 'T00:00:00',
      to_dt: filters.to + 'T23:59:59',
    }
    if (filters.contractor_id) params.contractor_id = parseInt(filters.contractor_id)
    if (filters.site_id) params.site_id = parseInt(filters.site_id)
    const data = await getLogs(params)
    setLogs(data)
  }

  useEffect(() => {
    load()
    getContractors().then(setContractors)
    if (session?.isAdmin) getSites().then(setSites)
  }, [])

  useEffect(() => { load() }, [filters])

  const startEdit = (log: EquipmentLog) => {
    setEditLog(log)
    setEditForm({
      entry_timestamp: toLocalDatetimeInput(log.entry_timestamp),
      exit_timestamp: log.exit_timestamp ? toLocalDatetimeInput(log.exit_timestamp) : '',
    })
  }

  const submitEdit = async () => {
    if (!editLog) return
    try {
      await updateLog(editLog.id, {
        entry_timestamp: fromLocalDatetimeInput(editForm.entry_timestamp),
        exit_timestamp: editForm.exit_timestamp ? fromLocalDatetimeInput(editForm.exit_timestamp) : null,
      })
      setToast({ msg: 'ცვლილება შენახულია', type: 'success' })
      setEditLog(null)
      load()
    } catch (e: any) {
      setToast({ msg: e.message, type: 'error' })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ჩანაწერი წაიშალოს?')) return
    try {
      await deleteLog(id)
      setToast({ msg: 'ჩანაწერი წაიშალა', type: 'success' })
      load()
    } catch (e: any) {
      setToast({ msg: e.message, type: 'error' })
    }
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('ka', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">ჩანაწერები</h1>
        <span className="text-sm text-gray-400">{logs.length} ჩანაწერი</span>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input type="date" className="inp w-auto" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" className="inp w-auto" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
        <select className="inp w-auto" value={filters.contractor_id} onChange={e => setFilters({ ...filters, contractor_id: e.target.value })}>
          <option value="">ყველა კონტრ.</option>
          {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {session?.isAdmin && (
          <select className="inp w-auto" value={filters.site_id} onChange={e => setFilters({ ...filters, site_id: e.target.value })}>
            <option value="">ყველა ობიექტი</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className={`card px-4 py-3 flex items-center gap-3 ${log.is_open ? 'border-2 border-[#FF9F0A]' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{log.equipment_name}</div>
              <div className="text-xs text-gray-500 truncate">{log.contractor_name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {fmt(log.entry_timestamp)}
                {log.exit_timestamp
                  ? <> → {fmt(log.exit_timestamp)} <span className="text-gray-500">({log.total_hours.toFixed(1)} სთ)</span></>
                  : <span className="ml-1 text-[#FF9F0A] font-medium">ღია</span>
                }
              </div>
              {log.overtime_hours > 0 && (
                <span className="badge badge-orange text-xs mt-0.5">{log.overtime_hours}სთ ზეგ.</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold text-gray-600">{log.daily_rate} ₾</span>
              {log.entry_photo_url && (
                <a href={log.entry_photo_url} target="_blank" rel="noreferrer" className="text-[#007AFF] text-xs">📷შ</a>
              )}
              {log.exit_photo_url && (
                <a href={log.exit_photo_url} target="_blank" rel="noreferrer" className="text-[#34C759] text-xs">📷გ</a>
              )}
              <button onClick={() => startEdit(log)} className="text-[#007AFF] text-sm">✏️</button>
              <button onClick={() => handleDelete(log.id)} className="text-[#FF3B30] text-sm">🗑</button>
            </div>
          </div>
        ))}
        {!logs.length && <div className="text-center text-gray-400 py-8">ჩანაწერი არ არის</div>}
      </div>

      {editLog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="card p-5 w-full max-w-sm">
            <div className="text-sm font-semibold mb-3">ჩანაწერის რედაქტირება</div>
            <div className="text-xs text-gray-400 mb-3">{editLog.equipment_name} · {editLog.contractor_name}</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">შემოსვლა</label>
                <input
                  type="datetime-local"
                  className="inp"
                  value={editForm.entry_timestamp}
                  onChange={e => setEditForm({ ...editForm, entry_timestamp: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">გასვლა (ცარიელი = ღია)</label>
                <input
                  type="datetime-local"
                  className="inp"
                  value={editForm.exit_timestamp}
                  onChange={e => setEditForm({ ...editForm, exit_timestamp: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={submitEdit} className="flex-1 py-3 bg-[#007AFF] text-white rounded-[12px] font-semibold text-sm">
                  შენახვა
                </button>
                <button onClick={() => setEditLog(null)} className="flex-1 py-3 bg-[#F2F2F7] rounded-[12px] text-sm">
                  გაუქმება
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
