// ADHDBuddy Utility Functions

import type { SessionDuration } from './types';
import { SESSION_DURATIONS } from './constants';

/**
 * Check if a value is a valid session duration
 */
export function isValidSessionDuration(value: number): value is SessionDuration {
  return SESSION_DURATIONS.includes(value as SessionDuration);
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Get session end time from start time and duration
 */
export function getSessionEndTime(startTime: Date, durationMinutes: number): Date {
  return new Date(startTime.getTime() + durationMinutes * 60 * 1000);
}

/**
 * Check if a session time is in the past
 */
export function isSessionInPast(startTime: Date): boolean {
  return startTime.getTime() < Date.now();
}

/**
 * Check if a session is currently active (between start and end time)
 */
export function isSessionActive(startTime: Date, durationMinutes: number): boolean {
  const now = Date.now();
  const start = startTime.getTime();
  const end = start + durationMinutes * 60 * 1000;
  return now >= start && now < end;
}

/**
 * Calculate time remaining in a session
 */
export function getTimeRemaining(startTime: Date, durationMinutes: number): number {
  const endTime = getSessionEndTime(startTime, durationMinutes);
  const remaining = endTime.getTime() - Date.now();
  return Math.max(0, remaining);
}

/**
 * Format time remaining as mm:ss
 */
export function formatTimeRemaining(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Generate a unique ID (client-side compatible)
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
