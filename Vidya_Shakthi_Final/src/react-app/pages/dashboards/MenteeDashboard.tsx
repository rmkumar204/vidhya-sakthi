import StatCard from '@/react-app/components/StatCard';
import ProjectFilters from '@/react-app/components/ProjectFilters';
import ProjectCard from '@/react-app/components/ProjectCard';
import Pagination from '@/react-app/components/Pagination';
import { useProjects } from '@/react-app/hooks/useProjects';
import { useAuth } from '@/react-app/hooks/useAuth';
import { createConnectionRequest } from '@/react-app/services/ConnectionRequestService';
import { BookOpenIcon, CheckIcon, UsersIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import toast from 'react-hot-toast';

const menteeStats = [
  { title: 'Topics Subscribed', value: '0', change: 'Start exploring', changeType: 'neutral' as const, icon: BookOpenIcon, iconColor: 'bg-blue-500' },
  { title: 'Ongoing Topics', value: '0', change: 'Pick one to start', changeType: 'neutral' as const, icon: UsersIcon, iconColor: 'bg-purple-500' },
  { title: 'Tasks Completed', value: '8', change: '+2 this week', changeType: 'positive' as const, icon: CheckIcon, iconColor: 'bg-emerald-500', path: '/app/tasks' },
  { title: 'Certificates', value: '2', change: 'Great progress', changeType: 'positive' as const, icon: AcademicCapIcon, iconColor: 'bg-rose-500', path: '/app/certificates' },
];

export default function MenteeDashboard() {
  const { user } = useAuth();
  const token = user?.token;
  const { 
    projects, 
    pagination, 
    loading, 
    error, 
    params, 
    updateParams, 
    clearFilters, 
    filterOptions 
  } = useProjects({ 
    page: 1, 
    limit: 10, 
    status: 'open' // Show only open projects by default
  });

  const [connectingProject, setConnectingProject] = useState<string | null>(null);

  const handleConnect = async (projectId: string) => {
    if (!user || !token) {
      toast.error('Please log in to connect with mentors');
      return;
    }

    if (user.role !== 'mentee') {
      toast.error('Only mentees can send connection requests');
      return;
    }

    setConnectingProject(projectId);
    
    try {
      console.log({projects, projectId});

      console.log(projects[0]._id);
      
      
      // Find the project to get mentor info
      const project = projects.find(p => p._id === projectId);

      console.log({project});
      
      if (!project || !project.mentor) {
        toast.error('Project or mentor not found');
        return;
      }

      await createConnectionRequest(
        {
          projectId: projectId,
          mentorId: project.mentor._id,
          message: `Hi! I'm interested in your project "${project.title}". I'd love to learn more and contribute.`
        },
        token
      );
      
      toast.success('Request sent to mentor. You will be notified soon.', {
        duration: 4000,
        icon: '🚀',
      });
    } catch (error: any) {
      console.error('Failed to connect to project:', error);
      if (error.message.includes('pending request')) {
        toast.error('You already have a pending request for this project');
      } else {
        toast.error(error.message || 'Failed to send connection request');
      }
    } finally {
      setConnectingProject(null);
    }
  };

  return (
    <div className="space-y-6">

                  {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome to your Mentee dashboard!
        </h2>
        <p className="opacity-90">
          Here's what's happening in your Vidya Shakti Yuva journey today.
        </p>
      </div>
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {menteeStats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Filters Section */}
      <ProjectFilters
        params={params}
        filterOptions={filterOptions}
        onParamsChange={updateParams}
        onClearFilters={clearFilters}
        loading={loading}
      />

      {/* Projects Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Available Projects
            {pagination.totalCount > 0 && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-normal">
                ({pagination.totalCount} total)
              </span>
            )}
          </h3>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading projects...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <BookOpenIcon className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm mt-2">
                {Object.keys(params).some(key => params[key as keyof typeof params] && key !== 'page' && key !== 'limit' && key !== 'sort_by' && key !== 'sort_order')
                  ? 'Try adjusting your search filters'
                  : 'Check back later for new opportunities'
                }
              </p>
            </div>
            {Object.keys(params).some(key => params[key as keyof typeof params] && key !== 'page' && key !== 'limit' && key !== 'sort_by' && key !== 'sort_order') && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && projects.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onConnect={handleConnect}
                  isConnecting={connectingProject === project._id}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                limit={pagination.limit}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                onPageChange={(page) => updateParams({ page })}
                onLimitChange={(limit) => updateParams({ limit, page: 1 })}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}


