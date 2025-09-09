import { useEffect, useState } from 'react';
import { PersonalDetailsType } from '@/shared/types';

interface PersonalDetailsStepProps {
  data: PersonalDetailsType;
  onChange: (data: PersonalDetailsType) => void;
  errors: Record<string, string>;
}

interface IState {
  _id: string;
  State: string;
}
interface IDistrict {
  _id: string;
  District: string;
  state_id: string;
}
interface IBlock {
  _id: string;
  Taluk:string;
  district_id: string;
  state_id: string;

}
interface IPincodes {
  _id: string;
  block_id:string;
  district_id: string;
  state_id: string;
  Pincode: string;

}

export default function PersonalDetailsStep({
  data,
  onChange,
  errors
}: PersonalDetailsStepProps) {
  const [states, setStates] = useState<IState[]>([]);
  const [districts, setDistricts] = useState<IDistrict[]>([]);
  const [blocks, setBlocks] = useState<IBlock[]>([]);
  const [pincodes, setPincodes] = useState<IPincodes[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // Fetch states on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/locations/states`) // ✅ replace with your backend API
      .then((res) => res.json())
      .then((resData: IState[]) => 
        setStates(resData)
      )
      .catch((err) => console.error('Error fetching states:', err));
  }, []);

  useEffect(()=>{
    console.log('statees',states)
  },[states])
  // Fetch districts when state changes
  useEffect(() => {
    if (data.state) {
      fetch(`${API_BASE_URL}/locations/districts?stateId=${data.state}`)
        .then((res) => res.json())
        .then((resData) => setDistricts(resData))
        .catch((err) => console.error('Error fetching districts:', err));
    } else {
      setDistricts([]);
      setBlocks([]);
      setPincodes([]);
    }
  }, [data.state]);

  // Fetch blocks when district changes
  useEffect(() => {
    if (data.district) {
      fetch(`${API_BASE_URL}/locations/blocks?districtId=${data.district}`)
        .then((res) => res.json())
        .then((resData) => setBlocks(resData))
        .catch((err) => console.error('Error fetching blocks:', err));
    } else {
      setBlocks([]);
      setPincodes([]);
    }
  }, [data.district]);

  // Fetch pincodes when block changes
  useEffect(() => {
    if (data.block) {
      fetch(`${API_BASE_URL}/locations/pincodes?talukId=${data.block}`)
        .then((res) => res.json())
        .then((resData) => setPincodes(resData))
        .catch((err) => console.error('Error fetching pincodes:', err));
    } else {
      setPincodes([]);
    }
  }, [data.block]);

  const handleInputChange = (field: keyof PersonalDetailsType, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

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
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
            placeholder="Enter your last name"
          />
          {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
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
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
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
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          />
          {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>}
        </div>

        {/* ✅ State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            State *
          </label>
          <select
            value={data.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          >
            <option value="">Select your state</option>
            {states.map((state) => (
               <option key={state._id} value={state._id}>
              {state.State}
            </option>
            ))}
          </select>
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        {/* ✅ District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            District *
          </label>
          <select
            value={data.district}
            onChange={(e) => {
              if (!data.state) {
                alert('Please select a state first');
                return;
              }
              handleInputChange('district', e.target.value);
            }}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.district ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          >
            <option value="">Select your district</option>
            {districts.map((district) => (
              <option key={district._id} value={district._id}>
                {district.District}
              </option>
            ))}
          </select>
          {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
        </div>

        {/* ✅ Block */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Block *
          </label>
          <select
            value={data.block}
            onChange={(e) => {
              if (!data.district) {
                alert('Please select a district first');
                return;
              }
              handleInputChange('block', e.target.value);
            }}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.block ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          >
            <option value="">Select your block</option>
            {blocks.map((block) => (
              <option key={block._id} value={block._id}>
                {block.Taluk}
              </option>
            ))}
          </select>
          {errors.block && <p className="text-red-500 text-sm mt-1">{errors.block}</p>}
        </div>

        {/* ✅ PIN Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PIN Code *
          </label>
          <select
            value={data.pin_code}
            onChange={(e) => {
              if (!data.block) {
                alert('Please select a block first');
                return;
              }
              handleInputChange('pin_code', e.target.value);
            }}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.pin_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          >
            <option value="">Select your PIN code</option>
            {pincodes.map((pincode) => (
              <option key={pincode._id} value={pincode._id}>
                {pincode.Pincode}
              </option>
            ))}
          </select>
          {errors.pin_code && <p className="text-red-500 text-sm mt-1">{errors.pin_code}</p>}
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
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
            placeholder="Enter your place or city"
          />
          {errors.place_city && <p className="text-red-500 text-sm mt-1">{errors.place_city}</p>}
        </div>
      </div>
    </div>
  );
}
