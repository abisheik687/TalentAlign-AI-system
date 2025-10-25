/**
 * Fairness Metrics and Bias Analysis Data Structures
 * Comprehensive tracking of bias metrics, fairness indicators, and compliance
 * Requirements: 4.3, 4.4, 8.1, 8.2
 */

export interface FairnessMetrics {
  /** Unique identifier for this metrics calculation */
  id: string;
  
  /** Timestamp when metrics were calculated */
  calculatedAt: Date;
  
  /** Context for which metrics were calculated */
  context: FairnessContext;
  
  /** Demographic parity metrics */
  demographicParity: DemographicParityMetrics;
  
  /** Equalized odds metrics */
  equalizedOdds: EqualizedOddsMetrics;
  
  /** Predictive equality metrics */
  predictiveEquality: PredictiveEqualityMetrics;
  
  /** Treatment equality metrics */
  treatmentEquality: TreatmentEqualityMetrics;
  
  /** Disparate impact analysis */
  disparateImpact: DisparateImpactMetrics;
  
  /** Statistical significance testing results */
  statisticalSignificance: StatisticalSignificanceMetrics;
  
  /** Overall fairness score (0-1, where 1 is most fair) */
  overallFairnessScore: number;
  
  /** Confidence interval for the metrics */
  confidenceInterval: ConfidenceInterval;
  
  /** Sample size used for calculations */
  sampleSize: SampleSizeInfo;
  
  /** Validation status */
  validationStatus: ValidationStatus;
}

export interface FairnessContext {
  /** Type of process being analyzed */
  processType: 'hiring' | 'promotion' | 'performance_review' | 'compensation' | 'matching';
  
  /** Specific stage in the process */
  stage: string;
  
  /** Time period for the analysis */
  timePeriod: {
    startDate: Date;
    endDate: Date;
  };
  
  /** Geographic scope */
  geographicScope: string[];
  
  /** Department or team scope */
  departmentScope: string[];
  
  /** Job levels included */
  jobLevels: string[];
}

export interface DemographicParityMetrics {
  /** Overall demographic parity score (0-1) */
  overallScore: number;
  
  /** Parity by protected attributes */
  byAttribute: Map<string, AttributeParityMetrics>;
  
  /** Intersectional analysis */
  intersectionalAnalysis: IntersectionalParityMetrics[];
  
  /** Threshold violations */
  violations: ParityViolation[];
  
  /** Trend analysis */
  trend: TrendAnalysis;
}

export interface AttributeParityMetrics {
  /** Attribute name (e.g., 'gender', 'ethnicity') */
  attributeName: string;
  
  /** Selection rates by group */
  selectionRates: Map<string, number>;
  
  /** Parity ratio (min rate / max rate) */
  parityRatio: number;
  
  /** Statistical significance of differences */
  statisticalSignificance: number;
  
  /** Sample sizes by group */
  sampleSizes: Map<string, number>;
  
  /** Confidence intervals by group */
  confidenceIntervals: Map<string, ConfidenceInterval>;
}

export interface EqualizedOddsMetrics {
  /** Overall equalized odds score */
  overallScore: number;
  
  /** True positive rate equality */
  truePositiveRateEquality: RateEqualityMetrics;
  
  /** False positive rate equality */
  falsePositiveRateEquality: RateEqualityMetrics;
  
  /** By protected attribute */
  byAttribute: Map<string, AttributeEqualizedOdds>;
  
  /** Violations */
  violations: EqualizedOddsViolation[];
}

export interface PredictiveEqualityMetrics {
  /** Overall predictive equality score */
  overallScore: number;
  
  /** False positive rate equality across groups */
  falsePositiveRateEquality: RateEqualityMetrics;
  
  /** Precision equality across groups */
  precisionEquality: RateEqualityMetrics;
  
  /** By protected attribute */
  byAttribute: Map<string, AttributePredictiveEquality>;
  
  /** Violations */
  violations: PredictiveEqualityViolation[];
}

export interface TreatmentEqualityMetrics {
  /** Overall treatment equality score */
  overallScore: number;
  
  /** Consistency in decision-making process */
  processConsistency: ProcessConsistencyMetrics;
  
  /** Time-to-decision equality */
  timeToDecisionEquality: TimeEqualityMetrics;
  
  /** Resource allocation equality */
  resourceAllocationEquality: ResourceEqualityMetrics;
  
  /** By protected attribute */
  byAttribute: Map<string, AttributeTreatmentEquality>;
  
  /** Violations */
  violations: TreatmentEqualityViolation[];
}

export interface DisparateImpactMetrics {
  /** Overall disparate impact ratio */
  overallRatio: number;
  
  /** Four-fifths rule compliance */
  fourFifthsRuleCompliance: boolean;
  
  /** Impact ratios by protected attribute */
  impactRatios: Map<string, Map<string, number>>;
  
