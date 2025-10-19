export type PlanningAttributes = {
  residentZone?: string | null;
  heritage?: boolean | null;
  conservationArea?: boolean | null;
  floodProne?: boolean | null;
  bushfireProne?: boolean | null;
  raw?: Record<string, any>;
};

const NSW_BASE = 'https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi';

async function fetchLot(propId: string) {
  const u = new URL(`${NSW_BASE}/lot`);
  u.searchParams.set('propId', propId);
  const res = await fetch(u.toString(), { headers: { 'User-Agent': 'PlanRight/1.0' } });
  if (!res.ok) throw new Error(`lot endpoint failed: ${res.status}`);
  return await res.json();
}

async function fetchBoundary(id: string) {
  const u = new URL(`${NSW_BASE}/boundary`);
  u.searchParams.set('Id', id);
  u.searchParams.set('type', 'lga');
  const res = await fetch(u.toString(), { headers: { 'User-Agent': 'PlanRight/1.0' } });
  if (!res.ok) throw new Error(`boundary endpoint failed: ${res.status}`);
  return await res.json();
}

async function fetchLayerIntersect(type: 'property' | 'point' = 'property', id: string, layers = 'epi') {
  const u = new URL(`${NSW_BASE}/layerintersect`);
  u.searchParams.set('type', type);
  u.searchParams.set('id', id);
  u.searchParams.set('layers', layers);
  const res = await fetch(u.toString(), { headers: { 'User-Agent': 'PlanRight/1.0' } });
  if (!res.ok) throw new Error(`layerintersect endpoint failed: ${res.status}`);
  return await res.json();
}

/** Parse the layerintersect payload (array or object) for the fields we need. */
function parseLayerIntersectPayload(payload: any) {
  const out: {
    lotSize?: number | null;
    zoneCode?: string | null;
    heritageArea: boolean;
    bushfireProne: boolean;
    foreshoreArea: boolean;
  } = {
    lotSize: null,
    zoneCode: null,
    heritageArea: false,
    bushfireProne: false,
    foreshoreArea: false,
  };

  // Normalize to an array of layer objects
  let layers: any[] = [];
  if (Array.isArray(payload)) layers = payload;
  else if (payload.layers) layers = payload.layers;
  else if (payload.results) layers = payload.results;
  else if (typeof payload === 'object') {
    // some responses put features/layers under different keys
    layers = Object.values(payload).filter(v => Array.isArray(v)).flat();
  }

  for (const layer of layers) {
    const name = String(layer.layerName || layer.name || '').toLowerCase();
    const results = Array.isArray(layer.results) ? layer.results : (Array.isArray(layer.features) ? layer.features : []);

    // Heritage detection: layer name or result keys contain "heritage"
    if (!out.heritageArea) {
      if (name.includes('heritage') || results.some((r: any) =>
        Object.keys(r).some(k => k.toLowerCase().includes('heritage') || k.toLowerCase().includes('heritage type'))
      )) {
        out.heritageArea = true;
      }
    }

    // Bushfire detection: layer name or result text includes bushfire
    if (!out.bushfireProne) {
      if (name.includes('bushfire') || results.some((r: any) =>
        JSON.stringify(r).toLowerCase().includes('bushfire prone') || JSON.stringify(r).toLowerCase().includes('bushfire')
      )) {
        out.bushfireProne = true;
      }
    }

    // Foreshore / watercourses detection
    if (!out.foreshoreArea) {
      if (name.includes('watercourses') || name.includes('watercourse') || name.includes('foreshore')) {
        out.foreshoreArea = true;
      } else if (results.some((r: any) =>
        JSON.stringify(r).toLowerCase().includes('watercourse') || JSON.stringify(r).toLowerCase().includes('foreshore')
      )) {
        out.foreshoreArea = true;
      }
    }

    // Lot size extraction
    if (out.lotSize === null && (name.includes('lot size') || name.includes('lot-size') || name.includes('lotarea') || name.includes('lot size map'))) {
      const first = results[0] || {};
      const candidate = first['Lot Size'] ?? first['LotSize'] ?? first['title'] ?? first['lotSize'] ?? first['LotSize(m2)'];
      if (typeof candidate === 'number') out.lotSize = candidate;
      else if (typeof candidate === 'string') {
        const m = candidate.replace(/[^\d.]/g, '');
        out.lotSize = m ? Number(m) : null;
      }
    }

    // Zone extraction: prefer explicit Zone field, fallback to extracting code from title text (e.g. "R1: General Residential")
    if (!out.zoneCode && (name.includes('land zoning') || name.includes('zoning') || name.includes('zone'))) {
      const first = results[0] || {};
      const zoneField = first['Zone'] ?? first['zone'] ?? first['Zoning'] ?? first['title'];
      if (typeof zoneField === 'string') {
        // try to extract a code like R1, RU5, IN1, etc.
        const m = zoneField.match(/([A-Z]{1,3}\d{1,2})/);
        out.zoneCode = m ? m[1] : zoneField;
      } else if (typeof zoneField === 'object' && zoneField !== null) {
        out.zoneCode = String(zoneField);
      }
    }
  }

  // Ensure booleans default to false (already set), ensure lotSize/zoneCode null -> leave as null
  return out;
}

