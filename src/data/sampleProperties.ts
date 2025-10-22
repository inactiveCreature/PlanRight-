// Sample properties data for PlanRight wizard
export interface SampleProperty {
  id: string
  label: string
  lot_size_m2: number
  zone_text: string
  flags: string[]
}

export const SAMPLE_PROPERTIES: SampleProperty[] = [
  {
    id: '1',
    label: '482 Swift Street Albury 2640',
    lot_size_m2: 300,
    zone_text: 'MU1',
    flags: ['heritage_item'],
  },
  {
    id: '2',
    label: '585 Kiewa Street Albury 2640',
    lot_size_m2: 450,
    zone_text: 'R1',
    flags: ['heritage_item'],
  },
  {
    id: '3',
    label: '40 Maryland Way Albury 2640',
    lot_size_m2: 450,
    zone_text: 'R1',
    flags: ['heritage_item'],
  },
  {
    id: '4',
    label: '606 Wyse Street Albury 2640',
    lot_size_m2: 450,
    zone_text: 'R1',
    flags: ['heritage_item'],
  },
  {
    id: '5',
    label: '592 Roper Street Albury 2640',
    lot_size_m2: 450,
    zone_text: 'R1',
    flags: [],
  },
  {
    id: '6',
    label: '420 Kremur Street West Albury 2640',
    lot_size_m2: 450,
    zone_text: 'R1',
    flags: ['bushfire'],
  },
  {
    id: '7',
    label: '3/738 Lavis Street East Albury 2640',
    lot_size_m2: 450,
    zone_text: 'R3',
    flags: [],
  },
  {
    id: '8',
    label: '921 Currawong Street North Albury 2640',
    lot_size_m2: 450,
    zone_text: 'R1',
    flags: [],
  },
  {
    id: '9',
    label: '393 Perry Street Albury 2640',
    lot_size_m2: 450,
    zone_text: 'R1',
    flags: ['heritage_item'],
  },
  {
    id: '10',
    label: '648 Prune Street Springdale Heights 2641',
    lot_size_m2: 450,
    zone_text: 'R1',
    flags: ['bushfire'],
  },
]

// API function to get sample properties
export function list_sample_properties(): SampleProperty[] {
  return SAMPLE_PROPERTIES
}
