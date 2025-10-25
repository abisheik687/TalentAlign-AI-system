import mongoose, { Schema, Document } from 'mongoose';

/**
 * Monitoring Result Model
 * Stores bias monitoring results and audit trail
 * Requirements: 4.4, 8.1
 */

export interface IMonitoringResult extends Document {
  monitoringId: string;
  processId: string;
  processType: 'application_review' | 'interview_scheduling' | 'hiring_decision' | 'matching';
  biasAnalysis: {
    overallBiasScore: number;
    biasMetrics: any;
    statisticalTests?: any[];
    detectedPatterns: string[];
    mitigationRecommendations: string[];
    complianceStatus: 'compliant' | 'non_compliant';
    analysisTimestamp: Date;
  };
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    value: number;
    threshold: number;
    description: string;
    processType: string;
    timestamp: Date;
  }>;
  complianceStatus: 'compliant' | 'violation_detected' | 'non_compliant';
  recommendations: string[];
  processingTime: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MonitoringResultSchema = new Schema<IMonitoringResult>({
  monitoringId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  processId: {
    type: String,
    required: true,
    index: true
  },
  processType: {
    type: String,
    required: true,
    enum: ['application_review', 'interview_scheduling', 'hiring_decision', 'matching'],
    index: true
  },
  biasAnalysis: {
    overallBiasScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    biasMetrics: {
      type: Schema.Types.Mixed,
      required: false
    },
    statisticalTests: [{
      testName: String,
      pValue: Number,
      effectSize: Number,
      confidence: Number,
      result: String
    }],
    detectedPatterns: [String],
    mitigationRecommendations: [String],
    complianceStatus: {
      type: String,
      required: true,
      enum: ['compliant', 'non_compliant']
    },
    analysisTimestamp: {
      type: Date,
      required: true
    }
  },
  violations: [{
    type: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical']
    },
    metric: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    processType: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    }
  }],
  complianceStatus: {
    type: String,
    required: true,
    enum: ['compliant', 'violation_detected', 'non_compliant'],
    index: true
  },
  recommendations: [String],
  processingTime: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'monitoring_results'
});

// Indexes for efficient querying
MonitoringResultSchema.index({ processType: 1, timestamp: -1 });
MonitoringResultSchema.index({ complianceStatus: 1, timestamp: -1 });
MonitoringResultSchema.index({ 'biasAnalysis.overallBiasScore': 1 });
MonitoringResultSchema.index({ 'violations.severity': 1, timestamp: -1 });

// TTL index for automatic cleanup (keep for 2 years)
MonitoringResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 2 });

export default mongoose.model<IMonitoringResult>('MonitoringResult', MonitoringResultSchema);