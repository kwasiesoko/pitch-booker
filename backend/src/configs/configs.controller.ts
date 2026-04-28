import { Controller, Get } from '@nestjs/common';

@Controller('configs')
export class ConfigsController {
  @Get('paystack-public-key')
  getPaystackPublicKey() {
    return { publicKey: process.env.PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_API_KEY || '' };
  }
}
