import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/auth/auth";
import { toast } from "sonner";
import { type SendPasswordResetEmailRequest } from "@/api/auth/schema";
import { type EmptyResponse, type EmptyErrorResponse } from "@/api/schema";
import { getToastMessage } from "@/lib/messageMap";
import { useState, useEffect } from "react";

export function useForgotPassword() {
  const [isSentButtonDisabled, setIsSentButtonDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const forgotPasswordMutation = useMutation({
    mutationFn: (request: SendPasswordResetEmailRequest) => authApi.sendPasswordResetEmail(request),
    onSuccess: (response: EmptyResponse) => {
      if (response.success) {
        toast.success(getToastMessage(response.messageKey));
        setIsSentButtonDisabled(true);
        setTimeLeft(60);
      }
    },
    onError: (response: EmptyErrorResponse) => {
      toast.error(getToastMessage(response.messageKey));
    },
  });

  const sendPasswordResetEmail = (request: SendPasswordResetEmailRequest) => {
    forgotPasswordMutation.mutate(request);
  };

  // Timer effect for resend button
  useEffect(() => {
    if (isSentButtonDisabled && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsSentButtonDisabled(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSentButtonDisabled, timeLeft]);

  return {
    sendPasswordResetEmail,
    isPending: forgotPasswordMutation.isPending,
    isError: forgotPasswordMutation.isError,
    isSuccess: forgotPasswordMutation.isSuccess,
    isSentButtonDisabled,
    timeLeft,
  };
}
