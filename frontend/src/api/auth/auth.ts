import apiClient from '@/lib/apiClient';
import { parseApiResponse } from '@/api/parseResponse';
import {
  type SignUpRequest,
  type SignUpResponse,
  type SignInRequest,
  type SignInResponse,
  type RefreshTokenResponse,
  type SendPasswordResetEmailRequest,
  type ResetPasswordRequest,
  type VerifyEmailRequest,
  SignUpResponseSchema,
  SignInResponseSchema,
  RefreshTokenResponseSchema,
} from './schema';
import { EmptyResponseSchema, type EmptyResponse } from '../schema';

export const authApi = {
  signUp: async (request: SignUpRequest): Promise<SignUpResponse> => {
    return parseApiResponse(apiClient.post('/auth/sign-up', request), SignUpResponseSchema);
  },

  signIn: async (request: SignInRequest): Promise<SignInResponse> => {
    return parseApiResponse(apiClient.post('/auth/sign-in', request), SignInResponseSchema);
  },

  signOut: async (): Promise<EmptyResponse> => {
    return parseApiResponse(apiClient.post('/auth/sign-out'), EmptyResponseSchema);
  },

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    return parseApiResponse(apiClient.get('/auth/refresh-token'), RefreshTokenResponseSchema);
  },

  sendPasswordResetEmail: async (request: SendPasswordResetEmailRequest): Promise<EmptyResponse> => {
    return parseApiResponse(apiClient.post('/auth/send-password-reset-email', request), EmptyResponseSchema);
  },

  resetPassword: async (request: ResetPasswordRequest): Promise<EmptyResponse> => {
    return parseApiResponse(apiClient.post('/auth/reset-password', request), EmptyResponseSchema);
  },

  sendVerifyEmail: async (): Promise<EmptyResponse> => {
    return parseApiResponse(apiClient.post('/auth/send-verify-email'), EmptyResponseSchema);
  },

  verifyEmail: async (request: VerifyEmailRequest): Promise<EmptyResponse> => {
    return parseApiResponse(apiClient.get(`/auth/verify-email?token=${request.verifyEmailToken}`), EmptyResponseSchema);
  },
};
