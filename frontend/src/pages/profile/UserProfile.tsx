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
  User as UserIcon,
  Clock,
  Award,
  ArrowLeft,
  Navigation,
  Calendar,
  Users,
  Search,
  MoreVertical,
  Ban,
  Flag,
} from "lucide-react";
import { calculateAge, formatMemberSince, formatLastSeen } from "@/utils/dateUtils";
import { getPhotoUrl } from "@/utils/photoUtils";
import { calculateDistance, formatDistance } from "@/utils/distanceUtils";

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
  const profilePic = user.photos?.find(p => p.isProfilePic);

  // Calculate distance from current user
  const distance = currentUser?.latitude && currentUser?.longitude &&
                   user.latitude && user.longitude
    ? calculateDistance(currentUser.latitude, currentUser.longitude, user.latitude, user.longitude)
    : null;

  return (
    <AppLayout>
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header with back button and actions */}
        <div className="flex items-center justify-between gap-2">
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

        {/* Profile Header Card */}
        <Card>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                {profilePic ? (
                  <img
                    src={getPhotoUrl(profilePic.url)}
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
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">
                      {user.firstName} {user.lastName}
                      {age && <span className="text-muted-foreground font-normal">, {age}</span>}
                    </h1>

                    {/* Gender, Interested in, Member Since */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
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
                      {user.createdAt && (
                        <>
                          {(user.gender || user.sexualOrientation) && <span>•</span>}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Member since {formatMemberSince(user.createdAt)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Online Status */}
                    <div className="flex items-center gap-2 mt-2">
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
                    </div>

                    {/* Connection Status Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
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
                </div>

                {/* Biography */}
                {user.biography && (
                  <p className="mt-4 text-sm">{user.biography}</p>
                )}

                {/* Location, Distance & Fame */}
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    {user.cityName && user.countryName ? (
                      <span>{user.cityName}, {user.countryName}</span>
                    ) : (
                      <span className="text-muted-foreground">Location not set</span>
                    )}
                  </div>
                  {distance !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="w-4 h-4" />
                      <span>{formatDistance(distance)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4" />
                    <span>Fame Rating: {user.fameRating}/100</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos Gallery */}
        {user.photos && user.photos.length > 0 && (
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {user.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    <img
                      src={getPhotoUrl(photo.url)}
                      alt="User photo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <Badge key={interest.id} variant="secondary">
                    {interest.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {!connectionStatus.youBlockedThem && (
          <Card>
            <CardContent>
              <div className="flex gap-2">
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
          </CardContent>
        </Card>
        )}
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
