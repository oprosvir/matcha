import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { MessagesService } from 'src/messages/message.service';

@Injectable()
export class EventService {
  constructor(
    @Inject(forwardRef(() => MessagesService)) private readonly messagesService: MessagesService
  ) { }

  async handleSendMessageEvent(chatId: string, fromUserId: string, content: string): Promise<void> {
    await this.messagesService.createMessage(chatId, fromUserId, content);
  }
}
