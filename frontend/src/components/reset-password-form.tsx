import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import illustration from "@/assets/illustration.png";
import { toast } from "sonner";
import { type FormEvent, useState, useEffect } from "react";
import { AuthAPI } from "@/api/auth";
import { useNavigate, useSearchParams } from "react-router-dom";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsVerifying(false);
        toast.error("No reset token provided");
        return;
      }
      try {
        const { valid } = await AuthAPI.verifyResetToken(token);
        setIsValidToken(valid);
      } catch (error) {
        setIsValidToken(false);
        toast.error("Failed to verify reset token");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // TODO: Add password strength validation

    if (!token) {
      toast.error("No reset token provided");
      return;
    }

    try {
      setIsLoading(true);
      const { message } = await AuthAPI.resetPassword(token, password);
      toast.success(message);
      navigate("/sign-in");
    } catch (error) {
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Verifying reset token...</h1>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
              <p className="text-muted-foreground">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
              <Button onClick={() => navigate("/sign-in/forgot-password")}>
                Request New Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Enter your new password</h1>
                <p className="text-muted-foreground text-sm">
                  Choose a strong password to secure your account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
                <FieldDescription>
                  Must be at least 8 characters long
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm New Password
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src={illustration}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
