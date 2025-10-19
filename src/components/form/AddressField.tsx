import { useEffect, useState } from 'react';
import { lookupAddress, AddressLookupResult, isInAlbury } from '../../services/addressService';
import { getPlanningAttributes, PlanningAttributes } from '../../services/planningService';

type Props = {
  placeholder?: string;
  onSelect: (addr: AddressLookupResult & { planning?: PlanningAttributes }) => void;
  className?: string;
  initialValue?: string;
};

export default function AddressField({ placeholder = 'Type address...', onSelect, className, initialValue }: Props) {
  const [query, setQuery] = useState(initialValue || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AddressLookupResult & { planning?: PlanningAttributes } | null>(null);

  // keep query in sync if parent provides an initial value (e.g. from store)
  useEffect(() => {
    // Only sync parent initialValue into the input when there's no selected result.
    // This prevents parent re-renders after onSelect from clobbering the user's typed text.
    if (!selected && initialValue !== undefined && initialValue !== null) {
      setQuery(initialValue);
    }
  }, [initialValue, selected]);

  async function handleAutofill() {
    setError(null);
    setLoading(true);
    try {
      const addr = await lookupAddress(query);
      if (!addr) {
        setError('No address found.');
        return;
      }
      if (!isInAlbury(addr)) {
        setError('Address is not in Albury City.');
        return;
      }
      const lat = Number(addr.lat);
      const lon = Number(addr.lon);
      let planning;
      try {
        planning = await getPlanningAttributes(lat || undefined, lon || undefined, (addr as any).propId);
      } catch (e) {
        console.warn('Planning attributes fetch failed', (e as Error).message);
      }

      const payload = { ...addr, planning };
      // Keep the user's typed input in the query field — do NOT overwrite query with displayName.
      setSelected(payload);
      // persist selection upward
      onSelect(payload);
    } catch (e: any) {
      setError(e?.message ?? 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit() {
    setSelected(null);
    setError(null);
    // Keep the current query so user can edit; do not clear it.
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700">Address </label>

      <div className="mt-1 flex items-start">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) setSelected(null); // editing clears selected
          }}
          placeholder={placeholder}
          aria-label="Address input"
        />
        <button
          className="ml-2 px-3 py-2 bg-sky-600 text-white rounded disabled:opacity-50"
          type="button"
          onClick={handleAutofill}
          disabled={loading || !query.trim()}
        >
          {loading ? 'Searching…' : 'Autofill'}
        </button>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {selected && (
        <div className="mt-3 border rounded p-3 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{selected.displayName}</div>
              <div className="text-sm text-gray-600 mt-1">
                {selected.street && <div>{selected.street}{selected.houseNumber ? ` ${selected.houseNumber}` : ''}</div>}
                {selected.city && <div>{selected.city}{selected.state ? `, ${selected.state}` : ''}{selected.postcode ? ` ${selected.postcode}` : ''}</div>}
              </div>
            </div>
            <div className="ml-4">
              <button
                type="button"
                className="text-sm text-sky-600 hover:underline"
                onClick={handleEdit}
              >
                Edit
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {selected.planning ? 'Planning attributes retrieved' : 'No planning attributes'}
          </div>
        </div>
      )}
    </div>
  );
}