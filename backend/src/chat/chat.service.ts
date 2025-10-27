import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { ChatRepository } from './repositories/chat.repository';
import { ChatDto } from './dto/chat.dto';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { ConversationDto } from './dto/conversation.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    @Inject(forwardRef(() => UsersRepository))
    private readonly userRepository: UsersRepository
  ) { }

  async findAllConversations(userId: string): Promise<ConversationDto[]> {
    const chats: ChatDto[] = await this.chatRepository.findAllChats(userId);
    const userIds = chats.map(chat => chat.user1_id === userId ? chat.user2_id : chat.user1_id);
    const users = await this.userRepository.findAllPreviewByIds(userIds);
    const conversations: ConversationDto[] = chats.map(chat => ({
      chatId: chat.id,
      profilePreview: users.find(user => user.id === (chat.user1_id === userId ? chat.user2_id : chat.user1_id))!,
      createdAt: chat.created_at,
    }));
    return conversations;
  }
}
