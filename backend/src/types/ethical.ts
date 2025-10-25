/**
 * Ethical AI Requirements Interface
 * Defines mandatory ethical constraints and requirements for all AI operations
 * Requirements: 10.1, 10.2, 10.3
 */

export interface EthicalAIRequirements {
  /** All AI decisions must provide human-readable explanations */
  explainableDecisions: boolean;
  
  /** Continuous monitoring of bias metrics and fairness indicators */
  biasMonitoring: boolean;
  
  /** Mandatory data anonymization before AI processing */
  dataAnonymization: boolean;
  
  /** Explicit candidate consent required for data processing */
  candidateConsent: boolean;
  
  /** Algorithm transparency and audit trail requirements */
  algorithmTransparency: boolean;
  
  /** Human oversight required for all final hiring decisions */
  humanOversight: boolean;
  
  /** Fairness constraints applied during model processing */
  fairnessConstraints: FairnessConstraints;
  
  /** Bias detection thresholds and alert configurations */
  biasThresholds: BiasThresholds;
  
  /** Data retention and deletion policies */
  dataRetentionPolicy: DataRetentionPolicy;
}

export interface FairnessConstraints {
  /** Demographic parity constraint (0-1, where 1 is perfect parity) */
  demographicParity: number;
  
  /** Equalized odds constraint for true positive rates */
  equalizedOdds: number;
  
  /** Predictive equality constraint for false positive rates */
  predictiveEquality: number;
  
  /** Treatment equality constraint for decision consistency */
  treatmentEquality: number;
  
  /** Statistical significance level for bias testing */
  statisticalSignificanceLevel: number;
  
  /** Minimum sample size for statistical validity */
  minimumSampleSize: number;
}

export interface BiasThresholds {
  /** Alert threshold for bias detection (0-1) */
  alertThreshold: number;
  
  /** Critical threshold requiring immediate intervention */
  criticalThreshold: number;
  
  /** Demographic parity threshold for hiring funnel stages */
  demographicParityThreshold: number;
  
  /** Disparate impact threshold (4/5ths rule = 0.8) */
  disparateImpactThreshold: number;
  
  /** Confidence interval for statistical testing */
  confidenceInterval: number;
}

export interface DataRetentionPolicy {
  /** Candidate data retention period in days */
  candidateDataRetentionDays: number;
  
  /** Audit log retention period in days */
  auditLogRetentionDays: number;
  
  /** Anonymized data retention period in days */
  anonymizedDataRetentionDays: number;
  
  /** Automatic deletion enabled */
  automaticDeletion: boolean;
  
  /** Grace period before deletion in days */
  deletionGracePeriod: number;
}

export interface HumanOversightRequirements {
  /** Minimum number of human reviewers for final decisions */
  minimumReviewers: number;
  
  /** Required reviewer qualifications */
  reviewerQualifications: string[];
  
  /** Mandatory review for high-stakes decisions */
  mandatoryReviewThreshold: number;
  
  /** Appeal process availability */
  appealProcessEnabled: boolean;
  
  /** Maximum AI autonomy level (0-1) */
  maxAIAutonomyLevel: number;
}

export interface AlgorithmTransparencyRequirements {
  /** Model interpretability required */
  modelInterpretability: boolean;
  
  /** Feature importance disclosure */
  featureImportanceDisclosure: boolean;
  
  /** Decision boundary visualization */
  decisionBoundaryVisualization: boolean;
  
  /** Audit trail for all decisions */
  auditTrailRequired: boolean;
  
  /** Third-party audit capability */
  thirdPartyAuditEnabled: boolean;
}

/**
 * Default ethical AI requirements configuration
 * Based on industry best practices and regulatory compliance
 */
export const DEFAULT_ETHICAL_AI_REQUIREMENTS: EthicalAIRequirements = {
  explainableDecisions: true,
  biasMonitoring: true,
  dataAnonymization: true,
  candidateConsent: true,
  algorithmTransparency: true,
  humanOversight: true,
  fairnessConstraints: {
    demographicParity: 0.8, // 80% parity threshold
    equalizedOdds: 0.8,
    predictiveEquality: 0.8,
    treatmentEquality: 0.9,
    statisticalSignificanceLevel: 0.05, // 95% confidence
    minimumSampleSize: 30,
  },
  biasThresholds: {
    alertThreshold: 0.8,
    criticalThreshold: 0.6,
    demographicParityThreshold: 0.8,
    disparateImpactThreshold: 0.8, // 4/5ths rule
    confidenceInterval: 0.95,
  },
  dataRetentionPolicy: {
    candidateDataRetentionDays: 365, // 1 year
    auditLogRetentionDays: 2555, // 7 years for compliance
    anonymizedDataRetentionDays: 1095, // 3 years
    automaticDeletion: true,
    deletionGracePeriod: 30,
  },
};

/**
 * Ethical AI constraint validation
 */
export interface EthicalConstraintViolation {
  constraintType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendedAction: string;
  affectedData?: string[];
  timestamp: Date;
}

export interface EthicalAuditResult {
  passed: boolean;
  violations: EthicalConstraintViolation[];
  overallScore: number;
  recommendations: string[];
  auditTimestamp: Date;
}