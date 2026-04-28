import { PaymentsService } from './payments.service';
import type { InitiatePaymentDto } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    initiate(dto: InitiatePaymentDto): Promise<{
        id: string;
        email: string;
        phone: string | null;
        createdAt: Date;
        name: string | null;
        pitchId: string;
        date: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        reference: string;
        amount: number;
        slots: import("@prisma/client/runtime/client").JsonValue;
        meta: import("@prisma/client/runtime/client").JsonValue | null;
        updatedAt: Date;
    }>;
    getMine(req: any): Promise<({
        pitch: {
            name: string;
            location: string;
        };
        bookings: {
            date: Date;
            startTime: string;
            endTime: string;
        }[];
    } & {
        id: string;
        email: string;
        phone: string | null;
        createdAt: Date;
        name: string | null;
        pitchId: string;
        date: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        reference: string;
        amount: number;
        slots: import("@prisma/client/runtime/client").JsonValue;
        meta: import("@prisma/client/runtime/client").JsonValue | null;
        updatedAt: Date;
    })[]>;
    getStatus(reference: string): Promise<{
        bookings: {
            id: string;
            email: string | null;
            phone: string;
            createdAt: Date;
            name: string;
            pitchId: string;
            date: Date;
            startTime: string;
            paymentReference: string | null;
            endTime: string;
            status: import("@prisma/client").$Enums.BookingStatus;
        }[];
    } & {
        id: string;
        email: string;
        phone: string | null;
        createdAt: Date;
        name: string | null;
        pitchId: string;
        date: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        reference: string;
        amount: number;
        slots: import("@prisma/client/runtime/client").JsonValue;
        meta: import("@prisma/client/runtime/client").JsonValue | null;
        updatedAt: Date;
    }>;
}
