import { db } from '@lab404/database';
import { sessions } from '@lab404/database/schema';
import { eq, and, or, lt, desc, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { UAParser } from 'ua-parser-js';
import { logger } from '../utils/logger';

interface CreateSessionOptions {
  customerId: string;
  userAgent: string;
  ipAddress: string;
}

interface SessionInfo {
  id: string;
  customerId: string;
  deviceName: string;
  deviceType: string;
  deviceBrowser: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  ipAddress: string;
  ipCity: string | null;
  ipCountry: string | null;
  loginAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

class SessionService {
  /**
   * Parse User-Agent string to extract device information
   */
  private parseUserAgent(userAgent: string) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const browser = result.browser.name || 'Unknown Browser';
    const browserVersion = result.browser.version || '';
    const os = result.os.name || 'Unknown OS';
    const osVersion = result.os.version || '';
    const deviceType = result.device.type || 'desktop'; // desktop | mobile | tablet

    const deviceName = `${browser} on ${os}${osVersion ? ` ${osVersion}` : ''}`;

    return {
      deviceName,
      deviceType,
      deviceBrowser: browser,
      browserVersion,
      osName: os,
      osVersion,
    };
  }

  /**
   * Create new session on login
   * Returns sessionId for JWT embedding
   */
  async createSession(options: CreateSessionOptions): Promise<string> {
    const { customerId, userAgent, ipAddress } = options;

    // Parse device information
    const deviceInfo = this.parseUserAgent(userAgent);

    // Create session record (tokenHash will be set after JWT generation)
    const [session] = await db
      .insert(sessions)
      .values({
        customerId,
        userAgent,
        ipAddress,
        ...deviceInfo,
        tokenHash: 'pending', // Placeholder, will be updated after token generation
        loginAt: new Date(),
        lastActivityAt: new Date(),
      })
      .returning();

    logger.info('Session created', {
      sessionId: session.id,
      customerId,
      deviceName: deviceInfo.deviceName,
      ipAddress,
    });

    return session.id;
  }

  /**
   * Update session with token hash after JWT generation
   */
  async setTokenHash(sessionId: string, token: string): Promise<void> {
    const tokenHash = await bcrypt.hash(token, 10); // 10 rounds (faster than 12)

    await db
      .update(sessions)
      .set({ tokenHash, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    logger.debug('Token hash set for session', { sessionId });
  }

  /**
   * Validate session is active
   */
  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.isActive, true)))
      .limit(1);

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      customerId: session.customerId,
      deviceName: session.deviceName || 'Unknown Device',
      deviceType: session.deviceType || 'desktop',
      deviceBrowser: session.deviceBrowser || '',
      browserVersion: session.browserVersion || '',
      osName: session.osName || '',
      osVersion: session.osVersion || '',
      ipAddress: session.ipAddress,
      ipCity: session.ipCity,
      ipCountry: session.ipCountry,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
      isActive: session.isActive,
    };
  }

  /**
   * Update last activity timestamp (async, non-blocking)
   */
  async updateActivity(sessionId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ lastActivityAt: new Date(), updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  /**
   * Get all active sessions for customer
   */
  async getActiveSessions(customerId: string): Promise<SessionInfo[]> {
    const sessionList = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.customerId, customerId), eq(sessions.isActive, true)))
      .orderBy(desc(sessions.lastActivityAt));

    return sessionList.map((session) => ({
      id: session.id,
      customerId: session.customerId,
      deviceName: session.deviceName || 'Unknown Device',
      deviceType: session.deviceType || 'desktop',
      deviceBrowser: session.deviceBrowser || '',
      browserVersion: session.browserVersion || '',
      osName: session.osName || '',
      osVersion: session.osVersion || '',
      ipAddress: session.ipAddress,
      ipCity: session.ipCity,
      ipCountry: session.ipCountry,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
      isActive: session.isActive,
    }));
  }

  /**
   * Revoke specific session
   */
  async revokeSession(
    sessionId: string,
    reason: 'user_action' | 'security' | 'admin_action'
  ): Promise<void> {
    await db
      .update(sessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    logger.info('Session revoked', { sessionId, reason });
  }

  /**
   * Revoke all sessions except current
   */
  async revokeOtherSessions(customerId: string, currentSessionId: string): Promise<number> {
    const result = await db
      .update(sessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokeReason: 'user_action',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessions.customerId, customerId),
          eq(sessions.isActive, true),
          ne(sessions.id, currentSessionId)
        )
      );

    const count = result.rowCount || 0;
    logger.info('Other sessions revoked', { customerId, count });
    return count;
  }

  /**
   * Revoke all sessions for customer
   */
  async revokeAllSessions(customerId: string): Promise<number> {
    const result = await db
      .update(sessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokeReason: 'user_action',
        updatedAt: new Date(),
      })
      .where(and(eq(sessions.customerId, customerId), eq(sessions.isActive, true)));

    const count = result.rowCount || 0;
    logger.info('All sessions revoked', { customerId, count });
    return count;
  }

  /**
   * Cleanup old/revoked sessions (for cron job)
   */
  async cleanupSessions(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await db
      .delete(sessions)
      .where(
        or(
          // Revoked sessions older than 30 days
          and(eq(sessions.isActive, false), lt(sessions.revokedAt, thirtyDaysAgo)),
          // Inactive sessions older than 7 days
          and(eq(sessions.isActive, false), lt(sessions.lastActivityAt, sevenDaysAgo)),
          // Very old sessions (90+ days)
          lt(sessions.createdAt, ninetyDaysAgo)
        )
      );

    const count = result.rowCount || 0;
    logger.info('Sessions cleaned up', { count });
    return count;
  }
}

export const sessionService = new SessionService();
