import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/auth/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { type SignInRequest, type SignInResponse } from "@/api/auth/schema";
import { type EmptyErrorResponse } from "@/api/schema";
import { getToastMessage } from "@/lib/messageMap";

export function useSignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const signInMutation = useMutation({
    mutationFn: (request: SignInRequest) => authApi.signIn(request),
    onSuccess: (response: SignInResponse) => {
      if (response.success) {
        signIn(response.data.accessToken);
        toast.success(getToastMessage(response.messageKey));
        navigate("/");
      }
    },
    onError: (response: EmptyErrorResponse) => {
      toast.error(getToastMessage(response.messageKey));
    },
  });

  const signInUser = (request: SignInRequest) => {
    signInMutation.mutate(request);
  };

  return {
    signInUser,
    isPending: signInMutation.isPending,
    isError: signInMutation.isError,
    isSuccess: signInMutation.isSuccess,
  };
}
