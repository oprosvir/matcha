import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user/user';
import { toast } from 'sonner';
import type { User } from '@/types/user';
import { getToastMessage } from '@/lib/messageMap';

export function useCurrentUser() {
  const query = useQuery({
    queryKey: ['user'],
    queryFn: userApi.getOwnProfile,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
}

export function useCompleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.completeProfile,
    onSuccess: ({ data, messageKey }: { data: User; messageKey: string }) => {
      queryClient.setQueryData(['user'], data);
      toast.success(getToastMessage(messageKey));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: ({ data, messageKey }: { data: User; messageKey: string }) => {
      queryClient.setQueryData(['user'], data);
      toast.success(getToastMessage(messageKey));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
