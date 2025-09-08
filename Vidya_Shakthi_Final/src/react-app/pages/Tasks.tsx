import { useState } from 'react';
import { PlusIcon, FunnelIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  mentee: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'completed' | 'on-hold';
  dueDate: string;
  project: string;
  createdDate: string;
}

const tasks: Task[] = [
  {
    id: '1',
    title: 'Complete HTML Structure',
    description: 'Create the basic HTML structure for the portfolio website including header, main sections, and footer.',
    assignedTo: 'priya-sharma',
    mentee: 'Priya Sharma',
    priority: 'high',
    status: 'in-progress',
    dueDate: '2024-09-15',
    project: 'Web Development Fundamentals',
    createdDate: '2024-09-01'
  },
  {
    id: '2',
    title: 'Data Analysis Report',
    description: 'Analyze the provided dataset and create a comprehensive report with visualizations.',
    assignedTo: 'rahul-kumar',
    mentee: 'Rahul Kumar',
    priority: 'medium',
    status: 'open',
    dueDate: '2024-09-20',
    project: 'Data Science with Python',
    createdDate: '2024-09-05'
  },
  {
    id: '3',
    title: 'Social Media Campaign',
    description: 'Design and implement a social media campaign for a fictional product.',
    assignedTo: 'anita-patel',
    mentee: 'Anita Patel',
    priority: 'low',
    status: 'completed',
    dueDate: '2024-08-30',
    project: 'Digital Marketing Strategies',
    createdDate: '2024-08-15'
  },
  {
    id: '4',
    title: 'Mobile App Wireframe',
    description: 'Create wireframes for a simple todo mobile application.',
    assignedTo: 'vikash-singh',
    mentee: 'Vikash Singh',
    priority: 'high',
    status: 'on-hold',
    dueDate: '2024-09-25',
    project: 'Mobile App Development',
    createdDate: '2024-09-03'
  }
];

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'on-hold': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track task assignments</p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tasks List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 flex-1">
                <span className="text-2xl mt-1">{getPriorityIcon(task.priority)}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {task.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Assigned to:</span>
                      <span>{task.mentee}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Project:</span>
                      <span>{task.project}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Created: {new Date(task.createdDate).toLocaleDateString()}</span>
                </div>
                <div className={`flex items-center space-x-1 ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-600 dark:text-red-400' : ''}`}>
                  <ClockIcon className="h-4 w-4" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  {isOverdue(task.dueDate) && task.status !== 'completed' && (
                    <span className="text-red-600 dark:text-red-400 font-medium">(Overdue)</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  View Details
                </button>
                <button className="px-3 py-1 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your filter criteria or create a new task</p>
        </div>
      )}
    </div>
  );
}
