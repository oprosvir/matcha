// In memory token manager
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

export const tokenManager = {
  getToken: (): string | null => {
    return accessToken;
  },

  setToken: (token: string): void => {
    accessToken = token;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      tokenExpiry = payload.exp * 1000;
    } catch (error) {
      console.error('Failed to decode token:', error);
      tokenExpiry = Date.now() + 15 * 60 * 1000;
    }
  },

  clearToken: (): void => {
    accessToken = null;
    tokenExpiry = null;
  },

  isTokenExpired: (): boolean => {
    if (!tokenExpiry) return true;
    // Consider token expired if less than 1 minute remaining
    return Date.now() >= tokenExpiry - 60 * 1000;
  },

  getTokenExpiry: (): number | null => {
    return tokenExpiry;
  },

  hasToken: (): boolean => {
    return accessToken !== null && !tokenManager.isTokenExpired();
  },
};

