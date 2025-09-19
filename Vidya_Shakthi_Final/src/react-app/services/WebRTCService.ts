// Browser-compatible EventEmitter implementation
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }
    this.events[event].forEach(listener => listener(...args));
    return true;
  }

  off(event: string, listener: Function): this {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(l => l !== listener);
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
}

export interface CallState {
  isInCall: boolean;
  callType: 'video' | 'audio' | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed' | 'reconnecting';
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  error: string | null;
  isMuted: boolean;
  isVideoOff: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  iceConnectionState: RTCIceConnectionState;
  peerConnectionState: RTCPeerConnectionState;
}

export interface Call {
  id: string;
  type: 'video' | 'audio';
  fromUserId: string;
  toUserId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'initiating' | 'ringing' | 'connected' | 'ended' | 'rejected';
}

export class WebRTCService extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private currentUserId: string | null = null;
  private remoteUserId: string | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onCallEndCallback: (() => void) | null = null;
  private isInitiator = false;
  private isEnding = false;
  private callStartTime: Date | null = null;
  private callDurationInterval: NodeJS.Timeout | null = null;
  private currentCall: Call | null = null;

  // Enhanced audio constraints for better quality
  private readonly audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100
  };

  // ICE servers for NAT traversal
  private readonly iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  constructor() {
    super();
  }

  // Initialize the service with user ID
  initialize(userId: string): void {
    this.currentUserId = userId;
    console.log('WebRTC Service initialized for user:', userId);
  }

  // Get current call state
  getCallState(): CallState {
    return {
      isInCall: this.currentCall !== null,
      callType: this.currentCall?.type || null,
      localStream: this.localStream,
      remoteStream: this.remoteStream,
      connectionStatus: this.getConnectionStatus(),
      isAudioEnabled: this.isAudioEnabled(),
      isVideoEnabled: this.isVideoEnabled(),
      isScreenSharing: this.screenStream !== null,
      callDuration: this.getCallDuration(),
      error: null,
      isMuted: !this.isAudioEnabled(),
      isVideoOff: !this.isVideoEnabled(),
      connectionQuality: this.getConnectionQuality(),
      iceConnectionState: this.peerConnection?.iceConnectionState || 'disconnected',
      peerConnectionState: this.peerConnection?.connectionState || 'disconnected'
    };
  }

  // Start a new call
  async initiateCall(
    toUserId: string, 
    callType: 'video' | 'audio',
    onRemoteStream: (stream: MediaStream) => void,
    onCallEnd: () => void
  ): Promise<void> {

    console.log("-------------------init callll");
    
    if (this.isInCall()) {
      throw new Error('Already in a call');
    }

    this.remoteUserId = toUserId;
    this.onRemoteStreamCallback = onRemoteStream;
    this.onCallEndCallback = onCallEnd;
    this.isInitiator = true;

    // Create call object
    this.currentCall = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: callType,
      fromUserId: this.currentUserId!,
      toUserId,
      startTime: new Date(),
      status: 'initiating'
    };

    try {
      // Get user media
      await this.getUserMedia(callType === 'video');
      
      // Create peer connection
      this.createPeerConnection();
      
      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Emit call initiated event
      this.emit('call_initiated', {
        callId: this.currentCall.id,
        toUserId,
        offer,
        callType
      });

      this.currentCall.status = 'ringing';
      this.emit('call_state_changed', this.getCallState());

    } catch (error: any) {
      console.error('Failed to initiate call:', error);
      this.cleanup();
      throw error;
    }
  }

  // Accept an incoming call
  async acceptCall(
    callId: string,
    fromUserId: string,
    offer: RTCSessionDescriptionInit,
    callType: 'video' | 'audio',
    onRemoteStream: (stream: MediaStream) => void,
    onCallEnd: () => void
  ): Promise<void> {
    if (this.isInCall()) {
      throw new Error('Already in a call');
    }

    this.remoteUserId = fromUserId;
    this.onRemoteStreamCallback = onRemoteStream;
    this.onCallEndCallback = onCallEnd;
    this.isInitiator = false;

    // Create call object
    this.currentCall = {
      id: callId,
      type: callType,
      fromUserId,
      toUserId: this.currentUserId!,
      startTime: new Date(),
      status: 'connected'
    };

    try {
      // Get user media
      await this.getUserMedia(callType === 'video');
      
      // Create peer connection
      this.createPeerConnection();
      
      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Set remote description
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

      // Create and send answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Emit call accepted event
      this.emit('call_accepted', {
        callId,
        fromUserId,
        answer
      });

      this.startCallTimer();
      this.emit('call_state_changed', this.getCallState());

    } catch (error: any) {
      console.error('Failed to accept call:', error);
      this.cleanup();
      throw error;
    }
  }

  // Reject an incoming call
  rejectCall(callId: string, fromUserId: string): void {
    this.emit('call_rejected', {
      callId,
      fromUserId
    });
  }

  // End the current call
  endCall(): void {
    if (this.isEnding || !this.isInCall()) {
      return;
    }

    this.isEnding = true;

    // Calculate call duration
    if (this.currentCall && this.callStartTime) {
      this.currentCall.endTime = new Date();
      this.currentCall.duration = Math.floor((this.currentCall.endTime.getTime() - this.callStartTime.getTime()) / 1000);
    }

    // Emit call ended event
    if (this.currentCall) {
      this.emit('call_ended', {
        callId: this.currentCall.id,
        duration: this.currentCall.duration,
        callType: this.currentCall.type
      });
    }

    this.cleanup();
  }

  // Toggle audio mute/unmute
  toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      
      // Notify other participant
      this.emit('audio_toggled', {
        enabled: audioTrack.enabled,
        userId: this.currentUserId
      });

      this.emit('call_state_changed', this.getCallState());
      return audioTrack.enabled;
    }
    return false;
  }

  // Toggle video on/off
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      
      // Notify other participant
      this.emit('video_toggled', {
        enabled: videoTrack.enabled,
        userId: this.currentUserId
      });

      this.emit('call_state_changed', this.getCallState());
      return videoTrack.enabled;
    }
    return false;
  }

  // Start screen sharing
  async startScreenShare(): Promise<void> {
    if (!this.peerConnection || !this.isInCall()) {
      throw new Error('No active call');
    }

    try {
      // Get screen share stream
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      // Replace video track in peer connection
      const videoTrack = this.screenStream.getVideoTracks()[0];
      const sender = this.peerConnection.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      this.emit('screen_share_started', {
        userId: this.currentUserId
      });

      this.emit('call_state_changed', this.getCallState());

    } catch (error: any) {
      console.error('Failed to start screen share:', error);
      throw error;
    }
  }

  // Stop screen sharing
  async stopScreenShare(): Promise<void> {
    if (!this.screenStream || !this.peerConnection) return;

    try {
      // Stop screen share tracks
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;

      // Restore camera video track
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }

      this.emit('screen_share_stopped', {
        userId: this.currentUserId
      });

      this.emit('call_state_changed', this.getCallState());

    } catch (error: any) {
      console.error('Failed to stop screen share:', error);
    }
  }

  // Handle incoming call answer
  async handleCallAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      
      if (this.currentCall) {
        this.currentCall.status = 'connected';
        this.startCallTimer();
        this.emit('call_state_changed', this.getCallState());
      }
    } catch (error: any) {
      console.error('Failed to handle call answer:', error);
    }
  }

  // Handle incoming ICE candidate
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error: any) {
      console.error('Failed to handle ICE candidate:', error);
    }
  }

  // Private methods

  private async getUserMedia(includeVideo: boolean): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: this.audioConstraints,
        video: includeVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('User media obtained:', this.localStream);
    } catch (error: any) {
      console.error('Failed to get user media:', error);
      throw new Error(`Failed to access camera/microphone: ${error.message}`);
    }
  }

  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(this.iceServers);

    // Setup enhanced connection state handlers
    this.setupConnectionStateHandlers();

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('ice_candidate', {
          candidate: event.candidate,
          toUserId: this.remoteUserId
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Remote stream received:', event.streams[0]);
      this.remoteStream = event.streams[0];
      
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state changed:', state);
      
      if (state === 'failed' || state === 'disconnected') {
        this.emit('connection_failed');
        this.cleanup();
      } else if (state === 'connected') {
        this.emit('connection_established');
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('ICE connection state changed:', state);
      
      if (state === 'failed') {
        this.emit('connection_failed');
        this.cleanup();
      }
    };
  }

  private startCallTimer(): void {
    this.callStartTime = new Date();
    this.callDurationInterval = setInterval(() => {
      this.emit('call_state_changed', this.getCallState());
    }, 1000);
  }

  private getCallDuration(): number {
    if (!this.callStartTime) return 0;
    return Math.floor((Date.now() - this.callStartTime.getTime()) / 1000);
  }

  private isInCall(): boolean {
    return this.currentCall !== null && this.currentCall.status !== 'ended';
  }

  private getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'failed' {
    if (!this.peerConnection) return 'disconnected';
    
    const state = this.peerConnection.connectionState;
    switch (state) {
      case 'new':
      case 'connecting':
        return 'connecting';
      case 'connected':
        return 'connected';
      case 'failed':
      case 'disconnected':
      case 'closed':
        return 'failed';
      default:
        return 'disconnected';
    }
  }

  private isAudioEnabled(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? audioTrack.enabled : false;
  }

  private isVideoEnabled(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    return videoTrack ? videoTrack.enabled : false;
  }

  private cleanup(): void {
    // Stop call timer
    if (this.callDurationInterval) {
      clearInterval(this.callDurationInterval);
      this.callDurationInterval = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Stop screen share stream
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    // Reset state
    this.remoteStream = null;
    this.remoteUserId = null;
    this.onRemoteStreamCallback = null;
    this.onCallEndCallback = null;
    this.isInitiator = false;
    this.isEnding = false;
    this.callStartTime = null;

    // Update call status
    if (this.currentCall) {
      this.currentCall.status = 'ended';
    }

    // Emit final state change
    this.emit('call_state_changed', this.getCallState());

    // Call end callback
    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }

    // Reset current call
    this.currentCall = null;
  }

  // Get connection quality based on ICE connection state
  private getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!this.peerConnection) return 'poor';
    
    const iceState = this.peerConnection.iceConnectionState;
    const connectionState = this.peerConnection.connectionState;
    
    if (iceState === 'connected' && connectionState === 'connected') {
      return 'excellent';
    } else if (iceState === 'completed' && connectionState === 'connected') {
      return 'good';
    } else if (iceState === 'checking' || connectionState === 'connecting') {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  // Enhanced connection state management with reconnection logic
  private setupConnectionStateHandlers(): void {
    if (!this.peerConnection) return;

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('ICE Connection State:', state);
      
      if (state === 'failed' || state === 'disconnected') {
        console.log('Connection failed or disconnected, attempting reconnection...');
        this.emit('call_state_changed', this.getCallState());
        
        // Attempt reconnection for failed connections
        if (state === 'failed' && !this.isEnding) {
          setTimeout(() => {
            if (this.peerConnection && this.peerConnection.iceConnectionState === 'failed') {
              console.log('Attempting to restart ICE...');
              this.peerConnection.restartIce();
            }
          }, 2000);
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Peer Connection State:', state);
      
      if (state === 'failed') {
        console.log('Peer connection failed');
        this.emit('call_state_changed', this.getCallState());
      } else if (state === 'connected') {
        console.log('Peer connection established');
        this.emit('call_state_changed', this.getCallState());
      }
    };
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();