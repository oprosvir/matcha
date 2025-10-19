import apiClient from '@/lib/apiClient';
import { parseApiResponse } from '../parseResponse';
import { EmptyResponseSchema, type EmptyResponse } from '../schema';
import { GetOwnProfileResponseSchema } from './schema';
import type { GetOwnProfileResponse, UpdateProfileRequest } from './schema';

export const userApi = {
  getOwnProfile: async (): Promise<GetOwnProfileResponse> => {
    return parseApiResponse(apiClient.get('/users/me'), GetOwnProfileResponseSchema);
  },

  updateProfile: async (request: UpdateProfileRequest): Promise<EmptyResponse> => {
    return parseApiResponse(apiClient.put('/users/me', request), EmptyResponseSchema);
  },
};
