import React from 'react';
import { User } from '../types';
import { UserIcon } from '@heroicons/react/24/outline';

interface UserSelectionProps {
  users: User[];
  onSelectUser: (userId: string) => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({ users, onSelectUser }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ConnectSphere</h1>
          <p className="text-slate-400">Select a user to continue</p>
        </div>

        <div className="space-y-3">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user.id)}
              className="w-full flex items-center p-4 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center mr-4">
                <span className="text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{user.name}</h3>
                <p className="text-sm text-slate-400 capitalize">{user.role}</p>
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  user.isOnline ? 'bg-green-500' : 'bg-slate-500'
                }`}></div>
                <span className="text-xs text-slate-400">
                  {user.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No users available</h3>
            <p className="text-slate-500">Please check your connection and try again</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSelection;
