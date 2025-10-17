import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/auth/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getToastMessage } from "@/lib/messageMap";
import { type EmptyResponse } from "@/api/schema";

export function useVerifyEmail() {
  const navigate = useNavigate();
  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authApi.verifyEmail({ verifyEmailToken: token }),
    onSuccess: async (response: EmptyResponse) => {
      toast.success(getToastMessage(response.messageKey));
      await new Promise((resolve) => setTimeout(resolve, 2000));
      navigate("/");
    },
    onError: (response: EmptyResponse) => { // TODO: Check if this is correct
      toast.error(getToastMessage(response.messageKey));
    },
  });

  const verifyEmail = (token: string) => {
    verifyEmailMutation.mutate(token);
  };

  return {
    verifyEmail,
    isSuccess: verifyEmailMutation.isSuccess,
    isError: verifyEmailMutation.isError,
    isPending: verifyEmailMutation.isPending,
  };
}