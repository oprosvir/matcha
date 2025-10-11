import { useState, useEffect, useCallback } from 'react';
import { UsersAPI, type User } from '../api/users';
import { tokenManager } from '@/utils/tokenManager';
import { useAuth } from '@/contexts/AuthContext';

interface UseCurrentUserReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchUser = useCallback(async () => {
    const hasToken = tokenManager.hasToken();

    if (!hasToken) {
      setUser(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userData = await UsersAPI.getCurrentUser();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    refetch: fetchUser,
  };
}
