import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const prisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  } as any;

  const jwt = {
    sign: jest.fn().mockReturnValue('signed-token'),
  } as any;

  const bcrypt = jest.requireMock('bcryptjs') as {
    compare: jest.Mock;
  };

  const service = new AuthService(prisma, jwt);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signs up a new user and returns a token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
    });

    await expect(service.signup('owner@example.com', 'password123')).resolves.toEqual({
      token: 'signed-token',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'owner@example.com',
        password: 'hashed-password',
      },
    });
  });

  it('rejects duplicate signups', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await expect(service.signup('owner@example.com', 'password123')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('logs a user in with a valid password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      password: 'hashed-password',
    });
    bcrypt.compare.mockResolvedValue(true);

    await expect(service.login('owner@example.com', 'password123')).resolves.toEqual({
      token: 'signed-token',
    });
  });

  it('rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.login('owner@example.com', 'password123')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
