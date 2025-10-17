import { Controller, Post, Body, Res, Req, UnauthorizedException, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from './auth.guard';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

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

    return { success: true, data: { accessToken }, messageKey: 'SUCCESS_SIGNED_UP' };
  }

  @Post('sign-in')
  async signIn(@Body('username') username: string, @Body('password') password: string, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.signIn(username, password);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh token expires in 7 days
    });
    return { success: true, data: { accessToken }, messageKey: 'SUCCESS_SIGNED_IN' };
  }

  @UseGuards(AuthGuard)
  @Post('sign-out')
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException(new CustomHttpException('NO_REFRESH_TOKEN_PROVIDED', 'No refresh token provided', 'ERROR_NO_REFRESH_TOKEN_PROVIDED', HttpStatus.UNAUTHORIZED));
    const payload: any = jwt.decode(refreshToken);
    if (!payload?.sub) throw new UnauthorizedException(new CustomHttpException('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 'ERROR_INVALID_REFRESH_TOKEN', HttpStatus.UNAUTHORIZED));
    await this.authService.revokeRefreshToken(payload.sub);
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'strict',
    });
    return { success: true, data: {}, messageKey: 'SUCCESS_SIGNED_OUT' };
  }

  @Get('refresh-token')
  async refreshToken(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException(new CustomHttpException('NO_REFRESH_TOKEN_PROVIDED', 'No refresh token provided', 'ERROR_NO_REFRESH_TOKEN_PROVIDED', HttpStatus.UNAUTHORIZED));
    const { accessToken } = await this.authService.refreshToken(refreshToken);
    return { success: true, data: { accessToken }, messageKey: 'SUCCESS_TOKEN_REFRESHED' };
  }

  @Post('send-password-reset-email')
  async sendPasswordResetEmail(@Body('email') email: string) {
    await this.authService.sendPasswordResetEmail(email);
    return { success: true, data: {}, messageKey: 'SUCCESS_PASSWORD_RESET_EMAIL_SENT' };
  }

  @Post('reset-password')
  async resetPassword(@Body('token') token: string, @Body('password') password: string) {
    await this.authService.resetPassword(token, password);
    return { success: true, data: {}, messageKey: 'SUCCESS_PASSWORD_RESET' };
  }

  @Post('send-verify-email')
  async sendVerifyEmail(@Body('email') email: string) {
    await this.authService.sendVerifyEmail(email);
    return { success: true, data: {}, messageKey: 'SUCCESS_VERIFY_EMAIL_SENT' };
  }

  @Get('verify-email')
  async verifyEmail(@Req() req: Request) {
    const token = req.query.token as string;
    await this.authService.verifyEmail(token);
    return { success: true, data: {}, messageKey: 'SUCCESS_EMAIL_VERIFIED' };
  }
}
