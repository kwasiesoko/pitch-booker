export const ALLOWED_FACILITIES = [
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

export type AllowedFacility = (typeof ALLOWED_FACILITIES)[number];
