import { useEffect } from 'react';
// import { useAuth } from '@/react-app/contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/react-app/utils/logger';

export default function AuthCallback() {
  // const { exchangeCodeForSessionToken } = useAuth();
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
          exchangeCodeForSessionToken(code);
        }
        // After successful login, redirect to check registration status
        navigate('/app/dashboard');
      } catch (error) {
        logger.error('Auth callback failed:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Completing authentication...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  );
}
