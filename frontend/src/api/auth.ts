import { api } from './client';

// TODO: Handle each response code and map to the right error message
export const AuthAPI = {
  register: async (email: string, password: string, firstName: string, lastName: string, username: string) => {
    const response = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName, username }),
    });
    return { accessToken: response.accessToken };
  },

  login: async (username: string, password: string) => {
    const response = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return { accessToken: response.accessToken };
  },

  logout: async () => {
    await api('/auth/logout', { method: 'POST' });
  },

  refresh: async () => {
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const data = await response.json();
    return { accessToken: data.accessToken };
  },

  forgotPassword: async (email: string) => {
    const response = await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return { message: response.message };
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    return { message: response.message };
  },

  verifyResetToken: async (token: string) => {
    const response = await api(`/auth/verify-reset-token?token=${token}`, {
      method: 'GET',
    });
    return { valid: response.valid };
  },
};
