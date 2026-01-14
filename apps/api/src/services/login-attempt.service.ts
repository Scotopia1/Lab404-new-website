import { getDb, loginAttempts, customers, eq, desc, and, gte, NewLoginAttempt } from '@lab404/database';
import { auditLogService } from './audit-log.service';
import { SecurityEventType, ActorType, EventStatus } from '../types/audit-events';

/**
 * Login Attempt Service
 *
 * Tracks login attempts and manages account lockouts.
 * Implements exponential backoff and automatic lockout after repeated failures.
 */

interface LockoutStatus {
  isLocked: boolean;
  lockoutEndTime?: Date;
  consecutiveFailures: number;
  remainingTime?: number; // milliseconds
}

interface DeviceInfo {
  deviceType?: string;
  deviceBrowser?: string;
  ipAddress: string;
  userAgent?: string;
  ipCountry?: string;
  ipCity?: string;
}

export class LoginAttemptService {
  private static readonly MAX_ATTEMPTS = 5; // Lock after 5 failures
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly ATTEMPT_WINDOW_MS = 30 * 60 * 1000; // 30-minute window for counting attempts

  /**
   * Record a login attempt
   *
   * @param email - Email address attempted
   * @param success - Whether login was successful
   * @param customerId - Customer ID (if successful)
   * @param failureReason - Reason for failure (if unsuccessful)
   * @param deviceInfo - Device and network information
   */
  static async recordAttempt(
    email: string,
    success: boolean,
    customerId: string | null,
    failureReason: string | null,
    deviceInfo: DeviceInfo
  ): Promise<void> {
    const db = getDb();

    // Get consecutive failures in the attempt window
    const recentFailures = await this.getRecentFailures(email);
    const consecutiveFailures = success ? 0 : recentFailures + 1;

    // Check if this attempt triggers a lockout
    const triggeredLockout = !success && consecutiveFailures >= this.MAX_ATTEMPTS;

    // Record the attempt
    const attemptData: NewLoginAttempt = {
      customerId: customerId || undefined,
      email,
      success,
      failureReason: failureReason || undefined,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceType: deviceInfo.deviceType,
      deviceBrowser: deviceInfo.deviceBrowser,
      ipCountry: deviceInfo.ipCountry,
      ipCity: deviceInfo.ipCity,
      triggeredLockout,
      consecutiveFailures,
    };

    await db.insert(loginAttempts).values(attemptData);

    // If lockout triggered and we have a customer ID, update customer record
    if (triggeredLockout && customerId) {
      await this.lockAccount(customerId);
    }
  }

  /**
   * Check if an account is currently locked
   *
   * @param email - Email address to check
   * @returns Lockout status
   */
  static async checkLockoutStatus(email: string): Promise<LockoutStatus> {
    const db = getDb();

    // Get the most recent lockout trigger
    const recentAttempts = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.triggeredLockout, true)
        )
      )
      .orderBy(desc(loginAttempts.attemptedAt))
      .limit(1);

    const lastLockout = recentAttempts[0];
    if (!lastLockout) {
      return {
        isLocked: false,
        consecutiveFailures: await this.getRecentFailures(email),
      };
    }

    const lockoutEndTime = new Date(
      lastLockout.attemptedAt.getTime() + this.LOCKOUT_DURATION_MS
    );
    const now = new Date();

    // Check if lockout has expired
    if (now >= lockoutEndTime) {
      return {
        isLocked: false,
        consecutiveFailures: 0, // Reset after lockout expires
      };
    }

    return {
      isLocked: true,
      lockoutEndTime,
      consecutiveFailures: lastLockout.consecutiveFailures,
      remainingTime: lockoutEndTime.getTime() - now.getTime(),
    };
  }

  /**
   * Get count of recent failed attempts in the attempt window
   *
   * @param email - Email address
   * @returns Number of consecutive failures
   */
  private static async getRecentFailures(email: string): Promise<number> {
    const db = getDb();
    const windowStart = new Date(Date.now() - this.ATTEMPT_WINDOW_MS);

    const recentAttempts = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          gte(loginAttempts.attemptedAt, windowStart)
        )
      )
      .orderBy(desc(loginAttempts.attemptedAt));

    // Count consecutive failures from most recent
    let failures = 0;
    for (const attempt of recentAttempts) {
      if (attempt.success) {
        break; // Stop at first success
      }
      failures++;
    }

    return failures;
  }

  /**
   * Clear failed attempts after successful login
   *
   * @param email - Email address
   */
  static async clearFailedAttempts(email: string): Promise<void> {
    // Successful login is recorded, which breaks the consecutive failure chain
    // No need to delete old attempts - they provide audit trail
    // The getRecentFailures() method will return 0 after a successful login

    // However, we should unlock the customer account if it was locked
    const db = getDb();
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    const foundCustomer = customer[0];
    if (foundCustomer && foundCustomer.accountLocked) {
      await db
        .update(customers)
        .set({
          accountLocked: false,
          accountLockedAt: null,
          accountLockedReason: null,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, foundCustomer.id));
    }
  }

  /**
   * Lock a customer account
   *
   * @param customerId - Customer ID to lock
   */
  private static async lockAccount(customerId: string): Promise<void> {
    const db = getDb();

    // Get customer email for audit logging
    const [customer] = await db
      .select({ email: customers.email })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    await db
      .update(customers)
      .set({
        accountLocked: true,
        accountLockedAt: new Date(),
        accountLockedReason: 'Too many failed login attempts',
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    // Log account locked event
    if (customer) {
      await auditLogService.log({
        eventType: SecurityEventType.ACCOUNT_LOCKED,
        actorType: ActorType.SYSTEM,
        actorId: customerId,
        actorEmail: customer.email,
        action: 'account_lockout',
        status: EventStatus.SUCCESS,
        metadata: {
          reason: 'too_many_failed_attempts',
          lockoutDuration: '15_minutes',
        },
      });
    }
  }

  /**
   * Get login attempt history for a customer
   *
   * @param customerId - Customer ID
   * @param limit - Maximum number of attempts to return
   * @returns Array of login attempts
   */
  static async getAttemptHistory(
    customerId: string,
    limit: number = 50
  ): Promise<typeof loginAttempts.$inferSelect[]> {
    const db = getDb();

    return await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.customerId, customerId))
      .orderBy(desc(loginAttempts.attemptedAt))
      .limit(limit);
  }

  /**
   * Admin: Unlock a customer account
   *
   * @param customerId - Customer ID to unlock
   */
  static async unlockAccount(customerId: string): Promise<void> {
    const db = getDb();

    // Get customer email for audit logging
    const [customer] = await db
      .select({ email: customers.email })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    await db
      .update(customers)
      .set({
        accountLocked: false,
        accountLockedAt: null,
        accountLockedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    // Log account unlocked event
    if (customer) {
      await auditLogService.log({
        eventType: SecurityEventType.ACCOUNT_UNLOCKED,
        actorType: ActorType.ADMIN,
        targetType: 'customer',
        targetId: customerId,
        action: 'account_unlock',
        status: EventStatus.SUCCESS,
        metadata: {
          method: 'admin_action',
        },
      });
    }
  }

  /**
   * Format remaining lockout time for display
   *
   * @param milliseconds - Remaining time in milliseconds
   * @returns Human-readable time string
   */
  static formatRemainingTime(milliseconds: number): string {
    const minutes = Math.ceil(milliseconds / 60000);
    if (minutes === 1) {
      return '1 minute';
    }
    return `${minutes} minutes`;
  }
}
