import React from 'react';
import { Call } from '../types';
import { PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CallModalProps {
  call: Call;
  onAccept: () => void;
  onReject: () => void;
}

const CallModal: React.FC<CallModalProps> = ({ call, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">
              {call.from.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Incoming {call.type} call
          </h2>
          <p className="text-slate-400">
            {call.from.name} is calling you
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onAccept}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
          >
            {call.type === 'audio' ? (
              <PhoneIcon className="h-8 w-8" />
            ) : (
              <VideoCameraIcon className="h-8 w-8" />
            )}
          </button>
          
          <button
            onClick={onReject}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
