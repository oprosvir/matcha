import apiClient from '@/lib/apiClient';
import { parseApiResponse } from '../parseResponse';
import { createApiResponseSchema } from '../schema';
import { UserSchema, type SexualOrientation, type Gender, type User, type Matches, MatchesSchema } from '@/types/user';
import { getToastMessage } from '@/lib/messageMap';
import { z } from 'zod';

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  sexualOrientation?: SexualOrientation;
  biography?: string;
  latitude?: number;
  longitude?: number;
}

const FindAllMatchesResponseSchema = z.object({ users: MatchesSchema });
const GetOwnProfileResponseSchema = z.object({ user: UserSchema });
const UpdateProfileResponseSchema = z.object({ user: UserSchema });

export const userApi = {
  getOwnProfile: async (): Promise<User> => {
    const response = await parseApiResponse(apiClient.get('/users/me'), createApiResponseSchema(GetOwnProfileResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data.user;
  },

  updateProfile: async (request: UpdateProfileRequest): Promise<User> => {
    const response = await parseApiResponse(apiClient.put('/users/me', request), createApiResponseSchema(UpdateProfileResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data.user;
  },

  findAllMatches: async (): Promise<Matches> => {
    const response = await parseApiResponse(apiClient.get('/users/matches'), createApiResponseSchema(FindAllMatchesResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data.users;
  },
};
