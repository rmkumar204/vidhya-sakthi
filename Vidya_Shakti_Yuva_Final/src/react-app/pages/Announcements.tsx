import { useState } from 'react';
import { PlusIcon, SpeakerWaveIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'meeting' | 'deadline' | 'celebration';
  project: string;
  recipients: string[];
  createdDate: string;
  scheduledDate?: string;
  meetingLink?: string;
  priority: 'low' | 'medium' | 'high';
  author: string;
}

const announcements: Announcement[] = [
  {
    id: '1',
    title: 'Weekly Project Review Meeting',
    content: 'Join us for our weekly project review session. We will discuss progress, challenges, and next steps for all active projects.',
    type: 'meeting',
    project: 'Web Development Fundamentals',
    recipients: ['All Mentees'],
    createdDate: '2024-09-05',
    scheduledDate: '2024-09-10',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    priority: 'high',
    author: 'John Doe'
  },
  {
    id: '2',
    title: 'Assignment Deadline Reminder',
    content: 'This is a reminder that the HTML structure assignment is due tomorrow. Please make sure to submit your work on time.',
    type: 'deadline',
    project: 'Web Development Fundamentals',
    recipients: ['Priya Sharma', 'Rahul Kumar'],
    createdDate: '2024-09-04',
    priority: 'high',
    author: 'John Doe'
  },
  {
    id: '3',
    title: 'New Learning Resources Available',
    content: 'I have uploaded new learning materials and video tutorials to help you with CSS Grid and Flexbox concepts. Check them out in the resources section.',
    type: 'general',
    project: 'Web Development Fundamentals',
    recipients: ['All Mentees'],
    createdDate: '2024-09-03',
    priority: 'medium',
    author: 'John Doe'
  },
  {
    id: '4',
    title: 'Congratulations on Project Completion!',
    content: 'Congratulations to Anita Patel for successfully completing the Digital Marketing project! Outstanding work on the social media campaign.',
    type: 'celebration',
    project: 'Digital Marketing Strategies',
    recipients: ['All Mentees'],
    createdDate: '2024-09-01',
    priority: 'low',
    author: 'John Doe'
  }
];

export default function Announcements() {
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredAnnouncements = announcements.filter(announcement =>
    typeFilter === 'all' || announcement.type === typeFilter
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return '📅';
      case 'deadline':
        return '⏰';
      case 'celebration':
        return '🎉';
      case 'general':
      default:
        return '📢';
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      meeting: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      deadline: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      celebration: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Share updates and important information with your mentees</p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Announcement
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <SpeakerWaveIcon className="h-5 w-5 text-gray-400" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="general">General</option>
          <option value="meeting">Meeting</option>
          <option value="deadline">Deadline</option>
          <option value="celebration">Celebration</option>
        </select>
      </div>

      {/* Announcements List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 flex-1">
                <span className="text-2xl mt-1">{getTypeIcon(announcement.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(announcement.type)}`}>
                      {announcement.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {announcement.content}
                  </p>
                </div>
              </div>
            </div>

            {/* Meeting Link */}
            {announcement.meetingLink && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 dark:text-green-400 font-medium">Meeting Link:</span>
                  <a 
                    href={announcement.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    {announcement.meetingLink}
                  </a>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Created: {new Date(announcement.createdDate).toLocaleDateString()}</span>
                </div>
                {announcement.scheduledDate && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Scheduled: {new Date(announcement.scheduledDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{announcement.recipients.length > 1 ? `${announcement.recipients.length} recipients` : announcement.recipients[0]}</span>
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

            {/* Project Badge */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                Project: {announcement.project}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📢</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No announcements found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your filter or create your first announcement</p>
        </div>
      )}
    </div>
  );
}
