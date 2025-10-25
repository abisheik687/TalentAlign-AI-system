import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  status: 'applied' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected';
  matchScore: number;
  biasAnalysis: {
    overallBiasScore: number;
    fairnessMetrics: {
      demographicParity: number;
      equalOpportunity: number;
      equalizedOdds: number;
    };
    flaggedDecisions: Array<{
      stage: string;
      reason: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  timeline: Array<{
    stage: string;
    status: string;
    timestamp: Date;
    notes?: string;
    evaluatedBy?: mongoose.Types.ObjectId;
  }>;
  assessments: Array<{
    assessmentId: mongoose.Types.ObjectId;
    score: number;
    completedAt: Date;
    feedback?: string;
  }>;
  interviews: Array<{
    interviewId: mongoose.Types.ObjectId;
    scheduledAt: Date;
    completedAt?: Date;
    interviewers: mongoose.Types.ObjectId[];
    feedback?: Array<{
      evaluatorId: mongoose.Types.ObjectId;
      rating: number;
      comments: string;
      criteria: Array<{
        name: string;
        score: number;
      }>;
    }>;
  }>;
  feedback: {
    candidateFeedback?: string;
    internalNotes?: string;
    rejectionReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  candidateId: {
    type: Schema.Types.ObjectId,
    ref: 'CandidateProfile',
    required: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true
  },
  status: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected'],
    default: 'applied'
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  biasAnalysis: {
    overallBiasScore: { type: Number, default: 0 },
    fairnessMetrics: {
      demographicParity: { type: Number, default: 0 },
      equalOpportunity: { type: Number, default: 0 },
      equalizedOdds: { type: Number, default: 0 }
    },
    flaggedDecisions: [{
      stage: String,
      reason: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }]
  },
  timeline: [{
    stage: { type: String, required: true },
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: String,
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  assessments: [{
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment' },
    score: Number,
    completedAt: Date,
    feedback: String
  }],
  interviews: [{
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview' },
    scheduledAt: Date,
    completedAt: Date,
    interviewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    feedback: [{
      evaluatorId: { type: Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      comments: String,
      criteria: [{
        name: String,
        score: Number
      }]
    }]
  }],
  feedback: {
    candidateFeedback: String,
    internalNotes: String,
    rejectionReason: String
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IApplication>('Application', ApplicationSchema);