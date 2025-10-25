import { 
  EthicalAIRequirements, 
  EthicalConstraintViolation,
  EthicalAuditResult,
  DEFAULT_ETHICAL_AI_REQUIREMENTS
} from '@/types/ethical';
import { EthicalConstraintsService } from '@/services/EthicalConstraintsService';
import { HumanOversightService } from '@/services/HumanOversightService';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';

export class EthicsService {
  private static instance: EthicsService;
  private ethicalConstraints: EthicalConstraintsService;
  private humanOversight: HumanOversightService;
  private violations: Map<string, EthicalConstraintViolation> = new Map();

  private constructor() {
    this.ethicalConstraints = new EthicalConstraintsService(this.loadEthicalConfig());
    this.humanOversight = new HumanOversightService();
  }

  public static getInstance(): EthicsService {
    if (!EthicsService.instance) {
      EthicsService.instance = new EthicsService();
    }
    return EthicsService.instance;
  }

  /**
   * Load ethical configuration from environment or use defaults
   */
  private loadEthicalConfig(): Partial<EthicalAIRequirements> {
    return {
      biasThresholds: {
        alertThreshold: parseFloat(process.env.BIAS_ALERT_THRESHOLD || '0.8'),
        criticalThreshold: parseFloat(process.env.BIAS_CRITICAL_THRESHOLD || '0.6'),
        demographicParityThreshold: parseFloat(process.env.DEMOGRAPHIC_PARITY_THRESHOLD || '0.8'),
        disparateImpactThreshold: parseFloat(process.env.DISPARATE_IMPACT_THRESHOLD || '0.8'),
        confidenceInterval: parseFloat(process.env.CONFIDENCE_INTERVAL || '0.95'),
      },
      fairnessConstraints: {
        demographicParity: parseFloat(process.env.DEMOGRAPHIC_PARITY_THRESHOLD || '0.8'),
        equalizedOdds: parseFloat(process.env.EQUALIZED_ODDS_THRESHOLD || '0.8'),
        predictiveEquality: parseFloat(process.env.PREDICTIVE_EQUALITY_THRESHOLD || '0.8'),
        treatmentEquality: parseFloat(process.env.TREATMENT_EQUALITY_THRESHOLD || '0.9'),
        statisticalSignificanceLevel: parseFloat(process.env.STATISTICAL_SIGNIFICANCE_LEVEL || '0.05'),
        minimumSampleSize: parseInt(process.env.MINIMUM_SAMPLE_SIZE || '30'),
      },
      dataRetentionPolicy: {
        candidateDataRetentionDays: parseInt(process.env.CANDIDATE_DATA_RETENTION_DAYS || '365'),
        auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555'),
        anonymizedDataRetentionDays: parseInt(process.env.ANONYMIZED_DATA_RETENTION_DAYS || '1095'),
        automaticDeletion: process.env.AUTOMATIC_DELETION !== 'false',
        deletionGracePeriod: parseInt(process.env.DELETION_GRACE_PERIOD || '30'),
      },
    };
  }

  /**
   * Validate that all ethical AI requirements are met
   */
  public async validateEthicalRequirements(
    operation: string,
    data: Record<string, unknown>
  ): Promise<{ valid: boolean; violations: EthicalViolationType[] }> {
    const violations: EthicalViolationType[] = [];

    try {
      // Check data anonymization requirement
      if (this.ethicalConfig.mandatoryAnonymization) {
        const hasPersonalData = await this.detectPersonalData(data);
        if (hasPersonalData) {
          violations.push(EthicalViolationType.PII_EXPOSURE);
        }
      }

      // Check consent requirement
      if (this.ethicalConfig.consentRequired && data.candidateId) {
        const hasValidConsent = await this.validateConsent(
          data.candidateId as string,
          ConsentType.AI_ANALYSIS
        );
        if (!hasValidConsent) {
          violations.push(EthicalViolationType.MISSING_CONSENT);
        }
      }

      // Check explainability requirement
      if (this.ethicalConfig.explainabilityRequired && operation.includes('decision')) {
        const hasExplanation = data.explanation !== undefined;
        if (!hasExplanation) {
          violations.push(EthicalViolationType.UNEXPLAINED_DECISION);
        }
      }

      // Log validation result
      await this.createAuditTrailEntry({
        action: `ethical_validation_${operation}`,
        actor: { type: 'system', id: 'ethics_service' },
        resource: { type: 'data', id: operation },
        changes: { violations: violations.length },
        ethicalImpact: violations.length > 0 ? 'high' : 'none',
        complianceFlags: violations,
      });

      return {
        valid: violations.length === 0,
        violations,
      };
    } catch (error) {
      logger.error('Error validating ethical requirements:', error);
      return {
        valid: false,
        violations: [EthicalViolationType.ALGORITHM_TRANSPARENCY_VIOLATION],
      };
    }
  }

  /**
   * Detect potential personal data in input
   */
  private async detectPersonalData(data: Record<string, unknown>): Promise<boolean> {
    const personalDataPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Full names
    ];

