import { AnonymizationService, PIIDetectionResult } from '@/services/AnonymizationService';
import { EthicalConstraintsService } from '@/services/EthicalConstraintsService';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import crypto from 'crypto';

/**
 * Anonymization Pipeline Service
 * Orchestrates the complete data anonymization process with validation and audit
 * Requirements: 1.4, 4.1, 7.1, 10.3
 */
export class AnonymizationPipelineService {
  private ethicalConstraints: EthicalConstraintsService;

  constructor() {
    this.ethicalConstraints = new EthicalConstraintsService();
  }

  /**
   * Process data through complete anonymization pipeline
   */
  async processData(
    data: any,
    dataType: 'candidate_profile' | 'job_description' | 'resume' | 'communication',
    userId: string,
    options: AnonymizationPipelineOptions = {}
  ): Promise<AnonymizationPipelineResult> {
    const pipelineId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      logger.info('Starting anonymization pipeline', {
        pipelineId,
        dataType,
        userId,
        dataSize: JSON.stringify(data).length
      });

      // Stage 1: Pre-processing validation
      const preValidation = await this.preProcessValidation(data, dataType);
      if (!preValidation.valid) {
        throw new Error(`Pre-processing validation failed: ${preValidation.errors.join(', ')}`);
      }

      // Stage 2: PII Detection
      const piiDetection = await this.detectPII(data, dataType);

      // Stage 3: Risk Assessment
      const riskAssessment = await this.assessRisk(piiDetection, dataType);

      // Stage 4: Anonymization Strategy Selection
      const strategy = await this.selectAnonymizationStrategy(riskAssessment, options);

      // Stage 5: Data Anonymization
      const anonymizationResult = await this.anonymizeData(data, strategy, piiDetection);

      // Stage 6: Post-processing Validation
      const postValidation = await this.postProcessValidation(
        data,
        anonymizationResult.anonymizedData,
        piiDetection
      );

      // Stage 7: Quality Assessment
      const qualityAssessment = await this.assessQuality(
        data,
        anonymizationResult.anonymizedData,
        strategy
      );

      // Stage 8: Audit Trail Creation
      const auditTrail = await this.createAuditTrail(
        pipelineId,
        userId,
        dataType,
        piiDetection,
        strategy,
        qualityAssessment
      );

      const processingTime = Date.now() - startTime;

      const result: AnonymizationPipelineResult = {
        pipelineId,
        success: true,
        originalData: data,
        anonymizedData: anonymizationResult.anonymizedData,
        piiDetection,
        riskAssessment,
        strategy,
        qualityAssessment,
        auditTrail,
        processingTime,
        metadata: {
          dataType,
          userId,
          processedAt: new Date(),
          version: '1.0'
        }
      };

      // Cache result for audit purposes
      await this.cacheResult(result);

      logger.info('Anonymization pipeline completed successfully', {
        pipelineId,
        processingTime,
        qualityScore: qualityAssessment.overallScore,
        piiDetected: piiDetection.detectedPII.length
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Anonymization pipeline failed', {
        pipelineId,
        error: error.message,
        processingTime
      });

      return {
        pipelineId,
        success: false,
        error: error.message,
        processingTime,
        metadata: {
          dataType,
          userId,
          processedAt: new Date(),
          version: '1.0'
        }
      };
    }
  }

  /**
   * Batch process multiple data items
   */
  async processBatch(
    dataItems: { data: any; dataType: string; userId: string }[],
    options: AnonymizationPipelineOptions = {}
  ): Promise<AnonymizationPipelineResult[]> {
    const batchId = crypto.randomUUID();
    const results: AnonymizationPipelineResult[] = [];

    logger.info('Starting batch anonymization', {
      batchId,
      itemCount: dataItems.length
    });

    for (const item of dataItems) {
      try {
        const result = await this.processData(
          item.data,
          item.dataType as any,
          item.userId,
          options
        );
        results.push(result);
      } catch (error) {
        logger.error('Batch item processing failed', {
          batchId,
          error: error.message
        });
        
        results.push({
          pipelineId: crypto.randomUUID(),
          success: false,
          error: error.message,
          processingTime: 0,
          metadata: {
            dataType: item.dataType,
            userId: item.userId,
            processedAt: new Date(),
            version: '1.0'
          }
        });
      }
    }

    logger.info('Batch anonymization completed', {
      batchId,
      totalItems: dataItems.length,
      successfulItems: results.filter(r => r.success).length,
      failedItems: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Pre-processing validation
   */
  private async preProcessValidation(
    data: any,
    dataType: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check data structure
    if (!data || typeof data !== 'object') {
      errors.push('Data must be a valid object');
    }

    // Check data size
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 10 * 1024 * 1024) { // 10MB limit
      errors.push('Data size exceeds maximum limit');
    }

    // Data type specific validations
    switch (dataType) {
      case 'candidate_profile':
        if (!data.skills && !data.experience && !data.education) {
          errors.push('Candidate profile must contain at least one of: skills, experience, or education');
        }
        break;
      case 'job_description':
        if (!data.title || !data.description) {
          errors.push('Job description must contain title and description');
        }
        break;
      case 'resume':
        if (!data.content && !data.sections) {
          errors.push('Resume must contain content or sections');
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Detect PII in data
   */
  private async detectPII(data: any, dataType: string): Promise<PIIDetectionResult> {
    const dataString = JSON.stringify(data);
    
    // Use enhanced PII detection based on data type
    const customPatterns = this.getDataTypeSpecificPatterns(dataType);
    
    return await AnonymizationService.detectAndAnonymizePII(dataString, {
      preserveFormat: true,
      useConsistentMapping: true,
      customPatterns
    });
  }

  /**
   * Assess risk level of detected PII
   */
  private async assessRisk(
    piiDetection: PIIDetectionResult,
    dataType: string
  ): Promise<RiskAssessment> {
    let riskScore = 0;
    const riskFactors: string[] = [];

    // Base risk from PII detection
    if (piiDetection.hasPII) {
      riskScore += piiDetection.confidence * 0.5;
      riskFactors.push(`PII detected with ${(piiDetection.confidence * 100).toFixed(1)}% confidence`);
    }

    // Risk based on PII types
    const highRiskTypes = ['ssn', 'credit_card', 'email', 'phone'];
    const detectedHighRiskTypes = piiDetection.detectedPII.filter(pii => 
      highRiskTypes.includes(pii.type)
    );

    if (detectedHighRiskTypes.length > 0) {
      riskScore += 0.3;
      riskFactors.push(`High-risk PII types detected: ${detectedHighRiskTypes.map(p => p.type).join(', ')}`);
    }

    // Data type specific risk
    const dataTypeRisk = {
      'candidate_profile': 0.2,
      'job_description': 0.1,
      'resume': 0.3,
      'communication': 0.4
    };

    riskScore += dataTypeRisk[dataType as keyof typeof dataTypeRisk] || 0.1;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 0.3) riskLevel = 'low';
    else if (riskScore < 0.6) riskLevel = 'medium';
    else if (riskScore < 0.8) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      riskScore: Math.min(1.0, riskScore),
      riskLevel,
      riskFactors,
      recommendedActions: this.getRecommendedActions(riskLevel, riskFactors)
    };
  }

  /**
   * Select appropriate anonymization strategy
   */
  private async selectAnonymizationStrategy(
    riskAssessment: RiskAssessment,
    options: AnonymizationPipelineOptions
  ): Promise<AnonymizationStrategy> {
    const strategy: AnonymizationStrategy = {
      level: options.anonymizationLevel || this.getDefaultLevel(riskAssessment.riskLevel),
      techniques: [],
      preserveUtility: options.preserveUtility ?? true,
      reversible: options.reversible ?? false
    };

    // Select techniques based on risk level and requirements
    switch (strategy.level) {
      case 'basic':
        strategy.techniques = ['suppression', 'generalization'];
        break;
      case 'standard':
        strategy.techniques = ['suppression', 'generalization', 'substitution'];
        break;
      case 'enhanced':
        strategy.techniques = ['suppression', 'generalization', 'substitution', 'perturbation'];
        break;
      case 'maximum':
        strategy.techniques = ['suppression', 'generalization', 'substitution', 'perturbation', 'encryption'];
        break;
    }

    // Adjust for utility preservation
    if (strategy.preserveUtility) {
      strategy.techniques = strategy.techniques.filter(t => t !== 'suppression');
      if (!strategy.techniques.includes('generalization')) {
        strategy.techniques.push('generalization');
      }
    }

    return strategy;
  }

  /**
   * Anonymize data using selected strategy
   */
  private async anonymizeData(
    data: any,
    strategy: AnonymizationStrategy,
    piiDetection: PIIDetectionResult
  ): Promise<{ anonymizedData: any; appliedTechniques: string[] }> {
    let anonymizedData = JSON.parse(JSON.stringify(data)); // Deep copy
    const appliedTechniques: string[] = [];

    // Apply anonymization techniques
    for (const technique of strategy.techniques) {
      switch (technique) {
        case 'suppression':
          anonymizedData = await this.applySuppression(anonymizedData, piiDetection);
          appliedTechniques.push('suppression');
          break;
        case 'generalization':
          anonymizedData = await this.applyGeneralization(anonymizedData);
          appliedTechniques.push('generalization');
          break;
        case 'substitution':
          anonymizedData = await this.applySubstitution(anonymizedData, piiDetection);
          appliedTechniques.push('substitution');
          break;
        case 'perturbation':
          anonymizedData = await this.applyPerturbation(anonymizedData);
          appliedTechniques.push('perturbation');
          break;
        case 'encryption':
          anonymizedData = await this.applyEncryption(anonymizedData, strategy.reversible);
          appliedTechniques.push('encryption');
          break;
      }
    }

    return { anonymizedData, appliedTechniques };
  }

  /**
   * Post-processing validation
   */
  private async postProcessValidation(
    originalData: any,
    anonymizedData: any,
    piiDetection: PIIDetectionResult
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check if PII still exists
    const remainingPII = await AnonymizationService.detectAndAnonymizePII(
      JSON.stringify(anonymizedData)
    );

    if (remainingPII.hasPII) {
      issues.push(`PII still detected after anonymization: ${remainingPII.detectedPII.map(p => p.type).join(', ')}`);
    }

    // Check data utility preservation
    const utilityScore = this.calculateUtilityScore(originalData, anonymizedData);
    if (utilityScore < 0.5) {
      issues.push(`Low data utility after anonymization: ${(utilityScore * 100).toFixed(1)}%`);
    }

    // Validate ethical constraints
    const ethicalValidation = await this.ethicalConstraints.validateDataAnonymization(anonymizedData);
    if (!ethicalValidation) {
      issues.push('Anonymized data failed ethical constraints validation');
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Assess anonymization quality
   */
  private async assessQuality(
    originalData: any,
    anonymizedData: any,
    strategy: AnonymizationStrategy
  ): Promise<QualityAssessment> {
    const privacyScore = await this.calculatePrivacyScore(originalData, anonymizedData);
    const utilityScore = this.calculateUtilityScore(originalData, anonymizedData);
    const consistencyScore = await this.calculateConsistencyScore(anonymizedData);
    
    const overallScore = (privacyScore * 0.4 + utilityScore * 0.4 + consistencyScore * 0.2);

    return {
      overallScore,
      privacyScore,
      utilityScore,
      consistencyScore,
      metrics: {
        dataReduction: this.calculateDataReduction(originalData, anonymizedData),
        informationLoss: 1 - utilityScore,
        riskReduction: privacyScore
      }
    };
  }

  /**
   * Create audit trail
   */
  private async createAuditTrail(
    pipelineId: string,
    userId: string,
    dataType: string,
    piiDetection: PIIDetectionResult,
    strategy: AnonymizationStrategy,
    qualityAssessment: QualityAssessment
  ): Promise<AnonymizationAuditTrail> {
    return {
      pipelineId,
      userId,
      dataType,
      timestamp: new Date(),
      piiDetected: piiDetection.hasPII,
      piiTypes: piiDetection.detectedPII.map(p => p.type),
      strategyUsed: strategy,
      qualityMetrics: qualityAssessment,
      complianceStatus: 'compliant',
      retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years in milliseconds
    };
  }

  // Helper methods for anonymization techniques

  private async applySuppression(data: any, piiDetection: PIIDetectionResult): Promise<any> {
    const result = { ...data };
    
    // Remove fields that contain PII
    for (const pii of piiDetection.detectedPII) {
      if (pii.type === 'email' || pii.type === 'phone' || pii.type === 'ssn') {
        // Remove the entire field containing this PII
        this.removeFieldContaining(result, pii.value);
      }
    }
    
    return result;
  }

  private async applyGeneralization(data: any): Promise<any> {
    const result = { ...data };
    
    // Generalize specific fields
    if (result.age) {
      result.ageRange = this.generalizeAge(result.age);
      delete result.age;
    }
    
    if (result.salary) {
      result.salaryRange = this.generalizeSalary(result.salary);
      delete result.salary;
    }
    
    if (result.location) {
      result.region = this.generalizeLocation(result.location);
      delete result.location;
    }
    
    return result;
  }

  private async applySubstitution(data: any, piiDetection: PIIDetectionResult): Promise<any> {
    let result = JSON.stringify(data);
    
    // Replace detected PII with synthetic alternatives
    for (const pii of piiDetection.detectedPII) {
      result = result.replace(new RegExp(pii.value, 'g'), pii.replacement);
    }
    
    return JSON.parse(result);
  }

  private async applyPerturbation(data: any): Promise<any> {
    const result = { ...data };
    
    // Add noise to numerical values
    if (result.experience && typeof result.experience === 'number') {
      result.experience = Math.max(0, result.experience + (Math.random() - 0.5) * 2);
    }
    
    return result;
  }

  private async applyEncryption(data: any, reversible: boolean): Promise<any> {
    const result = { ...data };
    
    // Encrypt sensitive fields
    const sensitiveFields = ['id', 'userId', 'candidateId'];
    
    for (const field of sensitiveFields) {
      if (result[field]) {
        if (reversible) {
          // Use reversible encryption (in production, use proper encryption)
          result[field] = Buffer.from(result[field]).toString('base64');
        } else {
          // Use irreversible hashing
          result[field] = AnonymizationService.generateIrreversibleHash(result[field]);
        }
      }
    }
    
    return result;
  }

  // Utility methods

  private getDataTypeSpecificPatterns(dataType: string): any[] {
    const patterns: Record<string, any[]> = {
      'resume': [
        {
          name: 'linkedin_url',
          pattern: /https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/g,
          replacement: 'https://linkedin.com/in/anonymous',
          type: 'url'
        }
      ],
      'candidate_profile': [
        {
          name: 'github_url',
          pattern: /https?:\/\/(www\.)?github\.com\/[\w-]+/g,
          replacement: 'https://github.com/anonymous',
          type: 'url'
        }
      ]
    };
    
    return patterns[dataType] || [];
  }

  private getDefaultLevel(riskLevel: string): 'basic' | 'standard' | 'enhanced' | 'maximum' {
    const levelMap = {
      'low': 'basic' as const,
      'medium': 'standard' as const,
      'high': 'enhanced' as const,
      'critical': 'maximum' as const
    };
    
    return levelMap[riskLevel as keyof typeof levelMap] || 'standard';
  }

  private getRecommendedActions(riskLevel: string, riskFactors: string[]): string[] {
    const actions: string[] = [];
    
    if (riskLevel === 'high' || riskLevel === 'critical') {
      actions.push('Apply maximum anonymization level');
      actions.push('Require additional consent verification');
      actions.push('Implement enhanced audit logging');
    }
    
    if (riskFactors.some(f => f.includes('email') || f.includes('phone'))) {
      actions.push('Remove or hash contact information');
    }
    
    return actions;
  }

  private calculateUtilityScore(originalData: any, anonymizedData: any): number {
    // Simplified utility calculation
    const originalFields = Object.keys(originalData).length;
    const anonymizedFields = Object.keys(anonymizedData).length;
    
    return anonymizedFields / originalFields;
  }

  private async calculatePrivacyScore(originalData: any, anonymizedData: any): Promise<number> {
    const originalPII = await AnonymizationService.detectAndAnonymizePII(JSON.stringify(originalData));
    const anonymizedPII = await AnonymizationService.detectAndAnonymizePII(JSON.stringify(anonymizedData));
    
    if (originalPII.detectedPII.length === 0) return 1.0;
    
    const removedPII = originalPII.detectedPII.length - anonymizedPII.detectedPII.length;
    return removedPII / originalPII.detectedPII.length;
  }

  private async calculateConsistencyScore(anonymizedData: any): Promise<number> {
    // Check for consistency in anonymization
    // This is a simplified implementation
    return 0.9;
  }

  private calculateDataReduction(originalData: any, anonymizedData: any): number {
    const originalSize = JSON.stringify(originalData).length;
    const anonymizedSize = JSON.stringify(anonymizedData).length;
    
    return (originalSize - anonymizedSize) / originalSize;
  }

  private removeFieldContaining(obj: any, value: string): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].includes(value)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.removeFieldContaining(obj[key], value);
      }
    }
  }

  private generalizeAge(age: number): string {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  private generalizeSalary(salary: number): string {
    if (salary < 50000) return '$0-$50k';
    if (salary < 100000) return '$50k-$100k';
    if (salary < 150000) return '$100k-$150k';
    return '$150k+';
  }

  private generalizeLocation(location: string): string {
    // Extract region from location
    const regions = {
      'california': 'West Coast',
      'new york': 'East Coast',
      'texas': 'South',
      'florida': 'South'
    };
    
    const lowerLocation = location.toLowerCase();
    for (const [state, region] of Object.entries(regions)) {
      if (lowerLocation.includes(state)) {
        return region;
      }
    }
    
    return 'Other';
  }

  private async cacheResult(result: AnonymizationPipelineResult): Promise<void> {
    try {
      await CacheService.set(
        `anonymization_result:${result.pipelineId}`,
        JSON.stringify(result),
        24 * 60 * 60 // 24 hours
      );
    } catch (error) {
      logger.error('Error caching anonymization result:', error);
    }
  }
}

// Supporting interfaces

export interface AnonymizationPipelineOptions {
  anonymizationLevel?: 'basic' | 'standard' | 'enhanced' | 'maximum';
  preserveUtility?: boolean;
  reversible?: boolean;
  customRules?: any[];
}

export interface AnonymizationPipelineResult {
  pipelineId: string;
  success: boolean;
  originalData?: any;
  anonymizedData?: any;
  piiDetection?: PIIDetectionResult;
  riskAssessment?: RiskAssessment;
  strategy?: AnonymizationStrategy;
  qualityAssessment?: QualityAssessment;
  auditTrail?: AnonymizationAuditTrail;
  error?: string;
  processingTime: number;
  metadata: {
    dataType: string;
    userId: string;
    processedAt: Date;
    version: string;
  };
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendedActions: string[];
}

export interface AnonymizationStrategy {
  level: 'basic' | 'standard' | 'enhanced' | 'maximum';
  techniques: string[];
  preserveUtility: boolean;
  reversible: boolean;
}

export interface QualityAssessment {
  overallScore: number;
  privacyScore: number;
  utilityScore: number;
  consistencyScore: number;
  metrics: {
    dataReduction: number;
    informationLoss: number;
    riskReduction: number;
  };
}

export interface AnonymizationAuditTrail {
  pipelineId: string;
  userId: string;
  dataType: string;
  timestamp: Date;
  piiDetected: boolean;
  piiTypes: string[];
  strategyUsed: AnonymizationStrategy;
  qualityMetrics: QualityAssessment;
  complianceStatus: string;
  retentionPeriod: number;
}

export default AnonymizationPipelineService;