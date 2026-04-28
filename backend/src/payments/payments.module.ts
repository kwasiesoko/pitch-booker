import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentProcessor } from './payment.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'payment-verification',
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentProcessor],
  exports: [PaymentsService],
})
export class PaymentsModule {}
