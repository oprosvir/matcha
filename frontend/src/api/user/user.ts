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

interface CompleteProfileRequest {
  dateOfBirth: string;
  gender: Gender;
  sexualOrientation: SexualOrientation;
  biography: string;
  interestIds: string[];
}

const FindAllMatchesResponseSchema = z.object({ users: MatchesSchema });
const GetOwnProfileResponseSchema = z.object({ user: UserSchema });
const UpdateProfileResponseSchema = z.object({ user: UserSchema });
const CompleteProfileResponseSchema = z.object({ user: UserSchema });

export const userApi = {
  getOwnProfile: async (): Promise<User> => {
    const response = await parseApiResponse(apiClient.get('/users/me'), createApiResponseSchema(GetOwnProfileResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data.user;
  },

  completeProfile: async (request: CompleteProfileRequest): Promise<{ data: User; messageKey: string }> => {
    const response = await parseApiResponse(apiClient.post('/users/me/complete', request), createApiResponseSchema(CompleteProfileResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return { data: response.data.user, messageKey: response.messageKey };
  },

  updateProfile: async (request: UpdateProfileRequest): Promise<{ data: User; messageKey: string }> => {
    const response = await parseApiResponse(apiClient.put('/users/me', request), createApiResponseSchema(UpdateProfileResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return { data: response.data.user, messageKey: response.messageKey };
  },

  findAllMatches: async (): Promise<Matches> => {
    const response = await parseApiResponse(apiClient.get('/users/matches'), createApiResponseSchema(FindAllMatchesResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data.users;
  },
};
