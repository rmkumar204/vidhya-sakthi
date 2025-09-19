import { webSocketService } from './WebSocketService';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

const defaultConfig: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentUserId: string | null = null;
  private remoteUserId: string | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onCallEndCallback: (() => void) | null = null;
  private isEnding = false; // Flag to prevent multiple end operations

  constructor(private config: WebRTCConfig = defaultConfig) {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    webSocketService.on('call_offer', this.handleCallOffer.bind(this));
    webSocketService.on('call_answer', this.handleCallAnswer.bind(this));
    webSocketService.on('call_ice_candidate', this.handleIceCandidate.bind(this));
    webSocketService.on('call_end', this.handleCallEnd.bind(this));
  }

  async initializeCall(userId: string, remoteUserId: string, callType: 'video' | 'audio'): Promise<MediaStream> {
    // Prevent duplicate calls
    if (this.localStream || this.peerConnection) {
      console.log('⚠️ Call already in progress, skipping initialization');
      throw new Error('Call already in progress');
    }

    this.currentUserId = userId;
    this.remoteUserId = remoteUserId;

    try {
      console.log(`🎤 Initializing ${callType} call from ${userId} to ${remoteUserId}`);
      
      // First, ensure any existing streams are properly cleaned up
      await this.cleanupExistingStreams();
      
      // Wait a bit to ensure device is released
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get user media with enhanced audio constraints
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      console.log('🎵 Local stream obtained:', {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length
      });
      
      // Create peer connection
      this.createPeerConnection();
      
      // Add local stream to peer connection
        this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          console.log(`➕ Adding ${track.kind} track to peer connection`);
          this.peerConnection.addTrack(track, this.localStream);
        }
        });

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      console.log('📤 Sending call offer to', remoteUserId);
      webSocketService.sendCallOffer(remoteUserId, offer, callType);

      return this.localStream;
    } catch (error) {
      console.error('❌ Error initializing call:', error);
      
      // Handle specific device in use error
      if (error instanceof Error && (error.name === 'NotReadableError' || error.name === 'NotAllowedError')) {
        console.log('🔄 Device access error during call initialization, attempting recovery...');
        await this.cleanupExistingStreams();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          // Retry with a delay
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: callType === 'video',
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100
            }
          });
          
          console.log('✅ Device access recovered on retry for call initialization');
          
          // Continue with call setup
          this.createPeerConnection();
          this.localStream.getTracks().forEach(track => {
            if (this.peerConnection && this.localStream) {
              console.log(`➕ Adding ${track.kind} track to peer connection`);
              this.peerConnection.addTrack(track, this.localStream);
            }
          });

          const offer = await this.peerConnection!.createOffer();
          await this.peerConnection!.setLocalDescription(offer);

          console.log('📤 Sending call offer to', remoteUserId);
          webSocketService.sendCallOffer(remoteUserId, offer, callType);

          return this.localStream;
        } catch (retryError) {
          console.error('❌ Device access still failed after retry:', retryError);
          this.endCall();
          throw new Error('Camera/microphone is currently in use by another application. Please close other applications using your camera/microphone and try again.');
        }
      }
      
      // Clean up on error
      this.endCall();
      throw error;
    }
  }

  async answerCall(userId: string, remoteUserId: string, callType: 'video' | 'audio' = 'video'): Promise<MediaStream> {
    this.currentUserId = userId;
    this.remoteUserId = remoteUserId;

    try {
      console.log(`📞 Answering ${callType} call from ${remoteUserId}`);
      
      // First, ensure any existing streams are properly cleaned up
      await this.cleanupExistingStreams();
      
      // Wait a bit to ensure device is released
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get user media with enhanced audio constraints based on call type
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      console.log('🎵 Local stream for answer obtained:', {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length
      });

      return this.localStream;
    } catch (error) {
      console.error('❌ Error answering call:', error);
      
      // Handle specific device in use error
      if (error instanceof Error && (error.name === 'NotReadableError' || error.name === 'NotAllowedError')) {
        console.log('🔄 Device access error, attempting recovery...');
        await this.cleanupExistingStreams();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          // Retry with a delay
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: callType === 'video',
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100
            }
          });
          
          console.log('✅ Device access recovered on retry');
          return this.localStream;
        } catch (retryError) {
          console.error('❌ Device access still failed after retry:', retryError);
          this.endCall();
          throw new Error('Camera/microphone is currently in use by another application. Please close other applications using your camera/microphone and try again.');
        }
      }
      
      // Clean up on error
      this.endCall();
      throw error;
    }
  }

  private async cleanupExistingStreams(): Promise<void> {
    console.log('🧹 Cleaning up existing streams...');
    
    // Stop any existing local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`✋ Stopped existing ${track.kind} track`);
      });
      this.localStream = null;
    }
    
    // Stop any existing remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log(`✋ Stopped existing remote ${track.kind} track`);
      });
      this.remoteStream = null;
    }
    
    // Close any existing peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    console.log('✅ Existing streams cleaned up');
  }

  async checkDeviceAvailability(callType: 'video' | 'audio'): Promise<{ available: boolean; error?: string }> {
    try {
      console.log(`🔍 Checking device availability for ${callType} call...`);
      
      // Get a temporary stream to test device availability
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      
      // Immediately stop the test stream
      testStream.getTracks().forEach(track => track.stop());
      
      console.log('✅ Devices are available');
      return { available: true };
    } catch (error) {
      console.error('❌ Device availability check failed:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'NotReadableError') {
          errorMessage = 'Camera/microphone is currently in use by another application';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera/microphone access was denied';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera/microphone found on this device';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera/microphone constraints cannot be satisfied';
        }
      }
      
      return { available: false, error: errorMessage };
    }
  }

  private createPeerConnection() {
    console.log('🔗 Creating peer connection with config:', this.config);
    this.peerConnection = new RTCPeerConnection(this.config);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.remoteUserId) {
        console.log('🧨 Sending ICE candidate to', this.remoteUserId);
        webSocketService.sendIceCandidate(this.remoteUserId, event.candidate);
      } else if (!event.candidate) {
        console.log('✅ ICE gathering complete');
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📡 Received remote track:', event.track.kind);
      this.remoteStream = event.streams[0];
      
      console.log('🎵 Remote stream details:', {
        audioTracks: this.remoteStream.getAudioTracks().length,
        videoTracks: this.remoteStream.getVideoTracks().length
      });
      
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log('🔗 Connection state:', this.peerConnection.connectionState);
        if (this.peerConnection.connectionState === 'failed') {
          console.log('❌ Connection failed - ending call');
          this.endCall();
        } else if (this.peerConnection.connectionState === 'disconnected') {
          console.log('⚠️ Connection disconnected - giving some time to reconnect');
          setTimeout(() => {
            if (this.peerConnection && this.peerConnection.connectionState === 'disconnected') {
              console.log('⏰ Still disconnected after timeout - ending call');
              this.endCall();
            }
          }, 5000); // Give 5 seconds for reconnection
        } else if (this.peerConnection.connectionState === 'connected') {
          console.log('✅ WebRTC connection established successfully');
        }
      }
    };

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log('🧨 ICE connection state:', this.peerConnection.iceConnectionState);
      }
    };
  }

  private async handleCallOffer(data: any) {
    try {
      // Extract the actual offer and callType from the payload
      const offer = data.offer || data.payload?.offer;
      const callType = data.callType || data.payload?.callType;
      const fromUserId = data.fromUserId || data.payload?.fromUserId;
      
      console.log('📞 Handling call offer for', callType, 'call from', fromUserId);
      
      if (!offer || !callType) {
        console.error('❌ Invalid call offer data:', data);
        return;
      }
      
      // Store the remote user ID for sending answers
      if (fromUserId) {
        this.remoteUserId = fromUserId;
      }
      
      if (!this.peerConnection) {
        this.createPeerConnection();
      }

      await this.peerConnection!.setRemoteDescription(offer);

      // Add local stream if we have it
      if (this.localStream) {
        console.log('➕ Adding local stream tracks to peer connection');
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            console.log(`➕ Adding ${track.kind} track`);
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      // Create and send answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      
      if (this.remoteUserId) {
        console.log('📤 Sending call answer to', this.remoteUserId);
        webSocketService.sendCallAnswer(this.remoteUserId, answer);
      }
    } catch (error) {
      console.error('❌ Error handling call offer:', error);
      // Clean up on error
      this.endCall();
    }
  }

  private async handleCallAnswer(data: any) {
    try {
      // Extract the actual answer from the payload
      const answer = data.answer || data.payload?.answer;
      
      if (!answer) {
        console.error('❌ Invalid call answer data:', data);
        return;
      }
      
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('Error handling call answer:', error);
    }
  }

  private async handleIceCandidate(data: any) {
    try {
      // Extract the actual candidate from the payload
      const candidate = data.candidate || data.payload?.candidate;
      
      if (!candidate) {
        console.error('❌ Invalid ICE candidate data:', data);
        return;
      }
      
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  private handleCallEnd(data: any) {
    console.log('🔴 ❗ WebRTCService: Received call_end signal from WebSocket:', data);
    console.log('🔄 WebRTCService: Processing call end - will trigger cleanup only');
    
    // Validate that this is actually a call_end message
    if (!data && typeof data !== 'object') {
      console.warn('⚠️ Invalid call_end data received:', data);
    }
    
    // Don't send notification back - this is from remote user
    console.log('🧠 WebRTCService: Call end received from remote, performing silent cleanup');
    this.cleanup();
    
    console.log('✅ WebRTCService: Call end processing complete');
  }

  endCall() {
    if (this.isEnding) {
      console.log('⚠️ Call end already in progress, ignoring duplicate call');
      return;
    }
    
    this.isEnding = true;
    console.log('🛑 WebRTCService: Ending call - cleaning up resources');
    
    // Prevent multiple simultaneous end calls
    if (!this.localStream && !this.peerConnection && !this.remoteUserId) {
      console.log('⚠️ Call already ended, skipping cleanup');
      this.isEnding = false;
      return;
    }
    
    // Store remoteUserId before clearing it
    const remoteUserToNotify = this.remoteUserId;
    
    // Stop local stream
    if (this.localStream) {
      console.log('🎵 Stopping local stream tracks:', {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length
      });
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`✋ Stopped ${track.kind} track`);
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      console.log('🔗 Closing peer connection');
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Reset state FIRST to prevent recursion
    this.remoteStream = null;
    this.remoteUserId = null;
    this.currentUserId = null;

    console.log('✅ WebRTCService: Call cleanup complete');

    // Notify remote user about call end ONLY if we haven't already sent it
    // AND only if this was initiated by user action (not WebSocket message)
    if (remoteUserToNotify && webSocketService.isConnected()) {
      console.log('📤 Notifying remote user about call end:', remoteUserToNotify);
      webSocketService.sendCallEnd(remoteUserToNotify);
    }

    // Call end callback ONLY if not in cleanup mode
    if (this.onCallEndCallback) {
      console.log('📞 Calling end callback');
      // Clear the callback to prevent multiple calls
      const callback = this.onCallEndCallback;
      this.onCallEndCallback = null;
      // Use setTimeout to prevent immediate recursion
      setTimeout(() => {
        callback();
      }, 0);
    }
    
    // Reset the ending flag after a short delay
    setTimeout(() => {
      this.isEnding = false;
    }, 100);
  }

  toggleAudio(enabled: boolean) {
    console.log(`🎤 Toggling audio: ${enabled ? 'ON' : 'OFF'}`);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
        console.log(`Audio track enabled: ${track.enabled}`);
      });
      
      // Notify the remote user about mute status
      if (this.remoteUserId && webSocketService.isConnected()) {
        console.log(`📢 Notifying ${this.remoteUserId} about mute status: ${!enabled}`);
        webSocketService.sendMuteStatus(this.remoteUserId, !enabled, this.currentUserId || '');
      }
    }
  }

  toggleVideo(enabled: boolean) {
    console.log(`📹 Toggling video: ${enabled ? 'ON' : 'OFF'}`);
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
        console.log(`Video track enabled: ${track.enabled}`);
      });
      
      // Notify the remote user about video status
      if (this.remoteUserId && webSocketService.isConnected()) {
        console.log(`📢 Notifying ${this.remoteUserId} about video status: ${enabled}`);
        webSocketService.sendVideoStatus(this.remoteUserId, !enabled, this.currentUserId || '');
      }
    }
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onCallEnd(callback: () => void) {
    // Clear any existing callback to prevent multiple registrations
    this.onCallEndCallback = null;
    this.onCallEndCallback = callback;
    console.log('📁 WebRTC: Call end callback registered');
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  cleanup() {
    if (this.isEnding) {
      console.log('⚠️ Cleanup already in progress, ignoring duplicate call');
      return;
    }
    
    this.isEnding = true;
    console.log('🧹 WebRTCService: Silent cleanup called - no callbacks triggered');
    
    // Stop local stream
    if (this.localStream) {
      console.log('🎵 Stopping local stream tracks:', {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length
      });
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`✋ Stopped ${track.kind} track`);
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      console.log('🔗 Closing peer connection');
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Reset state without triggering callbacks
    this.remoteStream = null;
    this.remoteUserId = null;
    this.currentUserId = null;

    console.log('✅ WebRTCService: Silent cleanup complete');
    
    // Reset the ending flag after a short delay
    setTimeout(() => {
      this.isEnding = false;
    }, 100);
  }
}

// Singleton instance
export const webRTCService = new WebRTCService();
