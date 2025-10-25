// Bias Detection and Fairness Metrics Types

export interface FairnessMetrics {
  // Core fairness metrics
  demographicParity: number; // 0-1, closer to 1 is more fair
  equalizedOdds: number; // 0-1, measures equal TPR and FPR across groups
  predictiveEquality: number; // 0-1, equal FPR across groups
  treatmentEquality: number; // 0-1, equal threshold across groups
  disparateImpact: number; // 0-1, ratio of selection rates
  statisticalSignificance: number; // p-value for statistical tests
  
  // Additional metrics
  calibration: number; // 0-1, prediction accuracy across groups
  individualFairness: number; // 0-1, similar individuals treated similarly
  counterfactualFairness: number; // 0-1, decisions unchanged in counterfactual world
  
  // Metadata
  calculatedAt: Date;
  sampleSize: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number; // e.g., 0.95 for 95% CI
  };
  protectedAttributes: string[];
}

export interface BiasAnalysis {
  id: string;
  biasScore: number; // 0-1, higher means more biased
  flaggedTerms: BiasFlag[];
  suggestions: BiasSuggestion[];
  fairnessMetrics: FairnessMetrics;
  analysisType: BiasAnalysisType;
  confidence: number; // 0-1, confidence in the analysis
  severity: BiasSeverity;
  
  // Context
  sourceId: string; // ID of analyzed content (job, resume, etc.)
  sourceType: string;
  analyzedBy: string; // AI model or human reviewer
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface BiasFlag {
  term: string;
  category: BiasCategory;
  severity: BiasSeverity;
  context: string; // Surrounding text
  position: {
    start: number;
    end: number;
  };
  explanation: string;
  confidence: number;
  suggestedReplacement?: string;
}

export interface BiasSuggestion {
  type: 'replacement' | 'removal' | 'addition' | 'restructure';
  original: string;
  suggested: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  category: BiasCategory;
}

export type BiasAnalysisType = 
  | 'job_description'
  | 'resume_screening'
  | 'candidate_matching'
  | 'interview_feedback'
  | 'hiring_decision'
  | 'performance_review';

export type BiasCategory = 
  | 'gender'
  | 'race_ethnicity'
  | 'age'
  | 'disability'
  | 'religion'
  | 'sexual_orientation'
  | 'socioeconomic'
  | 'education'
  | 'geographic'
  | 'language'
  | 'appearance'
  | 'cultural'
  | 'other';

export type BiasSeverity = 'low' | 'medium' | 'high' | 'critical';

// Bias Monitoring and Alerting
export interface BiasAlert {
  id: string;
  type: BiasAlertType;
  severity: BiasSeverity;
  title: string;
  description: string;
  
  // Metrics that triggered the alert
  triggeringMetrics: {
    metric: keyof FairnessMetrics;
    value: number;
    threshold: number;
    trend?: 'improving' | 'worsening' | 'stable';
  }[];
  
  // Context
  affectedProcess: string; // e.g., "candidate_screening", "interview_scheduling"
  affectedGroups: string[];
  sampleSize: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  
  // Actions
  recommendedActions: BiasRemediation[];
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  assignedTo?: string;
  
  // Timestamps
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export type BiasAlertType = 
  | 'threshold_violation'
  | 'trend_deterioration'
  | 'statistical_anomaly'
  | 'compliance_risk'
  | 'model_drift';

export interface BiasRemediation {
  action: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedImpact: string;
  implementationSteps: string[];
  requiredApprovals: string[];
  estimatedTimeframe: string;
}

// Audit Trail for Bias Detection
export interface BiasAuditRecord {
  id: string;
  eventType: BiasAuditEventType;
  timestamp: Date;
  userId: string;
  userRole: string;
  
  // Event details
  description: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  
  // Context
  affectedEntity: {
    type: string; // 'candidate', 'job', 'model', etc.
    id: string;
  };
  
  // Compliance
  complianceFlags: string[];
  retentionPeriod: number; // days
}

export type BiasAuditEventType = 
  | 'bias_detection'
  | 'alert_triggered'
  | 'alert_resolved'
  | 'model_retrained'
  | 'threshold_changed'
  | 'manual_review'
  | 'compliance_check'
  | 'data_anonymized'
  | 'consent_updated';

// Statistical Testing for Bias Detection
export interface StatisticalTest {
  testType: StatisticalTestType;
  hypothesis: string;
  pValue: number;
  testStatistic: number;
  criticalValue: number;
  confidenceLevel: number;
  sampleSizes: Record<string, number>; // group -> sample size
  effectSize: number;
  powerAnalysis?: {
    power: number;
    minimumDetectableEffect: number;
  };
}

export type StatisticalTestType = 
  | 'chi_square'
  | 'fishers_exact'
  | 'two_proportion_z_test'
  | 'anova'
  | 'kruskal_wallis'
  | 'permutation_test';

// Bias Detection Configuration
export interface BiasDetectionConfig {
  // Thresholds for different metrics
  thresholds: {
    demographicParity: number;
    equalizedOdds: number;
    disparateImpact: number;
    statisticalSignificance: number;
  };
  
  // Protected attributes to monitor
  protectedAttributes: {
    name: string;
    categories: string[];
    required: boolean;
  }[];
  
  // Alert settings
  alertSettings: {
    enabled: boolean;
    notificationChannels: string[];
    escalationRules: {
      severity: BiasSeverity;
      timeToEscalate: number; // minutes
      escalateTo: string[];
    }[];
  };
  
  // Monitoring frequency
  monitoringSchedule: {
    realTime: boolean;
    batchFrequency: 'hourly' | 'daily' | 'weekly';
    reportingFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
  
  // Model settings
  modelSettings: {
    biasDetectionModel: string;
    confidenceThreshold: number;
    retrainingFrequency: number; // days
    validationDataSize: number;
  };
}