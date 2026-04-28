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
exports.PitchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const booking_utils_1 = require("../common/booking-utils");
const facilities_1 = require("../common/facilities");
let PitchesService = class PitchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(ownerId, data) {
        const payload = (0, booking_utils_1.validatePitchPayload)({ ...data, ownerId });
        return this.prisma.pitch.create({
            data: payload,
        });
    }
    async findAll(take = 50, skip = 0) {
        return this.prisma.pitch.findMany({
            where: {
                isVerified: true,
            },
            include: {
                _count: {
                    select: { reviews: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
    getFacilities() {
        return facilities_1.ALLOWED_FACILITIES;
    }
    async findMine(ownerId) {
        const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
        const isAdmin = user?.role === 'ADMIN';
        return this.prisma.pitch.findMany({
            where: isAdmin ? {} : { ownerId },
            include: {
                _count: {
                    select: { reviews: true, bookings: true },
                },
                owner: {
                    select: {
                        email: true,
                        phone: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const pitch = await this.prisma.pitch.findUnique({
            where: { id },
            include: {
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!pitch)
            throw new common_1.NotFoundException('Pitch not found');
        return pitch;
    }
    async addReview(pitchId, data) {
        const pitch = await this.prisma.pitch.findUnique({ where: { id: pitchId } });
        if (!pitch)
            throw new common_1.NotFoundException('Pitch not found');
        return this.prisma.review.create({
            data: {
                pitchId,
                name: data.name,
                rating: data.rating,
                comment: data.comment,
            },
        });
    }
    async getReviews(pitchId) {
        return this.prisma.review.findMany({
            where: { pitchId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async update(ownerId, id, data) {
        const pitch = await this.prisma.pitch.findUnique({
            where: { id },
        });
        if (!pitch) {
            throw new common_1.NotFoundException('Pitch not found');
        }
        if (pitch.ownerId !== ownerId) {
            throw new common_1.NotFoundException('Pitch not found');
        }
        const updates = (0, booking_utils_1.validatePitchUpdatePayload)(data);
        const mergedPayload = (0, booking_utils_1.validatePitchPayload)({
            ownerId: pitch.ownerId,
            name: updates.name ?? pitch.name,
            location: updates.location ?? pitch.location,
            pricePerHour: updates.pricePerHour ?? pitch.pricePerHour,
            openingTime: updates.openingTime ?? pitch.openingTime,
            closingTime: updates.closingTime ?? pitch.closingTime,
            facilities: updates.facilities ?? pitch.facilities,
        });
        return this.prisma.pitch.update({
            where: { id },
            data: mergedPayload,
        });
    }
    async remove(ownerId, id) {
        const pitch = await this.prisma.pitch.findUnique({
            where: { id },
        });
        if (!pitch || pitch.ownerId !== ownerId) {
            throw new common_1.NotFoundException('Pitch not found');
        }
        return this.prisma.$transaction([
            this.prisma.booking.deleteMany({ where: { pitchId: id } }),
            this.prisma.pitch.delete({ where: { id } }),
        ]);
    }
    async getAvailability(pitchId, dateStr) {
        const pitch = await this.prisma.pitch.findUnique({
            where: { id: pitchId },
        });
        if (!pitch) {
            throw new common_1.NotFoundException('Pitch not found');
        }
        const { start, end } = (0, booking_utils_1.getDayBounds)(dateStr);
        const bookings = await this.prisma.booking.findMany({
            where: {
                pitchId,
                date: { gte: start, lt: end },
                status: { in: ['CONFIRMED', 'PENDING'] },
            },
        });
        const startHour = parseInt(pitch.openingTime.split(':')[0]);
        const endHour = parseInt(pitch.closingTime.split(':')[0]);
        const slots = [];
        for (let i = startHour; i < endHour; i++) {
            const slotMinutes = i * 60;
            const time = (0, booking_utils_1.minutesToTime)(slotMinutes);
            const booking = bookings.find(b => {
                const bStart = (0, booking_utils_1.timeToMinutes)(b.startTime);
                const bEnd = (0, booking_utils_1.timeToMinutes)(b.endTime);
                return slotMinutes >= bStart && slotMinutes < bEnd;
            });
            slots.push({
                time,
                status: booking ? booking.status : 'AVAILABLE'
            });
        }
        return {
            date: dateStr,
            pitchId,
            slots,
        };
    }
    async verify(pitchId) {
        const pitch = await this.prisma.pitch.findUnique({ where: { id: pitchId } });
        if (!pitch)
            throw new common_1.NotFoundException('Pitch not found');
        return this.prisma.pitch.update({
            where: { id: pitchId },
            data: { isVerified: true },
        });
    }
    async getInsights(ownerId) {
        const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
        const isAdmin = user?.role === 'ADMIN';
        const pitches = await this.prisma.pitch.findMany({
            where: isAdmin ? {} : { ownerId },
            select: { id: true }
        });
        const pitchIds = pitches.map(p => p.id);
        const payments = await this.prisma.payment.findMany({
            where: {
                pitchId: { in: pitchIds },
                status: 'SUCCESS'
            },
            select: { amount: true }
        });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalBookings = await this.prisma.booking.count({
            where: {
                pitchId: { in: pitchIds },
                status: 'CONFIRMED'
            }
        });
        const bookings = await this.prisma.booking.findMany({
            where: {
                pitchId: { in: pitchIds },
                status: 'CONFIRMED'
            },
            select: { date: true }
        });
        const dayCounts = {};
        bookings.forEach(b => {
            const date = new Date(b.date);
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        const popularDay = Object.keys(dayCounts).length > 0
            ? Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]
            : 'No data';
        return {
            totalRevenue,
            totalBookings,
            popularDay,
            pitchCount: pitches.length
        };
    }
};
exports.PitchesService = PitchesService;
exports.PitchesService = PitchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PitchesService);
//# sourceMappingURL=pitches.service.js.map