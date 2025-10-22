import { useState, useEffect, useRef } from 'react'

interface ResetConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (keepRole: boolean, keepChat: boolean) => void
}

export default function ResetConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: ResetConfirmationModalProps) {
  const [keepRole, setKeepRole] = useState(true)
  const [keepChat, setKeepChat] = useState(true)
  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)

  // Focus management
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus()
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    if (!modal) return

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(keepRole, keepChat)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="reset-modal-title"
        aria-describedby="reset-modal-description"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2 id="reset-modal-title" className="text-xl font-bold text-slate-900">
                Reset All Inputs?
              </h2>
              <p id="reset-modal-description" className="text-sm text-slate-600 mt-1">
                This action cannot be undone easily
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Warning</p>
                <p className="text-sm text-amber-700 mt-1">
                  This will clear all form fields and results. You can undo this action for 5
                  seconds after confirming.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              What would you like to keep?
            </h3>

            <label className="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors duration-200">
              <input
                type="checkbox"
                checked={keepRole}
                onChange={(e) => setKeepRole(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-slate-700">Keep my role</span>
                <p className="text-xs text-slate-500 mt-1">
                  Preserve your current user role selection
                </p>
              </div>
            </label>

            <label className="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors duration-200">
              <input
                type="checkbox"
                checked={keepChat}
                onChange={(e) => setKeepChat(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-slate-700">Keep chat history</span>
                <p className="text-xs text-slate-500 mt-1">
                  Preserve your conversation with the assistant
                </p>
              </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              ref={firstFocusableRef}
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 text-sm font-semibold text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
