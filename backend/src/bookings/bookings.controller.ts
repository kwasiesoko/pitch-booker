import { Controller, Post, Body, Get, UseGuards, Req, Patch, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: Record<string, unknown>) {
    return this.bookingsService.create(createBookingDto);
  }

  /**
   * Bulk-creates multiple bookings for the same pitch/date in a single
   * atomic transaction. Rolls back all if any slot conflicts.
   *
   * Body: { pitchId, name, phone, date, slots: [{ startTime, duration? }] }
   */
  @Post('bulk')
  bulkCreate(
    @Body()
    body: {
      pitchId: string;
      name: string;
      phone: string;
      email?: string;
      date: string;
      slots: Array<{ startTime: string; duration?: number }>;
      paymentReference?: string;
    },
  ) {
    return this.bookingsService.bulkCreate(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Req() req: { user: { userId: string } }) {
    return this.bookingsService.findAllForOwner(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body('status') status: 'CONFIRMED' | 'PENDING' | 'CANCELLED',
  ) {
    return this.bookingsService.updateStatus(req.user.userId, id, status);
  }
}
