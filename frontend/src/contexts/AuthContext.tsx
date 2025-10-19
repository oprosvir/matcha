import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { tokenManager } from "@/utils/tokenManager";
import { authApi } from "@/api/auth/auth";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/api/user/user";
import type { GetOwnProfileResponse } from "@/api/user/schema";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GetOwnProfileResponse | undefined;
  isUserLoading: boolean;
  isUserError: boolean;
  signIn: (accessToken: string) => void;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTimer, setRefreshTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useQuery<GetOwnProfileResponse>({
    queryKey: ["user"],
    queryFn: userApi.getOwnProfile,
    enabled: isAuthenticated,
  });

  const signOut = useCallback(async () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      setRefreshTimer(null);
    }
    try {
      await authApi.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      tokenManager.clearToken();
      setIsAuthenticated(false);
    }
  }, [refreshTimer]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authApi.refreshToken();
      if (response.success) {
        tokenManager.setToken(response.data.accessToken);
        return true;
      }
      return false;
    } catch (err) {
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

  const signIn = useCallback(
    (accessToken: string) => {
      tokenManager.setToken(accessToken);
      setIsAuthenticated(true);
      scheduleTokenRefresh();
    },
    [scheduleTokenRefresh]
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
    isSuccess: !isUserLoading && !isUserError && user?.success,
  };
}
