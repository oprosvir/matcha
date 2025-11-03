import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/api/user/user";

export function useLocationList() {
  const query = useQuery({
    queryKey: ['locationList'],
    queryFn: () => userApi.getLocationList(),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
}