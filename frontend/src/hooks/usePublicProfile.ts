import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/api/user/user";

export function usePublicProfile(username: string | null) {
  const query = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => userApi.getPublicProfile(username!),
    enabled: !!username,
    staleTime: 1000 * 60, // 1 minute
    retry: false, // Don't retry on errors (including 404)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
    refetch: query.refetch,
  };
}
