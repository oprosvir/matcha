import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { EventService } from './event.service';
import { Socket } from 'socket.io';
import { WebSocketEmitter } from './web-socket-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly eventService: EventService,
    private readonly webSocketEmitter: WebSocketEmitter
  ) { }

  onModuleInit() {
    this.webSocketEmitter.setServer(this.server);
  }

  handleConnection(client: Socket) {
    client.join(`user:${client.data.user.id}`);
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    client.leave(`user:${client.data.user.id}`);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.chatId);
    console.log('This is the client id: ', client.id);
    console.log(`User ${client.id} joined chat ${data.chatId}`);
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.chatId);
    console.log(`User ${client.id} left chat ${data.chatId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { chatId: string; content: string; userId: string },
    @ConnectedSocket() client: Socket
  ) {
    this.eventService.handleSendMessageEvent(data.chatId, data.userId, client.id, data.content);
  }
}
