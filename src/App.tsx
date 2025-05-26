import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import SubmitTranscript from './pages/SubmitTranscript';
import AnalysisResults from './pages/AnalysisResults';
import HistoricalData from './pages/HistoricalData';
import FollowUps from './pages/FollowUps';
import AdminDashboard from './pages/admin/Dashboard';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

// Auth provider and guard
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/auth/RequireAuth';

function App() {
  const { initializeAuth, session, loading } = useAuthStore();

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
          <p className="text-gray-600 dark:text-gray-300">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/submit" element={<SubmitTranscript />} />
            <Route path="/analysis/:id" element={<AnalysisResults />} />
            <Route path="/historical" element={<HistoricalData />} />
            <Route path="/follow-ups" element={<FollowUps />} />
            
            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={
                <RequireAuth allowedRoles={['super_admin', 'admin']}>
                  <AdminDashboard />
                </RequireAuth>
              } 
            />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App