import { useUser } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ProfileForm } from "@/components/ProfileForm";
import { AppLayout } from "@/components/layouts/AppLayout";

export function Profile() {
  const { user, isLoading, isSuccess } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">User not found.</p>
      </div>
    );
  }

  if (!isSuccess) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Failed to load profile data from the server.
        </p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">Keep your profile up to date</p>
        </div>

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
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Status:</span>
                <span
                  className={`font-medium ${
                    user.isEmailVerified ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {user.isEmailVerified ? "✓ Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
