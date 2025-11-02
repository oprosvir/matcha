import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/api/notification/notification";

export function useNotifications() {
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.findAllNotifications,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
}