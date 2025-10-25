import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  User,
  Search,
  Heart,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/sign-in");
  };

  const navLinks: Array<{
    path: string;
    label: string;
    icon: LucideIcon;
    disabled?: boolean;
  }> = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/profile", label: "Profile", icon: User },
    { path: "/browse", label: "Browse", icon: Search, disabled: true },
    { path: "/matches", label: "Matches", icon: Heart, disabled: true },
    { path: "/chat", label: "Chat", icon: MessageCircle, disabled: false },
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Nav */}
            <div className="flex items-center gap-6">
              <Link to="/" className="text-2xl font-bold text-primary">
                Matcha
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex gap-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : link.disabled
                          ? "text-muted-foreground cursor-not-allowed"
                          : "hover:bg-accent hover:text-accent-foreground"
                      } ${link.disabled ? "pointer-events-none" : ""}`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                      {link.disabled && (
                        <Badge variant="secondary" className="ml-1 text-[10px]">
                          Soon
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sign out button */}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 flex-1 flex flex-col min-h-0">{children}</main>

      {/* Footer - Hidden on mobile due to bottom nav */}
      <footer className="hidden md:block border-t bg-card py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; 2025 Matcha. Made by{" "}
            <a
              href="https://github.com/ismaelmehdid"
              className="underline hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              @imehdid
            </a>{" "}
            and{" "}
            <a
              href="https://github.com/oprosvir"
              className="underline hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              @oprosvir
            </a>
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : link.disabled
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-foreground hover:text-primary"
                } ${link.disabled ? "pointer-events-none" : ""}`}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`text-[10px] ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
