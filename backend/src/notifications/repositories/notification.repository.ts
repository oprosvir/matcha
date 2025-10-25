import { DatabaseService } from "src/database/database.service";
import { HttpStatus, Injectable } from "@nestjs/common";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";

export enum NotificationType {
  LIKE = 'like',      // "FirstName LastName liked your profile 💖"
  MATCH = 'match',    // "You have a new match with FirstName LastName! 💞"
  VIEW = 'view',      // "FirstName LastName viewed your profile 🕵️"
  UNLIKE = 'unlike',  // "FirstName LastName unliked your profile 😔"
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  source_user_id: string;
  read: boolean;
  created_at: Date;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly db: DatabaseService) { }

  async createNotification(user_id: string, type: NotificationType, source_user_id: string): Promise<Notification> {
    try {
      const result = await this.db.query<Notification>(`INSERT INTO notifications (user_id, type, source_user_id) VALUES ($1, $2, $3) RETURNING *`, [user_id, type, source_user_id]);
      return {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        type: result.rows[0].type,
        source_user_id: result.rows[0].source_user_id,
        read: result.rows[0].read,
        created_at: result.rows[0].created_at,
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
