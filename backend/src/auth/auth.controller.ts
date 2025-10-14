import { Controller, Post, Body, Res, Req, UnauthorizedException, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('sign-up')
  async signUp(@Body('email') email: string, @Body('password') password: string, @Body('firstName') firstName: string, @Body('lastName') lastName: string, @Body('username') username: string, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.signUp(email, password, firstName, lastName, username);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh token expires in 7 days
    });

    return { accessToken };
  }

  @Post('sign-in')
  async signIn(@Body('username') username: string, @Body('password') password: string, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.signIn(username, password);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh token expires in 7 days
    });
    return { accessToken };
  }

  @UseGuards(AuthGuard)
  @Post('sign-out')
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');
    const payload: any = jwt.decode(refreshToken);
    if (!payload?.sub) throw new UnauthorizedException('Invalid refresh token');
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
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');
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

  @Get('verify-reset-token') // TODO: I think this is not needed
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

  @Get('verify-email') // TODO: I think this is not needed
  async verifyEmail(@Req() req: Request) {
    const token = req.query.token as string;
    const isValid = await this.authService.verifyEmail(token);
    return { valid: isValid };
  }
}
