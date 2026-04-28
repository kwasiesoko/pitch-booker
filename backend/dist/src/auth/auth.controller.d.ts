import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(body: Record<string, unknown>): Promise<{
        token: string;
    }>;
    login(body: Record<string, unknown>): Promise<{
        token: string;
    }>;
    me(req: {
        user: {
            userId: string;
        };
    }): Promise<{
        id: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    update(req: {
        user: {
            userId: string;
        };
    }, body: {
        phone?: string;
    }): Promise<{
        id: string;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
