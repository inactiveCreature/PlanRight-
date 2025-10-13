import React, { useState, useEffect, useRef } from 'react'

interface ResetConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (keepRole: boolean, keepChat: boolean) => void
}

export default function ResetConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm 
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        role="dialog"
        aria-labelledby="reset-modal-title"
        aria-describedby="reset-modal-description"
      >
        <div className="p-6">
          <h2 id="reset-modal-title" className="text-lg font-semibold text-slate-900 mb-2">
            Reset all inputs?
          </h2>
          <p id="reset-modal-description" className="text-sm text-slate-600 mb-6">
            This clears all fields and results. You can undo for 5 seconds.
          </p>

          <div className="space-y-4 mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={keepRole}
                onChange={(e) => setKeepRole(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700">Keep my role</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={keepChat}
                onChange={(e) => setKeepChat(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700">Keep chat history</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              ref={firstFocusableRef}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Reset all
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
