import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { ChatService } from './chat.service';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get('conversations')
  @UseGuards(AuthGuard)
  async findAllConversations(@CurrentUser('sub') userId: string) {
    const conversations = await this.chatService.findAllConversations(userId);
    return { success: true, data: conversations, messageKey: 'SUCCESS_FIND_ALL_CONVERSATIONS' };
  }
}
