import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@/react-app/hooks/useAuth';
import { UserRoleType } from '@/shared/types';
import ThemeToggle from '@/react-app/components/ThemeToggle';
import { ArrowLeft, LogIn, Mail, Lock, Eye, EyeOff, Send } from 'lucide-react';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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
    
    // Validate form fields
    const newErrors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // If there are validation errors, show them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // TODO: Implement actual email/password authentication
      // For now, create a mock user object for testing
      const mockUser = {
        id: "12345",
        name: "Test User",
        email: formData.email,
        role: role as UserRoleType,
        avatar: '🧑‍🏫'
      };
      
      login(mockUser);
    } catch {
      setErrors({ email: 'Login failed. Please check your credentials.' });
    } finally {
      setIsLoading(false);
    }
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
    
    // Clear error messages when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
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

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setErrors({});
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowOTPVerification(false);
    setShowResetPassword(false);
    setForgotPasswordEmail('');
    setOtp(['', '', '', '', '', '']);
    setResetPasswordData({ newPassword: '', confirmPassword: '' });
    setErrors({});
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrors({ otp: 'Please enter all 6 digits' });
      return;
    }

    setIsVerifyingOTP(true);
    
    try {
      // TODO: Implement actual OTP verification logic here
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message and then show reset password form
      setErrors({ success: 'OTP verified successfully! You can now reset your password.' });
      
      // After showing success message, hide OTP verification and show reset password
      setTimeout(() => {
        setOtp(['', '', '', '', '', '']);
        setShowOTPVerification(false);
        setShowResetPassword(true);
        setErrors({});
      }, 2000);
      
    } catch {
      setErrors({ otp: 'Invalid OTP. Please try again.' });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResetPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetPasswordData({
      ...resetPasswordData,
      [e.target.name]: e.target.value
    });
    
    // Clear error messages when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form fields
    const newErrors: Record<string, string> = {};
    
    // New password validation
    if (!resetPasswordData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (resetPasswordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(resetPasswordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    // Confirm password validation
    if (!resetPasswordData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // If there are validation errors, show them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsResettingPassword(true);
    
    try {
      // TODO: Implement actual password reset logic here
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message and redirect back to login
      setErrors({ success: 'Password reset successfully! You can now login with your new password.' });
      
      // Reset form and redirect back to login after successful password reset
      setTimeout(() => {
        setResetPasswordData({ newPassword: '', confirmPassword: '' });
        setShowResetPassword(false);
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setErrors({});
      }, 3000);
      
    } catch {
      setErrors({ resetPassword: 'Failed to reset password. Please try again.' });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!forgotPasswordEmail) {
      setErrors({ forgotPassword: 'Please enter your email address' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setErrors({ forgotPassword: 'Please enter a valid email address' });
      return;
    }

    setIsSendingOTP(true);
    
    try {
      // TODO: Implement actual OTP sending logic here
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message first
      setErrors({ success: 'OTP sent successfully! Please check your email.' });
      
      // After showing success message, hide forgot password and show OTP verification
      setTimeout(() => {
        setShowForgotPassword(false);
        setShowOTPVerification(true);
        setErrors({});
      }, 2000);
      
    } catch {
      setErrors({ forgotPassword: 'Failed to send OTP. Please try again.' });
    } finally {
      setIsSendingOTP(false);
    }
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

            {/* Login Method Toggle - Hidden during forgot password, OTP verification, and reset password */}
            {!showForgotPassword && !showOTPVerification && !showResetPassword && (
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
            )}

            {/* Error Messages - Only for Google login errors */}
            {errors.google && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                {errors.google}
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

            {/* Forgot Password Component */}
            {showForgotPassword && (
              <div className="space-y-4 mb-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Reset Password
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter your email address and we'll send you an OTP to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => {
                          setForgotPasswordEmail(e.target.value);
                          // Clear error messages when user starts typing
                          if (errors.forgotPassword) {
                            setErrors({
                              ...errors,
                              forgotPassword: ''
                            });
                          }
                        }}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                          errors.forgotPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Enter your email address"
                        disabled={isSendingOTP}
                      />
                    </div>
                    {errors.forgotPassword && <p className="text-red-500 text-sm mt-1">{errors.forgotPassword}</p>}
                    {errors.success && <p className="text-green-500 text-sm mt-1">{errors.success}</p>}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      disabled={isSendingOTP}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingOTP}
                      className={`flex-1 bg-gradient-to-r ${roleInfo.gradient} text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                      {isSendingOTP ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send OTP
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* OTP Verification Component */}
            {showOTPVerification && (
              <div className="space-y-4 mb-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Verify OTP
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter the 6-digit code sent to <span className="font-semibold">{forgotPasswordEmail}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="flex justify-center gap-3 mb-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                        className={`w-12 h-12 text-center text-xl font-bold rounded-lg border-2 ${
                          errors.otp ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                        disabled={isVerifyingOTP}
                      />
                    ))}
                  </div>
                  
                  {errors.otp && <p className="text-red-500 text-sm text-center">{errors.otp}</p>}
                  {errors.success && <p className="text-green-500 text-sm text-center">{errors.success}</p>}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      disabled={isVerifyingOTP}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifyingOTP || otp.join('').length !== 6}
                      className={`flex-1 bg-gradient-to-r ${roleInfo.gradient} text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                      {isVerifyingOTP ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Verify OTP
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      setErrors({});
                      setIsSendingOTP(true);
                      
                      try {
                        // TODO: Implement actual OTP resending logic here
                        // For now, we'll simulate the API call
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Show success message
                        setErrors({ success: 'OTP resent successfully! Please check your email.' });
                        
                        // Clear OTP fields
                        setOtp(['', '', '', '', '', '']);
                        
                      } catch {
                        setErrors({ otp: 'Failed to resend OTP. Please try again.' });
                      } finally {
                        setIsSendingOTP(false);
                      }
                    }}
                    disabled={isSendingOTP}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingOTP ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                        Resending...
                      </>
                    ) : (
                      <>
                        Didn't receive the code? <span className="underline">Resend OTP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Reset Password Component */}
            {showResetPassword && (
              <div className="space-y-4 mb-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Reset Password
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter your new password for <span className="font-semibold">{forgotPasswordEmail}</span>
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="newPassword"
                        value={resetPasswordData.newPassword}
                        onChange={handleResetPasswordChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                          errors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Enter your new password"
                        disabled={isResettingPassword}
                      />
                    </div>
                    {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={resetPasswordData.confirmPassword}
                        onChange={handleResetPasswordChange}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Confirm your new password"
                        disabled={isResettingPassword}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>

                  {errors.resetPassword && <p className="text-red-500 text-sm text-center">{errors.resetPassword}</p>}
                  {errors.success && <p className="text-green-500 text-sm text-center">{errors.success}</p>}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      disabled={isResettingPassword}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      className={`flex-1 bg-gradient-to-r ${roleInfo.gradient} text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                      {isResettingPassword ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Reset Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Email/Password Login */}
            {loginMethod === 'email' && !showForgotPassword && !showOTPVerification && !showResetPassword && (
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

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300"
                  >
                    Forgot Password?
                  </button>
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

            {/* Register Button - Only for non-admin roles and when not showing forgot password, OTP verification, or reset password */}
            {!isAdmin && !showForgotPassword && !showOTPVerification && !showResetPassword && (
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
