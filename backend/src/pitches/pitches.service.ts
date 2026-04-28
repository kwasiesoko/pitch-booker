import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  getDayBounds,
  minutesToTime,
  timeToMinutes,
  validatePitchPayload,
  validatePitchUpdatePayload,
} from '../common/booking-utils';
import { ALLOWED_FACILITIES } from '../common/facilities';

@Injectable()
export class PitchesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, data: Record<string, unknown>) {
    const payload = validatePitchPayload({ ...data, ownerId });
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
    return ALLOWED_FACILITIES;
  }

  async findMine(ownerId: string) {
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

  async findOne(id: string) {
    const pitch = await this.prisma.pitch.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!pitch) throw new NotFoundException('Pitch not found');
    return pitch;
  }

  async addReview(pitchId: string, data: { name: string; rating: number; comment?: string }) {
    const pitch = await this.prisma.pitch.findUnique({ where: { id: pitchId } });
    if (!pitch) throw new NotFoundException('Pitch not found');

    return this.prisma.review.create({
      data: {
        pitchId,
        name: data.name,
        rating: data.rating,
        comment: data.comment,
      },
    });
  }

  async getReviews(pitchId: string) {
    return this.prisma.review.findMany({
      where: { pitchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(ownerId: string, id: string, data: Record<string, unknown>) {
    const pitch = await this.prisma.pitch.findUnique({
      where: { id },
    });

    if (!pitch) {
      throw new NotFoundException('Pitch not found');
    }

    if (pitch.ownerId !== ownerId) {
      throw new NotFoundException('Pitch not found');
    }

    const updates = validatePitchUpdatePayload(data);
    const mergedPayload = validatePitchPayload({
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

  async remove(ownerId: string, id: string) {
    const pitch = await this.prisma.pitch.findUnique({
      where: { id },
    });

    if (!pitch || pitch.ownerId !== ownerId) {
      throw new NotFoundException('Pitch not found');
    }

    return this.prisma.$transaction([
      this.prisma.booking.deleteMany({ where: { pitchId: id } }),
      this.prisma.pitch.delete({ where: { id } }),
    ]);
  }

  async getAvailability(pitchId: string, dateStr: string) {
    const pitch = await this.prisma.pitch.findUnique({
      where: { id: pitchId },
    });

    if (!pitch) {
      throw new NotFoundException('Pitch not found');
    }

    const { start, end } = getDayBounds(dateStr);

    const bookings = await this.prisma.booking.findMany({
      where: {
        pitchId,
        date: { gte: start, lt: end },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    const startHour = parseInt(pitch.openingTime.split(':')[0]);
    const endHour = parseInt(pitch.closingTime.split(':')[0]);

    const slots: { time: string; status: string }[] = [];
    for (let i = startHour; i < endHour; i++) {
        const slotMinutes = i * 60;
        const time = minutesToTime(slotMinutes);
        // A slot is reserved if any booking's [startTime, endTime) range covers it
        const booking = bookings.find(b => {
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
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

  async verify(pitchId: string) {
    const pitch = await this.prisma.pitch.findUnique({ where: { id: pitchId } });
    if (!pitch) throw new NotFoundException('Pitch not found');

    return this.prisma.pitch.update({
      where: { id: pitchId },
      data: { isVerified: true },
    });
  }

  async getInsights(ownerId: string) {
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

    const dayCounts: Record<string, number> = {};
    bookings.forEach(b => {
      // Use a consistent day name
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
}
