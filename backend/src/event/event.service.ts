import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/event.dto';
import { MessagesService } from 'src/messages/message.service';
import { Server } from 'socket.io';

@Injectable()
export class EventService {
  constructor(private readonly messagesService: MessagesService) { }

  async handleSendMessageEvent(fromUserId: string, sendMessageDto: SendMessageDto, server: Server): Promise<void> {
    await this.messagesService.createMessage(sendMessageDto.chatId, fromUserId, sendMessageDto.content);
    server.to(sendMessageDto.toUserId).emit('receive_message', sendMessageDto);
  }
}
