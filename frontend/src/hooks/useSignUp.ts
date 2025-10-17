import { authApi } from "@/api/auth/auth";
import { type SignUpRequest, type SignUpResponse } from "@/api/auth/schema";
import { toast } from "sonner";
import { getToastMessage } from "@/lib/messageMap";
import { type EmptyResponse } from "@/api/schema";
import { useMutation } from "@tanstack/react-query";

export function useSignUp() {
  const signUpMutation = useMutation({
    mutationFn: (data: SignUpRequest) => authApi.signUp(data),
    onSuccess: (response: SignUpResponse) => {
      toast.success(getToastMessage(response.messageKey));
    },
    onError: (response: EmptyResponse) => {
      toast.error(getToastMessage(response.messageKey));
    },
  });

  const signUp = (data: SignUpRequest) => {
    signUpMutation.mutate(data);
  };

  return {
    signUp,
    isPending: signUpMutation.isPending,
    isError: signUpMutation.isError,
    isSuccess: signUpMutation.isSuccess,
  };
}