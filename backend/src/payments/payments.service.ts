import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { 
  getDayBounds, 
  timeToMinutes, 
  minutesToTime 
} from '../common/booking-utils';

export interface InitiatePaymentDto {
  reference: string;
  amount: number;
  email: string;
  phone: string;
  name: string;
  pitchId: string;
  date: string;
  slots: Array<{ startTime: string; duration?: number }>;
}

function toJsonValue(meta: Record<string, unknown>): Prisma.InputJsonValue {
  return meta as Prisma.InputJsonValue;
}

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('payment-verification') private paymentQueue: Queue,
  ) {}

  /**
   * Called immediately after customer completes Paystack popup.
   * Checks conflicts, locks slots as PENDING bookings, and creates a Payment record.
   */
  async initiate(dto: InitiatePaymentDto) {
    // 1. Check pitch and calculate slot times
    const pitch = await this.prisma.pitch.findUnique({ where: { id: dto.pitchId } });
    if (!pitch) throw new NotFoundException('Pitch not found');

    const openingMinutes = timeToMinutes(pitch.openingTime);
    const closingMinutes = timeToMinutes(pitch.closingTime);

    const slotsToBook = dto.slots.map((slot) => {
      const duration = slot.duration ?? 1;
      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = startMinutes + duration * 60;

      if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
        throw new BadRequestException(`Slot ${slot.startTime} is outside operating hours.`);
      }

      return {
        startTime: slot.startTime,
        endTime: minutesToTime(endMinutes),
        startMinutes,
        endMinutes,
      };
    });

    // 2. Check for overlaps against existing CONFIRMED or PENDING bookings
    const { start, end } = getDayBounds(dto.date);
    const existing = await this.prisma.booking.findMany({
      where: {
        pitchId: dto.pitchId,
        date: { gte: start, lt: end },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    for (const toCreate of slotsToBook) {
      const conflict = existing.find((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return toCreate.startMinutes < bEnd && toCreate.endMinutes > bStart;
      });

      if (conflict) {
        throw new ConflictException(`Slot ${toCreate.startTime} is already reserved or pending payment.`);
      }
    }

    // 3. Idempotency: avoid duplicate records for same reference
    const existingPayment = await this.prisma.payment.findUnique({
      where: { reference: dto.reference },
    });
    if (existingPayment) return existingPayment;

    // 4. Create Payment and PENDING Bookings atomically
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
      ...slotsToBook.map((s) =>
        this.prisma.booking.create({
          data: {
            pitchId: dto.pitchId,
            name: dto.name || 'Guest',
            phone: dto.phone || '',
            email: dto.email,
            paymentReference: dto.reference,
            date: new Date(`${dto.date}T00:00:00`),
            startTime: s.startTime,
            endTime: s.endTime,
            status: 'PENDING', // Locked until verified
          },
        }),
      ),
    ]);

    // 5. Enqueue for Paystack verification
    await this.paymentQueue.add(
      'verify',
      { reference: payment.reference },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return payment;
  }

  /**
   * Returns the current status of a payment by reference.
   */
  async getStatus(reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { bookings: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  /**
   * Called after successful Paystack verification.
   * Updates payment to SUCCESS and flips associated bookings to CONFIRMED.
   */
  async markSuccessAndBook(reference: string, meta: Record<string, unknown>) {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'SUCCESS') return payment;

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

  /**
   * Called if Paystack verification fails.
   * Cancels associated bookings so slots are freed up.
   */
  async markFailed(reference: string, meta: Record<string, unknown>) {
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

  /**
   * Fetches all payments for all pitches owned by a specific user.
   */
  async findAllByOwner(ownerId: string) {
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
}
