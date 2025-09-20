import { useState, useEffect } from 'react';
import { useAuth } from '@/react-app/hooks/useAuth';
import { 
  getConnectionRequests, 
  respondToConnectionRequest, 
  ConnectionRequest 
} from '@/react-app/services/ConnectionRequestService';
import { ClockIcon, UserIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface PendingRequestsProps {
  refreshTrigger?: number;
  onRequestUpdate?: () => void;
}

export default function PendingRequests({ refreshTrigger, onRequestUpdate }: PendingRequestsProps) {
  const { user } = useAuth();
  const token = user?.token;
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await getConnectionRequests({ status: 'pending' }, token);
      setRequests(response.requests);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token, refreshTrigger]);

  const handleResponse = async (requestId: string, action: 'accept' | 'reject', message?: string) => {
    if (!token) return;

    setProcessingRequest(requestId);
    try {
      await respondToConnectionRequest(
        requestId,
        { action, response_message: message },
        token
      );
      
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req._id !== requestId));
      
      toast.success(
        action === 'accept' 
          ? 'Connection request accepted! Conversation started.' 
          : 'Connection request declined.',
        {
          icon: action === 'accept' ? '✅' : '❌',
          duration: 3000
        }
      );
      
      onRequestUpdate?.();
    } catch (error: any) {
      console.error('Failed to respond to request:', error);
      toast.error(error.message || 'Failed to respond to request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5" />
          Pending Requests
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ClockIcon className="w-5 h-5" />
        Pending Requests
        {requests.length > 0 && (
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
            {requests.length}
          </span>
        )}
      </h3>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No pending requests</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            New connection requests will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div 
              key={request._id} 
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Mentee Info */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {request.mentee.first_name} {request.mentee.last_name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {request.mentee.email}
                      </p>
                    </div>
                  </div>

                  {/* Project Info or Guidance Request */}
                  <div className="mb-3">
                    {request.project ? (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Project:</span> {request.project.title}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Type:</span> Guidance Request
                        </p>
                        <div className="inline-flex items-center px-2 py-1 bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 text-xs rounded-full mt-1">
                          🌟 Mentorship Request
                        </div>
                      </>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Requested {formatDate(request.requested_at)}
                    </p>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Message:</span>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {request.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleResponse(request._id, 'accept')}
                  disabled={processingRequest === request._id}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {processingRequest === request._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                  Accept
                </button>
                <button
                  onClick={() => handleResponse(request._id, 'reject', 'Thank you for your interest, but I cannot take on new mentees at this time.')}
                  disabled={processingRequest === request._id}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {processingRequest === request._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <XMarkIcon className="w-4 h-4" />
                  )}
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}