import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';
import { getDb, passwordHistory, eq, desc, NewPasswordHistory } from '@lab404/database';
import { HIBPService } from './hibp.service';

/**
 * Password Security Service
 *
 * Handles password strength calculation, history tracking, and breach checking.
 * Enforces password reuse prevention and provides feedback on password quality.
 */

interface PasswordStrengthResult {
  score: number; // 0-4 (zxcvbn scale)
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTime: string; // Human-readable crack time estimate
  isBreached: boolean;
  breachCount: number;
  isReused: boolean;
}

interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strengthResult?: PasswordStrengthResult;
}

export class PasswordSecurityService {
  private static readonly HISTORY_LIMIT = 10; // Store last 10 passwords
  private static readonly MIN_STRENGTH_SCORE = 2; // Require at least score 2 (fair)

  /**
   * Calculate password strength using zxcvbn
   *
   * @param password - Plain text password
   * @param userInputs - Optional array of user-specific strings (email, name, etc.)
   * @returns Strength analysis
   */
  static async calculateStrength(
    password: string,
    userInputs?: string[]
  ): Promise<Omit<PasswordStrengthResult, 'isBreached' | 'breachCount' | 'isReused'>> {
    const result = zxcvbn(password, userInputs);

    return {
      score: result.score,
      feedback: {
        warning: result.feedback.warning || '',
        suggestions: result.feedback.suggestions || [],
      },
      crackTime: String(result.crack_times_display.offline_slow_hashing_1e4_per_second),
    };
  }

  /**
   * Check if password has been used before by this customer
   *
   * @param customerId - Customer ID
   * @param password - Plain text password to check
   * @returns True if password was used before
   */
  static async checkPasswordHistory(
    customerId: string,
    password: string
  ): Promise<boolean> {
    try {
      const db = getDb();

      // Get last N password hashes
      const history = await db
        .select()
        .from(passwordHistory)
        .where(eq(passwordHistory.customerId, customerId))
        .orderBy(desc(passwordHistory.changedAt))
        .limit(this.HISTORY_LIMIT);

      // Check if new password matches any previous hash
      for (const entry of history) {
        const matches = await bcrypt.compare(password, entry.passwordHash);
        if (matches) {
          return true; // Password was used before
        }
      }

      return false;
    } catch (error) {
      // Table doesn't exist or query failed - skip history check
      console.warn('Failed to check password history (table may not exist):', error);
      return false; // Allow password since we can't verify history
    }
  }

  /**
   * Record password change in history
   *
   * @param data - Password history entry data
   */
  static async recordPasswordChange(data: NewPasswordHistory): Promise<void> {
    try {
      const db = getDb();

      await db.insert(passwordHistory).values(data);

      // Keep only last N passwords
      const allHistory = await db
        .select()
        .from(passwordHistory)
        .where(eq(passwordHistory.customerId, data.customerId))
        .orderBy(desc(passwordHistory.changedAt));

      if (allHistory.length > this.HISTORY_LIMIT) {
        const idsToDelete = allHistory
          .slice(this.HISTORY_LIMIT)
          .map((entry) => entry.id);

        if (idsToDelete.length > 0 && idsToDelete[0]) {
          await db
            .delete(passwordHistory)
            .where(eq(passwordHistory.id, idsToDelete[0])); // Simplified for demo
        }
      }
    } catch (error) {
      // Table doesn't exist or insert failed - non-critical, just log warning
      // Password change will still succeed, history just won't be recorded
      console.warn('Failed to record password change (table may not exist):', error);
      // Don't throw - allow password change to succeed
    }
  }

  /**
   * Validate password with comprehensive checks
   *
   * @param password - Plain text password
   * @param customerId - Customer ID
   * @param userInputs - Optional array of user-specific strings
   * @returns Validation result with detailed feedback
   */
  static async validatePassword(
    password: string,
    customerId: string,
    userInputs?: string[]
  ): Promise<PasswordValidationResult> {
    const errors: string[] = [];

    // Basic length check
    if (password.length < 8) {
      errors.push('❌ Password Length: Must be at least 8 characters long. Current length: ' + password.length);
    }

    if (password.length > 100) {
      errors.push('❌ Password Length: Must not exceed 100 characters. Current length: ' + password.length);
    }

    // Calculate strength
    const strength = await this.calculateStrength(password, userInputs);

    if (strength.score < this.MIN_STRENGTH_SCORE) {
      const warningText = strength.feedback.warning || 'This password is too predictable.';
      errors.push(
        `🔒 Password Strength: Your password is too weak (${strength.score}/4). ${warningText}`
      );
      if (strength.feedback.suggestions.length > 0) {
        errors.push(`💡 Suggestions: ${strength.feedback.suggestions.join(' ')}`);
      }
    }

    // Check breach status
    const breachResult = await HIBPService.checkPassword(password, customerId);

    if (breachResult.isBreached) {
      const breachText = breachResult.breachCount > 1000
        ? `${(breachResult.breachCount / 1000).toFixed(1)}k+`
        : breachResult.breachCount.toString();

      errors.push(
        `⚠️ Security Alert: This password has been exposed in ${breachText} data breaches and is not safe to use. Please choose a unique password that you haven't used elsewhere.`
      );
    }

    // Check password history
    const isReused = await this.checkPasswordHistory(customerId, password);

    if (isReused) {
      errors.push('🔄 Password History: You\'ve used this password before. For security, please choose a new password you haven\'t used on this account.');
    }

    // Build complete strength result
    const strengthResult: PasswordStrengthResult = {
      ...strength,
      isBreached: breachResult.isBreached,
      breachCount: breachResult.breachCount,
      isReused,
    };

    return {
      isValid: errors.length === 0,
      errors,
      strengthResult,
    };
  }

  /**
   * Validate password without checking history (for new users)
   *
   * @param password - Plain text password
   * @param userInputs - Optional array of user-specific strings
   * @returns Validation result
   */
  static async validateNewPassword(
    password: string,
    userInputs?: string[]
  ): Promise<PasswordValidationResult> {
    const errors: string[] = [];

    // Basic length check
    if (password.length < 8) {
      errors.push('❌ Password Length: Must be at least 8 characters long. Current length: ' + password.length);
    }

    if (password.length > 100) {
      errors.push('❌ Password Length: Must not exceed 100 characters. Current length: ' + password.length);
    }

    // Calculate strength
    const strength = await this.calculateStrength(password, userInputs);

    if (strength.score < this.MIN_STRENGTH_SCORE) {
      const warningText = strength.feedback.warning || 'This password is too predictable.';
      errors.push(
        `🔒 Password Strength: Your password is too weak (${strength.score}/4). ${warningText}`
      );
      if (strength.feedback.suggestions.length > 0) {
        errors.push(`💡 Suggestions: ${strength.feedback.suggestions.join(' ')}`);
      }
    }

    // Check breach status (no customer ID for caching)
    const breachResult = await HIBPService.checkPassword(password);

    if (breachResult.isBreached) {
      const breachText = breachResult.breachCount > 1000
        ? `${(breachResult.breachCount / 1000).toFixed(1)}k+`
        : breachResult.breachCount.toString();

      errors.push(
        `⚠️ Security Alert: This password has been exposed in ${breachText} data breaches and is not safe to use. Please choose a unique password that you haven't used elsewhere.`
      );
    }

    const strengthResult: PasswordStrengthResult = {
      ...strength,
      isBreached: breachResult.isBreached,
      breachCount: breachResult.breachCount,
      isReused: false,
    };

    return {
      isValid: errors.length === 0,
      errors,
      strengthResult,
    };
  }
}
