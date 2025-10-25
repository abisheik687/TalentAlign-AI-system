// Bias detection and fairness constants

// Bias Categories
export const BIAS_CATEGORIES = {
  GENDER: 'gender',
  RACE_ETHNICITY: 'race_ethnicity',
  AGE: 'age',
  DISABILITY: 'disability',
  RELIGION: 'religion',
  SEXUAL_ORIENTATION: 'sexual_orientation',
  SOCIOECONOMIC: 'socioeconomic',
  EDUCATION: 'education',
  GEOGRAPHIC: 'geographic',
  LANGUAGE: 'language',
  APPEARANCE: 'appearance',
  CULTURAL: 'cultural',
  OTHER: 'other',
} as const;

export const BIAS_CATEGORY_DISPLAY = {
  [BIAS_CATEGORIES.GENDER]: 'Gender',
  [BIAS_CATEGORIES.RACE_ETHNICITY]: 'Race/Ethnicity',
  [BIAS_CATEGORIES.AGE]: 'Age',
  [BIAS_CATEGORIES.DISABILITY]: 'Disability',
  [BIAS_CATEGORIES.RELIGION]: 'Religion',
  [BIAS_CATEGORIES.SEXUAL_ORIENTATION]: 'Sexual Orientation',
  [BIAS_CATEGORIES.SOCIOECONOMIC]: 'Socioeconomic Status',
  [BIAS_CATEGORIES.EDUCATION]: 'Educational Background',
  [BIAS_CATEGORIES.GEOGRAPHIC]: 'Geographic Location',
  [BIAS_CATEGORIES.LANGUAGE]: 'Language/Accent',
  [BIAS_CATEGORIES.APPEARANCE]: 'Physical Appearance',
  [BIAS_CATEGORIES.CULTURAL]: 'Cultural Background',
  [BIAS_CATEGORIES.OTHER]: 'Other',
} as const;

// Bias Analysis Types
export const BIAS_ANALYSIS_TYPES = {
  JOB_DESCRIPTION: 'job_description',
  RESUME_SCREENING: 'resume_screening',
  CANDIDATE_MATCHING: 'candidate_matching',
  INTERVIEW_FEEDBACK: 'interview_feedback',
  HIRING_DECISION: 'hiring_decision',
  PERFORMANCE_REVIEW: 'performance_review',
} as const;

export const BIAS_ANALYSIS_TYPE_DISPLAY = {
  [BIAS_ANALYSIS_TYPES.JOB_DESCRIPTION]: 'Job Description',
  [BIAS_ANALYSIS_TYPES.RESUME_SCREENING]: 'Resume Screening',
  [BIAS_ANALYSIS_TYPES.CANDIDATE_MATCHING]: 'Candidate Matching',
  [BIAS_ANALYSIS_TYPES.INTERVIEW_FEEDBACK]: 'Interview Feedback',
  [BIAS_ANALYSIS_TYPES.HIRING_DECISION]: 'Hiring Decision',
  [BIAS_ANALYSIS_TYPES.PERFORMANCE_REVIEW]: 'Performance Review',
} as const;

// Bias Alert Types
export const BIAS_ALERT_TYPES = {
  THRESHOLD_VIOLATION: 'threshold_violation',
  TREND_DETERIORATION: 'trend_deterioration',
  STATISTICAL_ANOMALY: 'statistical_anomaly',
  COMPLIANCE_RISK: 'compliance_risk',
  MODEL_DRIFT: 'model_drift',
} as const;

export const BIAS_ALERT_TYPE_DISPLAY = {
  [BIAS_ALERT_TYPES.THRESHOLD_VIOLATION]: 'Threshold Violation',
  [BIAS_ALERT_TYPES.TREND_DETERIORATION]: 'Trend Deterioration',
  [BIAS_ALERT_TYPES.STATISTICAL_ANOMALY]: 'Statistical Anomaly',
  [BIAS_ALERT_TYPES.COMPLIANCE_RISK]: 'Compliance Risk',
  [BIAS_ALERT_TYPES.MODEL_DRIFT]: 'Model Drift',
} as const;

