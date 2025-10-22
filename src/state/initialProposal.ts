import type { Proposal } from '../types'

export const INITIAL_PROPOSAL: Proposal = {
  property: {
    id: '',
    lot_size_m2: '',
    zone_text: 'R1',
    frontage_m: '',
    corner_lot_bool: false,
    easement_bool: false,
  },
  structure: { type: 'shed' },
  dimensions: { length_m: '', width_m: '', height_m: '', area_m2: '' },
  location: {
    setback_front_m: '',
    setback_side_m: '',
    setback_rear_m: '',
    behind_building_line_bool: false,
  },
  siting: {
    on_easement_bool: false,
    over_sewer_bool: false,
    attached_to_dwelling_bool: false,
  },
  context: {
    heritage_item_bool: false,
    conservation_area_bool: false,
    flood_prone_bool: false,
    bushfire_bool: false,
  },
}
