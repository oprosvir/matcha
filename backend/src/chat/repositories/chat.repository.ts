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
          user1_id,
          user2_id,
          created_at
      `, [user1, user2]);
      return result.rows[0];
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllChats(userId: string): Promise<ChatDto[]> {
    try {
      const result = await this.db.query<ChatDto[]>(`
        SELECT 
          id,
          user1_id,
          user2_id,
          created_at
        FROM chats 
        WHERE user1_id = $1 OR user2_id = $1
      `, [userId]);
      return result.rows;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findChatById(chatId: string): Promise<ChatDto | null> {
    try {
      const result = await this.db.query<ChatDto>(`SELECT * FROM chats WHERE id = $1`, [chatId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
