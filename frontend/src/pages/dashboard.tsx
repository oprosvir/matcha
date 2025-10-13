import { UsersAPI } from "@/api/users";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/auth/sign-in");
  };

  return (
    <>
      <Button
        onClick={async () => {
          const user = await UsersAPI.getCurrentUser();
          console.log(user);
        }}
      >
        Get User
      </Button>
      <Button variant="destructive" onClick={handleLogout}>
        Logout
      </Button>
    </>
  );
}
