import mongoose, { Schema, Document } from 'mongoose';
import {
  FairnessMetrics as IFairnessMetrics,
  BiasAnalysis as IBiasAnalysis,
  FairnessContext,
  DemographicParityMetrics,
  EqualizedOddsMetrics,
  PredictiveEqualityMetrics,
  TreatmentEqualityMetrics,
  DisparateImpactMetrics,
  StatisticalSignificanceMetrics,
  BiasAnalysisType,
  BiasType,
  ComplianceStatus,
  EthicalImpactLevel,
  AuditAction
} from '@/types/fairness';

// Mongoose Document Interfaces
export interface FairnessMetricsDocument extends IFairnessMetrics, Document {
  _id: mongoose.Types.ObjectId;
}

export interface BiasAnalysisDocument extends IBiasAnalysis, Document {
  _id: mongoose.Types.ObjectId;
}

// Confidence Interval Schema
const ConfidenceIntervalSchema = new Schema({
  lowerBound: { type: Number, required: true, min: 0, max: 1 },
  upperBound: { type: Number, required: true, min: 0, max: 1 },
  confidenceLevel: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

// Sample Size Info Schema
const SampleSizeInfoSchema = new Schema({
  total: { type: Number, required: true, min: 0 },
  byGroup: { type: Map, of: Number },
  minimumRequired: { type: Number, required: true, min: 0 },
  adequacyScore: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

// Validation Status Schema
const ValidationStatusSchema = new Schema({
  isValid: { type: Boolean, required: true },
  validationErrors: [{ type: String }],
  validationWarnings: [{ type: String }],
  validatedBy: { type: String, required: true },
  validatedAt: { type: Date, required: true }
}, { _id: false });

// Fairness Context Schema
const FairnessContextSchema = new Schema({
  processType: { 
    type: String, 
    enum: ['hiring', 'promotion', 'performance_review', 'compensation', 'matching'],
    required: true,
    index: true
  },
  stage: { type: String, required: true, index: true },
  timePeriod: {
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true }
  },
  geographicScope: [{ type: String }],
  departmentScope: [{ type: String }],
  jobLevels: [{ type: String }]
}, { _id: false });

// Trend Analysis Schema
const TrendAnalysisSchema = new Schema({
  direction: { 
    type: String, 
    enum: ['improving', 'stable', 'declining'],
    required: true 
  },
  magnitude: { type: Number, required: true },
  significance: { type: Number, required: true, min: 0, max: 1 },
  timeframe: { type: String, required: true },
  dataPoints: [{
    timestamp: { type: Date, required: true },
    value: { type: Number, required: true },
    context: { type: String, required: true }
  }]
}, { _id: false });

// Parity Violation Schema
const ParityViolationSchema = new Schema({
  attributeName: { type: String, required: true },
  violationType: { 
    type: String, 
    enum: ['threshold', 'statistical', 'practical'],
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['minor', 'moderate', 'major', 'critical'],
    required: true,
    index: true
  },
  description: { type: String, required: true },
  affectedGroups: [{ type: String, required: true }],
  recommendedAction: { type: String, required: true }
}, { _id: false });

// Attribute Parity Metrics Schema
const AttributeParityMetricsSchema = new Schema({
  attributeName: { type: String, required: true, index: true },
  selectionRates: { type: Map, of: Number },
  parityRatio: { type: Number, required: true, min: 0, max: 1, index: true },
  statisticalSignificance: { type: Number, required: true, min: 0, max: 1 },
  sampleSizes: { type: Map, of: Number },
  confidenceIntervals: { type: Map, of: ConfidenceIntervalSchema }
}, { _id: false });

// Demographic Parity Metrics Schema
const DemographicParityMetricsSchema = new Schema({
  overallScore: { type: Number, required: true, min: 0, max: 1, index: true },
  byAttribute: { type: Map, of: AttributeParityMetricsSchema },
  intersectionalAnalysis: [{ type: Schema.Types.Mixed }], // Complex nested structure
  violations: [ParityViolationSchema],
  trend: TrendAnalysisSchema
}, { _id: false });

// Rate Equality Metrics Schema
const RateEqualityMetricsSchema = new Schema({
  overallEquality: { type: Number, required: true, min: 0, max: 1 },
  groupRates: { type: Map, of: Number },
  maxDifference: { type: Number, required: true, min: 0 },
  statisticalSignificance: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

// Equalized Odds Metrics Schema
const EqualizedOddsMetricsSchema = new Schema({
  overallScore: { type: Number, required: true, min: 0, max: 1, index: true },
  truePositiveRateEquality: RateEqualityMetricsSchema,
  falsePositiveRateEquality: RateEqualityMetricsSchema,
  byAttribute: { type: Map, of: Schema.Types.Mixed },
  violations: [{ type: Schema.Types.Mixed }]
}, { _id: false });

// Predictive Equality Metrics Schema
const PredictiveEqualityMetricsSchema = new Schema({
  overallScore: { type: Number, required: true, min: 0, max: 1, index: true },
  falsePositiveRateEquality: RateEqualityMetricsSchema,
  precisionEquality: RateEqualityMetricsSchema,
  byAttribute: { type: Map, of: Schema.Types.Mixed },
  violations: [{ type: Schema.Types.Mixed }]
}, { _id: false });

// Process Consistency Metrics Schema
const ProcessConsistencyMetricsSchema = new Schema({
  consistencyScore: { type: Number, required: true, min: 0, max: 1 },
  variabilityMeasures: { type: Map, of: Number },
  outlierDetection: {
    outliers: [{ type: Schema.Types.Mixed }],
    detectionMethod: { type: String, required: true },
    threshold: { type: Number, required: true },
    outlierRate: { type: Number, required: true, min: 0, max: 1 }
  }
}, { _id: false });

// Time Equality Metrics Schema
const TimeEqualityMetricsSchema = new Schema({
  averageTimeByGroup: { type: Map, of: Number },
  timeVariability: { type: Map, of: Number },
  equalityScore: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

// Resource Equality Metrics Schema
const ResourceEqualityMetricsSchema = new Schema({
  resourceAllocationByGroup: { type: Map, of: Number },
  equalityScore: { type: Number, required: true, min: 0, max: 1 },
  resourceTypes: [{ type: String, required: true }]
}, { _id: false });

// Treatment Equality Metrics Schema
const TreatmentEqualityMetricsSchema = new Schema({
  overallScore: { type: Number, required: true, min: 0, max: 1, index: true },
  processConsistency: ProcessConsistencyMetricsSchema,
  timeToDecisionEquality: TimeEqualityMetricsSchema,
  resourceAllocationEquality: ResourceEqualityMetricsSchema,
  byAttribute: { type: Map, of: Schema.Types.Mixed },
  violations: [{ type: Schema.Types.Mixed }]
}, { _id: false });

// Disparate Impact Violation Schema
const DisparateImpactViolationSchema = new Schema({
  attributeName: { type: String, required: true },
  impactRatio: { type: Number, required: true, min: 0 },
  threshold: { type: Number, required: true, min: 0 },
  severity: { 
    type: String, 
    enum: ['minor', 'moderate', 'major', 'critical'],
    required: true 
  },
  affectedGroups: [{ type: String, required: true }],
  description: { type: String, required: true },
  legalImplications: [{ type: String }]
}, { _id: false });

// Disparate Impact Metrics Schema
const DisparateImpactMetricsSchema = new Schema({
  overallRatio: { type: Number, required: true, min: 0, index: true },
  fourFifthsRuleCompliance: { type: Boolean, required: true, index: true },
  impactRatios: { type: Map, of: { type: Map, of: Number } },
  statisticalSignificance: { type: Map, of: Number },
  adverseImpactIndicators: [{ type: Schema.Types.Mixed }],
  violations: [DisparateImpactViolationSchema]
}, { _id: false });

// Chi-Square Test Result Schema
const ChiSquareTestResultSchema = new Schema({
  testName: { type: String, required: true },
  chiSquareStatistic: { type: Number, required: true },
  degreesOfFreedom: { type: Number, required: true, min: 0 },
  pValue: { type: Number, required: true, min: 0, max: 1 },
  criticalValue: { type: Number, required: true },
  isSignificant: { type: Boolean, required: true }
}, { _id: false });

// Effect Size Schema
const EffectSizeSchema = new Schema({
  measure: { type: String, required: true },
  value: { type: Number, required: true },
  interpretation: { 
    type: String, 
    enum: ['small', 'medium', 'large'],
    required: true 
  }
}, { _id: false });

// Power Analysis Result Schema
const PowerAnalysisResultSchema = new Schema({
  power: { type: Number, required: true, min: 0, max: 1 },
  effectSize: { type: Number, required: true },
  sampleSize: { type: Number, required: true, min: 0 },
  alpha: { type: Number, required: true, min: 0, max: 1 },
  isAdequate: { type: Boolean, required: true }
}, { _id: false });

// Statistical Significance Metrics Schema
const StatisticalSignificanceMetricsSchema = new Schema({
  pValues: { type: Map, of: Number },
  chiSquareTests: [ChiSquareTestResultSchema],
  fishersExactTests: [{ type: Schema.Types.Mixed }],
  effectSizes: { type: Map, of: EffectSizeSchema },
  powerAnalysis: PowerAnalysisResultSchema,
  multipleComparisonCorrections: [{ type: Schema.Types.Mixed }]
}, { _id: false });

// Main Fairness Metrics Schema
const FairnessMetricsSchema = new Schema<FairnessMetricsDocument>({
  id: { type: String, required: true, unique: true, index: true },
  calculatedAt: { type: Date, required: true, default: Date.now, index: true },
  context: {
    type: FairnessContextSchema,
    required: true
  },
  demographicParity: {
    type: DemographicParityMetricsSchema,
    required: true
  },
  equalizedOdds: {
    type: EqualizedOddsMetricsSchema,
    required: true
  },
  predictiveEquality: {
    type: PredictiveEqualityMetricsSchema,
    required: true
  },
  treatmentEquality: {
    type: TreatmentEqualityMetricsSchema,
    required: true
  },
  disparateImpact: {
    type: DisparateImpactMetricsSchema,
    required: true
  },
  statisticalSignificance: {
    type: StatisticalSignificanceMetricsSchema,
    required: true
  },
  overallFairnessScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 1,
    index: true 
  },
  confidenceInterval: {
    type: ConfidenceIntervalSchema,
    required: true
  },
  sampleSize: {
    type: SampleSizeInfoSchema,
    required: true
  },
  validationStatus: {
    type: ValidationStatusSchema,
    required: true
  }
}, {
  timestamps: true,
  collection: 'fairness_metrics'
});

// Bias Evidence Schema
const BiasEvidenceSchema = new Schema({
  evidenceType: { type: String, required: true },
  description: { type: String, required: true },
  strength: { type: Number, required: true, min: 0, max: 1 },
  source: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now }
}, { _id: false });

// Impact Assessment Schema
const ImpactAssessmentSchema = new Schema({
  affectedPopulation: { type: Number, required: true, min: 0 },
  severityScore: { type: Number, required: true, min: 0, max: 1 },
  businessImpact: { type: String, required: true },
  legalRisk: { type: String, required: true },
  reputationalRisk: { type: String, required: true }
}, { _id: false });

// Detected Bias Schema
const DetectedBiasSchema = new Schema({
  biasType: { 
    type: String, 
    enum: Object.values(BiasType),
    required: true,
    index: true
  },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  affectedGroups: [{ type: String, required: true }],
  evidence: [BiasEvidenceSchema],
  impactAssessment: ImpactAssessmentSchema,
  recommendedActions: [{ type: String, required: true }]
}, { _id: false });

// Bias Source Schema
const BiasSourceSchema = new Schema({
  sourceId: { type: String, required: true },
  sourceType: { 
    type: String, 
    enum: ['data', 'algorithm', 'process', 'human', 'systemic'],
    required: true,
    index: true
  },
  description: { type: String, required: true },
  biasContribution: { type: Number, required: true, min: 0, max: 1 },
  detectability: { 
    type: String, 
    enum: ['easy', 'moderate', 'difficult', 'hidden'],
    required: true 
  },
  mitigationDifficulty: { 
    type: String, 
    enum: ['easy', 'moderate', 'difficult', 'very_difficult'],
    required: true 
  },
  historicalPresence: {
    firstDetected: { type: Date, required: true },
    frequency: { 
      type: String, 
      enum: ['rare', 'occasional', 'frequent', 'persistent'],
      required: true 
    },
    trendDirection: { 
      type: String, 
      enum: ['increasing', 'stable', 'decreasing'],
      required: true 
    }
  }
}, { _id: false });

// Implementation Step Schema
const ImplementationStepSchema = new Schema({
  stepNumber: { type: Number, required: true, min: 1 },
  description: { type: String, required: true },
  owner: { type: String, required: true },
  estimatedDuration: { type: Number, required: true, min: 0 }, // days
  dependencies: [{ type: Number, min: 1 }], // step numbers
  resources: [{ type: String }]
}, { _id: false });

// Expected Impact Schema
const ExpectedImpactSchema = new Schema({
  biasReduction: { type: Number, required: true, min: 0, max: 1 },
  timeframe: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  riskFactors: [{ type: String }]
}, { _id: false });

// Resource Requirement Schema
const ResourceRequirementSchema = new Schema({
  type: { 
    type: String, 
    enum: ['human', 'financial', 'technical', 'time'],
    required: true 
  },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  cost: { type: Number, min: 0 }
}, { _id: false });

// Milestone Schema
const MilestoneSchema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  deliverables: [{ type: String, required: true }]
}, { _id: false });

// Timeline Schema
const TimelineSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  milestones: [MilestoneSchema],
  criticalPath: [{ type: String }]
}, { _id: false });

// Success Metric Schema
const SuccessMetricSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number },
  measurementMethod: { type: String, required: true },
  frequency: { type: String, required: true }
}, { _id: false });

