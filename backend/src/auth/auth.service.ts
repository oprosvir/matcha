import { Injectable, HttpStatus } from '@nestjs/common';
import { UserService } from '../users/user.service';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import { PrivateUserDto } from 'src/users/dto';
import { SignUpResponseDto } from './dto/sign-up/sign-up-response.dto';
import { SignInResponseDto } from './dto/sign-in/sign-in-response.dto';
import { RedisRepository } from '../redis/repositories/redis.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { RefreshTokenResponseDto } from './dto/refresh-token/refresh-token-response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly redisRepository: RedisRepository) {
    const access = process.env.ACCESS_TOKEN_SECRET;
    const refresh = process.env.REFRESH_TOKEN_SECRET;
    if (!access || !refresh) {
      throw new Error('JWT secrets not configured (ACCESS_TOKEN_SECRET/REFRESH_TOKEN_SECRET)');
    }
    this.ACCESS_TOKEN_SECRET = access;
    this.REFRESH_TOKEN_SECRET = refresh;
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_SENDER_EMAIL) {
      throw new Error('Sendgrid API key or sender email not configured (SENDGRID_API_KEY/SENDGRID_SENDER_EMAIL)');
    }
    this.sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    this.SENDGRID_SENDER_EMAIL = process.env.SENDGRID_SENDER_EMAIL;
    this.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  }
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly SENDGRID_SENDER_EMAIL: string;
  private readonly FRONTEND_URL: string;
  private readonly sendgrid = sgMail;

  private generateAccessToken(user: { id: string, email: string }): string {
    return jwt.sign({ sub: user.id.toString(), email: user.email }, this.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  }

  private async revokeVerifyEmailToken(token: string) {
    await this.redisRepository.deleteEntry(`verify_email:${token}`);
  }


  private async revokePasswordResetToken(token: string) {
    await this.redisRepository.deleteEntry(`password_reset:${token}`);
  }

  private async generateRefreshToken(user: { id: string }): Promise<string> {
    const refreshToken = jwt.sign({ sub: user.id.toString() }, this.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    await this.redisRepository.setEntry(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60);
    return refreshToken;
  }

  async revokeRefreshToken(userId: string) {
    await this.redisRepository.deleteEntry(`refresh_token:${userId}`);
  }

  async signUp(email: string, password: string, firstName: string, lastName: string, username: string): Promise<SignUpResponseDto> {
    const newUser: PrivateUserDto = await this.userService.create({ username, email, firstName, lastName, password });
    const accessToken = this.generateAccessToken({ id: newUser.id, email: newUser.email });
    const refreshToken = await this.generateRefreshToken({ id: newUser.id });
    return { accessToken, refreshToken, userId: newUser.id.toString() };
  }

  async signIn(username: string, password: string): Promise<SignInResponseDto> {
    const user = await this.userService.findByUsername(username);
    if (!user) throw new CustomHttpException('INVALID_CREDENTIALS', 'Invalid credentials', 'ERROR_INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
    const valid = await this.userService.validatePassword(username, password);
    if (!valid) throw new CustomHttpException('INVALID_CREDENTIALS', 'Invalid credentials', 'ERROR_INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    if (!refreshToken) throw new CustomHttpException('NO_REFRESH_TOKEN_PROVIDED', 'No refresh token provided', 'ERROR_NO_REFRESH_TOKEN_PROVIDED', HttpStatus.BAD_REQUEST);
    try {
      const payload: any = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET);
      const storedToken = await this.redisRepository.getEntry(`refresh_token:${payload.sub}`);
      if (!storedToken || storedToken !== refreshToken) throw new CustomHttpException('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 'ERROR_INVALID_REFRESH_TOKEN', HttpStatus.BAD_REQUEST);
      const user: PrivateUserDto | null = await this.userService.findById(payload.sub);
      if (!user) throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      const accessToken = this.generateAccessToken({ id: user.id, email: user.email });
      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) throw new CustomHttpException('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 'ERROR_INVALID_REFRESH_TOKEN', HttpStatus.BAD_REQUEST);
      if (error instanceof jwt.TokenExpiredError) throw new CustomHttpException('REFRESH_TOKEN_EXPIRED', 'Refresh token expired', 'ERROR_REFRESH_TOKEN_EXPIRED', HttpStatus.BAD_REQUEST);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) return; // Don't throw an error if the email is not found to prevent email enumeration
    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.redisRepository.setEntry(`password_reset:${resetToken}`, user.id.toString(), 60 * 60);
    try {
      await this.sendgrid.send({
        to: user.email,
        from: this.SENDGRID_SENDER_EMAIL,
        subject: 'Reset your password for Matcha',
        html: `<p>Click <a href="${this.FRONTEND_URL}/auth/reset-password?token=${resetToken}">here</a> to reset your password.</p>`
      });
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred please try again later', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) throw new CustomHttpException('TOKEN_AND_NEW_PASSWORD_REQUIRED', 'Token and new password are required', 'ERROR_TOKEN_AND_NEW_PASSWORD_REQUIRED', HttpStatus.BAD_REQUEST);
    const userId = await this.redisRepository.getEntry(`password_reset:${token}`);
    if (!userId) throw new CustomHttpException('INVALID_OR_EXPIRED_RESET_TOKEN', 'Invalid or expired reset token', 'ERROR_INVALID_OR_EXPIRED_RESET_TOKEN', HttpStatus.BAD_REQUEST);
    await this.userService.updatePassword(userId, newPassword);
    await this.revokePasswordResetToken(token); // Revoke password reset token
    await this.revokeRefreshToken(userId); // Revoke refresh token
  }

  async verifyPasswordResetToken(token: string): Promise<boolean> {
    const userId = await this.redisRepository.getEntry(`password_reset:${token}`);
    return !!userId;
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.redisRepository.getEntry(`verify_email:${token}`); // Verify email verification token
    if (!userId) throw new CustomHttpException('INVALID_OR_EXPIRED_VERIFY_EMAIL_TOKEN', 'Invalid or expired verify email token', 'ERROR_INVALID_OR_EXPIRED_VERIFY_EMAIL_TOKEN', HttpStatus.BAD_REQUEST);
    await this.userService.updateEmailVerified(userId, true);
    await this.revokeVerifyEmailToken(token);
    return;
  }

  async sendVerifyEmail(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.BAD_REQUEST);
    if (user.isEmailVerified) throw new CustomHttpException('EMAIL_ALREADY_VERIFIED', 'Email already verified', 'ERROR_EMAIL_ALREADY_VERIFIED', HttpStatus.BAD_REQUEST);
    const verifyEmailToken = crypto.randomBytes(32).toString('hex');
    await this.redisRepository.setEntry(`verify_email:${verifyEmailToken}`, user.id.toString(), 60 * 60);
    try {
      await this.sendgrid.send({
        to: user.email,
        from: this.SENDGRID_SENDER_EMAIL,
        subject: 'Verify your email for Matcha',
        html: `<p>Click <a href="${this.FRONTEND_URL}/auth/verify-email?token=${verifyEmailToken}">here</a> to verify your email.</p>`
      });
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred please try again later', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return;
  }
}
