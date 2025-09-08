import { PreferencesType, UserRoleType } from '@/shared/types';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface PreferencesStepProps {
  data: PreferencesType;
  onChange: (data: PreferencesType) => void;
  errors: Record<string, string>;
  role: UserRoleType;
}

export default function PreferencesStep({ data, onChange, role }: PreferencesStepProps) {
  const [newSkill, setNewSkill] = useState('');

  const updateField = (field: keyof PreferencesType, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateAvailability = (field: string, value: boolean) => {
    onChange({
      ...data,
      availability: {
        weekdays: false,
        weekends: false,
        mornings: false,
        afternoons: false,
        evenings: false,
        ...data.availability,
        [field]: value
      }
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !data.skills_interests?.includes(newSkill.trim())) {
      onChange({
        ...data,
        skills_interests: [...(data.skills_interests || []), newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    onChange({
      ...data,
      skills_interests: data.skills_interests?.filter(s => s !== skill) || []
    });
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const roleSpecificContent = () => {
    switch (role) {
      case 'mentor':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Mentees
              </label>
              <input
                type="number"
                value={data.max_mentees || ''}
                onChange={(e) => updateField('max_mentees', parseInt(e.target.value) || undefined)}
                min="1"
                max="20"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="How many mentees would you like to mentor?"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Recommended: 3-5 mentees for effective mentoring
              </p>
            </div>
          </div>
        );
      
      case 'mentee':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mentoring Requirements
              </label>
              <textarea
                value={data.mentoring_requirements || ''}
                onChange={(e) => updateField('mentoring_requirements', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What specific guidance or skills are you looking to develop?"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Be specific about your learning goals and what you hope to achieve
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Preferences & Availability
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Help us match you with the right {role === 'mentor' ? 'mentees' : role === 'mentee' ? 'mentors' : 'opportunities'}
        </p>
      </div>

      {/* Time Commitment */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Time Commitment
        </h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum Hours Per Week
          </label>
          <input
            type="number"
            value={data.max_hours_per_week || ''}
            onChange={(e) => updateField('max_hours_per_week', parseInt(e.target.value) || undefined)}
            min="1"
            max="40"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="How many hours can you dedicate per week?"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            This helps us match you with appropriate projects and responsibilities
          </p>
        </div>
      </div>

      {/* Role-specific fields */}
      {roleSpecificContent()}

      {/* Skills & Interests */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Skills & Interests
        </h4>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleSkillKeyPress}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a skill or interest (e.g., Web Development, AI, Design)"
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {data.skills_interests && data.skills_interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.skills_interests.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add relevant skills, technologies, or areas of interest to help with matching
        </p>
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Availability
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Days */}
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">
              Preferred Days
            </h5>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.availability?.weekdays || false}
                  onChange={(e) => updateAvailability('weekdays', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Weekdays (Monday - Friday)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.availability?.weekends || false}
                  onChange={(e) => updateAvailability('weekends', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Weekends (Saturday - Sunday)
                </span>
              </label>
            </div>
          </div>

          {/* Times */}
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">
              Preferred Times
            </h5>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.availability?.mornings || false}
                  onChange={(e) => updateAvailability('mornings', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Mornings (6 AM - 12 PM)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.availability?.afternoons || false}
                  onChange={(e) => updateAvailability('afternoons', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Afternoons (12 PM - 6 PM)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.availability?.evenings || false}
                  onChange={(e) => updateAvailability('evenings', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Evenings (6 PM - 10 PM)
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          📋 Important Note
        </h5>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Your preferences help us make better matches, but they're not strict requirements. 
          You can always update these settings later from your dashboard.
        </p>
      </div>
    </div>
  );
}
