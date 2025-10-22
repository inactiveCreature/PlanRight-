import { useEffect, useState } from 'react'
import { lookupAddress, AddressLookupResult, isInAlbury } from '../../services/addressService'
import { getPlanningAttributes, PlanningAttributes } from '../../services/planningService'

type Props = {
  placeholder?: string
  onSelect: (addr: AddressLookupResult & { planning?: PlanningAttributes }) => void
  className?: string
  initialValue?: string
}

export default function AddressField({
  placeholder = 'Type address...',
  onSelect,
  className,
  initialValue,
}: Props) {
  const [query, setQuery] = useState(initialValue || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<
    (AddressLookupResult & { planning?: PlanningAttributes }) | null
  >(null)

  // keep query in sync if parent provides an initial value (e.g. from store)
  useEffect(() => {
    // Only sync parent initialValue into the input when there's no selected result.
    // This prevents parent re-renders after onSelect from clobbering the user's typed text.
    if (!selected && initialValue !== undefined && initialValue !== null) {
      setQuery(initialValue)
    }
  }, [initialValue, selected])

  async function handleAutofill() {
    setError(null)
    setLoading(true)
    try {
      const addr = await lookupAddress(query)
      if (!addr) {
        setError('No address found.')
        return
      }
      if (!isInAlbury(addr)) {
        setError('Address is not in Albury City.')
        return
      }
      const lat = Number(addr.lat)
      const lon = Number(addr.lon)
      let planning
      try {
        planning = await getPlanningAttributes(
          lat || undefined,
          lon || undefined,
          (addr as any).propId
        )
      } catch (e) {
        console.warn('Planning attributes fetch failed', (e as Error).message)
      }

      const payload = { ...addr, planning }
      // Keep the user's typed input in the query field — do NOT overwrite query with displayName.
      setSelected(payload)
      // persist selection upward
      onSelect(payload)
    } catch (e: any) {
      setError(e?.message ?? 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  function handleEdit() {
    setSelected(null)
    setError(null)
    // Keep the current query so user can edit; do not clear it.
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Property Address
        <span className="text-red-500 ml-1">*</span>
      </label>

      <div className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              className={`w-full px-4 py-3 border rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error
                  ? 'border-red-300 bg-red-50 focus:ring-red-500'
                  : selected
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (selected) setSelected(null) // editing clears selected
              }}
              placeholder={placeholder}
              aria-label="Address input"
              disabled={loading}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            )}
            {selected && !loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <button
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto ${
              loading || !query.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md'
            }`}
            type="button"
            onClick={handleAutofill}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Searching...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {selected && (
        <div className="mt-4 border border-green-200 rounded-lg bg-green-50 p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="font-semibold text-slate-900">{selected.displayName}</div>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                {selected.street && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Street:</span>
                    <span>
                      {selected.street}
                      {selected.houseNumber ? ` ${selected.houseNumber}` : ''}
                    </span>
                  </div>
                )}
                {selected.city && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">City:</span>
                    <span>
                      {selected.city}
                      {selected.state ? `, ${selected.state}` : ''}
                      {selected.postcode ? ` ${selected.postcode}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="ml-4 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              onClick={handleEdit}
            >
              Edit
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex items-center gap-2 text-xs">
              {selected.planning ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-700 font-medium">
                    Planning attributes retrieved successfully
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-amber-700">No planning attributes available</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
