import { Routes, useLocation, Navigate } from "react-router";
import { BrowserRouter, Route } from "react-router-dom";
import { Dashboard } from "./pages/dashboard";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Spinner } from "./components/ui/spinner";
import { AuthLayout } from "./pages/auth/layout";
import { Signin } from "./pages/auth/sign-in";
import { Signup } from "./pages/auth/sign-up";
import { ForgotPassword } from "./pages/auth/forgot-password";
import { ResetPassword } from "./pages/auth/reset-password";
import { VerifyEmail } from "./pages/auth/verify-email";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

function PublicRoute({ children }: { children: React.ReactNode }) {
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
              path="verify-email"
              element={
                <ProtectedRoute>
                  <VerifyEmail />
                </ProtectedRoute>
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
          <Route path="*" element={<div>404</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
