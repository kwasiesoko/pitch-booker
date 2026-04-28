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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
const booking_utils_1 = require("../common/booking-utils");
function toJsonValue(meta) {
    return meta;
}
let PaymentsService = class PaymentsService {
    prisma;
    paymentQueue;
    constructor(prisma, paymentQueue) {
        this.prisma = prisma;
        this.paymentQueue = paymentQueue;
    }
    async initiate(dto) {
        const pitch = await this.prisma.pitch.findUnique({ where: { id: dto.pitchId } });
        if (!pitch)
            throw new common_1.NotFoundException('Pitch not found');
        const openingMinutes = (0, booking_utils_1.timeToMinutes)(pitch.openingTime);
        const closingMinutes = (0, booking_utils_1.timeToMinutes)(pitch.closingTime);
        const slotsToBook = dto.slots.map((slot) => {
            const duration = slot.duration ?? 1;
            const startMinutes = (0, booking_utils_1.timeToMinutes)(slot.startTime);
            const endMinutes = startMinutes + duration * 60;
            if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
                throw new common_1.BadRequestException(`Slot ${slot.startTime} is outside operating hours.`);
            }
            return {
                startTime: slot.startTime,
                endTime: (0, booking_utils_1.minutesToTime)(endMinutes),
                startMinutes,
                endMinutes,
            };
        });
        const { start, end } = (0, booking_utils_1.getDayBounds)(dto.date);
        const existing = await this.prisma.booking.findMany({
            where: {
                pitchId: dto.pitchId,
                date: { gte: start, lt: end },
                status: { in: ['CONFIRMED', 'PENDING'] },
            },
        });
        for (const toCreate of slotsToBook) {
            const conflict = existing.find((b) => {
                const bStart = (0, booking_utils_1.timeToMinutes)(b.startTime);
                const bEnd = (0, booking_utils_1.timeToMinutes)(b.endTime);
                return toCreate.startMinutes < bEnd && toCreate.endMinutes > bStart;
            });
            if (conflict) {
                throw new common_1.ConflictException(`Slot ${toCreate.startTime} is already reserved or pending payment.`);
            }
        }
        const existingPayment = await this.prisma.payment.findUnique({
            where: { reference: dto.reference },
        });
        if (existingPayment)
            return existingPayment;
        const [payment] = await this.prisma.$transaction([
            this.prisma.payment.create({
                data: {
                    reference: dto.reference,
                    amount: dto.amount,
                    email: dto.email,
                    phone: dto.phone,
                    name: dto.name,
                    pitchId: dto.pitchId,
                    date: dto.date,
                    slots: dto.slots,
                    status: 'PENDING',
                },
            }),
            ...slotsToBook.map((s) => this.prisma.booking.create({
                data: {
                    pitchId: dto.pitchId,
                    name: dto.name || 'Guest',
                    phone: dto.phone || '',
                    email: dto.email,
                    paymentReference: dto.reference,
                    date: new Date(`${dto.date}T00:00:00`),
                    startTime: s.startTime,
                    endTime: s.endTime,
                    status: 'PENDING',
                },
            })),
        ]);
        await this.paymentQueue.add('verify', { reference: payment.reference }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
        });
        return payment;
    }
    async getStatus(reference) {
        const payment = await this.prisma.payment.findUnique({
            where: { reference },
            include: { bookings: true },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async markSuccessAndBook(reference, meta) {
        const payment = await this.prisma.payment.findUnique({
            where: { reference },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (payment.status === 'SUCCESS')
            return payment;
        const [updatedPayment] = await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { reference },
                data: { status: 'SUCCESS', meta: toJsonValue(meta) },
            }),
            this.prisma.booking.updateMany({
                where: { paymentReference: reference },
                data: { status: 'CONFIRMED' },
            }),
        ]);
        return updatedPayment;
    }
    async markFailed(reference, meta) {
        const [updatedPayment] = await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { reference },
                data: { status: 'FAILED', meta: toJsonValue(meta) },
            }),
            this.prisma.booking.updateMany({
                where: { paymentReference: reference },
                data: { status: 'CANCELLED' },
            }),
        ]);
        return updatedPayment;
    }
    async findAllByOwner(ownerId) {
        return this.prisma.payment.findMany({
            where: {
                pitch: {
                    ownerId: ownerId,
                },
            },
            include: {
                pitch: {
                    select: {
                        name: true,
                        location: true,
                    },
                },
                bookings: {
                    select: {
                        startTime: true,
                        endTime: true,
                        date: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('payment-verification')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map