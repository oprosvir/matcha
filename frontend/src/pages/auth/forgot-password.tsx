import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPassword } from "@/hooks/useForgotPassword";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
});

type FormData = z.infer<typeof schema>;

export function ForgotPassword() {
  const { sendPasswordResetEmail, isPending, isSentButtonDisabled, timeLeft } =
    useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: FormData) => {
    sendPasswordResetEmail({ email: data.email });
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground">
            Enter the email address associated with your account, and we'll send
            you a link to reset your password.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </Field>
        <Field>
          <Button
            type="submit"
            disabled={isSentButtonDisabled || isPending || isSubmitting}
          >
            {isPending || isSubmitting
              ? "Sending..."
              : isSentButtonDisabled
              ? `Resend in ${timeLeft}s`
              : "Send Reset Link"}
          </Button>
        </Field>
        <FieldDescription className="text-center">
          <a href="/auth/sign-in">Return to Sign In</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
