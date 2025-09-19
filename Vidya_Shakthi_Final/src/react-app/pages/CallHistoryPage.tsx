import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import CallHistory, { CallHistoryEntry } from '../components/CallHistory';
import { getUserData } from '../services/UserService';

const CallHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'audio' | 'video' | 'missed'>('all');

  // Load call history from localStorage or API
  useEffect(() => {
    const loadCallHistory = async () => {
      try {
        setLoading(true);
        
        // Try to load from localStorage first
        const savedHistory = localStorage.getItem('callHistory');
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory).map((entry: any) => ({
            ...entry,
            startTime: new Date(entry.startTime),
            endTime: new Date(entry.endTime)
          }));
          setCallHistory(parsedHistory);
        } else {
          // If no saved history, create some mock data for demonstration
          const mockHistory: CallHistoryEntry[] = [
            {
              id: '1',
              type: 'audio',
              fromUserId: user?.id || '1',
              toUserId: '2',
              fromUserName: user?.name || 'You',
              toUserName: 'Alex Ray',
              startTime: new Date(Date.now() - 3600000), // 1 hour ago
              endTime: new Date(Date.now() - 3540000), // 1 minute call
              duration: 60,
              status: 'completed',
              connectionQuality: 'excellent'
            },
            {
              id: '2',
              type: 'video',
              fromUserId: '3',
              toUserId: user?.id || '1',
              fromUserName: 'Sarah Wilson',
              toUserName: user?.name || 'You',
              startTime: new Date(Date.now() - 7200000), // 2 hours ago
              endTime: new Date(Date.now() - 6900000), // 5 minute call
              duration: 300,
              status: 'completed',
              connectionQuality: 'good'
            },
            {
              id: '3',
              type: 'audio',
              fromUserId: '4',
              toUserId: user?.id || '1',
              fromUserName: 'Mike Johnson',
              toUserName: user?.name || 'You',
              startTime: new Date(Date.now() - 10800000), // 3 hours ago
              endTime: new Date(Date.now() - 10800000), // No duration (missed)
              duration: 0,
              status: 'missed',
              connectionQuality: 'poor'
            }
          ];
          setCallHistory(mockHistory);
        }
      } catch (error) {
        console.error('Failed to load call history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadCallHistory();
    }
  }, [user]);

  // Filter call history based on selected filter
  const filteredHistory = callHistory.filter(entry => {
    switch (filter) {
      case 'audio':
        return entry.type === 'audio';
      case 'video':
        return entry.type === 'video';
      case 'missed':
        return entry.status === 'missed';
      default:
        return true;
    }
  });

  // Sort by most recent first
  const sortedHistory = filteredHistory.sort((a, b) => 
    b.endTime.getTime() - a.endTime.getTime()
  );

  const handleCallUser = (userId: string, callType: 'audio' | 'video') => {
    // This would initiate a new call to the user
    console.log(`Initiating ${callType} call to user ${userId}`);
    // You can integrate this with your existing call initiation logic
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Call History
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your recent calls and call details
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'all', label: 'All Calls', count: callHistory.length },
            { key: 'audio', label: 'Audio', count: callHistory.filter(c => c.type === 'audio').length },
            { key: 'video', label: 'Video', count: callHistory.filter(c => c.type === 'video').length },
            { key: 'missed', label: 'Missed', count: callHistory.filter(c => c.status === 'missed').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Call History List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <CallHistory
            callHistory={sortedHistory}
            currentUserId={user?.id || ''}
            onCallUser={handleCallUser}
          />
        </div>
      </div>

      {/* Stats */}
      {callHistory.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calls</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{callHistory.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Video Calls</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {callHistory.filter(c => c.type === 'video').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Missed Calls</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {callHistory.filter(c => c.status === 'missed').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistoryPage;
