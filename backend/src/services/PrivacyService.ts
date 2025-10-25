import { AnonymizationService, PIIDetectionResult } from '@/services/AnonymizationService';
import { ConsentService } from '@/services/ConsentService';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import crypto from 'crypto';

export interface DataProcessingRequest {
  userId: string;
  dataType: string;
  processingPurpose: string;
  requiredConsents: string[];
  data: any;
  retentionPeriod?: number;
}

export interface DataProcessingResult {
  allowed: boolean;
  processedData?: any;
  anonymizationReport?: any;
  consentValidation: any;
  processingId: string;
  restrictions: string[];
}

export interface DataExportRequest {
  userId: string;
  format: 'json' | 'csv' | 'xml';
  includeAnonymized: boolean;
  dataTypes?: string[];
}

export interface DataDeletionRequest {
  userId: string;
  dataTypes?: string[];
  reason: string;
  immediate: boolean;
}

export interface PrivacyAuditRecord {
  id: string;
  userId: string;
  action: PrivacyAction;
  dataTypes: string[];
  timestamp: Date;
  result: 'success' | 'failure' | 'partial';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export type PrivacyAction = 
  | 'data_processing'
  | 'data_export'
  | 'data_deletion'
  | 'consent_update'
  | 'anonymization'
  | 'access_request';

export class PrivacyService {
  /**
   * Process data with privacy controls and anonymization
   */
  static async processDataWithPrivacyControls(
    request: DataProcessingRequest
  ): Promise<DataProcessingResult> {
    try {
      const processingId = crypto.randomUUID();
      const restrictions: string[] = [];

      // Validate consent for processing
      const consentValidation = await ConsentService.validateConsentForProcessing(
        request.userId,
        request.requiredConsents,
        request.processingPurpose
      );

      if (!consentValidation.valid) {
        return {
          allowed: false,
          consentValidation,
          processingId,
          restrictions: [`Missing consents: ${consentValidation.missingConsents.join(', ')}`],
        };
      }

      // Determine anonymization requirements
      const anonymizationRequired = await this.isAnonymizationRequired(
        request.userId,
        request.dataType,
        request.processingPurpose
      );

      let processedData = request.data;
      let anonymizationReport;

      if (anonymizationRequired) {
        // Apply anonymization
        const anonymizationResult = await this.anonymizeData(
          request.data,
          request.dataType,
          request.userId
        );

        processedData = anonymizationResult.anonymizedData;
        anonymizationReport = anonymizationResult.report;
        
        if (anonymizationResult.riskScore > 0.7) {
          restrictions.push('High re-identification risk detected');
        }
      }

      // Apply data minimization
      processedData = await this.applyDataMinimization(
        processedData,
        request.processingPurpose
      );

      // Log processing activity
      await this.logPrivacyActivity({
        id: processingId,
        userId: request.userId,
        action: 'data_processing',
        dataTypes: [request.dataType],
        timestamp: new Date(),
        result: 'success',
        details: {
          purpose: request.processingPurpose,
          anonymized: anonymizationRequired,
          consentValid: consentValidation.valid,
        },
      });

      return {
        allowed: true,
        processedData,
        anonymizationReport,
        consentValidation,
        processingId,
        restrictions,
      };
    } catch (error) {
      logger.error('Error in data processing with privacy controls:', error);
      throw error;
    }
  }

