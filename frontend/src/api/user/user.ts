import apiClient from '@/lib/apiClient';
import { parseApiResponse } from '../parseResponse';
import { createApiResponseSchema } from '../schema';
import { UserSchema, type SexualOrientation, type Gender, type User, type Matches, MatchesSchema } from '@/types/user';
import { getToastMessage } from '@/lib/messageMap';
import { z } from 'zod';
import { type LocationEntry, LocationListSchema, type GetUsersResponse, GetUsersResponseSchema } from '@/types/browse';

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
  getLocationList: async (): Promise<LocationEntry[]> => {
    const response = await parseApiResponse(apiClient.get('/users/location-list'), createApiResponseSchema(LocationListSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data.locations;
  },

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

  getUsers: async (params?: {
    cursor?: string;
    minAge?: number;
    maxAge?: number;
    minFame?: number;
    maxFame?: number;
    cities?: string[];
    countries?: string[];
    tags?: string[];
    firstName?: string;
    sort?: {
      sortBy: 'age' | 'fameRating' | 'interests';
      sortOrder: 'asc' | 'desc';
    };
  }): Promise<GetUsersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.minAge !== undefined) queryParams.append('minAge', params.minAge.toString());
    if (params?.maxAge !== undefined) queryParams.append('maxAge', params.maxAge.toString());
    if (params?.minFame !== undefined) queryParams.append('minFame', params.minFame.toString());
    if (params?.maxFame !== undefined) queryParams.append('maxFame', params.maxFame.toString());
    if (params?.cities && params.cities.length > 0) {
      queryParams.append('cities', params.cities.join(','));
    }
    if (params?.countries && params.countries.length > 0) {
      queryParams.append('countries', params.countries.join(','));
    }
    if (params?.tags && params.tags.length > 0) {
      queryParams.append('tags', params.tags.join(','));
    }
    if (params?.firstName) queryParams.append('firstName', params.firstName);
    if (params?.sort) {
      queryParams.append('sort', JSON.stringify(params.sort));
    }

    const url = `/users/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await parseApiResponse(apiClient.get(url), createApiResponseSchema(GetUsersResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }

    return response.data;
  },
};
