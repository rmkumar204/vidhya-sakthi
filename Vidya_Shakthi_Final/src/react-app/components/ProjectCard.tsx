import { ClockIcon, UsersIcon, TagIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Project } from '@/react-app/services/ProjectService';

interface ProjectCardProps {
  project: Project;
  onConnect?: (projectId: string) => void;
  isConnecting?: boolean;
}

export default function ProjectCard({ project, onConnect, isConnecting = false }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      case 'task':
        return '✅';
      case 'quiz':
        return '❓';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Image section */}
      <div className="relative overflow-hidden group">
        <img
          // src={project.thumbnail_url || `https://picsum.photos/id/${Math.floor(Math.random() * 10)}/400/225`}
          src={ `https://picsum.photos/id/${Math.floor(Math.random() * 10)}/400/225`}
          alt={project.title}
          className="h-36 w-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex text-xs px-2 py-1 rounded-full font-medium transition-all duration-300 group-hover:scale-105 ${getStatusColor(project.status)}`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Content types */}
        {project.content_types && project.content_types.length > 0 && (
          <div className="absolute top-3 right-3 flex gap-1 z-10">
            {project.content_types.slice(0, 3).map((type, index) => (
              <span
                key={index}
                className="text-lg bg-white/80 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:bg-white/90"
                title={type.charAt(0).toUpperCase() + type.slice(1)}
              >
                {getContentTypeIcon(type)}
              </span>
            ))}
            {project.content_types.length > 3 && (
              <span className="text-xs bg-white/80 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center font-medium transition-all duration-300 group-hover:scale-105 group-hover:bg-white/90">
                +{project.content_types.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="p-4 space-y-3">
        {/* Title and Industry */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
            {project.title}
          </h4>
          {project.industry && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <TagIcon className="w-3 h-3" />
              {project.industry}
            </span>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Skills */}
        {project.required_skills && project.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.required_skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
              >
                {skill}
              </span>
            ))}
            {project.required_skills.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{project.required_skills.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Project details */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            {project.duration_weeks && (
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {project.duration_weeks}w
              </span>
            )}
            <span className="flex items-center gap-1">
              {/* <UserGroupIcon className="w-3 h-3" /> */}
              <UsersIcon className="h-4 w-4 mr-2" />
              Max {project.max_mentees}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {formatDate(project.createdAt)}
          </span>
        </div>

        {/* Mentor info */}
        {project.mentor && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">
              {project.mentor.first_name} {project.mentor.last_name}
            </span>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={() => onConnect?.(project._id)}
          disabled={project.status !== 'open' || isConnecting}
          className="w-full rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending Request...
            </>
          ) : project.status === 'open' ? (
            'Connect with Mentor'
          ) : (
            'Not Available'
          )}
        </button>
      </div>
    </div>
  );
}