export const FACILITY_LABELS = [
  'Parking',
  'Floodlights',
  'Changing Rooms',
  'Showers',
  'Seating',
  'Restrooms',
  'Security',
  'Refreshments',
  'Artificial Turf',
  'Spectator Stands',
] as const;

export type FacilityLabel = (typeof FACILITY_LABELS)[number];
