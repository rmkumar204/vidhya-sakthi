import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface Mentee {
  id: string;
  name: string;
  email: string;
  project: string;
  progress: number;
  status: 'active' | 'inactive' | 'completed';
  joinDate: string;
  avatar: string;
}

const mentees: Mentee[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    project: 'Web Development Fundamentals',
    progress: 75,
    status: 'active',
    joinDate: '2024-01-15',
    avatar: '👩‍💻'
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@email.com',
    project: 'Data Science Basics',
    progress: 45,
    status: 'active',
    joinDate: '2024-02-03',
    avatar: '👨‍💻'
  },
  {
    id: '3',
    name: 'Anita Patel',
    email: 'anita.patel@email.com',
    project: 'Digital Marketing',
    progress: 100,
    status: 'completed',
    joinDate: '2023-12-01',
    avatar: '👩‍🎓'
  },
  {
    id: '4',
    name: 'Vikash Singh',
    email: 'vikash.singh@email.com',
    project: 'Mobile App Development',
    progress: 30,
    status: 'active',
    joinDate: '2024-03-10',
    avatar: '👨‍🎓'
  }
];

export default function Mentees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredMentees = mentees.filter(mentee => {
    const matchesSearch = mentee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentee.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mentee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Mentees</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track your mentees' progress</p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add Mentee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search mentees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Mentees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredMentees.map((mentee) => (
          <div key={mentee.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
                  {mentee.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{mentee.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{mentee.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(mentee.status)}`}>
                {mentee.status}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{mentee.project}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${mentee.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{mentee.progress}% complete</p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Joined: {new Date(mentee.joinDate).toLocaleDateString()}</span>
              <button className="text-blue-600 dark:text-blue-400 hover:underline">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMentees.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No mentees found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
