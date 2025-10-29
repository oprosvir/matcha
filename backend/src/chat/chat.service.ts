import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { ChatRepository } from './repositories/chat.repository';
import { ChatDto } from './dto/chat.dto';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { FindAllConversationsResponseDto } from './dto/conversation/find-all-conversations-response.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    @Inject(forwardRef(() => UsersRepository))
    private readonly userRepository: UsersRepository
  ) { }

  async findAllConversations(userId: string): Promise<FindAllConversationsResponseDto> {
    const chats: ChatDto[] = await this.chatRepository.findAllChats(userId);
    const userIds = chats.map(chat => chat.user1Id === userId ? chat.user2Id : chat.user1Id);
    const users = await this.userRepository.findAllPreviewByIds(userIds);
    const conversations: FindAllConversationsResponseDto = {
      conversations: chats.map(chat => ({
        chatId: chat.id,
        profilePreview: users.find(user => user.id === (chat.user1Id === userId ? chat.user2Id : chat.user1Id))!,
        createdAt: chat.createdAt,
      })),
    };
    return conversations;
  }
}
