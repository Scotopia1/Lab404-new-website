/**
 * Password Security Types
 *
 * TypeScript types for password strength checking, breach detection,
 * and login attempt tracking.
 */

export interface PasswordStrengthResult {
  score: number; // 0-4 (zxcvbn scale: 0=weak, 4=strong)
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTime: string; // Human-readable crack time estimate
  isBreached: boolean;
  breachCount: number;
  isReused: boolean;
}

export interface LoginAttempt {
  id: string;
  customerId: string | null;
  email: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string;
  userAgent: string | null;
  deviceType: string | null;
  deviceBrowser: string | null;
  ipCountry: string | null;
  ipCity: string | null;
  triggeredLockout: boolean;
  consecutiveFailures: number;
  attemptedAt: Date;
}

export interface LockoutStatus {
  isLocked: boolean;
  lockoutEndTime?: Date;
  consecutiveFailures: number;
  remainingTime?: number; // milliseconds
}

export interface PasswordCheckRequest {
  password: string;
  email?: string;
  customerId?: string;
}

export interface PasswordCheckResponse extends PasswordStrengthResult {}

/**
 * Password strength score descriptions
 */
export const PASSWORD_STRENGTH_LABELS: Record<number, string> = {
  0: 'Very Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
};

/**
 * Password strength colors (for UI)
 */
export const PASSWORD_STRENGTH_COLORS: Record<number, string> = {
  0: 'red',
  1: 'orange',
  2: 'yellow',
  3: 'lime',
  4: 'green',
};
