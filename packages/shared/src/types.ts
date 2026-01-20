// Core types for ADHDBuddy

export type SessionDuration = 25 | 50 | 75;

export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
}

export interface Session {
  id: string;
  start_time: string;
  duration_minutes: SessionDuration;
  status: SessionStatus;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  goal: string | null;
  goal_completed: boolean | null;
  joined_at: string | null;
}

export interface UserPreferences {
  user_id: string;
  notifications_enabled: boolean;
  preferred_duration: SessionDuration;
  is_premium: boolean;
}

export interface UserConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  created_at: string;
}

// Matching types
export interface MatchRequest {
  user_id: string;
  session_id: string;
  requested_at: string;
}

export interface MatchResult {
  session_id: string;
  participants: [string, string] | null; // null if no match found
  matched_at: string;
}

// Video signaling types
export interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface PeerConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}
