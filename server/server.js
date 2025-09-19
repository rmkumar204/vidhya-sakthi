const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class SignalingServer {
  constructor(port = 8080) {
    this.port = port;
    this.clients = new Map(); // userId -> WebSocket
    this.chats = new Map(); // chatId -> Set of userIds
    this.callEndThrottle = new Map(); // userId -> timestamp to prevent spam
    this.setupServer();
  }

  setupServer() {
    this.wss = new WebSocket.Server({ 
      port: this.port,
      verifyClient: (info) => {
        // Allow CORS from any origin for development
        const origin = info.origin;
        console.log('WebSocket connection attempt from origin:', origin);
        return true; // Accept all origins for development
      },
      // Add additional server options for better cross-browser compatibility
      perMessageDeflate: false,
      maxPayload: 16 * 1024 * 1024, // 16MB
      clientTracking: true
    });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        ws.close(1008, 'User ID required');
        return;
      }

      console.log(`User ${userId} connected`);
      this.clients.set(userId, ws);
      console.log(`📋 Total connected users: ${this.clients.size}`, Array.from(this.clients.keys()));

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection_established',
        payload: { userId }
      }));

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`📨 Received message from ${userId}:`, message);
          this.handleMessage(userId, message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`User ${userId} disconnected`);
        this.clients.delete(userId);
        console.log(`📋 Remaining connected users: ${this.clients.size}`, Array.from(this.clients.keys()));
        this.broadcastUserLeft(userId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });

      // Broadcast user joined
      this.broadcastUserJoined(userId);
    });

    console.log(`Signaling server running on port ${this.port}`);
  }

  handleMessage(fromUserId, message) {
    const { type, payload, to } = message;

    // Store the 'to' field for use in handlers
    this.currentMessageTo = to;

    switch (type) {
      case 'message':
        this.handleChatMessage(fromUserId, payload);
        break;
      case 'typing':
        this.handleTypingIndicator(fromUserId, payload);
        break;
      case 'message_read':
        this.handleMessageRead(fromUserId, payload);
        break;
      case 'call_initiate':
        this.handleCallInitiate(fromUserId, payload);
        break;
      case 'call_accept':
        this.handleCallAccept(fromUserId, payload);
        break;
      case 'call_reject':
        this.handleCallReject(fromUserId, payload);
        break;
      case 'call_end':
        this.handleCallEnd(fromUserId, payload);
        break;
      case 'offer':
        this.handleCallOffer(fromUserId, payload);
        break;
      case 'call_offer':
        this.handleCallOffer(fromUserId, payload);
        break;
      case 'answer':
        this.handleCallAnswer(fromUserId, payload);
        break;
      case 'call_answer':
        this.handleCallAnswer(fromUserId, payload);
        break;
      case 'ice_candidate':
        this.handleIceCandidate(fromUserId, payload);
        break;
      case 'call_reject':
        this.handleCallReject(fromUserId, payload);
        break;
      case 'call_end':
        this.handleCallEnd(fromUserId, payload);
        break;
      case 'call_history':
        this.handleCallHistory(fromUserId, payload);
        break;
      case 'connection_request':
        this.handleConnectionRequest(fromUserId, payload);
        break;
      case 'connection_accept':
        this.handleConnectionAccept(fromUserId, payload);
        break;
      case 'connection_reject':
        this.handleConnectionReject(fromUserId, payload);
        break;
      case 'ping':
        this.handlePing(fromUserId, payload);
        break;
      case 'scheduled_message':
        this.handleScheduledMessage(fromUserId, payload);
        break;
      default:
        console.log(`⚠️ Unknown message type: ${type}`);
    }
  }

  handleChatMessage(fromUserId, payload) {
    console.log(`💬 Handling chat message from ${fromUserId}:`, payload);
    const { chatId, content, type, senderId, senderName } = payload;
    
    // Create message with server timestamp and unique ID
    const uniqueId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${fromUserId}`;
    const message = {
      id: uniqueId,
      chatId,
      senderId: fromUserId,
      senderName: senderName || `User ${fromUserId.substr(-4)}`,
      content,
      type: type || 'text',
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Broadcasting message to chat ${chatId}:`, message);
    // Broadcast to all users in the chat
    this.broadcastToChatMembers(chatId, fromUserId, {
      type: 'message',
      payload: message
    });
  }

  handleTypingIndicator(fromUserId, payload) {
    const { chatId, isTyping } = payload;
    
    console.log(`⌨️ Typing indicator from ${fromUserId} in chat ${chatId}: ${isTyping}`);
    
    // Broadcast typing indicator to other chat members
    this.broadcastToChatMembers(chatId, fromUserId, {
      type: 'typing',
      payload: {
        chatId,
        userId: fromUserId,
        isTyping
      }
    });
  }

  handleMessageRead(fromUserId, payload) {
    const { chatId, messageId } = payload;
    
    // Broadcast read receipt to other chat members
    this.broadcastToChatMembers(chatId, fromUserId, {
      type: 'message_read',
      payload: {
        chatId,
        messageId,
        userId: fromUserId,
        timestamp: new Date().toISOString()
      }
    });
  }

  handleCallInitiate(fromUserId, payload) {
    const { callId, callType, targetUserId, roomId } = payload;
    
    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'call_initiate',
        payload: {
          callId,
          callType,
          fromUserId,
          fromUserName: `User ${fromUserId.substr(-4)}`, // In production, fetch from user service
          roomId,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  handleCallAccept(fromUserId, payload) {
    const { callId, targetUserId } = payload;
    
    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'call_accept',
        payload: {
          callId,
          fromUserId,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  handleCallReject(fromUserId, payload) {
    const { callId, targetUserId } = payload;
    
    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'call_reject',
        payload: {
          callId,
          fromUserId,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  handleConnectionRequest(fromUserId, payload) {
    const { connectionId, mentorId, menteeId, projectId } = payload;
    
    // Determine target user (the one who didn't send the request)
    const targetUserId = fromUserId === mentorId ? menteeId : mentorId;
    
    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'connection_request',
        payload: {
          connectionId,
          mentorId,
          menteeId,
          mentorName: `Mentor ${mentorId.substr(-4)}`,
          menteeName: `Mentee ${menteeId.substr(-4)}`,
          projectId,
          projectName: projectId ? `Project ${projectId.substr(-4)}` : undefined,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  handleConnectionAccept(fromUserId, payload) {
    const { connectionId, mentorId, menteeId } = payload;
    
    // Notify both users
    const mentorClient = this.clients.get(mentorId);
    const menteeClient = this.clients.get(menteeId);
    
    const response = {
      type: 'connection_accept',
      payload: {
        connectionId,
        timestamp: new Date().toISOString()
      }
    };
    
    if (mentorClient && mentorClient.readyState === WebSocket.OPEN) {
      mentorClient.send(JSON.stringify(response));
    }
    
    if (menteeClient && menteeClient.readyState === WebSocket.OPEN) {
      menteeClient.send(JSON.stringify(response));
    }
  }

  handleConnectionReject(fromUserId, payload) {
    const { connectionId, mentorId, menteeId } = payload;
    
    // Notify both users
    const mentorClient = this.clients.get(mentorId);
    const menteeClient = this.clients.get(menteeId);
    
    const response = {
      type: 'connection_reject',
      payload: {
        connectionId,
        timestamp: new Date().toISOString()
      }
    };
    
    if (mentorClient && mentorClient.readyState === WebSocket.OPEN) {
      mentorClient.send(JSON.stringify(response));
    }
    
    if (menteeClient && menteeClient.readyState === WebSocket.OPEN) {
      menteeClient.send(JSON.stringify(response));
    }
  }

  handlePing(fromUserId, payload) {
    const client = this.clients.get(fromUserId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'pong',
        payload: { timestamp: Date.now() }
      }));
    }
  }

  handleCallOffer(fromUserId, payload) {
    console.log("📞 Handling call offer from", fromUserId, ":", payload);
    const { targetUserId, toUserId, callId, offer, callType, fromUserName } = payload;
    
    // Support multiple ways to get target user ID:
    // 1. From message 'to' field (set by WebSocketService.sendMessage)
    // 2. From payload targetUserId field
    // 3. From payload toUserId field
    const targetUser = this.currentMessageTo || targetUserId || toUserId;
    
    if (!targetUser) {
      console.error("❌ No target user ID found in call offer. Checked:", {
        messageTo: this.currentMessageTo,
        targetUserId,
        toUserId,
        payload
      });
      return;
    }
    
    console.log("🎯 Target user for call offer:", targetUser);
    
    const targetClient = this.clients.get(targetUser);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      console.log("📤 Sending call offer to user", targetUser);
      targetClient.send(JSON.stringify({
        type: 'call_offer',
        payload: {
          callId,
          fromUserId,
          fromUserName: fromUserName || `User ${fromUserId.substr(-4)}`,
          offer,
          callType: callType || 'audio',
          timestamp: new Date().toISOString()
        }
      }));
      console.log("✅ Call offer sent successfully to", targetUser);
    } else {
      console.error("❌ Target user", targetUser, "not connected or WebSocket not open. ReadyState:", targetClient?.readyState);
      console.log("📋 Available connected users:", Array.from(this.clients.keys()));
    }
  }

  handleCallAnswer(fromUserId, payload) {
    const { targetUserId, callId, answer } = payload;
    
    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'answer',
        payload: {
          fromUserId,
          callId,
          answer,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  handleIceCandidate(fromUserId, payload) {
    const { targetUserId, callId, candidate } = payload;
    
    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'ice_candidate',
        payload: {
          fromUserId,
          callId,
          candidate,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  handleCallEnd(fromUserId, payload) {
    const { targetUserId, callId } = payload;
    
    // Rate limit call_end messages to prevent infinite loops
    const now = Date.now();
    const throttleKey = `${fromUserId}-${targetUserId}`;
    const lastSent = this.callEndThrottle.get(throttleKey) || 0;
    
    if (now - lastSent < 1000) { // Only allow one call_end per second per user pair
      console.log(`🛑 Throttling call_end from ${fromUserId} to ${targetUserId} - too frequent`);
      return;
    }
    
    this.callEndThrottle.set(throttleKey, now);
    console.log(`📤 Processing call_end from ${fromUserId} to ${targetUserId}`);
    
    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'call_end',
        payload: {
          callId,
          fromUserId,
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    // Clean up old throttle entries
    setTimeout(() => {
      this.callEndThrottle.delete(throttleKey);
    }, 5000);
  }

  handleCallHistory(fromUserId, payload) {
    const { callId, duration, callType } = payload;
    
    console.log(`📞 Call history logged: ${callId}, duration: ${duration}s, type: ${callType}`);
    
    // Broadcast call history to all connected clients for logging
    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'call_history',
          payload: {
            callId,
            duration,
            callType,
            fromUserId,
            timestamp: new Date().toISOString()
          }
        }));
      }
    });
  }

  handleMuteStatus(fromUserId, toUserId, payload) {
    const { isMuted, userId } = payload;
    
    const targetClient = this.clients.get(toUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'call_mute_status',
        payload: { isMuted, userId }
      }));
    }
  }

  handleVideoStatus(fromUserId, toUserId, payload) {
    const { videoEnabled, userId } = payload;
    
    const targetClient = this.clients.get(toUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        type: 'call_video_status',
        payload: { videoEnabled, userId }
      }));
    }
  }

  handleScheduledMessage(fromUserId, payload) {
    console.log(`📅 Handling scheduled message from ${fromUserId}:`, payload);
    // For now, treat scheduled messages like regular messages
    // In a real implementation, you'd store them and send at the scheduled time
    this.handleChatMessage(fromUserId, payload);
  }

  broadcastToChatMembers(chatId, excludeUserId, message) {
    console.log(`📡 Broadcasting to chat ${chatId}, excluding ${excludeUserId}:`, message);
    console.log(`👥 Connected clients: ${Array.from(this.clients.keys()).join(', ')}`);
    
    // For simplicity, we'll broadcast to all connected users except the sender
    // In a real app, you'd maintain chat membership data
    let broadcastCount = 0;
    this.clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        console.log(`📨 Sending to user ${userId} for chat ${chatId}`);
        try {
          client.send(JSON.stringify(message));
          broadcastCount++;
          console.log(`✅ Successfully sent to user ${userId}`);
        } catch (error) {
          console.error(`❌ Failed to send to user ${userId}:`, error);
        }
      } else if (userId === excludeUserId) {
        console.log(`⏭️ Skipping sender ${userId}`);
      } else {
        console.log(`❌ User ${userId} not ready (state: ${client.readyState})`);
      }
    });
    console.log(`✅ Message broadcasted to ${broadcastCount} clients`);
  }

  broadcastUserJoined(userId) {
    const message = {
      type: 'user_joined',
      payload: { userId }
    };

    this.clients.forEach((client, clientId) => {
      if (clientId !== userId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  broadcastUserLeft(userId) {
    const message = {
      type: 'user_left',
      payload: { userId }
    };

    this.clients.forEach((client, clientId) => {
      if (clientId !== userId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

// Start the server
const server = new SignalingServer(process.env.PORT || 8080);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.wss.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.wss.close(() => {
    process.exit(0);
  });
});