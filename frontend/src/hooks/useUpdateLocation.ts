import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user/user';
import { toast } from 'sonner';
import type { User } from '@/types/user';
import { getToastMessage } from '@/lib/messageMap';

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      userApi.updateLocation({ latitude, longitude }),
    onSuccess: ({ data, messageKey }: { data: User; messageKey: string }) => {
      queryClient.setQueryData(['user'], data);
      toast.success(getToastMessage(messageKey));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
