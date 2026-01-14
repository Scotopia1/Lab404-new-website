import { getDb, verificationCodes, VerificationCodeType, eq, and, gte, desc, or, lte } from '@lab404/database';
import { generateVerificationCode } from '../utils/crypto';
import { BadRequestError, TooManyRequestsError } from '../utils/errors';
import { logger } from '../utils/logger';

interface CreateCodeOptions {
  email: string;
  type: VerificationCodeType;
  ipAddress?: string;
  expiryMinutes?: number;
}

interface ValidateCodeOptions {
  email: string;
  code: string;
  type: VerificationCodeType;
}

class VerificationCodeService {
  private readonly DEFAULT_EXPIRY_MINUTES = 15;
  private readonly MAX_ATTEMPTS = 10;

  /**
   * Generate and store a new verification code
   * Invalidates any existing unused codes for the same email/type
   */
  async createCode(options: CreateCodeOptions): Promise<string> {
    const { email, type, ipAddress, expiryMinutes = this.DEFAULT_EXPIRY_MINUTES } = options;
    const db = getDb();

    // Invalidate any existing unused codes for this email/type
    await this.invalidateCodes(email, type);

    // Generate 6-digit code
    const code = generateVerificationCode();

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    // Store in database
    await db.insert(verificationCodes).values({
      email: email.toLowerCase(),
      code,
      type,
      expiresAt,
      ipAddress,
      maxAttempts: this.MAX_ATTEMPTS,
    });

    logger.info('Verification code created', { email, type, expiresAt });
    return code;
  }

  /**
   * Validate a verification code
   * Tracks attempts and enforces expiration
   */
  async validateCode(options: ValidateCodeOptions): Promise<boolean> {
    const { email, code, type } = options;
    const db = getDb();
    const now = new Date();

    // Find the most recent active code for this email/type
    const [record] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, email.toLowerCase()),
          eq(verificationCodes.type, type),
          eq(verificationCodes.isUsed, false),
          gte(verificationCodes.expiresAt, now)
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1);

    if (!record) {
      logger.warn('Verification code not found or expired', { email, type });
      throw new BadRequestError('Invalid or expired verification code');
    }

    // Check if max attempts exceeded
    if (record.attempts >= record.maxAttempts) {
      logger.warn('Max verification attempts exceeded', { email, type, attempts: record.attempts });
      throw new TooManyRequestsError('Maximum verification attempts exceeded. Please request a new code.');
    }

    // Increment attempts
    await db
      .update(verificationCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(verificationCodes.id, record.id));

    // Validate code
    if (record.code !== code) {
      logger.warn('Invalid verification code attempt', { email, type, attempts: record.attempts + 1 });
      throw new BadRequestError('Invalid verification code');
    }

    // Mark as used
    await db
      .update(verificationCodes)
      .set({
        isUsed: true,
        usedAt: now,
      })
      .where(eq(verificationCodes.id, record.id));

    logger.info('Verification code validated successfully', { email, type });
    return true;
  }

  /**
   * Validate a verification code without marking it as used
   * Use this when you need to perform additional operations before marking as used
   * Tracks attempts and enforces expiration
   */
  async validateCodeWithoutMarking(options: ValidateCodeOptions): Promise<boolean> {
    const { email, code, type } = options;
    const db = getDb();
    const now = new Date();

    // Find the most recent active code for this email/type
    const [record] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, email.toLowerCase()),
          eq(verificationCodes.type, type),
          eq(verificationCodes.isUsed, false),
          gte(verificationCodes.expiresAt, now)
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1);

    if (!record) {
      logger.warn('Verification code not found or expired', { email, type });
      throw new BadRequestError('Invalid or expired verification code');
    }

    // Check if max attempts exceeded
    if (record.attempts >= record.maxAttempts) {
      logger.warn('Max verification attempts exceeded', { email, type, attempts: record.attempts });
      throw new TooManyRequestsError('Maximum verification attempts exceeded. Please request a new code.');
    }

    // Increment attempts
    await db
      .update(verificationCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(verificationCodes.id, record.id));

    // Validate code
    if (record.code !== code) {
      logger.warn('Invalid verification code attempt', { email, type, attempts: record.attempts + 1 });
      throw new BadRequestError('Invalid verification code');
    }

    logger.info('Verification code validated (not marked as used yet)', { email, type });
    return true;
  }

  /**
   * Mark a validated verification code as used
   * Call this after validateCodeWithoutMarking() once the operation succeeds
   */
  async markCodeAsUsed(email: string, type: VerificationCodeType): Promise<void> {
    const db = getDb();
    const now = new Date();

    // Find the most recent active code for this email/type
    const [record] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, email.toLowerCase()),
          eq(verificationCodes.type, type),
          eq(verificationCodes.isUsed, false),
          gte(verificationCodes.expiresAt, now)
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1);

    if (record) {
      await db
        .update(verificationCodes)
        .set({
          isUsed: true,
          usedAt: now,
        })
        .where(eq(verificationCodes.id, record.id));

      logger.info('Verification code marked as used', { email, type });
    }
  }

  /**
   * Invalidate all unused codes for a specific email/type
   */
  async invalidateCodes(email: string, type: VerificationCodeType): Promise<void> {
    const db = getDb();
    const now = new Date();

    const result = await db
      .update(verificationCodes)
      .set({ isUsed: true, usedAt: now })
      .where(
        and(
          eq(verificationCodes.email, email.toLowerCase()),
          eq(verificationCodes.type, type),
          eq(verificationCodes.isUsed, false)
        )
      )
      .returning({ id: verificationCodes.id });

    if (result.length > 0) {
      logger.info('Invalidated existing verification codes', {
        email,
        type,
        count: result.length
      });
    }
  }

  /**
   * Cleanup expired and used verification codes
   * Called by cron job
   */
  async cleanupExpiredCodes(): Promise<number> {
    const db = getDb();
    const now = new Date();

    // Delete codes that are:
    // 1. Expired for more than 24 hours, OR
    // 2. Used and usedAt is more than 24 hours ago
    const cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const deleted = await db
      .delete(verificationCodes)
      .where(
        or(
          lte(verificationCodes.expiresAt, cutoffDate),
          and(
            eq(verificationCodes.isUsed, true),
            lte(verificationCodes.usedAt, cutoffDate)
          )
        )
      )
      .returning({ id: verificationCodes.id });

    logger.info('Verification codes cleanup completed', {
      deletedCount: deleted.length
    });

    return deleted.length;
  }
}

export const verificationCodeService = new VerificationCodeService();
