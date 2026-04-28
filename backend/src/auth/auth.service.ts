import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { assertEmail, assertPassword } from '../common/booking-utils';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async signup(email: string, password: string, phone: string) {
    const normalizedEmail = assertEmail(email);
    const normalizedPassword = assertPassword(password);

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new ConflictException('Email already in use');
    const hash = await bcrypt.hash(normalizedPassword, 10);
    const user = await this.prisma.user.create({ data: { email: normalizedEmail, password: hash, phone } });
    return { token: this.jwt.sign({ sub: user.id, email: user.email, role: user.role }, { expiresIn: '7d' }) };
  }

  async login(email: string, password: string) {
    const normalizedEmail = assertEmail(email);
    const normalizedPassword = assertPassword(password);

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(normalizedPassword, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return { token: this.jwt.sign({ sub: user.id, email: user.email, role: user.role }, { expiresIn: '7d' }) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, phone: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    return user;
  }

  async update(userId: string, data: { phone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { phone: data.phone },
      select: { id: true, email: true, role: true, phone: true },
    });
  }
}
