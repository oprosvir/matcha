import { HttpStatus, Injectable } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";
import { MessageResponseDto } from "../dto/message.dto";

@Injectable()
export class MessagesRepository {
  constructor(private readonly db: DatabaseService) { }

  async createMessage(chatId: string, senderId: string, content: string): Promise<MessageResponseDto> {
    try {
      const result = await this.db.query<MessageResponseDto>(`INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *`, [chatId, senderId, content]);
      return result.rows[0];
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateMessageReadStatusById(messageId: string, isRead: boolean): Promise<MessageResponseDto> {
    try {
      const result = await this.db.query<MessageResponseDto>(`UPDATE messages SET is_read = $1 WHERE id = $2 RETURNING *`, [isRead, messageId]);
      return result.rows[0];
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