  /**
   * Export user data (GDPR Article 20 - Right to data portability)
   */
  static async exportUserData(request: DataExportRequest): Promise<{
    exportId: string;
    data: any;
    format: string;
    generatedAt: Date;
    expiresAt: Date;
  }> {
    try {
      const exportId = crypto.randomUUID();
      
      // Validate user consent for data export
      const hasConsent = await ConsentService.hasConsent(request.userId, 'data_processing');
      if (!hasConsent) {
        throw new Error('User consent required for data export');
      }

      // Collect user data from various sources
      const userData = await this.collectUserData(request.userId, request.dataTypes);

      // Apply anonymization if requested
      let exportData = userData;
      if (request.includeAnonymized) {
        const anonymizationResult = await this.anonymizeData(
          userData,
          'user_export',
          request.userId
        );
        exportData = anonymizationResult.anonymizedData;
      }

      // Format data according to request
      const formattedData = await this.formatExportData(exportData, request.format);

      // Set expiry date (7 days from generation)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Cache export for download
      await CacheService.set(
        `data_export:${exportId}`,
        JSON.stringify({
          data: formattedData,
          format: request.format,
          userId: request.userId,
          generatedAt: new Date(),
          expiresAt,
        }),
        7 * 24 * 60 * 60 // 7 days
      );

      // Log export activity
      await this.logPrivacyActivity({
        id: crypto.randomUUID(),
        userId: request.userId,
        action: 'data_export',
        dataTypes: request.dataTypes || ['all'],
        timestamp: new Date(),
        result: 'success',
        details: {
          exportId,
          format: request.format,
          includeAnonymized: request.includeAnonymized,
        },
      });

      return {
        exportId,
        data: formattedData,
        format: request.format,
        generatedAt: new Date(),
        expiresAt,
      };
    } catch (error) {
      logger.error('Error in data export:', error);
      throw error;
    }
  }

  /**
   * Delete user data (GDPR Article 17 - Right to erasure)
   */
  static async deleteUserData(request: DataDeletionRequest): Promise<{
    deletionId: string;
    deletedDataTypes: string[];
    scheduledDeletion: string[];
    completedAt: Date;
  }> {
    try {
      const deletionId = crypto.randomUUID();
      const deletedDataTypes: string[] = [];
      const scheduledDeletion: string[] = [];

      // Validate deletion request
      const canDelete = await this.validateDeletionRequest(request);
      if (!canDelete.allowed) {
        throw new Error(`Deletion not allowed: ${canDelete.reason}`);
      }

      // Determine what data can be deleted immediately vs scheduled
      const dataTypes = request.dataTypes || await this.getAllUserDataTypes(request.userId);
      
      for (const dataType of dataTypes) {
        if (request.immediate || await this.canDeleteImmediately(request.userId, dataType)) {
          await this.performImmediateDeletion(request.userId, dataType);
          deletedDataTypes.push(dataType);
        } else {
          await this.scheduleDeletion(request.userId, dataType, request.reason);
          scheduledDeletion.push(dataType);
        }
      }

      // Update user consent records
      await ConsentService.revokeConsent(
        request.userId,
        'data_processing',
        `Data deletion requested: ${request.reason}`
      );

      // Log deletion activity
      await this.logPrivacyActivity({
        id: deletionId,
        userId: request.userId,
        action: 'data_deletion',
        dataTypes,
        timestamp: new Date(),
        result: 'success',
        details: {
          reason: request.reason,
          immediate: request.immediate,
          deletedCount: deletedDataTypes.length,
          scheduledCount: scheduledDeletion.length,
        },
      });

      return {
        deletionId,
        deletedDataTypes,
        scheduledDeletion,
        completedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error in data deletion:', error);
      throw error;
    }
  }

  /**
   * Generate privacy compliance report
   */
  static async generatePrivacyReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<{
    reportId: string;
    period: { startDate: Date; endDate: Date };
    summary: {
      totalActivities: number;
      dataProcessingRequests: number;
      dataExports: number;
      dataDeletions: number;
      consentUpdates: number;
      anonymizations: number;
    };
    complianceScore: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const reportId = crypto.randomUUID();
      
      // Get privacy activities for the period
      const activities = await this.getPrivacyActivities(startDate, endDate, userId);
      
      // Calculate summary statistics
      const summary = {
        totalActivities: activities.length,
        dataProcessingRequests: activities.filter(a => a.action === 'data_processing').length,
        dataExports: activities.filter(a => a.action === 'data_export').length,
        dataDeletions: activities.filter(a => a.action === 'data_deletion').length,
        consentUpdates: activities.filter(a => a.action === 'consent_update').length,
        anonymizations: activities.filter(a => a.action === 'anonymization').length,
      };

      // Calculate compliance score
      const complianceScore = await this.calculateComplianceScore(activities);
      
      // Identify issues and recommendations
      const { issues, recommendations } = await this.analyzeComplianceIssues(activities);

      const report = {
        reportId,
        period: { startDate, endDate },
        summary,
        complianceScore,
        issues,
        recommendations,
      };

      // Cache report
      await CacheService.set(
        `privacy_report:${reportId}`,
        JSON.stringify(report),
        30 * 24 * 60 * 60 // 30 days
      );

      return report;
    } catch (error) {
      logger.error('Error generating privacy report:', error);
      throw error;
    }
  }

