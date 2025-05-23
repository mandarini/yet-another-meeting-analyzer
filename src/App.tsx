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
import NotFound from './pages/NotFound';

// Auth provider
import { AuthProvider } from './context/AuthContext';

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
          
          <Route element={<AppLayout />}>
            <Route path="/" element={session ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/submit" element={session ? <SubmitTranscript /> : <Navigate to="/login" />} />
            <Route path="/analysis/:id" element={session ? <AnalysisResults /> : <Navigate to="/login" />} />
            <Route path="/historical" element={session ? <HistoricalData /> : <Navigate to="/login" />} />
            <Route path="/follow-ups" element={session ? <FollowUps /> : <Navigate to="/login" />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