// Mitigation Recommendation Schema
const MitigationRecommendationSchema = new Schema({
  id: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  type: { 
    type: String, 
    enum: ['immediate', 'short_term', 'long_term', 'systemic'],
    required: true,
    index: true
  },
  description: { type: String, required: true },
  implementationSteps: [ImplementationStepSchema],
  expectedImpact: ExpectedImpactSchema,
  resourceRequirements: [ResourceRequirementSchema],
  timeline: TimelineSchema,
  successMetrics: [SuccessMetricSchema]
}, { _id: false });

// Bias Validation Result Schema
const BiasValidationResultSchema = new Schema({
  validationType: { type: String, required: true },
  isValid: { type: Boolean, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  validationMethod: { type: String, required: true },
  validatedBy: { type: String, required: true },
  validatedAt: { type: Date, required: true, default: Date.now },
  notes: { type: String }
}, { _id: false });

// Audit Actor Schema
const AuditActorSchema = new Schema({
  type: { 
    type: String, 
    enum: ['user', 'system', 'api', 'batch_job'],
    required: true 
  },
  id: { type: String, required: true },
  name: { type: String },
  role: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { _id: false });

// Audit Resource Schema
const AuditResourceSchema = new Schema({
  type: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String },
  category: { type: String }
}, { _id: false });

// Audit Change Schema
const AuditChangeSchema = new Schema({
  field: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  changeType: { 
    type: String, 
    enum: ['create', 'update', 'delete'],
    required: true 
  }
}, { _id: false });

// Audit Context Schema
const AuditContextSchema = new Schema({
  sessionId: { type: String },
  requestId: { type: String },
  correlationId: { type: String },
  businessContext: { type: String },
  additionalMetadata: { type: Map, of: Schema.Types.Mixed }
}, { _id: false });

// Bias Audit Entry Schema
const BiasAuditEntrySchema = new Schema({
  id: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  action: { 
    type: String, 
    enum: Object.values(AuditAction),
    required: true,
    index: true
  },
  actor: AuditActorSchema,
  resource: AuditResourceSchema,
  changes: [AuditChangeSchema],
  context: AuditContextSchema,
  ethicalImpact: { 
    type: String, 
    enum: Object.values(EthicalImpactLevel),
    required: true,
    index: true
  },
  complianceImplications: [{ type: String }],
  retentionPeriod: { type: Number, required: true, min: 0 } // days
}, { _id: false });

// Bias Analysis Context Schema
const BiasAnalysisContextSchema = new Schema({
  dataSource: { type: String, required: true },
  scope: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    departments: [{ type: String }],
    jobLevels: [{ type: String }],
    geographicRegions: [{ type: String }]
  },
  sampleCharacteristics: {
    totalSize: { type: Number, required: true, min: 0 },
    demographicBreakdown: { type: Map, of: { type: Map, of: Number } },
    representativeness: { type: Number, required: true, min: 0, max: 1 },
    biasIndicators: [{ type: String }]
  },
  analysisParameters: {
    significanceLevel: { type: Number, required: true, min: 0, max: 1 },
    confidenceLevel: { type: Number, required: true, min: 0, max: 1 },
    minimumSampleSize: { type: Number, required: true, min: 0 },
    biasThresholds: { type: Map, of: Number },
    analysisMethod: { type: String, required: true }
  }
}, { _id: false });

