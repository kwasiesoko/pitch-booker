import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import axios from 'axios';
import { PaymentsService } from './payments.service';

interface VerifyJobData {
  reference: string;
}

@Processor('payment-verification')
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(private paymentsService: PaymentsService) {}

  @Process('verify')
  async handleVerification(job: Job<VerifyJobData>) {
    const { reference } = job.data;
    this.logger.log(`Verifying Paystack payment: ${reference}`);

    try {
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!secretKey) {
        throw new Error('PAYSTACK_SECRET_KEY is not configured in the environment.');
      }

      const { data } = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
          timeout: 10_000,
        },
      );

      const tx = data?.data;
      const status: string = tx?.status ?? 'failed';

      if (status === 'success') {
        await this.paymentsService.markSuccessAndBook(reference, tx);
        this.logger.log(`✅ Payment ${reference} verified — bookings created.`);
      } else {
        await this.paymentsService.markFailed(reference, tx);
        this.logger.warn(`❌ Payment ${reference} failed with status: ${status}`);
      }
    } catch (err) {
      this.logger.error(`Error verifying ${reference}: ${err?.message}`);
      // Re-throw so Bull retries the job with exponential backoff
      throw err;
    }
  }
}
