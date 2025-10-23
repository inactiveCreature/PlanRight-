export type AddressLookupResult = {
  displayName: string
  street?: string
  houseNumber?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  lat?: string
  lon?: string
  propId?: string // NSW planning property id when available
  raw?: any
}

const NSW_ADDRESS_API_BASE =
  'https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address'

async function queryNswAddressApi(query: string) {
  const u = new URL(NSW_ADDRESS_API_BASE)
  u.searchParams.set('a', query)
  u.searchParams.set('noOfRecords', '10')
  const res = await fetch(u.toString(), { headers: { 'User-Agent': 'PlanRight/1.0' } })
  if (!res.ok) throw new Error(`NSW address API failed: ${res.status}`)
  return await res.json()
}

async function queryNominatim(query: string) {
  const u = new URL('https://nominatim.openstreetmap.org/search')
  u.searchParams.set('q', query)
  u.searchParams.set('format', 'json')
  u.searchParams.set('addressdetails', '1')
  u.searchParams.set('limit', '1')
  const res = await fetch(u.toString(), { headers: { 'User-Agent': 'PlanRight/1.0' } })
  if (!res.ok) throw new Error('Nominatim failed')
  return await res.json()
}

export async function lookupAddress(query: string): Promise<AddressLookupResult | null> {
  if (!query || !query.trim()) return null

  try {
    const json = await queryNswAddressApi(query)
    const candidates = json?.addresses || json?.results || json?.suggestions || json?.data || json
    const first = Array.isArray(candidates) ? candidates[0] : (candidates && candidates[0]) || null
    if (first) {
      const displayName =
        first.display ||
        first.formattedAddress ||
        first.fullAddress ||
        first.address ||
        JSON.stringify(first)
      const lat = first.latitude ?? first.lat ?? first.y ?? (first.location && first.location.lat)
      const lon = first.longitude ?? first.lon ?? first.x ?? (first.location && first.location.lon)
      const street = first.streetName ?? first.road ?? first.roadName ?? first.street
      const houseNumber = first.houseNumber ?? first.number
      const city = first.suburb ?? first.locality ?? first.town ?? first.city
      const state = first.state ?? first.stateName
      const postcode = first.postcode ?? first.postalCode
      const country = first.country ?? 'Australia'
      // Try to get the planning property id from common field names
      const propId =
        first.propId ??
        first.propID ??
        first.propertyId ??
        first.id ??
        first.pid ??
        first.property_id
      return {
        displayName,
        street,
        houseNumber,
        city,
        state,
        postcode,
        country,
        lat: lat ? String(lat) : undefined,
        lon: lon ? String(lon) : undefined,
        propId: propId ? String(propId) : undefined,
        raw: first,
      }
    }
  } catch {
    // NSW address API lookup failed, falling back to Nominatim
  }

  // 2) Fallback to Nominatim
  try {
    const nom = await queryNominatim(query)
    if (Array.isArray(nom) && nom.length > 0) {
      const item = nom[0]
      const addr = item.address || {}
      return {
        displayName: item.display_name,
        street: addr.road ?? addr.pedestrian ?? addr.cycleway,
        houseNumber: addr.house_number,
        city: addr.city ?? addr.town ?? addr.village ?? addr.hamlet,
        state: addr.state,
        postcode: addr.postcode,
        country: addr.country,
        lat: item.lat,
        lon: item.lon,
        raw: item,
      }
    }
  } catch {
    // Nominatim fallback failed
  }

  return null
}

export function isInAlbury(result: AddressLookupResult): boolean {
  if (!result) return false
  const combined =
    (result.displayName || '') + ' ' + (result.city || '') + ' ' + JSON.stringify(result.raw || {})
  const s = combined.toLowerCase()
  // Basic textual checks for Albury / Albury City
  if (s.includes('albury') || s.includes('albury city') || s.includes('albury local')) return true
  // If the NSW API returned local government / council fields in raw, try them
  const raw = result.raw || {}
  const lgaCandidates = [raw.lga, raw.localCouncil, raw.councilName, raw.LGA, raw.council]
  if (
    lgaCandidates.some((v: any) =>
      String(v || '')
        .toLowerCase()
        .includes('albury')
    )
  )
    return true
  return false
}
