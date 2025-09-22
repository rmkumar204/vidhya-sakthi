const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./config/logger');

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
        logger.websocket('WebSocket connection attempt', { origin });
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
        logger.websocket('Connection rejected: User ID required');
        ws.close(1008, 'User ID required');
        return;
      }

      logger.websocket('User connected', { 
        userId, 
        totalUsers: this.clients.size + 1,
        connectedUsers: Array.from(this.clients.keys())
      });
      this.clients.set(userId, ws);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection_established',
        payload: { userId }
      }));

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          logger.websocket('Message received', { 
            userId, 
            messageType: message.type,
            messageSize: data.length
          });
          this.handleMessage(userId, message);
        } catch (error) {
          logger.error('Error parsing WebSocket message', { 
            userId, 
            error: error.message,
            data: data.toString().substring(0, 100) // Log first 100 chars for debugging
          });
        }
      });

      ws.on('close', () => {
        logger.websocket('User disconnected', { 
          userId, 
          remainingUsers: this.clients.size - 1,
          connectedUsers: Array.from(this.clients.keys()).filter(id => id !== userId)
        });
        this.clients.delete(userId);
        this.broadcastUserLeft(userId);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', { 
          userId, 
          error: error.message,
          stack: error.stack
        });
      });

      // Broadcast user joined
      this.broadcastUserJoined(userId);
    });

    logger.info(`Signaling server running on port ${this.port}`, { 
      port: this.port,
      environment: process.env.NODE_ENV || 'development'
    });
  }

  handleMessage(fromUserId, message) {
    const { type, payload, to } = message;
    logger.signaling('Handling message', { 
      fromUserId, 
      messageType: type,
      to
    });

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
      case 'call_offer':
        this.handleCallOffer(fromUserId, payload);
        break;
      case 'answer':
      case 'call_answer':
        this.handleCallAnswer(fromUserId, payload);
        break;
      case 'ice_candidate':
      case 'call_ice_candidate':
        this.handleIceCandidate(fromUserId, payload);
        break;
      case 'call_reject':
        this.handleCallReject(fromUserId, payload);
        break;
      case 'call_ringing':
        this.handleCallRinging(fromUserId, payload);
        break;
      case 'call_mute_status':
        this.handleCallMuteStatus(fromUserId, payload);
        break;
      case 'call_video_status':
        this.handleCallVideoStatus(fromUserId, payload);
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
        logger.debug(`⚠️ Unknown message type: ${type}`);
    }
  }

  handleChatMessage(fromUserId, payload) {
    logger.debug(`💬 Handling chat message from ${fromUserId}:`, payload);
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

    logger.debug(`📤 Broadcasting message to chat ${chatId}:`, message);
    // Broadcast to all users in the chat
    this.broadcastToChatMembers(chatId, fromUserId, {
      type: 'message',
      payload: message
    });
  }

  handleTypingIndicator(fromUserId, payload) {
    const { chatId, isTyping } = payload;
    
    logger.debug(`⌨️ Typing indicator from ${fromUserId} in chat ${chatId}: ${isTyping}`);
    
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
    logger.debug("✅ Handling call accept from", fromUserId, ":", payload);
    const { callId, targetUserId, toUserId } = payload;
    
    // Support multiple ways to get target user ID
    const targetUser = this.currentMessageTo || targetUserId || toUserId;
    
    if (!targetUser) {
      logger.error("❌ No target user ID found in call accept. Checked:", {
        messageTo: this.currentMessageTo,
        targetUserId,
        toUserId,
        payload
      });
      return;
    }
    
    logger.debug("🎯 Target user for call accept:", targetUser);
    
    const targetClient = this.clients.get(targetUser);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      logger.debug("📤 Sending call accept to user", targetUser);
      targetClient.send(JSON.stringify({
        type: 'call_accept',
        payload: {
          callId,
          fromUserId,
          timestamp: new Date().toISOString()
        }
      }));
      logger.debug("✅ Call accept sent successfully to", targetUser);
    } else {
      logger.error("❌ Target user", targetUser, "not connected or WebSocket not open. ReadyState:", targetClient?.readyState);
      logger.debug("📋 Available connected users:", Array.from(this.clients.keys()));
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
    logger.debug("📞 Handling call offer from", fromUserId, ":", payload);
    const { targetUserId, toUserId, callId, offer, callType, fromUserName } = payload;
    
    // Support multiple ways to get target user ID:
    // 1. From message 'to' field (set by WebSocketService.sendMessage)
    // 2. From payload targetUserId field
    // 3. From payload toUserId field
    const targetUser = this.currentMessageTo || targetUserId || toUserId;
    
    if (!targetUser) {
      logger.error("❌ No target user ID found in call offer. Checked:", {
        messageTo: this.currentMessageTo,
        targetUserId,
        toUserId,
        payload
      });
      return;
    }
    
    logger.debug("🎯 Target user for call offer:", targetUser);
    
    const targetClient = this.clients.get(targetUser);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      logger.debug("📤 Sending call offer to user", targetUser);
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
      logger.debug("✅ Call offer sent successfully to", targetUser);
    } else {
      logger.error("❌ Target user", targetUser, "not connected or WebSocket not open. ReadyState:", targetClient?.readyState);
      logger.debug("📋 Available connected users:", Array.from(this.clients.keys()));
    }
  }

  handleCallAnswer(fromUserId, payload) {
    logger.debug("📞 Handling call answer from", fromUserId, ":", payload);
    const { targetUserId, toUserId, callId, answer } = payload;
    
    // Support multiple ways to get target user ID
    const targetUser = this.currentMessageTo || targetUserId || toUserId;
    
    if (!targetUser) {
      logger.error("❌ No target user ID found in call answer. Checked:", {
        messageTo: this.currentMessageTo,
        targetUserId,
        toUserId,
        payload
      });
      return;
    }
    
    logger.debug("🎯 Target user for call answer:", targetUser);
    
    const targetClient = this.clients.get(targetUser);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      logger.debug("📤 Sending call answer to user", targetUser);
      targetClient.send(JSON.stringify({
        type: 'call_answer',
        payload: {
          fromUserId,
          callId,
          answer,
          timestamp: new Date().toISOString()
        }
      }));
      logger.debug("✅ Call answer sent successfully to", targetUser);
    } else {
      logger.error("❌ Target user", targetUser, "not connected or WebSocket not open. ReadyState:", targetClient?.readyState);
    }
  }

  handleIceCandidate(fromUserId, payload) {
    logger.debug("🧊 Handling ICE candidate from", fromUserId, ":", payload);
    const { targetUserId, toUserId, callId, candidate } = payload;
    
    // Support multiple ways to get target user ID
    const targetUser = this.currentMessageTo || targetUserId || toUserId;
    
    if (!targetUser) {
      logger.error("❌ No target user ID found in ICE candidate. Checked:", {
        messageTo: this.currentMessageTo,
        targetUserId,
        toUserId,
        payload
      });
      return;
    }
    
    logger.debug("🎯 Target user for ICE candidate:", targetUser);
    
    const targetClient = this.clients.get(targetUser);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      logger.debug("📤 Sending ICE candidate to user", targetUser);
      targetClient.send(JSON.stringify({
        type: 'call_ice_candidate',
        payload: {
          fromUserId,
          callId,
          candidate,
          timestamp: new Date().toISOString()
        }
      }));
      logger.debug("✅ ICE candidate sent successfully to", targetUser);
    } else {
      logger.error("❌ Target user", targetUser, "not connected or WebSocket not open. ReadyState:", targetClient?.readyState);
    }
  }

  handleCallEnd(fromUserId, payload) {
    logger.debug(`🔚 Handling call_end from ${fromUserId}:`, payload);
    
    // Extract target user ID from multiple possible sources:
    // 1. From message 'to' field (set by WebSocketService.sendMessage)
    // 2. From payload targetUserId field
    // 3. From payload toUserId field
    const targetUserId = this.currentMessageTo || payload.targetUserId || payload.toUserId;
    const callId = payload.callId;
    
    if (!targetUserId) {
      logger.error("❌ No target user ID found in call_end. Checked:", {
        messageTo: this.currentMessageTo,
        targetUserId: payload.targetUserId,
        toUserId: payload.toUserId,
        payload
      });
      return;
    }
    
    logger.debug(`🎯 Target user for call_end: ${targetUserId}`);
    
    // Rate limit call_end messages to prevent infinite loops
    const now = Date.now();
    const throttleKey = `${fromUserId}-${targetUserId}`;
    const lastSent = this.callEndThrottle.get(throttleKey) || 0;
    
    if (now - lastSent < 1000) { // Only allow one call_end per second per user pair
      logger.debug(`🛑 Throttling call_end from ${fromUserId} to ${targetUserId} - too frequent`);
      return;
    }
    
    this.callEndThrottle.set(throttleKey, now);
    logger.debug(`📤 Processing call_end from ${fromUserId} to ${targetUserId}`);
    
    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      logger.debug(`✅ Sending call_end to user ${targetUserId}`);
      targetClient.send(JSON.stringify({
        type: 'call_end',
        payload: {
          callId,
          fromUserId,
          timestamp: new Date().toISOString()
        }
      }));
      logger.debug(`✅ Call_end sent successfully to ${targetUserId}`);
    } else {
      logger.error(`❌ Target user ${targetUserId} not connected or WebSocket not open. ReadyState:`, targetClient?.readyState);
      logger.debug("📋 Available connected users:", Array.from(this.clients.keys()));
    }
    
    // Clean up old throttle entries
    setTimeout(() => {
      this.callEndThrottle.delete(throttleKey);
    }, 5000);
  }

  handleCallHistory(fromUserId, payload) {
    const { callId, duration, callType } = payload;
    
    logger.debug(`📞 Call history logged: ${callId}, duration: ${duration}s, type: ${callType}`);
    
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

  handleCallRinging(fromUserId, payload) {
    logger.debug("🔔 Handling call ringing from", fromUserId, ":", payload);
    const { targetUserId, toUserId, callId } = payload;
    
    // Support multiple ways to get target user ID
    const targetUser = this.currentMessageTo || targetUserId || toUserId;
    
    if (!targetUser) {
      logger.error("❌ No target user ID found in call ringing. Checked:", {
        messageTo: this.currentMessageTo,
        targetUserId,
        toUserId,
        payload
      });
      return;
    }
    
    logger.debug("🎯 Target user for call ringing:", targetUser);
    
    const targetClient = this.clients.get(targetUser);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      logger.debug("📤 Sending call ringing to user", targetUser);
      targetClient.send(JSON.stringify({
        type: 'call_ringing',
        payload: {
          callId,
          fromUserId,
          timestamp: new Date().toISOString()
        }
      }));
      logger.debug("✅ Call ringing sent successfully to", targetUser);
    } else {
      logger.error("❌ Target user", targetUser, "not connected or WebSocket not open. ReadyState:", targetClient?.readyState);
    }
  }

  handleCallMuteStatus(fromUserId, payload) {
    logger.debug("🎤 Handling mute status from", fromUserId, ":", payload);
    const { targetUserId, toUserId, isMuted, userId } = payload;
    
    // Support multiple ways to get target user ID
    const targetUser = this.currentMessageTo || targetUserId || toUserId;
    
    if (!targetUser) {
      logger.error("❌ No target user ID found in mute status. Checked:", {
        messageTo: this.currentMessageTo,
        targetUserId,
        toUserId,
        payload
      });
      return;
    }
    
    logger.debug("🎯 Target user for mute status:", targetUser);
    
    const targetClient = this.clients.get(targetUser);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      logger.debug("📤 Sending mute status to user", targetUser);
      targetClient.send(JSON.stringify({
        type: 'call_mute_status',
        payload: {
          isMuted,
          userId: userId || fromUserId,
          timestamp: new Date().toISOString()
        }
      }));
      logger.debug("✅ Mute status sent successfully to", targetUser);
    } else {
      logger.error("❌ Target user", targetUser, "not connected or WebSocket not open. ReadyState:", targetClient?.readyState);
    }
  }

  handleCallVideoStatus(fromUserId, payload) {
    logger.debug("📹 Handling video status from", fromUserId, ":", payload);
    const { targetUserId, toUserId, videoEnabled, userId } = payload;
    
    // Support multiple ways to get target user ID
    const targetUser = this.currentMessageTo || targetUserId || toUserId;
    
    if (!targetUser) {
      logger.error("❌ No target user ID found in video status. Checked:", {
        messageTo: this.currentMessageTo,
        targetUserId,
        toUserId,
        payload
      });
      return;
    }
    
    logger.debug("🎯 Target user for video status:", targetUser);
    
    const targetClient = this.clients.get(targetUser);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      logger.debug("📤 Sending video status to user", targetUser);
      targetClient.send(JSON.stringify({
        type: 'call_video_status',
        payload: {
          videoEnabled,
          userId: userId || fromUserId,
          timestamp: new Date().toISOString()
        }
      }));
      logger.debug("✅ Video status sent successfully to", targetUser);
    } else {
      logger.error("❌ Target user", targetUser, "not connected or WebSocket not open. ReadyState:", targetClient?.readyState);
    }
  }

  handleScheduledMessage(fromUserId, payload) {
    logger.debug(`📅 Handling scheduled message from ${fromUserId}:`, payload);
    // For now, treat scheduled messages like regular messages
    // In a real implementation, you'd store them and send at the scheduled time
    this.handleChatMessage(fromUserId, payload);
  }

  broadcastToChatMembers(chatId, excludeUserId, message) {
    logger.debug(`📡 Broadcasting to chat ${chatId}, excluding ${excludeUserId}:`, message);
    logger.debug(`👥 Connected clients: ${Array.from(this.clients.keys()).join(', ')}`);
    
    // For simplicity, we'll broadcast to all connected users except the sender
    // In a real app, you'd maintain chat membership data
    let broadcastCount = 0;
    this.clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        logger.debug(`📨 Sending to user ${userId} for chat ${chatId}`);
        try {
          client.send(JSON.stringify(message));
          broadcastCount++;
          logger.debug(`✅ Successfully sent to user ${userId}`);
        } catch (error) {
          logger.error(`❌ Failed to send to user ${userId}:`, error);
        }
      } else if (userId === excludeUserId) {
        logger.debug(`⏭️ Skipping sender ${userId}`);
      } else {
        logger.debug(`❌ User ${userId} not ready (state: ${client.readyState})`);
      }
    });
    logger.debug(`✅ Message broadcasted to ${broadcastCount} clients`);
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
  logger.info('SIGTERM received, shutting down gracefully');
  server.wss.close(() => {
    logger.info('Server shutdown complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.wss.close(() => {
    logger.info('Server shutdown complete');
    process.exit(0);
  });
});