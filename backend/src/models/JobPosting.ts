import mongoose, { Document, Schema } from 'mongoose';

export interface IJobPosting extends Document {
  title: string;
  company: string;
  department: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship';
  description: string;
  requirements: {
    skills: Array<{
      name: string;
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      required: boolean;
    }>;
    experience: {
      minYears: number;
      maxYears?: number;
      preferredIndustries: string[];
    };
    education: {
      minLevel: 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd';
      preferredFields: string[];
    };
  };
  compensation: {
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    benefits: string[];
    equityOffered: boolean;
  };
  biasAnalysis: {
    overallScore: number;
    flaggedTerms: Array<{
      term: string;
      category: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
    }>;
    inclusivityScore: number;
    lastAnalyzed: Date;
  };
  status: 'draft' | 'active' | 'paused' | 'closed';
  postedBy: mongoose.Types.ObjectId;
  applications: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const JobPostingSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true
  },
  workType: {
    type: String,
    enum: ['remote', 'hybrid', 'onsite', 'flexible'],
    required: true
  },
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'internship'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    skills: [{
      name: { type: String, required: true },
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        required: true
      },
      required: { type: Boolean, default: false }
    }],
    experience: {
      minYears: { type: Number, default: 0 },
      maxYears: Number,
      preferredIndustries: [String]
    },
    education: {
      minLevel: {
        type: String,
        enum: ['high_school', 'associate', 'bachelor', 'master', 'phd'],
        default: 'high_school'
      },
      preferredFields: [String]
    }
  },
  compensation: {
    salaryRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: 'USD' }
    },
    benefits: [String],
    equityOffered: { type: Boolean, default: false }
  },
  biasAnalysis: {
    overallScore: { type: Number, default: 0 },
    flaggedTerms: [{
      term: String,
      category: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      suggestion: String
    }],
    inclusivityScore: { type: Number, default: 0 },
    lastAnalyzed: Date
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed'],
    default: 'draft'
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [{
    type: Schema.Types.ObjectId,
    ref: 'Application'
  }]
}, {
  timestamps: true
});

export default mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);