import { Post, Body, UseGuards, Get, Param, Controller } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { MessagesService } from './message.service';
import { CurrentUser } from 'src/auth/current-user.decorators';

@Controller('messages')
export class MessageController {
  constructor(private readonly messagesService: MessagesService) { }

  @UseGuards(AuthGuard)
  @Get(':chatId')
  async findAllByChatId(@Param('chatId') chatId: string, @CurrentUser('sub') userId: string) {
    const messages = await this.messagesService.findAllMessagesByChatId(chatId, userId);
    console.log("messages: ", messages);
    return { success: true, data: messages, messageKey: 'SUCCESS_FIND_ALL_MESSAGES_BY_CHAT_ID' };
  }
}
