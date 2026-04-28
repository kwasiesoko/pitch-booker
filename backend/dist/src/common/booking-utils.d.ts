export declare function assertNonEmptyString(value: unknown, fieldName: string): string;
export declare function assertEmail(value: unknown): string;
export declare function assertPassword(value: unknown): string;
export declare function assertPhoneNumber(value: unknown): string;
export declare function assertTimeSlot(value: unknown, fieldName: string): string;
export declare function assertDateString(value: unknown, fieldName: string): string;
export declare function getDayBounds(dateStr: string): {
    start: Date;
    end: Date;
};
export declare function timeToMinutes(time: string): number;
export declare function normalizeFacilities(value: unknown): string[];
export declare function minutesToTime(minutes: number): string;
export declare function validatePitchPayload(data: Record<string, unknown>): {
    ownerId: string;
    name: string;
    location: string;
    pricePerHour: number;
    openingTime: string;
    closingTime: string;
    facilities: string[];
};
export declare function validatePitchUpdatePayload(data: Record<string, unknown>): Record<string, unknown>;
export declare function validateBookingPayload(data: Record<string, unknown>): {
    pitchId: string;
    name: string;
    phone: string;
    date: string;
    startTime: string;
};
