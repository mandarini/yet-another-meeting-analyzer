import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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

// Auth provider
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/auth/RequireAuth";

function App() {
  const { loading, user } = useAuthStore();

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
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/auth/callback"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Protected routes with layout */}
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={user ? <Dashboard /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/submit"
              element={
                user ? <SubmitTranscript /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/analysis/:id"
              element={
                user ? <AnalysisResults /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/historical"
              element={
                user ? <HistoricalData /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/follow-ups"
              element={user ? <FollowUps /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/companies"
              element={user ? <Companies /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/companies/:id"
              element={
                user ? <CompanyProfile /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/pain-points"
              element={user ? <PainPoints /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/opportunities"
              element={
                user ? <Opportunities /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/admin"
              element={
                user ? (
                  <RequireAuth allowedRoles={["super_admin", "admin"]}>
                    <AdminDashboard />
                  </RequireAuth>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
