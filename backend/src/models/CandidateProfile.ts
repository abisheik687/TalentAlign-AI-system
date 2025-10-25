import mongoose, { Document, Schema } from 'mongoose';

export interface ICandidateProfile extends Document {
  userId: mongoose.Types.ObjectId;
  anonymizedId: string;
  personalInfo: {
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
    verified: boolean;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    description: string;
    isCurrentRole: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationDate: Date;
    gpa?: number;
  }>;
  preferences: {
    desiredRoles: string[];
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    workType: 'remote' | 'hybrid' | 'onsite' | 'flexible';
    availabilityDate: Date;
  };
  assessments: Array<{
    assessmentId: mongoose.Types.ObjectId;
    score: number;
    completedAt: Date;
    validUntil: Date;
  }>;
  privacySettings: {
    profileVisibility: 'public' | 'private' | 'recruiters_only';
    allowDataSharing: boolean;
    allowAIAnalysis: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CandidateProfileSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  anonymizedId: {
    type: String,
    required: true,
    unique: true
  },
  personalInfo: {
    phone: String,
    location: String,
    linkedinUrl: String,
    portfolioUrl: String
  },
  skills: [{
    name: { type: String, required: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true
    },
    yearsOfExperience: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }
  }],
  experience: [{
    company: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: Date,
    description: String,
    isCurrentRole: { type: Boolean, default: false }
  }],
  education: [{
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    graduationDate: { type: Date, required: true },
    gpa: Number
  }],
  preferences: {
    desiredRoles: [String],
    salaryRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: 'USD' }
    },
    workType: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite', 'flexible'],
      default: 'flexible'
    },
    availabilityDate: { type: Date, default: Date.now }
  },
  assessments: [{
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment' },
    score: Number,
    completedAt: Date,
    validUntil: Date
  }],
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'recruiters_only'],
      default: 'recruiters_only'
    },
    allowDataSharing: { type: Boolean, default: false },
    allowAIAnalysis: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Generate anonymized ID before saving
CandidateProfileSchema.pre<ICandidateProfile>('save', function(next) {
  if (!this.anonymizedId) {
    this.anonymizedId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export default mongoose.model<ICandidateProfile>('CandidateProfile', CandidateProfileSchema);