import { interestApi } from "@/api/interest/interest";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getToastMessage } from "@/lib/messageMap";

export function useInterests() {
  const query = useQuery({
    queryKey: ['interests'],
    queryFn: interestApi.findAll,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
}

export function useUpdateMyInterests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: interestApi.updateMyInterests,
    onSuccess: () => {
      // Invalidate user query to refetch user data with updated interests
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success(getToastMessage('SUCCESS_UPDATE_USER_INTERESTS'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
