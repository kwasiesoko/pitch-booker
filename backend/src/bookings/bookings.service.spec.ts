import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  const futureDate = '2026-04-27';

  const prisma = {
    booking: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    pitch: {
      findUnique: jest.fn(),
    },
  } as any;

  const service = new BookingsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a booking when the slot is available', async () => {
    prisma.pitch.findUnique.mockResolvedValue({
      id: 'pitch-1',
      openingTime: '06:00',
      closingTime: '18:00',
    });
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.booking.create.mockResolvedValue({ id: 'booking-1' });

    await service.create({
      pitchId: 'pitch-1',
      name: 'Kojo',
      phone: '0200000000',
      date: futureDate,
      startTime: '07:00',
    });

    expect(prisma.booking.create).toHaveBeenCalledWith({
      data: {
        pitchId: 'pitch-1',
        name: 'Kojo',
        phone: '0200000000',
        email: undefined,
        paymentReference: undefined,
        date: new Date('2026-04-27T00:00:00'),
        startTime: '07:00',
        endTime: '08:00',
        status: 'PENDING',
      },
    });
  });

  it('rejects overlapping bookings', async () => {
    prisma.pitch.findUnique.mockResolvedValue({
      id: 'pitch-1',
      openingTime: '06:00',
      closingTime: '18:00',
    });
    prisma.booking.findMany.mockResolvedValue([
      { startTime: '07:00', endTime: '08:00' },
    ]);

    await expect(
      service.create({
        pitchId: 'pitch-1',
        name: 'Kojo',
        phone: '0200000000',
        date: futureDate,
        startTime: '07:00',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects bookings for unknown pitches', async () => {
    prisma.pitch.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        pitchId: 'missing',
        name: 'Kojo',
        phone: '0200000000',
        date: futureDate,
        startTime: '07:00',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
