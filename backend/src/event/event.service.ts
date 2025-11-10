import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { MessagesService } from 'src/messages/message.service';
import { UsersRepository } from 'src/users/repositories/users.repository';

@Injectable()
export class EventService {
  constructor(
    @Inject(forwardRef(() => MessagesService)) private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => UsersRepository)) private readonly usersRepository: UsersRepository
  ) { }

  async handleSendMessageEvent(chatId: string, senderUserId: string, content: string): Promise<void> {
    await this.messagesService.createMessage({ chatId, senderId: senderUserId, content });
  }

  async handleReadMessagesEvent(userId: string, messageIds: string[]): Promise<void> {
    await this.messagesService.readMessages(userId, { messageIds });
  }

  async handlePingEvent(userId: string): Promise<void> {
    console.log('handlePingEvent', userId);
    await this.usersRepository.updateLastTimeActive(userId);
  }
}
