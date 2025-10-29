import apiClient from '@/lib/apiClient';
import { parseApiResponse } from '../parseResponse';
import { createApiResponseSchema } from '../schema';
import { getToastMessage } from '@/lib/messageMap';
import type { Messages } from '@/types/chat';
import { MessagesSchema } from '@/types/chat';
import { z } from 'zod';

const FindAllByChatIdResponseSchema = z.object({ messages: MessagesSchema });

export const messageApi = {
  findAllByChatId: async (chatId: string): Promise<Messages> => {
    const response = await parseApiResponse(apiClient.get(`/messages/${chatId}`), createApiResponseSchema(FindAllByChatIdResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data.messages;
  },
};
