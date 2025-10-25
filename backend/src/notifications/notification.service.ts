import { HttpStatus, Injectable } from '@nestjs/common';
import { NotificationRepository, NotificationType, Notification } from './repositories/notification.repository';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { EventGateway } from 'src/event/event.gateway';

type NotificationLike = {
  type: NotificationType.LIKE;
  payload: {
    fromUserId: string;
    fromUserFirstName: string;
    fromUserLastName: string;
  };
  timestamp: string;
}

type NotificationMatch = {
  type: NotificationType.MATCH;
  payload: {
    withUserId: string;
    withUserFirstName: string;
    withUserLastName: string;
  };
  timestamp: string;
}

type NotificationView = {
  type: NotificationType.VIEW;
  payload: {
    viewerUserId: string;
    viewerUserFirstName: string;
    viewerUserLastName: string;
  };
  timestamp: string;
}

type NotificationUnlike = {
  type: NotificationType.UNLIKE;
  payload: {
    fromUserId: string;
    fromUserFirstName: string;
    fromUserLastName: string;
  };
  timestamp: string;
}

type NotificationEvent = NotificationLike | NotificationMatch | NotificationView | NotificationUnlike;

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository, private readonly usersRepository: UsersRepository, private readonly eventGateway: EventGateway) { }

  private async getNotificationEventContent(notification: Notification): Promise<NotificationEvent> {
    const sourceUser = await this.usersRepository.findById(notification.source_user_id);
    if (!sourceUser) {
      throw new CustomHttpException('NOTIFICATION_USER_NOT_FOUND', 'Notification user not found.', 'ERROR_NOTIFICATION_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    switch (notification.type) {
      case NotificationType.LIKE:
        return {
          type: NotificationType.LIKE,
          payload: {
            fromUserId: sourceUser.id,
            fromUserFirstName: sourceUser.first_name,
            fromUserLastName: sourceUser.last_name,
          },
          timestamp: notification.created_at.toISOString(),
        };
      case NotificationType.MATCH:
        return {
          type: NotificationType.MATCH,
          payload: {
            withUserId: sourceUser.id,
            withUserFirstName: sourceUser.first_name,
            withUserLastName: sourceUser.last_name,
          },
          timestamp: notification.created_at.toISOString(),
        };
      case NotificationType.VIEW:
        return {
          type: NotificationType.VIEW,
          payload: {
            viewerUserId: sourceUser.id,
            viewerUserFirstName: sourceUser.first_name,
            viewerUserLastName: sourceUser.last_name,
          },
          timestamp: notification.created_at.toISOString(),
        }
      case NotificationType.UNLIKE:
        return {
          type: NotificationType.UNLIKE,
          payload: {
            fromUserId: sourceUser.id,
            fromUserFirstName: sourceUser.first_name,
            fromUserLastName: sourceUser.last_name,
          },
          timestamp: notification.created_at.toISOString(),
        };
      default:
        throw new CustomHttpException('NOTIFICATION_TYPE_NOT_FOUND', 'Notification type not found.', 'ERROR_NOTIFICATION_TYPE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
  }

  async createNotification(user_id: string, type: NotificationType, source_user_id: string): Promise<Notification> {
    const newNotification = await this.notificationRepository.createNotification(user_id, type, source_user_id);
    const notificationEvent: NotificationEvent = await this.getNotificationEventContent(newNotification);
    this.eventGateway.server.to(user_id).emit('notification', notificationEvent);
    return newNotification;
  }
}
