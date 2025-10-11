import { tokenManager } from '@/utils/tokenManager';

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
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.accessToken) {
      tokenManager.setToken(data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

export async function api(path: string, options: RequestInit = {}): Promise<any> {
  const token = tokenManager.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // 401 Unauthorized, means we need to refresh the token and retry
  if (res.status === 401 && !path.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      onTokenRefreshed(newToken);

      if (newToken) {
        const newHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        };

        res = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: newHeaders,
          credentials: 'include',
        });
      } else {
        // Refresh failed, redirect to login
        tokenManager.clearToken();
        window.location.href = '/sign-in';
        throw new Error('Session expired');
      }
    } else {
      // Wait for the ongoing refresh to complete
      const newToken = await new Promise<string | null>((resolve) => {
        subscribeTokenRefresh(resolve);
      });

      if (newToken) {
        // Retry with new token
        const newHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        };

        res = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: newHeaders,
          credentials: 'include',
        });
      } else {
        tokenManager.clearToken();
        window.location.href = '/sign-in';
        throw new Error('Session expired');
      }
    }
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  return res.json();
}
