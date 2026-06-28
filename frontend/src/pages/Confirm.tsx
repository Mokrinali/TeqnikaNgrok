import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Toast from '../components/Toast'
import { recordEntry, recordExit } from '../api/logs'
import type { Contractor, EquipmentKioskItem, EquipmentLog } from '../types'

export default function Confirm() {
  const { state } = useLocation() as { state: { contractor: Contractor; code: string; items: EquipmentKioskItem[] } }
  const navigate = useNavigate()
  const [items, setItems] = useState(state?.items || [])
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState<number | null>(null)
  const [cameraTarget, setCameraTarget] = useState<{ equipmentId: number; logId?: number; type: 'entry' | 'exit' } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  if (!state?.contractor) { navigate('/kiosk'); return null }
  const { contractor, code } = state

  const openCamera = async (equipmentId: number, type: 'entry' | 'exit', logId?: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setCameraTarget({ equipmentId, logId, type })
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 100)
    } catch {
      await doRecord(type, equipmentId, logId, null)
    }
  }

  const capturePhoto = (): string | null => {
    if (!videoRef.current) return null
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraTarget(null)
  }

  const handleCapture = async () => {
    const photo = capturePhoto()
    const { equipmentId, logId, type } = cameraTarget!
    closeCamera()
    await doRecord(type, equipmentId, logId, photo)
  }

  const doRecord = async (type: 'entry' | 'exit', equipmentId: number, logId: number | undefined, photo: string | null) => {
    setLoading(equipmentId)
    try {
      if (type === 'entry') {
        await recordEntry({ equipment_id: equipmentId, contractor_id: contractor.id, verification_code: code, photo_base64: photo })
        setToast({ msg: 'შემოსვლა დაფიქსირდა ✓', type: 'success' })
      } else {
        await recordExit({ log_id: logId!, photo_base64: photo })
        setToast({ msg: 'გასვლა დაფიქსირდა ✓', type: 'success' })
      }
      setTimeout(() => navigate('/kiosk'), 1500)
    } catch (e: any) {
      setToast({ msg: e.message, type: 'error' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-sm mx-auto">
        <div className="mb-4">
          <div className="text-xl font-bold">{contractor.name}</div>
          <div className="text-sm text-gray-400">ტექნიკის სია</div>
        </div>

        <div className="space-y-3">
          {items.map(({ equipment: eq, open_entry }) => (
            <div key={eq.id} className={open_entry ? 'eq-card-open' : 'eq-card'}>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{eq.name}</div>
                {eq.plate_number && <div className="text-xs text-gray-400">{eq.plate_number}</div>}
                <div className="text-xs text-gray-400">{eq.daily_rate} ₾/დღე</div>
                {open_entry && (
                  <div className="text-xs text-[#FF9F0A] font-medium mt-0.5">
                    შემოვიდა {new Date(open_entry.entry_timestamp).toLocaleTimeString('ka', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <button
                onClick={() => openCamera(eq.id, open_entry ? 'exit' : 'entry', open_entry?.id)}
                disabled={loading === eq.id}
                className={`px-4 py-2 rounded-[12px] text-sm font-semibold text-white shrink-0 transition-all active:scale-95 ${
                  open_entry ? 'bg-[#FF3B30]' : 'bg-[#34C759]'
                }`}
              >
                {loading === eq.id ? '...' : open_entry ? 'გასვლა' : 'შემოსვლა'}
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/kiosk')} className="btn-gray mt-6">
          ← უკან
        </button>
      </div>

      {cameraTarget && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
          <div className="p-4 flex gap-3">
            <button onClick={closeCamera} className="flex-1 py-4 bg-white/20 text-white rounded-[14px] font-semibold">
              გაუქმება
            </button>
            <button onClick={handleCapture} className="flex-1 py-4 bg-white text-black rounded-[14px] font-bold">
              📷 გადაღება
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
