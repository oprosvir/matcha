import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/auth/auth";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { AccessToken } from "@/types/user";

export function useSignIn() {
  const { signIn } = useAuth();

  const signInMutation = useMutation<AccessToken, Error, { username: string, password: string }>({
    mutationFn: ({ username, password }) => authApi.signIn(username, password),
    onSuccess: (accessToken: AccessToken) => {
      signIn(accessToken.accessToken);
      toast.success('Signed in successfully 🎉');
      // Navigation handled by PublicRoute guard - it will automatically redirect to "/"
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const signInUser = ({ username, password }: { username: string, password: string }) => {
    signInMutation.mutate({ username, password });
  };

  return {
    signInUser,
    isPending: signInMutation.isPending,
    isError: signInMutation.isError,
    isSuccess: signInMutation.isSuccess,
    data: signInMutation.data,
  };
}