// Fairness Metrics
export const FAIRNESS_METRICS = {
  DEMOGRAPHIC_PARITY: 'demographic_parity',
  EQUALIZED_ODDS: 'equalized_odds',
  PREDICTIVE_EQUALITY: 'predictive_equality',
  TREATMENT_EQUALITY: 'treatment_equality',
  DISPARATE_IMPACT: 'disparate_impact',
  CALIBRATION: 'calibration',
  INDIVIDUAL_FAIRNESS: 'individual_fairness',
  COUNTERFACTUAL_FAIRNESS: 'counterfactual_fairness',
} as const;

export const FAIRNESS_METRIC_DISPLAY = {
  [FAIRNESS_METRICS.DEMOGRAPHIC_PARITY]: 'Demographic Parity',
  [FAIRNESS_METRICS.EQUALIZED_ODDS]: 'Equalized Odds',
  [FAIRNESS_METRICS.PREDICTIVE_EQUALITY]: 'Predictive Equality',
  [FAIRNESS_METRICS.TREATMENT_EQUALITY]: 'Treatment Equality',
  [FAIRNESS_METRICS.DISPARATE_IMPACT]: 'Disparate Impact',
  [FAIRNESS_METRICS.CALIBRATION]: 'Calibration',
  [FAIRNESS_METRICS.INDIVIDUAL_FAIRNESS]: 'Individual Fairness',
  [FAIRNESS_METRICS.COUNTERFACTUAL_FAIRNESS]: 'Counterfactual Fairness',
} as const;

export const FAIRNESS_METRIC_DESCRIPTIONS = {
  [FAIRNESS_METRICS.DEMOGRAPHIC_PARITY]: 'Equal selection rates across demographic groups',
  [FAIRNESS_METRICS.EQUALIZED_ODDS]: 'Equal true positive and false positive rates across groups',
  [FAIRNESS_METRICS.PREDICTIVE_EQUALITY]: 'Equal false positive rates across groups',
  [FAIRNESS_METRICS.TREATMENT_EQUALITY]: 'Equal ratio of false positives to false negatives across groups',
  [FAIRNESS_METRICS.DISPARATE_IMPACT]: 'Ratio of selection rates between groups (80% rule)',
  [FAIRNESS_METRICS.CALIBRATION]: 'Predicted probabilities match actual outcomes across groups',
  [FAIRNESS_METRICS.INDIVIDUAL_FAIRNESS]: 'Similar individuals receive similar treatment',
  [FAIRNESS_METRICS.COUNTERFACTUAL_FAIRNESS]: 'Decisions unchanged in counterfactual world',
} as const;

// Default Fairness Thresholds
export const DEFAULT_FAIRNESS_THRESHOLDS = {
  [FAIRNESS_METRICS.DEMOGRAPHIC_PARITY]: 0.8, // 80% minimum
  [FAIRNESS_METRICS.EQUALIZED_ODDS]: 0.8,
  [FAIRNESS_METRICS.PREDICTIVE_EQUALITY]: 0.8,
  [FAIRNESS_METRICS.TREATMENT_EQUALITY]: 0.8,
  [FAIRNESS_METRICS.DISPARATE_IMPACT]: 0.8, // 80% rule
  [FAIRNESS_METRICS.CALIBRATION]: 0.8,
  [FAIRNESS_METRICS.INDIVIDUAL_FAIRNESS]: 0.8,
  [FAIRNESS_METRICS.COUNTERFACTUAL_FAIRNESS]: 0.8,
} as const;

// Statistical Test Types
export const STATISTICAL_TEST_TYPES = {
  CHI_SQUARE: 'chi_square',
  FISHERS_EXACT: 'fishers_exact',
  TWO_PROPORTION_Z_TEST: 'two_proportion_z_test',
  ANOVA: 'anova',
  KRUSKAL_WALLIS: 'kruskal_wallis',
  PERMUTATION_TEST: 'permutation_test',
} as const;

