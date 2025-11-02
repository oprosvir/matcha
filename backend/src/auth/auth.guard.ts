import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

@Injectable()
export class AuthGuard implements CanActivate {

  private readonly ACCESS_TOKEN_SECRET: string;

  constructor() {
    const access = process.env.ACCESS_TOKEN_SECRET;
    if (!access) {
      throw new Error('JWT secret not configured (ACCESS_TOKEN_SECRET)');
    }
    this.ACCESS_TOKEN_SECRET = access;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException(new CustomHttpException('NO_TOKEN_PROVIDED', 'No token provided', 'ERROR_NO_TOKEN_PROVIDED', HttpStatus.UNAUTHORIZED));
    try {
      const payload = jwt.verify(token, this.ACCESS_TOKEN_SECRET);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException(new CustomHttpException('INVALID_TOKEN', 'Invalid token', 'ERROR_INVALID_TOKEN', HttpStatus.UNAUTHORIZED));
    }
    return true;
  }
}