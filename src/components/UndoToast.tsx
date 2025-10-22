import { useEffect, useRef, useState } from 'react'

interface UndoToastProps {
  isVisible: boolean
  onUndo: () => void
  onDismiss: () => void
  duration?: number
}

export default function UndoToast({
  isVisible,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoToastProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const toastRef = useRef<HTMLDivElement>(null)
  const [timeLeft, setTimeLeft] = useState(duration / 1000)

  useEffect(() => {
    if (isVisible) {
      // Auto-dismiss after duration
      timeoutRef.current = setTimeout(() => {
        onDismiss()
      }, duration)

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Announce to screen readers
      if (toastRef.current) {
        toastRef.current.setAttribute('aria-live', 'polite')
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        clearInterval(countdownInterval)
      }
    } else {
      setTimeLeft(duration / 1000)
    }
  }, [isVisible, duration, onDismiss])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in">
      <div
        ref={toastRef}
        className="bg-white border border-slate-200 rounded-xl shadow-xl px-6 py-4 flex items-center gap-4 min-w-[320px] max-w-md"
        role="alert"
        aria-live="polite"
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 mb-1">Form reset successfully</p>
          <p className="text-xs text-slate-600">
            You can undo this action for {timeLeft} more seconds
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Undo
          </button>
          <button
            onClick={onDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
