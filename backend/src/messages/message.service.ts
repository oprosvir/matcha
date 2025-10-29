import { HttpStatus, Injectable, Inject, forwardRef } from '@nestjs/common';
import { MessagesRepository } from './repositories/message.repository';
import { CreateMessageResponseDto } from './dto/create-message/create-message-response.dto';
import { CreateMessageRequestDto } from './dto/create-message/create-message-request.dto';
import { UpdateMessageReadStatusByIdResponseDto } from './dto/update-message-read-status-by-id/update-message-read-status-by-id-response.dto';
import { FindAllByChatIdResponseDto } from './dto/find-all-by-chat-id/find-all-by-chat-id-response.dto';
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

  async createMessage(createMessageRequestDto: CreateMessageRequestDto): Promise<CreateMessageResponseDto> {
    const chat: ChatDto | null = await this.chatRepository.findChatById(createMessageRequestDto.chatId);
    if (!chat) {
      throw new CustomHttpException('NOT_FOUND', 'Chat not found.', 'ERROR_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (chat.user1Id !== createMessageRequestDto.senderId && chat.user2Id !== createMessageRequestDto.senderId) {
      throw new CustomHttpException('FORBIDDEN', 'You are not allowed to send messages to this chat.', 'ERROR_FORBIDDEN', HttpStatus.FORBIDDEN);
    }
    const message: CreateMessageResponseDto = await this.messagesRepository.createMessage(createMessageRequestDto);
    this.webSocketEmitter.emitToRoom(createMessageRequestDto.chatId, 'newMessage', message, createMessageRequestDto.senderSocketId);
    return message;
  }

  async markAsRead(id: string): Promise<UpdateMessageReadStatusByIdResponseDto> {
    return this.messagesRepository.updateMessageReadStatusById({ id, isRead: true });
  }

  async findAllMessagesByChatId(chatId: string, senderId: string): Promise<FindAllByChatIdResponseDto> {
    const chat: ChatDto = await this.chatRepository.findChatById(chatId);
    if (chat.user1Id !== senderId && chat.user2Id !== senderId) {
      throw new CustomHttpException('FORBIDDEN', 'You are not allowed to access this chat.', 'ERROR_FORBIDDEN', HttpStatus.FORBIDDEN);
    }
    return await this.messagesRepository.findAllMessagesByChatId(chatId);
  }
}
