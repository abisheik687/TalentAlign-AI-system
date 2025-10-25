// Ethics Dashboard and Compliance Types

export interface EthicsReport {
  id: string;
  reportType: EthicsReportType;
  period: ReportPeriod;
  
  // Executive summary
  summary: EthicsSummary;
  
  // Detailed metrics
  fairnessMetrics: ComprehensiveFairnessMetrics;
  biasAnalysis: SystemBiasAnalysis;
  complianceStatus: ComplianceStatus;
  
  // Recommendations
  recommendations: EthicsRecommendation[];
  actionItems: ActionItem[];
  
  // Metadata
  generatedAt: Date;
  generatedBy: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  publishedAt?: Date;
  
  // Audit trail
  auditTrail: EthicsAuditEntry[];
}

export type EthicsReportType = 
  | 'quarterly'
  | 'annual'
  | 'incident'
  | 'compliance'
  | 'transparency'
  | 'ad_hoc';

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  description: string;
}

export interface EthicsSummary {
  overallEthicsScore: number; // 0-100
  keyFindings: string[];
  majorConcerns: string[];
  improvements: string[];
  complianceStatus: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
  
  // High-level metrics
  totalCandidatesProcessed: number;
  totalJobsPosted: number;
  biasIncidentsDetected: number;
  biasIncidentsResolved: number;
  
  // Trend indicators
  trendsFromPreviousPeriod: TrendIndicator[];
}

export interface TrendIndicator {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number; // percentage change
  trend: 'improving' | 'worsening' | 'stable';
  significance: 'significant' | 'minor' | 'negligible';
}

// Comprehensive Fairness Metrics
export interface ComprehensiveFairnessMetrics {
  // Hiring funnel metrics
  applicationStage: FunnelStageMetrics;
  screeningStage: FunnelStageMetrics;
  interviewStage: FunnelStageMetrics;
  offerStage: FunnelStageMetrics;
  
  // Cross-stage analysis
  overallFunnelAnalysis: FunnelAnalysis;
  
  // Temporal analysis
  temporalTrends: TemporalFairnessAnalysis;
  
  // Intersectional analysis
  intersectionalAnalysis: IntersectionalAnalysis;
}

export interface FunnelStageMetrics {
  stageName: string;
  
  // Basic metrics by demographic
  demographicBreakdown: DemographicBreakdown[];
  
  // Fairness metrics
  demographicParity: number;
  equalizedOdds: number;
  predictiveEquality: number;
  calibration: number;
  
  // Statistical significance
  statisticalTests: StatisticalTestResult[];
  
  // Sample sizes
  totalCandidates: number;
  demographicSampleSizes: Record<string, number>;
}

export interface DemographicBreakdown {
  demographic: string;
  category: string;
  count: number;
  percentage: number;
  selectionRate: number;
  averageScore?: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
}

export interface FunnelAnalysis {
  overallConversionRate: number;
  demographicConversionRates: Record<string, number>;
  bottleneckStages: string[];
  disparityPoints: DisparityPoint[];
  recommendations: string[];
}

