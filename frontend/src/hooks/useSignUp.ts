import { authApi } from "@/api/auth/auth";
import { type SignUpRequest, type SignUpResponse } from "@/api/auth/schema";
import { toast } from "sonner";
import { getToastMessage } from "@/lib/messageMap";
import { type EmptyErrorResponse } from "@/api/schema";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useSignUp() {
  const { signIn } = useAuth();

  const signUpMutation = useMutation({
    mutationFn: (data: SignUpRequest) => authApi.signUp(data),
    onSuccess: (response: SignUpResponse) => {
      if (response.success) {
        signIn(response.data.accessToken);
        toast.success(getToastMessage(response.messageKey));
      }
    },
    onError: (response: EmptyErrorResponse) => {
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