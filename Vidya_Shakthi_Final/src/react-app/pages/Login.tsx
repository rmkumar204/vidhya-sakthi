import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/react-app/hooks/useAuth';
import { UserRoleType } from '@/shared/types';
import ThemeToggle from '@/react-app/components/ThemeToggle';
import { ArrowLeft, LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const roleDescriptions = {
  mentor: {
    title: 'Mentor Login',
    description: 'Share your expertise and guide the next generation',
    gradient: 'from-blue-500 to-blue-700',
    icon: '🎓'
  },
  mentee: {
    title: 'Mentee Login',
    description: 'Learn from experienced professionals and grow your skills',
    gradient: 'from-green-500 to-green-700',
    icon: '🌱'
  },
  reviewer: {
    title: 'Reviewer Login',
    description: 'Evaluate projects and provide valuable feedback',
    gradient: 'from-purple-500 to-purple-700',
    icon: '📋'
  },
  state_admin: {
    title: 'State Administrator Login',
    description: 'Manage users and projects within your state',
    gradient: 'from-orange-500 to-orange-700',
    icon: '🏛️'
  },
  super_admin: {
    title: 'Super Administrator Login',
    description: 'Complete system access across all regions',
    gradient: 'from-red-500 to-red-700',
    icon: '👑'
  }
};

export default function Login() {
  const { role } = useParams<{ role: UserRoleType }>();
  const navigate = useNavigate();
  const { user, isPending, redirectToLogin,login } = useAuth();

  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const roleInfo = role ? roleDescriptions[role] : null;

  useEffect(() => {
    if (user && !isPending) {
      navigate('/app/dashboard');
    }
  }, [user, isPending, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await redirectToLogin();
    } catch (error) {
      console.error('Google login failed:', error);
      setErrors({ google: 'Google login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    // setIsLoading(true);
    const userData = {
      id: "12345",
      name: "Ram Kumar",
      email: formData.email,
      role: role as "mentee" | "mentor" | "state_admin" | "super_admin",
      avatar: '🧑‍🏫'
    };
    login(userData);
  //  localStorage.setItem("user", JSON.stringify({
  //     id: "12345",
  //     name: "Ram Kumar",
  //     email: "ramkumar@example.com",
  //     role: "mentee",
  //     avatar: '🧑‍🏫'
  //   }));
  //   navigate('/app/dashboard');

    // try {
    //   // Validate form data
    //   EmailPasswordLoginSchema.parse(formData);

    //   const response = await fetch('/api/auth/login', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ ...formData, role }),
    //   });

    //   if (response.ok) {
    //     navigate('/app/dashboard');
    //   } else {
    //     const data = await response.json();
    //     setErrors({ email: data.error || 'Login failed' });
    //   }
    // } catch (error: any) {
    //   const newErrors: Record<string, string> = {};
    //   error.errors?.forEach((err: any) => {
    //     newErrors[err.path[0]] = err.message;
    //   });
    //   setErrors(newErrors);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBack = () => {
    if (role && ['state_admin', 'super_admin'].includes(role)) {
      navigate('/admin-login');
    } else {
      navigate('/');
    }
  };

  const handleRegister = () => {
    navigate(`/register/${role}`);
  };

  if (!role || !roleInfo) {
    return <div>Invalid role</div>;
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = ['state_admin', 'super_admin'].includes(role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-colors duration-500">
      <ThemeToggle />
      
      {/* Logo */}
      <div className="absolute top-8 left-20 z-40 animate-fade-in">
        <img 
          src="https://mocha-cdn.com/019919f5-097e-7a4c-a5b4-3db644c27839/app-icon.png" 
          alt="Vidya Shakti Yuva Logo" 
          className="w-12 h-12 md:w-16 md:h-16 rounded-xl shadow-lg" 
        />
      </div>

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 p-3 rounded-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-300 shadow-lg"
      >
        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Login Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{roleInfo.icon}</div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r ${roleInfo.gradient} bg-clip-text text-transparent mb-2`}>
                {roleInfo.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {roleInfo.description}
              </p>
            </div>

            {/* Login Method Toggle */}
            <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setLoginMethod('google')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginMethod === 'google'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Google
              </button>
              <button
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  loginMethod === 'email'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Email
              </button>
            </div>

            {/* Error Messages */}
            {(errors.google || errors.email) && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                {errors.google || errors.email}
              </div>
            )}

            {/* Google Login */}
            {loginMethod === 'google' && (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`w-full bg-gradient-to-r ${roleInfo.gradient} text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 mb-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Login with Google
                  </>
                )}
              </button>
            )}

            {/* Email/Password Login */}
            {loginMethod === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                        errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                        errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r ${roleInfo.gradient} text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Login
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Register Button - Only for non-admin roles */}
            {!isAdmin && (
              <div className="text-center">
                <button
                  onClick={handleRegister}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                >
                  Don't have an account? <span className="underline">Register here</span>
                </button>
              </div>
            )}
          </div>

          {/* Brand */}
          <div className="text-center mt-8">
            <p className="text-gray-500 dark:text-gray-400">
              Powered by <span className="font-semibold">Vidya Shakti Yuva</span>
            </p>
          </div>
        </div>
      </div>

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl animate-float-delayed"></div>
      </div>
    </div>
  );
}
