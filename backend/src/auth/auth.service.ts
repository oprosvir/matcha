import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { UserService } from '../users/user.service';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Resend } from 'resend';
import { PrivateUserResponseDto } from 'src/users/dto/user-response.dto';
import { SignUpResponseDto } from './dto/sign-up-response.dto';
import { SignInResponseDto } from './dto/sign-in-response.dto';
import { AuthRepository } from './repositories/auth.repository';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly authRepository: AuthRepository) { }

  private readonly ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  private readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  private isValidPassword(password: string): boolean {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;
    return strongPasswordRegex.test(password);
  }

  private generateAccessToken(user: { id: string, email: string }): string {
    return jwt.sign({ sub: user.id, email: user.email }, this.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  }

  private async revokeVerifyEmailToken(token: string) {
    await this.authRepository.deleteEntry(`verify_email:${token}`);
  }


  private async revokePasswordResetToken(token: string) {
    await this.authRepository.deleteEntry(`password_reset:${token}`);
  }

  private async generateRefreshToken(user: { id: string }): Promise<string> {
    const refreshToken = jwt.sign({ sub: user.id }, this.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    await this.authRepository.setEntry(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60);
    return refreshToken;
  }

  async revokeRefreshToken(userId: string) {
    await this.authRepository.deleteEntry(`refresh_token:${userId}`);
  }

  async signUp(email: string, password: string, firstName: string, lastName: string, username: string): Promise<SignUpResponseDto> {
    if (!this.isValidPassword(password)) throw new BadRequestException('Password is not strong enough');
    const existingUser: PrivateUserResponseDto | null = await this.userService.findByEmailOrUsername(email, username);
    if (existingUser) throw new ConflictException('Email or username already exists');
    const newUser: PrivateUserResponseDto = await this.userService.create({ username, email, firstName, lastName, password });
    const accessToken = this.generateAccessToken({ id: newUser.id, email: newUser.email });
    const refreshToken = await this.generateRefreshToken({ id: newUser.id });
    return { accessToken, refreshToken, userId: newUser.id };
  }

  async signIn(username: string, password: string): Promise<SignInResponseDto> {
    const user = await this.userService.findByUsername(username);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await this.userService.validatePassword(username, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new BadRequestException('No refresh token provided');
    try {
      const payload: any = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET);
      const storedToken = await this.authRepository.getEntry(`refresh_token:${payload.sub}`);
      if (!storedToken || storedToken !== refreshToken) throw new BadRequestException('Invalid refresh token');
      const user = await this.userService.findById(payload.sub);
      if (!user) throw new BadRequestException('User not found');
      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) throw new BadRequestException('Invalid refresh token');
      if (error instanceof jwt.TokenExpiredError) throw new BadRequestException('Refresh token expired');
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');
    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.authRepository.setEntry(`password_reset:${resetToken}`, user.id, 60 * 60);
    this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: 'Reset your password for Matcha',
      html: `<p>Click <a href="http://localhost:5173/auth/reset-password?token=${resetToken}">here</a> to reset your password.</p>`
    });
    return;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) throw new BadRequestException('Token and new password are required');
    if (!this.isValidPassword(newPassword)) throw new BadRequestException('Password is not strong enough');
    const userId = await this.authRepository.getEntry(`password_reset:${token}`);
    if (!userId) throw new BadRequestException('Invalid or expired reset token');
    await this.userService.updatePassword(userId, newPassword);
    await this.revokePasswordResetToken(token); // Revoke password reset token
    await this.revokeRefreshToken(userId); // Revoke refresh token
  }

  async verifyResetToken(token: string): Promise<boolean> {
    const userId = await this.authRepository.getEntry(`password_reset:${token}`);
    return !!userId;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const userId = await this.authRepository.getEntry(`verify_email:${token}`); // Verify email verification token
    if (!userId) return false;
    await this.userService.updateEmailVerified(userId, true);
    await this.revokeVerifyEmailToken(token);
    return true;
  }

  async sendVerifyEmail(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');
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
