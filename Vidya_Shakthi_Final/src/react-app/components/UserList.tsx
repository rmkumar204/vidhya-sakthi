import React, { useState } from 'react';
import { User } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { 
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserIcon 
} from '@heroicons/react/24/outline';
import { logger } from '../utils/logger';

const UserList: React.FC = () => {
  const { users, sendConnectionRequest } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleSendRequest = async (userId: string) => {
    try {
      await sendConnectionRequest(userId);
    } catch (error) {
      logger.error('Failed to send connection request:', error);
    }
  };

  return (
    <div className="flex-1 bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Find Users</h1>
        
        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
          
          <div className="flex space-x-4">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Roles</option>
              <option value="mentor">Mentors</option>
              <option value="mentee">Mentees</option>
            </select>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center mr-3">
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
              </div>
              
              <p className="text-sm text-slate-300 mb-3">{user.email}</p>
              
              <button
                onClick={() => handleSendRequest(user.id)}
                className="w-full flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Send Request
              </button>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No users found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
