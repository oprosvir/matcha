import { Injectable, UnauthorizedException, OnModuleInit, BadRequestException } from '@nestjs/common';
import { UserService } from '../users/user.service';
import * as jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import * as crypto from 'crypto';
import { Resend } from 'resend';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly userService: UserService) { }

  private readonly ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  private readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
  private readonly redisClient = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async onModuleInit() {
    await this.redisClient.connect();
  }

  async register(email: string, password: string, firstName: string, lastName: string, username: string) {
    const existing = await this.userService.findByEmail(email);
    if (existing) throw new UnauthorizedException('Email already in use');
    const user = await this.userService.create(email, password, firstName, lastName, username);
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    return { accessToken, refreshToken, userId: user.id };
  }

  async login(username: string, password: string) {
    const valid = await this.userService.validatePassword(username, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const user = await this.userService.findByUsername(username);
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    return { accessToken, refreshToken, userId: user.id };
  }

  async revokeRefreshToken(userId: string) {
    await this.redisClient.del(`refresh_token:${userId}`);
  }

  private generateAccessToken(user: { id: string, email: string }) {
    return jwt.sign({ sub: user.id, email: user.email }, this.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  }

  async generateRefreshToken(user: any) {
    const refreshToken = jwt.sign({ sub: user.id }, this.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    await this.redisClient.set(`refresh_token:${user.id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });
    return refreshToken;
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      // Verify the refresh token signature
      const payload: any = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET);

      // Check if the refresh token exists in Redis
      const storedToken = await this.redisClient.get(`refresh_token:${payload.sub}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user and generate new access token
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return;
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store token in Redis with 1 hour expiration
    await this.redisClient.set(
      `password_reset:${resetToken}`,
      user.id.toString(),
      { EX: 60 * 60 } // 1 hour
    );

    this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: 'Reset your password for Matcha',
      html: `<p>Click <a href="http://localhost:5173/reset-password?token=${resetToken}">here</a> to reset your password.</p>`
    });

    return;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    // TODO: Validate password strength

    const userId = await this.redisClient.get(`password_reset:${token}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    await this.userService.updatePassword(userId, newPassword);

    await this.redisClient.del(`password_reset:${token}`);

    await this.revokeRefreshToken(userId);
  }

  async verifyResetToken(token: string): Promise<boolean> {
    const userId = await this.redisClient.get(`password_reset:${token}`);
    return !!userId;
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.redisClient.get(`verify_email:${token}`);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired verify email token');
    }
    await this.userService.updateEmailVerified(userId, true);
    await this.revokeVerifyEmailToken(userId);
  }

  async verifyEmailToken(token: string): Promise<boolean> {
    const userId = await this.redisClient.get(`verify_email:${token}`);
    return !!userId;
  }

  async revokeVerifyEmailToken(userId: string) {
    await this.redisClient.del(`verify_email:${userId}`);
  }

  async sendVerifyEmail(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.is_email_verified) {
      throw new UnauthorizedException('Email already verified');
    }
    const verifyEmailToken = crypto.randomBytes(32).toString('hex');
    await this.redisClient.set(`verify_email:${verifyEmailToken}`, user.id.toString(), { EX: 60 * 60 });
    this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: 'Verify your email for Matcha',
      html: `<p>Click <a href="http://localhost:5173/verify-email?token=${verifyEmailToken}">here</a> to verify your email.</p>`
    });
    return;
  }
}
