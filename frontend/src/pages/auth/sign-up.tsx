import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignUp } from "@/hooks/useSignUp";

const schema = z.object({
  email: z.string(),
  username: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export function Signup() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { signUp, isPending } = useSignUp();

  const handleSubmit = form.handleSubmit((data: FormData) => {
    signUp({
      email: data.email,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
    });
  });

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-red-500">
              {form.formState.errors.email.message}
            </p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>{" "}
          <Input {...form.register("username")} />
          {form.formState.errors.username && (
            <p className="text-red-500">
              {form.formState.errors.username.message}
            </p>
          )}
        </Field>
        <Field>
          <Field className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="first-name">First Name</FieldLabel>
              <Input {...form.register("firstName")} />
              {form.formState.errors.firstName && (
                <p className="text-red-500">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
              <Input {...form.register("lastName")} />
              {form.formState.errors.lastName && (
                <p className="text-red-500">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </Field>
          </Field>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input {...form.register("password")} type="password" />
          {form.formState.errors.password && (
            <p className="text-red-500">
              {form.formState.errors.password.message}
            </p>
          )}
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input {...form.register("confirmPassword")} type="password" />
          {form.formState.errors.confirmPassword && (
            <p className="text-red-500">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </Field>
        <Button type="submit" disabled={isPending}>
          Create Account
        </Button>
        <FieldDescription className="text-center">
          Already have an account? <a href="/auth/sign-in">Sign in</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
