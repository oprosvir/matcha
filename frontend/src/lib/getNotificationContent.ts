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
      return `${notification.payload.fromUserFirstName} ${notification.payload.fromUserLastName} has liked your profile 💖`;
    case NotificationType.MATCH:
      return `You have a new match with ${notification.payload.withUserFirstName} ${notification.payload.withUserLastName} 💑`;
    case NotificationType.VIEW:
      return `${notification.payload.viewerUserFirstName} ${notification.payload.viewerUserLastName} has viewed your profile 👀`;
    case NotificationType.UNLIKE:
      return `${notification.payload.fromUserFirstName} ${notification.payload.fromUserLastName} has unliked you 💔`;
  }
}