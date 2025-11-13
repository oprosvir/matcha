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
  email?: string;
}

interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
}

interface CompleteProfileRequest {
  dateOfBirth: string;
  gender: Gender;
  sexualOrientation: SexualOrientation;
  biography: string;
  interestIds: string[];
  latitude: number;
  longitude: number;
}

const FindAllMatchesResponseSchema = z.object({ users: MatchesSchema });
const GetOwnProfileResponseSchema = z.object({ user: UserSchema });
const UpdateProfileResponseSchema = z.object({ user: UserSchema, emailChanged: z.boolean().optional() });
const UpdateLocationResponseSchema = z.object({ user: UserSchema });
const CompleteProfileResponseSchema = z.object({ user: UserSchema });
const ResolveLocationByCoordsResponseSchema = z.object({
  cityName: z.string(),
  countryName: z.string()
});
const ResolveLocationByCityResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
});

function buildSortAndFilterURLSearchParams(params?: {
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
}): URLSearchParams {
  const queryParams = new URLSearchParams();
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
  return queryParams;
}

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

  updateProfile: async (request: UpdateProfileRequest): Promise<{ data: User; messageKey: string; emailChanged?: boolean }> => {
    const response = await parseApiResponse(apiClient.put('/users/me', request), createApiResponseSchema(UpdateProfileResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return { data: response.data.user, messageKey: response.messageKey, emailChanged: response.data.emailChanged };
  },

  updateLocation: async (request: UpdateLocationRequest): Promise<{ data: User; messageKey: string }> => {
    const response = await parseApiResponse(apiClient.put('/users/me/location', request), createApiResponseSchema(UpdateLocationResponseSchema));
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
    const queryParams = buildSortAndFilterURLSearchParams(params);
    if (params?.cursor) queryParams.append('cursor', params.cursor);

    const url = `/users/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await parseApiResponse(apiClient.get(url), createApiResponseSchema(GetUsersResponseSchema));
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }

    return response.data;
  },

  getSuggestedUsers: async (params?: {
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
    const queryParams = buildSortAndFilterURLSearchParams(params);

    const url = `/users/suggested${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await parseApiResponse(apiClient.get(url), createApiResponseSchema(GetUsersResponseSchema));

    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }

    return response.data;
  },

  resolveLocationByCoordinates: async (latitude: number, longitude: number): Promise<{ cityName: string; countryName: string }> => {
    const response = await parseApiResponse(
      apiClient.get('/users/resolve-location-by-latitude-and-longitude', {
        params: { latitude, longitude }
      }),
      createApiResponseSchema(ResolveLocationByCoordsResponseSchema)
    );
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data;
  },

  likeUser: async (userId: string): Promise<void> => {
    const response = await parseApiResponse(
      apiClient.post('/users/like', { userId }),
      createApiResponseSchema(z.void()))
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
  },

  unlikeUser: async (userId: string): Promise<void> => {
    const response = await parseApiResponse(
      apiClient.post('/users/unlike', { userId }),
      createApiResponseSchema(z.void()))
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }

    return response.data;
  },

  resolveLocationByCity: async (cityName: string, countryName: string): Promise<{ latitude: number; longitude: number }> => {
    const response = await parseApiResponse(
      apiClient.get('/users/resolve-location-by-city-name-and-country-name', {
        params: { cityName, countryName }
      }),
      createApiResponseSchema(ResolveLocationByCityResponseSchema)
    );
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data;
  },

  resolveLocationByIpAddress: async (ipAddress: string): Promise<{ latitude: number; longitude: number }> => {
    const response = await parseApiResponse(
      apiClient.get('/users/resolve-location-by-ip-address', {
        params: { ipAddress }
      }),
      createApiResponseSchema(ResolveLocationByCityResponseSchema) // Same schema - returns lat/long
    );
    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
    return response.data;
  },

  // Photo management endpoints
  getUserPhotos: async (): Promise<{ id: string; url: string; isProfilePic: boolean; createdAt: string }[]> => {
    const PhotoSchema = z.object({
      id: z.string(),
      url: z.string(),
      isProfilePic: z.boolean(),
      createdAt: z.string(),
    });

    const GetPhotosResponseSchema = z.object({
      photos: z.array(PhotoSchema),
    });

    const response = await parseApiResponse(
      apiClient.get('/users/me/photos'),
      createApiResponseSchema(GetPhotosResponseSchema)
    );

    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }

    return response.data.photos;
  },

  uploadPhoto: async (
    file: File,
    cropData?: { x: number; y: number; width: number; height: number }
  ): Promise<{ id: string; url: string; isProfilePic: boolean }> => {
    const formData = new FormData();
    formData.append('photo', file);

    // Add cropData as JSON string if provided
    if (cropData) {
      formData.append('cropData', JSON.stringify(cropData));
    }

    const PhotoSchema = z.object({
      id: z.string(),
      url: z.string(),
      isProfilePic: z.boolean(),
    });

    const UploadPhotoResponseSchema = z.object({
      photo: PhotoSchema,
    });

    const response = await parseApiResponse(
      apiClient.post('/users/me/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      createApiResponseSchema(UploadPhotoResponseSchema)
    );

    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }

    return response.data.photo;
  },

  deletePhoto: async (photoId: string): Promise<void> => {
    const response = await parseApiResponse(
      apiClient.delete(`/users/me/photos/${photoId}`),
      createApiResponseSchema(z.void())
    );

    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }
  },

  setProfilePicture: async (photoId: string): Promise<{ id: string; url: string; isProfilePic: boolean }> => {
    const PhotoSchema = z.object({
      id: z.string(),
      url: z.string(),
      isProfilePic: z.boolean(),
    });

    const SetProfilePictureResponseSchema = z.object({
      photo: PhotoSchema,
    });

    const response = await parseApiResponse(
      apiClient.put(`/users/me/photos/${photoId}/profile`),
      createApiResponseSchema(SetProfilePictureResponseSchema)
    );

    if (!response.success) {
      throw new Error(getToastMessage(response.messageKey));
    }

    return response.data.photo;
  },
};
