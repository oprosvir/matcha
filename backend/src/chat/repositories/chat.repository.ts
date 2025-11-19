import { HttpStatus, Injectable } from "@nestjs/common";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";
import { DatabaseService } from "src/database/database.service";
import { ChatDto } from "../dto/chat.dto";

@Injectable()
export class ChatRepository {
  constructor(private readonly db: DatabaseService) { }

  async createChat(user1Id: string, user2Id: string): Promise<ChatDto> {
    const [user1, user2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    try {
      const result = await this.db.query<ChatDto>(`
        INSERT INTO chats (user1_id, user2_id) 
        VALUES ($1, $2) 
        RETURNING 
          id,
          user1_id as "user1Id",
          user2_id as "user2Id",
          created_at as "createdAt"
      `, [user1, user2]);
      return result.rows[0];
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findChatByUserIds(user1Id: string, user2Id: string): Promise<ChatDto | null> {
    try {
      const result = await this.db.query<ChatDto>(`SELECT id, user1_id as "user1Id", user2_id as "user2Id", created_at as "createdAt" FROM chats WHERE user1_id = $1 AND user2_id = $2 OR user1_id = $2 AND user2_id = $1`, [user1Id, user2Id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllChats(userId: string): Promise<ChatDto[]> {
    try {
      const result = await this.db.query<ChatDto[]>(`
        SELECT
          c.id,
          c.user1_id as "user1Id",
          c.user2_id as "user2Id",
          c.created_at as "createdAt"
        FROM chats c
        WHERE c.user1_id = $1 OR c.user2_id = $1
        ORDER BY COALESCE(
          (SELECT MAX(m.created_at) FROM messages m WHERE m.chat_id = c.id),
          c.created_at
        ) DESC
      `, [userId]);
      return result.rows;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findChatById(chatId: string): Promise<ChatDto> {
    try {
      const result = await this.db.query<ChatDto>(`SELECT id, user1_id as "user1Id", user2_id as "user2Id", created_at as "createdAt" FROM chats WHERE id = $1`, [chatId]);
      if (result.rows.length === 0) {
        throw new CustomHttpException('NOT_FOUND', 'Chat not found.', 'ERROR_NOT_FOUND', HttpStatus.NOT_FOUND);
      }
      return result.rows[0];
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
