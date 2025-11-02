import { z } from "zod";

export const NotificationType = {
  LIKE: 'like' as const,
  MATCH: 'match' as const,
  VIEW: 'view' as const,
  UNLIKE: 'unlike' as const,
} as const;

const BaseNotificationSchema = z.object({
  id: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

export const NotificationLikeSchema = BaseNotificationSchema.extend({
  type: z.literal(NotificationType.LIKE),
  payload: z.object({
    fromUserId: z.string(),
    fromUserFirstName: z.string(),
    fromUserLastName: z.string(),
  }),
});

export const NotificationMatchSchema = BaseNotificationSchema.extend({
  type: z.literal(NotificationType.MATCH),
  payload: z.object({
    withUserId: z.string(),
    withUserFirstName: z.string(),
    withUserLastName: z.string(),
  }),
});

export const NotificationViewSchema = BaseNotificationSchema.extend({
  type: z.literal(NotificationType.VIEW),
  payload: z.object({
    viewerUserId: z.string(),
    viewerUserFirstName: z.string(),
    viewerUserLastName: z.string(),
  }),
});

export const NotificationUnlikeSchema = BaseNotificationSchema.extend({
  type: z.literal(NotificationType.UNLIKE),
  payload: z.object({
    fromUserId: z.string(),
    fromUserFirstName: z.string(),
    fromUserLastName: z.string(),
  }),
});

export const NotificationSchema = z.discriminatedUnion("type", [
  NotificationLikeSchema,
  NotificationMatchSchema,
  NotificationViewSchema,
  NotificationUnlikeSchema,
]);

export type NotificationLike = z.infer<typeof NotificationLikeSchema>;
export type NotificationMatch = z.infer<typeof NotificationMatchSchema>;
export type NotificationView = z.infer<typeof NotificationViewSchema>;
export type NotificationUnlike = z.infer<typeof NotificationUnlikeSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
