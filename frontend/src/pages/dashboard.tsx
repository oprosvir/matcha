import { useState } from "react";
import { useCurrentUser } from "@/hooks/useUserProfile";
import { useAllMatches } from "@/hooks/useAllMatches";
import { useLikes } from "@/hooks/useLikes";
import { useProfileViews } from "@/hooks/useProfileViews";
import { Spinner } from "@/components/ui/spinner";
import { CompleteProfile } from "@/components/complete-profile";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorFallback } from "@/components/ErrorFallback";
import { calculateAge } from "@/utils/dateUtils";
import {
  MapPin,
  Heart,
  Eye,
  Users,
} from "lucide-react";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PhotoCarousel } from "@/components/PhotoCarousel";

export function Dashboard() {
  const { data: user, isLoading } = useCurrentUser();
  const { data: matches } = useAllMatches();
  const { data: likes } = useLikes();
  const { data: profileViews } = useProfileViews();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
  if (user && user.profileCompleted) {
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
                {/* Photo Carousel */}
                <div className="flex-shrink-0 mx-auto md:mx-0 w-48 h-48">
                  <PhotoCarousel photos={user.photos} userName={user.firstName} />
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="text-center md:text-left">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {user.firstName} {user.lastName}
                        {user.dateOfBirth && (
                          <span className="text-muted-foreground font-normal">
                            , {calculateAge(user.dateOfBirth)}
                          </span>
                        )}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    {user.cityName && user.countryName ? (
                      <span>{user.cityName}, {user.countryName}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Location not set
                      </span>
                    )}
                  </div>

                  {/* Fame Rating */}
                  <div className="text-sm mb-4">
                    <span className="text-muted-foreground">Fame Rating: </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium cursor-help">
                            {user.fameRating}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Fame rating reflects profile activity and popularity.
                            Higher ratings come from profile completeness, likes, views, and matches.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {user.biography && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 mb-4">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground">About</h3>
                      <p className="text-sm leading-relaxed">{user.biography}</p>
                    </div>
                  )}

                  {/* Interests */}
                  {user.interests && user.interests.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 mt-4">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground">Interests</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {user.interests.map((interest) => (
                          <Badge key={interest.id} variant="outline" className="text-xs rounded-full bg-muted border-muted text-foreground transition-all hover:bg-secondary hover:border-secondary dark:bg-[oklch(0.280_0.020_132)] dark:text-[oklch(0.830_0.084_116)] dark:border-[oklch(0.280_0.020_132)] dark:hover:bg-[oklch(0.320_0.030_132)] dark:hover:text-[oklch(0.95_0.008_136)] dark:hover:border-[oklch(0.320_0.030_132)]">
                            {interest.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 justify-center md:justify-start">
                  <Button variant="outline" className="md:w-auto" onClick={() => setIsEditDialogOpen(true)}>
                    Edit Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                    <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Likes Received</p>
                    <p className="text-2xl font-bold">
                      {likes?.length ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Matches</p>
                    <p className="text-2xl font-bold">
                      {matches?.length ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profile Views</p>
                    <p className="text-2xl font-bold">
                      {profileViews?.length ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Edit Profile Dialog */}
        <EditProfileDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
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
