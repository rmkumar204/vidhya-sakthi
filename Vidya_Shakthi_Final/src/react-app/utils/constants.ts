// WebRTC Configuration Constants
export const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
    ],
  },
  // Add TURN servers for production
  // {
  //   urls: 'turn:your-turn-server.com:3478',
  //   username: 'username',
  //   credential: 'password',
  // },
];

// Media Constraints
export const MEDIA_CONSTRAINTS = {
  AUDIO_ONLY: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  } as MediaStreamConstraints,

  VIDEO_CALL: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: {
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
      frameRate: { ideal: 30, min: 15 },
    },
  } as MediaStreamConstraints,

  SCREEN_SHARE: {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
    audio: true,
  } as DisplayMediaStreamConstraints,
};

// WebSocket Events
export const WS_EVENTS = {
  CALL_INITIATE: 'call_initiate',
  CALL_ACCEPT: 'call_accept',
  CALL_REJECT: 'call_reject',
  CALL_END: 'call_end',
  ICE_CANDIDATE: 'ice_candidate',
  OFFER: 'offer',
  ANSWER: 'answer',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
} as const;

// Call Status
export const CALL_STATUS = {
  INITIATING: 'initiating',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ENDED: 'ended',
  FAILED: 'failed',
} as const;

// Connection Status
export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
} as const;
