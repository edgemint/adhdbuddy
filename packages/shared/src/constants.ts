// ADHDBuddy Constants

export const SESSION_DURATIONS = [25, 50, 75] as const;

export const SESSION_STATUSES = ['scheduled', 'active', 'completed', 'cancelled'] as const;

// Time constants
export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

// Matching configuration
export const MATCHING_CONFIG = {
  /** How long to wait for a match before giving solo option */
  MATCH_TIMEOUT_MS: 60 * 1000,
  /** Minimum time before session start to allow scheduling */
  MIN_ADVANCE_BOOKING_MS: 5 * MINUTE_MS,
  /** Maximum time in advance a session can be scheduled */
  MAX_ADVANCE_BOOKING_MS: 7 * 24 * HOUR_MS, // 1 week
} as const;

// Video configuration
export const VIDEO_CONFIG = {
  /** ICE servers for WebRTC */
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  /** Reconnection attempts before giving up */
  MAX_RECONNECT_ATTEMPTS: 3,
  /** Delay between reconnection attempts */
  RECONNECT_DELAY_MS: 2000,
} as const;

// API routes
export const API_ROUTES = {
  HEALTH: '/api/health',
  HEALTH_DB: '/api/health/db',
  HEALTH_REALTIME: '/api/health/realtime',
  SESSIONS: '/api/sessions',
  MATCH: '/api/match',
} as const;

// Supabase table names
export const TABLES = {
  PROFILES: 'profiles',
  SESSIONS: 'sessions',
  SESSION_PARTICIPANTS: 'session_participants',
  USER_PREFERENCES: 'user_preferences',
  USER_CONNECTIONS: 'user_connections',
} as const;
