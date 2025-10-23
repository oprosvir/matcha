import { useCurrentUser } from "@/hooks/useUserProfile";
import { Spinner } from "@/components/ui/spinner";
import type { User } from "@/types/user";
import { CompleteProfile } from "@/components/complete-profile";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ErrorFallback } from "@/components/ErrorFallback";
import { User as UserIcon, Search, Heart } from "lucide-react";

function UserHasCompletedProfile(user: User): boolean {
  // TODO: Add photos and interests check when backend endpoints are ready
  return (
    user.gender !== null &&
    user.sexualOrientation !== null &&
    user.biography !== null
    // user.biography !== null &&
    // user.photos &&
    // user.photos.length > 0 &&
    // user.photos.some((photo) => photo.is_profile_pic) &&
    // user.interests &&
    // user.interests.length > 0
  );
}

export function Dashboard() {
  const { data: user, isLoading } = useCurrentUser(); 

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  // Profile not completed - show CompleteProfile form (without AppLayout)
  if (user && !UserHasCompletedProfile(user)) {
    return <CompleteProfile user={user} />;
  }

  // Profile completed - show dashboard with AppLayout
  if (user && UserHasCompletedProfile(user)) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-muted-foreground mb-8">
            Complete your profile to start matching with people
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <UserIcon className="w-10 h-10 mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your photos, interests, and bio to attract matches
                </p>
                <Button asChild className="w-full">
                  <Link to="/profile">Go to Profile</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardContent className="pt-6">
                <Search className="w-10 h-10 mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Browse Profiles</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover people near you with similar interests
                </p>
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardContent className="pt-6">
                <Heart className="w-10 h-10 mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Your Matches</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  See who liked you and start chatting
                </p>
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Getting Started</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Complete your profile</h4>
                    <p className="text-sm text-muted-foreground">
                      Add your gender, sexual orientation, and bio
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Upload photos (Coming Soon)</h4>
                    <p className="text-sm text-muted-foreground">
                      Add up to 5 photos to showcase yourself
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Start browsing (Coming Soon)</h4>
                    <p className="text-sm text-muted-foreground">
                      Find people who match your preferences
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Fallback
  // user undefined or some error occurred
  return (
    <ErrorFallback
      title="Unable to load your profile"
      message="We couldn't load your profile right now. Please check your connection and try again."
      onRetry={() => window.location.reload()}
    />
  );
}