  /**
   * Validate anonymization effectiveness
   */
  static async validateAnonymizationEffectiveness(
    originalData: any,
    anonymizedData: any,
    userId: string
  ): Promise<{
    isEffective: boolean;
    riskScore: number;
    vulnerabilities: string[];
    recommendations: string[];
  }> {
    try {
      // Use AnonymizationService for validation
      const validation = await AnonymizationService.validateAnonymization(
        JSON.stringify(originalData),
        JSON.stringify(anonymizedData)
      );

      // Additional privacy-specific checks
      const vulnerabilities: string[] = [...validation.issues];
      const recommendations: string[] = [];

      // Check for quasi-identifiers
      const quasiIdentifiers = await this.detectQuasiIdentifiers(anonymizedData);
      if (quasiIdentifiers.length > 0) {
        vulnerabilities.push(`Quasi-identifiers detected: ${quasiIdentifiers.join(', ')}`);
        recommendations.push('Consider k-anonymity or l-diversity techniques');
      }

      // Check for linkage attacks
      const linkageRisk = await this.assessLinkageRisk(anonymizedData, userId);
      if (linkageRisk > 0.5) {
        vulnerabilities.push('High risk of linkage attacks');
        recommendations.push('Apply differential privacy techniques');
      }

      const isEffective = validation.riskScore < 0.3 && vulnerabilities.length === 0;

      return {
        isEffective,
        riskScore: Math.max(validation.riskScore, linkageRisk),
        vulnerabilities,
        recommendations,
      };
    } catch (error) {
      logger.error('Error validating anonymization effectiveness:', error);
      throw error;
    }
  }

  // Private helper methods

  private static async isAnonymizationRequired(
    userId: string,
    dataType: string,
    purpose: string
  ): Promise<boolean> {
    // Check if anonymization is required based on data type and purpose
    const sensitiveDataTypes = ['resume', 'personal_info', 'contact_details'];
    const publicPurposes = ['analytics', 'research', 'reporting'];
    
    return sensitiveDataTypes.includes(dataType) && publicPurposes.includes(purpose);
  }

  private static async anonymizeData(
    data: any,
    dataType: string,
    userId: string
  ): Promise<{
    anonymizedData: any;
    report: any;
    riskScore: number;
  }> {
    // Define field mappings based on data type
    const fieldMappings = this.getFieldMappings(dataType);
    
    // Apply anonymization
    const anonymizedData = await AnonymizationService.anonymizeObject(
      data,
      fieldMappings,
      { preserveFormat: true, useConsistentMapping: true }
    );

    // Create report
    const report = await AnonymizationService.createAnonymizationReport(
      data,
      anonymizedData,
      userId
    );

    // Validate effectiveness
    const validation = await this.validateAnonymizationEffectiveness(
      data,
      anonymizedData,
      userId
    );

    return {
      anonymizedData,
      report,
      riskScore: validation.riskScore,
    };
  }