// Main Bias Analysis Schema
const BiasAnalysisSchema = new Schema<BiasAnalysisDocument>({
  id: { type: String, required: true, unique: true, index: true },
  analyzedAt: { type: Date, required: true, default: Date.now, index: true },
  analysisType: { 
    type: String, 
    enum: Object.values(BiasAnalysisType),
    required: true,
    index: true
  },
  context: {
    type: BiasAnalysisContextSchema,
    required: true
  },
  overallBiasScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 1,
    index: true 
  },
  detectedBiasTypes: [DetectedBiasSchema],
  biasSources: [BiasSourceSchema],
  mitigationRecommendations: [MitigationRecommendationSchema],
  confidence: { type: Number, required: true, min: 0, max: 1 },
  validationResults: [BiasValidationResultSchema],
  auditTrail: [BiasAuditEntrySchema],
  complianceStatus: { 
    type: String, 
    enum: Object.values(ComplianceStatus),
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'bias_analysis'
});

// Indexes for performance
FairnessMetricsSchema.index({ 'context.processType': 1, calculatedAt: -1 });
FairnessMetricsSchema.index({ overallFairnessScore: -1 });
FairnessMetricsSchema.index({ 'context.timePeriod.startDate': 1, 'context.timePeriod.endDate': 1 });
FairnessMetricsSchema.index({ 'demographicParity.overallScore': -1 });
FairnessMetricsSchema.index({ 'disparateImpact.fourFifthsRuleCompliance': 1 });

