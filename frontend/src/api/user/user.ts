import apiClient from '@/lib/apiClient';
import { parseApiResponse } from '../parseResponse';
import { createApiResponseSchema } from '../schema';
import { UserSchema, type SexualOrientation, type Gender, type User } from '@/types/user';
import { getToastMessage } from '@/lib/messageMap';

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  sexualOrientation?: SexualOrientation;
  biography?: string;
  latitude?: number;
  longitude?: number;
}

interface CompleteProfileRequest {
  dateOfBirth: string;
  gender: Gender;
  sexualOrientation: SexualOrientation;
  biography: string;
  interestIds: number[];
}

export const userApi = {
  getOwnProfile: async (): Promise<User> => {
    const response = await parseApiResponse(apiClient.get('/users/me'), createApiResponseSchema(UserSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data;
  },

  completeProfile: async (request: CompleteProfileRequest): Promise<{ data: User; messageKey: string }> => {
    const response = await parseApiResponse(apiClient.post('/users/me/complete', request), createApiResponseSchema(UserSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return { data: response.data, messageKey: response.messageKey };
  },

  updateProfile: async (request: UpdateProfileRequest): Promise<{ data: User; messageKey: string }> => {
    const response = await parseApiResponse(apiClient.put('/users/me', request), createApiResponseSchema(UserSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return { data: response.data, messageKey: response.messageKey };
  }
};
