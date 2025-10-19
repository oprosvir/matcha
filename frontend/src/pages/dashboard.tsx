import { userApi } from "@/api/user/user";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function Dashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/sign-in");
  };

  return (
    <>
      <Button
        onClick={async () => {
          const user = await userApi.getOwnProfile();
          if (user.success) {
            toast.success("Successfully fetched user profile");
          } else {
            toast.error("Failed to fetch user profile");
          }
        }}
      >
        Get User
      </Button>
      <Button variant="destructive" onClick={handleSignOut}>
        Sign Out
      </Button>
    </>
  );
}
