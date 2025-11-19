import { DatabaseService } from "src/database/database.service";
import { HttpStatus, Injectable } from "@nestjs/common";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";
import { CreateNotificationRequestDto } from "../dto/create-notification/create-notification-request.dto";
import { CreateNotificationResponseDto } from "../dto/create-notification/create-notification-response.dto";
import { NotificationType } from "src/common/enums/notification-type";

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

  async createNotification(createNotificationRequestDto: CreateNotificationRequestDto): Promise<CreateNotificationResponseDto> {
    try {
      const result = await this.db.query<CreateNotificationResponseDto>(`INSERT INTO notifications (user_id, type, source_user_id) VALUES ($1, $2, $3) RETURNING id, user_id as "userId", type as "type", source_user_id as "sourceUserId", read as "isRead", created_at as "createdAt"`, [createNotificationRequestDto.userId, createNotificationRequestDto.type, createNotificationRequestDto.sourceUserId]);
      return result.rows[0];
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllNotifications(userId: string): Promise<Notification[]> {
    try {
      const result = await this.db.query<Notification>(`SELECT id, user_id, type, source_user_id, read, created_at FROM notifications WHERE user_id = $1 AND read = FALSE`, [userId]);
      return result.rows;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateNotificationsReadStatusBatch(userId: string, notificationIds: string[]): Promise<void> {
    try {
      await this.db.query(
        `UPDATE notifications SET read = TRUE WHERE user_id = $1 AND id = ANY($2)`,
        [userId, notificationIds]
      );
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