  /** Statistical significance of impact */
  statisticalSignificance: Map<string, number>;
  
  /** Adverse impact indicators */
  adverseImpactIndicators: AdverseImpactIndicator[];
  
  /** Violations */
  violations: DisparateImpactViolation[];
}

export interface StatisticalSignificanceMetrics {
  /** P-values for various tests */
  pValues: Map<string, number>;
  
  /** Chi-square test results */
  chiSquareTests: ChiSquareTestResult[];
  
  /** Fisher's exact test results */
  fishersExactTests: FishersExactTestResult[];
  
  /** Effect sizes */
  effectSizes: Map<string, EffectSize>;
  
  /** Power analysis */
  powerAnalysis: PowerAnalysisResult;
  
  /** Multiple comparison corrections */
  multipleComparisonCorrections: MultipleComparisonResult[];
}

export interface BiasAnalysis {
  /** Unique identifier for this analysis */
  id: string;
  
  /** Timestamp of analysis */
  analyzedAt: Date;
  
  /** Type of bias analysis */
  analysisType: BiasAnalysisType;
  
  /** Context of the analysis */
  context: BiasAnalysisContext;
  
  /** Overall bias score (0-1, where 1 is highest bias) */
  overallBiasScore: number;
  
  /** Detected bias types */
  detectedBiasTypes: DetectedBias[];
  
  /** Bias sources analysis */
  biasSources: BiasSource[];
  
  /** Mitigation recommendations */
  mitigationRecommendations: MitigationRecommendation[];
  
  /** Confidence in analysis */
  confidence: number;
  
  /** Validation results */
  validationResults: BiasValidationResult[];
  
  /** Audit trail */
  auditTrail: BiasAuditEntry[];
  
  /** Compliance status */
  complianceStatus: ComplianceStatus;
}

export interface BiasAnalysisContext {
  /** Data source */
  dataSource: string;
  
  /** Analysis scope */
  scope: {
    startDate: Date;
    endDate: Date;
    departments: string[];
    jobLevels: string[];
    geographicRegions: string[];
  };
  
  /** Sample characteristics */
  sampleCharacteristics: SampleCharacteristics;
  
  /** Analysis parameters */
  analysisParameters: AnalysisParameters;
}

export interface DetectedBias {
  /** Type of bias detected */
  biasType: BiasType;
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Confidence in detection */
  confidence: number;
  
  /** Affected groups */
  affectedGroups: string[];
  
  /** Evidence supporting detection */
  evidence: BiasEvidence[];
  
  /** Impact assessment */
  impactAssessment: ImpactAssessment;
  
  /** Recommended actions */
  recommendedActions: string[];
}

export interface BiasSource {
  /** Source identifier */
  sourceId: string;
  
  /** Source type */
  sourceType: 'data' | 'algorithm' | 'process' | 'human' | 'systemic';
  
  /** Description of the source */
  description: string;
  
  /** Contribution to overall bias (0-1) */
  biasContribution: number;
  
  /** Detectability */
  detectability: 'easy' | 'moderate' | 'difficult' | 'hidden';
  
  /** Mitigation difficulty */
  mitigationDifficulty: 'easy' | 'moderate' | 'difficult' | 'very_difficult';
  
  /** Historical presence */
  historicalPresence: HistoricalPresence;
}

export interface MitigationRecommendation {
  /** Recommendation ID */
  id: string;
  
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  /** Recommendation type */
  type: 'immediate' | 'short_term' | 'long_term' | 'systemic';
  
  /** Description */
  description: string;
  
  /** Implementation steps */
  implementationSteps: ImplementationStep[];
  
  /** Expected impact */
  expectedImpact: ExpectedImpact;
  
  /** Resource requirements */
  resourceRequirements: ResourceRequirement[];
  
  /** Timeline */
  timeline: Timeline;
  
  /** Success metrics */
  successMetrics: SuccessMetric[];
}

export interface ComplianceTracking {
  /** Compliance framework */
  framework: ComplianceFramework;
  
  /** Compliance status */
  status: ComplianceStatus;
  
  /** Last assessment date */
  lastAssessmentDate: Date;
  
  /** Next assessment due */
  nextAssessmentDue: Date;
  
  /** Compliance score (0-100) */
  complianceScore: number;
  
  /** Areas of non-compliance */
  nonComplianceAreas: NonComplianceArea[];
  
  /** Remediation actions */
  remediationActions: RemediationAction[];
  
  /** Audit history */
  auditHistory: ComplianceAuditEntry[];
  
  /** Regulatory requirements */
  regulatoryRequirements: RegulatoryRequirement[];
}

export interface AuditTrail {
  /** Audit entry ID */
  id: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Action performed */
  action: AuditAction;
  
  /** Actor (user, system, etc.) */
  actor: AuditActor;
  
