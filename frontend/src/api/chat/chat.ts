import apiClient from '@/lib/apiClient';
import { parseApiResponse } from '../parseResponse';
import { createApiResponseSchema } from '../schema';
import { getToastMessage } from '@/lib/messageMap';
import { type Conversations } from '@/types/chat';
import { ConversationsSchema } from '@/types/chat';

export const chatApi = {
  findAllConversations: async (): Promise<Conversations> => {
    const response = await parseApiResponse(apiClient.get('/chats/conversations'), createApiResponseSchema(ConversationsSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data;
  },
};
