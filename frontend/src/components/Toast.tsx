import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const bg = type === 'success' ? 'bg-[#34C759]' : 'bg-[#FF3B30]'

  return (
    <div className={`fixed top-4 right-4 z-50 ${bg} text-white px-5 py-3 rounded-[14px] shadow-lg max-w-sm text-sm font-medium`}>
      {message}
    </div>
  )
}
