"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const booking_utils_1 = require("../common/booking-utils");
let BookingsService = class BookingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const payload = (0, booking_utils_1.validateBookingPayload)(data);
        const { pitchId, startTime, date } = payload;
        const duration = data.duration || 1;
        const pitch = await this.prisma.pitch.findUnique({
            where: { id: pitchId },
        });
        if (!pitch) {
            throw new common_1.NotFoundException('Pitch not found');
        }
        const startMinutes = (0, booking_utils_1.timeToMinutes)(startTime);
        const endMinutes = startMinutes + (duration * 60);
        const endTime = (0, booking_utils_1.minutesToTime)(endMinutes);
        const openingMinutes = (0, booking_utils_1.timeToMinutes)(pitch.openingTime);
        const closingMinutes = (0, booking_utils_1.timeToMinutes)(pitch.closingTime);
        if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
            throw new common_1.BadRequestException('Booking extends outside of operating hours');
        }
        const { start, end } = (0, booking_utils_1.getDayBounds)(date);
        const existingBookings = await this.prisma.booking.findMany({
            where: {
                pitchId,
                date: { gte: start, lt: end },
                status: { in: ['CONFIRMED', 'PENDING'] },
            },
        });
        const isOverlap = existingBookings.some((b) => {
            const bStart = (0, booking_utils_1.timeToMinutes)(b.startTime);
            const bEnd = (0, booking_utils_1.timeToMinutes)(b.endTime);
            return startMinutes < bEnd && endMinutes > bStart;
        });
        if (isOverlap) {
            throw new common_1.ConflictException('The requested time slot overlaps with an existing booking');
        }
        return this.prisma.booking.create({
            data: {
                pitchId,
                name: payload.name,
                phone: payload.phone,
                email: data.email,
                paymentReference: data.paymentReference,
                date: new Date(`${date}T00:00:00`),
                startTime,
                endTime,
                status: 'PENDING',
            },
        });
    }
    async bulkCreate(data) {
        const { pitchId, name, phone, date, slots } = data;
        if (!Array.isArray(slots) || slots.length === 0) {
            throw new common_1.BadRequestException('slots must be a non-empty array.');
        }
        for (const slot of slots) {
            (0, booking_utils_1.validateBookingPayload)({ pitchId, name, phone, date, startTime: slot.startTime });
        }
        const pitch = await this.prisma.pitch.findUnique({ where: { id: pitchId } });
        if (!pitch)
            throw new common_1.NotFoundException('Pitch not found');
        const openingMinutes = (0, booking_utils_1.timeToMinutes)(pitch.openingTime);
        const closingMinutes = (0, booking_utils_1.timeToMinutes)(pitch.closingTime);
        const bookingsToCreate = slots.map((slot) => {
            const duration = slot.duration ?? 1;
            const startMinutes = (0, booking_utils_1.timeToMinutes)(slot.startTime);
            const endMinutes = startMinutes + duration * 60;
            if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
                throw new common_1.BadRequestException(`Slot ${slot.startTime} extends outside of operating hours.`);
            }
            return {
                startTime: slot.startTime,
                endTime: (0, booking_utils_1.minutesToTime)(endMinutes),
                startMinutes,
                endMinutes,
            };
        });
        for (let i = 0; i < bookingsToCreate.length; i++) {
            for (let j = i + 1; j < bookingsToCreate.length; j++) {
                const a = bookingsToCreate[i];
                const b = bookingsToCreate[j];
                if (a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes) {
                    throw new common_1.ConflictException(`Slots ${a.startTime} and ${b.startTime} overlap within the request.`);
                }
            }
        }
        const { start, end } = (0, booking_utils_1.getDayBounds)(date);
        const existing = await this.prisma.booking.findMany({
            where: {
                pitchId,
                date: { gte: start, lt: end },
                status: { in: ['CONFIRMED', 'PENDING'] },
            },
        });
        for (const toCreate of bookingsToCreate) {
            const conflict = existing.find((b) => {
                const bStart = (0, booking_utils_1.timeToMinutes)(b.startTime);
                const bEnd = (0, booking_utils_1.timeToMinutes)(b.endTime);
                return toCreate.startMinutes < bEnd && toCreate.endMinutes > bStart;
            });
            if (conflict) {
                throw new common_1.ConflictException(`Slot ${toCreate.startTime} overlaps with an existing booking.`);
            }
        }
        if (data.paymentReference) {
            const payment = await this.prisma.payment.findUnique({
                where: { reference: data.paymentReference },
            });
            if (!payment) {
                throw new common_1.BadRequestException(`Payment reference ${data.paymentReference} not found.`);
            }
        }
        return this.prisma.$transaction(bookingsToCreate.map((b) => this.prisma.booking.create({
            data: {
                pitchId,
                name,
                phone,
                email: data.email,
                paymentReference: data.paymentReference,
                date: new Date(`${date}T00:00:00`),
                startTime: b.startTime,
                endTime: b.endTime,
                status: 'PENDING',
            },
        })));
    }
    async findAllForOwner(ownerId) {
        return this.prisma.booking.findMany({
            where: {
                pitch: {
                    ownerId,
                },
            },
            include: {
                pitch: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
    }
    async updateStatus(ownerId, bookingId, status) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { pitch: true },
        });
        if (!booking || booking.pitch.ownerId !== ownerId) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status },
        });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map