// WebRTC and Call related types
export interface Call {
  id: string;
  type: 'audio' | 'video';
  participants: string[];
  status: 'initiating' | 'ringing' | 'connected' | 'ended' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  mediaConstraints: MediaStreamConstraints;
}

export interface CallState {
  isInCall: boolean;
  callType: 'audio' | 'video' | null;
  participants: string[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  error: string | null;
}

export interface SignalingMessage {
  type: 'call_initiate' | 'call_accept' | 'call_reject' | 'call_end' | 'ice_candidate' | 'offer' | 'answer';
  from: string;
  to: string;
  data?: any;
  callId?: string;
}

export interface MediaConstraints {
  audio: boolean | MediaTrackConstraints;
  video: boolean | MediaTrackConstraints;
}

// Re-export existing types
export type { User } from '../contexts/AuthContext.types';
export type { UserRole } from '../contexts/AuthContext.types';
