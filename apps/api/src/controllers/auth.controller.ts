import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { username: string; password: string }) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: { username: string; password: string; fullName: string }) {
    return this.authService.register(registerDto);
  }

  @Get('verify')
  async verify(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { valid: false };
    }
    return this.authService.verifyToken(token);
  }
}
