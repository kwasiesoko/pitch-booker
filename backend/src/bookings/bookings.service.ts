import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  getDayBounds, 
  timeToMinutes, 
  validateBookingPayload,
  minutesToTime
} from '../common/booking-utils';

interface BulkBookingItem {
  startTime: string;
  duration?: number;
}

interface BulkBookingPayload {
  pitchId: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  slots: BulkBookingItem[];
  paymentReference?: string;
}

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Record<string, unknown>) {
    const payload = validateBookingPayload(data);
    const { pitchId, startTime, date } = payload;
    const duration = (data.duration as number) || 1;

    const pitch = await this.prisma.pitch.findUnique({
      where: { id: pitchId },
    });

    if (!pitch) {
      throw new NotFoundException('Pitch not found');
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + (duration * 60);
    const endTime = minutesToTime(endMinutes);

    // Check if within operating hours
    const openingMinutes = timeToMinutes(pitch.openingTime);
    const closingMinutes = timeToMinutes(pitch.closingTime);
    
    if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
      throw new BadRequestException('Booking extends outside of operating hours');
    }

    // Check for overlaps
    const { start, end } = getDayBounds(date);
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        pitchId,
        date: { gte: start, lt: end },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    const isOverlap = existingBookings.some((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return startMinutes < bEnd && endMinutes > bStart;
    });

    if (isOverlap) {
      throw new ConflictException('The requested time slot overlaps with an existing booking');
    }

    return this.prisma.booking.create({
      data: {
        pitchId,
        name: payload.name,
        phone: payload.phone,
        email: data.email as string,
        paymentReference: data.paymentReference as string,
        date: new Date(`${date}T00:00:00`),
        startTime,
        endTime,
        status: 'PENDING',
      },
    });
  }

  /**
   * Creates multiple bookings atomically in a single transaction.
   * If any slot conflicts, the entire batch is rolled back.
   */
  async bulkCreate(data: BulkBookingPayload) {
    const { pitchId, name, phone, date, slots } = data;

    if (!Array.isArray(slots) || slots.length === 0) {
      throw new BadRequestException('slots must be a non-empty array.');
    }

    // Validate each slot's startTime by re-using the single-booking helper
    for (const slot of slots) {
      validateBookingPayload({ pitchId, name, phone, date, startTime: slot.startTime });
    }

    const pitch = await this.prisma.pitch.findUnique({ where: { id: pitchId } });
    if (!pitch) throw new NotFoundException('Pitch not found');

    const openingMinutes = timeToMinutes(pitch.openingTime);
    const closingMinutes = timeToMinutes(pitch.closingTime);

    const bookingsToCreate = slots.map((slot) => {
      const duration = slot.duration ?? 1;
      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = startMinutes + duration * 60;

      if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
        throw new BadRequestException(
          `Slot ${slot.startTime} extends outside of operating hours.`,
        );
      }

      return {
        startTime: slot.startTime,
        endTime: minutesToTime(endMinutes),
        startMinutes,
        endMinutes,
      };
    });

    // Check for intra-batch overlaps
    for (let i = 0; i < bookingsToCreate.length; i++) {
      for (let j = i + 1; j < bookingsToCreate.length; j++) {
        const a = bookingsToCreate[i];
        const b = bookingsToCreate[j];
        if (a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes) {
          throw new ConflictException(
            `Slots ${a.startTime} and ${b.startTime} overlap within the request.`,
          );
        }
      }
    }

    // Check for overlaps against existing bookings
    const { start, end } = getDayBounds(date);
    const existing = await this.prisma.booking.findMany({
      where: {
        pitchId,
        date: { gte: start, lt: end },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    for (const toCreate of bookingsToCreate) {
      const conflict = existing.find((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return toCreate.startMinutes < bEnd && toCreate.endMinutes > bStart;
      });

      if (conflict) {
        throw new ConflictException(
          `Slot ${toCreate.startTime} overlaps with an existing booking.`,
        );
      }
    }

    if (data.paymentReference) {
      const payment = await this.prisma.payment.findUnique({
        where: { reference: data.paymentReference },
      });
      if (!payment) {
        throw new BadRequestException(`Payment reference ${data.paymentReference} not found.`);
      }
    }

    // All clear — create atomically
    return this.prisma.$transaction(
      bookingsToCreate.map((b) =>
        this.prisma.booking.create({
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
        }),
      ),
    );
  }

  async findAllForOwner(ownerId: string) {
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

  async updateStatus(ownerId: string, bookingId: string, status: 'CONFIRMED' | 'PENDING' | 'CANCELLED') {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { pitch: true },
    });

    if (!booking || booking.pitch.ownerId !== ownerId) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }
}
