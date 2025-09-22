import React, { useState, useEffect, useMemo } from 'react';
import { User, Chat, ConnectionRequest, Call, CallStatus } from './types';
import useMockApi from './hooks/useMockApi';
import useCallSignaling from './hooks/useCallSignaling';
import { webRTCService } from './services/WebRTCService';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import UserList from './components/UserList';
import UserSelection from './components/UserSelection';
import CallModal from './components/CallModal';
import OutgoingCallModal from './components/OutgoingCallModal';
import AudioCallView from './components/AudioCallView';
import VideoCallView from './components/VideoCallView';
import { AppContext } from './AppContext';
import { logger } from './utils/logger';

const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => sessionStorage.getItem('currentUserId'));
  
  const { 
    users, 
    chats, 
    connectionRequests,
    loading,
    sendConnectionRequest,
    handleConnectionRequest,
    sendMessage: apiSendMessage,
    isConnected
  } = useMockApi(currentUserId);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isUserListVisible, setIsUserListVisible] = useState<boolean>(true);

  // Update activeChat when chats change (to reflect new messages)
  useEffect(() => {
    logger.info('🔄 App.tsx: Chats or users changed. ActiveChat:', activeChat?.id, 'Chats count:', chats.length);
    if (activeChat) {
      const updatedChat = chats.find(c => c.id === activeChat.id);
      logger.info('🔄 App.tsx: Found updated chat:', {
        found: !!updatedChat,
        oldMessageCount: activeChat.messages.length,
        newMessageCount: updatedChat?.messages.length || 0
      });
      
      if (updatedChat && updatedChat.messages.length !== activeChat.messages.length) {
        const enrichedChat = {
          ...updatedChat,
          users: users.filter(u => updatedChat.userIds.includes(u.id))
        };
        logger.info('🔄 App.tsx: Updating active chat from chats change:', {
          chatId: enrichedChat.id,
          oldMessageCount: activeChat.messages.length,
          newMessageCount: enrichedChat.messages.length,
          newMessages: enrichedChat.messages.slice(-3).map(m => ({ content: m.content, senderId: m.senderId }))
        });
        setActiveChat(enrichedChat);
      } else {
        logger.info('🔄 App.tsx: No message count change, not updating activeChat');
      }
    }
  }, [chats, users]); // Removed activeChat?.id to allow proper updates

  // Listen for chat refresh events from call system
  useEffect(() => {
    const handleChatRefresh = () => {
      logger.info('🔄 App.tsx: Chat refresh event received');
      if (activeChat) {
        const refreshedChat = chats.find(c => c.id === activeChat.id);
        if (refreshedChat) {
          const enrichedChat = {
            ...refreshedChat,
            users: users.filter(u => refreshedChat.userIds.includes(u.id))
          };
          logger.info('🔄 App.tsx: Refreshing activeChat after call:', {
            chatId: enrichedChat.id,
            messageCount: enrichedChat.messages.length
          });
          setActiveChat(enrichedChat);
          // Force a re-render by updating the key
          setTimeout(() => {
            setActiveChat({ ...enrichedChat });
          }, 50);
        }
      }
    };

    window.addEventListener('connectsphere-chat-refresh', handleChatRefresh);
    return () => {
      window.removeEventListener('connectsphere-chat-refresh', handleChatRefresh);
    };
  }, [activeChat, chats, users]);

  useEffect(() => {
    const user = users.find(u => u.id === currentUserId);
    setCurrentUser(user || null);
  }, [currentUserId, users]);

  // Call state management
  const { 
    call, 
    localStream, 
    remoteStream, 
    initiateCall, 
    acceptCall, 
    rejectCall, 
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing
  } = useCallSignaling(currentUser);

  const handleLogin = (userId: string) => {
    sessionStorage.setItem('currentUserId', userId);
    setCurrentUserId(userId);
    setIsUserListVisible(true);
    setActiveChat(null);
  };
  
  const handleLogout = () => {
    // Clear any active calls first
    if (call) {
      logger.info('🚪 Logout: Cleaning up active call before logout');
      webRTCService.endCall();
      endCall();
    }
    
    // Clear call state from localStorage
    localStorage.removeItem('connectsphere-call-state');
    
    // Clear session and reset state
    sessionStorage.removeItem('currentUserId');
    setCurrentUserId(null);
    setActiveChat(null);
    
    logger.info('✅ Logout completed with cleanup');
  };

  const connectedUsers = useMemo(() => {
    return chats.map(chat => {
      const otherUserId = chat.userIds.find(id => id !== currentUserId);
      return users.find(u => u.id === otherUserId);
    }).filter((u): u is User => !!u);
  }, [chats, users, currentUserId]);

  const handleSelectChat = (userId: string) => {
    logger.info('📋 App.tsx: Selecting chat with user:', userId);
    const chat = chats.find(c => c.userIds.includes(userId));
    if (chat) {
      const enrichedChat = {
        ...chat,
        users: users.filter(u => chat.userIds.includes(u.id))
      };
      logger.info('📋 App.tsx: Setting active chat:', {
        chatId: enrichedChat.id,
        messageCount: enrichedChat.messages.length,
        users: enrichedChat.users.map(u => u.name)
      });
      setActiveChat(enrichedChat);
      setIsUserListVisible(false);
    }
  };
  
  const handleSendMessage = async (chatId: string, content: string, type: 'text' | 'voice' = 'text') => {
    if (!currentUser) return;
    logger.info('📤 App.tsx: Sending message:', { chatId, content, type });
    await apiSendMessage(chatId, currentUser.id, content, type);
    // Note: Message updates are now handled by ChatWindow via WebSocket
  };

  const handleShowUserList = () => {
    setActiveChat(null);
    setIsUserListVisible(true);
  };

  if (!currentUserId || !currentUser) {
    return <UserSelection users={users} onSelectUser={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-xl font-medium">
          Loading ConnectSphere...
          {!isConnected && (
            <div className="text-sm text-yellow-400 mt-2">
              Real-time features may be limited (WebSocket offline)
            </div>
          )}
        </div>
      </div>
    );
  }

  const isReceivingCall = call && call.status === CallStatus.RINGING && call.to.id === currentUser.id;
  const isOutgoingCall = call && call.status === CallStatus.RINGING && call.from.id === currentUser.id;
  const isCallActive = call && call.status === CallStatus.ACTIVE && (call.to.id === currentUser.id || call.from.id === currentUser.id);
  const isAudioCall = call && call.type === 'audio';
  const isVideoCall = call && call.type === 'video';
  const otherUserInCall = call ? (call.from.id === currentUser.id ? call.to : call.from) : null;

  const appContextValue = {
    currentUser,
    users,
    sendConnectionRequest,
    handleConnectionRequest,
    initiateCall,
  };

  return (
    <AppContext.Provider value={appContextValue}>
       {isReceivingCall && <CallModal call={call} onAccept={acceptCall} onReject={rejectCall} />}
       {isOutgoingCall && <OutgoingCallModal call={call} onCancel={rejectCall} />}
       {isCallActive && otherUserInCall && (
         isAudioCall ? (
           <AudioCallView 
             user={currentUser} 
             otherUser={otherUserInCall} 
             onEndCall={() => {
               logger.info('📞 App: Audio call ended from component');
               endCall();
               // Force refresh activeChat after call ends
               if (activeChat) {
                 logger.info('🔄 App: Refreshing activeChat after call end');
                 const refreshedChat = chats.find(c => c.id === activeChat.id);
                 if (refreshedChat) {
                   const enrichedChat = {
                     ...refreshedChat,
                     users: users.filter(u => refreshedChat.userIds.includes(u.id))
                   };
                   setActiveChat(enrichedChat);
                 }
               }
             }}
             isAudioEnabled={isAudioEnabled}
             onToggleAudio={toggleAudio}
           />
         ) : (
           <VideoCallView 
             user={currentUser} 
             otherUser={otherUserInCall} 
             onEndCall={() => {
               logger.info('📞 App: Video call ended from component');
               endCall();
               // Force refresh activeChat after call ends
               if (activeChat) {
                 logger.info('🔄 App: Refreshing activeChat after call end');
                 const refreshedChat = chats.find(c => c.id === activeChat.id);
                 if (refreshedChat) {
                   const enrichedChat = {
                     ...refreshedChat,
                     users: users.filter(u => refreshedChat.userIds.includes(u.id))
                   };
                   setActiveChat(enrichedChat);
                 }
               }
             }}
             localStream={localStream}
             remoteStream={remoteStream}
             isAudioEnabled={isAudioEnabled}
             isVideoEnabled={isVideoEnabled}
             isScreenSharing={isScreenSharing}
             onToggleAudio={toggleAudio}
             onToggleVideo={toggleVideo}
             onToggleScreenShare={toggleScreenShare}
           />
         )
       )}

      <div className={`flex h-screen bg-slate-800 text-gray-100 font-sans ${isCallActive || isReceivingCall || isOutgoingCall ? 'filter blur-sm' : ''}`}>
        <Sidebar
          connectedUsers={connectedUsers}
          onSelectChat={handleSelectChat}
          activeChatId={activeChat?.id}
          connectionRequests={connectionRequests}
          onShowUsers={handleShowUserList}
          onLogout={handleLogout}
        />
        <main className="flex-1 flex flex-col bg-slate-900">
          {activeChat ? (
            <ChatWindow
              chat={activeChat}
              onSendMessage={handleSendMessage}
              isInCall={isCallActive}
              isVideoCall={isVideoCall}
              isScreenSharing={isScreenSharing}
              onToggleScreenShare={toggleScreenShare}
            />
          ) : isUserListVisible ? (
            <UserList />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl text-slate-400">Welcome, {currentUser.name}</h2>
                <p className="text-slate-500">Select a connection to start chatting or find new mentors/mentees.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppContext.Provider>
  );
};

export default App;
