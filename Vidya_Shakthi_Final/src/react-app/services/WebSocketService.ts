import { SignalingMessage, WS_EVENTS } from '../utils/constants';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(url: string = 'ws://localhost:8080') {
    this.url = url;
  }

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.url}?userId=${userId}`);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: SignalingMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: SignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleMessage(message: SignalingMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect('').catch(console.error);
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Convenience methods for call signaling
  initiateCall(to: string, callId: string, callType: 'audio' | 'video'): void {
    this.send({
      type: WS_EVENTS.CALL_INITIATE,
      from: 'current-user', // This should be replaced with actual user ID
      to,
      callId,
      data: { callType }
    });
  }

  acceptCall(from: string, callId: string): void {
    this.send({
      type: WS_EVENTS.CALL_ACCEPT,
      from: 'current-user',
      to: from,
      callId
    });
  }

  rejectCall(from: string, callId: string): void {
    this.send({
      type: WS_EVENTS.CALL_REJECT,
      from: 'current-user',
      to: from,
      callId
    });
  }

  endCall(to: string, callId: string): void {
    this.send({
      type: WS_EVENTS.CALL_END,
      from: 'current-user',
      to,
      callId
    });
  }

  sendOffer(to: string, offer: RTCSessionDescriptionInit, callId: string): void {
    this.send({
      type: WS_EVENTS.OFFER,
      from: 'current-user',
      to,
      callId,
      data: { offer }
    });
  }

  sendAnswer(to: string, answer: RTCSessionDescriptionInit, callId: string): void {
    this.send({
      type: WS_EVENTS.ANSWER,
      from: 'current-user',
      to,
      callId,
      data: { answer }
    });
  }

  sendIceCandidate(to: string, candidate: RTCIceCandidateInit, callId: string): void {
    this.send({
      type: WS_EVENTS.ICE_CANDIDATE,
      from: 'current-user',
      to,
      callId,
      data: { candidate }
    });
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();