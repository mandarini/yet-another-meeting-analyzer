import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';

const Login = () => {
  const { signInWithGoogle, signInWithGithub, loading, error } = useAuthStore();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    await signInWithGoogle();
  };

  const handleGithubSignIn = async () => {
    setLoginError(null);
    await signInWithGithub();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex flex-col items-center mb-6">
            <img 
              src="/assets/yama-io.png"
              alt="Yama Logo" 
              className="w-48 h-48 object-contain mb-4" 
            />
            <h1 className="text-4xl font-bold text-[#FF7B7B] dark:text-[#FF9B9B]">Yama</h1>
            <h2 className="mt-2 text-xl text-gray-600 dark:text-gray-300">
              Yet Another Meeting Analyzer
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Transform your meetings into actionable insights with AI-powered analysis
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
          {(loginError || error) && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-md text-sm">
              {loginError || error}
            </div>
          )}
          
          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              fullWidth
              variant="outline"
              isLoading={loading}
              disabled={loading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Button>

            <Button
              onClick={handleGithubSignIn}
              fullWidth
              variant="outline"
              isLoading={loading}
              disabled={loading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              {loading ? 'Signing in...' : 'Sign in with GitHub'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;