import { Controller, Post, Body, Res, Req, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from './auth.guard';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { CurrentUser } from './current-user.decorators';
import { SignInRequestDto } from './dto/sign-in/sign-in-request.dto';
import { SignUpRequestDto } from './dto/sign-up/sign-up-request.dto';
import { SignInResponseDto } from './dto/sign-in/sign-in-response.dto';
import { SignUpResponseDto } from './dto/sign-up/sign-up-response.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token/refresh-token-response.dto';
import { SendPasswordResetEmailRequestDto } from './dto/send-password-reset-email/send-password-reset-email-request.dto';
import { ResetPasswordRequestDto } from './dto/reset-password/reset-password-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('sign-up')
  async signUp(@Body() signUpRequestDto: SignUpRequestDto, @Res({ passthrough: true }) res: Response): Promise<{ success: boolean, data: SignUpResponseDto, messageKey: string }> {
    const response: SignUpResponseDto = await this.authService.signUp(signUpRequestDto.email, signUpRequestDto.password, signUpRequestDto.firstName, signUpRequestDto.lastName, signUpRequestDto.username);

    res.cookie('refresh_token', response.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh token expires in 7 days
    });

    return { success: true, data: response, messageKey: 'SUCCESS_SIGNED_UP' };
  }

  @Post('sign-in')
  async signIn(@Body() signInRequestDto: SignInRequestDto, @Res({ passthrough: true }) res: Response): Promise<{ success: boolean, data: SignInResponseDto, messageKey: string }> {
    const response: SignInResponseDto = await this.authService.signIn(signInRequestDto.username, signInRequestDto.password);
    res.cookie('refresh_token', response.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh token expires in 7 days
    });
    return { success: true, data: response, messageKey: 'SUCCESS_SIGNED_IN' };
  }

  @UseGuards(AuthGuard)
  @Post('sign-out')
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ success: boolean, messageKey: string }> {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new CustomHttpException('NO_REFRESH_TOKEN_PROVIDED', 'No refresh token provided', 'ERROR_NO_REFRESH_TOKEN_PROVIDED', HttpStatus.UNAUTHORIZED);
    const payload: any = jwt.decode(refreshToken);
    if (!payload?.sub) throw new CustomHttpException('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 'ERROR_INVALID_REFRESH_TOKEN', HttpStatus.UNAUTHORIZED);
    await this.authService.revokeRefreshToken(payload.sub);
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'strict',
    });
    return { success: true, messageKey: 'SUCCESS_SIGNED_OUT' };
  }

  @Get('refresh-token')
  async refreshToken(@Req() req: Request): Promise<{ success: boolean, data: RefreshTokenResponseDto, messageKey: string }> {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new CustomHttpException('NO_REFRESH_TOKEN_PROVIDED', 'No refresh token provided', 'ERROR_NO_REFRESH_TOKEN_PROVIDED', HttpStatus.UNAUTHORIZED);
    const response: RefreshTokenResponseDto = await this.authService.refreshToken(refreshToken);
    return { success: true, data: response, messageKey: 'SUCCESS_TOKEN_REFRESHED' };
  }

  @Post('send-password-reset-email')
  async sendPasswordResetEmail(@Body() sendPasswordResetEmailRequestDto: SendPasswordResetEmailRequestDto): Promise<{ success: boolean, messageKey: string }> {
    await this.authService.sendPasswordResetEmail(sendPasswordResetEmailRequestDto.email);
    return { success: true, messageKey: 'SUCCESS_PASSWORD_RESET_EMAIL_SENT' };
  }

  @Post('reset-password')
  async resetPassword(@Body() passwordResetRequestDto: ResetPasswordRequestDto): Promise<{ success: boolean, messageKey: string }> {
    await this.authService.resetPassword(passwordResetRequestDto.token, passwordResetRequestDto.password);
    return { success: true, messageKey: 'SUCCESS_PASSWORD_RESET' };
  }

  @UseGuards(AuthGuard)
  @Post('send-verify-email')
  async sendVerifyEmail(@CurrentUser('sub') userId: string) {
    await this.authService.sendVerifyEmail(userId);
    return { success: true, messageKey: 'SUCCESS_VERIFY_EMAIL_SENT' };
  }

  @Get('verify-email')
  async verifyEmail(@Req() req: Request) {
    const token = req.query.token as string;
    await this.authService.verifyEmail(token);
    return { success: true, messageKey: 'SUCCESS_EMAIL_VERIFIED' };
  }
}