BiasAnalysisSchema.index({ analysisType: 1, analyzedAt: -1 });
BiasAnalysisSchema.index({ overallBiasScore: -1 });
BiasAnalysisSchema.index({ 'detectedBiasTypes.severity': 1 });
BiasAnalysisSchema.index({ complianceStatus: 1 });
BiasAnalysisSchema.index({ 'context.scope.startDate': 1, 'context.scope.endDate': 1 });

// Virtual for metrics ID
FairnessMetricsSchema.virtual('metricsId').get(function() {
  return this._id.toHexString();
});

BiasAnalysisSchema.virtual('analysisId').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
FairnessMetricsSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

BiasAnalysisSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Pre-save middleware for validation
FairnessMetricsSchema.pre('save', function(next) {
  // Validate that overall fairness score is consistent with component scores
  const componentScores = [
    this.demographicParity.overallScore,
    this.equalizedOdds.overallScore,
    this.predictiveEquality.overallScore,
    this.treatmentEquality.overallScore,
    this.disparateImpact.overallRatio
  ];
  
  const calculatedOverallScore = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length;
  const difference = Math.abs(this.overallFairnessScore - calculatedOverallScore);
  
  if (difference > 0.1) {
    const error = new Error(`Overall fairness score (${this.overallFairnessScore}) is inconsistent with component scores (calculated: ${calculatedOverallScore})`);
    return next(error);
  }
  
  next();
});

