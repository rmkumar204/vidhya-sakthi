import { audioCallService, AudioCallError, AUDIO_CALL_ERRORS } from '../services/AudioCallService';
import { webSocketService } from '../services/WebSocketService';

// Mock WebSocket service
jest.mock('../services/WebSocketService', () => ({
  webSocketService: {
    on: jest.fn(),
    off: jest.fn(),
    sendCallOffer: jest.fn(),
    sendCallAnswer: jest.fn(),
    sendCallEnd: jest.fn(),
    sendMessage: jest.fn(),
    sendIceCandidate: jest.fn()
  }
}));

// Mock WebRTC APIs
const mockGetUserMedia = jest.fn();
const mockRTCPeerConnection = jest.fn();
const mockAudioContext = jest.fn();

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia
  }
});

// Mock RTCPeerConnection
Object.defineProperty(window, 'RTCPeerConnection', {
  writable: true,
  value: mockRTCPeerConnection
});

// Mock AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: mockAudioContext
});

// Mock MediaStream
const mockMediaStream = {
  getTracks: jest.fn(() => [
    {
      kind: 'audio',
      enabled: true,
      stop: jest.fn(),
      label: 'mock-audio-track'
    }
  ]),
  getAudioTracks: jest.fn(() => [
    {
      kind: 'audio',
      enabled: true,
      stop: jest.fn(),
      label: 'mock-audio-track'
    }
  ])
};

