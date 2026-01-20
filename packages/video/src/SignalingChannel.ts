import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { SignalMessage } from '@adhdbuddy/shared';

export interface SignalingChannelOptions {
  supabase: SupabaseClient;
  sessionId: string;
  userId: string;
  onSignal: (message: SignalMessage) => void;
}

/**
 * Handles WebRTC signaling via Supabase Realtime
 */
export class SignalingChannel {
  private channel: RealtimeChannel | null = null;
  private supabase: SupabaseClient;
  private sessionId: string;
  private userId: string;
  private onSignal: (message: SignalMessage) => void;

  constructor(options: SignalingChannelOptions) {
    this.supabase = options.supabase;
    this.sessionId = options.sessionId;
    this.userId = options.userId;
    this.onSignal = options.onSignal;
  }

  /**
   * Connect to the signaling channel
   */
  async connect(): Promise<void> {
    const channelName = `session:${this.sessionId}`;

    this.channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'signal' }, (payload) => {
        const message = payload.payload as SignalMessage;
        // Only process messages intended for us
        if (message.to === this.userId) {
          this.onSignal(message);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to signaling channel:', channelName);
        }
      });
  }

  /**
   * Send a signal message to another peer
   */
  async sendSignal(message: Omit<SignalMessage, 'from'>): Promise<void> {
    if (!this.channel) {
      throw new Error('SignalingChannel not connected');
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        ...message,
        from: this.userId,
      },
    });
  }

  /**
   * Disconnect from the signaling channel
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
