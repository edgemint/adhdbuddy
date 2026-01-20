// ADHDBuddy Matching Algorithm
// Pairs users for accountability sessions

import type { SessionDuration } from './types';
import { MATCHING_CONFIG } from './constants';

/**
 * Represents a user waiting to be matched
 */
export interface MatchQueueEntry {
  userId: string;
  sessionId: string;
  duration: SessionDuration;
  startTime: Date;
  requestedAt: Date;
  timezone?: string;
  preferredPartnerIds?: string[];
}

/**
 * Result of a matching attempt
 */
export interface MatchResult {
  matched: boolean;
  sessionId: string;
  participants: [string, string] | null;
  matchedAt: Date | null;
  reason?: 'matched' | 'no_match' | 'timeout' | 'solo_mode';
}

/**
 * Matching algorithm that pairs users based on session parameters
 */
export class MatchingAlgorithm {
  private queue: Map<string, MatchQueueEntry> = new Map();

  /**
   * Add a user to the matching queue
   */
  addToQueue(entry: MatchQueueEntry): void {
    this.queue.set(entry.userId, entry);
  }

  /**
   * Remove a user from the queue
   */
  removeFromQueue(userId: string): void {
    this.queue.delete(userId);
  }

  /**
   * Check if a user is in the queue
   */
  isInQueue(userId: string): boolean {
    return this.queue.has(userId);
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Find a match for a user
   * Returns the best available match or null if no match found
   */
  findMatch(userId: string): MatchResult {
    const entry = this.queue.get(userId);
    if (!entry) {
      return {
        matched: false,
        sessionId: '',
        participants: null,
        matchedAt: null,
        reason: 'no_match',
      };
    }

    // Find compatible users (same duration, similar start time)
    const candidates = this.findCandidates(entry);

    if (candidates.length === 0) {
      // Check if we've been waiting too long
      const waitTime = Date.now() - entry.requestedAt.getTime();
      if (waitTime >= MATCHING_CONFIG.MATCH_TIMEOUT_MS) {
        return {
          matched: false,
          sessionId: entry.sessionId,
          participants: null,
          matchedAt: null,
          reason: 'timeout',
        };
      }

      return {
        matched: false,
        sessionId: entry.sessionId,
        participants: null,
        matchedAt: null,
        reason: 'no_match',
      };
    }

    // Score and sort candidates
    const scoredCandidates = candidates
      .map((candidate) => ({
        candidate,
        score: this.scoreMatch(entry, candidate),
      }))
      .sort((a, b) => b.score - a.score);

    // Pick the best match
    const bestMatch = scoredCandidates[0].candidate;

    // Remove both users from queue
    this.removeFromQueue(userId);
    this.removeFromQueue(bestMatch.userId);

    return {
      matched: true,
      sessionId: entry.sessionId,
      participants: [userId, bestMatch.userId],
      matchedAt: new Date(),
      reason: 'matched',
    };
  }

  /**
   * Find all compatible candidates for a user
   */
  private findCandidates(entry: MatchQueueEntry): MatchQueueEntry[] {
    const candidates: MatchQueueEntry[] = [];

    for (const [candidateId, candidate] of this.queue) {
      // Skip self
      if (candidateId === entry.userId) continue;

      // Must have same duration
      if (candidate.duration !== entry.duration) continue;

      // Start times must be within 5 minutes of each other
      const timeDiff = Math.abs(
        entry.startTime.getTime() - candidate.startTime.getTime()
      );
      if (timeDiff > 5 * 60 * 1000) continue;

      candidates.push(candidate);
    }

    return candidates;
  }

  /**
   * Score a potential match (higher is better)
   */
  private scoreMatch(user: MatchQueueEntry, candidate: MatchQueueEntry): number {
    let score = 100; // Base score

    // Boost score if they prefer each other
    if (user.preferredPartnerIds?.includes(candidate.userId)) {
      score += 50;
    }
    if (candidate.preferredPartnerIds?.includes(user.userId)) {
      score += 50;
    }

    // Boost score for closer start times
    const timeDiff = Math.abs(
      user.startTime.getTime() - candidate.startTime.getTime()
    );
    score -= timeDiff / 1000; // Subtract 1 point per second of difference

    // Boost score for same timezone
    if (user.timezone && candidate.timezone && user.timezone === candidate.timezone) {
      score += 20;
    }

    // Boost score for users who have been waiting longer (fairness)
    const candidateWaitTime = Date.now() - candidate.requestedAt.getTime();
    score += Math.min(candidateWaitTime / 1000, 30); // Up to 30 points for waiting

    return score;
  }

  /**
   * Process all users in queue and return matches
   * This is used for batch processing
   */
  processQueue(): MatchResult[] {
    const results: MatchResult[] = [];
    const processed = new Set<string>();

    for (const userId of this.queue.keys()) {
      if (processed.has(userId)) continue;

      const result = this.findMatch(userId);
      if (result.matched && result.participants) {
        processed.add(result.participants[0]);
        processed.add(result.participants[1]);
      }
      results.push(result);
    }

    return results;
  }

  /**
   * Clear the queue (useful for testing)
   */
  clearQueue(): void {
    this.queue.clear();
  }
}

/**
 * Singleton instance for the matching algorithm
 */
let matchingInstance: MatchingAlgorithm | null = null;

export function getMatchingAlgorithm(): MatchingAlgorithm {
  if (!matchingInstance) {
    matchingInstance = new MatchingAlgorithm();
  }
  return matchingInstance;
}

/**
 * Reset the matching algorithm (useful for testing)
 */
export function resetMatchingAlgorithm(): void {
  matchingInstance = null;
}