export const STATISTICAL_TEST_DISPLAY = {
  [STATISTICAL_TEST_TYPES.CHI_SQUARE]: 'Chi-Square Test',
  [STATISTICAL_TEST_TYPES.FISHERS_EXACT]: "Fisher's Exact Test",
  [STATISTICAL_TEST_TYPES.TWO_PROPORTION_Z_TEST]: 'Two-Proportion Z-Test',
  [STATISTICAL_TEST_TYPES.ANOVA]: 'ANOVA',
  [STATISTICAL_TEST_TYPES.KRUSKAL_WALLIS]: 'Kruskal-Wallis Test',
  [STATISTICAL_TEST_TYPES.PERMUTATION_TEST]: 'Permutation Test',
} as const;

// Protected Attributes (for monitoring)
export const PROTECTED_ATTRIBUTES = {
  GENDER: 'gender',
  RACE: 'race',
  ETHNICITY: 'ethnicity',
  AGE_GROUP: 'age_group',
  DISABILITY_STATUS: 'disability_status',
  VETERAN_STATUS: 'veteran_status',
  RELIGION: 'religion',
  SEXUAL_ORIENTATION: 'sexual_orientation',
  MARITAL_STATUS: 'marital_status',
  PARENTAL_STATUS: 'parental_status',
} as const;

export const PROTECTED_ATTRIBUTE_DISPLAY = {
  [PROTECTED_ATTRIBUTES.GENDER]: 'Gender',
  [PROTECTED_ATTRIBUTES.RACE]: 'Race',
  [PROTECTED_ATTRIBUTES.ETHNICITY]: 'Ethnicity',
  [PROTECTED_ATTRIBUTES.AGE_GROUP]: 'Age Group',
  [PROTECTED_ATTRIBUTES.DISABILITY_STATUS]: 'Disability Status',
  [PROTECTED_ATTRIBUTES.VETERAN_STATUS]: 'Veteran Status',
  [PROTECTED_ATTRIBUTES.RELIGION]: 'Religion',
  [PROTECTED_ATTRIBUTES.SEXUAL_ORIENTATION]: 'Sexual Orientation',
  [PROTECTED_ATTRIBUTES.MARITAL_STATUS]: 'Marital Status',
  [PROTECTED_ATTRIBUTES.PARENTAL_STATUS]: 'Parental Status',
} as const;

// Bias Mitigation Techniques
export const BIAS_MITIGATION_TECHNIQUES = {
  PRE_PROCESSING: 'pre_processing',
  IN_PROCESSING: 'in_processing',
  POST_PROCESSING: 'post_processing',
  ADVERSARIAL_DEBIASING: 'adversarial_debiasing',
  FAIRNESS_CONSTRAINTS: 'fairness_constraints',
  REWEIGHTING: 'reweighting',
  RESAMPLING: 'resampling',
  FEATURE_SELECTION: 'feature_selection',
  THRESHOLD_OPTIMIZATION: 'threshold_optimization',
  CALIBRATION: 'calibration',
} as const;

export const BIAS_MITIGATION_TECHNIQUE_DISPLAY = {
  [BIAS_MITIGATION_TECHNIQUES.PRE_PROCESSING]: 'Pre-processing',
  [BIAS_MITIGATION_TECHNIQUES.IN_PROCESSING]: 'In-processing',
  [BIAS_MITIGATION_TECHNIQUES.POST_PROCESSING]: 'Post-processing',
  [BIAS_MITIGATION_TECHNIQUES.ADVERSARIAL_DEBIASING]: 'Adversarial Debiasing',
  [BIAS_MITIGATION_TECHNIQUES.FAIRNESS_CONSTRAINTS]: 'Fairness Constraints',
  [BIAS_MITIGATION_TECHNIQUES.REWEIGHTING]: 'Reweighting',
  [BIAS_MITIGATION_TECHNIQUES.RESAMPLING]: 'Resampling',
  [BIAS_MITIGATION_TECHNIQUES.FEATURE_SELECTION]: 'Feature Selection',
  [BIAS_MITIGATION_TECHNIQUES.THRESHOLD_OPTIMIZATION]: 'Threshold Optimization',
  [BIAS_MITIGATION_TECHNIQUES.CALIBRATION]: 'Calibration',
} as const;

