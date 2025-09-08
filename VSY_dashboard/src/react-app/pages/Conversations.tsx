import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
// import { useAuth } from '@getmocha/users-service/react';
import { Plus, MessageCircle, LogOut, Search, Video, Phone } from 'lucide-react';
import type { ConversationWithUser, UserProfile } from '@/shared/types';
// import { email } from 'zod/v4';

export default function Conversations() {
  // const { user, logout, isPending } = useAuth();
  const [user]=useState({id:3,name:'test',email:'rmkumar204@gmail.com'});
  const isPending=false;
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithUser[]>([{
    id: 1,
    user1_id: '3',
    user2_id: '1',
    other_user_id: '1',
    other_user_name: 'test',
    other_user_picture: '',
    last_message_content: '',
    last_message_at: null,
    unread_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }]);
  const [users, setUsers] = useState<UserProfile[]>([{ id: '1',
  name: 'ram',
  email: 'rmkumar204@gmail.com',
  picture: null}]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/');
      return;
    }

    if (user) {
      fetchConversations();
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    setUsers([{ id: '1',
  name: 'ram',
  email: 'rmkumar204@gmail.com',
  picture: null}]);
    // try {
    //   const response = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`);
    //   if (response.ok) {
    //     const data = await response.json();
    //     setUsers(data);
    //   }
    // } catch (error) {
    //   console.error('Failed to search users:', error);
    // }
  };

  const startConversation = async (otherUserId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ other_user_id: otherUserId }),
      });

      if (response.ok) {
        const conversation = await response.json();
        navigate(`/chat/${conversation.id}`);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (isPending || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">ChatFlow</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* {user&& (
                <img
                  src={user.google_user_data.picture}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              )} */}
              <span className="text-sm font-medium text-gray-700">
                {user.name || user.email}
              </span>
            </div>
            <button
              // onClick={() => logout()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Messages</h2>
            <p className="text-gray-600">Connect with people through direct messages</p>
          </div>
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* User Search */}
        {showUserSearch && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-6">
            <div className="relative mb-4">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for people to chat with..."
                className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {users.length > 0 && (
              <div className="space-y-2">
                {users.map((userProfile) => (
                  <button
                    key={userProfile.id}
                    onClick={() => startConversation(userProfile.id)}
                    className="w-full flex items-center space-x-4 p-4 bg-white/40 hover:bg-white/60 rounded-xl transition-all text-left"
                  >
                    {userProfile.picture ? (
                      <img
                        src={userProfile.picture}
                        alt={userProfile.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {userProfile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{userProfile.name}</h3>
                      <p className="text-gray-600 text-sm">{userProfile.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded mb-2 w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-600 mb-6">Start a conversation to connect with someone</p>
            <button
              onClick={() => setShowUserSearch(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Find People to Chat With
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => navigate(`/chat/${conversation.id}`)}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {conversation.other_user_picture ? (
                      <img
                        src={conversation.other_user_picture}
                        alt={conversation.other_user_name}
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-xl font-semibold text-white">
                          {conversation.other_user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {conversation.other_user_name}
                      </h3>
                      {conversation.last_message_content ? (
                        <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                          {conversation.last_message_content}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm italic">No messages yet</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.last_message_at)}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Start audio call
                        }}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Voice call"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Start video call
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Video call"
                      >
                        <Video className="w-5 h-5" />
                      </button>
                    </div>

                    {conversation.unread_count > 0 && (
                      <div className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {conversation.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
