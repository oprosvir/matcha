import { HttpStatus, Injectable } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";
import { CreateMessageResponseDto } from "../dto/create-message/create-message-response.dto";
import { CreateMessageRequestDto } from "../dto/create-message/create-message-request.dto";
import { UpdateMessageReadStatusByIdRequestDto } from "../dto/update-message-read-status-by-id/update-message-read-status-by-id-request.dto";
import { UpdateMessageReadStatusByIdResponseDto } from "../dto/update-message-read-status-by-id/update-message-read-status-by-id-response.dto";
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
          created_at as "createdAt",
          is_read as "isRead"
      `, [createMessageRequestDto.chatId, createMessageRequestDto.senderId, createMessageRequestDto.content]);
      return result.rows[0];
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateMessageReadStatusById(updateMessageReadStatusByIdRequestDto: UpdateMessageReadStatusByIdRequestDto): Promise<UpdateMessageReadStatusByIdResponseDto> {
    try {
      const result = await this.db.query<UpdateMessageReadStatusByIdResponseDto>(`
        UPDATE messages SET is_read = $1 WHERE id = $2 
        RETURNING 
          id as "id",
          chat_id as "chatId",
          sender_id as "senderId",
          content as "content",
          created_at as "createdAt",
          is_read as "isRead"
      `, [updateMessageReadStatusByIdRequestDto.isRead, updateMessageReadStatusByIdRequestDto.id]);
      return result.rows[0];
    } catch (error) {
      console.error(error);
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
          created_at as "createdAt",
          is_read as "isRead"
        FROM messages 
        WHERE chat_id = $1
      `, [chatId]);
      return { messages: result.rows };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
