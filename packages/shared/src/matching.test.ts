import { describe, it, expect, beforeEach } from 'vitest';
import {
  MatchingAlgorithm,
  getMatchingAlgorithm,
  resetMatchingAlgorithm,
  type MatchQueueEntry,
} from './matching';

describe('MatchingAlgorithm', () => {
  let algorithm: MatchingAlgorithm;

  beforeEach(() => {
    algorithm = new MatchingAlgorithm();
  });

  describe('queue management', () => {
    it('should add users to the queue', () => {
      const entry: MatchQueueEntry = {
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime: new Date('2026-01-20T10:00:00Z'),
        requestedAt: new Date(),
      };

      algorithm.addToQueue(entry);
      expect(algorithm.isInQueue('user-1')).toBe(true);
      expect(algorithm.getQueueSize()).toBe(1);
    });

    it('should remove users from the queue', () => {
      const entry: MatchQueueEntry = {
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime: new Date('2026-01-20T10:00:00Z'),
        requestedAt: new Date(),
      };

      algorithm.addToQueue(entry);
      algorithm.removeFromQueue('user-1');
      expect(algorithm.isInQueue('user-1')).toBe(false);
      expect(algorithm.getQueueSize()).toBe(0);
    });

    it('should clear the queue', () => {
      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime: new Date(),
        requestedAt: new Date(),
      });
      algorithm.addToQueue({
        userId: 'user-2',
        sessionId: 'session-2',
        duration: 50,
        startTime: new Date(),
        requestedAt: new Date(),
      });

      algorithm.clearQueue();
      expect(algorithm.getQueueSize()).toBe(0);
    });
  });

  describe('findMatch', () => {
    it('should match two users with same duration and similar start time', () => {
      const startTime = new Date('2026-01-20T10:00:00Z');

      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime,
        requestedAt: new Date(),
      });

      algorithm.addToQueue({
        userId: 'user-2',
        sessionId: 'session-2',
        duration: 50,
        startTime,
        requestedAt: new Date(),
      });

      const result = algorithm.findMatch('user-1');

      expect(result.matched).toBe(true);
      expect(result.participants).toContain('user-1');
      expect(result.participants).toContain('user-2');
      expect(result.reason).toBe('matched');
    });

    it('should not match users with different durations', () => {
      const startTime = new Date('2026-01-20T10:00:00Z');

      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime,
        requestedAt: new Date(),
      });

      algorithm.addToQueue({
        userId: 'user-2',
        sessionId: 'session-2',
        duration: 25,
        startTime,
        requestedAt: new Date(),
      });

      const result = algorithm.findMatch('user-1');

      expect(result.matched).toBe(false);
      expect(result.reason).toBe('no_match');
    });

    it('should not match users with start times more than 5 minutes apart', () => {
      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime: new Date('2026-01-20T10:00:00Z'),
        requestedAt: new Date(),
      });

      algorithm.addToQueue({
        userId: 'user-2',
        sessionId: 'session-2',
        duration: 50,
        startTime: new Date('2026-01-20T10:10:00Z'), // 10 minutes later
        requestedAt: new Date(),
      });

      const result = algorithm.findMatch('user-1');

      expect(result.matched).toBe(false);
      expect(result.reason).toBe('no_match');
    });

    it('should match users with start times within 5 minutes', () => {
      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime: new Date('2026-01-20T10:00:00Z'),
        requestedAt: new Date(),
      });

      algorithm.addToQueue({
        userId: 'user-2',
        sessionId: 'session-2',
        duration: 50,
        startTime: new Date('2026-01-20T10:04:00Z'), // 4 minutes later
        requestedAt: new Date(),
      });

      const result = algorithm.findMatch('user-1');

      expect(result.matched).toBe(true);
    });

    it('should return no_match when user is alone in queue', () => {
      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime: new Date(),
        requestedAt: new Date(),
      });

      const result = algorithm.findMatch('user-1');

      expect(result.matched).toBe(false);
      expect(result.reason).toBe('no_match');
    });

    it('should return no_match for non-existent user', () => {
      const result = algorithm.findMatch('non-existent');

      expect(result.matched).toBe(false);
      expect(result.reason).toBe('no_match');
    });

    it('should remove both users from queue after matching', () => {
      const startTime = new Date('2026-01-20T10:00:00Z');

      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime,
        requestedAt: new Date(),
      });

      algorithm.addToQueue({
        userId: 'user-2',
        sessionId: 'session-2',
        duration: 50,
        startTime,
        requestedAt: new Date(),
      });

      algorithm.findMatch('user-1');

      expect(algorithm.isInQueue('user-1')).toBe(false);
      expect(algorithm.isInQueue('user-2')).toBe(false);
      expect(algorithm.getQueueSize()).toBe(0);
    });
  });

  describe('matching scoring', () => {
    it('should prefer users who have preferred partners', () => {
      const startTime = new Date('2026-01-20T10:00:00Z');

      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime,
        requestedAt: new Date(),
        preferredPartnerIds: ['user-3'],
      });

      algorithm.addToQueue({
        userId: 'user-2',
        sessionId: 'session-2',
        duration: 50,
        startTime,
        requestedAt: new Date(),
      });

      algorithm.addToQueue({
        userId: 'user-3',
        sessionId: 'session-3',
        duration: 50,
        startTime,
        requestedAt: new Date(),
      });

      const result = algorithm.findMatch('user-1');

      expect(result.matched).toBe(true);
      expect(result.participants).toContain('user-3');
    });

    it('should prefer users with same timezone', () => {
      const startTime = new Date('2026-01-20T10:00:00Z');
      const requestedAt = new Date();

      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime,
        requestedAt,
        timezone: 'America/New_York',
      });

      algorithm.addToQueue({
        userId: 'user-2',
        sessionId: 'session-2',
        duration: 50,
        startTime,
        requestedAt,
        timezone: 'Europe/London',
      });

      algorithm.addToQueue({
        userId: 'user-3',
        sessionId: 'session-3',
        duration: 50,
        startTime,
        requestedAt,
        timezone: 'America/New_York',
      });

      const result = algorithm.findMatch('user-1');

      expect(result.matched).toBe(true);
      expect(result.participants).toContain('user-3');
    });
  });

  describe('processQueue', () => {
    it('should process all users and return matches', () => {
      const startTime = new Date('2026-01-20T10:00:00Z');

      // Add 4 users
      for (let i = 1; i <= 4; i++) {
        algorithm.addToQueue({
          userId: `user-${i}`,
          sessionId: `session-${i}`,
          duration: 50,
          startTime,
          requestedAt: new Date(),
        });
      }

      const results = algorithm.processQueue();

      // Should have 2 matches
      const matches = results.filter((r) => r.matched);
      expect(matches.length).toBe(2);

      // Queue should be empty
      expect(algorithm.getQueueSize()).toBe(0);
    });

    it('should handle odd number of users', () => {
      const startTime = new Date('2026-01-20T10:00:00Z');

      // Add 3 users
      for (let i = 1; i <= 3; i++) {
        algorithm.addToQueue({
          userId: `user-${i}`,
          sessionId: `session-${i}`,
          duration: 50,
          startTime,
          requestedAt: new Date(),
        });
      }

      const results = algorithm.processQueue();

      // Should have 1 match and 1 unmatched
      const matches = results.filter((r) => r.matched);
      const unmatched = results.filter((r) => !r.matched);

      expect(matches.length).toBe(1);
      expect(unmatched.length).toBe(1);
    });
  });

  describe('timeout handling', () => {
    it('should return timeout when user has been waiting too long', () => {
      const longAgo = new Date(Date.now() - 120000); // 2 minutes ago

      algorithm.addToQueue({
        userId: 'user-1',
        sessionId: 'session-1',
        duration: 50,
        startTime: new Date('2026-01-20T10:00:00Z'),
        requestedAt: longAgo,
      });

      const result = algorithm.findMatch('user-1');

      expect(result.matched).toBe(false);
      expect(result.reason).toBe('timeout');
    });
  });
});

describe('Singleton pattern', () => {
  beforeEach(() => {
    resetMatchingAlgorithm();
  });

  it('should return the same instance', () => {
    const instance1 = getMatchingAlgorithm();
    const instance2 = getMatchingAlgorithm();

    expect(instance1).toBe(instance2);
  });

  it('should reset the instance', () => {
    const instance1 = getMatchingAlgorithm();
    instance1.addToQueue({
      userId: 'user-1',
      sessionId: 'session-1',
      duration: 50,
      startTime: new Date(),
      requestedAt: new Date(),
    });

    resetMatchingAlgorithm();
    const instance2 = getMatchingAlgorithm();

    expect(instance2.getQueueSize()).toBe(0);
  });
});
