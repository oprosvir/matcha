import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { ChatService } from './chat.service';
import { FindAllConversationsResponseDto } from './dto/conversation/find-all-conversations-response.dto';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get('conversations')
  @UseGuards(AuthGuard)
  async findAllConversations(@CurrentUser('sub') userId: string): Promise<{ success: boolean, data: FindAllConversationsResponseDto, messageKey: string }> {
    const conversations = await this.chatService.findAllConversations(userId);
    return { success: true, data: conversations, messageKey: 'SUCCESS_FIND_ALL_CONVERSATIONS' };
  }
}
