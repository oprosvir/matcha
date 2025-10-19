import { Injectable, HttpStatus } from '@nestjs/common';
import { UserService } from '../users/user.service';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Resend } from 'resend';
import { PrivateUserResponseDto } from 'src/users/dto/user-response.dto';
import { SignUpResponseDto } from './dto/sign-up-response.dto';
import { SignInResponseDto } from './dto/sign-in-response.dto';
import { AuthRepository } from './repositories/auth.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly authRepository: AuthRepository) { }

  private readonly ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  private readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  // TODO: Check if this is the same policy as the frontend + common english words tester
  private isValidPassword(password: string): boolean {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;
    return strongPasswordRegex.test(password);
  }

  private generateAccessToken(user: { id: string, email: string }): string {
    return jwt.sign({ sub: user.id.toString(), email: user.email }, this.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  }

  private async revokeVerifyEmailToken(token: string) {
    await this.authRepository.deleteEntry(`verify_email:${token}`);
  }


  private async revokePasswordResetToken(token: string) {
    await this.authRepository.deleteEntry(`password_reset:${token}`);
  }

  private async generateRefreshToken(user: { id: string }): Promise<string> {
    const refreshToken = jwt.sign({ sub: user.id.toString() }, this.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    await this.authRepository.setEntry(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60);
    return refreshToken;
  }

  async revokeRefreshToken(userId: string) {
    await this.authRepository.deleteEntry(`refresh_token:${userId}`);
  }

  async signUp(email: string, password: string, firstName: string, lastName: string, username: string): Promise<SignUpResponseDto> {
    if (!this.isValidPassword(password)) throw new CustomHttpException('INVALID_PASSWORD', 'Password is not strong enough', 'ERROR_INVALID_PASSWORD', HttpStatus.BAD_REQUEST);
    const existingUser: PrivateUserResponseDto | null = await this.userService.findByEmailOrUsername(email, username);
    if (existingUser) throw new CustomHttpException('EMAIL_OR_USERNAME_ALREADY_EXISTS', 'Email or username already exists', 'ERROR_EMAIL_OR_USERNAME_ALREADY_EXISTS', HttpStatus.CONFLICT);
    const newUser: PrivateUserResponseDto = await this.userService.create({ username, email, firstName, lastName, password });
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

  async refreshToken(refreshToken: string) {
    if (!refreshToken) throw new CustomHttpException('NO_REFRESH_TOKEN_PROVIDED', 'No refresh token provided', 'ERROR_NO_REFRESH_TOKEN_PROVIDED', HttpStatus.BAD_REQUEST);
    try {
      const payload: any = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET);
      const storedToken = await this.authRepository.getEntry(`refresh_token:${payload.sub}`);
      if (!storedToken || storedToken !== refreshToken) throw new CustomHttpException('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 'ERROR_INVALID_REFRESH_TOKEN', HttpStatus.BAD_REQUEST);
      const user = await this.userService.findById(payload.sub);
      if (!user) throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.BAD_REQUEST);
      const accessToken = this.generateAccessToken(user);
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
    await this.authRepository.setEntry(`password_reset:${resetToken}`, user.id.toString(), 60 * 60);
    this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: 'Reset your password for Matcha',
      html: `<p>Click <a href="http://localhost:5173/auth/reset-password?token=${resetToken}">here</a> to reset your password.</p>`
    });
    return;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) throw new CustomHttpException('TOKEN_AND_NEW_PASSWORD_REQUIRED', 'Token and new password are required', 'ERROR_TOKEN_AND_NEW_PASSWORD_REQUIRED', HttpStatus.BAD_REQUEST);
    if (!this.isValidPassword(newPassword)) throw new CustomHttpException('INVALID_PASSWORD', 'Password is not strong enough', 'ERROR_INVALID_PASSWORD', HttpStatus.BAD_REQUEST);
    const userId = await this.authRepository.getEntry(`password_reset:${token}`);
    if (!userId) throw new CustomHttpException('INVALID_OR_EXPIRED_RESET_TOKEN', 'Invalid or expired reset token', 'ERROR_INVALID_OR_EXPIRED_RESET_TOKEN', HttpStatus.BAD_REQUEST);
    await this.userService.updatePassword(userId, newPassword);
    await this.revokePasswordResetToken(token); // Revoke password reset token
    await this.revokeRefreshToken(userId); // Revoke refresh token
  }

  async verifyPasswordResetToken(token: string): Promise<boolean> {
    const userId = await this.authRepository.getEntry(`password_reset:${token}`);
    return !!userId;
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.authRepository.getEntry(`verify_email:${token}`); // Verify email verification token
    if (!userId) throw new CustomHttpException('INVALID_OR_EXPIRED_VERIFY_EMAIL_TOKEN', 'Invalid or expired verify email token', 'ERROR_INVALID_OR_EXPIRED_VERIFY_EMAIL_TOKEN', HttpStatus.BAD_REQUEST);
    await this.userService.updateEmailVerified(userId, true);
    await this.revokeVerifyEmailToken(token);
    return;
  }

  // TODO: Don't return an error if the email is not found to prevent email enumeration
  async sendVerifyEmail(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.BAD_REQUEST);
    if (user.isEmailVerified) throw new CustomHttpException('EMAIL_ALREADY_VERIFIED', 'Email already verified', 'ERROR_EMAIL_ALREADY_VERIFIED', HttpStatus.BAD_REQUEST);
    const verifyEmailToken = crypto.randomBytes(32).toString('hex');
    await this.authRepository.setEntry(`verify_email:${verifyEmailToken}`, user.id.toString(), 60 * 60);
    this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: 'Verify your email for Matcha',
      html: `<p>Click <a href="http://localhost:5173/auth/verify-email?token=${verifyEmailToken}">here</a> to verify your email.</p>`
    });
    return;
  }
}
