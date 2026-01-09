import { db } from '@lab404/database';
import { ipReputation, type IpReputation, type NewIpReputation } from '@lab404/database';
import { eq, and, lt, lte, gte } from 'drizzle-orm';
import { Request } from 'express';
import { logger } from '../utils/logger';

/**
 * IP Reputation Service
 *
 * Tracks IP addresses with reputation scores for abuse prevention.
 * Used to identify and block malicious IPs automatically.
 *
 * Reputation Score System (0-100):
 * - Start: 100 (neutral)
 * - Failed login: -5
 * - Rate limit violation: -10
 * - Abuse report: -20
 * - Successful login: +2
 * - Block threshold: score < 20
 * - Suspicious threshold: score < 50
 */
class IpReputationService {
  /**
   * Track an IP action and update reputation
   *
   * @param ip - IP address
   * @param action - Action type
   * @param success - Whether the action was successful
   * @param metadata - Additional metadata
   */
  async trackIP(
    ip: string,
    action: 'login' | 'rate_limit' | 'abuse_report' | 'api_request',
    success: boolean,
    metadata?: {
      userAgent?: string;
      country?: string;
      reason?: string;
    }
  ): Promise<void> {
    try {
      // Get or create IP record
      const ipRecord = await this.getOrCreateIP(ip, metadata);

      // Update counters based on action
      const updates: Partial<IpReputation> = {
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      };

      if (action === 'login') {
        if (success) {
          updates.successfulLogins = (ipRecord.successfulLogins || 0) + 1;
        } else {
          updates.failedLoginAttempts = (ipRecord.failedLoginAttempts || 0) + 1;
        }
      } else if (action === 'rate_limit') {
        updates.rateLimitViolations = (ipRecord.rateLimitViolations || 0) + 1;
      } else if (action === 'abuse_report') {
        updates.abuseReports = (ipRecord.abuseReports || 0) + 1;
      }

      // Update metadata if provided
      if (metadata?.userAgent) {
        updates.userAgent = metadata.userAgent;
      }
      if (metadata?.country) {
        updates.country = metadata.country;
      }

      // Calculate new reputation score
      const newScore = await this.calculateScore(ip);
      updates.reputationScore = newScore;

      // Auto-block if score drops below threshold
      if (newScore < 20 && !ipRecord.isBlocked) {
        updates.isBlocked = true;
        updates.blockedAt = new Date();
        updates.blockReason = 'Automatic block due to low reputation score';
        updates.blockedUntil = null; // Permanent until manually unblocked

        logger.warn('IP automatically blocked due to low reputation', {
          ip,
          reputationScore: newScore,
          failedLogins: updates.failedLoginAttempts,
          rateLimitViolations: updates.rateLimitViolations,
          abuseReports: updates.abuseReports,
        });
      }

      // Update the record
      await db
        .update(ipReputation)
        .set(updates)
        .where(eq(ipReputation.ipAddress, ip));
    } catch (error) {
      logger.error('Failed to track IP', {
        ip,
        action,
        success,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - tracking failures shouldn't break requests
    }
  }

  /**
   * Get IP reputation record
   *
   * @param ip - IP address
   * @returns IP reputation or null
   */
  async getReputation(ip: string): Promise<IpReputation | null> {
    try {
      const results = await db
        .select()
        .from(ipReputation)
        .where(eq(ipReputation.ipAddress, ip))
        .limit(1);

      return results[0] || null;
    } catch (error) {
      logger.error('Failed to get IP reputation', {
        ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check if an IP is blocked
   *
   * @param ip - IP address
   * @returns True if blocked, false otherwise
   */
  async isBlocked(ip: string): Promise<boolean> {
    try {
      const record = await this.getReputation(ip);

      if (!record || !record.isBlocked) {
        return false;
      }

      // Check if temporary block has expired
      if (record.blockedUntil && record.blockedUntil < new Date()) {
        // Unblock automatically
        await this.unblockIP(ip);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check if IP is blocked', {
        ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Default to not blocked on error to avoid false positives
      return false;
    }
  }

  /**
   * Block an IP address
   *
   * @param ip - IP address
   * @param reason - Block reason
   * @param duration - Optional duration in hours (null = permanent)
   */
  async blockIP(ip: string, reason: string, duration?: number): Promise<void> {
    try {
      // Get or create IP record
      await this.getOrCreateIP(ip);

      const blockedUntil = duration
        ? new Date(Date.now() + duration * 60 * 60 * 1000)
        : null;

      await db
        .update(ipReputation)
        .set({
          isBlocked: true,
          blockReason: reason,
          blockedAt: new Date(),
          blockedUntil,
          updatedAt: new Date(),
        })
        .where(eq(ipReputation.ipAddress, ip));

      logger.info('IP blocked', {
        ip,
        reason,
        duration: duration ? `${duration} hours` : 'permanent',
        blockedUntil: blockedUntil?.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to block IP', {
        ip,
        reason,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Unblock an IP address
   *
   * @param ip - IP address
   */
  async unblockIP(ip: string): Promise<void> {
    try {
      await db
        .update(ipReputation)
        .set({
          isBlocked: false,
          blockReason: null,
          blockedAt: null,
          blockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(ipReputation.ipAddress, ip));

      logger.info('IP unblocked', { ip });
    } catch (error) {
      logger.error('Failed to unblock IP', {
        ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Calculate reputation score for an IP
   *
   * Score calculation:
   * - Start: 100
   * - Failed login: -5
   * - Rate limit violation: -10
   * - Abuse report: -20
   * - Successful login: +2
   *
   * @param ip - IP address
   * @returns Reputation score (0-100)
   */
  async calculateScore(ip: string): Promise<number> {
    try {
      const record = await this.getReputation(ip);

      if (!record) {
        return 100; // New IPs start with perfect score
      }

      let score = 100;

      // Deduct for bad behavior
      score -= (record.failedLoginAttempts || 0) * 5;
      score -= (record.rateLimitViolations || 0) * 10;
      score -= (record.abuseReports || 0) * 20;

      // Add for good behavior
      score += (record.successfulLogins || 0) * 2;

      // Clamp between 0 and 100
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      logger.error('Failed to calculate IP score', {
        ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 100; // Default to neutral score on error
    }
  }

  /**
   * Cleanup expired temporary blocks and improve reputation scores
   *
   * This should be run periodically (e.g., daily cron job)
   * - Removes expired temporary blocks
   * - Gradually improves reputation scores for IPs with score < 100
   *
   * @returns Object with cleanup statistics
   */
  async cleanupExpiredBlocks(): Promise<{
    unblockedCount: number;
    improvedCount: number;
  }> {
    try {
      const now = new Date();

      // Find and unblock expired temporary blocks
      const expiredBlocks = await db
        .select()
        .from(ipReputation)
        .where(
          and(
            eq(ipReputation.isBlocked, true),
            lt(ipReputation.blockedUntil, now)
          )
        );

      let unblockedCount = 0;
      for (const record of expiredBlocks) {
        if (record.blockedUntil !== null) {
          await this.unblockIP(record.ipAddress);
          unblockedCount++;
        }
      }

      // Gradually improve reputation scores (increase by 10 for IPs with score < 100)
      const ipsToImprove = await db
        .select()
        .from(ipReputation)
        .where(lt(ipReputation.reputationScore, 100));

      let improvedCount = 0;
      for (const record of ipsToImprove) {
        const newScore = Math.min(100, (record.reputationScore || 0) + 10);
        await db
          .update(ipReputation)
          .set({
            reputationScore: newScore,
            updatedAt: new Date(),
          })
          .where(eq(ipReputation.ipAddress, record.ipAddress));
        improvedCount++;
      }

      logger.info('IP reputation cleanup completed', {
        unblockedCount,
        improvedCount,
        timestamp: new Date().toISOString(),
      });

      return { unblockedCount, improvedCount };
    } catch (error) {
      logger.error('Failed to cleanup IP reputation', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get statistics about IP reputation
   *
   * @returns Statistics object
   */
  async getStatistics(): Promise<{
    totalIPs: number;
    blockedIPs: number;
    suspiciousIPs: number;
    goodIPs: number;
    averageScore: number;
  }> {
    try {
      const allIPs = await db.select().from(ipReputation);

      const stats = {
        totalIPs: allIPs.length,
        blockedIPs: allIPs.filter((ip) => ip.isBlocked).length,
        suspiciousIPs: allIPs.filter(
          (ip) => !ip.isBlocked && (ip.reputationScore || 0) < 50
        ).length,
        goodIPs: allIPs.filter((ip) => (ip.reputationScore || 0) >= 50).length,
        averageScore:
          allIPs.length > 0
            ? allIPs.reduce((sum, ip) => sum + (ip.reputationScore || 0), 0) /
              allIPs.length
            : 100,
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get IP reputation statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Query IP reputations with filters and pagination
   *
   * @param filters - Query filters
   * @returns Array of IP reputations
   */
  async query(filters: {
    isBlocked?: boolean;
    minScore?: number;
    maxScore?: number;
    limit?: number;
    offset?: number;
  }): Promise<IpReputation[]> {
    try {
      const conditions = [];

      if (filters.isBlocked !== undefined) {
        conditions.push(eq(ipReputation.isBlocked, filters.isBlocked));
      }

      if (filters.minScore !== undefined) {
        conditions.push(gte(ipReputation.reputationScore, filters.minScore));
      }

      if (filters.maxScore !== undefined) {
        conditions.push(lte(ipReputation.reputationScore, filters.maxScore));
      }

      let query = db
        .select()
        .from(ipReputation)
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;
      return results;
    } catch (error) {
      logger.error('Failed to query IP reputations', {
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get or create an IP reputation record
   *
   * @param ip - IP address
   * @param metadata - Optional metadata
   * @returns IP reputation record
   */
  private async getOrCreateIP(
    ip: string,
    metadata?: {
      userAgent?: string;
      country?: string;
    }
  ): Promise<IpReputation> {
    try {
      const existing = await this.getReputation(ip);

      if (existing) {
        return existing;
      }

      // Create new record
      const newRecord: NewIpReputation = {
        ipAddress: ip,
        reputationScore: 100,
        failedLoginAttempts: 0,
        successfulLogins: 0,
        rateLimitViolations: 0,
        abuseReports: 0,
        isBlocked: false,
        lastSeenAt: new Date(),
        firstSeenAt: new Date(),
        userAgent: metadata?.userAgent || null,
        country: metadata?.country || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [created] = await db.insert(ipReputation).values(newRecord).returning();

      return created;
    } catch (error) {
      logger.error('Failed to get or create IP', {
        ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get client IP address from request
   *
   * Handles X-Forwarded-For header for proxies
   *
   * @param req - Express request
   * @returns IP address
   */
  getClientIp(req: Request): string {
    const forwardedFor = req.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}

export const ipReputationService = new IpReputationService();
