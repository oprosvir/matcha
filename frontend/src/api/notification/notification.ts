import apiClient from '@/lib/apiClient';
import { parseApiResponse } from '../parseResponse';
import { createApiResponseSchema } from '../schema';
import { getToastMessage } from '@/lib/messageMap';
import { NotificationSchema, type Notification } from '@/types/notification';
import { z } from 'zod';

const FindAllNotificationsResponseSchema = z.object({ notifications: z.array(NotificationSchema) });

export const notificationApi = {
  findAllNotifications: async (): Promise<Notification[]> => {
    const response = await parseApiResponse(apiClient.get(`/notifications`), createApiResponseSchema(FindAllNotificationsResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data.notifications;
  },

  readNotifications: async (notificationIds: string[]): Promise<void> => {
    const response = await parseApiResponse(apiClient.post(`/notifications/read`, { notificationIds: notificationIds }), createApiResponseSchema(z.void()));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
  },
};
