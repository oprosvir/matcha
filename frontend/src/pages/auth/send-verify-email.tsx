import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { useSendVerifyEmail } from "@/hooks/useSendVerifyEmail";
import { Spinner } from "@/components/ui/spinner";
import { useAuth, useUser } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function SendVerifyEmail() {
  const { user, isLoading, isSuccess } = useUser();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { sendVerifyEmail, isPending, isSentButtonDisabled, timeLeft } =
    useSendVerifyEmail();

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const onSubmit = async () => {
    sendVerifyEmail();
  };

  useEffect(() => {
    if (user?.success && user.data?.isEmailVerified) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  } else if (isSuccess && user?.success) {
    return (
      <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Verify your email</h1>
            <p className="text-muted-foreground">
              Click send to send a verification link to {user?.data?.email}. If
              you don't see it within 5 minutes, please check your spam or click
              send again.
            </p>
          </div>
          <Field>
            <Button
              type="submit"
              disabled={isSentButtonDisabled || isPending || isSubmitting}
            >
              {isPending || isSubmitting
                ? "Sending..."
                : isSentButtonDisabled
                ? `Resend in ${timeLeft}s`
                : "Send"}
            </Button>
          </Field>
          <FieldDescription className="text-center">
            <a className="hover:cursor-pointer" onClick={() => signOut()}>
              Sign Out
            </a>
          </FieldDescription>
        </FieldGroup>
      </form>
    );
  } else {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-muted-foreground text-center">
          Failed to load user data. Please try refreshing the page.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }
}
