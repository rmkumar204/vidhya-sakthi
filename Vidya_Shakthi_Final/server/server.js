const WebSocket = require('ws');
const http = require('http');
const url = require('url');

class SignalingServer {
  constructor(port = 1883) {
    this.port = port;
    this.clients = new Map(); // userId -> WebSocket
    this.chats = new Map(); // chatId -> Set of userIds
    this.callEndThrottle = new Map(); // Prevent spam
    this.messageHistory = new Map(); // chatId -> message history
    this.userStatus = new Map(); // userId -> { online: boolean, lastSeen: Date }
    
    this.setupServer();
  }

  setupServer() {
    // Create HTTP server for CORS handling
    this.server = http.createServer((req, res) => {
      // Handle CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      // Health check endpoint
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          clients: this.clients.size,
          chats: this.chats.size,
          uptime: process.uptime()
        }));
        return;
      }
      
      res.writeHead(404);
      res.end('Not Found');
    });

    // Create WebSocket server
    this.wss = new WebSocket.Server({ 
      server: this.server,
      verifyClient: (info) => {
        // Allow all connections for now, but could add authentication here
        return true;
      }
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Invalid message format:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.handleDisconnection(ws);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`🚀 Signaling server running on port ${this.port}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${this.port}`);
      console.log(`🏥 Health check: http://localhost:${this.port}/health`);
    });
  }

  handleMessage(ws, message) {
    const { type, payload, from, to } = message;
    
    console.log(`📨 Received ${type} from ${from || 'unknown'}`);

    switch (type) {
      case 'user_join':
        this.handleUserJoin(ws, payload);
        break;
      case 'message':
        this.handleChatMessage(ws, payload);
        break;
      case 'call_offer':
        this.handleCallOffer(ws, payload);
        break;
      case 'call_answer':
        this.handleCallAnswer(ws, payload);
        break;
      case 'call_ice_candidate':
        this.handleIceCandidate(ws, payload);
        break;
      case 'call_end':
        this.handleCallEnd(ws, payload);
        break;
      case 'typing':
        this.handleTypingIndicator(ws, payload);
        break;
      case 'call_mute_status':
        this.handleMuteStatus(ws, payload);
        break;
      case 'call_video_status':
        this.handleVideoStatus(ws, payload);
        break;
      case 'call_ringing':
        this.handleCallRinging(ws, payload);
        break;
      case 'call_reject':
        this.handleCallReject(ws, payload);
        break;
      case 'call_history':
        this.handleCallHistory(ws, payload);
        break;
      case 'scheduled_message':
        this.handleScheduledMessage(ws, payload);
        break;
      default:
        console.warn(`⚠️ Unknown message type: ${type}`);
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  handleUserJoin(ws, payload) {
    const { userId, userName } = payload;
    
    if (!userId) {
      this.sendError(ws, 'User ID is required');
      return;
    }

    // Store client connection
    this.clients.set(userId, ws);
    this.userStatus.set(userId, { 
      online: true, 
      lastSeen: new Date(),
      userName: userName || `User ${userId.slice(-4)}`
    });

    // Store user ID in WebSocket for easy access
    ws.userId = userId;
    ws.userName = userName || `User ${userId.slice(-4)}`;

    console.log(`✅ User ${userId} joined (${this.clients.size} total users)`);

    // Send confirmation
    this.sendMessage(ws, {
      type: 'user_joined',
      payload: { userId, status: 'connected' }
    });

    // Broadcast user online status to all connected users
    this.broadcastUserStatus(userId, true);
  }

  handleChatMessage(ws, payload) {
    const { chatId, content, type = 'text', senderId, senderName } = payload;
    
    if (!chatId || !content || !senderId) {
      this.sendError(ws, 'Chat ID, content, and sender ID are required');
      return;
    }

    // Create message object
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      content,
      type,
      senderId,
      senderName: senderName || ws.userName || `User ${senderId.slice(-4)}`,
      timestamp: new Date().toISOString(),
      delivered: false
    };

    // Store message in history
    if (!this.messageHistory.has(chatId)) {
      this.messageHistory.set(chatId, []);
    }
    this.messageHistory.get(chatId).push(message);

    // Get chat participants
    const participants = this.chats.get(chatId) || new Set();
    
    // If this is a new chat, add the sender
    if (participants.size === 0) {
      participants.add(senderId);
      this.chats.set(chatId, participants);
    }

    // Send message to all participants except sender
    participants.forEach(userId => {
      if (userId !== senderId) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          this.sendMessage(client, {
            type: 'message',
            payload: message
          });
        }
      }
    });

    // Send delivery confirmation to sender
    this.sendMessage(ws, {
      type: 'message_delivered',
      payload: { messageId: message.id, chatId }
    });

    console.log(`💬 Message sent in chat ${chatId} by ${senderId}`);
  }

  handleCallOffer(ws, payload) {
    const { callId, toUserId, offer, callType, fromUserId, fromUserName } = payload;
    
    if (!callId || !toUserId || !offer || !callType) {
      this.sendError(ws, 'Call ID, target user, offer, and call type are required');
      return;
    }

    const targetClient = this.clients.get(toUserId);
    if (!targetClient || targetClient.readyState !== WebSocket.OPEN) {
      this.sendError(ws, 'Target user is not available');
      return;
    }

    // Send call offer to target user
    this.sendMessage(targetClient, {
      type: 'call_offer',
      payload: {
        callId,
        fromUserId: fromUserId || ws.userId,
        fromUserName: fromUserName || ws.userName,
        offer,
        callType,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`📞 Call offer sent from ${ws.userId} to ${toUserId}`);
  }

  handleCallAnswer(ws, payload) {
    const { callId, fromUserId, answer } = payload;
    
    if (!callId || !fromUserId || !answer) {
      this.sendError(ws, 'Call ID, from user ID, and answer are required');
      return;
    }

    const targetClient = this.clients.get(fromUserId);
    if (!targetClient || targetClient.readyState !== WebSocket.OPEN) {
      this.sendError(ws, 'Caller is not available');
      return;
    }

    // Send answer back to caller
    this.sendMessage(targetClient, {
      type: 'call_answer',
      payload: {
        callId,
        fromUserId: ws.userId,
        answer,
        timestamp: new Date().toISOString()
      }
    });

    // Also send call_accepted event for UI updates
    this.sendMessage(targetClient, {
      type: 'call_accepted',
      payload: {
        callId,
        fromUserId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`📞 Call answer sent from ${ws.userId} to ${fromUserId}`);
  }

  handleCallReject(ws, payload) {
    const { callId, toUserId, fromUserId } = payload;
    
    if (!callId || !toUserId) {
      this.sendError(ws, 'Call ID and to user ID are required');
      return;
    }

    const targetClient = this.clients.get(toUserId);
    if (!targetClient || targetClient.readyState !== WebSocket.OPEN) {
      this.sendError(ws, 'Caller is not available');
      return;
    }

    // Send reject notification back to caller
    this.sendMessage(targetClient, {
      type: 'call_rejected',
      payload: {
        callId,
        fromUserId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });

    // Also send call_end to both users to close their modals
    this.sendMessage(targetClient, {
      type: 'call_end',
      payload: {
        callId,
        fromUserId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });

    // Send call_end to the rejecter as well
    this.sendMessage(ws, {
      type: 'call_end',
      payload: {
        callId,
        fromUserId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`📞 Call rejected by ${ws.userId}, notifications sent to both users`);
  }

  handleCallHistory(ws, payload) {
    const { chatId, content, callData } = payload;
    
    if (!chatId || !content) {
      this.sendError(ws, 'Chat ID and content are required for call history');
      return;
    }

    // Create call history message
    const callHistoryMessage = {
      id: `call-history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      content,
      type: 'call_history',
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date().toISOString(),
      callData: callData || {}
    };

    // Store in message history
    if (!this.messageHistory.has(chatId)) {
      this.messageHistory.set(chatId, []);
    }
    this.messageHistory.get(chatId).push(callHistoryMessage);

    // Send to all participants in the chat
    const participants = callData?.participants || [];
    participants.forEach(participantId => {
      const client = this.clients.get(participantId);
      if (client && client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, {
          type: 'call_history',
          payload: callHistoryMessage
        });
      }
    });

    console.log(`📞 Call history added to chat ${chatId}: ${content}`);
  }

  handleIceCandidate(ws, payload) {
    const { callId, toUserId, candidate } = payload;
    
    if (!callId || !toUserId || !candidate) {
      this.sendError(ws, 'Call ID, target user, and candidate are required');
      return;
    }

    const targetClient = this.clients.get(toUserId);
    if (!targetClient || targetClient.readyState !== WebSocket.OPEN) {
      this.sendError(ws, 'Target user is not available');
      return;
    }

    // Forward ICE candidate
    this.sendMessage(targetClient, {
      type: 'call_ice_candidate',
      payload: {
        callId,
        fromUserId: ws.userId,
        candidate,
        timestamp: new Date().toISOString()
      }
    });
  }

  handleCallEnd(ws, payload) {
    const { callId, toUserId, duration, callType } = payload;
    
    if (!callId) {
      this.sendError(ws, 'Call ID is required');
      return;
    }

    // Throttle call end messages to prevent spam
    const throttleKey = `${ws.userId}-${callId}`;
    const now = Date.now();
    const lastSent = this.callEndThrottle.get(throttleKey) || 0;
    
    if (now - lastSent < 1000) { // 1 second throttle
      return;
    }
    
    this.callEndThrottle.set(throttleKey, now);

    // Send call end to target user if specified
    if (toUserId) {
      const targetClient = this.clients.get(toUserId);
      if (targetClient && targetClient.readyState === WebSocket.OPEN) {
        this.sendMessage(targetClient, {
          type: 'call_end',
          payload: {
            callId,
            fromUserId: ws.userId,
            duration,
            callType,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Create call history message
    if (toUserId) {
      const chatId = this.getChatId(ws.userId, toUserId);
      const callHistoryMessage = {
        id: `call-${callId}`,
        chatId,
        content: `Call ended (${this.formatDuration(duration || 0)})`,
        type: 'call_history',
        senderId: 'system',
        senderName: 'System',
        timestamp: new Date().toISOString(),
        callData: {
          callId,
          duration,
          callType,
          participants: [ws.userId, toUserId]
        }
      };

      // Store in message history
      if (!this.messageHistory.has(chatId)) {
        this.messageHistory.set(chatId, []);
      }
      this.messageHistory.get(chatId).push(callHistoryMessage);

      // Send to both participants
      [ws.userId, toUserId].forEach(userId => {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          this.sendMessage(client, {
            type: 'message',
            payload: callHistoryMessage
          });
        }
      });
    }

    console.log(`📞 Call ended: ${callId} (${this.formatDuration(duration || 0)})`);
  }

  handleTypingIndicator(ws, payload) {
    const { chatId, isTyping, userId } = payload;
    
    if (!chatId || !userId) {
      this.sendError(ws, 'Chat ID and user ID are required');
      return;
    }

    // Get chat participants
    const participants = this.chats.get(chatId) || new Set();
    
    // Send typing indicator to all participants except sender
    participants.forEach(participantId => {
      if (participantId !== userId) {
        const client = this.clients.get(participantId);
        if (client && client.readyState === WebSocket.OPEN) {
          this.sendMessage(client, {
            type: 'typing',
            payload: {
              chatId,
              userId,
              userName: ws.userName || `User ${userId.slice(-4)}`,
              isTyping,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    });
  }

  handleMuteStatus(ws, payload) {
    const { callId, toUserId, isMuted } = payload;
    
    if (!callId || !toUserId) {
      this.sendError(ws, 'Call ID and target user are required');
      return;
    }

    const targetClient = this.clients.get(toUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      this.sendMessage(targetClient, {
        type: 'call_mute_status',
        payload: {
          callId,
          fromUserId: ws.userId,
          isMuted,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  handleVideoStatus(ws, payload) {
    const { callId, toUserId, isVideoOn } = payload;
    
    if (!callId || !toUserId) {
      this.sendError(ws, 'Call ID and target user are required');
      return;
    }

    const targetClient = this.clients.get(toUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      this.sendMessage(targetClient, {
        type: 'call_video_status',
        payload: {
          callId,
          fromUserId: ws.userId,
          isVideoOn,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  handleCallRinging(ws, payload) {
    const { callId, toUserId, isRinging } = payload;
    
    if (!callId || !toUserId) {
      this.sendError(ws, 'Call ID and target user are required');
      return;
    }

    const targetClient = this.clients.get(toUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      this.sendMessage(targetClient, {
        type: 'call_ringing',
        payload: {
          callId,
          fromUserId: ws.userId,
          isRinging,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  handleScheduledMessage(ws, payload) {
    const { chatId, content, scheduledTime, senderId } = payload;
    
    if (!chatId || !content || !scheduledTime || !senderId) {
      this.sendError(ws, 'Chat ID, content, scheduled time, and sender ID are required');
      return;
    }

    const delay = new Date(scheduledTime).getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(() => {
        this.handleChatMessage(ws, {
          chatId,
          content,
          type: 'scheduled',
          senderId,
          senderName: ws.userName
        });
      }, delay);
      
      this.sendMessage(ws, {
        type: 'scheduled_message_confirmed',
        payload: { chatId, scheduledTime }
      });
    } else {
      this.sendError(ws, 'Scheduled time must be in the future');
    }
  }

  handleDisconnection(ws) {
    if (ws.userId) {
      console.log(`👋 User ${ws.userId} disconnected`);
      
      // Remove from clients
      this.clients.delete(ws.userId);
      
      // Update user status
      this.userStatus.set(ws.userId, { 
        online: false, 
        lastSeen: new Date(),
        userName: ws.userName
      });
      
      // Broadcast user offline status
      this.broadcastUserStatus(ws.userId, false);
      
      console.log(`📊 ${this.clients.size} users remaining`);
    }
  }

  broadcastUserStatus(userId, isOnline) {
    const statusMessage = {
      type: 'user_status',
      payload: {
        userId,
        userName: this.userStatus.get(userId)?.userName || `User ${userId.slice(-4)}`,
        isOnline,
        lastSeen: new Date().toISOString()
      }
    };

    // Broadcast to all connected clients
    this.clients.forEach((client, clientUserId) => {
      if (clientUserId !== userId && client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, statusMessage);
      }
    });
  }

  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Failed to send message:', error);
      }
    }
  }

  sendError(ws, errorMessage) {
    this.sendMessage(ws, {
      type: 'error',
      payload: { message: errorMessage, timestamp: new Date().toISOString() }
    });
  }

  getChatId(userId1, userId2) {
    // Create consistent chat ID for two users
    return [userId1, userId2].sort().join('-');
  }

  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Graceful shutdown
  shutdown() {
    console.log('🛑 Shutting down signaling server...');
    
    // Close all client connections
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1000, 'Server shutting down');
      }
    });
    
    // Close WebSocket server
    this.wss.close(() => {
      console.log('✅ WebSocket server closed');
    });
    
    // Close HTTP server
    this.server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  }
}

// Create and start server
const server = new SignalingServer(process.env.PORT || 1883);

// Handle graceful shutdown
process.on('SIGINT', () => {
  server.shutdown();
});

process.on('SIGTERM', () => {
  server.shutdown();
});

module.exports = SignalingServer;
