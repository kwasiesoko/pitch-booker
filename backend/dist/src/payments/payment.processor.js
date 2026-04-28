"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const payments_service_1 = require("./payments.service");
let PaymentProcessor = PaymentProcessor_1 = class PaymentProcessor {
    paymentsService;
    logger = new common_1.Logger(PaymentProcessor_1.name);
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async handleVerification(job) {
        const { reference } = job.data;
        this.logger.log(`Verifying Paystack payment: ${reference}`);
        try {
            const secretKey = process.env.PAYSTACK_SECRET_KEY;
            if (!secretKey) {
                throw new Error('PAYSTACK_SECRET_KEY is not configured in the environment.');
            }
            const { data } = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                },
                timeout: 10_000,
            });
            const tx = data?.data;
            const status = tx?.status ?? 'failed';
            if (status === 'success') {
                await this.paymentsService.markSuccessAndBook(reference, tx);
                this.logger.log(`✅ Payment ${reference} verified — bookings created.`);
            }
            else {
                await this.paymentsService.markFailed(reference, tx);
                this.logger.warn(`❌ Payment ${reference} failed with status: ${status}`);
            }
        }
        catch (err) {
            this.logger.error(`Error verifying ${reference}: ${err?.message}`);
            throw err;
        }
    }
};
exports.PaymentProcessor = PaymentProcessor;
__decorate([
    (0, bull_1.Process)('verify'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentProcessor.prototype, "handleVerification", null);
exports.PaymentProcessor = PaymentProcessor = PaymentProcessor_1 = __decorate([
    (0, bull_1.Processor)('payment-verification'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentProcessor);
//# sourceMappingURL=payment.processor.js.map