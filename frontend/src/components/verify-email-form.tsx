import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import illustration from "@/assets/illustration.png";
import { type FormEvent, useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";

export function VerifyEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [isSentButtonDisabled, setIsSentButtonDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSentButtonDisabled(true);
    setTimeLeft(60);
  };
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
  useEffect(() => {
    if (user?.is_email_verified) {
      navigate("/");
    }
  }, [user]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[400px]">
          {user ? (
            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Verify your email</h1>
                  <p className="text-muted-foreground">
                    We've sent a verification link to papekfoek@gmail.com. If
                    you don't see it within 5 minutes, please check your spam or
                    click resend.
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={isSentButtonDisabled}>
                    {isSentButtonDisabled ? `Resend in ${timeLeft}s` : "Send"}
                  </Button>
                </Field>
                <FieldDescription className="text-center">
                  <a href="/sign-in">Return to Sign In</a>
                </FieldDescription>
              </FieldGroup>
            </form>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          )}

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
