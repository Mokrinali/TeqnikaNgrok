import { useLocation, useNavigate } from 'react-router-dom'
import { getEquipmentByContractor } from '../api/equipment'
import { getOpenEntry } from '../api/logs'
import { getActiveWorkTypes } from '../api/worktypes'
import type { Contractor } from '../types'

export default function ChooseMode() {
  const { state } = useLocation() as { state: { contractor: Contractor; code: string } }
  const navigate = useNavigate()

  if (!state?.contractor) { navigate('/kiosk'); return null }
  const { contractor, code } = state

  const goEquipment = async () => {
    const equipment = await getEquipmentByContractor(contractor.id)
    const items = await Promise.all(equipment.map(async eq => ({
      equipment: eq,
      open_entry: await getOpenEntry(eq.id),
    })))
    navigate('/kiosk/confirm', { state: { contractor, code, items } })
  }

  const goTrip = async () => {
    const workTypes = await getActiveWorkTypes()
    navigate('/kiosk/trip', { state: { contractor, code, workTypes } })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-bold">{contractor.name}</div>
          <div className="text-sm text-gray-400">რეჟიმის არჩევა</div>
        </div>
        <div className="flex gap-4">
          <button onClick={goEquipment} className="flex-1 card p-6 text-center hover:shadow-md transition-shadow">
            <div className="text-4xl mb-2">🚜</div>
            <div className="font-semibold text-lg">ტექნიკა</div>
            <div className="text-xs text-gray-400 mt-1">საათები, დღიური</div>
          </button>
          <button onClick={goTrip} className="flex-1 card p-6 text-center hover:shadow-md transition-shadow">
            <div className="text-4xl mb-2">🚛</div>
            <div className="font-semibold text-lg">რეისი</div>
            <div className="text-xs text-gray-400 mt-1">ტვირთი, რეისები</div>
          </button>
        </div>
        <button onClick={() => navigate('/kiosk')} className="btn-gray mt-4">
          ← უკან
        </button>
      </div>
    </div>
  )
}