export interface DisparityPoint {
  stage: string;
  demographic: string;
  expectedRate: number;
  actualRate: number;
  disparity: number;
  significance: number; // p-value
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TemporalFairnessAnalysis {
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dataPoints: TemporalDataPoint[];
  trends: FairnessTrend[];
  seasonalPatterns: SeasonalPattern[];
  anomalies: TemporalAnomaly[];
}

export interface TemporalDataPoint {
  period: string;
  timestamp: Date;
  fairnessMetrics: Record<string, number>;
  sampleSize: number;
  confidence: number;
}

export interface FairnessTrend {
  metric: string;
  direction: 'improving' | 'worsening' | 'stable';
  rate: number; // change per period
  significance: number;
  projectedValue: number;
  confidenceInterval: [number, number];
}

export interface SeasonalPattern {
  metric: string;
  pattern: 'seasonal' | 'cyclical' | 'irregular';
  description: string;
  strength: number; // 0-1
  periods: string[];
}

export interface TemporalAnomaly {
  period: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: 'minor' | 'moderate' | 'major';
  possibleCauses: string[];
}

export interface IntersectionalAnalysis {
  intersections: IntersectionalGroup[];
  compoundEffects: CompoundEffect[];
  recommendations: IntersectionalRecommendation[];
}

export interface IntersectionalGroup {
  demographics: string[];
  groupSize: number;
  representation: number; // percentage of total
  outcomes: IntersectionalOutcome[];
  uniqueChallenges: string[];
}

export interface IntersectionalOutcome {
  stage: string;
  rate: number;
  expectedRate: number;
  disparity: number;
  comparisonGroups: string[];
}

export interface CompoundEffect {
  demographics: string[];
  effect: 'additive' | 'multiplicative' | 'protective' | 'amplifying';
  magnitude: number;
  description: string;
  evidence: string[];
}

export interface IntersectionalRecommendation {
  targetGroups: string[];
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedImpact: string;
  implementationSteps: string[];
}

// System Bias Analysis
export interface SystemBiasAnalysis {
  // Model bias analysis
  modelBiasAssessment: ModelBiasAssessment[];
  
  // Data bias analysis
  dataBiasAssessment: DataBiasAssessment;
  
  // Process bias analysis
  processBiasAssessment: ProcessBiasAssessment[];
  
  // Human bias analysis
  humanBiasAssessment: HumanBiasAssessment;
  
  // Systemic bias patterns
  systemicPatterns: SystemicBiasPattern[];
}

export interface ModelBiasAssessment {
  modelName: string;
  modelVersion: string;
  biasType: BiasType[];
  
  // Bias metrics
  biasScore: number; // 0-1
  fairnessMetrics: Record<string, number>;
  
  // Testing results
  adversarialTestResults: AdversarialTestResult[];
  counterfactualTestResults: CounterfactualTestResult[];
  
  // Mitigation status
  mitigationTechniques: string[];
  mitigationEffectiveness: number; // 0-100
  
  // Recommendations
  recommendations: string[];
  nextReviewDate: Date;
}

export interface DataBiasAssessment {
  // Training data analysis
  trainingDataBias: DataBiasMetric[];
  
  // Input data analysis
  inputDataBias: DataBiasMetric[];
  
  // Historical bias
  historicalBiasPatterns: HistoricalBiasPattern[];
  
  // Data quality issues
  dataQualityIssues: DataQualityIssue[];
}

export interface DataBiasMetric {
  biasType: string;
  severity: BiasSeverity;
  affectedFeatures: string[];
  description: string;
  quantification: number;
  mitigation: string[];
}

export interface ProcessBiasAssessment {
  processName: string;
  biasRiskScore: number; // 0-100
  identifiedBiases: ProcessBias[];
  mitigationMeasures: ProcessMitigation[];
  effectiveness: number; // 0-100
  recommendations: string[];
}

export interface ProcessBias {
  biasType: string;
  stage: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  affectedGroups: string[];
}

export interface ProcessMitigation {
  technique: string;
  description: string;
  implementation: string;
  effectiveness: number; // 0-100
  monitoringMethod: string;
}

export interface HumanBiasAssessment {
  // Reviewer bias analysis
  reviewerBiasMetrics: ReviewerBiasMetric[];
  
  // Decision consistency
  decisionConsistency: DecisionConsistencyMetric[];
  
  // Training effectiveness
  biasTrainingEffectiveness: TrainingEffectivenessMetric[];
  
