import { HttpStatus, Injectable, Inject, forwardRef } from '@nestjs/common';
import { MessagesRepository } from './repositories/message.repository';
import { CreateMessageResponseDto } from './dto/create-message/create-message-response.dto';
import { CreateMessageRequestDto } from './dto/create-message/create-message-request.dto';
import { FindAllByChatIdResponseDto } from './dto/find-all-by-chat-id/find-all-by-chat-id-response.dto';
import { ChatDto } from 'src/chat/dto/chat.dto';
import { ChatRepository } from 'src/chat/repositories/chat.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { WebSocketEmitter } from 'src/event/web-socket-emitter';
import { MessageDto } from './dto/message.dto';
import { ReadMessagesRequestDto } from './dto/read-messages/read-messages-request.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly chatRepository: ChatRepository,
    @Inject(forwardRef(() => WebSocketEmitter)) private readonly webSocketEmitter: WebSocketEmitter
  ) { }

  private sendMessageToUser(userId: string, message: MessageDto): void {
    this.webSocketEmitter.emitToUser(userId, 'newMessage', message);
  }

  async createMessage(createMessageRequestDto: CreateMessageRequestDto): Promise<CreateMessageResponseDto> {
    const chat: ChatDto | null = await this.chatRepository.findChatById(createMessageRequestDto.chatId);
    if (!chat) {
      throw new CustomHttpException('NOT_FOUND', 'Chat not found.', 'ERROR_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (chat.user1Id !== createMessageRequestDto.senderId && chat.user2Id !== createMessageRequestDto.senderId) {
      throw new CustomHttpException('FORBIDDEN', 'You are not allowed to send messages to this chat.', 'ERROR_FORBIDDEN', HttpStatus.FORBIDDEN);
    }
    const receiverUserId = chat.user1Id === createMessageRequestDto.senderId ? chat.user2Id : chat.user1Id;
    const message: CreateMessageResponseDto = await this.messagesRepository.createMessage(createMessageRequestDto);
    this.sendMessageToUser(receiverUserId, message.message);
    return message;
  }

  async findAllMessagesByChatId(chatId: string, senderId: string): Promise<FindAllByChatIdResponseDto> {
    const chat: ChatDto = await this.chatRepository.findChatById(chatId);
    if (chat.user1Id !== senderId && chat.user2Id !== senderId) {
      throw new CustomHttpException('FORBIDDEN', 'You are not allowed to access this chat.', 'ERROR_FORBIDDEN', HttpStatus.FORBIDDEN);
    }
    return await this.messagesRepository.findAllMessagesByChatId(chatId);
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    return await this.messagesRepository.countUnreadMessagesByUserId(userId);
  }

  async readMessages(userId: string, readMessagesRequestDto: ReadMessagesRequestDto): Promise<void> {
    await this.messagesRepository.markMessagesAsRead(userId, readMessagesRequestDto.messageIds);
  }
}
