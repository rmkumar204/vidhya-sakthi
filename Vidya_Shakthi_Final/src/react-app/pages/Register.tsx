import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@/react-app/contexts/AuthContext';
import { UserRoleType, PersonalDetailsSchema, EducationalDetailsSchema, PreferencesSchema, RegistrationStepType, PersonalDetailsType, EducationalDetailsType, PreferencesType } from '@/shared/types';
import ThemeToggle from '@/react-app/components/ThemeToggle';
import RegistrationStepper from '@/react-app/components/RegistrationStepper';
import PersonalDetailsStep from '@/react-app/components/PersonalDetailsStep';
import EducationalDetailsStep from '@/react-app/components/EducationalDetailsStep';
import PreferencesStep from '@/react-app/components/PreferencesStep';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

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
    pin_code: ''
  });

  const [educationalData, setEducationalData] = useState<EducationalDetailsType>({
    education: [{ degree_diploma: '', subject: '', year_of_completion: new Date().getFullYear() }],
    experience: [],
    languages: [{ language: '', can_read: false, can_write: false, can_speak: false, can_understand: false }]
  });

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

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    
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
      const registrationData = {
        email: user?.email || '',
        role: role as UserRoleType,
        personal: personalData,
        educational: educationalData,
        preferences: preferencesData
      };

      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Registration failed' });
      }
    } catch (err) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/login/${role}`);
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
            {/* Stepper */}
            <RegistrationStepper
              currentStep={currentStep}
              completedSteps={completedSteps}
              steps={steps}
            />

            {/* Error Messages */}
            {errors.submit && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
                {errors.submit}
              </div>
            )}

            {/* Step Content */}
            <div className="min-h-[500px]">
              {currentStep === 'personal' && (
                <PersonalDetailsStep
                  data={personalData}
                  onChange={setPersonalData}
                  errors={errors}
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

            {/* Navigation Buttons */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
