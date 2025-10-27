import { HttpStatus, Injectable, Inject, forwardRef } from '@nestjs/common';
import { MessagesRepository } from './repositories/message.repository';
import { MessageResponseDto } from './dto/message.dto';
import { ChatDto } from 'src/chat/dto/chat.dto';
import { ChatRepository } from 'src/chat/repositories/chat.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { WebSocketEmitter } from 'src/event/web-socket-emitter';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly chatRepository: ChatRepository,
    @Inject(forwardRef(() => WebSocketEmitter)) private readonly webSocketEmitter: WebSocketEmitter
  ) { }

  async createMessage(chatId: string, senderId: string, content: string): Promise<MessageResponseDto> {
    const chat: ChatDto | null = await this.chatRepository.findChatById(chatId);
    if (!chat) {
      throw new CustomHttpException('NOT_FOUND', 'Chat not found.', 'ERROR_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (chat.user1_id !== senderId && chat.user2_id !== senderId) {
      throw new CustomHttpException('FORBIDDEN', 'You are not allowed to send messages to this chat.', 'ERROR_FORBIDDEN', HttpStatus.FORBIDDEN);
    }
    const message: MessageResponseDto = await this.messagesRepository.createMessage(chatId, senderId, content);
    this.webSocketEmitter.emitToRoom(chatId, 'newMessage', message); // Broadcast to all clients in the chat room
    return message;
  }

  async markAsRead(messageId: string): Promise<MessageResponseDto> {
    return this.messagesRepository.updateMessageReadStatusById(messageId, true);
  }

  async findAllMessagesByChatId(chatId: string, senderId: string): Promise<MessageResponseDto[]> {
    const chat: ChatDto | null = await this.chatRepository.findChatById(chatId);
    if (!chat) {
      throw new CustomHttpException('NOT_FOUND', 'Chat not found.', 'ERROR_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    console.log("chat: ", chat);
    console.log("senderId: ", senderId);
    console.log("chat.user1_id: ", chat.user1_id);
    console.log("chat.user2_id: ", chat.user2_id);
    if (chat.user1_id !== senderId && chat.user2_id !== senderId) {
      throw new CustomHttpException('FORBIDDEN', 'You are not allowed to access this chat.', 'ERROR_FORBIDDEN', HttpStatus.FORBIDDEN);
    }
    return this.messagesRepository.findAllMessagesByChatId(chatId);
  }
}