  // Intervention effectiveness
  interventionEffectiveness: InterventionEffectivenessMetric[];
}

export interface ReviewerBiasMetric {
  reviewerId: string; // anonymized
  role: string;
  biasIndicators: BiasIndicator[];
  consistencyScore: number; // 0-100
  calibrationScore: number; // 0-100
  recommendedActions: string[];
}

export interface BiasIndicator {
  type: string;
  strength: number; // 0-1
  confidence: number; // 0-1
  examples: string[];
  pattern: string;
}

export interface SystemicBiasPattern {
  patternName: string;
  description: string;
  prevalence: number; // 0-1
  impact: 'low' | 'medium' | 'high' | 'systemic';
  affectedProcesses: string[];
  rootCauses: string[];
  interventions: string[];
  monitoringPlan: string;
}

// Compliance Status and Monitoring
export interface ComplianceStatus {
  overallStatus: ComplianceLevel;
  
  // Regulatory compliance
  regulatoryCompliance: RegulatoryCompliance[];
  
  // Internal policy compliance
  policyCompliance: PolicyCompliance[];
  
  // Industry standards compliance
  standardsCompliance: StandardsCompliance[];
  
  // Audit results
  auditResults: AuditResult[];
  
  // Risk assessment
  complianceRisks: ComplianceRisk[];
}

export type ComplianceLevel = 
  | 'fully_compliant'
  | 'substantially_compliant'
  | 'partially_compliant'
  | 'non_compliant';

export interface RegulatoryCompliance {
  regulation: string;
  jurisdiction: string;
  status: ComplianceLevel;
  requirements: RequirementCompliance[];
  lastAssessment: Date;
  nextAssessment: Date;
  assessor: string;
}

export interface RequirementCompliance {
  requirement: string;
  status: ComplianceLevel;
  evidence: string[];
  gaps: string[];
  remediation: string[];
  dueDate?: Date;
}

export interface PolicyCompliance {
  policyName: string;
  version: string;
  status: ComplianceLevel;
  violations: PolicyViolation[];
  lastReview: Date;
  nextReview: Date;
}

export interface PolicyViolation {
  violationType: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  occurrenceDate: Date;
  resolution: string;
  resolvedDate?: Date;
  preventiveMeasures: string[];
}

export interface StandardsCompliance {
  standard: string;
  version: string;
  certificationBody?: string;
  status: ComplianceLevel;
  certificationDate?: Date;
  expiryDate?: Date;
  assessmentResults: AssessmentResult[];
}

export interface AssessmentResult {
  criterion: string;
  score: number;
  maxScore: number;
  status: 'pass' | 'fail' | 'conditional';
  findings: string[];
  recommendations: string[];
}

export interface AuditResult {
  auditId: string;
  auditType: 'internal' | 'external' | 'regulatory' | 'certification';
  auditor: string;
  scope: string[];
  
  // Results
  overallRating: AuditRating;
  findings: AuditFinding[];
  recommendations: AuditRecommendation[];
  
  // Timeline
  auditDate: Date;
  reportDate: Date;
  responseDate?: Date;
  
  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  status: 'open' | 'in_progress' | 'closed';
}

export type AuditRating = 
  | 'excellent'
  | 'satisfactory'
  | 'needs_improvement'
  | 'unsatisfactory';

export interface AuditFinding {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  impact: string;
  recommendation: string;
  managementResponse?: string;
  targetDate?: Date;
  status: 'open' | 'in_progress' | 'closed';
}

export interface AuditRecommendation {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recommendation: string;
  rationale: string;
  expectedBenefit: string;
  implementationSteps: string[];
  estimatedCost?: string;
  estimatedTimeframe: string;
  assignedTo?: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
}

export interface ComplianceRisk {
  riskId: string;
  category: string;
  description: string;
  likelihood: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impact: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  riskScore: number; // 0-100
  
  // Mitigation
  mitigationMeasures: string[];
  residualRisk: number; // 0-100
  
  // Monitoring
  monitoringFrequency: string;
  keyIndicators: string[];
  
  // Ownership
  riskOwner: string;
  lastReview: Date;
  nextReview: Date;
}

// Ethics Recommendations and Actions
export interface EthicsRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Content
  title: string;
  description: string;
  rationale: string;
  expectedImpact: string;
  