// Bias Detection Confidence Levels
export const BIAS_CONFIDENCE_LEVELS = {
  LOW: 0.6,
  MEDIUM: 0.75,
  HIGH: 0.9,
  VERY_HIGH: 0.95,
} as const;

// Statistical Significance Levels
export const SIGNIFICANCE_LEVELS = {
  ALPHA_001: 0.01,
  ALPHA_005: 0.05,
  ALPHA_010: 0.10,
} as const;

// Bias Score Ranges
export const BIAS_SCORE_RANGES = {
  LOW: { min: 0, max: 0.3, color: '#10b981', label: 'Low Risk' },
  MEDIUM: { min: 0.3, max: 0.6, color: '#f59e0b', label: 'Medium Risk' },
  HIGH: { min: 0.6, max: 0.8, color: '#f97316', label: 'High Risk' },
  CRITICAL: { min: 0.8, max: 1.0, color: '#ef4444', label: 'Critical Risk' },
} as const;

// Common Biased Terms (for job descriptions)
export const COMMON_BIASED_TERMS = {
  GENDER: [
    'guys', 'ninja', 'rockstar', 'guru', 'hero', 'superman',
    'aggressive', 'dominant', 'competitive', 'ambitious',
    'nurturing', 'supportive', 'collaborative', 'empathetic',
  ],
  AGE: [
    'young', 'energetic', 'fresh', 'recent graduate',
    'experienced', 'mature', 'seasoned', 'senior',
    'digital native', 'tech-savvy',
  ],
  CULTURAL: [
    'culture fit', 'team player', 'go-getter',
    'native speaker', 'articulate', 'professional appearance',
  ],
  SOCIOECONOMIC: [
    'prestigious university', 'elite education',
    'country club', 'yacht club', 'golf',
  ],
} as const;

// Bias Remediation Actions
export const BIAS_REMEDIATION_ACTIONS = {
  RETRAIN_MODEL: 'retrain_model',
  ADJUST_THRESHOLDS: 'adjust_thresholds',
  UPDATE_TRAINING_DATA: 'update_training_data',
  IMPLEMENT_FAIRNESS_CONSTRAINTS: 'implement_fairness_constraints',
  REVIEW_PROCESS: 'review_process',
  ADDITIONAL_TRAINING: 'additional_training',
  POLICY_UPDATE: 'policy_update',
  MANUAL_REVIEW: 'manual_review',
  INCREASE_MONITORING: 'increase_monitoring',
  STAKEHOLDER_NOTIFICATION: 'stakeholder_notification',
} as const;

export const BIAS_REMEDIATION_ACTION_DISPLAY = {
  [BIAS_REMEDIATION_ACTIONS.RETRAIN_MODEL]: 'Retrain Model',
  [BIAS_REMEDIATION_ACTIONS.ADJUST_THRESHOLDS]: 'Adjust Thresholds',
  [BIAS_REMEDIATION_ACTIONS.UPDATE_TRAINING_DATA]: 'Update Training Data',
  [BIAS_REMEDIATION_ACTIONS.IMPLEMENT_FAIRNESS_CONSTRAINTS]: 'Implement Fairness Constraints',
  [BIAS_REMEDIATION_ACTIONS.REVIEW_PROCESS]: 'Review Process',
  [BIAS_REMEDIATION_ACTIONS.ADDITIONAL_TRAINING]: 'Additional Training',
  [BIAS_REMEDIATION_ACTIONS.POLICY_UPDATE]: 'Policy Update',
  [BIAS_REMEDIATION_ACTIONS.MANUAL_REVIEW]: 'Manual Review',
  [BIAS_REMEDIATION_ACTIONS.INCREASE_MONITORING]: 'Increase Monitoring',
  [BIAS_REMEDIATION_ACTIONS.STAKEHOLDER_NOTIFICATION]: 'Stakeholder Notification',
} as const;

