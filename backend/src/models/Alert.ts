import mongoose, { Schema, Document } from 'mongoose';

/**
 * Alert Model
 * Stores bias monitoring alerts and notifications
 * Requirements: 4.4, 8.1
 */

export interface IAlert extends Document {
  alertId: string;
  processId: string;
  processType: 'application_review' | 'interview_scheduling' | 'hiring_decision' | 'matching';
  violation: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    value: number;
    threshold: number;
    description: string;
    processType: string;
    timestamp: Date;
  };
  biasAnalysis: {
    overallBiasScore: number;
    biasMetrics: any;
    detectedPatterns: string[];
    mitigationRecommendations: string[];
    complianceStatus: 'compliant' | 'non_compliant';
    analysisTimestamp: Date;
  };
  status: 'active' | 'acknowledged' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolution?: {
    action: string;
    description: string;
    timestamp: Date;
  };
  notifications: Array<{
    type: 'email' | 'websocket' | 'sms';
    recipient: string;
    sentAt: Date;
    status: 'sent' | 'failed' | 'pending';
  }>;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>({
  alertId: {
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
  violation: {
    type: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      index: true
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
  status: {
    type: String,
    required: true,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active',
    index: true
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    index: true
  },
  assignedTo: {
    type: String,
    required: false,
    index: true
  },
  acknowledgedBy: {
    type: String,
    required: false
  },
  resolvedBy: {
    type: String,
    required: false
  },
  resolution: {
    action: String,
    description: String,
    timestamp: Date
  },
  notifications: [{
    type: {
      type: String,
      required: true,
      enum: ['email', 'websocket', 'sms']
    },
    recipient: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending'
    }
  }],
  acknowledgedAt: {
    type: Date,
    required: false
  },
  resolvedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true,
  collection: 'alerts'
});

// Indexes for efficient querying
AlertSchema.index({ status: 1, createdAt: -1 });
AlertSchema.index({ 'violation.severity': 1, status: 1 });
AlertSchema.index({ processType: 1, status: 1 });
AlertSchema.index({ assignedTo: 1, status: 1 });
AlertSchema.index({ priority: 1, createdAt: -1 });

// TTL index for automatic cleanup of resolved alerts (keep for 1 year)
AlertSchema.index({ resolvedAt: 1 }, { 
  expireAfterSeconds: 60 * 60 * 24 * 365,
  partialFilterExpression: { status: 'resolved' }
});

// Virtual for alert age
AlertSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Virtual for response time (time to acknowledgment)
AlertSchema.virtual('responseTimeInMinutes').get(function() {
  if (!this.acknowledgedAt) return null;
  return Math.floor((this.acknowledgedAt.getTime() - this.createdAt.getTime()) / (1000 * 60));
});

// Virtual for resolution time
AlertSchema.virtual('resolutionTimeInHours').get(function() {
  if (!this.resolvedAt) return null;
  return Math.floor((this.resolvedAt.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Pre-save middleware to set priority based on severity
AlertSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set priority based on violation severity
    this.priority = this.violation.severity;
    
    // Auto-assign critical alerts to admin
    if (this.violation.severity === 'critical' && !this.assignedTo) {
      // This would be set to a default admin user ID in a real implementation
      this.assignedTo = 'admin';
    }
  }
  next();
});

// Static methods for common queries
AlertSchema.statics.getActiveAlerts = function() {
  return this.find({ status: 'active' }).sort({ priority: -1, createdAt: -1 });
};

AlertSchema.statics.getCriticalAlerts = function() {
  return this.find({ 
    status: 'active', 
    'violation.severity': 'critical' 
  }).sort({ createdAt: -1 });
};

AlertSchema.statics.getAlertsByProcess = function(processId: string) {
  return this.find({ processId }).sort({ createdAt: -1 });
};

AlertSchema.statics.getUnacknowledgedAlerts = function() {
  return this.find({ 
    status: 'active',
    acknowledgedAt: { $exists: false }
  }).sort({ priority: -1, createdAt: -1 });
};

export default mongoose.model<IAlert>('Alert', AlertSchema);