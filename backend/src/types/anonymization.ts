/**
 * Data Anonymization Types and Interfaces
 * Defines structures for mandatory data anonymization before AI processing
 * Requirements: 1.4, 4.1, 7.1, 10.3
 */

export interface AnonymizationConfig {
  /** Enable/disable anonymization (should always be true in production) */
  enabled: boolean;
  
  /** Anonymization techniques to apply */
  techniques: AnonymizationTechnique[];
  
  /** PII detection sensitivity level */
  sensitivityLevel: 'low' | 'medium' | 'high' | 'maximum';
  
  /** Preserve certain fields for analysis */
  preserveFields: string[];
  
  /** Custom anonymization rules */
  customRules: AnonymizationRule[];
}

export interface AnonymizationTechnique {
  /** Technique identifier */
  id: string;
  
  /** Technique name */
  name: string;
  
  /** Technique type */
  type: 'suppression' | 'generalization' | 'perturbation' | 'substitution' | 'encryption';
  
  /** Fields this technique applies to */
  applicableFields: string[];
  
  /** Configuration parameters */
  parameters: Record<string, any>;
  
  /** Whether this technique is reversible */
  reversible: boolean;
}

export interface AnonymizationRule {
  /** Rule identifier */
  id: string;
  
  /** Field pattern to match */
  fieldPattern: RegExp;
  
  /** Data pattern to match */
  dataPattern: RegExp;
  
  /** Anonymization action to take */
  action: 'remove' | 'mask' | 'generalize' | 'substitute' | 'encrypt';
  
  /** Action parameters */
  actionParams: Record<string, any>;
  
  /** Rule priority (higher numbers processed first) */
  priority: number;
}

export interface PIIDetectionResult {
  /** Whether PII was detected */
  detected: boolean;
  
  /** Detected PII types */
  detectedTypes: PIIType[];
  
  /** Confidence score for detection */
  confidence: number;
  
  /** Specific locations of detected PII */
  locations: PIILocation[];
  
  /** Recommended anonymization actions */
  recommendedActions: AnonymizationAction[];
}

export interface PIIType {
  /** PII type identifier */
  type: string;
  
  /** Human-readable name */
  name: string;
  
  /** Sensitivity level */
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Regulatory implications */
  regulatoryImplications: string[];
}

export interface PIILocation {
  /** Field path where PII was found */
  fieldPath: string;
  
  /** Start position in the field value */
  startPosition: number;
  
  /** End position in the field value */
  endPosition: number;
  
  /** Detected value (for logging/audit purposes) */
  detectedValue: string;
  
  /** PII type */
  piiType: string;
  
  /** Detection confidence */
  confidence: number;
}

export interface AnonymizationAction {
  /** Action type */
  action: 'remove' | 'mask' | 'generalize' | 'substitute' | 'encrypt';
  
  /** Target field path */
  fieldPath: string;
  
  /** Action parameters */
  parameters: Record<string, any>;
  
  /** Expected outcome */
  expectedOutcome: string;
}

export interface AnonymizationResult {
  /** Whether anonymization was successful */
  success: boolean;
  
  /** Original data hash (for audit purposes) */
  originalDataHash: string;
  
  /** Anonymized data */
  anonymizedData: any;
  
  /** Anonymization metadata */
  metadata: AnonymizationMetadata;
  
  /** Any errors encountered */
  errors: string[];
  
  /** Warnings generated */
  warnings: string[];
}

export interface AnonymizationMetadata {
  /** Timestamp of anonymization */
  timestamp: Date;
  
  /** Anonymization techniques applied */
  techniquesApplied: string[];
  
  /** Fields that were anonymized */
  anonymizedFields: string[];
  
  /** Fields that were preserved */
  preservedFields: string[];
  
  /** Anonymization quality score */
  qualityScore: number;
  
  /** Reversibility information */
  reversibilityInfo: ReversibilityInfo;
  
  /** Audit trail */
  auditTrail: AnonymizationAuditEntry[];
}

export interface ReversibilityInfo {
  /** Whether anonymization is reversible */
  reversible: boolean;
  
  /** Key required for reversal (if applicable) */
  reversalKey?: string;
  
  /** Expiration time for reversal capability */
  reversalExpiration?: Date;
  
  /** Conditions under which reversal is allowed */
  reversalConditions: string[];
}

export interface AnonymizationAuditEntry {
  /** Timestamp of the action */
  timestamp: Date;
  
  /** Action performed */
  action: string;
  
  /** User/system that performed the action */
  performer: string;
  
  /** Additional context */
  context: Record<string, any>;
}

/**
 * Common PII types with detection patterns
 */
