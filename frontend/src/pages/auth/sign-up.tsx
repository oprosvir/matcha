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

const schema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters long" })
      .max(50, { message: "Username must be less than 50 characters long" })
      .regex(/^[a-zA-Z0-9]+$/, {
        message: "Username must contain only letters and numbers",
      }),
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters long" })
      .max(50, { message: "First name must be less than 50 characters long" })
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, {
        message:
          "First name can contain letters, spaces, hyphens, and apostrophes",
      }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters long" })
      .max(50, { message: "Last name must be less than 50 characters long" })
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, {
        message:
          "Last name can contain letters, spaces, hyphens, and apostrophes",
      }),
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function Signup() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      username: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
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
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Create your account
            </span>
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your information below to get started
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.email.message}
            </p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="Choose a username"
            {...form.register("username")}
          />
          {form.formState.errors.username && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.username.message}
            </p>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="first-name">First Name</FieldLabel>
            <Input
              id="first-name"
              type="text"
              placeholder="Enter your first name"
              {...form.register("firstName")}
            />
            {form.formState.errors.firstName && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
            <Input
              id="last-name"
              type="text"
              placeholder="Enter your last name"
              {...form.register("lastName")}
            />
            {form.formState.errors.lastName && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="Create your password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.password.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </Field>
        </div>
        <Button type="submit" disabled={isPending}>
          Create Account
        </Button>
        <FieldDescription className="text-center">
          Already have an account?{" "}
          <a href="/auth/sign-in" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline">
            Sign in
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
