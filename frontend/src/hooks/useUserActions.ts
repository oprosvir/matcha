import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/api/user/user";
import { toast } from "sonner";

interface UseUserActionsOptions {
  username?: string;
  onBlockSuccess?: () => void;
  onUnblockSuccess?: () => void;
  onReportSuccess?: () => void;
}

export function useUserActions(options: UseUserActionsOptions = {}) {
  const { username, onBlockSuccess, onUnblockSuccess, onReportSuccess } = options;
  const queryClient = useQueryClient();

  const invalidateAllUserQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['public-profile', username] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['likes'] });
    queryClient.invalidateQueries({ queryKey: ['likes-sent'] });
    queryClient.invalidateQueries({ queryKey: ['profile-views'] });
    queryClient.invalidateQueries({ queryKey: ['matches'] });
  };

  const blockMutation = useMutation({
    mutationFn: (userId: string) => userApi.blockUser(userId),
    onSuccess: () => {
      toast.success("User blocked successfully");
      invalidateAllUserQueries();
      onBlockSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to block user");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => userApi.unblockUser(userId),
    onSuccess: () => {
      toast.success("User unblocked successfully");
      invalidateAllUserQueries();
      onUnblockSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unblock user");
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      userApi.reportUser(userId, reason),
    onSuccess: () => {
      toast.success("User reported successfully");
      onReportSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to report user");
    },
  });

  return {
    blockMutation,
    unblockMutation,
    reportMutation,
  };
}
