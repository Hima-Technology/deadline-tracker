import { useEffect, useState } from 'react'

interface ToastProps {
  show: boolean
  message: string
  type?: 'loading' | 'success' | 'error'
}

export default function Toast({ show, message, type = 'loading' }: ToastProps) {
  const [visible, setVisible] = useState(false)

  // Hii inafanya ile animation ya kuteleza (Slide-in)
  useEffect(() => {
    if (show) {
      setTimeout(() => setVisible(true), 50) // Inaanza kuteleza baada ya milisekunde 50
    } else {
      setVisible(false)
    }
  }, [show])

  if (!show && !visible) return null

  const colorClasses = {
    loading: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  const iconClasses = {
    loading: 'text-cyan-500 animate-spin',
    success: 'text-green-500',
    error: 'text-red-500',
  }

  const icons = {
    loading: 'autorenew',
    success: 'check_circle',
    error: 'error',
  }

  return (
    // Hapa ndipo muonekano unateleza kutoka juu (translate-y--10 kwenda translate-y-0)
    <div 
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out transform ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
      }`}
    >
      <div className={`flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border ${colorClasses[type]}`}>
        <span className={`material-symbols-outlined text-[20px] ${iconClasses[type]}`}>
          {icons[type]}
        </span>
        <span className="font-mono text-sm font-semibold tracking-wide uppercase">
          {message}
        </span>
      </div>
    </div>
  )
}