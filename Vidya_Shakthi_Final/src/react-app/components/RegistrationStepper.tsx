import { Check } from 'lucide-react';
import { RegistrationStepType } from '@/shared/types';

interface Step {
  key: RegistrationStepType;
  title: string;
  description: string;
}

interface RegistrationStepperProps {
  currentStep: RegistrationStepType;
  completedSteps: RegistrationStepType[];
  steps: Step[];
}

export default function RegistrationStepper({ currentStep, completedSteps, steps }: RegistrationStepperProps) {
  const getStepIndex = (step: RegistrationStepType) => steps.findIndex(s => s.key === step);
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = step.key === currentStep;

          return (
            <div key={step.key} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                    ${isCompleted 
                      ? 'bg-green-500 text-white shadow-lg transform scale-110' 
                      : isCurrent 
                        ? 'bg-blue-500 text-white shadow-lg transform scale-110 animate-pulse' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                {/* Step Info */}
                <div className="mt-3 text-center max-w-32">
                  <h4 className={`text-sm font-medium ${isCurrent ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {step.title}
                  </h4>
                  <p className={`text-xs mt-1 ${isCurrent ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 mt-[-2rem]">
                  <div 
                    className={`h-1 rounded-full transition-all duration-500 ${
                      index < currentStepIndex || isCompleted
                        ? 'bg-green-500' 
                        : index === currentStepIndex 
                          ? 'bg-gradient-to-r from-blue-500 to-gray-200 dark:to-gray-700'
                          : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
          style={{ 
            width: `${((currentStepIndex + 1) / steps.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
}
