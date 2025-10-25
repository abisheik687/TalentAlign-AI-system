import { ConsentService } from '@/services/ConsentService';
import { PrivacyService } from '@/services/PrivacyService';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import crypto from 'crypto';

export interface DataOwnershipRequest {
  userId: string;
  requestType: DataOwnershipRequestType;
  dataTypes?: string[];
  reason?: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
}

export interface DataOwnershipResponse {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedCompletion?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

export type DataOwnershipRequestType = 
  | 'access_request'
  | 'portability_request'
  | 'rectification_request'
  | 'erasure_request'
  | 'restriction_request'
  | 'objection_request';

export interface DataInventory {
  userId: string;
  dataCategories: DataCategory[];
  totalSize: number;
  lastUpdated: Date;
  retentionSchedule: RetentionScheduleItem[];
}

export interface DataCategory {
  category: string;
  description: string;
  dataTypes: string[];
  size: number;
  location: string[];
  purpose: string[];
  legalBasis: string;
  retentionPeriod: number;
  canBeDeleted: boolean;
  canBeExported: boolean;
  lastAccessed?: Date;
}

export interface RetentionScheduleItem {
  dataType: string;
  retentionPeriod: number;
  deletionDate: Date;
  legalBasis: string;
  canExtend: boolean;
  extensionReason?: string;
}

export interface DataLineage {
  dataId: string;
  sourceSystem: string;
  createdAt: Date;
  lastModified: Date;
  transformations: DataTransformation[];
  accessLog: DataAccessLog[];
  sharingLog: DataSharingLog[];
}

export interface DataTransformation {
  id: string;
  type: 'anonymization' | 'pseudonymization' | 'aggregation' | 'filtering';
  timestamp: Date;
  description: string;
  reversible: boolean;
  algorithm?: string;
}

export interface DataAccessLog {
  timestamp: Date;
  accessor: string;
  purpose: string;
  dataFields: string[];
  consentValid: boolean;
  ipAddress?: string;
}

export interface DataSharingLog {
  timestamp: Date;
  recipient: string;
  purpose: string;
  dataFields: string[];
  legalBasis: string;
  consentGiven: boolean;
  retentionPeriod?: number;
}

export class DataOwnershipService {
  /**
   * Process data ownership request (GDPR Articles 15-21)
   */
  static async processDataOwnershipRequest(
    request: DataOwnershipRequest
  ): Promise<DataOwnershipResponse> {
    try {
      const requestId = crypto.randomUUID();
      
      // Validate user identity and consent
      const isValidRequest = await this.validateOwnershipRequest(request);
      if (!isValidRequest.valid) {
        throw new Error(`Invalid request: ${isValidRequest.reason}`);
      }

      // Process based on request type
      let response: DataOwnershipResponse;
      
      switch (request.requestType) {
        case 'access_request':
          response = await this.processAccessRequest(requestId, request);
          break;
        case 'portability_request':
          response = await this.processPortabilityRequest(requestId, request);
          break;
        case 'rectification_request':
          response = await this.processRectificationRequest(requestId, request);
          break;
        case 'erasure_request':
          response = await this.processErasureRequest(requestId, request);
          break;
        case 'restriction_request':
          response = await this.processRestrictionRequest(requestId, request);
          break;
        case 'objection_request':
          response = await this.processObjectionRequest(requestId, request);
          break;
        default:
          throw new Error(`Unsupported request type: ${request.requestType}`);
      }

      // Log the request for audit
      await this.logOwnershipRequest(requestId, request, response);

      return response;
    } catch (error) {
      logger.error('Error processing data ownership request:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive data inventory for user
   */
  static async getUserDataInventory(userId: string): Promise<DataInventory> {
    try {
      // Collect data from all systems
      const dataCategories = await this.collectUserDataCategories(userId);
      
      // Calculate total size
      const totalSize = dataCategories.reduce((sum, category) => sum + category.size, 0);
      
      // Generate retention schedule
      const retentionSchedule = await this.generateRetentionSchedule(userId, dataCategories);

      const inventory: DataInventory = {
        userId,
        dataCategories,
        totalSize,
        lastUpdated: new Date(),
        retentionSchedule,
      };

      // Cache inventory for performance
      await CacheService.set(
        `data_inventory:${userId}`,
        JSON.stringify(inventory),
        24 * 60 * 60 // Cache for 24 hours
      );

      return inventory;
    } catch (error) {
      logger.error('Error getting user data inventory:', error);
      throw error;
    }
  }

  /**
   * Get data lineage for specific data item
   */
  static async getDataLineage(dataId: string, userId: string): Promise<DataLineage> {
    try {
      // Verify user owns this data
      const ownsData = await this.verifyDataOwnership(dataId, userId);
      if (!ownsData) {
        throw new Error('User does not own this data');
      }

      // Collect lineage information
      const lineage = await this.collectDataLineage(dataId);
      
      return lineage;
    } catch (error) {
      logger.error('Error getting data lineage:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic data deletion
   */
  static async scheduleAutomaticDeletion(
    userId: string,
    dataTypes: string[],
    deletionDate: Date,
    reason: string
  ): Promise<{
    scheduleId: string;
    scheduledItems: string[];
    deletionDate: Date;
  }> {
    try {
      const scheduleId = crypto.randomUUID();
      
      // Validate deletion is allowed
      for (const dataType of dataTypes) {
        const canDelete = await this.canScheduleDeletion(userId, dataType, deletionDate);
        if (!canDelete.allowed) {
          throw new Error(`Cannot schedule deletion for ${dataType}: ${canDelete.reason}`);
        }
      }

      // Create deletion schedule
      const schedule = {
        scheduleId,
        userId,
        dataTypes,
        deletionDate,
        reason,
        status: 'scheduled',
        createdAt: new Date(),
      };

      // Store schedule
      await CacheService.set(
        `deletion_schedule:${scheduleId}`,
        JSON.stringify(schedule),
        Math.floor((deletionDate.getTime() - Date.now()) / 1000) + 86400 // Until deletion + 1 day
      );

      // Log scheduling
      logger.info('Automatic deletion scheduled', {
        scheduleId,
        userId,
        dataTypes,
        deletionDate,
        reason,
      });

      return {
        scheduleId,
        scheduledItems: dataTypes,
        deletionDate,
      };
    } catch (error) {
      logger.error('Error scheduling automatic deletion:', error);
      throw error;
    }
  }

  /**
   * Manage data sharing permissions
   */
  static async manageDataSharing(
    userId: string,
    recipientId: string,
    dataTypes: string[],
    purpose: string,
    duration?: number,
    restrictions?: string[]
  ): Promise<{
    sharingId: string;
    permissions: DataSharingPermission[];
    expiresAt?: Date;
  }> {
    try {
      const sharingId = crypto.randomUUID();
      
      // Validate sharing request
      const canShare = await this.validateDataSharing(userId, recipientId, dataTypes, purpose);
      if (!canShare.allowed) {
        throw new Error(`Data sharing not allowed: ${canShare.reason}`);
      }

      // Create sharing permissions
      const permissions: DataSharingPermission[] = dataTypes.map(dataType => ({
        dataType,
        recipient: recipientId,
        purpose,
        grantedAt: new Date(),
        expiresAt: duration ? new Date(Date.now() + duration * 1000) : undefined,
        restrictions: restrictions || [],
        status: 'active',
      }));

      // Store permissions
      await CacheService.set(
        `data_sharing:${sharingId}`,
        JSON.stringify({
          sharingId,
          userId,
          recipientId,
          permissions,
          createdAt: new Date(),
        }),
        duration || 365 * 24 * 60 * 60 // Default 1 year or specified duration
      );

      // Log sharing
      await this.logDataSharing(userId, recipientId, dataTypes, purpose, sharingId);

      return {
        sharingId,
        permissions,
        expiresAt: duration ? new Date(Date.now() + duration * 1000) : undefined,
      };
    } catch (error) {
      logger.error('Error managing data sharing:', error);
      throw error;
    }
  }

  /**
   * Revoke data sharing permissions
   */
  static async revokeDataSharing(
    userId: string,
    sharingId: string,
    reason?: string
  ): Promise<void> {
    try {
      // Get sharing record
      const sharingData = await CacheService.get(`data_sharing:${sharingId}`);
      if (!sharingData) {
        throw new Error('Sharing record not found');
      }

      const sharing = JSON.parse(sharingData);
      
      // Verify ownership
      if (sharing.userId !== userId) {
        throw new Error('User does not own this sharing permission');
      }

      // Update permissions to revoked
      sharing.permissions.forEach((permission: DataSharingPermission) => {
        permission.status = 'revoked';
        permission.revokedAt = new Date();
        permission.revocationReason = reason;
      });

      // Update cache
      await CacheService.set(
        `data_sharing:${sharingId}`,
        JSON.stringify(sharing),
        60 * 60 // Keep for 1 hour for audit
      );

      // Log revocation
      logger.info('Data sharing revoked', {
        sharingId,
        userId,
        reason,
        revokedAt: new Date(),
      });
    } catch (error) {
      logger.error('Error revoking data sharing:', error);
      throw error;
    }
  }

  /**
   * Get user's data sharing history
   */
  static async getDataSharingHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DataSharingRecord[]> {
    try {
      // This would query the data sharing log database
      // For now, return a placeholder structure
      const history: DataSharingRecord[] = [];
      
      // In a real implementation, you would:
      // 1. Query sharing logs from database
      // 2. Filter by date range if provided
      // 3. Include sharing status and permissions
      
      return history;
    } catch (error) {
      logger.error('Error getting data sharing history:', error);
      throw error;
    }
  }

  /**
   * Generate data ownership report
   */
  static async generateOwnershipReport(
    userId: string
  ): Promise<{
    reportId: string;
    userId: string;
    generatedAt: Date;
    dataInventory: DataInventory;
    consentStatus: ConsentStatusSummary;
    sharingPermissions: DataSharingRecord[];
    retentionSchedule: RetentionScheduleItem[];
    recommendations: string[];
  }> {
    try {
      const reportId = crypto.randomUUID();
      
      // Collect all ownership data
      const dataInventory = await this.getUserDataInventory(userId);
      const consentStatus = await this.getConsentStatusSummary(userId);
      const sharingPermissions = await this.getDataSharingHistory(userId);
      
      // Generate recommendations
      const recommendations = await this.generateOwnershipRecommendations(
        dataInventory,
        consentStatus,
        sharingPermissions
      );

      const report = {
        reportId,
        userId,
        generatedAt: new Date(),
        dataInventory,
        consentStatus,
        sharingPermissions,
        retentionSchedule: dataInventory.retentionSchedule,
        recommendations,
      };

      // Cache report
      await CacheService.set(
        `ownership_report:${reportId}`,
        JSON.stringify(report),
        7 * 24 * 60 * 60 // Keep for 7 days
      );

      return report;
    } catch (error) {
      logger.error('Error generating ownership report:', error);
      throw error;
    }
  }

  // Private helper methods

  private static async validateOwnershipRequest(
    request: DataOwnershipRequest
  ): Promise<{ valid: boolean; reason?: string }> {
    // Validate user exists and is active
    const UserModel = require('@/models/User').default;
    const user = await UserModel.findById(request.userId);
    
    if (!user || !user.isActive) {
      return { valid: false, reason: 'User not found or inactive' };
    }

    // Check if user has given consent for data processing
    const hasConsent = await ConsentService.hasConsent(request.userId, 'data_processing');
    if (!hasConsent && request.requestType !== 'erasure_request') {
      return { valid: false, reason: 'Data processing consent required' };
    }

    return { valid: true };
  }

  private static async processAccessRequest(
    requestId: string,
    request: DataOwnershipRequest
  ): Promise<DataOwnershipResponse> {
    // GDPR Article 15 - Right of access
    const inventory = await this.getUserDataInventory(request.userId);
    
    // Generate comprehensive access report
    const accessReport = {
      personalData: inventory,
      processingPurposes: await this.getProcessingPurposes(request.userId),
      dataRecipients: await this.getDataRecipients(request.userId),
      retentionPeriods: inventory.retentionSchedule,
      dataSource: await this.getDataSources(request.userId),
      automatedDecisionMaking: await this.getAutomatedDecisions(request.userId),
    };

    // Create downloadable report
    const exportResult = await PrivacyService.exportUserData({
      userId: request.userId,
      format: 'json',
      includeAnonymized: false,
    });

    return {
      requestId,
      status: 'completed',
      downloadUrl: `/api/privacy/exports/${exportResult.exportId}/download`,
      expiresAt: exportResult.expiresAt,
    };
  }

  private static async processPortabilityRequest(
    requestId: string,
    request: DataOwnershipRequest
  ): Promise<DataOwnershipResponse> {
    // GDPR Article 20 - Right to data portability
    const exportResult = await PrivacyService.exportUserData({
      userId: request.userId,
      format: 'json',
      includeAnonymized: false,
      dataTypes: request.dataTypes,
    });

    return {
      requestId,
      status: 'completed',
      downloadUrl: `/api/privacy/exports/${exportResult.exportId}/download`,
      expiresAt: exportResult.expiresAt,
    };
  }

  private static async processRectificationRequest(
    requestId: string,
    request: DataOwnershipRequest
  ): Promise<DataOwnershipResponse> {
    // GDPR Article 16 - Right to rectification
    // This would typically involve manual review
    return {
      requestId,
      status: 'pending',
      estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    };
  }

  private static async processErasureRequest(
    requestId: string,
    request: DataOwnershipRequest
  ): Promise<DataOwnershipResponse> {
    // GDPR Article 17 - Right to erasure
    const deletionResult = await PrivacyService.deleteUserData({
      userId: request.userId,
      dataTypes: request.dataTypes,
      reason: request.reason || 'User requested erasure',
      immediate: request.urgency === 'urgent',
    });

    return {
      requestId,
      status: 'completed',
    };
  }

  private static async processRestrictionRequest(
    requestId: string,
    request: DataOwnershipRequest
  ): Promise<DataOwnershipResponse> {
    // GDPR Article 18 - Right to restriction of processing
    // This would involve flagging data for restricted processing
    await this.flagDataForRestriction(request.userId, request.dataTypes || []);

    return {
      requestId,
      status: 'completed',
    };
  }

  private static async processObjectionRequest(
    requestId: string,
    request: DataOwnershipRequest
  ): Promise<DataOwnershipResponse> {
    // GDPR Article 21 - Right to object
    // This would involve stopping certain types of processing
    await this.processObjection(request.userId, request.reason || '');

    return {
      requestId,
      status: 'completed',
    };
  }

  private static async collectUserDataCategories(userId: string): Promise<DataCategory[]> {
    // This would collect data from all systems
    const categories: DataCategory[] = [
      {
        category: 'Profile Data',
        description: 'Basic user profile information',
        dataTypes: ['name', 'email', 'phone', 'address'],
        size: 1024, // bytes
        location: ['user_database'],
        purpose: ['account_management', 'communication'],
        legalBasis: 'contract',
        retentionPeriod: 365, // days
        canBeDeleted: true,
        canBeExported: true,
      },
      {
        category: 'Application Data',
        description: 'Job application and resume data',
        dataTypes: ['resume', 'cover_letter', 'application_history'],
        size: 5120,
        location: ['application_database', 'file_storage'],
        purpose: ['recruitment', 'matching'],
        legalBasis: 'consent',
        retentionPeriod: 1095, // 3 years
        canBeDeleted: true,
        canBeExported: true,
      },
      // Add more categories as needed
    ];

    return categories;
  }

  private static async generateRetentionSchedule(
    userId: string,
    categories: DataCategory[]
  ): Promise<RetentionScheduleItem[]> {
    const schedule: RetentionScheduleItem[] = [];

    for (const category of categories) {
      for (const dataType of category.dataTypes) {
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + category.retentionPeriod);

        schedule.push({
          dataType,
          retentionPeriod: category.retentionPeriod,
          deletionDate,
          legalBasis: category.legalBasis,
          canExtend: category.legalBasis === 'consent',
        });
      }
    }

    return schedule;
  }

  private static async verifyDataOwnership(dataId: string, userId: string): Promise<boolean> {
    // This would verify the user owns the specified data
    // For now, return true as a placeholder
    return true;
  }

  private static async collectDataLineage(dataId: string): Promise<DataLineage> {
    // This would collect actual lineage data
    return {
      dataId,
      sourceSystem: 'user_input',
      createdAt: new Date(),
      lastModified: new Date(),
      transformations: [],
      accessLog: [],
      sharingLog: [],
    };
  }

  private static async canScheduleDeletion(
    userId: string,
    dataType: string,
    deletionDate: Date
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check legal obligations, active contracts, etc.
    return { allowed: true };
  }

  private static async validateDataSharing(
    userId: string,
    recipientId: string,
    dataTypes: string[],
    purpose: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Validate sharing is allowed
    return { allowed: true };
  }

  private static async logDataSharing(
    userId: string,
    recipientId: string,
    dataTypes: string[],
    purpose: string,
    sharingId: string
  ): Promise<void> {
    logger.info('Data sharing granted', {
      userId,
      recipientId,
      dataTypes,
      purpose,
      sharingId,
      timestamp: new Date(),
    });
  }

  private static async logOwnershipRequest(
    requestId: string,
    request: DataOwnershipRequest,
    response: DataOwnershipResponse
  ): Promise<void> {
    logger.info('Data ownership request processed', {
      requestId,
      userId: request.userId,
      requestType: request.requestType,
      status: response.status,
      timestamp: new Date(),
    });
  }

  private static async getConsentStatusSummary(userId: string): Promise<ConsentStatusSummary> {
    const consents = await ConsentService.getUserConsents(userId);
    
    return {
      totalConsents: consents.length,
      activeConsents: consents.filter(c => c.granted).length,
      expiredConsents: consents.filter(c => c.expiresAt && c.expiresAt < new Date()).length,
      lastUpdated: consents.length > 0 ? consents[0].updatedAt : new Date(),
    };
  }

  private static async generateOwnershipRecommendations(
    inventory: DataInventory,
    consentStatus: ConsentStatusSummary,
    sharingHistory: DataSharingRecord[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Check for expired consents
    if (consentStatus.expiredConsents > 0) {
      recommendations.push('You have expired consents that need renewal');
    }

    // Check for old data
    const oldDataCategories = inventory.dataCategories.filter(
      cat => cat.lastAccessed && 
      new Date().getTime() - cat.lastAccessed.getTime() > 365 * 24 * 60 * 60 * 1000
    );
    
    if (oldDataCategories.length > 0) {
      recommendations.push('Consider deleting old, unused data to reduce privacy risk');
    }

    // Check data sharing
    if (sharingHistory.length > 5) {
      recommendations.push('Review your data sharing permissions regularly');
    }

    return recommendations;
  }

  private static async getProcessingPurposes(userId: string): Promise<string[]> {
    return ['recruitment', 'matching', 'analytics', 'communication'];
  }

  private static async getDataRecipients(userId: string): Promise<string[]> {
    return ['hiring_managers', 'recruiters', 'analytics_service'];
  }

  private static async getDataSources(userId: string): Promise<string[]> {
    return ['user_registration', 'resume_upload', 'application_form'];
  }

  private static async getAutomatedDecisions(userId: string): Promise<string[]> {
    return ['resume_screening', 'candidate_matching', 'interview_scheduling'];
  }

  private static async flagDataForRestriction(userId: string, dataTypes: string[]): Promise<void> {
    // Flag data for restricted processing
    logger.info('Data flagged for restriction', { userId, dataTypes });
  }

  private static async processObjection(userId: string, reason: string): Promise<void> {
    // Process objection to data processing
    logger.info('Data processing objection processed', { userId, reason });
  }
}

// Supporting interfaces
export interface DataSharingPermission {
  dataType: string;
  recipient: string;
  purpose: string;
  grantedAt: Date;
  expiresAt?: Date;
  restrictions: string[];
  status: 'active' | 'expired' | 'revoked';
  revokedAt?: Date;
  revocationReason?: string;
}

export interface DataSharingRecord {
  sharingId: string;
  recipient: string;
  dataTypes: string[];
  purpose: string;
  grantedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
}

export interface ConsentStatusSummary {
  totalConsents: number;
  activeConsents: number;
  expiredConsents: number;
  lastUpdated: Date;
}