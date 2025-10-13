import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { tokenManager } from "@/utils/tokenManager";
import { AuthAPI } from "@/api/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTimer, setRefreshTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const logout = useCallback(async () => {
    // Clear the refresh timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      setRefreshTimer(null);
    }
    try {
      await AuthAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      tokenManager.clearToken();
      setIsAuthenticated(false);
    }
  }, [refreshTimer]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const { accessToken } = await AuthAPI.refresh();
      tokenManager.setToken(accessToken);
      setIsAuthenticated(true);
      scheduleTokenRefresh();
      return true;
    } catch (error) {
      tokenManager.clearToken();
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return;

    // Schedule refresh 1 minute before expiry
    const timeUntilRefresh = expiry - Date.now() - 60 * 1000;

    if (timeUntilRefresh > 0) {
      const timer = setTimeout(() => {
        refreshAccessToken();
      }, timeUntilRefresh);
      setRefreshTimer(timer);
    } else {
      refreshAccessToken();
    }
  }, [refreshTimer, refreshAccessToken]);

  const login = useCallback(
    (accessToken: string) => {
      tokenManager.setToken(accessToken);
      setIsAuthenticated(true);
      scheduleTokenRefresh();
    },
    [scheduleTokenRefresh]
  );

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const success = await refreshAccessToken();
      if (!success) {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    initAuth();

    // Cleanup timer on unmount
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
