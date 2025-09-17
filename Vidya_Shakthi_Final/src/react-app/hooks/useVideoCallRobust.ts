import { useState, useRef, useCallback, useEffect } from 'react';
import { CallState } from '../types';
import { MEDIA_CONSTRAINTS } from '../utils/constants';
import { getUserMedia, getDisplayMedia, stopMediaStream } from '../utils/webrtc';
import { performGlobalMediaCleanup } from '../utils/mediaCleanup';

export const useVideoCallRobust = () => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    callType: null,
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    connectionStatus: 'disconnected',
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    callDuration: 0,
    error: null,
  });

  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    callId: string;
    callType: 'audio' | 'video';
    roomId?: string;
  } | null>(null);

  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connecting' | 'connected' | 'ended'>('idle');

  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update call duration
  useEffect(() => {
    if (callState.isInCall && callStartTimeRef.current) {
      callDurationIntervalRef.current = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTimeRef.current!.getTime()) / 1000);
        setCallState(prev => ({ ...prev, callDuration: duration }));
      }, 1000);
    } else {
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
        callDurationIntervalRef.current = null;
      }
    }

    return () => {
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
    };
  }, [callState.isInCall]);

  const startAudioCall = useCallback(async (participantIds: string[]) => {
    try {
      console.log('Starting robust audio call with participants:', participantIds);
      
      setCallState(prev => ({ 
        ...prev, 
        connectionStatus: 'connecting',
        error: null 
      }));
      setCallStatus('connecting');

      const stream = await getUserMedia(MEDIA_CONSTRAINTS.AUDIO_ONLY);
      localStreamRef.current = stream;

      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: 'audio',
        participants: participantIds,
        localStream: stream,
        connectionStatus: 'connected',
        isAudioEnabled: true,
        isVideoEnabled: false,
      }));

      callStartTimeRef.current = new Date();
      setCallStatus('connected');
      console.log('Robust audio call started successfully');

    } catch (error: any) {
      console.error('Error starting robust audio call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to start audio call'
      }));
      setCallStatus('ended');
    }
  }, []);

  const startVideoCall = useCallback(async (participantIds: string[]) => {
    try {
      console.log('Starting robust video call with participants:', participantIds);
      
      setCallState(prev => ({ 
        ...prev, 
        connectionStatus: 'connecting',
        error: null 
      }));
      setCallStatus('connecting');

      const stream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
      localStreamRef.current = stream;

      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: 'video',
        participants: participantIds,
        localStream: stream,
        remoteStreams: new Map([['robust-remote', stream]]), // Simulate remote stream
        connectionStatus: 'connected',
        isAudioEnabled: true,
        isVideoEnabled: true,
      }));

      callStartTimeRef.current = new Date();
      setCallStatus('connected');
      console.log('Robust video call started successfully');

    } catch (error: any) {
      console.error('Error starting robust video call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to start video call'
      }));
      setCallStatus('ended');
    }
  }, []);

  const acceptCall = useCallback(async (callId: string, callType: 'audio' | 'video') => {
    console.log(`Accepting robust call: ${callId}, type: ${callType}`);
    setIncomingCall(null);
    setCallStatus('connecting');

    try {
      const constraints = callType === 'audio' ? MEDIA_CONSTRAINTS.AUDIO_ONLY : MEDIA_CONSTRAINTS.VIDEO_CALL;
      const stream = await getUserMedia(constraints);
      localStreamRef.current = stream;

      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: callType,
        participants: ['robust-caller', 'current-user'],
        localStream: stream,
        remoteStreams: new Map([['robust-caller', stream]]), // Simulate remote stream
        connectionStatus: 'connected',
        isAudioEnabled: true,
        isVideoEnabled: callType === 'video',
      }));

      callStartTimeRef.current = new Date();
      setCallStatus('connected');
      console.log('Robust call accepted successfully');

    } catch (error: any) {
      console.error('Error accepting robust call:', error);
      setCallState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: error.message || 'Failed to accept call'
      }));
      setCallStatus('ended');
    }
  }, []);

  const rejectCall = useCallback((callId: string) => {
    console.log(`Rejecting robust call: ${callId}`);
    setIncomingCall(null);
    setCallStatus('idle');
    setCallState(prev => ({ ...prev, error: 'Call rejected' }));
  }, []);

  const endCall = useCallback(() => {
    console.log('Ending robust call and cleaning up...');
    
    // Stop local stream
    if (localStreamRef.current) {
      console.log('Stopping local stream...');
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
    }

    // Reset state
    setCallState({
      isInCall: false,
      callType: null,
      participants: [],
      localStream: null,
      remoteStreams: new Map(),
      connectionStatus: 'disconnected',
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false,
      callDuration: 0,
      error: null,
    });

    setCallStatus('idle');
    setIncomingCall(null);
    callStartTimeRef.current = null;
    
    console.log('Robust call ended');
  }, []);

  const forceCleanup = useCallback(async () => {
    console.log('Force cleanup called in robust hook...');
    await performGlobalMediaCleanup();
    endCall();
  }, [endCall]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
        console.log('Robust audio toggled:', audioTrack.enabled ? 'ON' : 'OFF');
      }
    }
  }, []);

  // ROBUST VIDEO TOGGLE - Always creates fresh stream when turning on
  const toggleVideo = useCallback(async () => {
    console.log('Robust toggleVideo called, current state:', {
      hasStream: !!localStreamRef.current,
      isVideoEnabled: callState.isVideoEnabled,
      videoTrack: localStreamRef.current?.getVideoTracks()[0] ? {
        enabled: localStreamRef.current.getVideoTracks()[0].enabled,
        readyState: localStreamRef.current.getVideoTracks()[0].readyState
      } : null
    });

    if (callState.isVideoEnabled) {
      // Currently showing video - turn it off
      console.log('Turning video OFF...');
      
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
        }
      }
      
      setCallState(prev => ({ ...prev, isVideoEnabled: false }));
      console.log('Video turned OFF');
      
    } else {
      // Currently not showing video - turn it on with fresh stream
      console.log('Turning video ON with fresh stream...');
      
      try {
        // Always get a fresh video stream when turning on
        const freshStream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
        
        // If we have an existing stream with audio, preserve the audio track
        if (localStreamRef.current) {
          const existingAudioTrack = localStreamRef.current.getAudioTracks()[0];
          if (existingAudioTrack && existingAudioTrack.readyState === 'live') {
            console.log('Preserving existing audio track');
            // Stop the old stream
            stopMediaStream(localStreamRef.current);
            // Add the audio track to the new stream
            freshStream.addTrack(existingAudioTrack);
          } else {
            console.log('No existing audio track to preserve, stopping old stream');
            stopMediaStream(localStreamRef.current);
          }
        }
        
        // Set the new stream
        localStreamRef.current = freshStream;
        setCallState(prev => ({ 
          ...prev, 
          localStream: freshStream,
          isVideoEnabled: true 
        }));
        
        console.log('Video turned ON with fresh stream');
        
      } catch (error: any) {
        console.error('Failed to turn on video with fresh stream:', error);
        setCallState(prev => ({ 
          ...prev, 
          error: 'Failed to turn on video. Please check camera permissions.' 
        }));
      }
    }
  }, [callState.isVideoEnabled]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (callState.isScreenSharing) {
        console.log('Stopping robust screen share...');
        
        // Stop current screen share stream
        if (localStreamRef.current) {
          stopMediaStream(localStreamRef.current);
        }
        
        // Get fresh camera stream
        const stream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
        localStreamRef.current = stream;
        
        setCallState(prev => ({
          ...prev,
          localStream: stream,
          isScreenSharing: false,
          isVideoEnabled: true,
        }));
        
        console.log('Robust screen share stopped, camera resumed');
        
      } else {
        console.log('Starting robust screen share...');
        
        // Stop current camera stream if active
        if (localStreamRef.current) {
          stopMediaStream(localStreamRef.current);
        }
        
        const screenStream = await getDisplayMedia(MEDIA_CONSTRAINTS.SCREEN_SHARE);
        localStreamRef.current = screenStream;
        
        setCallState(prev => ({
          ...prev,
          localStream: screenStream,
          isScreenSharing: true,
          isVideoEnabled: false, // Video is off during screen share
        }));
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          console.log('Robust screen share ended by user');
          toggleScreenShare(); // Call itself to revert to camera
        };
        
        console.log('Robust screen share started');
      }
    } catch (error: any) {
      console.error('Error toggling robust screen share:', error);
      setCallState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to toggle screen share' 
      }));
    }
  }, [callState.isScreenSharing]);

  return {
    callState,
    incomingCall,
    callStatus,
    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    forceCleanup,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  };
};
