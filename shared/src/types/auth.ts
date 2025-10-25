// Authentication and Authorization Types

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  
  // Profile information
  avatar?: string;
  department?: string;
  title?: string;
  phone?: string;
  organizationId?: string;
  
  // Account status
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  
  // Preferences
  preferences: UserPreferences;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'candidate'
  | 'recruiter'
  | 'hiring_manager'
  | 'admin'
  | 'ethics_officer'
  | 'system_admin';

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, unknown>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  email: {
    biasAlerts: boolean;
    candidateUpdates: boolean;
    interviewReminders: boolean;
    systemUpdates: boolean;
  };
  inApp: {
    biasAlerts: boolean;
    candidateUpdates: boolean;
    interviewReminders: boolean;
    systemUpdates: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface DashboardPreferences {
  defaultView: string;
  widgets: string[];
  layout: 'grid' | 'list';
  refreshInterval: number; // seconds
}

export interface PrivacyPreferences {
  shareAnalytics: boolean;
  shareUsageData: boolean;
  allowCookies: boolean;
  dataRetention: number; // days
}

// Authentication tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: 'Bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  firstLogin: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  invitationCode?: string;
}

// Consent Management
export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  version: string;
  
  // Details
  purpose: string;
  dataTypes: string[];
  retentionPeriod: number; // days
  
  // Legal basis
  legalBasis: LegalBasis;
  jurisdiction: string;
  
  // Timestamps
  grantedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ConsentType = 
  | 'data_processing'
  | 'ai_analysis'
  | 'profile_sharing'
  | 'marketing'
  | 'analytics'
  | 'third_party_sharing';

export type LegalBasis = 
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests';

// Session Management
export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    location?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
  };
  
  // Session details
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  
  // Security
  riskScore: number; // 0-1, higher is riskier
  securityFlags: string[];
}