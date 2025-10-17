import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyEmail } from "@/hooks/useVerifyEmail";

export function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail, isSuccess, isError } = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-2xl font-bold">Missing Verification Token</h1>
              <p className="text-muted-foreground">
                No verification token was provided. Please check your email and
                click the verification link.
              </p>
              <Button onClick={() => navigate("/auth/send-verify-email")}>
                Request New Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-2xl font-bold">
                Invalid Email Verification Link
              </h1>
              <p className="text-muted-foreground">
                This email verification link is invalid or has expired. Please
                request a new one.
              </p>
              <Button onClick={() => navigate("/auth/send-verify-email")}>
                Request New Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else if (isSuccess) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-2xl font-bold">Email Verified</h1>
              <p className="text-muted-foreground">
                Your email has been verified successfully.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    // It's pending
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }
}