  /** Resource affected */
  resource: AuditResource;
  
  /** Changes made */
  changes: AuditChange[];
  
  /** Context information */
  context: AuditContext;
  
  /** Ethical impact assessment */
  ethicalImpact: EthicalImpactLevel;
  
  /** Compliance implications */
  complianceImplications: string[];
  
  /** Data retention period */
  retentionPeriod: number; // days
}

// Supporting types and enums

export enum BiasAnalysisType {
  HIRING_PROCESS = 'hiring_process',
  JOB_DESCRIPTION = 'job_description',
  RESUME_SCREENING = 'resume_screening',
  INTERVIEW_PROCESS = 'interview_process',
  PERFORMANCE_EVALUATION = 'performance_evaluation',
  PROMOTION_DECISION = 'promotion_decision',
  COMPENSATION_ANALYSIS = 'compensation_analysis',
  ALGORITHMIC_DECISION = 'algorithmic_decision'
}

export enum BiasType {
  DEMOGRAPHIC_BIAS = 'demographic_bias',
  CONFIRMATION_BIAS = 'confirmation_bias',
  AFFINITY_BIAS = 'affinity_bias',
  HALO_EFFECT = 'halo_effect',
  HORN_EFFECT = 'horn_effect',
  ANCHORING_BIAS = 'anchoring_bias',
  AVAILABILITY_BIAS = 'availability_bias',
  ATTRIBUTION_BIAS = 'attribution_bias',
  STEREOTYPING = 'stereotyping',
  SYSTEMIC_BIAS = 'systemic_bias',
  ALGORITHMIC_BIAS = 'algorithmic_bias',
  SELECTION_BIAS = 'selection_bias',
  MEASUREMENT_BIAS = 'measurement_bias'
}

export enum ComplianceFramework {
  EEOC = 'eeoc',
  GDPR = 'gdpr',
  CCPA = 'ccpa',
  SOX = 'sox',
  ISO_27001 = 'iso_27001',
  NIST = 'nist',
  CUSTOM = 'custom'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_REVIEW = 'under_review',
  REMEDIATION_IN_PROGRESS = 'remediation_in_progress'
}

export enum EthicalImpactLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  ANALYZE = 'analyze',
  APPROVE = 'approve',
  REJECT = 'reject',
  ESCALATE = 'escalate'
}

// Additional supporting interfaces

export interface ConfidenceInterval {
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number; // e.g., 0.95 for 95%
}

export interface SampleSizeInfo {
  total: number;
  byGroup: Map<string, number>;
  minimumRequired: number;
  adequacyScore: number; // 0-1
}

export interface ValidationStatus {
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  validatedBy: string;
  validatedAt: Date;
}

export interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'declining';
  magnitude: number;
  significance: number;
  timeframe: string;
  dataPoints: TrendDataPoint[];
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  context: string;
}

export interface ParityViolation {
  attributeName: string;
  violationType: 'threshold' | 'statistical' | 'practical';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  affectedGroups: string[];
  recommendedAction: string;
}

export interface RateEqualityMetrics {
  overallEquality: number;
  groupRates: Map<string, number>;
  maxDifference: number;
  statisticalSignificance: number;
}

export interface ProcessConsistencyMetrics {
  consistencyScore: number;
  variabilityMeasures: Map<string, number>;
  outlierDetection: OutlierAnalysis;
}

export interface TimeEqualityMetrics {
  averageTimeByGroup: Map<string, number>;
  timeVariability: Map<string, number>;
  equalityScore: number;
}

export interface ResourceEqualityMetrics {
  resourceAllocationByGroup: Map<string, number>;
  equalityScore: number;
  resourceTypes: string[];
}

export interface AdverseImpactIndicator {
  indicatorName: string;
  value: number;
  threshold: number;
  isViolation: boolean;
  affectedGroups: string[];
}

export interface ChiSquareTestResult {
  testName: string;
  chiSquareStatistic: number;
  degreesOfFreedom: number;
  pValue: number;
  criticalValue: number;
  isSignificant: boolean;
}

export interface FishersExactTestResult {
  testName: string;
  pValue: number;
  oddsRatio: number;
  confidenceInterval: ConfidenceInterval;
  isSignificant: boolean;
}

export interface EffectSize {
  measure: string; // e.g., "Cohen's d", "Cramer's V"
  value: number;
  interpretation: string; // e.g., "small", "medium", "large"
}

export interface PowerAnalysisResult {
  power: number;
  effectSize: number;
  sampleSize: number;
  alpha: number;
  isAdequate: boolean;
}

export interface MultipleComparisonResult {
  method: string; // e.g., "Bonferroni", "Holm"
  adjustedPValues: Map<string, number>;
  significantComparisons: string[];
}

