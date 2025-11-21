import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useSignIn } from "@/hooks/useSignIn";

interface SignInFormData {
  username: string;
  password: string;
}

export function Signin() {
  const { signInUser, isPending } = useSignIn();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: SignInFormData) => {
    signInUser({
      username: data.username,
      password: data.password,
    });
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Welcome back
            </span>
          </h1>
          <p className="text-muted-foreground text-balance">
            Sign in to your Matcha account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="Username"
            {...register("username", { required: "Username is required" })}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="/auth/forgot-password"
              className="ml-auto text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            {...register("password", { required: "Password is required" })}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending || isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </Field>
        <FieldDescription className="text-center">
          Don&apos;t have an account?{" "}
          <a href="/auth/sign-up" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline">
            Sign Up
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
