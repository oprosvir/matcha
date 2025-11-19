import { Injectable, Inject, forwardRef, HttpStatus } from '@nestjs/common';
import { ChatService } from 'src/chat/chat.service';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { MessagesService } from 'src/messages/message.service';
import { UsersRepository } from 'src/users/repositories/users.repository';

@Injectable()
export class EventService {
  constructor(
    @Inject(forwardRef(() => MessagesService)) private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => UsersRepository)) private readonly usersRepository: UsersRepository,
    @Inject(forwardRef(() => ChatService)) private readonly chatService: ChatService
  ) { }

  async handleSendMessageEvent(chatId: string, senderUserId: string, content: string): Promise<void> {
    await this.messagesService.createMessage({ chatId, senderId: senderUserId, content });
  }

  async handleReadMessagesEvent(userId: string, messageIds: string[]): Promise<void> {
    await this.messagesService.readMessages(userId, { messageIds });
  }

  async handlePingEvent(userId: string): Promise<void> {
    await this.usersRepository.updateLastTimeActive(userId);
  }
}
