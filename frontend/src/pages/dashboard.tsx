import { useCurrentUser } from "@/hooks/useUserProfile";
import { Spinner } from "@/components/ui/spinner";
import { CompleteProfile } from "@/components/complete-profile";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ErrorFallback } from "@/components/ErrorFallback";
import { calculateAge } from "@/utils/dateUtils";
import {
  User as UserIcon,
  Search,
  Heart,
  MessageCircle,
  MapPin,
} from "lucide-react";
import { Confetti } from "@/components/ui/confetti";

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
  if (user && !user.profileCompleted) {
    return <CompleteProfile user={user} />;
  }

  // Profile completed - show dashboard with AppLayout
  // TODO: make user photo not optional
  if (user && user.profileCompleted) {
    const profilePic = user.photos?.find((p) => p.isProfilePic);

    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Ready to find your perfect match?
            </p>
          </div>

          {/* Profile Hero Card */}
          <Card>
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
                    {user.dateOfBirth && (
                      <span className="text-muted-foreground font-normal">
                        , {calculateAge(user.dateOfBirth)}
                      </span>
                    )}
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
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    {user.cityName && user.countryName ? (
                      <span>{user.cityName}, {user.countryName}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Location not set
                      </span>
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
          <div className="grid gap-4 md:grid-cols-3">
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
        <Confetti />
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
