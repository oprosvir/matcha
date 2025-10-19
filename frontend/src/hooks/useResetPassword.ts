import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/auth/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { type ResetPasswordRequest } from "@/api/auth/schema";
import { type EmptyResponse, type EmptyErrorResponse } from "@/api/schema";
import { getToastMessage } from "@/lib/messageMap";

export function useResetPassword() {
  const navigate = useNavigate();

  const resetPasswordMutation = useMutation({
    mutationFn: (request: ResetPasswordRequest) => authApi.resetPassword(request),
    onSuccess: (response: EmptyResponse) => {
      if (response.success) {
        toast.success(getToastMessage(response.messageKey));
        navigate("/auth/sign-in");
      }
    },
    onError: (response: EmptyErrorResponse) => {
      toast.error(getToastMessage(response.messageKey));
    },
  });

  const resetPassword = (request: ResetPasswordRequest) => {
    resetPasswordMutation.mutate(request);
  };

  return {
    resetPassword,
    isPending: resetPasswordMutation.isPending,
    isError: resetPasswordMutation.isError,
    isSuccess: resetPasswordMutation.isSuccess,
  };
}
