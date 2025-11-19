import { useParams, useNavigate } from "react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useRecordProfileView } from "@/hooks/useRecordProfileView";
import { useCurrentUser } from "@/hooks/useUserProfile";
import { useLikeUser } from "@/hooks/useLikeUser";
import { useUnlikeUser } from "@/hooks/useUnlikeUser";
import { useUserActions } from "@/hooks/useUserActions";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlockUserDialog } from "@/components/BlockUserDialog";
import { ReportUserDialog } from "@/components/ReportUserDialog";
import {
  MapPin,
  Heart,
  MessageCircle,
  Clock,
  Award,
  ArrowLeft,
  Users,
  Search,
  MoreVertical,
  Ban,
  Flag,
} from "lucide-react";
import { calculateAge, formatLastSeen } from "@/utils/dateUtils";
import { calculateDistance, formatDistance } from "@/utils/distanceUtils";
import { PhotoCarousel } from "@/components/PhotoCarousel";

// Helper function to format sexual orientation as "interested in"
function formatInterestedIn(gender: string | null, sexualOrientation: string | null): string {
  if (!sexualOrientation) return "";

  if (sexualOrientation === "bisexual") return "Everyone";

  if (!gender) {
    return sexualOrientation === "straight" ? "Opposite sex" : "Same sex";
  }

  if (gender === "male") {
    return sexualOrientation === "straight" ? "Women" : "Men";
  } else {
    return sexualOrientation === "straight" ? "Men" : "Women";
  }
}

