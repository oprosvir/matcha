import { Controller, Post, Body, Res, Req, UnauthorizedException, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body('email') email: string, @Body('password') password: string, @Body('firstName') firstName: string, @Body('lastName') lastName: string, @Body('username') username: string, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.register(email, password, firstName, lastName, username);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh token expires in 7 days
    });

    return { accessToken };
  }

  @Post('login')
  async login(@Body('username') username: string, @Body('password') password: string, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(username, password);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh token expires in 7 days
    });

    return { accessToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    console.log('All cookies:', req.cookies);
    const refreshToken = req.cookies['refresh_token'];
    console.log('Refresh token:', refreshToken, 'Type:', typeof refreshToken);

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const payload: any = jwt.decode(refreshToken);
    console.log('Decoded payload:', payload);

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.authService.revokeRefreshToken(payload.sub);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'strict',
    });

    return { success: true, message: 'Logged out successfully' };
  }

  @Get('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { accessToken } = await this.authService.refresh(refreshToken);
    return { accessToken };
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const message = await this.authService.requestPasswordReset(email);
    return { message };
  }

  @Post('reset-password')
  async resetPassword(@Body('token') token: string, @Body('password') password: string) {
    await this.authService.resetPassword(token, password);
    return { message: 'Password has been successfully reset' };
  }

  @Get('verify-reset-token')
  async verifyResetToken(@Req() req: Request) {
    const token = req.query.token as string;
    const isValid = await this.authService.verifyResetToken(token);
    return { valid: isValid };
  }

  @Post('send-verify-email')
  async sendVerifyEmail(@Body('email') email: string) {
    await this.authService.sendVerifyEmail(email);
    return { message: 'Verify email has been successfully sent' };
  }

  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email has been successfully verified' };
  }

  @Get('verify-email-token')
  async verifyEmailToken(@Req() req: Request) {
    const token = req.query.token as string;
    const isValid = await this.authService.verifyEmailToken(token);
    return { valid: isValid };
  }
}