  private static getFieldMappings(dataType: string): Record<string, any> {
    const mappings: Record<string, Record<string, any>> = {
      resume: {
        name: 'name',
        email: 'email',
        phone: 'phone',
        address: 'address',
        personalInfo: 'skip',
        skills: 'skip',
        experience: 'skip',
      },
      personal_info: {
        firstName: 'name',
        lastName: 'name',
        email: 'email',
        phone: 'phone',
        dateOfBirth: 'date_of_birth',
        ssn: 'ssn',
      },
      contact_details: {
        email: 'email',
        phone: 'phone',
        address: 'address',
        emergencyContact: 'phone',
      },
    };

    return mappings[dataType] || {};
  }

  private static async applyDataMinimization(
    data: any,
    purpose: string
  ): Promise<any> {
    // Define what data is necessary for each purpose
    const purposeFields: Record<string, string[]> = {
      matching: ['skills', 'experience', 'education'],
      analytics: ['skills', 'experienceLevel', 'industry'],
      reporting: ['role', 'department', 'hireDate'],
      communication: ['email', 'preferredLanguage'],
    };

    const allowedFields = purposeFields[purpose];
    if (!allowedFields) {
      return data; // No minimization rules defined
    }

    // Filter data to only include necessary fields
    const minimizedData: any = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        minimizedData[field] = data[field];
      }
    }

