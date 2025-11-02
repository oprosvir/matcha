import { useQuery } from "@tanstack/react-query";
import { messageApi } from "@/api/message/message";

export function useMessages(chatId: string) {
  const query = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => messageApi.findAllByChatId(chatId),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
}