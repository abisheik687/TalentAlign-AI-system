import mongoose, { Schema, Document } from 'mongoose';
import { ConsentRecord, ConsentType, LegalBasis } from '@/types/auth';

export interface ConsentDocument extends ConsentRecord, Document {
  _id: mongoose.Types.ObjectId;
}

const ConsentSchema = new Schema<ConsentDocument>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  consentType: {
    type: String,
    required: true,
    enum: ['data_processing', 'ai_analysis', 'profile_sharing', 'marketing', 'analytics', 'third_party_sharing'],
    index: true,
  },
  granted: {
    type: Boolean,
    required: true,
    index: true,
  },
  version: {
    type: String,
    required: true,
  },
  
  // Details
  purpose: {
    type: String,
    required: true,
  },
  dataTypes: [{
    type: String,
    required: true,
  }],
  retentionPeriod: {
    type: Number,
    required: true,
    min: 0,
  },
  
  // Legal basis
  legalBasis: {
    type: String,
    required: true,
    enum: ['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'],
    default: 'consent',
  },
  jurisdiction: {
    type: String,
    required: true,
    default: 'US',
  },
  
  // Timestamps
  grantedAt: {
    type: Date,
    default: null,
    index: true,
  },
  revokedAt: {
    type: Date,
    default: null,
    index: true,
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Compound indexes for efficient queries
ConsentSchema.index({ userId: 1, consentType: 1 });
ConsentSchema.index({ userId: 1, granted: 1 });
ConsentSchema.index({ consentType: 1, granted: 1 });
ConsentSchema.index({ expiresAt: 1, granted: 1 });
ConsentSchema.index({ createdAt: -1 });

// Pre-save middleware to update the updatedAt field
ConsentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
ConsentSchema.methods.isExpired = function(): boolean {
  return this.expiresAt && this.expiresAt < new Date();
};

ConsentSchema.methods.isActive = function(): boolean {
  return this.granted && !this.isExpired();
};

ConsentSchema.methods.getDaysUntilExpiry = function(): number | null {
  if (!this.expiresAt) return null;
  
  const now = new Date();
  const diffTime = this.expiresAt.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

ConsentSchema.methods.revoke = function(reason?: string): void {
  this.granted = false;
  this.revokedAt = new Date();
  this.updatedAt = new Date();
  
  if (reason) {
    this.purpose = `${this.purpose} - Revoked: ${reason}`;
  }
};

// Static methods
ConsentSchema.statics.findActiveConsents = function(userId: string) {
  return this.find({
    userId,
    granted: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
};

ConsentSchema.statics.findByType = function(consentType: ConsentType) {
  return this.find({ consentType });
};

ConsentSchema.statics.findExpiring = function(daysAhead: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    granted: true,
    expiresAt: {
      $lte: futureDate,
      $gt: new Date()
    }
  });
};

ConsentSchema.statics.findExpired = function() {
  return this.find({
    granted: true,
    expiresAt: { $lt: new Date() }
  });
};

ConsentSchema.statics.getConsentStats = function(startDate?: Date, endDate?: Date) {
  const matchStage: any = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          consentType: '$consentType',
          granted: '$granted'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.consentType',
        granted: {
          $sum: {
            $cond: [{ $eq: ['$_id.granted', true] }, '$count', 0]
          }
        },
        revoked: {
          $sum: {
            $cond: [{ $eq: ['$_id.granted', false] }, '$count', 0]
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

// Virtual for consent status
ConsentSchema.virtual('status').get(function() {
  if (!this.granted) return 'revoked';
  if (this.isExpired()) return 'expired';
  return 'active';
});

// Virtual for days until expiry
ConsentSchema.virtual('daysUntilExpiry').get(function() {
  return this.getDaysUntilExpiry();
});

// Ensure virtual fields are serialized
ConsentSchema.set('toJSON', { virtuals: true });
ConsentSchema.set('toObject', { virtuals: true });

const Consent = mongoose.model<ConsentDocument>('Consent', ConsentSchema);

export default Consent;