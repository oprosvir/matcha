import { Routes, useLocation, Navigate } from "react-router";
import { BrowserRouter, Route } from "react-router-dom";
import { Register } from "./pages/sign-up";
import { Login } from "./pages/sign-in";
import { Dashboard } from "./pages/dashboard";
import { ForgotPassword } from "./pages/forgot-password";
import { Toaster } from "sonner";
import { ResetPassword } from "./pages/reset-password";
import { VerifyEmail } from "./pages/verify-email";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Spinner } from "./components/ui/spinner";

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
    return <Navigate to="/sign-in" replace />;
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

function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route
        path="/sign-in"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/sign-up"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/sign-in/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/sign-in/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/sign-up/verify-email"
        element={
          <ProtectedRoute>
            <VerifyEmail />
          </ProtectedRoute>
        }
      />
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
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
