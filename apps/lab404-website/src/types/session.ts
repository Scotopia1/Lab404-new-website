export interface Session {
  id: string;
  customerId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceBrowser: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  ipAddress: string;
  ipCity: string | null;
  ipCountry: string | null;
  loginAt: string;
  lastActivityAt: string;
  isActive: boolean;
  isCurrent: boolean; // Computed server-side
}

export interface SessionListResponse {
  sessions: Session[];
  currentSessionId: string;
}

export interface RevokeSessionResponse {
  message: string;
}

export interface LogoutOthersResponse {
  message: string;
  count: number;
}
