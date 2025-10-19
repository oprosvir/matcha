import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useResetPassword } from "@/hooks/useResetPassword";

const schema = z
  .object({
    password: z
      .string()
      .min(12, { message: "Password must be at least 12 characters long" })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/\d/, { message: "Password must contain at least one number" })
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, {
        message:
          "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)",
      }),
    confirmPassword: z.string(),
  }) // TODO: Check if it contains common english words
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { resetPassword, isPending } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: FormData) => {
    if (!token) {
      return;
    }
    resetPassword({
      token: token,
      password: data.password,
    });
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <h1 className="text-2xl font-bold text-red-600">Invalid Reset Link</h1>
        <p className="text-muted-foreground text-center">
          No reset token was provided. Please check your email and click the
          reset link.
        </p>
      </div>
    );
  }

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Enter your new password</h1>
          <p className="text-muted-foreground text-sm">
            Choose a strong password to secure your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="password">New Password</FieldLabel>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">
              {errors.password.message}
            </p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">
            Confirm New Password
          </FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending || isSubmitting
              ? "Changing Password..."
              : "Change Password"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
