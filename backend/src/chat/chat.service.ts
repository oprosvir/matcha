import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { ChatRepository } from './repositories/chat.repository';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { FindAllConversationsResponseDto } from './dto/conversation/find-all-conversations-response.dto';
import { BlocksRepository } from 'src/users/repositories/blocks.repository';
import { UserService } from 'src/users/user.service';
import { MessagesRepository } from 'src/messages/repositories/message.repository';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    @Inject(forwardRef(() => UsersRepository))
    private readonly userRepository: UsersRepository,
    private readonly blocksRepository: BlocksRepository,
    private readonly userService: UserService,
    private readonly messagesRepository: MessagesRepository
  ) { }

  async canChatWith(userId: string, otherUserId: string): Promise<boolean> {
    const blockedIds = new Set(await this.blocksRepository.getAllBlockedUserIds(userId));
    const matchedIds = new Set((await this.userService.findAllMatches(userId)).users.map(u => u.id));
    return !blockedIds.has(otherUserId) && matchedIds.has(otherUserId);
  }

  async findAllConversations(userId: string): Promise<FindAllConversationsResponseDto> {
    const chats = await this.chatRepository.findAllChats(userId); // All chats the user has
    const blockedIds = new Set(await this.blocksRepository.getAllBlockedUserIds(userId)); // User ids the user is blocked with
    const matchedIds = new Set((await this.userService.findAllMatches(userId)).users.map(u => u.id)); // User ids the user is matched with

    const filteredChats = chats.filter(chat => { // Filter out chats with blocked or matched users
      const otherId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
      return !blockedIds.has(otherId) && matchedIds.has(otherId);
    });

    const userIds = filteredChats.map(chat => chat.user1Id === userId ? chat.user2Id : chat.user1Id); // User ids of all users the user can chat with
    const users = await this.userRepository.findAllPreviewByIds(userIds); // Getting all necessary previews

    // Get unread counts for all chats
    const chatIds = filteredChats.map(chat => chat.id);
    const unreadCounts = await this.messagesRepository.countUnreadMessagesPerChat(userId, chatIds);

    return {
      conversations: filteredChats.map(chat => ({
        chatId: chat.id,
        profilePreview: users.find(u => u.id === (chat.user1Id === userId ? chat.user2Id : chat.user1Id)),
        createdAt: chat.createdAt,
        unreadCount: unreadCounts.get(chat.id) || 0,
      })),
    };
  }
}
