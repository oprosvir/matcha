import { Routes, Navigate } from "react-router";
import { BrowserRouter, Route } from "react-router-dom";
import { Dashboard } from "./pages/dashboard";
import { Profile } from "./pages/profile";
import { Toaster } from "sonner";
import { AuthProvider, useAuth, useUser } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { Spinner } from "./components/ui/spinner";
import { AuthLayout } from "./components/layouts/AuthLayout";
import { Signin } from "./pages/auth/sign-in";
import { Signup } from "./pages/auth/sign-up";
import { ForgotPassword } from "./pages/auth/forgot-password";
import { SendVerifyEmail } from "./pages/auth/send-verify-email";
import { ResetPassword } from "./pages/auth/reset-password";
import { VerifyEmail } from "./pages/auth/verify-email";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { Chat } from "./pages/chat";

function EmailVerificationGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isSuccess, isError } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    toast.error("Failed to retrieve user data. Please sign in again.");
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (isSuccess && user && !user.isEmailVerified) {
    return <Navigate to="/auth/send-verify-email" replace />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return <EmailVerificationGuard>{children}</EmailVerificationGuard>;
}

function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Toaster />
          <Routes>
            <Route path="/auth" element={<AuthLayout />}>
              <Route index element={<Navigate to="sign-in" replace />} />
              <Route
                path="sign-in"
                element={
                  <PublicRoute>
                    <Signin />
                  </PublicRoute>
                }
              />
              <Route
                path="sign-up"
                element={
                  <PublicRoute>
                    <Signup />
                  </PublicRoute>
                }
              />
              <Route
                path="forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="reset-password"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="send-verify-email"
                element={
                  <AuthenticatedRoute>
                    <SendVerifyEmail />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="verify-email"
                element={
                  <AuthenticatedRoute>
                    <VerifyEmail />
                  </AuthenticatedRoute>
                }
              />
            </Route>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<div>404</div>} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
