import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    signup(email: string, password: string, phone: string): Promise<{
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        token: string;
    }>;
    me(userId: string): Promise<{
        id: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    update(userId: string, data: {
        phone?: string;
    }): Promise<{
        id: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
