import { useMemo, useState } from 'react';
import { PlusIcon, FunnelIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import ProjectCreateModal from '@/react-app/components/ProjectCreateModal';
import { useProjects } from '@/react-app/hooks/useProjects';
import { useAuth } from '@/react-app/hooks/useAuth';
import toast from 'react-hot-toast';
import { logger } from '@/react-app/utils/logger';

export default function Projects() {
  const { user } = useAuth();
  const token = user?.token;
  const { projects, loading, addProject } = useProjects();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter((p: any) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const q = search.toLowerCase();
      const matchesQ = !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (p.required_skills || []).some((s: string) => s.toLowerCase().includes(q));
      return matchesStatus && matchesQ;
    });
  }, [projects, statusFilter, search]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return '🟢';
      case 'in_progress':
        return '🚧';
      case 'completed':
        return '✅';
      case 'on_hold':
        return '⏸️';
      case 'cancelled':
        return '⛔';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage your mentoring projects</p>
        </div>
        {user?.role === 'mentor' && (
          <button onClick={() => setOpen(true)} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Project
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, skill..."
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-w-[220px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredProjects.map((project: any) => (
          <div key={project._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getStatusIcon(project.status)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{project.title}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{project.industry || 'General'}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(project.status)}`}>
                {String(project.status).replace('-', ' ')}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <UsersIcon className="h-4 w-4 mr-2" />
                <span>Capacity {project.max_mentees}</span>
              </div>
            </div>

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

      {filteredProjects.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects found</h3>
          <p className="text-gray-600 dark:text-gray-400">Create your first project to get started</p>
        </div>
      )}

      {open && (
        <ProjectCreateModal
          open={open}
          onClose={() => setOpen(false)}
          onCreate={async (payload) => {
            try {
              if (!user || !token) {
                toast.error('Please log in to create projects');
                return;
              }
              
              if (user.role !== 'mentor') {
                toast.error('Only mentors can create projects');
                return;
              }
              
              await addProject(payload, token);
              toast.success('Project created successfully!');
            } catch (error: any) {
              logger.error('Failed to create project:', error);
              toast.error(error.message || 'Failed to create project');
            }
          }}
        />
      )}
    </div>
  );
}
