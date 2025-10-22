import { usePlanRightStore } from '../store'
import type { StepId } from '../wizard/steps'

interface StepperProps {
  steps: { id: StepId; title: string }[]
  current: number
  onJump: (i: number) => void
}

/** Enhanced vertical stepper for the left column with truthful step completion. */
export default function Stepper({ steps, current, onJump }: StepperProps) {
  const getStepStatus = usePlanRightStore((state) => state.getStepStatus)

  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const stepStatus = getStepStatus(s.id)
        const isActive = i === current
        const isClickable = stepStatus === 'complete' || i <= current

        return (
          <li key={s.id}>
            <button
              onClick={() => isClickable && onJump(i)}
              disabled={!isClickable}
              className={`w-full text-left px-4 py-3 rounded-xl border flex items-center gap-3 transition-all duration-200 ${
                isActive
                  ? 'border-blue-400 bg-blue-50 text-blue-800 shadow-sm ring-2 ring-blue-100'
                  : stepStatus === 'complete'
                    ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100 hover:border-green-300'
                    : !isClickable
                      ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border transition-all duration-200 ${
                  stepStatus === 'complete'
                    ? 'bg-green-500 text-white border-green-500'
                    : isActive
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {stepStatus === 'complete' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{s.title}</div>
                {stepStatus === 'complete' && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Complete
                  </div>
                )}
                {!isClickable && stepStatus === 'todo' && (
                  <div className="text-xs text-slate-500">To do</div>
                )}
                {isActive && <div className="text-xs text-blue-600 font-medium">Current step</div>}
              </div>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
