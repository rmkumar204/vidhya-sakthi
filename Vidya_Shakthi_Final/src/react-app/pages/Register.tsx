import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { useAuth } from '@/react-app/contexts/AuthContext';
import { useAuth } from '@/react-app/hooks/useAuth';
import { UserRoleType, PersonalDetailsSchema, EducationalDetailsSchema, PreferencesSchema, RegistrationStepType, PersonalDetailsType, EducationalDetailsType, PreferencesType } from '@/shared/types';
import ThemeToggle from '@/react-app/components/ThemeToggle';
import RegistrationStepper from '@/react-app/components/RegistrationStepper';
import PersonalDetailsStep from '@/react-app/components/PersonalDetailsStep';
import EducationalDetailsStep from '@/react-app/components/EducationalDetailsStep';
import PreferencesStep from '@/react-app/components/PreferencesStep';
import { ArrowLeft, ArrowRight, Check, Mail, Send } from 'lucide-react';

const roleInfo: Record<string, { title: string; icon: string; color: string }> = {
  mentor: { title: 'Mentor Registration', icon: '🎓', color: 'blue' },
  mentee: { title: 'Mentee Registration', icon: '🌱', color: 'green' },
  reviewer: { title: 'Reviewer Registration', icon: '📋', color: 'purple' },
  state_admin: { title: 'State Admin Registration', icon: '🏛️', color: 'orange' },
  super_admin: { title: 'Super Admin Registration', icon: '👑', color: 'red' }
};

const steps = [
  { key: 'personal' as RegistrationStepType, title: 'Personal Details', description: 'Basic information' },
  { key: 'educational' as RegistrationStepType, title: 'Education & Experience', description: 'Academic & professional' },
  { key: 'preferences' as RegistrationStepType, title: 'Preferences', description: 'Goals & availability' }
];