BiasAnalysisSchema.pre('save', function(next) {
  // Validate that overall bias score is consistent with detected bias types
  if (this.detectedBiasTypes.length === 0 && this.overallBiasScore > 0.1) {
    const error = new Error('Overall bias score is high but no bias types were detected');
    return next(error);
  }
  
  // Ensure high-severity bias has mitigation recommendations
  const highSeverityBias = this.detectedBiasTypes.filter(
    bias => bias.severity === 'high' || bias.severity === 'critical'
  );
  
  if (highSeverityBias.length > 0 && this.mitigationRecommendations.length === 0) {
    const error = new Error('High-severity bias detected but no mitigation recommendations provided');
    return next(error);
  }
  
  next();
});

// Static methods for querying
FairnessMetricsSchema.statics.findByProcessType = function(processType: string, limit: number = 50) {
  return this.find({ 'context.processType': processType })
    .sort({ calculatedAt: -1 })
    .limit(limit);
};

FairnessMetricsSchema.statics.findLowFairnessScores = function(threshold: number = 0.7) {
  return this.find({ overallFairnessScore: { $lt: threshold } })
    .sort({ overallFairnessScore: 1 });
};

BiasAnalysisSchema.statics.findHighBiasAnalyses = function(threshold: number = 0.7) {
  return this.find({ overallBiasScore: { $gt: threshold } })
    .sort({ overallBiasScore: -1 });
};