// Monitoring Frequencies
export const MONITORING_FREQUENCIES = {
  REAL_TIME: 'real_time',
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
} as const;

export const MONITORING_FREQUENCY_DISPLAY = {
  [MONITORING_FREQUENCIES.REAL_TIME]: 'Real-time',
  [MONITORING_FREQUENCIES.HOURLY]: 'Hourly',
  [MONITORING_FREQUENCIES.DAILY]: 'Daily',
  [MONITORING_FREQUENCIES.WEEKLY]: 'Weekly',
  [MONITORING_FREQUENCIES.MONTHLY]: 'Monthly',
  [MONITORING_FREQUENCIES.QUARTERLY]: 'Quarterly',
} as const;

// Helper functions
export const getBiasScoreLevel = (score: number): keyof typeof BIAS_SCORE_RANGES => {
  if (score < BIAS_SCORE_RANGES.LOW.max) return 'LOW';
  if (score < BIAS_SCORE_RANGES.MEDIUM.max) return 'MEDIUM';
  if (score < BIAS_SCORE_RANGES.HIGH.max) return 'HIGH';
  return 'CRITICAL';
};

export const getBiasScoreColor = (score: number): string => {
  const level = getBiasScoreLevel(score);
  return BIAS_SCORE_RANGES[level].color;
};

export const getBiasScoreLabel = (score: number): string => {
  const level = getBiasScoreLevel(score);
  return BIAS_SCORE_RANGES[level].label;
};

export const isFairnessThresholdMet = (metric: string, value: number): boolean => {
  const threshold = DEFAULT_FAIRNESS_THRESHOLDS[metric as keyof typeof DEFAULT_FAIRNESS_THRESHOLDS];
  return threshold ? value >= threshold : true;
};

export const isStatisticallySignificant = (pValue: number, alpha: number = SIGNIFICANCE_LEVELS.ALPHA_005): boolean => {
  return pValue < alpha;
};

export const getConfidenceLevel = (confidence: number): string => {
  if (confidence >= BIAS_CONFIDENCE_LEVELS.VERY_HIGH) return 'Very High';
  if (confidence >= BIAS_CONFIDENCE_LEVELS.HIGH) return 'High';
  if (confidence >= BIAS_CONFIDENCE_LEVELS.MEDIUM) return 'Medium';
  return 'Low';
};

// Type exports
export type BiasCategory = typeof BIAS_CATEGORIES[keyof typeof BIAS_CATEGORIES];
export type BiasAnalysisType = typeof BIAS_ANALYSIS_TYPES[keyof typeof BIAS_ANALYSIS_TYPES];
export type BiasAlertType = typeof BIAS_ALERT_TYPES[keyof typeof BIAS_ALERT_TYPES];
export type FairnessMetric = typeof FAIRNESS_METRICS[keyof typeof FAIRNESS_METRICS];
export type StatisticalTestType = typeof STATISTICAL_TEST_TYPES[keyof typeof STATISTICAL_TEST_TYPES];
export type ProtectedAttribute = typeof PROTECTED_ATTRIBUTES[keyof typeof PROTECTED_ATTRIBUTES];
export type BiasMitigationTechnique = typeof BIAS_MITIGATION_TECHNIQUES[keyof typeof BIAS_MITIGATION_TECHNIQUES];
export type BiasRemediationAction = typeof BIAS_REMEDIATION_ACTIONS[keyof typeof BIAS_REMEDIATION_ACTIONS];
export type MonitoringFrequency = typeof MONITORING_FREQUENCIES[keyof typeof MONITORING_FREQUENCIES];