export function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, isLoading, isError } = usePublicProfile(username || null);
  const recordView = useRecordProfileView();
  const { data: currentUser } = useCurrentUser();
  const { likeUser, isPending: isLiking } = useLikeUser();
  const { unlikeUser, isPending: isUnliking } = useUnlikeUser();

  const userId = profile?.user.id;

  // Record profile view on mount
  useEffect(() => {
    if (userId && !recordView.isSuccess) {
      recordView.mutate(userId);
    }
  }, [userId]);

  // Handle like/unlike
  const handleLikeToggle = () => {
    if (!userId) return;

    if (profile?.connectionStatus.youLikedThem) {
      unlikeUser(userId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['public-profile', username] });
        },
      });
    } else {
      likeUser(userId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['public-profile', username] });
        },
      });
    }
  };

  // Handle message navigation
  const handleMessage = () => {
    navigate(`/chat?with=${username}`);
  };

  // State for dialogs
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string>("fake_account");

  // Use shared user actions hook
  const { blockMutation, unblockMutation, reportMutation } = useUserActions({
    username,
    onBlockSuccess: () => {
      setBlockDialogOpen(false);
      navigate('/browse');
    },
    onReportSuccess: () => {
      setReportDialogOpen(false);
      setSelectedReportReason("fake_account");
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Spinner />
        </div>
      </AppLayout>
    );
  }

  if (isError || !profile) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <Card>
            <CardContent className="py-16 text-center">
              <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
              <p className="text-muted-foreground mb-4">
                This user's profile could not be loaded.
              </p>
              <Button onClick={() => navigate('/browse')}>
                Back to Browse
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const { user, connectionStatus, isOnline } = profile;
  const age = user.dateOfBirth ? calculateAge(user.dateOfBirth) : null;

  // Calculate distance from current user
  const distance = currentUser?.latitude && currentUser?.longitude &&
                   user.latitude && user.longitude
    ? calculateDistance(currentUser.latitude, currentUser.longitude, user.latitude, user.longitude)
    : null;

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0 w-full max-w-5xl mx-auto">
        {/* Header with back button and actions */}
        <div className="flex items-center justify-between gap-2 flex-shrink-0 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* 3-dot menu for Block/Report */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {connectionStatus.youBlockedThem ? (
                <DropdownMenuItem
                  onClick={() => userId && unblockMutation.mutate(userId)}
                  disabled={unblockMutation.isPending}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {unblockMutation.isPending ? "Unblocking..." : "Unblock User"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setBlockDialogOpen(true)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Block User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                <Flag className="mr-2 h-4 w-4" />
                Report User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Unified Profile Card with 2-Column Layout */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="p-0 flex-1 overflow-y-auto md:overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 md:h-full divide-x">
              {/* LEFT: Photo Carousel (50%) */}
              <div className="p-4 flex items-center justify-center md:overflow-hidden">
                <div className="w-full max-w-md">
                  <PhotoCarousel photos={user.photos} userName={user.firstName} />
                </div>
              </div>

              {/* RIGHT: All User Info */}
              <div className="p-4 md:overflow-y-auto space-y-3 flex flex-col">
                {/* HEADER: Name & Status */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">
                    {user.firstName} {user.lastName}
                    {age && <span className="text-muted-foreground font-normal">, {age}</span>}
                  </h1>

                  {/* Location & Distance - under name */}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {user.cityName && user.countryName ? (
                        <span>{user.cityName}, {user.countryName}</span>
                      ) : (
                        <span>Location not set</span>
                      )}
                    </div>
                    {distance !== null && (
                      <>
                        <span>•</span>
                        <span>{formatDistance(distance)}</span>
                      </>
                    )}
                  </div>

                  {/* Gender, Interested in, Fame rating */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {user.gender && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="capitalize">{user.gender}</span>
                      </div>
                    )}
                    {user.sexualOrientation && (
                      <>
                        {user.gender && <span>•</span>}
                        <div className="flex items-center gap-1">
                          <Search className="w-3 h-3" />
                          <span>Interested in: {formatInterestedIn(user.gender, user.sexualOrientation)}</span>
                        </div>
                      </>
                    )}
                    <>
                      {(user.gender || user.sexualOrientation) && <span>•</span>}
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>Fame rating: {user.fameRating}/100</span>
                      </div>
                    </>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isOnline ? (
                      <Badge variant="default" className="bg-green-500">
                        <Clock className="w-3 h-3 mr-1" />
                        Online now
                      </Badge>
                    ) : (
                      user.lastTimeActive && (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Last seen {formatLastSeen(user.lastTimeActive)}
                        </Badge>
                      )
                    )}
                    {connectionStatus.youBlockedThem && (
                      <Badge variant="destructive">
                        <Ban className="w-3 h-3 mr-1" />
                        Blocked
                      </Badge>
                    )}
                    {!connectionStatus.youBlockedThem && connectionStatus.isConnected && (
                      <Badge variant="default">
                        <Heart className="w-3 h-3 mr-1 fill-current" />
                        Connected
                      </Badge>
                    )}
                    {!connectionStatus.youBlockedThem && !connectionStatus.isConnected && connectionStatus.theyLikedYou && (
                      <Badge variant="secondary">
                        <Heart className="w-3 h-3 mr-1" />
                        Liked you
                      </Badge>
                    )}
                    {!connectionStatus.youBlockedThem && !connectionStatus.isConnected && connectionStatus.youLikedThem && (
                      <Badge variant="outline">
                        <Heart className="w-3 h-3 mr-1" />
                        You liked
                      </Badge>
                    )}
                  </div>
                </div>

                {/* BIOGRAPHY Section */}
                {user.biography && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">About</h3>
                    <p className="text-sm leading-relaxed">{user.biography}</p>
                  </div>
                )}

                {/* INTERESTS Section */}
                {user.interests && user.interests.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Interests</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {user.interests.map((interest) => (
                        <Badge key={interest.id} variant="secondary" className="text-xs">
                          {interest.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS - Always at bottom */}
                {!connectionStatus.youBlockedThem && (
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button
                      onClick={handleLikeToggle}
                      disabled={isLiking || isUnliking}
                      className="flex-1"
                      variant={connectionStatus.youLikedThem ? "outline" : "default"}
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${connectionStatus.youLikedThem ? "fill-current" : ""}`}
                      />
                      {connectionStatus.youLikedThem ? "Unlike" : "Like"}
                    </Button>
                    {connectionStatus.isConnected && (
                      <Button onClick={handleMessage} className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Block User Dialog */}
      <BlockUserDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        onConfirm={() => userId && blockMutation.mutate(userId)}
        isPending={blockMutation.isPending}
        userName={user.firstName}
      />

      {/* Report User Dialog */}
      <ReportUserDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onConfirm={(reason) => userId && reportMutation.mutate({ userId, reason })}
        isPending={reportMutation.isPending}
        userName={user.firstName}
        selectedReason={selectedReportReason}
        onReasonChange={setSelectedReportReason}
      />
    </AppLayout>
  );
}