BiasAnalysisSchema.statics.findByAnalysisType = function(analysisType: BiasAnalysisType, limit: number = 50) {
  return this.find({ analysisType })
    .sort({ analyzedAt: -1 })
    .limit(limit);
};

// Instance methods
FairnessMetricsSchema.methods.hasViolations = function(): boolean {
  return (
    this.demographicParity.violations.length > 0 ||
    this.equalizedOdds.violations.length > 0 ||
    this.predictiveEquality.violations.length > 0 ||
    this.treatmentEquality.violations.length > 0 ||
    this.disparateImpact.violations.length > 0
  );
};

FairnessMetricsSchema.methods.getCriticalViolations = function() {
  const allViolations = [
    ...this.demographicParity.violations,
    ...this.equalizedOdds.violations,
    ...this.predictiveEquality.violations,
    ...this.treatmentEquality.violations,
    ...this.disparateImpact.violations
  ];
  
  return allViolations.filter(violation => violation.severity === 'critical');
};

BiasAnalysisSchema.methods.hasCriticalBias = function(): boolean {
  return this.detectedBiasTypes.some(bias => bias.severity === 'critical');
};

BiasAnalysisSchema.methods.getHighPriorityRecommendations = function() {
  return this.mitigationRecommendations.filter(
    rec => rec.priority === 'high' || rec.priority === 'critical'
  );
};

// Create and export the models
export const FairnessMetrics = mongoose.model<FairnessMetricsDocument>('FairnessMetrics', FairnessMetricsSchema);
export const BiasAnalysis = mongoose.model<BiasAnalysisDocument>('BiasAnalysis', BiasAnalysisSchema);