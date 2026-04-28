"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNonEmptyString = assertNonEmptyString;
exports.assertEmail = assertEmail;
exports.assertPassword = assertPassword;
exports.assertPhoneNumber = assertPhoneNumber;
exports.assertTimeSlot = assertTimeSlot;
exports.assertDateString = assertDateString;
exports.getDayBounds = getDayBounds;
exports.timeToMinutes = timeToMinutes;
exports.normalizeFacilities = normalizeFacilities;
exports.minutesToTime = minutesToTime;
exports.validatePitchPayload = validatePitchPayload;
exports.validatePitchUpdatePayload = validatePitchUpdatePayload;
exports.validateBookingPayload = validateBookingPayload;
const common_1 = require("@nestjs/common");
const facilities_1 = require("./facilities");
const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):00$/;
const GH_PHONE_PATTERN = /^(\+233|0)[2-5]\d{8}$/;
function assertNonEmptyString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new common_1.BadRequestException(`${fieldName} is required.`);
    }
    return value.trim();
}
function assertEmail(value) {
    const email = assertNonEmptyString(value, 'email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new common_1.BadRequestException('email must be a valid email address.');
    }
    return email.toLowerCase();
}
function assertPassword(value) {
    const password = assertNonEmptyString(value, 'password');
    if (password.length < 8) {
        throw new common_1.BadRequestException('password must be at least 8 characters long.');
    }
    return password;
}
function assertPhoneNumber(value) {
    const phone = assertNonEmptyString(value, 'phone');
    const stripped = phone.replace(/\s+/g, '');
    if (!GH_PHONE_PATTERN.test(stripped)) {
        throw new common_1.BadRequestException('phone must be a valid Ghanaian number (e.g. 0241234567 or +233241234567).');
    }
    return stripped;
}
function assertTimeSlot(value, fieldName) {
    const time = assertNonEmptyString(value, fieldName);
    if (!TIME_SLOT_PATTERN.test(time)) {
        throw new common_1.BadRequestException(`${fieldName} must be in HH:00 format.`);
    }
    return time;
}
function assertDateString(value, fieldName) {
    const date = assertNonEmptyString(value, fieldName);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new common_1.BadRequestException(`${fieldName} must be in YYYY-MM-DD format.`);
    }
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        throw new common_1.BadRequestException(`${fieldName} is invalid.`);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed < today) {
        throw new common_1.BadRequestException(`${fieldName} must not be in the past.`);
    }
    return date;
}
function getDayBounds(dateStr) {
    const start = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(start.getTime())) {
        throw new common_1.BadRequestException('date is invalid.');
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
}
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map((part) => Number(part));
    return hours * 60 + minutes;
}
function normalizeFacilities(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    const facilities = value
        .filter((facility) => typeof facility === 'string')
        .map((facility) => facility.trim())
        .filter(Boolean);
    const mappedFacilities = facilities.map(fac => {
        const lower = fac.toLowerCase();
        if (lower === 'shower')
            return 'Showers';
        if (lower === 'changing room')
            return 'Changing Rooms';
        if (lower === 'washroom' || lower === 'washrooms')
            return 'Restrooms';
        const exactMatch = facilities_1.ALLOWED_FACILITIES.find(f => f.toLowerCase() === lower);
        return exactMatch || fac;
    });
    const invalidFacilities = mappedFacilities.filter((facility) => !facilities_1.ALLOWED_FACILITIES.includes(facility));
    if (invalidFacilities.length > 0) {
        throw new common_1.BadRequestException(`Unknown facility value(s): ${invalidFacilities.join(', ')}.`);
    }
    return Array.from(new Set(mappedFacilities));
}
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}
function validatePitchPayload(data) {
    const ownerId = assertNonEmptyString(data.ownerId, 'ownerId');
    const name = assertNonEmptyString(data.name, 'name');
    const location = assertNonEmptyString(data.location, 'location');
    const pricePerHour = Number(data.pricePerHour);
    if (!Number.isFinite(pricePerHour) || pricePerHour <= 0) {
        throw new common_1.BadRequestException('pricePerHour must be a positive number.');
    }
    const openingTime = assertTimeSlot(data.openingTime, 'openingTime');
    const closingTime = assertTimeSlot(data.closingTime, 'closingTime');
    if (timeToMinutes(closingTime) <= timeToMinutes(openingTime)) {
        throw new common_1.BadRequestException('closingTime must be after openingTime.');
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
function validatePitchUpdatePayload(data) {
    const payload = {};
    if (data.name !== undefined) {
        payload.name = assertNonEmptyString(data.name, 'name');
    }
    if (data.location !== undefined) {
        payload.location = assertNonEmptyString(data.location, 'location');
    }
    if (data.pricePerHour !== undefined) {
        const pricePerHour = Number(data.pricePerHour);
        if (!Number.isFinite(pricePerHour) || pricePerHour <= 0) {
            throw new common_1.BadRequestException('pricePerHour must be a positive number.');
        }
        payload.pricePerHour = pricePerHour;
    }
    if (data.openingTime !== undefined) {
        payload.openingTime = assertTimeSlot(data.openingTime, 'openingTime');
    }
    if (data.closingTime !== undefined) {
        payload.closingTime = assertTimeSlot(data.closingTime, 'closingTime');
    }
    const openingTime = typeof payload.openingTime === 'string'
        ? payload.openingTime
        : typeof data.openingTime === 'string'
            ? data.openingTime
            : undefined;
    const closingTime = typeof payload.closingTime === 'string'
        ? payload.closingTime
        : typeof data.closingTime === 'string'
            ? data.closingTime
            : undefined;
    if (openingTime && closingTime && timeToMinutes(closingTime) <= timeToMinutes(openingTime)) {
        throw new common_1.BadRequestException('closingTime must be after openingTime.');
    }
    if (data.facilities !== undefined) {
        payload.facilities = normalizeFacilities(data.facilities);
    }
    if (data.imageUrl !== undefined) {
        payload.imageUrl = data.imageUrl === null ? null : assertNonEmptyString(data.imageUrl, 'imageUrl');
    }
    return payload;
}
function validateBookingPayload(data) {
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
//# sourceMappingURL=booking-utils.js.map