/*
  getPlanningAttributes:
   - prefer propId (from address lookup). If available call lot and layerintersect.
   - fallback: return raw empty results and indicate not-in-Albury via heuristics if possible.
*/
export async function getPlanningAttributes(lat?: number, lon?: number, propId?: string): Promise<PlanningAttributes> {
  const result: PlanningAttributes = { raw: {} };

  try {
    if (!propId) {
      result.raw!.note = 'No propId supplied; lot/layerintersect lookup skipped';
      return result;
    }

    // 1) fetch lot detail
    try {
      const lot = await fetchLot(propId);
      result.raw!.lot = lot;
      const lotAttrs = lot?.lot || lot?.data || lot;
      result.residentZone = lotAttrs?.zone || lotAttrs?.ZONING || lotAttrs?.lepZone || lotAttrs?.zoneName || null;

      const councilFields = [
        lotAttrs?.lga, lotAttrs?.council, lotAttrs?.councilName, lotAttrs?.localCouncil
      ];
      const isAlbury = councilFields.some((v: any) => String(v || '').toLowerCase().includes('albury'));
      result.raw!.isAlbury = isAlbury;
      if (!isAlbury) result.raw!.note = 'Lot does not indicate Albury LGA';
    } catch (err) {
      result.raw!.lotError = (err as Error).message;
    }

    // 2) fetch layer intersect (epi) for additional planning attributes
    try {
      const li = await fetchLayerIntersect('property', propId, 'epi');
      result.raw!.layerintersect = li;

      // Use the new parser to extract the values
      const parsed = parseLayerIntersectPayload(li);

      // Map parsed values into result
      if (parsed.lotSize != null) result.raw!.lotSize = parsed.lotSize;
      if (parsed.zoneCode) result.residentZone = parsed.zoneCode;
      result.heritage = parsed.heritageArea;
      // bushfire and foreshore booleans default to false if not present
      result.bushfireProne = parsed.bushfireProne;
      // foreshore stored under conservationArea or separate flag as you prefer
      result.conservationArea = parsed.foreshoreArea; // or set a dedicated field in PlanningAttributes if desired

    } catch (err) {
      result.raw!.layerIntersectError = (err as Error).message;
      // ensure booleans are explicit false when layerintersect fails
      result.heritage = false;
      result.bushfireProne = false;
      result.conservationArea = false;
    }
  } catch (err) {
    result.raw!.error = (err as Error).message;
  }

  // Ensure booleans are not undefined
  if (result.heritage === undefined) result.heritage = false;
  if (result.bushfireProne === undefined) result.bushfireProne = false;
  if (result.conservationArea === undefined) result.conservationArea = false;

  return result;
}