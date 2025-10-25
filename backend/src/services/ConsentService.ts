import { ConsentRecord, ConsentType, LegalBasis } from '@/types/auth';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';

export class ConsentService {
  /**
   * Record user consent
   */
  static async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    purpose: string,
    dataTypes: string[],
    retentionPeriod: number,
    legalBasis: LegalBasis = 'consent',
    jurisdiction: string = 'US'
  ): Promise<ConsentRecord> {
    try {
      const ConsentModel = require('@/models/Consent').default;
      
      // Check if there's an existing consent record
      const existingConsent = await ConsentModel.findOne({
        userId,
        consentType,
      }).sort({ createdAt: -1 });

      // Create new consent record
      const consentRecord = new ConsentModel({
        userId,
        consentType,
        granted,
        version: this.getCurrentConsentVersion(consentType),
        purpose,
        dataTypes,
        retentionPeriod,
        legalBasis,
        jurisdiction,
        grantedAt: granted ? new Date() : undefined,
        revokedAt: !granted && existingConsent?.granted ? new Date() : undefined,
        expiresAt: this.calculateExpiryDate(retentionPeriod, legalBasis),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await consentRecord.save();

      // Cache the consent status for quick access
      await this.cacheConsentStatus(userId, consentType, granted);

      // Log consent change for audit
      logger.info('Consent recorded', {
        userId,
        consentType,
        granted,
        purpose,
        legalBasis,
        jurisdiction,
      });

      // If consent is revoked, trigger data cleanup
      if (!granted && existingConsent?.granted) {
        await this.scheduleDataCleanup(userId, consentType, dataTypes);
      }

      return consentRecord.toObject();
    } catch (error) {
      logger.error('Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Check if user has given consent for a specific type
   */
  static async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      // Check cache first
      const cachedConsent = await CacheService.get(`consent:${userId}:${consentType}`);
      if (cachedConsent !== null) {
        return cachedConsent === 'true';
      }

      // Query database
      const ConsentModel = require('@/models/Consent').default;
      const consent = await ConsentModel.findOne({
        userId,
        consentType,
        granted: true,
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ]
      }).sort({ createdAt: -1 });

      const hasConsent = !!consent;

      // Cache the result
      await this.cacheConsentStatus(userId, consentType, hasConsent);

      return hasConsent;
    } catch (error) {
      logger.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Get all consent records for a user
   */
  static async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const ConsentModel = require('@/models/Consent').default;
      const consents = await ConsentModel.find({ userId }).sort({ createdAt: -1 });
      
      return consents.map((consent: any) => consent.toObject());
    } catch (error) {
      logger.error('Error getting user consents:', error);
      return [];
    }
  }

  /**
   * Revoke consent
   */
  static async revokeConsent(
    userId: string,
    consentType: ConsentType,
    reason?: string
  ): Promise<void> {
    try {
      await this.recordConsent(
        userId,
        consentType,
        false,
        `Consent revoked${reason ? `: ${reason}` : ''}`,
        [],
        0,
        'consent'
      );

      logger.info('Consent revoked', {
        userId,
        consentType,
        reason,
      });
    } catch (error) {
      logger.error('Error revoking consent:', error);
      throw error;
    }
  }

  /**
   * Update consent with new terms
   */
  static async updateConsent(
    userId: string,
    consentType: ConsentType,
    newTerms: {
      purpose?: string;
      dataTypes?: string[];
      retentionPeriod?: number;
    }
  ): Promise<ConsentRecord> {
    try {
      const currentConsent = await this.getCurrentConsent(userId, consentType);
      
      if (!currentConsent) {
        throw new Error('No existing consent found');
      }

      // Create new consent record with updated terms
      return await this.recordConsent(
        userId,
        consentType,
        true,
        newTerms.purpose || currentConsent.purpose,
        newTerms.dataTypes || currentConsent.dataTypes,
        newTerms.retentionPeriod || currentConsent.retentionPeriod,
        currentConsent.legalBasis,
        currentConsent.jurisdiction
      );
    } catch (error) {
      logger.error('Error updating consent:', error);
      throw error;
    }
  }

  /**
   * Check if consent is about to expire
   */
  static async getExpiringConsents(daysAhead: number = 30): Promise<ConsentRecord[]> {
    try {
      const ConsentModel = require('@/models/Consent').default;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysAhead);

      const expiringConsents = await ConsentModel.find({
        granted: true,
        expiresAt: {
          $lte: expiryDate,
          $gt: new Date()
        }
      });

      return expiringConsents.map((consent: any) => consent.toObject());
    } catch (error) {
      logger.error('Error getting expiring consents:', error);
      return [];
    }
  }

  /**
   * Validate consent requirements for data processing
   */
  static async validateConsentForProcessing(
    userId: string,
    requiredConsents: ConsentType[],
    processingPurpose: string
  ): Promise<{ valid: boolean; missingConsents: ConsentType[] }> {
    try {
      const missingConsents: ConsentType[] = [];

      for (const consentType of requiredConsents) {
        const hasConsent = await this.hasConsent(userId, consentType);
        if (!hasConsent) {
          missingConsents.push(consentType);
        }
      }

      const valid = missingConsents.length === 0;

      // Log validation attempt
      logger.info('Consent validation', {
        userId,
        processingPurpose,
        requiredConsents,
        valid,
        missingConsents,
      });

      return { valid, missingConsents };
    } catch (error) {
      logger.error('Error validating consent:', error);
      return { valid: false, missingConsents: requiredConsents };
    }
  }

  /**
   * Generate consent report for compliance
   */
  static async generateConsentReport(
    startDate: Date,
    endDate: Date,
    consentType?: ConsentType
  ): Promise<{
    totalRecords: number;
    grantedCount: number;
    revokedCount: number;
    expiredCount: number;
    byType: Record<string, number>;
  }> {
    try {
      const ConsentModel = require('@/models/Consent').default;
      
      const query: any = {
        createdAt: { $gte: startDate, $lte: endDate }
      };

      if (consentType) {
        query.consentType = consentType;
      }

      const consents = await ConsentModel.find(query);
      
      const report = {
        totalRecords: consents.length,
        grantedCount: 0,
        revokedCount: 0,
        expiredCount: 0,
        byType: {} as Record<string, number>,
      };

      const now = new Date();

      consents.forEach((consent: any) => {
        // Count by grant status
        if (consent.granted) {
          report.grantedCount++;
        } else {
          report.revokedCount++;
        }

        // Count expired
        if (consent.expiresAt && consent.expiresAt < now) {
          report.expiredCount++;
        }

        // Count by type
        report.byType[consent.consentType] = (report.byType[consent.consentType] || 0) + 1;
      });

      return report;
    } catch (error) {
      logger.error('Error generating consent report:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic consent renewal reminders
   */
  static async scheduleConsentRenewal(userId: string, consentType: ConsentType): Promise<void> {
    try {
      const consent = await this.getCurrentConsent(userId, consentType);
      
      if (!consent || !consent.expiresAt) return;

      // Schedule reminder 30 days before expiry
      const reminderDate = new Date(consent.expiresAt);
      reminderDate.setDate(reminderDate.getDate() - 30);

      if (reminderDate > new Date()) {
        // In a real implementation, you would use a job queue like Bull or Agenda
        // For now, we'll just log the scheduled reminder
        logger.info('Consent renewal reminder scheduled', {
          userId,
          consentType,
          reminderDate,
          expiryDate: consent.expiresAt,
        });
      }
    } catch (error) {
      logger.error('Error scheduling consent renewal:', error);
    }
  }

  // Private helper methods

  private static async getCurrentConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<ConsentRecord | null> {
    try {
      const ConsentModel = require('@/models/Consent').default;
      const consent = await ConsentModel.findOne({
        userId,
        consentType,
      }).sort({ createdAt: -1 });

      return consent ? consent.toObject() : null;
    } catch (error) {
      logger.error('Error getting current consent:', error);
      return null;
    }
  }

  private static getCurrentConsentVersion(consentType: ConsentType): string {
    // In a real implementation, this would be managed in a configuration system
    const versions: Record<ConsentType, string> = {
      data_processing: '1.0',
      ai_analysis: '1.0',
      profile_sharing: '1.0',
      marketing: '1.0',
      analytics: '1.0',
      third_party_sharing: '1.0',
    };

    return versions[consentType] || '1.0';
  }

  private static calculateExpiryDate(
    retentionPeriod: number,
    legalBasis: LegalBasis
  ): Date | undefined {
    if (legalBasis === 'consent' && retentionPeriod > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + retentionPeriod);
      return expiryDate;
    }
    
    // For other legal bases, consent might not expire automatically
    return undefined;
  }

  private static async cacheConsentStatus(
    userId: string,
    consentType: ConsentType,
    granted: boolean
  ): Promise<void> {
    try {
      await CacheService.set(
        `consent:${userId}:${consentType}`,
        granted.toString(),
        3600 // Cache for 1 hour
      );
    } catch (error) {
      logger.error('Error caching consent status:', error);
    }
  }

  /**
   * Check if user has valid consent for specific data type
   */
  static async hasValidConsent(userId: string, dataType: string): Promise<boolean> {
    try {
      // Map data types to consent types
      const dataTypeToConsentMap: Record<string, ConsentType> = {
        'personal_info': 'data_processing',
        'professional_info': 'data_processing',
        'skills_assessment': 'ai_analysis',
        'behavioral_data': 'ai_analysis',
        'communication_data': 'data_processing',
        'technical_metadata': 'analytics',
        'ai_analysis': 'ai_analysis',
        'profile_matching': 'profile_sharing'
      };

      const requiredConsentType = dataTypeToConsentMap[dataType];
      if (!requiredConsentType) {
        logger.warn('Unknown data type for consent check:', { dataType });
        return false;
      }

      return await this.hasConsent(userId, requiredConsentType);
    } catch (error) {
      logger.error('Error checking valid consent:', error);
      return false;
    }
  }

  /**
   * Get consent withdrawal options for user
   */
  static async getWithdrawalOptions(userId: string): Promise<{
    consentType: ConsentType;
    description: string;
    impact: string;
    canWithdraw: boolean;
    withdrawalProcess: string;
  }[]> {
    try {
      const userConsents = await this.getUserConsents(userId);
      const activeConsents = userConsents.filter(c => c.granted && (!c.expiresAt || c.expiresAt > new Date()));

      const withdrawalOptions = activeConsents.map(consent => ({
        consentType: consent.consentType,
        description: this.getConsentDescription(consent.consentType),
        impact: this.getWithdrawalImpact(consent.consentType),
        canWithdraw: true,
        withdrawalProcess: 'immediate'
      }));

      return withdrawalOptions;
    } catch (error) {
      logger.error('Error getting withdrawal options:', error);
      return [];
    }
  }

  /**
   * Process data subject access request (GDPR Article 15)
   */
  static async processDataAccessRequest(userId: string): Promise<{
    personalData: any;
    processingPurposes: string[];
    dataCategories: string[];
    recipients: string[];
    retentionPeriod: string;
    rights: string[];
  }> {
    try {
      const userConsents = await this.getUserConsents(userId);
      
      // Get user data from various sources
      const UserModel = require('@/models/User').default;
      const user = await UserModel.findById(userId).select('-password');
      
      const CandidateProfileModel = require('@/models/CandidateProfile').default;
      const profile = await CandidateProfileModel.findOne({ anonymizedId: userId });

      return {
        personalData: {
          user: user?.toObject(),
          profile: profile?.toObject(),
          consents: userConsents
        },
        processingPurposes: userConsents.map(c => c.purpose),
        dataCategories: [...new Set(userConsents.flatMap(c => c.dataTypes))],
        recipients: ['TalentAlign AI Platform', 'Authorized Recruiters', 'Hiring Managers'],
        retentionPeriod: 'As specified in consent records, typically 1-7 years',
        rights: [
          'Right to access',
          'Right to rectification', 
          'Right to erasure',
          'Right to restrict processing',
          'Right to data portability',
          'Right to object'
        ]
      };
    } catch (error) {
      logger.error('Error processing data access request:', error);
      throw error;
    }
  }

  /**
   * Process data portability request (GDPR Article 20)
   */
  static async processDataPortabilityRequest(userId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<any> {
    try {
      const accessData = await this.processDataAccessRequest(userId);
      
      // Format data according to requested format
      switch (format) {
        case 'json':
          return JSON.stringify(accessData, null, 2);
        case 'csv':
          // Convert to CSV format (simplified)
          return this.convertToCSV(accessData);
        case 'xml':
          // Convert to XML format (simplified)
          return this.convertToXML(accessData);
        default:
          return accessData;
      }
    } catch (error) {
      logger.error('Error processing data portability request:', error);
      throw error;
    }
  }

  /**
   * Process right to erasure request (GDPR Article 17)
   */
  static async processErasureRequest(userId: string, reason: string): Promise<{
    success: boolean;
    deletedData: string[];
    retainedData: string[];
    retentionReasons: string[];
  }> {
    try {
      const deletedData: string[] = [];
      const retainedData: string[] = [];
      const retentionReasons: string[] = [];

      // Revoke all consents
      const userConsents = await this.getUserConsents(userId);
      for (const consent of userConsents.filter(c => c.granted)) {
        await this.revokeConsent(userId, consent.consentType, `Data erasure request: ${reason}`);
      }

      // Schedule data deletion
      await this.scheduleDataCleanup(userId, 'data_processing', ['all']);
      deletedData.push('Personal profile data', 'Consent records', 'Application history');

      // Some data might need to be retained for legal reasons
      retainedData.push('Audit logs', 'Legal compliance records');
      retentionReasons.push('Legal obligation (GDPR Article 17.3)', 'Legitimate interests');

      logger.info('Data erasure request processed', {
        userId,
        reason,
        deletedDataCount: deletedData.length,
        retainedDataCount: retainedData.length
      });

      return {
        success: true,
        deletedData,
        retainedData,
        retentionReasons
      };
    } catch (error) {
      logger.error('Error processing erasure request:', error);
      throw error;
    }
  }

  private static getConsentDescription(consentType: ConsentType): string {
    const descriptions: Record<ConsentType, string> = {
      'data_processing': 'Processing of personal and professional information for recruitment purposes',
      'ai_analysis': 'AI-powered analysis of skills, experience, and job matching',
      'profile_sharing': 'Sharing profile information with potential employers',
      'marketing': 'Receiving marketing communications and job recommendations',
      'analytics': 'Usage analytics and platform improvement',
      'third_party_sharing': 'Sharing data with third-party service providers'
    };

    return descriptions[consentType] || 'Data processing consent';
  }

  private static getWithdrawalImpact(consentType: ConsentType): string {
    const impacts: Record<ConsentType, string> = {
      'data_processing': 'Your profile will be deactivated and you will not receive job matches',
      'ai_analysis': 'AI-powered matching and recommendations will be disabled',
      'profile_sharing': 'Your profile will not be visible to employers',
      'marketing': 'You will stop receiving marketing communications',
      'analytics': 'Your usage data will not be collected for platform improvement',
      'third_party_sharing': 'Data will not be shared with external service providers'
    };

    return impacts[consentType] || 'Some platform features may be limited';
  }

  private static convertToCSV(data: any): string {
    // Simplified CSV conversion
    const headers = Object.keys(data);
    const values = Object.values(data).map(v => JSON.stringify(v));
    return `${headers.join(',')}\n${values.join(',')}`;
  }

  private static convertToXML(data: any): string {
    // Simplified XML conversion
    const xmlString = Object.entries(data)
      .map(([key, value]) => `<${key}>${JSON.stringify(value)}</${key}>`)
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${xmlString}\n</data>`;
  }

  private static async scheduleDataCleanup(
    userId: string,
    consentType: ConsentType,
    dataTypes: string[]
  ): Promise<void> {
    try {
      // In a real implementation, this would trigger a data cleanup job
      logger.info('Data cleanup scheduled', {
        userId,
        consentType,
        dataTypes,
        scheduledAt: new Date(),
      });

      // Add to cleanup queue (placeholder)
      await CacheService.set(
        `cleanup:${userId}:${consentType}`,
        JSON.stringify({ dataTypes, scheduledAt: new Date() }),
        24 * 60 * 60 // Keep for 24 hours
      );
    } catch (error) {
      logger.error('Error scheduling data cleanup:', error);
    }
  }
}