    const dataString = JSON.stringify(data);
    return personalDataPatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Validate candidate consent for specific operation
   */
  public async validateConsent(
    candidateId: string,
    consentType: ConsentType
  ): Promise<boolean> {
    try {
      const cacheKey = `consent:${candidateId}:${consentType}`;
      const cachedConsent = await CacheService.get(cacheKey);
      
      if (cachedConsent) {
        const consent: ConsentRecord = JSON.parse(cachedConsent);
        return this.isConsentValid(consent);
      }

      // If not cached, would fetch from database
      // For now, return false to enforce consent checking
      return false;
    } catch (error) {
      logger.error('Error validating consent:', error);
      return false;
    }
  }

  /**
   * Check if consent record is still valid
   */
  private isConsentValid(consent: ConsentRecord): boolean {
    if (!consent.granted || consent.revokedAt) {
      return false;
    }

    if (consent.expiresAt && new Date() > consent.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Record ethical violation
   */
  public async recordViolation(
    type: EthicalViolationType,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    affectedCandidates: string[] = [],
    affectedJobs: string[] = []
  ): Promise<string> {
    const violationId = `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const violation: EthicalViolation = {
      id: violationId,
      type,
      severity,
      description,
      affectedCandidates,
      affectedJobs,
      detectedAt: new Date(),
      preventiveMeasures: [],
      reportedToAuthorities: severity === 'critical',
      auditTrail: [],
    };

    this.violations.set(violationId, violation);

    // Log violation
    logger.error('Ethical violation recorded:', {
      id: violationId,
      type,
      severity,
      description,
      affectedCount: affectedCandidates.length + affectedJobs.length,
    });

    // Create audit trail entry
    await this.createAuditTrailEntry({
      action: 'ethical_violation_recorded',
      actor: { type: 'system', id: 'ethics_service' },
      resource: { type: 'data', id: violationId },
      changes: { violation },
      ethicalImpact: 'high',
      complianceFlags: [type],
    });

    // Trigger alerts for high/critical violations
    if (severity === 'high' || severity === 'critical') {
      await this.triggerViolationAlert(violation);
    }

    return violationId;
  }

  /**
   * Trigger alert for ethical violation
   */
  private async triggerViolationAlert(violation: EthicalViolation): Promise<void> {
    // In a real implementation, this would send notifications to compliance team
    logger.warn('Ethical violation alert triggered:', {
      id: violation.id,
      type: violation.type,
      severity: violation.severity,
    });

    // Cache alert for dashboard display
    const alertKey = `ethics_alert:${violation.id}`;
    await CacheService.set(alertKey, JSON.stringify(violation), 86400); // 24 hours
  }

  /**
   * Create audit trail entry
   */
  public async createAuditTrailEntry(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditTrailEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    };

    // In a real implementation, this would be stored in a secure audit database
    logger.info('Audit trail entry created:', auditEntry);

    // Cache recent entries for quick access
    const cacheKey = `audit_trail:${entry.resource.type}:${entry.resource.id}`;
    const existingEntries = await CacheService.get(cacheKey);
    const entries = existingEntries ? JSON.parse(existingEntries) : [];
    entries.push(auditEntry);
    
    // Keep only last 100 entries in cache
    if (entries.length > 100) {
      entries.splice(0, entries.length - 100);
    }
    
    await CacheService.set(cacheKey, JSON.stringify(entries), 86400);
  }

  /**
   * Check if human oversight is required for decision
   */
  public requiresHumanOversight(
    decisionType: string,
    confidence: number,
    riskLevel: 'low' | 'medium' | 'high'
  ): boolean {
    if (!this.ethicalConfig.humanReviewRequired) {
      return false;
    }

    // Always require human oversight for high-risk decisions
    if (riskLevel === 'high') {
      return true;
    }

    // Require oversight if confidence is below threshold
    if (confidence < this.ethicalConfig.confidenceThreshold) {
      return true;
    }

    // Require oversight for final hiring decisions
    if (decisionType.includes('final') || decisionType.includes('rejection')) {
      return true;
    }

    return false;
  }

  /**
   * Get current ethical configuration
   */
  public getEthicalConfig(): EthicalConstraints {
    return { ...this.ethicalConfig };
  }

  /**
   * Update ethical configuration
   */
  public updateEthicalConfig(updates: Partial<EthicalConstraints>): void {
    this.ethicalConfig = { ...this.ethicalConfig, ...updates };
    logger.info('Ethical configuration updated:', updates);
  }

  /**
   * Get all recorded violations
   */
  public getViolations(): EthicalViolation[] {
    return Array.from(this.violations.values());
  }

  /**
   * Get violations by severity
   */
  public getViolationsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): EthicalViolation[] {
    return this.getViolations().filter(v => v.severity === severity);
  }

  /**
   * Mark violation as resolved
   */
  public async resolveViolation(
    violationId: string,
    resolution: string,
    preventiveMeasures: string[]
  ): Promise<boolean> {
    const violation = this.violations.get(violationId);
    if (!violation) {
      return false;
    }

    violation.resolvedAt = new Date();
    violation.resolution = resolution;
    violation.preventiveMeasures = preventiveMeasures;

    await this.createAuditTrailEntry({
      action: 'ethical_violation_resolved',
      actor: { type: 'system', id: 'ethics_service' },
      resource: { type: 'data', id: violationId },
      changes: { resolution, preventiveMeasures },
      ethicalImpact: 'medium',
      complianceFlags: [],
    });

    logger.info('Ethical violation resolved:', {
      id: violationId,
      resolution,
      preventiveMeasures: preventiveMeasures.length,
    });

    return true;
  }
}