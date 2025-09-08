import { EducationalDetailsType } from '@/shared/types';
import { Plus, Trash2 } from 'lucide-react';

interface EducationalDetailsStepProps {
  data: EducationalDetailsType;
  onChange: (data: EducationalDetailsType) => void;
  errors: Record<string, string>;
}

export default function EducationalDetailsStep({ data, onChange }: EducationalDetailsStepProps) {
  const addEducation = () => {
    onChange({
      ...data,
      education: [
        ...data.education,
        { degree_diploma: '', subject: '', year_of_completion: new Date().getFullYear() }
      ]
    });
  };

  const removeEducation = (index: number) => {
    onChange({
      ...data,
      education: data.education.filter((_, i) => i !== index)
    });
  };

  const updateEducation = (index: number, field: string, value: string | number) => {
    const updatedEducation = data.education.map((edu, i) => 
      i === index ? { ...edu, [field]: value } : edu
    );
    onChange({ ...data, education: updatedEducation });
  };

  const addExperience = () => {
    const newExperience = data.experience || [];
    onChange({
      ...data,
      experience: [
        ...newExperience,
        { industry: '', sector: '', role: '', years_of_experience: 0 }
      ]
    });
  };

  const removeExperience = (index: number) => {
    const updatedExperience = (data.experience || []).filter((_, i) => i !== index);
    onChange({ ...data, experience: updatedExperience });
  };

  const updateExperience = (index: number, field: string, value: string | number) => {
    const updatedExperience = (data.experience || []).map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    );
    onChange({ ...data, experience: updatedExperience });
  };

  const addLanguage = () => {
    onChange({
      ...data,
      languages: [
        ...data.languages,
        { language: '', can_read: false, can_write: false, can_speak: false, can_understand: false }
      ]
    });
  };

  const removeLanguage = (index: number) => {
    onChange({
      ...data,
      languages: data.languages.filter((_, i) => i !== index)
    });
  };

  const updateLanguage = (index: number, field: string, value: string | boolean) => {
    const updatedLanguages = data.languages.map((lang, i) => 
      i === index ? { ...lang, [field]: value } : lang
    );
    onChange({ ...data, languages: updatedLanguages });
  };

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail',
    'Construction', 'Agriculture', 'Transportation', 'Media', 'Government', 'Non-profit'
  ];

  const languages = [
    'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Urdu',
    'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Maithili', 'Sanskrit'
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Educational & Professional Details
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Share your academic background and professional experience
        </p>
      </div>

      {/* Education Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Education *
          </h4>
          <button
            type="button"
            onClick={addEducation}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </button>
        </div>

        {data.education.map((edu, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="font-medium text-gray-900 dark:text-white">
                Education {index + 1}
              </h5>
              {data.education.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Degree/Diploma *
                </label>
                <input
                  type="text"
                  value={edu.degree_diploma}
                  onChange={(e) => updateEducation(index, 'degree_diploma', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., B.Tech, MBA, Diploma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject/Field *
                </label>
                <input
                  type="text"
                  value={edu.subject}
                  onChange={(e) => updateEducation(index, 'subject', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Computer Science, Business"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year of Completion *
                </label>
                <input
                  type="number"
                  value={edu.year_of_completion}
                  onChange={(e) => updateEducation(index, 'year_of_completion', parseInt(e.target.value))}
                  min="1950"
                  max={new Date().getFullYear() + 10}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Experience Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Professional Experience <span className="text-sm text-gray-500">(Optional)</span>
          </h4>
          <button
            type="button"
            onClick={addExperience}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        </div>

        {(data.experience || []).map((exp, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="font-medium text-gray-900 dark:text-white">
                Experience {index + 1}
              </h5>
              <button
                type="button"
                onClick={() => removeExperience(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry *
                </label>
                <select
                  value={exp.industry}
                  onChange={(e) => updateExperience(index, 'industry', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select industry</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sector *
                </label>
                <input
                  type="text"
                  value={exp.sector}
                  onChange={(e) => updateExperience(index, 'sector', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Software Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role *
                </label>
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => updateExperience(index, 'role', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  value={exp.years_of_experience}
                  onChange={(e) => updateExperience(index, 'years_of_experience', parseInt(e.target.value) || 0)}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Languages Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Language Proficiency *
          </h4>
          <button
            type="button"
            onClick={addLanguage}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Language
          </button>
        </div>

        {data.languages.map((lang, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="font-medium text-gray-900 dark:text-white">
                Language {index + 1}
              </h5>
              {data.languages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLanguage(index)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language *
                </label>
                <select
                  value={lang.language}
                  onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select language</option>
                  {languages.map((language) => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lang.can_read}
                    onChange={(e) => updateLanguage(index, 'can_read', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Read</span>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lang.can_write}
                    onChange={(e) => updateLanguage(index, 'can_write', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Write</span>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lang.can_speak}
                    onChange={(e) => updateLanguage(index, 'can_speak', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Speak</span>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lang.can_understand}
                    onChange={(e) => updateLanguage(index, 'can_understand', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Understand</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
