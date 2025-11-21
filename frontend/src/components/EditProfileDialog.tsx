import { useUser } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/ProfileForm";
import { InterestsSelector } from "@/components/InterestsSelector";
import { LocationSelector } from "@/components/LocationSelector";
import { PhotoManager } from "@/components/PhotoManager";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { user, isLoading, isSuccess } = useUser();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information, photos, and preferences
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner />
          </div>
        )}

        {!isLoading && !user && (
          <div className="text-center py-8">
            <p className="text-destructive">User not found.</p>
          </div>
        )}

        {!isLoading && !isSuccess && (
          <div className="text-center py-8">
            <p className="text-destructive">
              Failed to load profile data from the server.
            </p>
          </div>
        )}

        {!isLoading && user && isSuccess && (
          <>
            <div className="h-[550px] flex flex-col gap-4">
              <Tabs defaultValue="info" className="w-full flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                  <TabsTrigger value="interests">Interests</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden relative pt-4">
                  <TabsContent value="info" className="space-y-4 h-full overflow-y-auto absolute inset-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProfileForm user={user} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Username:</span>
                        <span className="font-medium">{user.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email Status:</span>
                        <span className="font-medium text-green-600">
                          ✓ Verified
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fame Rating:</span>
                        <span className="font-medium">{user.fameRating}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

                  <TabsContent value="location" className="h-full overflow-y-auto absolute inset-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Update your location to help us show you better matches in your area
                    </p>
                    <LocationSelector
                      standalone
                      currentLocation={
                        user.latitude && user.longitude
                          ? {
                              latitude: user.latitude,
                              longitude: user.longitude,
                              cityName: user.cityName || undefined,
                              countryName: user.countryName || undefined,
                            }
                          : null
                      }
                    />
                  </CardContent>
                </Card>
              </TabsContent>

                  <TabsContent value="photos" className="h-full overflow-y-auto absolute inset-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Photo Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload up to 6 photos. Click the star to set your profile picture.
                    </p>
                    <PhotoManager />
                  </CardContent>
                </Card>
              </TabsContent>

                  <TabsContent value="interests" className="h-full overflow-y-auto absolute inset-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select your interests to help others find common ground with you
                    </p>
                    <InterestsSelector currentInterests={user.interests} />
                  </CardContent>
                </Card>
                  </TabsContent>
                </div>
              </Tabs>

              <DialogFooter className="flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
