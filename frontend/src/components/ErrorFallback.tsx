import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showSignOut?: boolean;
  icon?: React.ReactNode;
}

/**
 * Reusable error fallback UI component
 *
 * Use this component to display error states consistently across the app.
 *
 * @example
 * ```tsx
 * // Simple usage
 * <ErrorFallback />
 *
 * // Custom message with retry
 * <ErrorFallback
 *   title="Failed to load profiles"
 *   message="Unable to fetch user profiles from the server."
 *   onRetry={() => refetch()}
 * />
 *
 * // Without "Sign Out" button
 * <ErrorFallback
 *   title="Profile not found"
 *   showSignOut={false}
 * />
 * ```
 */
export function ErrorFallback({
  title = "Something went wrong",
  message = "We couldn't load the data right now. Please check your connection and try again.",
  onRetry,
  showSignOut = true,
  icon = <AlertTriangle className="w-12 h-12 text-destructive" />,
}: ErrorFallbackProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/sign-in");
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
          <div>{icon}</div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex flex-col gap-2 w-full mt-2">
            {onRetry && (
              <Button variant="default" onClick={onRetry} className="w-full">
                Retry
              </Button>
            )}

            {showSignOut && (
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
