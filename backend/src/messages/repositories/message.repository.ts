import { HttpStatus, Injectable } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";
import { CreateMessageResponseDto } from "../dto/create-message/create-message-response.dto";
import { CreateMessageRequestDto } from "../dto/create-message/create-message-request.dto";
import { FindAllByChatIdResponseDto } from "../dto/find-all-by-chat-id/find-all-by-chat-id-response.dto";
import { MessageDto } from "../dto/message.dto";

@Injectable()
export class MessagesRepository {
  constructor(private readonly db: DatabaseService) { }

  async createMessage(createMessageRequestDto: CreateMessageRequestDto): Promise<CreateMessageResponseDto> {
    try {
      const result = await this.db.query<CreateMessageResponseDto>(`
        INSERT INTO messages (chat_id, sender_id, content) 
        VALUES ($1, $2, $3) 
        RETURNING 
          id,
          chat_id as "chatId",
          sender_id as "senderId",
          content as "content",
          created_at as "createdAt"
      `, [createMessageRequestDto.chatId, createMessageRequestDto.senderId, createMessageRequestDto.content]);
      return { message: result.rows[0] };
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllMessagesByChatId(chatId: string): Promise<FindAllByChatIdResponseDto> {
    try {
      const result = await this.db.query<MessageDto>(`
        SELECT 
          id,
          chat_id as "chatId",
          sender_id as "senderId",
          content as "content",
          read as "read",
          created_at as "createdAt"
        FROM messages 
        WHERE chat_id = $1
      `, [chatId]);
      return { messages: result.rows };
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async countUnreadMessagesByUserId(userId: string): Promise<number> {
    try {
      const result = await this.db.query<{ count: string }>(
        `
        SELECT COUNT(m.id) AS count
        FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE (c.user1_id = $1 OR c.user2_id = $1)
          AND m.sender_id <> $1
          AND (m.read IS NOT TRUE)
        `,
        [userId]
      );
      return parseInt(result.rows[0]?.count ?? '0', 10);
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async markMessagesAsRead(userId: string, messageIds: string[]): Promise<void> {
    if (!messageIds || messageIds.length === 0) return;
    try {
      const params = [userId, ...messageIds];
      const idsPlaceholders = messageIds.map((_, idx) => `$${idx + 2}`).join(',');
      await this.db.query(
        `
        UPDATE messages m
        SET read = TRUE
        FROM chats c
        WHERE m.chat_id = c.id
          AND m.id IN (${idsPlaceholders})
          AND (c.user1_id = $1 OR c.user2_id = $1)
          AND m.sender_id <> $1
        `,
        params
      );
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
