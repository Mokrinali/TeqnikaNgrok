import { useState, useEffect } from 'react'
import { getLogs } from '../../api/logs'
import { getContractors } from '../../api/contractors'
import { getSites } from '../../api/sites'
import { getSession } from '../../api/auth'
import type { EquipmentLog, Contractor, Site } from '../../types'

const GEO_MONTHS = ['იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი','ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი']
const GEO_DAYS   = ['კვ','ორ','სამ','ოთხ','ხუთ','პარ','შაბ']

const now      = new Date()
const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-01`
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

const fmtDate  = (ts: string) => { const d = new Date(ts); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}` }
const fmtTime  = (ts: string) => new Date(ts).toLocaleTimeString('ka', { hour: '2-digit', minute: '2-digit' })
const fmtDay   = (ts: string) => GEO_DAYS[new Date(ts).getDay()]
const fmtH     = (h: number)  => h % 1 === 0 ? String(Math.round(h)) : h.toFixed(1)
const fmtRange = (from: string, to: string) => {
  const f = new Date(from), t = new Date(to)
  return `${String(f.getDate()).padStart(2,'0')} ${GEO_MONTHS[f.getMonth()]} — ${String(t.getDate()).padStart(2,'0')} ${GEO_MONTHS[t.getMonth()]} ${t.getFullYear()}`
}

interface EqGroup {
  equipment_id: number
  equipment_name: string
  plate_number: string | null
  daily_rate: number
  logs: EquipmentLog[]
  workDays: number
  overtime: number
  amount: number
}
interface ContGroup {
  id: number
  name: string
  equipments: EqGroup[]
  workDays: number
  overtime: number
  amount: number
}

