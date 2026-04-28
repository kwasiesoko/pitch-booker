import { PrismaService } from '../prisma/prisma.service';
export declare class PitchesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ownerId: string, data: Record<string, unknown>): Promise<{
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
    }>;
    findAll(take?: number, skip?: number): Promise<({
        _count: {
            reviews: number;
        };
    } & {
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
    })[]>;
    getFacilities(): readonly ["Parking", "Floodlights", "Changing Rooms", "Showers", "Seating", "Restrooms", "Security", "Refreshments", "Artificial Turf", "Spectator Stands"];
    findMine(ownerId: string): Promise<({
        owner: {
            email: string;
            phone: string | null;
        };
        _count: {
            bookings: number;
            reviews: number;
        };
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
        reviews: {
            id: string;
            createdAt: Date;
            name: string;
            pitchId: string;
            rating: number;
            comment: string | null;
        }[];
    } & {
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
    }>;
    addReview(pitchId: string, data: {
        name: string;
        rating: number;
        comment?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        pitchId: string;
        rating: number;
        comment: string | null;
    }>;
    getReviews(pitchId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        pitchId: string;
        rating: number;
        comment: string | null;
    }[]>;
    update(ownerId: string, id: string, data: Record<string, unknown>): Promise<{
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
    }>;
    remove(ownerId: string, id: string): Promise<[import("@prisma/client").Prisma.BatchPayload, {
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
    }]>;
    getAvailability(pitchId: string, dateStr: string): Promise<{
        date: string;
        pitchId: string;
        slots: {
            time: string;
            status: string;
        }[];
    }>;
    verify(pitchId: string): Promise<{
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
    }>;
    getInsights(ownerId: string): Promise<{
        totalRevenue: number;
        totalBookings: number;
        popularDay: string;
        pitchCount: number;
    }>;
}
