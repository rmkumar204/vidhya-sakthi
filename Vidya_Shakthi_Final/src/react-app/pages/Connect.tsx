import React, { useState, useEffect } from 'react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { getMentors, createGuidanceConnectionRequest, type Mentor } from '@/react-app/services/GuidanceConnectionService';
import { MagnifyingGlassIcon, UserIcon, ClockIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ConnectingStates {
  [mentorId: string]: boolean;
}

const Connect: React.FC = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectingStates, setConnectingStates] = useState<ConnectingStates>({});
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Redirect if not mentee
  useEffect(() => {
    if (user && user.role !== 'mentee') {
      toast.error('Only mentees can access the Connect page');
      window.history.back();
    }
  }, [user]);

  const fetchMentors = async (currentPage = 1, search = '') => {
    if (!user?.token) return;
    
    setLoading(true);
    try {
      const response = await getMentors(
        { page: currentPage, limit: 20, search },
        user.token
      );
      
      if (currentPage === 1) {
        setMentors(response.mentors);
      } else {
        setMentors(prev => [...prev, ...response.mentors]);
      }
      
      setHasNextPage(response.pagination.hasNextPage);
      setTotalCount(response.pagination.totalCount);
    } catch (error: any) {
      console.error('Failed to fetch mentors:', error);
      toast.error(error.message || 'Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors(1, searchTerm);
    setPage(1);
  }, [searchTerm, user?.token]);

  const handleConnect = async (mentorId: string, mentorName: string) => {
    if (!user?.token) {
      toast.error('Please log in to connect with mentors');
      return;
    }

    setConnectingStates(prev => ({ ...prev, [mentorId]: true }));
    
    try {
      await createGuidanceConnectionRequest(
        {
          mentorId,
          message: `Hi ${mentorName}! I would like to connect with you for guidance and mentorship. I'm looking forward to learning from your experience.`
        },
        user.token
      );
      
      toast.success(`Connection request sent to ${mentorName}! You will be notified when they respond.`, {
        duration: 4000,
        icon: '🚀',
      });
    } catch (error: any) {
      console.error('Failed to connect with mentor:', error);
      if (error.message.includes('pending')) {
        toast.error('You already have a pending request with this mentor');
      } else {
        toast.error(error.message || 'Failed to send connection request');
      }
    } finally {
      setConnectingStates(prev => ({ ...prev, [mentorId]: false }));
    }
  };

  const loadMoreMentors = () => {
    if (!loading && hasNextPage) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMentors(nextPage, searchTerm);
    }
  };

  const getSkillsDisplay = (skills: string[]) => {
    if (!skills || skills.length === 0) return 'No skills listed';
    if (skills.length <= 3) return skills.join(', ');
    return `${skills.slice(0, 3).join(', ')} +${skills.length - 3} more`;
  };

  const getExperienceDisplay = (experience: Mentor['experience']) => {
    if (!experience || experience.length === 0) return 'Experience not specified';
    const primary = experience[0];
    return `${primary.role} in ${primary.sector}${primary.years_of_experience ? ` (${primary.years_of_experience}+ years)` : ''}`;
  };

  if (user?.role !== 'mentee') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-3">Your Gateway to Growth</h1>
          <p className="text-lg opacity-90 max-w-4xl">
            Discover guidance, mentorship, and meaningful conversations—all in one place. 
            Whether you're exploring career paths, seeking personal growth, or navigating challenges, 
            Connect is your gateway to trusted support. Engage with experts, ask questions, 
            and find clarity through curated resources and real-time interactions.
          </p>
          <p className="text-sm mt-4 opacity-80 italic">
            Empower your journey—one conversation at a time.
          </p>
        </div>
      </div>

      {/* Mentors Grid */}
      {loading && mentors.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-16">
          <UserIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No mentors found' : 'No mentors available'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {searchTerm 
              ? 'Try adjusting your search terms or browse all available mentors.' 
              : 'Check back later for new mentors joining the platform.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div 
                key={mentor._id} 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 group"
              >
                {/* Mentor Avatar and Name */}
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center border-4 border-teal-100 dark:border-teal-900">
                    <span className="text-white font-bold text-xl">
                      {mentor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {mentor.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mentor</p>
                  </div>
                </div>

                {/* Experience */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Experience</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getExperienceDisplay(mentor.experience)}
                  </p>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Skills</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getSkillsDisplay(mentor.skills)}
                  </p>
                </div>

                {/* Availability Indicators */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Availability</h4>
                  <div className="flex flex-wrap gap-1">
                    {mentor.availability.weekdays && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Weekdays
                      </span>
                    )}
                    {mentor.availability.weekends && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Weekends
                      </span>
                    )}
                    {!mentor.availability.weekdays && !mentor.availability.weekends && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Schedule to be discussed</span>
                    )}
                  </div>
                </div>

                {/* Connect Button */}
                <button
                  onClick={() => handleConnect(mentor._id, mentor.name)}
                  disabled={connectingStates[mentor._id]}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                >
                  {connectingStates[mentor._id] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="text-center mt-12">
              <button
                onClick={loadMoreMentors}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                    Loading more mentors...
                  </>
                ) : (
                  'Load More Mentors'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Connect;