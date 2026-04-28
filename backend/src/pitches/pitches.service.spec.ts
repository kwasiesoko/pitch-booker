import { NotFoundException } from '@nestjs/common';
import { PitchesService } from './pitches.service';

describe('PitchesService', () => {
  const prisma = {
    pitch: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
  } as any;

  const service = new PitchesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a pitch with validated payload', async () => {
    prisma.pitch.create.mockResolvedValue({ id: 'pitch-1' });

    await service.create('owner-1', {
      ownerId: 'owner-1',
      name: 'Main Pitch',
      location: 'Accra',
      pricePerHour: 200,
      openingTime: '06:00',
      closingTime: '18:00',
      facilities: ['Parking', 'Floodlights'],
    });

    expect(prisma.pitch.create).toHaveBeenCalledWith({
      data: {
        ownerId: 'owner-1',
        name: 'Main Pitch',
        location: 'Accra',
        pricePerHour: 200,
        openingTime: '06:00',
        closingTime: '18:00',
        facilities: ['Parking', 'Floodlights'],
      },
    });
  });

  it('throws when a pitch is missing', async () => {
    prisma.pitch.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns available hourly slots excluding confirmed bookings', async () => {
    prisma.pitch.findUnique.mockResolvedValue({
      id: 'pitch-1',
      openingTime: '06:00',
      closingTime: '09:00',
    });
    prisma.booking.findMany.mockResolvedValue([
      { startTime: '07:00', endTime: '08:00', status: 'CONFIRMED' },
    ]);

    await expect(service.getAvailability('pitch-1', '2026-04-25')).resolves.toEqual({
      date: '2026-04-25',
      pitchId: 'pitch-1',
      slots: [
        { time: '06:00', status: 'AVAILABLE' },
        { time: '07:00', status: 'CONFIRMED' },
        { time: '08:00', status: 'AVAILABLE' },
      ],
    });
  });
});
