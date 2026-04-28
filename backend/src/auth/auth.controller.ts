import { Controller, Post, Body, Get, Req, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: Record<string, unknown>) {
    return this.authService.signup(body.email as string, body.password as string, body.phone as string);
  }

  @Post('login')
  login(@Body() body: Record<string, unknown>) {
    return this.authService.login(body.email as string, body.password as string);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: { userId: string } }) {
    return this.authService.me(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@Req() req: { user: { userId: string } }, @Body() body: { phone?: string }) {
    return this.authService.update(req.user.userId, body);
  }
}
