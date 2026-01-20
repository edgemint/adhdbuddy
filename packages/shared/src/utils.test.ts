import { describe, it, expect } from 'vitest';
import {
  isValidSessionDuration,
  formatDuration,
  getSessionEndTime,
  isSessionInPast,
  isSessionActive,
  getTimeRemaining,
  formatTimeRemaining,
  generateId,
  debounce,
} from './utils';

describe('isValidSessionDuration', () => {
  it('returns true for valid durations', () => {
    expect(isValidSessionDuration(25)).toBe(true);
    expect(isValidSessionDuration(50)).toBe(true);
    expect(isValidSessionDuration(75)).toBe(true);
  });

  it('returns false for invalid durations', () => {
    expect(isValidSessionDuration(10)).toBe(false);
    expect(isValidSessionDuration(30)).toBe(false);
    expect(isValidSessionDuration(100)).toBe(false);
    expect(isValidSessionDuration(0)).toBe(false);
    expect(isValidSessionDuration(-25)).toBe(false);
  });
});

describe('formatDuration', () => {
  it('formats minutes under 60', () => {
    expect(formatDuration(25)).toBe('25 min');
    expect(formatDuration(50)).toBe('50 min');
  });

  it('formats exactly 60 minutes', () => {
    expect(formatDuration(60)).toBe('1 hr');
  });

  it('formats over 60 minutes', () => {
    expect(formatDuration(75)).toBe('1 hr 15 min');
    expect(formatDuration(90)).toBe('1 hr 30 min');
    expect(formatDuration(120)).toBe('2 hr');
  });
});

describe('getSessionEndTime', () => {
  it('calculates end time correctly', () => {
    const start = new Date('2026-01-20T10:00:00Z');
    const end = getSessionEndTime(start, 50);
    expect(end.toISOString()).toBe('2026-01-20T10:50:00.000Z');
  });
});

describe('isSessionInPast', () => {
  it('returns true for past sessions', () => {
    const pastTime = new Date(Date.now() - 60000);
    expect(isSessionInPast(pastTime)).toBe(true);
  });

  it('returns false for future sessions', () => {
    const futureTime = new Date(Date.now() + 60000);
    expect(isSessionInPast(futureTime)).toBe(false);
  });
});

describe('isSessionActive', () => {
  it('returns true when currently within session time', () => {
    const start = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
    expect(isSessionActive(start, 50)).toBe(true);
  });

  it('returns false before session starts', () => {
    const start = new Date(Date.now() + 60000); // 1 min in future
    expect(isSessionActive(start, 50)).toBe(false);
  });

  it('returns false after session ends', () => {
    const start = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    expect(isSessionActive(start, 50)).toBe(false);
  });
});

describe('getTimeRemaining', () => {
  it('returns remaining time in milliseconds', () => {
    const start = new Date(Date.now());
    const remaining = getTimeRemaining(start, 50);
    // Should be close to 50 minutes in ms (allow some tolerance)
    expect(remaining).toBeGreaterThan(49 * 60 * 1000);
    expect(remaining).toBeLessThanOrEqual(50 * 60 * 1000);
  });

  it('returns 0 for completed sessions', () => {
    const start = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    expect(getTimeRemaining(start, 25)).toBe(0);
  });
});

describe('formatTimeRemaining', () => {
  it('formats milliseconds as mm:ss', () => {
    expect(formatTimeRemaining(300000)).toBe('05:00'); // 5 minutes
    expect(formatTimeRemaining(90000)).toBe('01:30'); // 1 min 30 sec
    expect(formatTimeRemaining(45000)).toBe('00:45'); // 45 seconds
    expect(formatTimeRemaining(0)).toBe('00:00');
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('generates valid UUID format', () => {
    const id = generateId();
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

describe('debounce', () => {
  it('debounces function calls', async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 50);

    // Call multiple times quickly
    fn();
    fn();
    fn();

    // Should not have been called yet
    expect(callCount).toBe(0);

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should have been called once
    expect(callCount).toBe(1);
  });

  it('passes arguments to debounced function', async () => {
    let receivedArgs: unknown[] = [];
    const fn = debounce((...args: unknown[]) => { receivedArgs = args; }, 50);

    fn('a', 'b', 'c');

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(receivedArgs).toEqual(['a', 'b', 'c']);
  });
});
