import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { tokenManager } from '@/utils/tokenManager';
import { authApi } from './auth/auth';

const API_URL = import.meta.env.VITE_API_URL;

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await authApi.refreshToken();
    tokenManager.setToken(response.accessToken);
    return response.accessToken;
  } catch (err) {
    return null;
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (token) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            try {
              const res = await apiClient(originalRequest);
              resolve(res);
            } catch (e) {
              reject(e);
            }
          });
        });
      }

      isRefreshing = true;

      const newToken = await refreshAccessToken();
      isRefreshing = false;
      onTokenRefreshed(newToken);

      if (!newToken) {
        tokenManager.clearToken();
        window.location.href = '/auth/sign-in';
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);
