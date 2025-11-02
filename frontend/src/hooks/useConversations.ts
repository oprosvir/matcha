import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/api/chat/chat";

export function useConversations() {
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.findAllConversations,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
}
