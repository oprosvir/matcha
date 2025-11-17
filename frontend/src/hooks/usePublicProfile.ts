import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/api/user/user";

export function usePublicProfile(username: string | null) {
  const query = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => userApi.getPublicProfile(username!),
    enabled: !!username,
    staleTime: 1000 * 60, // 1 minute
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