export const COMMON_PII_TYPES: PIIType[] = [
  {
    type: 'email',
    name: 'Email Address',
    sensitivity: 'medium',
    regulatoryImplications: ['GDPR', 'CCPA'],
  },
  {
    type: 'phone',
    name: 'Phone Number',
    sensitivity: 'medium',
    regulatoryImplications: ['GDPR', 'CCPA'],
  },
  {
    type: 'ssn',
    name: 'Social Security Number',
    sensitivity: 'critical',
    regulatoryImplications: ['GDPR', 'CCPA', 'HIPAA'],
  },
  {
    type: 'address',
    name: 'Physical Address',
    sensitivity: 'high',
    regulatoryImplications: ['GDPR', 'CCPA'],
  },
  {
    type: 'name',
    name: 'Personal Name',
    sensitivity: 'high',
    regulatoryImplications: ['GDPR', 'CCPA'],
  },
  {
    type: 'date_of_birth',
    name: 'Date of Birth',
    sensitivity: 'high',
    regulatoryImplications: ['GDPR', 'CCPA'],
  },
  {
    type: 'credit_card',
    name: 'Credit Card Number',
    sensitivity: 'critical',
    regulatoryImplications: ['PCI-DSS', 'GDPR'],
  },
  {
    type: 'ip_address',
    name: 'IP Address',
    sensitivity: 'medium',
    regulatoryImplications: ['GDPR'],
  },
];

/**
 * Default anonymization configuration
 */
export const DEFAULT_ANONYMIZATION_CONFIG: AnonymizationConfig = {
  enabled: true,
  techniques: [
    {
      id: 'email_masking',
      name: 'Email Masking',
      type: 'substitution',
      applicableFields: ['email', 'contact.email'],
      parameters: { maskChar: '*', preserveDomain: false },
      reversible: false,
    },
    {
      id: 'name_removal',
      name: 'Name Removal',
      type: 'suppression',
      applicableFields: ['firstName', 'lastName', 'fullName', 'name'],
      parameters: {},
      reversible: false,
    },
    {
      id: 'phone_masking',
      name: 'Phone Number Masking',
      type: 'substitution',
      applicableFields: ['phone', 'phoneNumber', 'contact.phone'],
      parameters: { maskChar: 'X', preserveFormat: true },
      reversible: false,
    },
    {
      id: 'address_generalization',
      name: 'Address Generalization',
      type: 'generalization',
      applicableFields: ['address', 'location', 'residence'],
      parameters: { level: 'city' },
      reversible: false,
    },
  ],
  sensitivityLevel: 'high',
  preserveFields: ['skills', 'experience', 'education', 'certifications'],
  customRules: [],
};

/**
 * Human oversight requirement structures
 */
export interface HumanOversightRequirement {
  /** Requirement identifier */
  id: string;
  
  /** Requirement description */
  description: string;
  
  /** When this requirement applies */
  applicableScenarios: string[];
  
  /** Minimum number of human reviewers */
  minimumReviewers: number;
  
  /** Required reviewer qualifications */
  reviewerQualifications: ReviewerQualification[];
  
  /** Maximum AI autonomy level allowed */
  maxAIAutonomyLevel: number;
  
  /** Review timeline requirements */
  reviewTimeline: ReviewTimeline;
}

export interface ReviewerQualification {
  /** Qualification type */
  type: 'certification' | 'experience' | 'training' | 'role';
  
  /** Specific requirement */
  requirement: string;
  
  /** Whether this qualification is mandatory */
  mandatory: boolean;
  
  /** Verification method */
  verificationMethod: string;
}

export interface ReviewTimeline {
  /** Maximum time for initial review */
  initialReviewHours: number;
  
  /** Maximum time for final decision */
  finalDecisionHours: number;
  
  /** Escalation timeline if no response */
  escalationHours: number;
  
  /** Business hours only or 24/7 */
  businessHoursOnly: boolean;
}

/**
 * Default human oversight requirements
 */
export const DEFAULT_HUMAN_OVERSIGHT_REQUIREMENTS: HumanOversightRequirement[] = [
  {
    id: 'final_hiring_decision',
    description: 'All final hiring decisions must have human oversight',
    applicableScenarios: ['job_offer', 'rejection', 'interview_invitation'],
    minimumReviewers: 1,
    reviewerQualifications: [
      {
        type: 'role',
        requirement: 'hiring_manager',
        mandatory: true,
        verificationMethod: 'role_based_access_control',
      },
    ],
    maxAIAutonomyLevel: 0.7,
    reviewTimeline: {
      initialReviewHours: 24,
      finalDecisionHours: 72,
      escalationHours: 48,
      businessHoursOnly: true,
    },
  },
  {
    id: 'bias_alert_review',
    description: 'Bias alerts require immediate human review',
    applicableScenarios: ['bias_threshold_exceeded', 'fairness_violation'],
    minimumReviewers: 2,
    reviewerQualifications: [
      {
        type: 'training',
        requirement: 'bias_detection_certified',
        mandatory: true,
        verificationMethod: 'certification_database',
      },
      {
        type: 'role',
        requirement: 'ethics_officer',
        mandatory: false,
        verificationMethod: 'role_based_access_control',
      },
    ],
    maxAIAutonomyLevel: 0.0,
    reviewTimeline: {
      initialReviewHours: 2,
      finalDecisionHours: 8,
      escalationHours: 4,
      businessHoursOnly: false,
    },
  },
];