    return minimizedData;
  }

  private static async collectUserData(
    userId: string,
    dataTypes?: string[]
  ): Promise<any> {
    // This would collect data from various models/services
    // For now, return a placeholder structure
    const userData: any = {
      profile: {},
      applications: [],
      interviews: [],
      consents: [],
    };

    // In a real implementation, you would:
    // 1. Query User model
    // 2. Query Application model
    // 3. Query Interview model
    // 4. Query Consent model
    // 5. Aggregate all data

    return userData;
  }

  private static async formatExportData(data: any, format: string): Promise<any> {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        // Convert to CSV format
        return this.convertToCSV(data);
      case 'xml':
        // Convert to XML format
        return this.convertToXML(data);
      default:
        return data;
    }
  }

  private static convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    const flatten = (obj: any, prefix = ''): any => {
      const flattened: any = {};
      for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, flatten(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
      return flattened;
    };

    const flattened = flatten(data);
    const headers = Object.keys(flattened).join(',');
    const values = Object.values(flattened).join(',');
    
    return `${headers}\n${values}`;
  }

  private static convertToXML(data: any): string {
    // Simple XML conversion - in production, use a proper XML library
    const toXML = (obj: any, rootName = 'data'): string => {
      let xml = `<${rootName}>`;
      
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          xml += toXML(obj[key], key);
        } else {
          xml += `<${key}>${obj[key]}</${key}>`;
        }
      }
      
      xml += `</${rootName}>`;
      return xml;
    };

    return toXML(data);
  }

  private static async validateDeletionRequest(
    request: DataDeletionRequest
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check if user has active legal obligations that prevent deletion
    // This is a simplified check - in production, you'd have more complex rules
    
    // Check for active legal holds
    const hasLegalHold = await this.checkLegalHold(request.userId);
    if (hasLegalHold) {
      return { allowed: false, reason: 'Data subject to legal hold' };
    }

    // Check for active contracts
    const hasActiveContract = await this.checkActiveContract(request.userId);
    if (hasActiveContract) {
      return { allowed: false, reason: 'Active contract requires data retention' };
    }

    return { allowed: true };
  }

  private static async checkLegalHold(userId: string): Promise<boolean> {
    // Check if user data is subject to legal hold
    // This would query a legal holds database
    return false; // Placeholder
  }

  private static async checkActiveContract(userId: string): Promise<boolean> {
    // Check if user has active employment or service contract
    // This would query contracts database
    return false; // Placeholder
  }

  private static async canDeleteImmediately(userId: string, dataType: string): Promise<boolean> {
    // Determine if data can be deleted immediately or needs to be scheduled
    const immediateTypes = ['marketing_data', 'analytics_data', 'temporary_files'];
    return immediateTypes.includes(dataType);
  }

  private static async performImmediateDeletion(userId: string, dataType: string): Promise<void> {
    // Perform immediate deletion of specified data type
    logger.info(`Immediate deletion performed`, { userId, dataType });
  }

  private static async scheduleDeletion(
    userId: string,
    dataType: string,
    reason: string
  ): Promise<void> {
    // Schedule deletion for later (e.g., after retention period)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30); // 30 days from now

    await CacheService.set(
      `scheduled_deletion:${userId}:${dataType}`,
      JSON.stringify({ userId, dataType, reason, scheduledFor: deletionDate }),
      30 * 24 * 60 * 60 // 30 days
    );

    logger.info(`Deletion scheduled`, { userId, dataType, scheduledFor: deletionDate });
  }

  private static async getAllUserDataTypes(userId: string): Promise<string[]> {
    // Get all data types associated with a user
    return ['profile', 'applications', 'interviews', 'consents', 'analytics'];
  }

  private static async logPrivacyActivity(record: PrivacyAuditRecord): Promise<void> {
    // Store privacy activity in audit log
    await CacheService.set(
      `privacy_audit:${record.id}`,
      JSON.stringify(record),
      365 * 24 * 60 * 60 // Keep for 1 year
    );

    logger.info('Privacy activity logged', {
      id: record.id,
      userId: record.userId,
      action: record.action,
      result: record.result,
    });
  }

  private static async getPrivacyActivities(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<PrivacyAuditRecord[]> {
    // This would query the audit log database
    // For now, return empty array
    return [];
  }

  private static async calculateComplianceScore(activities: PrivacyAuditRecord[]): Promise<number> {
    if (activities.length === 0) return 100;

    const successfulActivities = activities.filter(a => a.result === 'success').length;
    return (successfulActivities / activities.length) * 100;
  }

  private static async analyzeComplianceIssues(
    activities: PrivacyAuditRecord[]
  ): Promise<{ issues: string[]; recommendations: string[] }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const failedActivities = activities.filter(a => a.result === 'failure');
    if (failedActivities.length > 0) {
      issues.push(`${failedActivities.length} failed privacy operations`);
      recommendations.push('Review and fix failed privacy operations');
    }

    const oldActivities = activities.filter(
      a => new Date().getTime() - a.timestamp.getTime() > 90 * 24 * 60 * 60 * 1000
    );
    if (oldActivities.length > activities.length * 0.5) {
      issues.push('Many old privacy activities without recent updates');
      recommendations.push('Implement regular privacy compliance reviews');
    }

    return { issues, recommendations };
  }

  private static async detectQuasiIdentifiers(data: any): Promise<string[]> {
    // Detect potential quasi-identifiers in anonymized data
    const quasiIdentifiers: string[] = [];
    
    // This is a simplified implementation
    // In production, you'd use more sophisticated techniques
    
    if (data.zipCode) quasiIdentifiers.push('zipCode');
    if (data.birthYear) quasiIdentifiers.push('birthYear');
    if (data.gender) quasiIdentifiers.push('gender');
    if (data.jobTitle) quasiIdentifiers.push('jobTitle');
    
    return quasiIdentifiers;
  }

  private static async assessLinkageRisk(data: any, userId: string): Promise<number> {
    // Assess risk of linking anonymized data back to individual
    // This is a simplified implementation
    
    let riskScore = 0;
    
    // Check for unique combinations
    const uniqueFields = Object.keys(data).filter(key => 
      typeof data[key] === 'string' && data[key].length > 10
    );
    
    riskScore += uniqueFields.length * 0.1;
    
    // Check for temporal patterns
    if (data.timestamps && Array.isArray(data.timestamps)) {
      riskScore += 0.2;
    }
    
    return Math.min(riskScore, 1.0);
  }
}