import Peer from 'simple-peer';
import type { Instance as SimplePeerInstance } from 'simple-peer';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SignalMessage } from '@adhdbuddy/shared';
import { VIDEO_CONFIG } from '@adhdbuddy/shared';
import { SignalingChannel } from './SignalingChannel';

export interface VideoConnectionOptions {
  supabase: SupabaseClient;
  sessionId: string;
  userId: string;
  peerId: string;
  initiator: boolean;
  onStateChange?: (state: VideoConnectionState) => void;
}

export interface VideoConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  error?: string;
}

/**
 * Manages a P2P video connection with another user
 */
export class VideoConnection {
  private peer: SimplePeerInstance | null = null;
  private signaling: SignalingChannel;
  private options: VideoConnectionOptions;
  private state: VideoConnectionState = {
    status: 'connecting',
    localStream: null,
    remoteStream: null,
  };
  private reconnectAttempts = 0;

  constructor(options: VideoConnectionOptions) {
    this.options = options;
    this.signaling = new SignalingChannel({
      supabase: options.supabase,
      sessionId: options.sessionId,
      userId: options.userId,
      onSignal: this.handleSignal.bind(this),
    });
  }

  /**
   * Start the video connection
   */
  async connect(): Promise<void> {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.state.localStream = stream;
      this.updateState({ localStream: stream });

      // Connect to signaling
      await this.signaling.connect();

      // Create peer connection
      this.createPeer(stream);
    } catch (error) {
      this.updateState({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to connect',
      });
    }
  }

  private createPeer(stream: MediaStream): void {
    this.peer = new Peer({
      initiator: this.options.initiator,
      stream,
      config: {
        iceServers: [...VIDEO_CONFIG.ICE_SERVERS],
      },
    });

    this.peer.on('signal', async (data) => {
      // Send signaling data to the other peer
      const messageType = data.type === 'offer' ? 'offer' : data.type === 'answer' ? 'answer' : 'ice-candidate';
      await this.signaling.sendSignal({
        type: messageType,
        to: this.options.peerId,
        payload: data as RTCSessionDescriptionInit | RTCIceCandidateInit,
      });
    });

    this.peer.on('stream', (remoteStream) => {
      this.updateState({
        status: 'connected',
        remoteStream,
      });
    });

    this.peer.on('connect', () => {
      console.log('Peer connection established');
      this.reconnectAttempts = 0;
    });

    this.peer.on('close', () => {
      this.handleDisconnect();
    });

    this.peer.on('error', (error) => {
      console.error('Peer connection error:', error);
      this.handleDisconnect();
    });
  }

  private handleSignal(message: SignalMessage): void {
    if (this.peer && message.from === this.options.peerId) {
      this.peer.signal(message.payload as Peer.SignalData);
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < VIDEO_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);

      setTimeout(() => {
        if (this.state.localStream) {
          this.createPeer(this.state.localStream);
        }
      }, VIDEO_CONFIG.RECONNECT_DELAY_MS);
    } else {
      this.updateState({
        status: 'failed',
        error: 'Connection lost after max reconnection attempts',
      });
    }
  }

  private updateState(updates: Partial<VideoConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.options.onStateChange?.(this.state);
  }

  /**
   * Disconnect and clean up resources
   */
  async disconnect(): Promise<void> {
    // Stop local media tracks
    if (this.state.localStream) {
      this.state.localStream.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    // Disconnect signaling
    await this.signaling.disconnect();

    this.updateState({
      status: 'disconnected',
      localStream: null,
      remoteStream: null,
    });
  }

  /**
   * Toggle local video
   */
  toggleVideo(enabled: boolean): void {
    this.state.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  /**
   * Toggle local audio
   */
  toggleAudio(enabled: boolean): void {
    this.state.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  /**
   * Get current connection state
   */
  getState(): VideoConnectionState {
    return { ...this.state };
  }
}
