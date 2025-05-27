import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleAuthCallback();
        navigate('/');
      } catch (error) {
        navigate('/unauthorized');
      }
    };

    handleCallback();
  }, [handleAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <img 
          src="/assets/yama-face.png" 
          alt="Yama" 
          className="w-16 h-16 mx-auto mb-4 animate-bounce" 
        />
        <p className="text-gray-600 dark:text-gray-300">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 