export default function Register() {
  const { role } = useParams<{ role: UserRoleType }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<RegistrationStepType>('personal');
  const [completedSteps, setCompletedSteps] = useState<RegistrationStepType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-step: verify email and OTP flow
  type Phase = 'verifyEmail' | 'verifyOtp' | 'form';
  const [phase, setPhase] = useState<Phase>('verifyEmail');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Form data state
  const [personalData, setPersonalData] = useState<PersonalDetailsType>({
    first_name: '',
    middle_name: '',
    last_name: '',
    mobile_number: '',
    date_of_birth: '',
    state: '',
    district: '',
    block: '',
    place_city: '',
    pin_code: '',
    password: ''
  });

  const [educationalData, setEducationalData] = useState<EducationalDetailsType>({
    education: [{ degree_diploma: '', subject: '', year_of_completion: new Date().getFullYear() }],
    experience: [],
    languages: [{ language: '', can_read: false, can_write: false, can_speak: false, can_understand: false }]
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [preferencesData, setPreferencesData] = useState<PreferencesType>({
    max_hours_per_week: undefined,
    skills_interests: [],
    availability: {
      weekdays: false,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: false
    }
  });

  const validateStep = (step: RegistrationStepType): boolean => {
    setErrors({});
    
    try {
      switch (step) {
        case 'personal':
          PersonalDetailsSchema.parse(personalData);
          // Role-based age validation
          if (personalData.date_of_birth) {
            const today = new Date();
            const dob = new Date(personalData.date_of_birth);
            const age = today.getFullYear() - dob.getFullYear() - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
            const roleMinAge = role === 'mentee' ? 14 : (role === 'mentor' || role === 'reviewer' ? 18 : 18);
            if (isNaN(age) || age < roleMinAge) {
              setErrors({ date_of_birth: `Minimum age is ${roleMinAge} years for this role` });
              return false;
            }
          }
          break;
        case 'educational':
          EducationalDetailsSchema.parse(educationalData);
          break;
        case 'preferences':
          PreferencesSchema.parse(preferencesData);
          break;
      }
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        const path = err.path.join('.');
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
  };


// Check user and send OTP
const handleVerifyUser = async () => {
  setErrors({});
  if (!verifyEmail.trim()) { setErrors({ verifyEmail: 'Email is required' }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verifyEmail)) { setErrors({ verifyEmail: 'Please enter a valid email address' }); return; }

  setIsCheckingUser(true);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/check-user?email=${encodeURIComponent(verifyEmail)}`);
    const data = await res.json();
    if (data.exists) {
      setErrors({ success: 'User already exists. Redirecting to login...' });
      setTimeout(() => navigate(`/login/${role}`), 1500);
      return;
    }
    setIsSendingOtp(true);
    await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyEmail, purpose: 'register' })
    });
    setErrors({ success: 'OTP sent successfully! Please check your email.' });
    setTimeout(() => { setErrors({}); setPhase('verifyOtp'); }, 1000);
  } catch {
    setErrors({ verifyEmail: 'Failed to verify user. Please try again.' });
  } finally {
    setIsSendingOtp(false); setIsCheckingUser(false);
  }
};

// Verify OTP
const handleVerifyOtp = async () => {
  setErrors({});
  const otpString = otp.join('');
  if (otpString.length !== 6) { setErrors({ otp: 'Please enter all 6 digits' }); return; }
  setIsVerifyingOtp(true);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyEmail, otp: otpString, purpose: 'register' })
    });
    if (!res.ok) throw new Error();
    setErrors({ success: 'OTP verified successfully!' });
    setTimeout(() => { setErrors({}); setPhase('form'); }, 800);
  } catch {
    setErrors({ otp: 'Invalid OTP. Please try again.' });
  } finally {
    setIsVerifyingOtp(false);
  }
};

  
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value.replace(/\D/g, '');
    setOtp(next);
    if (value && index < 5) {
      document.getElementById(`reg-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`reg-otp-${index - 1}`)?.focus();
    }
  };

 
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const nextStep = () => {
    setSubmitAttempted(true);
    if (!validateStep(currentStep)) return;
    setSubmitAttempted(false);
    
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
  
    try {
      // 1) Register user to get token (email from verifyEmail, password in personalData)
      const regRes = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, password: personalData.password, role })
      });
  
      if (!regRes.ok) {
        const msg = await regRes.text();
        setErrors({ submit: msg || 'Registration failed' });
        setIsSubmitting(false);
        return;
      }
      const regData = await regRes.json();
      const token = regData.token;
  
      // 2) Complete registration with profile details
      const registrationData = {
        role: role as UserRoleType,
        personal: {
          first_name: personalData.first_name,
          middle_name: personalData.middle_name,
          last_name: personalData.last_name,
          mobile_number: personalData.mobile_number,
          date_of_birth: personalData.date_of_birth,
          state: personalData.state,
          district: personalData.district,
          block: personalData.block,
          place_city: personalData.place_city,
          pin_code: personalData.pin_code
        },
        educational: educationalData,
        preferences: preferencesData
      };
  
      const compRes = await fetch(`${API_BASE_URL}/auth/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(registrationData),
      });
  
      if (compRes.ok) {
        navigate(`/login/${role}`);
      } else {
        const data = await compRes.json();
        setErrors({ submit: data.error || 'Registration completion failed' });
      }
    } catch {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleBack = () => {
    if (phase === 'verifyEmail') {
      navigate(`/login/${role}`);
    } else if (phase === 'verifyOtp') {
      // go back to email input
      setPhase('verifyEmail');
      setOtp(['', '', '', '', '', '']);
      setErrors({});
    } else {
      navigate(`/login/${role}`);
    }
  };

  if (!role || !roleInfo[role]) {
    return <div>Invalid role</div>;
  }

  const currentRoleInfo = roleInfo[role];
  const isLastStep = currentStep === 'preferences';

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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{currentRoleInfo.icon}</div>
            <h1 className={`text-3xl font-bold text-${currentRoleInfo.color}-600 mb-2`}>
              {currentRoleInfo.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Complete the registration process in easy steps
            </p>
          </div>

          {/* Registration Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20">
            {/* Pre-step: Verify Email */}
            {phase === 'verifyEmail' && (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Email</h2>
                  <p className="text-gray-600 dark:text-gray-300">Enter your email to verify if you are a new user.</p>
                </div>
                {errors.success && (
                  <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">{errors.success}</div>
                )}
                {errors.verifyEmail && (
                  <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">{errors.verifyEmail}</div>
                )}
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <div className="relative mb-4">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={verifyEmail}
                    onChange={(e) => {
                      setVerifyEmail(e.target.value);
                      if (errors.verifyEmail) setErrors({ ...errors, verifyEmail: '' });
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.verifyEmail ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    placeholder="Enter your email"
                    disabled={isCheckingUser || isSendingOtp}
                  />
                </div>
                <button
                  onClick={handleVerifyUser}
                  disabled={isCheckingUser || isSendingOtp}
                  className={`w-full bg-gradient-to-r from-${currentRoleInfo.color}-500 to-${currentRoleInfo.color}-700 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {(isCheckingUser || isSendingOtp) ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Verify User
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Pre-step: Verify OTP */}
            {phase === 'verifyOtp' && (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify OTP</h2>
                  <p className="text-gray-600 dark:text-gray-300">Enter the 6-digit OTP sent to <span className="font-semibold">{verifyEmail}</span></p>
                </div>
                {errors.otp && (
                  <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">{errors.otp}</div>
                )}
                {errors.success && (
                  <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">{errors.success}</div>
                )}
                <div className="flex justify-center gap-3 mb-6">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      id={`reg-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-12 text-center text-xl font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isVerifyingOtp}
                    />
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPhase('verifyEmail')}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                    disabled={isVerifyingOtp}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otp.join('').length !== 6}
                    className={`flex-1 bg-gradient-to-r from-${currentRoleInfo.color}-500 to-${currentRoleInfo.color}-700 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50`}
                  >
                    {isVerifyingOtp ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>Verify OTP</>
                    )}
                  </button>
                </div>
              </div>
            )}
            {/* Stepper - only show after OTP verified */}
            {phase === 'form' && (
              <RegistrationStepper
                currentStep={currentStep}
                completedSteps={completedSteps}
                steps={steps}
              />
            )}

            {/* Error Messages */}
            {errors.submit && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                {errors.submit}
              </div>
            )}

            {/* Step Content */}
            {phase === 'form' && (
              <div className="min-h-[500px]">
                {currentStep === 'personal' && (
                  <PersonalDetailsStep
                    data={personalData}
                    onChange={setPersonalData}
                    errors={errors}
                    submitAttempted={submitAttempted}
                  />
                )}
                {currentStep === 'educational' && (
                  <EducationalDetailsStep
                    data={educationalData}
                    onChange={setEducationalData}
                    errors={errors}
                  />
                )}
                {currentStep === 'preferences' && (
                  <PreferencesStep
                    data={preferencesData}
                    onChange={setPreferencesData}
                    errors={errors}
                    role={role}
                  />
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            {phase === 'form' && (
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 'personal'}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                {isLastStep ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-${currentRoleInfo.color}-500 to-${currentRoleInfo.color}-700 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Complete Registration
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-${currentRoleInfo.color}-500 to-${currentRoleInfo.color}-700 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300`}
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
