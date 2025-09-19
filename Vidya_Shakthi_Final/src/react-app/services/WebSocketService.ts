interface WebSocketMessage {
  type: 'message' | 'user_joined' | 'user_left' | 'typing' | 'call_offer' | 'call_answer' | 'call_ice_candidate' | 'call_end' | 'call_mute_status' | 'call_video_status' | 'call_ringing' | 'call_accept' | 'scheduled_message';
  payload: any;
  from?: string;
  to?: string;
  timestamp?: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private currentUserId: string | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private callEndThrottle: Map<string, number> = new Map(); // Throttle call_end messages

  constructor(private serverUrl: string = 'ws://localhost:8080') {
    // Ensure WebSocket URL uses correct protocol and handles different environments
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname;
      
      // Handle different deployment scenarios
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        this.serverUrl = `${protocol}//localhost:8080`;
      } else {
        // For production or different domains, use current host
        this.serverUrl = `${protocol}//${hostname}:8080`;
      }
      
      console.log('🔌 WebSocket URL determined for', navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Edge') ? 'Edge' : 'Browser', ':', this.serverUrl);
    }
  }

  connect(userId: string): Promise<void> {
    if (this.isConnecting && this.connectionPromise) {
      console.log('🔄 Connection already in progress, returning existing promise');
      return this.connectionPromise;
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentUserId === userId) {
      console.log('✅ Already connected with same user ID');
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.currentUserId = userId;

    this.connectionPromise = new Promise((resolve, reject) => {
      let connectionTimeout: ReturnType<typeof setTimeout> | undefined;
      
      try {
        // Close existing connection if any
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
        
        const wsUrl = `${this.serverUrl}?userId=${encodeURIComponent(userId)}&browser=${encodeURIComponent(navigator.userAgent)}`;
        console.log('🚀 Connecting to WebSocket:', wsUrl);
        
        // Browser-specific WebSocket options
        
        this.ws = new WebSocket(wsUrl);
        
        // Set WebSocket properties for better cross-browser compatibility
        if (this.ws) {
          this.ws.binaryType = 'arraybuffer'; // Better for binary data
        }

        // Set timeouts for connection
        connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.error('⏰ WebSocket connection timeout');
            this.ws.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          if (connectionTimeout) clearTimeout(connectionTimeout);
          console.log('✅ WebSocket connected to:', this.serverUrl);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            console.log("========================================= ws message");
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error, 'Raw data:', event.data);
          }
        };

        this.ws.onclose = (event) => {
          if (connectionTimeout) clearTimeout(connectionTimeout);
          console.log('🔴 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
          this.isConnecting = false;
          this.ws = null;
          this.connectionPromise = null;
          
          // Only attempt reconnection if this wasn't a manual close
          if (event.code !== 1000) {
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          if (connectionTimeout) clearTimeout(connectionTimeout);
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(error);
        };
      } catch (error) {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });
    
    return this.connectionPromise;
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentUserId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.currentUserId) {
          this.connect(this.currentUserId).catch(error => {
            console.error('Reconnection failed:', error);
          });
        }
      }, this.reconnectInterval);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    console.log("========================================= handleMessage");
    console.log('📨 WebSocket received message:', message);
    
    // Enhanced debugging for call_end messages
    if (message.type === 'call_end') {
      console.log('🔴 ❗ CALL_END MESSAGE RECEIVED:', {
        type: message.type,
        payload: message.payload,
        from: message.from,
        to: message.to,
        timestamp: message.timestamp,
        currentUserId: this.currentUserId
      });
    }
    
    const listeners = this.listeners.get(message.type) || [];
    console.log(`🎯 Found ${listeners.length} listeners for type '${message.type}'`);
    
    if (listeners.length === 0) {
      console.warn(`⚠️ No listeners registered for message type '${message.type}' - message will be ignored!`);
    }
    
    listeners.forEach((listener, index) => {
      console.log(`🔄 Calling listener ${index + 1}/${listeners.length} with payload:`, message.payload);
      try {
        listener(message.payload);
        console.log(`✅ Listener ${index + 1} executed successfully`);
      } catch (error) {
        console.error(`❌ Error in listener ${index + 1}:`, error);
      }
    });
  }

  on(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
    console.log(`🔍 WebSocket listener registered for '${eventType}'. Total listeners: ${this.listeners.get(eventType)!.length}`);
  }

  off(eventType: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(eventType) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      console.log(`🗑️ WebSocket listener removed for '${eventType}'. Remaining listeners: ${listeners.length}`);
    }
  }

  sendMessage(type: string, payload: any, to?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: type as any,
        payload,
        from: this.currentUserId || undefined,
        to,
        timestamp: Date.now()
      };
      console.log('📤 Sending WebSocket message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket is not connected - readyState:', this.ws?.readyState);
    }
  }

  sendChatMessage(chatId: string, content: string, type: 'text' | 'voice' | 'call-history' = 'text') {
    console.log('💬 Sending chat message:', { chatId, content, type, senderId: this.currentUserId });
    this.sendMessage('message', {
      chatId,
      content,
      type,
      senderId: this.currentUserId
    });
  }

  sendTypingIndicator(chatId: string, isTyping: boolean) {
    this.sendMessage('typing', {
      chatId,
      isTyping,
      userId: this.currentUserId
    });
  }

  // WebRTC signaling methods
  sendCallOffer(to: string, offer: RTCSessionDescriptionInit, callType: 'video' | 'audio') {
    this.sendMessage('call_offer', { offer, callType }, to);
  }

  sendCallAnswer(to: string, answer: RTCSessionDescriptionInit) {
    console.log('📞 Sending call answer to:', to);
    this.sendMessage('call_answer', { answer }, to);
  }

  sendCallAccept(to: string, callId?: string) {
    console.log('✅ Sending call accept notification to:', to);
    this.sendMessage('call_accept', { callId }, to);
  }

  sendIceCandidate(to: string, candidate: RTCIceCandidateInit) {
    this.sendMessage('call_ice_candidate', { candidate }, to);
  }

  sendCallEnd(to: string) {
    console.log("📞 Call end message sent ------------------------->");
    
    // Throttle call_end messages to prevent infinite loops
    const now = Date.now();
    const lastSent = this.callEndThrottle.get(to) || 0;
    
    if (now - lastSent < 1000) { // Only allow one call_end per second per user
      console.log('🛑 Throttling call_end message to', to, '- too frequent');
      return;
    }
    
    this.callEndThrottle.set(to, now);
    console.log('📤 Sending throttled call_end to:', to);
    
    // Enhanced debugging for call_end message structure
    const message = {
      type: 'call_end' as any,
      payload: {},
      from: this.currentUserId || undefined,
      to,
      timestamp: Date.now()
    };
    
    console.log('🔍 Call_end message structure:', {
      messageType: message.type,
      fromUser: message.from,
      toUser: message.to,
      payload: message.payload,
      timestamp: message.timestamp
    });
    
    this.sendMessage('call_end', {}, to);
    
    // Clean up old throttle entries
    setTimeout(() => {
      this.callEndThrottle.delete(to);
    }, 5000);
  }

  sendCallRinging(to: string) {
    this.sendMessage('call_ringing', {}, to);
  }

  sendMuteStatus(to: string, isMuted: boolean, userId: string) {
    this.sendMessage('call_mute_status', { isMuted, userId }, to);
  }

  sendVideoStatus(to: string, isVideoOff: boolean, userId: string) {
    console.log('📡 Sending video status:', { to, isVideoOff, userId });
    this.sendMessage('call_video_status', { videoEnabled: !isVideoOff, userId }, to);
  }

  disconnect() {
    console.log('🔴 Disconnecting WebSocket...');
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect'); // Normal closure
      this.ws = null;
    }
    this.currentUserId = null;
    this.listeners.clear();
    this.connectionPromise = null;
    this.isConnecting = false;
    console.log('✅ WebSocket disconnected and cleaned up');
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'disconnected';
    }
  }

  markMessageAsRead(chatId: string, messageId: string): void {
    this.sendMessage('message_read', {
      chatId,
      messageId
    });
  }

  sendConnectionRequest(toUserId: string, message?: string): void {
    this.sendMessage('connection_request', {
      toUserId,
      message
    }, toUserId);
  }

  sendConnectionResponse(requestId: string, status: 'accepted' | 'rejected'): void {
    this.sendMessage('connection_response', {
      requestId,
      status
    });
  }

  debugListeners(): void {
    console.log('🔍 Current WebSocket listeners:');
    this.listeners.forEach((callbacks, eventType) => {
      console.log(`  - ${eventType}: ${callbacks.length} listener(s)`);
    });
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