  // Implementation
  implementationSteps: ImplementationStep[];
  estimatedTimeframe: string;
  estimatedCost?: string;
  requiredResources: string[];
  
  // Approval and tracking
  status: RecommendationStatus;
  assignedTo?: string;
  approvedBy?: string;
  approvedAt?: Date;
  
  // Metrics
  successMetrics: string[];
  monitoringPlan: string;
  
  // Timeline
  createdAt: Date;
  targetDate?: Date;
  completedAt?: Date;
}

export type RecommendationCategory = 
  | 'bias_mitigation'
  | 'process_improvement'
  | 'training'
  | 'technology'
  | 'policy'
  | 'compliance'
  | 'monitoring'
  | 'transparency';

export type RecommendationStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'on_hold';

export interface ImplementationStep {
  stepNumber: number;
  description: string;
  owner: string;
  estimatedDuration: string;
  dependencies: string[];
  deliverables: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Assignment
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
  
  // Timeline
  dueDate: Date;
  estimatedHours?: number;
  
  // Status
  status: ActionItemStatus;
  progress: number; // 0-100
  
  // Updates
  updates: ActionItemUpdate[];
  
  // Completion
  completedAt?: Date;
  completionNotes?: string;
}

export type ActionItemStatus = 
  | 'open'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export interface ActionItemUpdate {
  updateDate: Date;
  updatedBy: string;
  progress: number;
  notes: string;
  blockers?: string[];
  nextSteps?: string[];
}

// Ethics Audit Trail
export interface EthicsAuditEntry {
  id: string;
  timestamp: Date;
  eventType: EthicsEventType;
  userId: string;
  userRole: string;
  
  // Event details
  description: string;
  entityType: string;
  entityId: string;
  
  // Changes
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  
  // Context
  context: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  
  // Compliance
  retentionPeriod: number; // days
  complianceFlags: string[];
}

export type EthicsEventType = 
  | 'bias_detected'
  | 'bias_resolved'
  | 'threshold_violated'
  | 'threshold_updated'
  | 'model_retrained'
  | 'audit_completed'
  | 'policy_updated'
  | 'training_completed'
  | 'incident_reported'
  | 'incident_resolved'
  | 'compliance_check'
  | 'data_exported'
  | 'data_deleted'
  | 'consent_updated';

// Supporting Types
export interface StatisticalTestResult {
  testName: string;
  hypothesis: string;
  pValue: number;
  testStatistic: number;
  criticalValue: number;
  result: 'reject_null' | 'fail_to_reject_null';
  effectSize?: number;
  confidenceInterval?: [number, number];
}

export interface AdversarialTestResult {
  testName: string;
  attackType: string;
  successRate: number; // 0-1
  averageConfidenceChange: number;
  robustnessScore: number; // 0-100
  vulnerabilities: string[];
}

export interface CounterfactualTestResult {
  scenario: string;
  originalOutcome: number;
  counterfactualOutcome: number;
  difference: number;
  fairnessViolation: boolean;
  explanation: string;
}

export interface HistoricalBiasPattern {
  pattern: string;
  timeframe: string;
  description: string;
  impact: string;
  resolution: string;
  lessonsLearned: string[];
}

export interface DataQualityIssue {
  issueType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedData: string[];
  impact: string;
  resolution: string;
  preventiveMeasures: string[];
}

export interface DecisionConsistencyMetric {
  decisionType: string;
  consistencyScore: number; // 0-100
  variabilityMeasure: number;
  outlierCount: number;
  recommendations: string[];
}

export interface TrainingEffectivenessMetric {
  trainingProgram: string;
  participantCount: number;
  preTrainingScore: number;
  postTrainingScore: number;
  improvement: number;
  retentionRate: number; // after 3 months
  behaviorChange: string[];
}

export interface InterventionEffectivenessMetric {
  interventionType: string;
  targetBehavior: string;
  baselineMetric: number;
  postInterventionMetric: number;
  improvement: number;
  sustainabilityScore: number; // 0-100
  sideEffects: string[];
}