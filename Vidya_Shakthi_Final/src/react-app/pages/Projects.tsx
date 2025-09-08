import { useState } from 'react';
import { PlusIcon, FunnelIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate: string;
  mentees: number;
  maxMentees: number;
  progress: number;
  industry: string;
}

const projects: Project[] = [
  {
    id: '1',
    title: 'Web Development Fundamentals',
    description: 'Learn the basics of HTML, CSS, and JavaScript to build modern web applications.',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-04-15',
    mentees: 8,
    maxMentees: 10,
    progress: 65,
    industry: 'Technology'
  },
  {
    id: '2',
    title: 'Data Science with Python',
    description: 'Explore data analysis, visualization, and machine learning using Python.',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-05-01',
    mentees: 12,
    maxMentees: 15,
    progress: 40,
    industry: 'Technology'
  },
  {
    id: '3',
    title: 'Digital Marketing Strategies',
    description: 'Master social media marketing, SEO, and content marketing techniques.',
    status: 'completed',
    startDate: '2023-10-01',
    endDate: '2024-01-01',
    mentees: 15,
    maxMentees: 15,
    progress: 100,
    industry: 'Marketing'
  },
  {
    id: '4',
    title: 'Mobile App Development',
    description: 'Build cross-platform mobile applications using React Native.',
    status: 'draft',
    startDate: '2024-04-01',
    endDate: '2024-07-01',
    mentees: 0,
    maxMentees: 12,
    progress: 0,
    industry: 'Technology'
  }
];

export default function Projects() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProjects = projects.filter(project => 
    statusFilter === 'all' || project.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'on-hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'completed':
        return '✅';
      case 'on-hold':
        return '⏸️';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage your mentoring projects</p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <FunnelIcon className="h-5 w-5 text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Projects</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getStatusIcon(project.status)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{project.title}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{project.industry}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(project.status)}`}>
                {project.status.replace('-', ' ')}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>

            {/* Progress Bar */}
            {project.status !== 'draft' && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-gray-900 dark:text-white font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Project Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UsersIcon className="h-4 w-4 mr-2" />
                <span>{project.mentees}/{project.maxMentees} mentees</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                View Details
              </button>
              <button className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects found</h3>
          <p className="text-gray-600 dark:text-gray-400">Create your first project to get started</p>
        </div>
      )}
    </div>
  );
}
