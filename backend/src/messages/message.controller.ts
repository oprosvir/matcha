import { Post, Body, UseGuards, Get, Param, Controller } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { MessagesService } from './message.service';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { FindAllByChatIdResponseDto } from './dto/find-all-by-chat-id/find-all-by-chat-id-response.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messagesService: MessagesService) { }

  @UseGuards(AuthGuard)
  @Get(':chatId')
  async findAllByChatId(@Param('chatId') chatId: string, @CurrentUser('sub') userId: string): Promise<{ success: boolean, data: FindAllByChatIdResponseDto, messageKey: string }> {
    const messages: FindAllByChatIdResponseDto = await this.messagesService.findAllMessagesByChatId(chatId, userId);
    return { success: true, data: messages, messageKey: 'SUCCESS_FIND_ALL_MESSAGES_BY_CHAT_ID' };
  }
}
