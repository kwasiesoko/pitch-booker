import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export interface InitiatePaymentDto {
    reference: string;
    amount: number;
    email: string;
    phone: string;
    name: string;
    pitchId: string;
    date: string;
    slots: Array<{
        startTime: string;
        duration?: number;
    }>;
}
export declare class PaymentsService {
    private prisma;
    private paymentQueue;
    constructor(prisma: PrismaService, paymentQueue: Queue);
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
        slots: Prisma.JsonValue;
        meta: Prisma.JsonValue | null;
        updatedAt: Date;
    }>;
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
        slots: Prisma.JsonValue;
        meta: Prisma.JsonValue | null;
        updatedAt: Date;
    }>;
    markSuccessAndBook(reference: string, meta: Record<string, unknown>): Promise<{
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
        slots: Prisma.JsonValue;
        meta: Prisma.JsonValue | null;
        updatedAt: Date;
    }>;
    markFailed(reference: string, meta: Record<string, unknown>): Promise<{
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
        slots: Prisma.JsonValue;
        meta: Prisma.JsonValue | null;
        updatedAt: Date;
    }>;
    findAllByOwner(ownerId: string): Promise<({
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
        slots: Prisma.JsonValue;
        meta: Prisma.JsonValue | null;
        updatedAt: Date;
    })[]>;
}
