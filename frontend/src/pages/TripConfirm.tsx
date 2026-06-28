import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Toast from '../components/Toast'
import { createTrip } from '../api/trips'
import type { Contractor, WorkType } from '../types'

export default function TripConfirm() {
  const { state } = useLocation() as { state: { contractor: Contractor; code: string; workTypes: WorkType[] } }
  const navigate = useNavigate()
  const [workTypeId, setWorkTypeId] = useState<number>(0)
  const [tripCount, setTripCount] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  if (!state?.contractor) { navigate('/kiosk'); return null }
  const { contractor, workTypes } = state

  const today = new Date().toISOString().split('T')[0]

  const submit = async () => {
    if (!workTypeId || !tripCount || parseInt(tripCount) <= 0) {
      setToast({ msg: 'შეავსე ყველა ველი', type: 'error' })
      return
    }
    setLoading(true)
    try {
      await createTrip({
        contractor_id: contractor.id,
        work_type_id: workTypeId,
        date: today,
        trip_count: parseInt(tripCount),
        price_per_trip: parseFloat(price) || 0,
        notes: notes || undefined,
      })
      setToast({ msg: `${contractor.name} — ${tripCount} რეისი ✓`, type: 'success' })
      setTimeout(() => navigate('/kiosk'), 1500)
    } catch (e: any) {
      setToast({ msg: e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const selectWorkType = (wt: WorkType) => {
    setWorkTypeId(wt.id)
    if (!price) setPrice(String(wt.default_price))
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-sm mx-auto">
        <div className="mb-4">
          <div className="text-xl font-bold">{contractor.name}</div>
          <div className="text-sm text-gray-400">რეისის ჩაწერა — {today}</div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="text-xs text-gray-400 font-semibold mb-2">სამუშაოს ტიპი</div>
            <div className="space-y-2">
              {workTypes.map(wt => (
                <button key={wt.id}
                  onClick={() => selectWorkType(wt)}
                  className={`w-full px-4 py-3 rounded-[12px] text-left text-sm font-medium transition-all ${
                    workTypeId === wt.id
                      ? 'bg-[#007AFF] text-white'
                      : 'bg-[#F2F2F7] text-[#1C1C1E]'
                  }`}
                >
                  {wt.name}
                  {wt.default_price > 0 && (
                    <span className="ml-2 opacity-70 text-xs">{wt.default_price} ₾/რ.</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs text-gray-400 font-semibold mb-3">დეტალები</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">რეისების რაოდენობა</label>
                <input
                  type="number" min="1" inputMode="numeric"
                  value={tripCount} onChange={e => setTripCount(e.target.value)}
                  className="inp text-center text-xl font-bold"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ფასი / რეისი (₾)</label>
                <input
                  type="number" min="0" inputMode="decimal"
                  value={price} onChange={e => setPrice(e.target.value)}
                  className="inp text-center text-xl font-bold"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">შენიშვნა</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} className="inp" placeholder="სურვილისამებრ" />
              </div>
            </div>
          </div>

          {tripCount && price && (
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-400">ჯამი</div>
              <div className="text-2xl font-bold text-[#34C759]">
                {(parseInt(tripCount || '0') * parseFloat(price || '0')).toFixed(2)} ₾
              </div>
            </div>
          )}

          <button onClick={submit} disabled={loading} className="btn-green">
            {loading ? '...' : '✓ შენახვა'}
          </button>
          <button onClick={() => navigate('/kiosk')} className="btn-gray">
            ← უკან
          </button>
        </div>
      </div>
    </div>
  )
}
