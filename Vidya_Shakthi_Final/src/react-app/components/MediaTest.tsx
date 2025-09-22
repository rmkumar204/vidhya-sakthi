import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { getUserMedia, checkMediaPermissions, requestMediaPermissions, isWebRTCSupported } from '../utils/webrtc';
import { MEDIA_CONSTRAINTS } from '../utils/constants';
import { logger } from '../utils/logger';

export const MediaTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test');
  const [permissions, setPermissions] = useState<{camera: boolean, microphone: boolean}>({camera: false, microphone: false});
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const checkPermissions = async () => {
    setStatus('Checking permissions...');
    try {
      const perms = await checkMediaPermissions();
      setPermissions(perms);
      setStatus(`Permissions: Camera: ${perms.camera ? 'Granted' : 'Denied'}, Microphone: ${perms.microphone ? 'Granted' : 'Denied'}`);
    } catch (error) {
      setStatus(`Error checking permissions: ${error}`);
    }
  };

  const requestPermissions = async () => {
    setStatus('Requesting permissions...');
    try {
      const granted = await requestMediaPermissions();
      setStatus(granted ? 'Permissions granted!' : 'Permissions denied');
      await checkPermissions();
    } catch (error) {
      setStatus(`Error requesting permissions: ${error}`);
    }
  };

  const testVideoCall = async () => {
    setStatus('Testing video call...');
    try {
      const newStream = await getUserMedia(MEDIA_CONSTRAINTS.VIDEO_CALL);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(logger.error);
      }
      
      setStatus('Video call test successful!');
    } catch (error: any) {
      setStatus(`Video call test failed: ${error.message}`);
    }
  };

  const testAudioCall = async () => {
    setStatus('Testing audio call...');
    try {
      const newStream = await getUserMedia(MEDIA_CONSTRAINTS.AUDIO_ONLY);
      setStream(newStream);
      setStatus('Audio call test successful!');
    } catch (error: any) {
      setStatus(`Audio call test failed: ${error.message}`);
    }
  };

  const stopTest = () => {
    if (stream) {
      // Stop all media tracks
      stream.getTracks().forEach(track => {
        if (process.env.NODE_ENV === 'development') {
          logger.info(`Stopping ${track.kind} track:`, track.label);
        }
        track.stop();
      });
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }
    }
    setStatus('Test stopped');
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        // Cleanup stream on component unmount
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };
  }, [stream]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Media Access Test</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">System Info</h3>
          <p>WebRTC Supported: {isWebRTCSupported() ? 'Yes' : 'No'}</p>
          <p>Secure Context: {window.isSecureContext ? 'Yes' : 'No'}</p>
          <p>Hostname: {window.location.hostname}</p>
          <p>Protocol: {window.location.protocol}</p>
        </div>

        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Status</h3>
          <p>{status}</p>
        </div>

        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Permissions</h3>
          <p>Camera: {permissions.camera ? '✅ Granted' : '❌ Denied'}</p>
          <p>Microphone: {permissions.microphone ? '✅ Granted' : '❌ Denied'}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={checkPermissions}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Check Permissions
          </button>
          
          <button
            onClick={requestPermissions}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Request Permissions
          </button>
          
          <button
            onClick={testVideoCall}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Test Video Call
          </button>
          
          <button
            onClick={testAudioCall}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Test Audio Call
          </button>
          
          <button
            onClick={stopTest}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Stop Test
          </button>
        </div>

        {stream && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Video Preview</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-md rounded"
            />
            <p className="text-sm text-gray-600 mt-2">
              Tracks: {stream.getTracks().map(track => `${track.kind} (${track.enabled ? 'enabled' : 'disabled'})`).join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
