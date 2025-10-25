import { HttpStatus, Injectable } from "@nestjs/common";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";
import { DatabaseService } from "src/database/database.service";

export interface Chat {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Date;
}

@Injectable()
export class ChatRepository {
  constructor(private readonly db: DatabaseService) { }

  async createChat(user1Id: string, user2Id: string): Promise<Chat> {
    const [user1, user2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    try {
      const result = await this.db.query<Chat>(`INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING *`, [user1, user2]);
      return {
        id: result.rows[0].id,
        user1Id: result.rows[0].user1_id,
        user2Id: result.rows[0].user2_id,
        createdAt: result.rows[0].created_at,
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}