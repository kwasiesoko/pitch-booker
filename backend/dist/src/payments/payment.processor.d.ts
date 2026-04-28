import type { Job } from 'bull';
import { PaymentsService } from './payments.service';
interface VerifyJobData {
    reference: string;
}
export declare class PaymentProcessor {
    private paymentsService;
    private readonly logger;
    constructor(paymentsService: PaymentsService);
    handleVerification(job: Job<VerifyJobData>): Promise<void>;
}
export {};
