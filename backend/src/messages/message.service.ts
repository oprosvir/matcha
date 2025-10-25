import { Injectable } from '@nestjs/common';
import { MessagesRepository } from './repositories/message.repository';
import { MessageResponseDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) { }

  async createMessage(chatId: string, senderId: string, content: string): Promise<MessageResponseDto> {
    return this.messagesRepository.createMessage(chatId, senderId, content);
  }

  async markAsRead(messageId: string): Promise<MessageResponseDto> {
    return this.messagesRepository.updateMessageReadStatusById(messageId, true);
  }
}
