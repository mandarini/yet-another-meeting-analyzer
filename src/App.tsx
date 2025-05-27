import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";

// Layout
import AppLayout from "./components/layout/AppLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import SubmitTranscript from "./pages/SubmitTranscript";
import AnalysisResults from "./pages/AnalysisResults";
import HistoricalData from "./pages/HistoricalData";
import FollowUps from "./pages/FollowUps";
import Companies from "./pages/Companies";
import CompanyProfile from "./pages/CompanyProfile";
import PainPoints from "./pages/PainPoints";
import Opportunities from "./pages/Opportunities";
import AdminDashboard from "./pages/admin/Dashboard";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import AuthCallback from "./pages/AuthCallback";

// Authenticated Route Component
function AuthenticatedRoute({
  children,
  requireSuperAdmin = false,
}: {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}) {
  const { user, isSuperAdmin, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <img
            src="/assets/yama-face.png"
            alt="Yama"
            className="w-16 h-16 mx-auto mb-4 animate-bounce"
          />
          <p className="text-gray-600 dark:text-gray-300">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in at all, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If admin route is requested but user is not super admin, redirect to dashboard
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // Everyone who is logged in gets access to regular routes
  return <>{children}</>;
}

function App() {
  const { loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <img
            src="/assets/yama-face.png"
            alt="Yama"
            className="w-16 h-16 mx-auto mb-4 animate-bounce"
          />
          <p className="text-gray-600 dark:text-gray-300">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <AuthenticatedRoute>
                <Dashboard />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <AuthenticatedRoute>
                <SubmitTranscript />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/analysis/:id"
            element={
              <AuthenticatedRoute>
                <AnalysisResults />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/historical"
            element={
              <AuthenticatedRoute>
                <HistoricalData />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/follow-ups"
            element={
              <AuthenticatedRoute>
                <FollowUps />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <AuthenticatedRoute>
                <Companies />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/companies/:id"
            element={
              <AuthenticatedRoute>
                <CompanyProfile />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/pain-points"
            element={
              <AuthenticatedRoute>
                <PainPoints />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/opportunities"
            element={
              <AuthenticatedRoute>
                <Opportunities />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AuthenticatedRoute requireSuperAdmin>
                <AdminDashboard />
              </AuthenticatedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
