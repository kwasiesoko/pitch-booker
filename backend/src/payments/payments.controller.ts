import { Controller, Post, Get, Body, Param, HttpCode, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { InitiatePaymentDto } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments/initiate
   */
  @Post('initiate')
  @HttpCode(201)
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(dto);
  }

  /**
   * GET /payments/mine
   * Returns all payments for pitches owned by the logged-in user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  getMine(@Request() req: any) {
    return this.paymentsService.findAllByOwner(req.user.id);
  }

  /**
   * GET /payments/:reference/status
   */
  @Get(':reference/status')
  getStatus(@Param('reference') reference: string) {
    return this.paymentsService.getStatus(reference);
  }
}
