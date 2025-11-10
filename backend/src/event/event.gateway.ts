import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { HttpStatus, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { EventService } from './event.service';
import { Socket } from 'socket.io';
import { WebSocketEmitter } from './web-socket-emitter';
import * as jwt from 'jsonwebtoken';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly ACCESS_TOKEN_SECRET: string;

  constructor(
    private readonly eventService: EventService,
    private readonly webSocketEmitter: WebSocketEmitter
  ) {
    const access = process.env.ACCESS_TOKEN_SECRET;
    if (!access) {
      throw new Error('JWT secret not configured (ACCESS_TOKEN_SECRET)');
    }
    this.ACCESS_TOKEN_SECRET = access;
  }

  onModuleInit() {
    this.webSocketEmitter.setServer(this.server);
    this.server.use((socket, next) => {
      const token = socket.handshake.auth.accessToken;
      if (!token) {
        return next(new CustomHttpException('NO_TOKEN_PROVIDED', 'No token provided', 'ERROR_NO_TOKEN_PROVIDED', HttpStatus.UNAUTHORIZED));
      }
      try {
        const payload = jwt.verify(token, this.ACCESS_TOKEN_SECRET);
        socket.data.user = payload;
        return next();
      } catch {
        return next(new CustomHttpException('INVALID_TOKEN', 'Invalid token', 'ERROR_INVALID_TOKEN', HttpStatus.UNAUTHORIZED));
      }
    });
  }

  handleConnection(client: Socket) {
    client.join(`user:${client.data.user.sub}`);
    console.log(`User ${client.data.user.sub} connected`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { chatId: string; content: string },
    @ConnectedSocket() client: Socket
  ) {
    if (!client.data.user.sub) {
      throw new WsException('Invalid user'); // Should never happen
    }
    await this.eventService.handleSendMessageEvent(data.chatId, client.data.user.sub, data.content);
  }

  @SubscribeMessage('readMessages')
  async handleReadMessages(
    @MessageBody() data: { messageIds: string[] },
    @ConnectedSocket() client: Socket
  ) {
    if (!client.data.user.sub) {
      throw new WsException('Invalid user');
    }
    await this.eventService.handleReadMessagesEvent(client.data.user.sub, data.messageIds);
  }

  @SubscribeMessage('ping')
  async handlePing(
    @ConnectedSocket() client: Socket
  ) {
    if (!client.data.user.sub) {
      throw new WsException('Invalid user');
    }
    await this.eventService.handlePingEvent(client.data.user.sub);
  }
}
