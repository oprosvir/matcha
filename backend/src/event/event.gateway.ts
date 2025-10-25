import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { SendMessageDto } from './dto/event.dto';
import { WsAuthGuard } from '../auth/ws-auth.guard';
import { WsCurrentUser } from '../auth/ws-current-user.decorator';
import { EventService } from './event.service';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(WsAuthGuard)
export class EventGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly eventService: EventService) { }

  handleConnection(client: Socket) {
    console.log(`Client connected : ${client.id}`);
    console.log(`Authenticated user:`, client.data.user);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected : ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() sendMessageDto: SendMessageDto,
    @WsCurrentUser('sub') fromUserId: string,
  ) {
    console.log(`Message received : ${sendMessageDto.content} from user ${fromUserId} to ${sendMessageDto.toUserId}`);
    await this.eventService.handleSendMessageEvent(fromUserId, sendMessageDto, this.server);
  }
}