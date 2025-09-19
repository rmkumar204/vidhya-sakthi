import React from 'react';
import { Call } from '../types';
import { PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface OutgoingCallModalProps {
  call: Call;
  onCancel: () => void;
}

const OutgoingCallModal: React.FC<OutgoingCallModalProps> = ({ call, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">
              {call.to.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Calling {call.to.name}
          </h2>
          <p className="text-slate-400">
            {call.type} call in progress...
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutgoingCallModal;