export interface SampleCharacteristics {
  totalSize: number;
  demographicBreakdown: Map<string, Map<string, number>>;
  representativeness: number; // 0-1
  biasIndicators: string[];
}

export interface AnalysisParameters {
  significanceLevel: number;
  confidenceLevel: number;
  minimumSampleSize: number;
  biasThresholds: Map<string, number>;
  analysisMethod: string;
}

export interface BiasEvidence {
  evidenceType: string;
  description: string;
  strength: number; // 0-1
  source: string;
  timestamp: Date;
}

export interface ImpactAssessment {
  affectedPopulation: number;
  severityScore: number; // 0-1
  businessImpact: string;
  legalRisk: string;
  reputationalRisk: string;
}

export interface HistoricalPresence {
  firstDetected: Date;
  frequency: 'rare' | 'occasional' | 'frequent' | 'persistent';
  trendDirection: 'increasing' | 'stable' | 'decreasing';
}

export interface ImplementationStep {
  stepNumber: number;
  description: string;
  owner: string;
  estimatedDuration: number; // days
  dependencies: number[]; // step numbers
  resources: string[];
}

export interface ExpectedImpact {
  biasReduction: number; // 0-1
  timeframe: string;
  confidence: number; // 0-1
  riskFactors: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'financial' | 'technical' | 'time';
  description: string;
  quantity: number;
  unit: string;
  cost?: number;
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  criticalPath: string[];
}

export interface Milestone {
  name: string;
  date: Date;
  description: string;
  deliverables: string[];
}

export interface SuccessMetric {
  name: string;
  description: string;
  targetValue: number;
  currentValue?: number;
  measurementMethod: string;
  frequency: string;
}

export interface NonComplianceArea {
  area: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  regulatoryReference: string;
  discoveredDate: Date;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface RemediationAction {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  dueDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'overdue';
  progress: number; // 0-100
}

export interface ComplianceAuditEntry {
  auditId: string;
  auditDate: Date;
  auditor: string;
  auditType: 'internal' | 'external' | 'regulatory';
  findings: AuditFinding[];
  overallRating: string;
  nextAuditDate: Date;
}

export interface AuditFinding {
  findingId: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface RegulatoryRequirement {
  requirementId: string;
  framework: ComplianceFramework;
  description: string;
  applicability: string;
  complianceStatus: ComplianceStatus;
  lastReviewed: Date;
  nextReview: Date;
}

export interface AuditActor {
  type: 'user' | 'system' | 'api' | 'batch_job';
  id: string;
  name?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditResource {
  type: string;
  id: string;
  name?: string;
  category?: string;
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'create' | 'update' | 'delete';
}

export interface AuditContext {
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  businessContext?: string;
  additionalMetadata?: Record<string, any>;
}

export interface OutlierAnalysis {
  outliers: OutlierPoint[];
  detectionMethod: string;
  threshold: number;
  outlierRate: number;
}

export interface OutlierPoint {
  id: string;
  value: number;
  zScore: number;
  isOutlier: boolean;
  context: string;
}

// Utility interfaces for complex nested structures

export interface IntersectionalParityMetrics {
  intersectionAttributes: string[];
  parityScore: number;
  sampleSize: number;
  statisticalSignificance: number;
  violations: ParityViolation[];
}

export interface AttributeEqualizedOdds {
  attributeName: string;
  truePositiveRates: Map<string, number>;
  falsePositiveRates: Map<string, number>;
  equalityScore: number;
  violations: EqualizedOddsViolation[];
}

export interface EqualizedOddsViolation {
  attributeName: string;
  violationType: 'tpr_inequality' | 'fpr_inequality';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  affectedGroups: string[];
  description: string;
}

export interface AttributePredictiveEquality {
  attributeName: string;
  falsePositiveRates: Map<string, number>;
  precisionRates: Map<string, number>;
  equalityScore: number;
  violations: PredictiveEqualityViolation[];
}

export interface PredictiveEqualityViolation {
  attributeName: string;
  violationType: 'fpr_inequality' | 'precision_inequality';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  affectedGroups: string[];
  description: string;
}

export interface AttributeTreatmentEquality {
  attributeName: string;
  treatmentConsistency: number;
  processVariability: number;
  resourceEquality: number;
  overallScore: number;
  violations: TreatmentEqualityViolation[];
}

export interface TreatmentEqualityViolation {
  attributeName: string;
  violationType: 'process_inconsistency' | 'resource_inequality' | 'time_inequality';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  affectedGroups: string[];
  description: string;
}

export interface DisparateImpactViolation {
  attributeName: string;
  impactRatio: number;
  threshold: number;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  affectedGroups: string[];
  description: string;
  legalImplications: string[];
}

export interface BiasValidationResult {
  validationType: string;
  isValid: boolean;
  confidence: number;
  validationMethod: string;
  validatedBy: string;
  validatedAt: Date;
  notes?: string;
}