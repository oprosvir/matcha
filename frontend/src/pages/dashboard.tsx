import { useCurrentUser } from "@/hooks/useUserProfile";
import { Spinner } from "@/components/ui/spinner";
import type { User } from "@/types/user";
import { CompleteProfile } from "@/components/complete-profile";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ErrorFallback } from "@/components/ErrorFallback";
import { User as UserIcon, Search, Heart, MessageCircle, MapPin } from "lucide-react";

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
  // TODO: make user photo not optional
  if (user && UserHasCompletedProfile(user)) {
    const profilePic = user.photos?.find((p) => p.is_profile_pic);

    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground mb-6">
            Ready to find your perfect match?
          </p>

          {/* Profile Hero Card */}
          <Card className="mb-6">
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profilePic ? (
                    <img
                      src={profilePic.url}
                      alt={`${user.firstName}'s profile`}
                      className="w-32 h-32 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                      <UserIcon className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-3">
                    @{user.username}
                  </p>

                  {user.biography && (
                    <p className="text-sm mb-4 line-clamp-2">
                      {user.biography}
                    </p>
                  )}

                  {/* Location */}
                  {/* TODO: replace with actual location display when available */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    {user.latitude && user.longitude ? (
                      <span>Location set</span>
                    ) : (
                      <span className="text-muted-foreground">Location not set</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  <Button variant="outline" asChild className="md:w-auto">
                    <Link to="/profile">Edit Profile</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Browse Profiles */}
            <Card className="opacity-60">
              <CardContent className="flex flex-col h-full">
                <Search className="w-10 h-10 mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Browse Profiles</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover people near you with similar interests
                </p>
                <Button disabled className="w-full mt-auto">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Your Matches */}
            <Card className="opacity-60">
              <CardContent className="flex flex-col h-full">
                <Heart className="w-10 h-10 mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Your Matches</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  See who liked you and start chatting
                </p>
                <Button disabled className="w-full mt-auto">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="opacity-60">
              <CardContent className="flex flex-col h-full">
                <MessageCircle className="w-10 h-10 mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Messages</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with your matches and connections
                </p>
                <Button disabled className="w-full mt-auto">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
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
