import { PersonalDetailsType } from '@/shared/types';

interface PersonalDetailsStepProps {
  data: PersonalDetailsType;
  onChange: (data: PersonalDetailsType) => void;
  errors: Record<string, string>;
}

export default function PersonalDetailsStep({ data, onChange, errors }: PersonalDetailsStepProps) {
  const handleInputChange = (field: keyof PersonalDetailsType, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Personal Details
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Tell us about yourself to get started
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={data.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="Enter your first name"
          />
          {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
        </div>

        {/* Middle Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Middle Name
          </label>
          <input
            type="text"
            value={data.middle_name || ''}
            onChange={(e) => handleInputChange('middle_name', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Enter your middle name (optional)"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={data.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="Enter your last name"
          />
          {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mobile Number *
          </label>
          <input
            type="tel"
            value={data.mobile_number}
            onChange={(e) => handleInputChange('mobile_number', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.mobile_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="Enter your mobile number"
          />
          {errors.mobile_number && <p className="text-red-500 text-sm mt-1">{errors.mobile_number}</p>}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            value={data.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.date_of_birth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
          />
          {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>}
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            State *
          </label>
          <select
            value={data.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
          >
            <option value="">Select your state</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            District *
          </label>
          <input
            type="text"
            value={data.district}
            onChange={(e) => handleInputChange('district', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.district ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="Enter your district"
          />
          {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
        </div>

        {/* Block */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Block *
          </label>
          <input
            type="text"
            value={data.block}
            onChange={(e) => handleInputChange('block', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.block ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="Enter your block"
          />
          {errors.block && <p className="text-red-500 text-sm mt-1">{errors.block}</p>}
        </div>

        {/* Place/City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Place/City *
          </label>
          <input
            type="text"
            value={data.place_city}
            onChange={(e) => handleInputChange('place_city', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.place_city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="Enter your place or city"
          />
          {errors.place_city && <p className="text-red-500 text-sm mt-1">{errors.place_city}</p>}
        </div>

        {/* PIN Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PIN Code *
          </label>
          <input
            type="text"
            value={data.pin_code}
            onChange={(e) => handleInputChange('pin_code', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.pin_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="Enter your PIN code"
          />
          {errors.pin_code && <p className="text-red-500 text-sm mt-1">{errors.pin_code}</p>}
        </div>
      </div>
    </div>
  );
}