function buildGroups(logs: EquipmentLog[]): ContGroup[] {
  const contMap = new Map<number, ContGroup>()
  for (const log of logs) {
    if (!contMap.has(log.contractor_id))
      contMap.set(log.contractor_id, { id: log.contractor_id, name: log.contractor_name, equipments: [], workDays: 0, overtime: 0, amount: 0 })
    const cg = contMap.get(log.contractor_id)!
    let eq = cg.equipments.find(e => e.equipment_id === log.equipment_id)
    if (!eq) {
      eq = { equipment_id: log.equipment_id, equipment_name: log.equipment_name, plate_number: log.plate_number, daily_rate: log.daily_rate, logs: [], workDays: 0, overtime: 0, amount: 0 }
      cg.equipments.push(eq)
    }
    eq.logs.push(log)
    if (!log.is_open) {
      eq.workDays++; eq.overtime += log.overtime_hours; eq.amount += log.daily_rate
      cg.workDays++;  cg.overtime  += log.overtime_hours; cg.amount  += log.daily_rate
    }
  }
  return Array.from(contMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export default function Reports() {
  const [groups, setGroups]           = useState<ContGroup[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [sites, setSites]             = useState<Site[]>([])
  const [pending, setPending]         = useState({ from: firstDay, to: lastDay, contractor_id: '', site_id: '' })
  const [applied, setApplied]         = useState({ from: firstDay, to: lastDay, contractor_id: '', site_id: '' })
  const session = getSession()

  const load = async (f = applied) => {
    const params: any = { from_dt: f.from + 'T00:00:00', to_dt: f.to + 'T23:59:59' }
    if (f.contractor_id) params.contractor_id = parseInt(f.contractor_id)
    if (f.site_id) params.site_id = parseInt(f.site_id)
    setGroups(buildGroups(await getLogs(params)))
  }

  const applyFilter = () => { setApplied(pending); load(pending) }

  useEffect(() => {
    load()
    getContractors().then(setContractors)
    if (session?.isAdmin) getSites().then(setSites)
  }, [])

  const openExcel = (extra?: Record<string, string>) => {
    const qs = new URLSearchParams({ from_dt: applied.from, to_dt: applied.to })
    const token = JSON.parse(localStorage.getItem('teknika_session') || '{}').token
    if (token) qs.set('_token', token)
    if (applied.contractor_id) qs.set('contractor_id', applied.contractor_id)
    if (applied.site_id) qs.set('site_id', applied.site_id)
    if (extra) Object.entries(extra).forEach(([k, v]) => qs.set(k, v))
    window.open(`/teqnika-ngrok/api/reports/export-excel?${qs}`)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1d1d1f', lineHeight: 1.1, margin: 0 }}>ტაბელი</h1>
          <div style={{ color: '#6e6e73', fontSize: '0.9rem', marginTop: '0.2rem' }}>{fmtRange(applied.from, applied.to)}</div>
        </div>
        <button onClick={() => openExcel()} style={{ flexShrink: 0, background: '#34C759', color: '#fff', border: 'none', borderRadius: 20, padding: '0.5rem 1.1rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Excel ↓
        </button>
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

      {/* Contractor groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {groups.map(g => (
          <div key={g.id} className="card overflow-hidden">
            {/* Contractor header */}
            <div style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1d1d1f' }}>{g.name}</span>
              <button
                onClick={() => openExcel({ contractor_id: String(g.id) })}
                style={{ background: 'none', border: '1px solid #d2d2d7', borderRadius: 20, padding: '0.2rem 0.8rem', fontSize: '0.8rem', fontWeight: 500, color: '#6e6e73', cursor: 'pointer' }}
              >
                ტაბელი
              </button>
            </div>

            {/* Per-equipment sections */}
            {g.equipments.map((eq, ei) => (
              <div key={eq.equipment_id} style={{ borderTop: '1px solid #f2f2f7' }}>
                {/* Equipment header */}
                <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fafafa' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1d1d1f' }}>{eq.equipment_name}</span>
                  {eq.plate_number && (
                    <span style={{ background: '#e5e5ea', borderRadius: 20, padding: '0.1rem 0.55rem', fontSize: '0.78rem', color: '#555', fontWeight: 500 }}>
                      {eq.plate_number}
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', color: '#8E8E93', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{eq.daily_rate} ₾/დღე</span>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        {['თარიღი','კვ. დღე','შემოსვლა','გასვლა','სულ სთ','ზეგ. სთ'].map(h => (
                          <th key={h} style={{ padding: '0.4rem 0.75rem', textAlign: 'left', color: '#8E8E93', fontWeight: 500, borderBottom: '1px solid #f2f2f7', whiteSpace: 'nowrap', background: '#fafafa' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {eq.logs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                          <td style={{ padding: '0.45rem 0.75rem', color: '#1d1d1f', whiteSpace: 'nowrap' }}>{fmtDate(log.entry_timestamp)}</td>
                          <td style={{ padding: '0.45rem 0.75rem', color: '#6e6e73' }}>{fmtDay(log.entry_timestamp)}</td>
                          <td style={{ padding: '0.45rem 0.75rem', color: '#1d1d1f' }}>{fmtTime(log.entry_timestamp)}</td>
                          <td style={{ padding: '0.45rem 0.75rem', color: '#1d1d1f' }}>{log.exit_timestamp ? fmtTime(log.exit_timestamp) : '—'}</td>
                          <td style={{ padding: '0.45rem 0.75rem', color: '#1d1d1f' }}>{log.is_open ? '—' : `${log.total_hours.toFixed(2)} სთ`}</td>
                          <td style={{ padding: '0.45rem 0.75rem', color: log.overtime_hours > 0 ? '#FF9F0A' : '#8E8E93', fontWeight: log.overtime_hours > 0 ? 600 : 400 }}>
                            {log.is_open || log.overtime_hours === 0 ? '—' : `${fmtH(log.overtime_hours)} სთ`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary footer */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #f2f2f7' }}>
                  <div style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid #f2f2f7' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1d1d1f', lineHeight: 1.1 }}>{eq.workDays}</div>
                    <div style={{ fontSize: '0.72rem', color: '#8E8E93', marginTop: '0.15rem' }}>სამ. დღეები</div>
                  </div>
                  <div style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid #f2f2f7' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FF9F0A', lineHeight: 1.1 }}>{fmtH(eq.overtime)} სთ</div>
                    <div style={{ fontSize: '0.72rem', color: '#8E8E93', marginTop: '0.15rem' }}>ზეგ. საათები</div>
                  </div>
                  <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34C759', lineHeight: 1.1 }}>{eq.amount.toFixed(0)} ₾</div>
                    <div style={{ fontSize: '0.72rem', color: '#8E8E93', marginTop: '0.15rem' }}>ეკუთვნის</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        {!groups.length && (
          <div style={{ textAlign: 'center', color: '#8E8E93', padding: '3rem 0' }}>ჩანაწერი არ არის</div>
        )}
      </div>
    </div>
  )
}
