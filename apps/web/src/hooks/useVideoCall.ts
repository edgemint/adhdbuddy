import { useState, useCallback, useRef, useEffect } from 'react';
import { VideoConnection, type VideoConnectionState } from '@adhdbuddy/video';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface UseVideoCallOptions {
  sessionId: string;
  peerId: string | null;
  autoConnect?: boolean;
}

export interface UseVideoCallReturn {
  state: VideoConnectionState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleVideo: (enabled: boolean) => void;
  toggleAudio: (enabled: boolean) => void;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useVideoCall({
  sessionId,
  peerId,
  autoConnect = false,
}: UseVideoCallOptions): UseVideoCallReturn {
  const { user } = useAuth();
  const connectionRef = useRef<VideoConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [state, setState] = useState<VideoConnectionState>({
    status: 'disconnected',
    localStream: null,
    remoteStream: null,
  });

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const handleStateChange = useCallback((newState: VideoConnectionState) => {
    setState(newState);

    // Update video elements when streams change
    if (localVideoRef.current && newState.localStream) {
      localVideoRef.current.srcObject = newState.localStream;
    }
    if (remoteVideoRef.current && newState.remoteStream) {
      remoteVideoRef.current.srcObject = newState.remoteStream;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!user || !peerId) return;

    // Determine who initiates based on user ID comparison
    const initiator = user.id < peerId;

    const connection = new VideoConnection({
      supabase,
      sessionId,
      userId: user.id,
      peerId,
      initiator,
      onStateChange: handleStateChange,
    });

    connectionRef.current = connection;
    await connection.connect();
  }, [user, peerId, sessionId, handleStateChange]);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.disconnect();
      connectionRef.current = null;
    }
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    if (connectionRef.current) {
      connectionRef.current.toggleVideo(enabled);
      setIsVideoEnabled(enabled);
    }
  }, []);

  const toggleAudio = useCallback((enabled: boolean) => {
    if (connectionRef.current) {
      connectionRef.current.toggleAudio(enabled);
      setIsAudioEnabled(enabled);
    }
  }, []);

  // Auto-connect when peer is available
  useEffect(() => {
    if (autoConnect && peerId && user && state.status === 'disconnected') {
      connect();
    }
  }, [autoConnect, peerId, user, state.status, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    toggleVideo,
    toggleAudio,
    isVideoEnabled,
    isAudioEnabled,
    localVideoRef,
    remoteVideoRef,
  };
}
