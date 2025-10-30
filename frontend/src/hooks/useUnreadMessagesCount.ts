import { useQuery } from "@tanstack/react-query";
import { messageApi } from "@/api/message/message";

export function useUnreadMessagesCount() {
  const query = useQuery({
    queryKey: ["unreadMessagesCount"],
    queryFn: messageApi.getUnreadCount,
    staleTime: 15_000,
  });

  return {
    data: query.data ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}


