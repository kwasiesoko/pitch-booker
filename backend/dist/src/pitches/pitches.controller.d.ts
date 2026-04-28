import { PitchesService } from './pitches.service';
export declare class PitchesController {
    private readonly pitchesService;
    constructor(pitchesService: PitchesService);
    create(req: {
        user: {
            userId: string;
        };
    }, createPitchDto: Record<string, unknown>): Promise<{
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
    findAll(take?: string, skip?: string): Promise<({
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
    findMine(req: {
        user: {
            userId: string;
        };
    }): Promise<({
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
    update(req: {
        user: {
            userId: string;
        };
    }, id: string, updatePitchDto: Record<string, unknown>): Promise<{
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
    remove(req: {
        user: {
            userId: string;
        };
    }, id: string): Promise<[import("@prisma/client").Prisma.BatchPayload, {
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
    getAvailability(id: string, date: string): Promise<{
        date: string;
        pitchId: string;
        slots: {
            time: string;
            status: string;
        }[];
    }>;
    getReviews(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        pitchId: string;
        rating: number;
        comment: string | null;
    }[]>;
    addReview(id: string, reviewDto: {
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
    getInsights(req: {
        user: {
            userId: string;
        };
    }): Promise<{
        totalRevenue: number;
        totalBookings: number;
        popularDay: string;
        pitchCount: number;
    }>;
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
    verify(req: {
        user: {
            role: string;
        };
    }, id: string): Promise<{
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
}
