import { NotificationType, type Notification } from "@/types/notification";

export function getNotificationTitle(notification: Notification) {
  switch (notification.type) {
    case NotificationType.LIKE:
      return `New like 💖`;
    case NotificationType.MATCH:
      return `New match 💑`;
    case NotificationType.VIEW:
      return `New view 👀`;
    case NotificationType.UNLIKE:
      return `New unlike 💔`;
  }
}

export function getNotificationDetails(notification: Notification) {
  switch (notification.type) {
    case NotificationType.LIKE:
      return `You have a new like from ${notification.payload.fromUserFirstName} ${notification.payload.fromUserLastName}`;
    case NotificationType.MATCH:
      return `You have a new match with ${notification.payload.withUserFirstName} ${notification.payload.withUserLastName}`;
    case NotificationType.VIEW:
      return `You have a new view from ${notification.payload.viewerUserFirstName} ${notification.payload.viewerUserLastName}`;
    case NotificationType.UNLIKE:
      return `You have a new unlike from ${notification.payload.fromUserFirstName} ${notification.payload.fromUserLastName}`;
  }
}