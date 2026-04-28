import { BadRequestException } from '@nestjs/common';
import { ALLOWED_FACILITIES } from './facilities';

const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):00$/;

// Ghana mobile numbers are 10 digits: 0[2-5]XXXXXXXX
// e.g. 0245655790 (MTN), 0201234567 (Vodafone), 0261234567 (AirtelTigo)
// International form: +233[2-5]XXXXXXXX
const GH_PHONE_PATTERN = /^(\+233|0)[2-5]\d{8}$/;

export function assertNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return value.trim();
}

export function assertEmail(value: unknown) {
  const email = assertNonEmptyString(value, 'email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('email must be a valid email address.');
  }

  return email.toLowerCase();
}

export function assertPassword(value: unknown) {
  const password = assertNonEmptyString(value, 'password');
  if (password.length < 8) {
    throw new BadRequestException('password must be at least 8 characters long.');
  }

  return password;
}

/** Validates a Ghanaian mobile number (local 0XX or international +233XX format). */
export function assertPhoneNumber(value: unknown) {
  const phone = assertNonEmptyString(value, 'phone');
  // Strip spaces for tolerance
  const stripped = phone.replace(/\s+/g, '');
  if (!GH_PHONE_PATTERN.test(stripped)) {
    throw new BadRequestException(
      'phone must be a valid Ghanaian number (e.g. 0241234567 or +233241234567).',
    );
  }
  return stripped;
}

export function assertTimeSlot(value: unknown, fieldName: string) {
  const time = assertNonEmptyString(value, fieldName);
  if (!TIME_SLOT_PATTERN.test(time)) {
    throw new BadRequestException(`${fieldName} must be in HH:00 format.`);
  }

  return time;
}

export function assertDateString(value: unknown, fieldName: string) {
  const date = assertNonEmptyString(value, fieldName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException(`${fieldName} must be in YYYY-MM-DD format.`);
  }

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName} is invalid.`);
  }

  // Reject bookings in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) {
    throw new BadRequestException(`${fieldName} must not be in the past.`);
  }

  return date;
}

export function getDayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    throw new BadRequestException('date is invalid.');
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map((part) => Number(part));
  return hours * 60 + minutes;
}

export function normalizeFacilities(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const facilities = value
    .filter((facility): facility is string => typeof facility === 'string')
    .map((facility) => facility.trim())
    .filter(Boolean);

  const mappedFacilities = facilities.map(fac => {
    const lower = fac.toLowerCase();
    if (lower === 'shower') return 'Showers';
    if (lower === 'changing room') return 'Changing Rooms';
    if (lower === 'washroom' || lower === 'washrooms') return 'Restrooms';
    
    // Attempt graceful case matching
    const exactMatch = ALLOWED_FACILITIES.find(f => f.toLowerCase() === lower);
    return exactMatch || fac;
  });

  const invalidFacilities = mappedFacilities.filter(
    (facility) => !ALLOWED_FACILITIES.includes(facility as (typeof ALLOWED_FACILITIES)[number]),
  );

  if (invalidFacilities.length > 0) {
    throw new BadRequestException(
      `Unknown facility value(s): ${invalidFacilities.join(', ')}.`,
    );
  }

  return Array.from(new Set(mappedFacilities));
}

export function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

export function validatePitchPayload(data: Record<string, unknown>) {
  const ownerId = assertNonEmptyString(data.ownerId, 'ownerId');
  const name = assertNonEmptyString(data.name, 'name');
  const location = assertNonEmptyString(data.location, 'location');
  const pricePerHour = Number(data.pricePerHour);

  if (!Number.isFinite(pricePerHour) || pricePerHour <= 0) {
    throw new BadRequestException('pricePerHour must be a positive number.');
  }

  const openingTime = assertTimeSlot(data.openingTime, 'openingTime');
  const closingTime = assertTimeSlot(data.closingTime, 'closingTime');

  if (timeToMinutes(closingTime) <= timeToMinutes(openingTime)) {
    throw new BadRequestException('closingTime must be after openingTime.');
  }

  const facilities = normalizeFacilities(data.facilities);

  return {
    ownerId,
    name,
    location,
    pricePerHour,
    openingTime,
    closingTime,
    facilities,
  };
}

export function validatePitchUpdatePayload(data: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) {
    payload.name = assertNonEmptyString(data.name, 'name');
  }

  if (data.location !== undefined) {
    payload.location = assertNonEmptyString(data.location, 'location');
  }

  if (data.pricePerHour !== undefined) {
    const pricePerHour = Number(data.pricePerHour);
    if (!Number.isFinite(pricePerHour) || pricePerHour <= 0) {
      throw new BadRequestException('pricePerHour must be a positive number.');
    }
    payload.pricePerHour = pricePerHour;
  }

  if (data.openingTime !== undefined) {
    payload.openingTime = assertTimeSlot(data.openingTime, 'openingTime');
  }

  if (data.closingTime !== undefined) {
    payload.closingTime = assertTimeSlot(data.closingTime, 'closingTime');
  }

  const openingTime =
    typeof payload.openingTime === 'string'
      ? payload.openingTime
      : typeof data.openingTime === 'string'
        ? data.openingTime
        : undefined;
  const closingTime =
    typeof payload.closingTime === 'string'
      ? payload.closingTime
      : typeof data.closingTime === 'string'
        ? data.closingTime
        : undefined;

  if (openingTime && closingTime && timeToMinutes(closingTime) <= timeToMinutes(openingTime)) {
    throw new BadRequestException('closingTime must be after openingTime.');
  }

  if (data.facilities !== undefined) {
    payload.facilities = normalizeFacilities(data.facilities);
  }

  if (data.imageUrl !== undefined) {
    // null means remove the image; a string means set it
    payload.imageUrl = data.imageUrl === null ? null : assertNonEmptyString(data.imageUrl, 'imageUrl');
  }

  return payload;
}

export function validateBookingPayload(data: Record<string, unknown>) {
  const pitchId = assertNonEmptyString(data.pitchId, 'pitchId');
  const name = assertNonEmptyString(data.name, 'name');
  const phone = assertPhoneNumber(data.phone);
  const date = assertDateString(data.date, 'date');
  const startTime = assertTimeSlot(data.startTime, 'startTime');

  return {
    pitchId,
    name,
    phone,
    date,
    startTime,
  };
}
