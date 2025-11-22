import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { tokenManager } from "@/utils/tokenManager";
import { authApi } from "@/api/auth/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/api/user/user";
import type { User } from "@/types/user";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | undefined;
  isUserLoading: boolean;
  isUserError: boolean;
  signIn: (accessToken: string) => void;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useQuery<User>({
    queryKey: ["user"],
    queryFn: userApi.getOwnProfile,
    enabled: isAuthenticated,
  });

  const signOut = useCallback(async () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    try {
      await authApi.signOut();
    } catch (error) {
    } finally {
      tokenManager.clearToken();
      setIsAuthenticated(false);
      // Clear all cached data on logout
      queryClient.clear();
    }
  }, [queryClient]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const { accessToken } = await authApi.refreshToken();
      tokenManager.setToken(accessToken);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const scheduleTokenRefresh = useCallback(async () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }

    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return;

    // Schedule refresh 1 minute before expiry
    const timeUntilRefresh = expiry - Date.now() - 60 * 1000;

    if (timeUntilRefresh > 0) {
      const timer = setTimeout(async () => {
        const success = await refreshAccessToken();
        if (success) {
          scheduleTokenRefresh();
        } else {
          await signOut();
        }
      }, timeUntilRefresh);
      refreshTimer.current = timer;
    } else {
      const success = await refreshAccessToken();
      if (success) {
        scheduleTokenRefresh();
      } else {
        await signOut();
      }
    }
  }, [refreshAccessToken, signOut]);

  const signIn = useCallback(
    (accessToken: string) => {
      // Clear old user's cached data before signing in new user
      queryClient.clear();
      tokenManager.setToken(accessToken);
      setIsAuthenticated(true);
      scheduleTokenRefresh();
    },
    [scheduleTokenRefresh, queryClient]
  );

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      if (tokenManager.hasToken()) {
        setIsAuthenticated(true);
        scheduleTokenRefresh();
        setIsLoading(false);
        return;
      }
      const success = await refreshAccessToken();
      if (success) {
        setIsAuthenticated(true);
        scheduleTokenRefresh();
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    initAuth();

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, [scheduleTokenRefresh, refreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        isUserLoading,
        isUserError,
        signIn,
        signOut,
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

export function useUser() {
  const { user, isUserLoading, isUserError } = useAuth();
  return {
    user,
    isLoading: isUserLoading,
    isError: isUserError,
    isSuccess: !isUserLoading && !isUserError,
  };
}
