import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getToastMessage } from "@/lib/messageMap";
import { type EmptyResponse } from "@/api/schema";
import { useCallback } from "react";

export function useVerifyEmail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authApi.verifyEmail({ verifyEmailToken: token }),
    onSuccess: async (response: EmptyResponse) => {
      toast.success(getToastMessage(response.messageKey));
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      navigate("/");
    },
    onError: (response: EmptyResponse) => { // TODO: Check if this is correct
      toast.error(getToastMessage(response.messageKey));
    },
  });

  const verifyEmail = useCallback((token: string) => {
    verifyEmailMutation.mutate(token);
  }, [verifyEmailMutation]);

  return {
    verifyEmail,
    isSuccess: verifyEmailMutation.isSuccess,
    isError: verifyEmailMutation.isError,
    isPending: verifyEmailMutation.isPending,
  };
}