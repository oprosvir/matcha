import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/api/user/user";

export function useAllMatches() {
  const query = useQuery({
    queryKey: ['matches'],
    queryFn: userApi.findAllMatches,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
}