import type { UUID, ISODateString } from './common';

// ===========================================
// Auth Enums
// ===========================================

export type UserRole = 'customer' | 'admin';

// ===========================================
// Auth Types
// ===========================================

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  customerId?: UUID;
  sessionId?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: ISODateString;
}

// ===========================================
// Auth Input Types
// ===========================================

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing?: boolean;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ===========================================
// Auth Response Types
// ===========================================

export interface AuthResponse {
  user: AuthUser;
  token: string;
  expiresAt: ISODateString;
}

export interface TokenValidation {
  valid: boolean;
  user?: AuthUser;
  error?: string;
}