describe('AudioCallService', () => {
  let mockPeerConnection: any;
  let mockAudioContextInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset service state
    audioCallService.destroy();
    
    // Mock peer connection
    mockPeerConnection = {
      addTrack: jest.fn(),
      createOffer: jest.fn(),
      setLocalDescription: jest.fn(),
      setRemoteDescription: jest.fn(),
      createAnswer: jest.fn(),
      addIceCandidate: jest.fn(),
      close: jest.fn(),
      getStats: jest.fn(),
      getSenders: jest.fn(() => []),
      connectionState: 'new',
      iceConnectionState: 'new',
      ontrack: null,
      onicecandidate: null,
      onconnectionstatechange: null
    };
    
    mockRTCPeerConnection.mockImplementation(() => mockPeerConnection);
    
    // Mock audio context
    mockAudioContextInstance = {
      createMediaStreamSource: jest.fn(),
      close: jest.fn(),
      audioWorklet: {
        addModule: jest.fn()
      }
    };
    
    mockAudioContext.mockImplementation(() => mockAudioContextInstance);
    
    // Mock getUserMedia
    mockGetUserMedia.mockResolvedValue(mockMediaStream);
    
    // Mock secure context
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      value: true
    });
    
    // Mock WebRTC support
    Object.defineProperty(window, 'RTCSessionDescription', {
      writable: true,
      value: jest.fn()
    });
    
    Object.defineProperty(window, 'RTCIceCandidate', {
      writable: true,
      value: jest.fn()
    });
  });

  afterEach(() => {
    audioCallService.destroy();
  });

  describe('Initialization', () => {
    test('should initialize with user ID', async () => {
      await audioCallService.initialize('user123');
      expect(audioCallService.getCurrentCall()).toBeNull();
      expect(audioCallService.isInCall()).toBe(false);
    });
  });

  describe('Call Initiation', () => {
    beforeEach(async () => {
      await audioCallService.initialize('user123');
    });

    test('should initiate audio call successfully', async () => {
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

      const call = await audioCallService.initiateAudioCall('user456');

      expect(call).toBeDefined();
      expect(call.id).toMatch(/^audio-call-\d+-/);
      expect(call.status).toBe('ringing');
      expect(call.participants.caller).toBe('user123');
      expect(call.participants.callee).toBe('user456');
      expect(call.isAudioEnabled).toBe(true);
      expect(webSocketService.sendCallOffer).toHaveBeenCalledWith('user456', mockOffer, 'audio');
    });

    test('should throw error if already in a call', async () => {
      // Start first call
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);
      
      await audioCallService.initiateAudioCall('user456');

      // Try to start second call
      await expect(audioCallService.initiateAudioCall('user789'))
        .rejects.toThrow(AudioCallError);
    });

    test('should handle getUserMedia errors', async () => {
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(error);

      await expect(audioCallService.initiateAudioCall('user456'))
        .rejects.toThrow(AudioCallError);
    });

    test('should handle WebRTC not supported', async () => {
      // Remove WebRTC support
      Object.defineProperty(window, 'RTCPeerConnection', {
        writable: true,
        value: undefined
      });

      await expect(audioCallService.initiateAudioCall('user456'))
        .rejects.toThrow(AudioCallError);
    });

    test('should handle non-secure context', async () => {
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: false
      });

      await expect(audioCallService.initiateAudioCall('user456'))
        .rejects.toThrow(AudioCallError);
    });
  });

  describe('Call Acceptance', () => {
    beforeEach(async () => {
      await audioCallService.initialize('user123');
    });

    test('should accept audio call successfully', async () => {
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      const mockAnswer = { type: 'answer', sdp: 'mock-answer-sdp' };
      
      mockPeerConnection.setRemoteDescription.mockResolvedValue(undefined);
      mockPeerConnection.createAnswer.mockResolvedValue(mockAnswer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);

      const call = await audioCallService.acceptAudioCall('call123', 'user456', mockOffer);

      expect(call).toBeDefined();
      expect(call.id).toBe('call123');
      expect(call.status).toBe('connected');
      expect(call.participants.caller).toBe('user456');
      expect(call.participants.callee).toBe('user123');
      expect(webSocketService.sendCallAnswer).toHaveBeenCalledWith('user456', mockAnswer);
    });

    test('should throw error if already in a call', async () => {
      // Start first call
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);
      
      await audioCallService.initiateAudioCall('user456');

      // Try to accept another call
      await expect(audioCallService.acceptAudioCall('call123', 'user789', mockOffer))
        .rejects.toThrow(AudioCallError);
    });
  });

  describe('Call Rejection', () => {
    beforeEach(async () => {
      await audioCallService.initialize('user123');
    });

    test('should reject call successfully', async () => {
      await audioCallService.rejectAudioCall('call123', 'user456');
      expect(webSocketService.sendMessage).toHaveBeenCalledWith('call_reject', { callId: 'call123' }, 'user456');
    });
  });

  describe('Call Ending', () => {
    beforeEach(async () => {
      await audioCallService.initialize('user123');
    });

    test('should end call successfully', async () => {
      // Start a call first
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);
      
      await audioCallService.initiateAudioCall('user456');

      // End the call
      await audioCallService.endAudioCall();

      expect(webSocketService.sendCallEnd).toHaveBeenCalledWith('user456', expect.any(String));
      expect(webSocketService.sendMessage).toHaveBeenCalledWith('call_history', expect.any(Object));
      expect(audioCallService.isInCall()).toBe(false);
    });

    test('should handle ending call when not in call', async () => {
      // Should not throw error
      await expect(audioCallService.endAudioCall()).resolves.not.toThrow();
    });
  });

  describe('Audio Controls', () => {
    beforeEach(async () => {
      await audioCallService.initialize('user123');
    });

    test('should toggle audio successfully', async () => {
      // Start a call first
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);
      
      await audioCallService.initiateAudioCall('user456');

      // Toggle audio
      audioCallService.toggleAudio();

      // Verify track was toggled
      const audioTrack = mockMediaStream.getAudioTracks()[0];
      expect(audioTrack.enabled).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await audioCallService.initialize('user123');
    });

    test('should handle permission denied error', async () => {
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(error);

      try {
        await audioCallService.initiateAudioCall('user456');
      } catch (err) {
        expect(err).toBeInstanceOf(AudioCallError);
        expect(err.code).toBe('PERMISSION_DENIED');
        expect(err.recoverable).toBe(true);
        expect(err.userMessage).toBe(AUDIO_CALL_ERRORS.PERMISSION_DENIED.userMessage);
      }
    });

    test('should handle device not found error', async () => {
      const error = new Error('No microphone found');
      error.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(error);

      try {
        await audioCallService.initiateAudioCall('user456');
      } catch (err) {
        expect(err).toBeInstanceOf(AudioCallError);
        expect(err.code).toBe('AUDIO_DEVICE_ERROR');
        expect(err.recoverable).toBe(true);
      }
    });

    test('should handle generic getUserMedia errors', async () => {
      const error = new Error('Generic error');
      mockGetUserMedia.mockRejectedValue(error);

      try {
        await audioCallService.initiateAudioCall('user456');
      } catch (err) {
        expect(err).toBeInstanceOf(AudioCallError);
        expect(err.code).toBe('MICROPHONE_ERROR');
        expect(err.recoverable).toBe(true);
      }
    });
  });

  describe('WebSocket Event Handling', () => {
    beforeEach(async () => {
      await audioCallService.initialize('user123');
    });

    test('should handle incoming call offer', () => {
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      const eventData = {
        callId: 'call123',
        fromUserId: 'user456',
        offer: mockOffer,
        callType: 'audio'
      };

      // Simulate WebSocket event
      const callOfferHandler = webSocketService.on.mock.calls.find(
        call => call[0] === 'call_offer'
      )?.[1];

      expect(callOfferHandler).toBeDefined();
      
      // Test that it emits incoming_call event
      const emitSpy = jest.spyOn(audioCallService, 'emit');
      callOfferHandler(eventData);
      
      expect(emitSpy).toHaveBeenCalledWith('incoming_call', {
        callId: 'call123',
        fromUserId: 'user456',
        offer: mockOffer,
        callType: 'audio'
      });
    });

    test('should handle call answer', async () => {
      // Start a call first
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);
      
      await audioCallService.initiateAudioCall('user456');

      const mockAnswer = { type: 'answer', sdp: 'mock-answer-sdp' };
      const eventData = { answer: mockAnswer };

      // Simulate WebSocket event
      const callAnswerHandler = webSocketService.on.mock.calls.find(
        call => call[0] === 'call_answer'
      )?.[1];

      expect(callAnswerHandler).toBeDefined();
      callAnswerHandler(eventData);
      
      expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith(mockAnswer);
    });

    test('should handle ICE candidate', async () => {
      // Start a call first
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);
      
      await audioCallService.initiateAudioCall('user456');

      const mockCandidate = { candidate: 'mock-candidate', sdpMid: 'audio' };
      const eventData = { candidate: mockCandidate };

      // Simulate WebSocket event
      const iceCandidateHandler = webSocketService.on.mock.calls.find(
        call => call[0] === 'call_ice_candidate'
      )?.[1];

      expect(iceCandidateHandler).toBeDefined();
      iceCandidateHandler(eventData);
      
      expect(mockPeerConnection.addIceCandidate).toHaveBeenCalledWith(mockCandidate);
    });

    test('should handle call end', () => {
      const eventData = { callId: 'call123' };

      // Simulate WebSocket event
      const callEndHandler = webSocketService.on.mock.calls.find(
        call => call[0] === 'call_end'
      )?.[1];

      expect(callEndHandler).toBeDefined();
      
      const emitSpy = jest.spyOn(audioCallService, 'emit');
      callEndHandler(eventData);
      
      expect(emitSpy).toHaveBeenCalledWith('call_ended_by_remote', eventData);
    });

    test('should handle call reject', () => {
      const eventData = { callId: 'call123' };

      // Simulate WebSocket event
      const callRejectHandler = webSocketService.on.mock.calls.find(
        call => call[0] === 'call_reject'
      )?.[1];

      expect(callRejectHandler).toBeDefined();
      
      const emitSpy = jest.spyOn(audioCallService, 'emit');
      callRejectHandler(eventData);
      
      expect(emitSpy).toHaveBeenCalledWith('call_rejected_by_remote', eventData);
    });
  });

  describe('Resource Cleanup', () => {
    beforeEach(async () => {
      await audioCallService.initialize('user123');
    });

    test('should cleanup resources properly', async () => {
      // Start a call first
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);
      
      await audioCallService.initiateAudioCall('user456');

      // Cleanup
      await audioCallService.cleanup();

      expect(mockPeerConnection.close).toHaveBeenCalled();
      expect(mockAudioContextInstance.close).toHaveBeenCalled();
      expect(mockMediaStream.getTracks()[0].stop).toHaveBeenCalled();
      expect(audioCallService.isInCall()).toBe(false);
    });

    test('should handle cleanup when not in call', async () => {
      // Should not throw error
      await expect(audioCallService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await audioCallService.initialize('user123');
    });

    test('should monitor call quality', async () => {
      // Start a call first
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      mockPeerConnection.createOffer.mockResolvedValue(mockOffer);
      mockPeerConnection.setLocalDescription.mockResolvedValue(undefined);
      
      await audioCallService.initiateAudioCall('user456');

      // Mock stats
      const mockStats = new Map([
        ['inbound-rtp', {
          type: 'inbound-rtp',
          mediaType: 'audio',
          packetsLost: 5,
          packetsReceived: 100,
          jitter: 0.01
        }],
        ['candidate-pair', {
          type: 'candidate-pair',
          state: 'succeeded',
          currentRoundTripTime: 0.05
        }]
      ]);

      mockPeerConnection.getStats.mockResolvedValue(mockStats);

      // Simulate stats monitoring
      const emitSpy = jest.spyOn(audioCallService, 'emit');
      
      // Manually trigger stats monitoring
      await audioCallService['monitorCallQuality']();
      
      expect(emitSpy).toHaveBeenCalledWith('quality_update', expect.any(Object));
    });
  });
});
