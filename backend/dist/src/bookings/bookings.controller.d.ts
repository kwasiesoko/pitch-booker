import { BookingsService } from './bookings.service';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(createBookingDto: Record<string, unknown>): Promise<{
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
    }>;
    bulkCreate(body: {
        pitchId: string;
        name: string;
        phone: string;
        email?: string;
        date: string;
        slots: Array<{
            startTime: string;
            duration?: number;
        }>;
        paymentReference?: string;
    }): Promise<{
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
    }[]>;
    findMine(req: {
        user: {
            userId: string;
        };
    }): Promise<({
        pitch: {
            id: string;
            createdAt: Date;
            name: string;
            ownerId: string;
            location: string;
            pricePerHour: number;
            openingTime: string;
            closingTime: string;
            facilities: string[];
            imageUrl: string | null;
            isVerified: boolean;
        };
    } & {
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
    })[]>;
    updateStatus(req: {
        user: {
            userId: string;
        };
    }, id: string, status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'): Promise<{
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
    }>;
}
