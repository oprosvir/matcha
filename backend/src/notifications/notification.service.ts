import { HttpStatus, Injectable } from '@nestjs/common';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationType } from 'src/common/enums/notification-type';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { CreateNotificationRequestDto } from './dto/create-notification/create-notification-request.dto';
import { CreateNotificationResponseDto } from './dto/create-notification/create-notification-response.dto';
import { Notification } from './repositories/notification.repository';
import { ReadNotificationsRequestDto } from './dto/read-notifications-request/read-notifications-request.dto';
import { WebSocketEmitter } from 'src/event/web-socket-emitter';

type NotificationLike = {
  id: string;
  read: boolean;
  type: NotificationType.LIKE;
  payload: {
    fromUserId: string;
    fromUserFirstName: string;
    fromUserLastName: string;
  };
  createdAt: string;
}

type NotificationMatch = {
  id: string;
  read: boolean;
  type: NotificationType.MATCH;
  payload: {
    withUserId: string;
    withUserFirstName: string;
    withUserLastName: string;
  };
  createdAt: string;
}

type NotificationView = {
  id: string;
  read: boolean;
  type: NotificationType.VIEW;
  payload: {
    viewerUserId: string;
    viewerUserFirstName: string;
    viewerUserLastName: string;
  };
  createdAt: string;
}

type NotificationUnlike = {
  id: string;
  read: boolean;
  type: NotificationType.UNLIKE;
  payload: {
    fromUserId: string;
    fromUserFirstName: string;
    fromUserLastName: string;
  };
  createdAt: string;
}

export type NotificationEvent = NotificationLike | NotificationMatch | NotificationView | NotificationUnlike;

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository, private readonly usersRepository: UsersRepository, private readonly webSocketEmitter: WebSocketEmitter) { }

  private async getNotificationEventContent(notification: CreateNotificationResponseDto): Promise<NotificationEvent> {
    const sourceUser = await this.usersRepository.findById(notification.sourceUserId);
    if (!sourceUser) {
      throw new CustomHttpException('NOTIFICATION_USER_NOT_FOUND', 'Notification user not found.', 'ERROR_NOTIFICATION_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    switch (notification.type) {
      case NotificationType.LIKE:
        return {
          id: notification.id,
          read: notification.read,
          type: NotificationType.LIKE,
          payload: {
            fromUserId: sourceUser.id,
            fromUserFirstName: sourceUser.firstName,
            fromUserLastName: sourceUser.lastName,
          },
          createdAt: notification.createdAt,
        };
      case NotificationType.MATCH:
        return {
          id: notification.id,
          read: notification.read,
          type: NotificationType.MATCH,
          payload: {
            withUserId: sourceUser.id,
            withUserFirstName: sourceUser.firstName,
            withUserLastName: sourceUser.lastName,
          },
          createdAt: notification.createdAt,
        };
      case NotificationType.VIEW:
        return {
          id: notification.id,
          read: notification.read,
          type: NotificationType.VIEW,
          payload: {
            viewerUserId: sourceUser.id,
            viewerUserFirstName: sourceUser.firstName,
            viewerUserLastName: sourceUser.lastName,
          },
          createdAt: notification.createdAt,
        }
      case NotificationType.UNLIKE:
        return {
          id: notification.id,
          read: notification.read,
          type: NotificationType.UNLIKE,
          payload: {
            fromUserId: sourceUser.id,
            fromUserFirstName: sourceUser.firstName,
            fromUserLastName: sourceUser.lastName,
          },
          createdAt: notification.createdAt,
        };
      default:
        throw new CustomHttpException('NOTIFICATION_TYPE_NOT_FOUND', 'Notification type not found.', 'ERROR_NOTIFICATION_TYPE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
  }

  async createNotification(createNotificationRequestDto: CreateNotificationRequestDto): Promise<CreateNotificationResponseDto> {
    const newNotification = await this.notificationRepository.createNotification(createNotificationRequestDto);
    const notificationEvent: NotificationEvent = await this.getNotificationEventContent(newNotification);
    this.webSocketEmitter.emitToUser(createNotificationRequestDto.userId, notificationEvent.type, notificationEvent.payload);
    return newNotification;
  }

  async findAllNotifications(userId: string): Promise<NotificationEvent[]> {
    const notifications: Notification[] = await this.notificationRepository.findAllNotifications(userId);
    const notificationEvents: NotificationEvent[] = [];
    for (const notification of notifications) {
      notificationEvents.push(await this.getNotificationEventContent({
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        sourceUserId: notification.source_user_id,
        read: notification.read,
        createdAt: notification.created_at.toISOString(),
      }));
    }
    return notificationEvents;
  }

  async readNotifications(userId: string, readNotificationsRequestDto: ReadNotificationsRequestDto): Promise<void> {
    await this.notificationRepository.updateNotificationsReadStatusBatch(userId, readNotificationsRequestDto.notificationIds);
  }
}
