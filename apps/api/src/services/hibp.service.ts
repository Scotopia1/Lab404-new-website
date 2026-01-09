import crypto from 'crypto';
import { getDb, breachChecks, eq } from '@lab404/database';

/**
 * Have I Been Pwned (HIBP) Service
 *
 * Checks passwords against the HIBP Pwned Passwords API using k-anonymity.
 * This ensures password privacy by only sending the first 5 characters of the SHA-1 hash.
 *
 * API Documentation: https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

interface BreachCheckResult {
  isBreached: boolean;
  breachCount: number;
  cached: boolean;
}

export class HIBPService {
  private static readonly HIBP_API_URL = 'https://api.pwnedpasswords.com/range';
  private static readonly CACHE_DURATION_DAYS = 30;

  /**
   * Check if a password has been found in data breaches
   * Uses k-anonymity to protect password privacy
   *
   * @param password - Plain text password to check
   * @param customerId - Optional customer ID for caching
   * @returns Breach status and count
   */
  static async checkPassword(
    password: string,
    customerId?: string
  ): Promise<BreachCheckResult> {
    // Generate SHA-1 hash of password
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const hashPrefix = hash.substring(0, 5);
    const hashSuffix = hash.substring(5);

    // Check cache first if customer ID provided
    if (customerId) {
      const cachedResult = await this.getCachedResult(customerId, hashPrefix);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Query HIBP API with hash prefix (k-anonymity)
    try {
      const response = await fetch(`${this.HIBP_API_URL}/${hashPrefix}`, {
        headers: {
          'User-Agent': 'Lab404-Electronics-Auth-System',
        },
      });

      if (!response.ok) {
        // If HIBP is down, gracefully degrade (allow password but log warning)
        console.warn(`HIBP API returned ${response.status}, allowing password by default`);
        return { isBreached: false, breachCount: 0, cached: false };
      }

      const body = await response.text();
      const lines = body.split('\n');

      // Check if our hash suffix appears in the results
      let breachCount = 0;
      for (const line of lines) {
        const [suffix, count] = line.split(':');
        if (suffix.trim() === hashSuffix) {
          breachCount = parseInt(count.trim(), 10);
          break;
        }
      }

      const result: BreachCheckResult = {
        isBreached: breachCount > 0,
        breachCount,
        cached: false,
      };

      // Cache result if customer ID provided
      if (customerId) {
        await this.setCachedResult(customerId, hashPrefix, result);
      }

      return result;
    } catch (error) {
      // Network error or API unavailable - gracefully degrade
      console.error('HIBP API check failed:', error);
      return { isBreached: false, breachCount: 0, cached: false };
    }
  }

  /**
   * Get cached breach check result
   *
   * @param customerId - Customer ID
   * @param hashPrefix - First 5 characters of SHA-1 hash
   * @returns Cached result if valid, null otherwise
   */
  private static async getCachedResult(
    customerId: string,
    hashPrefix: string
  ): Promise<BreachCheckResult | null> {
    const db = getDb();

    const cached = await db
      .select()
      .from(breachChecks)
      .where(eq(breachChecks.customerId, customerId))
      .where(eq(breachChecks.passwordHashPrefix, hashPrefix))
      .limit(1);

    if (cached.length === 0) {
      return null;
    }

    const check = cached[0];

    // Check if cache is still valid
    if (new Date() > check.expiresAt) {
      return null;
    }

    return {
      isBreached: check.isBreached,
      breachCount: check.breachCount,
      cached: true,
    };
  }

  /**
   * Cache breach check result
   *
   * @param customerId - Customer ID
   * @param hashPrefix - First 5 characters of SHA-1 hash
   * @param result - Breach check result to cache
   */
  private static async setCachedResult(
    customerId: string,
    hashPrefix: string,
    result: BreachCheckResult
  ): Promise<void> {
    const db = getDb();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.CACHE_DURATION_DAYS);

    try {
      await db.insert(breachChecks).values({
        customerId,
        passwordHashPrefix: hashPrefix,
        isBreached: result.isBreached,
        breachCount: result.breachCount,
        expiresAt,
        checkReason: 'password_change',
      });
    } catch (error) {
      // Cache insertion failed - non-critical, just log
      console.warn('Failed to cache HIBP result:', error);
    }
  }

  /**
   * Clean up expired cache entries
   * Should be called periodically via cron job
   */
  static async cleanupExpiredCache(): Promise<number> {
    const db = getDb();

    try {
      const result = await db
        .delete(breachChecks)
        .where(eq(breachChecks.expiresAt, new Date()));

      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to cleanup expired breach checks:', error);
      return 0;
    }
  }
}
