import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthTokens, LoginRequest, LoginResponse, RegisterRequest } from '@/types/auth';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import { ROLE_PERMISSIONS, USER_ROLES } from '@/constants/roles';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private static readonly REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  private static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

  static async login(loginData: LoginRequest, deviceInfo: any): Promise<LoginResponse> {
    try {
      const UserModel = require('@/models/User').default;
      
      // Find user by email
      const user = await UserModel.findOne({ 
        email: loginData.email.toLowerCase() 
      }).select('+password');

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Create session
      const sessionId = uuidv4();
      const session = {
        id: sessionId,
        userId: user._id.toString(),
        deviceInfo,
        isActive: true,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        riskScore: this.calculateRiskScore(deviceInfo),
        securityFlags: [],
      };

      // Store session in cache
      await CacheService.set(
        `session:${sessionId}`, 
        JSON.stringify(session), 
        7 * 24 * 60 * 60 // 7 days in seconds
      );

      // Generate tokens
      const tokens = await this.generateTokens(user, sessionId);

      // Update user's last login
      await UserModel.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
      });

      // Cache user data
      const userData = user.toObject();
      delete userData.password;
      await CacheService.set(
        `user:${user._id}`, 
        JSON.stringify(userData), 
        15 * 60 // 15 minutes
      );

      // Check if this is first login
      const firstLogin = !user.lastLoginAt;

      logger.info(`User logged in: ${user.email}`, {
        userId: user._id,
        sessionId,
        deviceInfo,
      });

      return {
        user: userData,
        tokens,
        firstLogin,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  static async register(registerData: RegisterRequest): Promise<User> {
    try {
      const UserModel = require('@/models/User').default;

      // Check if user already exists
      const existingUser = await UserModel.findOne({ 
        email: registerData.email.toLowerCase() 
      });

      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerData.password, this.BCRYPT_ROUNDS);

      // Get role permissions
      const permissions = this.getRolePermissions(registerData.role);

      // Create user
      const user = new UserModel({
        email: registerData.email.toLowerCase(),
        password: hashedPassword,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: registerData.role,
        permissions,
        isActive: true,
        isVerified: false,
        preferences: this.getDefaultPreferences(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await user.save();

      // Remove password from response
      const userData = user.toObject();
      delete userData.password;

      logger.info(`User registered: ${user.email}`, {
        userId: user._id,
        role: user.role,
      });

      return userData;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  static async refreshToken(refreshToken: string, deviceInfo?: any): Promise<AuthTokens> {
    try {
      // Check if refresh token is blacklisted
      const isBlacklisted = await CacheService.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new Error('Token is blacklisted');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.REFRESH_SECRET) as any;
      
      // Check if session is still valid
      const sessionData = await CacheService.get(`session:${decoded.sessionId}`);
      if (!sessionData) {
        throw new Error('Session expired');
      }

      const session = JSON.parse(sessionData);
      if (!session.isActive) {
        throw new Error('Session is inactive');
      }

      // Validate device fingerprint if provided
      if (deviceInfo && session.deviceInfo) {
        const deviceMatch = this.validateDeviceFingerprint(session.deviceInfo, deviceInfo);
        if (!deviceMatch) {
          // Potential security threat - invalidate session
          await this.revokeSession(decoded.sessionId);
          throw new Error('Device fingerprint mismatch - session revoked for security');
        }
      }

      // Get user
      const UserModel = require('@/models/User').default;
      const user = await UserModel.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Blacklist old refresh token to prevent reuse
      const oldTokenTtl = decoded.exp - Math.floor(Date.now() / 1000);
      if (oldTokenTtl > 0) {
        await CacheService.set(`blacklist:${refreshToken}`, 'true', oldTokenTtl);
      }

      // Update session activity
      session.lastActivity = new Date().toISOString();
      await CacheService.set(`session:${decoded.sessionId}`, JSON.stringify(session), 7 * 24 * 60 * 60);

      // Generate new tokens
      const tokens = await this.generateTokens(user, decoded.sessionId);

      logger.info(`Token refreshed for user: ${user.email}`, {
        userId: user._id,
        sessionId: decoded.sessionId,
      });

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  static async logout(token: string, sessionId?: string): Promise<void> {
    try {
      // Add token to blacklist
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await CacheService.set(`blacklist:${token}`, 'true', ttl);
        }
      }

      // Invalidate session
      if (sessionId) {
        const sessionData = await CacheService.get(`session:${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.isActive = false;
          await CacheService.set(`session:${sessionId}`, JSON.stringify(session), 60); // Keep for 1 minute for audit
        }
      }

      logger.info('User logged out', { sessionId });
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  static async logoutAllSessions(userId: string): Promise<void> {
    try {
      // This would require a more sophisticated approach in production
      // For now, we'll invalidate the user cache and let sessions expire naturally
      await CacheService.del(`user:${userId}`);
      
      logger.info(`All sessions invalidated for user: ${userId}`);
    } catch (error) {
      logger.error('Logout all sessions error:', error);
      throw error;
    }
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const UserModel = require('@/models/User').default;
      
      const user = await UserModel.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

      // Update password
      await UserModel.findByIdAndUpdate(userId, {
        password: hashedNewPassword,
        updatedAt: new Date(),
      });

      // Invalidate all sessions for security
      await this.logoutAllSessions(userId);

      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      const UserModel = require('@/models/User').default;
      
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if user exists or not
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await CacheService.set(
        `password_reset:${resetToken}`, 
        user._id.toString(), 
        60 * 60 // 1 hour
      );

      // In a real application, you would send an email here
      // For now, we'll just log it
      logger.info(`Password reset token generated for user: ${email}`, {
        resetToken,
        userId: user._id,
      });

      // TODO: Send email with reset link
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  static async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      // Get user ID from reset token
      const userId = await CacheService.get(`password_reset:${token}`);
      if (!userId) {
        throw new Error('Invalid or expired reset token');
      }

      const UserModel = require('@/models/User').default;
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

      // Update password
      await UserModel.findByIdAndUpdate(userId, {
        password: hashedPassword,
        updatedAt: new Date(),
      });

      // Delete reset token
      await CacheService.del(`password_reset:${token}`);

      // Invalidate all sessions
      await this.logoutAllSessions(userId);

      logger.info(`Password reset completed for user: ${userId}`);
    } catch (error) {
      logger.error('Confirm password reset error:', error);
      throw error;
    }
  }

  private static async generateTokens(user: any, sessionId: string): Promise<AuthTokens> {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRES_IN,
    });

    const decoded = jwt.decode(accessToken) as any;
    const expiresAt = new Date(decoded.exp * 1000);

    return {
      accessToken,
      refreshToken,
      expiresAt,
      tokenType: 'Bearer',
    };
  }

  private static getRolePermissions(role: string): any[] {
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
    
    return permissions.map(permission => {
      const [resource, action] = permission.split(':');
      return {
        resource,
        actions: [action],
      };
    });
  }

  private static getDefaultPreferences(): any {
    return {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: {
          biasAlerts: true,
          candidateUpdates: true,
          interviewReminders: true,
          systemUpdates: false,
        },
        inApp: {
          biasAlerts: true,
          candidateUpdates: true,
          interviewReminders: true,
          systemUpdates: true,
        },
        frequency: 'immediate',
      },
      dashboard: {
        defaultView: 'overview',
        widgets: ['recent_activity', 'bias_alerts', 'candidate_pipeline'],
        layout: 'grid',
        refreshInterval: 300, // 5 minutes
      },
      privacy: {
        shareAnalytics: false,
        shareUsageData: false,
        allowCookies: true,
        dataRetention: 365, // 1 year
      },
    };
  }

  private static calculateRiskScore(deviceInfo: any): number {
    let riskScore = 0;

    // Check for suspicious patterns
    if (!deviceInfo.userAgent) riskScore += 0.2;
    if (!deviceInfo.ip) riskScore += 0.2;
    if (deviceInfo.location && deviceInfo.location.includes('unknown')) riskScore += 0.1;

    // Add more risk factors as needed
    return Math.min(riskScore, 1.0);
  }

  static async validateSession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await CacheService.get(`session:${sessionId}`);
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      return session.isActive && new Date(session.expiresAt) > new Date();
    } catch (error) {
      logger.error('Session validation error:', error);
      return false;
    }
  }

  static async getUserSessions(userId: string): Promise<any[]> {
    try {
      // In a production system, you'd want to maintain a user-to-sessions mapping
      // For now, this is a placeholder
      return [];
    } catch (error) {
      logger.error('Get user sessions error:', error);
      return [];
    }
  }

  static async revokeSession(sessionId: string): Promise<void> {
    try {
      const sessionData = await CacheService.get(`session:${sessionId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.isActive = false;
        await CacheService.set(`session:${sessionId}`, JSON.stringify(session), 60);
      }
    } catch (error) {
      logger.error('Revoke session error:', error);
      throw error;
    }
  }

  static async validateToken(token: string): Promise<{ valid: boolean; decoded?: any; reason?: string }> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await CacheService.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return { valid: false, reason: 'Token is blacklisted' };
      }

      // Verify token
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // Check if session is still valid
      const sessionValid = await this.validateSession(decoded.sessionId);
      if (!sessionValid) {
        return { valid: false, reason: 'Session expired or invalid' };
      }

      return { valid: true, decoded };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, reason: 'Token expired' };
      } else if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, reason: 'Invalid token' };
      }
      
      logger.error('Token validation error:', error);
      return { valid: false, reason: 'Token validation failed' };
    }
  }

  static async getTokenInfo(token: string): Promise<any> {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded) return null;

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
        timeToExpiry: decoded.exp - Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      logger.error('Get token info error:', error);
      return null;
    }
  }

  static async createApiKey(userId: string, name: string, permissions: string[], expiresIn?: string): Promise<{ apiKey: string; keyId: string }> {
    try {
      const keyId = uuidv4();
      const apiKey = jwt.sign(
        {
          userId,
          keyId,
          name,
          permissions,
          type: 'api_key'
        },
        this.JWT_SECRET,
        expiresIn ? { expiresIn } : {}
      );

      // Store API key metadata
      const keyMetadata = {
        keyId,
        userId,
        name,
        permissions,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        isActive: true
      };

      await CacheService.set(
        `api_key:${keyId}`,
        JSON.stringify(keyMetadata),
        expiresIn ? this.parseExpiresIn(expiresIn) : 365 * 24 * 60 * 60 // 1 year default
      );

      logger.info(`API key created for user: ${userId}`, { keyId, name });

      return { apiKey, keyId };
    } catch (error) {
      logger.error('Create API key error:', error);
      throw error;
    }
  }

  static async revokeApiKey(keyId: string): Promise<void> {
    try {
      const keyData = await CacheService.get(`api_key:${keyId}`);
      if (keyData) {
        const metadata = JSON.parse(keyData);
        metadata.isActive = false;
        await CacheService.set(`api_key:${keyId}`, JSON.stringify(metadata), 60);
      }
    } catch (error) {
      logger.error('Revoke API key error:', error);
      throw error;
    }
  }

  private static validateDeviceFingerprint(storedDevice: any, currentDevice: any): boolean {
    // Simple device fingerprint validation
    // In production, you'd use more sophisticated fingerprinting
    const criticalFields = ['userAgent', 'screenResolution', 'timezone'];
    
    for (const field of criticalFields) {
      if (storedDevice[field] && currentDevice[field] && storedDevice[field] !== currentDevice[field]) {
        return false;
      }
    }
    
    return true;
  }

  private static parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // 1 hour default

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 3600;
    }
  }
}