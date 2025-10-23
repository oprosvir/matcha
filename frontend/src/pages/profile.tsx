import { useUser } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ProfileForm } from "@/components/ProfileForm";
import { AppLayout } from "@/components/layouts/AppLayout";

export function Profile() {
  const { user, isLoading } = useUser();

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

  if (!user.success) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load profile data from the server.</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-muted-foreground mb-6">Keep your profile up to date</p>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-medium">{user.data.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.data.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Status:</span>
                <span
                  className={`font-medium ${
                    user.data.isEmailVerified ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {user.data.isEmailVerified ? "✓ Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
