import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      throw new WsException('NO_TOKEN_PROVIDED');
    }

    try {
      const payload = jwt.verify(token, this.ACCESS_TOKEN_SECRET);
      client.data.user = payload; // Attach user data to the socket
      return true;
    } catch {
      throw new WsException('INVALID_TOKEN');
    }
  }

  private extractTokenFromSocket(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      return type === 'Bearer' ? token : undefined;
    }

    const auth = client.handshake.auth;
    if (auth && auth.token) {
      return auth.token;
    }

    const token = client.handshake.query.token as string;
    return token;
  }
}
