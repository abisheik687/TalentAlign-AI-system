import mongoose, { Schema, Document } from 'mongoose';
import { 
  JobRequirements as IJobRequirements,
  CompanyInfo,
  JobSkillRequirement,
  ExperienceLevel,
  EducationRequirement,
  CulturalAttribute,
  JobLocation,
  SalaryRange,
  EquityMetrics,
  JobStatus,
  JobUrgency,
  JobVisibility,
  SkillImportance,
  SeniorityLevel,
  EducationLevel,
  AssessmentMethod,
  RemoteWorkType,
  TravelFrequency,
  SalaryPeriod,
  EquityType,
  BonusType,
  BonusFrequency,
  WorkStyle,
  DecisionMakingStyle,
  CommunicationStyle,
  GrowthOrientation,
  WorkLifeBalanceRating,
  DiversityCommitment,
  InnovationLevel,
  BenefitCategory,
  OfficeType,
  DressCode,
  MeetingCulture,
  DevicePolicy
} from '../../../shared/src/types/job';
import { WorkArrangement, JobType, CompanySize } from '../../../shared/src/types/candidate';
import { BiasAnalysis } from '../../../shared/src/types/ethics';

// Mongoose Document Interface
export interface JobRequirementsDocument extends IJobRequirements, Document {
  _id: mongoose.Types.ObjectId;
}

// Company Info Schema
const CompanyInfoSchema = new Schema<CompanyInfo>({
  id: { type: String, required: true },
  name: { type: String, required: true, index: true },
  industry: { type: String, required: true, index: true },
  size: { 
    type: String, 
    enum: Object.values(CompanySize), 
    required: true,
    index: true 
  },
  description: { type: String },
  website: { type: String },
  logo: { type: String },
  culture: {
    values: [{ type: String }],
    workStyle: [{ 
      type: String, 
      enum: Object.values(WorkStyle) 
    }],
    decisionMaking: { 
      type: String, 
      enum: Object.values(DecisionMakingStyle) 
    },
    communication: { 
      type: String, 
      enum: Object.values(CommunicationStyle) 
    },
    growthOrientation: { 
      type: String, 
      enum: Object.values(GrowthOrientation) 
    },
    workLifeBalance: { 
      type: String, 
      enum: Object.values(WorkLifeBalanceRating) 
    },
    diversityCommitment: { 
      type: String, 
      enum: Object.values(DiversityCommitment) 
    },
    innovationLevel: { 
      type: String, 
      enum: Object.values(InnovationLevel) 
    }
  },
  diversityMetrics: {
    genderDistribution: {
      male: { type: Number, min: 0, max: 100 },
      female: { type: Number, min: 0, max: 100 },
      nonBinary: { type: Number, min: 0, max: 100 },
      preferNotToSay: { type: Number, min: 0, max: 100 }
    },
    ethnicityDistribution: { type: Map, of: Number },
    ageDistribution: {
      under25: { type: Number, min: 0, max: 100 },
      age25to34: { type: Number, min: 0, max: 100 },
      age35to44: { type: Number, min: 0, max: 100 },
      age45to54: { type: Number, min: 0, max: 100 },
      age55plus: { type: Number, min: 0, max: 100 }
    },
    leadershipDiversity: {
      executiveLevel: {
        male: { type: Number, min: 0, max: 100 },
        female: { type: Number, min: 0, max: 100 },
        nonBinary: { type: Number, min: 0, max: 100 },
        preferNotToSay: { type: Number, min: 0, max: 100 }
      },
      managerLevel: {
        male: { type: Number, min: 0, max: 100 },
        female: { type: Number, min: 0, max: 100 },
        nonBinary: { type: Number, min: 0, max: 100 },
        preferNotToSay: { type: Number, min: 0, max: 100 }
      },
      boardLevel: {
        male: { type: Number, min: 0, max: 100 },
        female: { type: Number, min: 0, max: 100 },
        nonBinary: { type: Number, min: 0, max: 100 },
        preferNotToSay: { type: Number, min: 0, max: 100 }
      }
    },
    payEquityScore: { type: Number, min: 0, max: 100 },
    inclusionScore: { type: Number, min: 0, max: 100 },
    diversityInitiatives: [{ type: String }],
    certifications: [{
      name: { type: String, required: true },
      issuer: { type: String, required: true },
      issueDate: { type: Date, required: true },
      expiryDate: { type: Date }
    }]
  },
  benefits: [{
    category: { 
      type: String, 
      enum: Object.values(BenefitCategory), 
      required: true 
    },
    name: { type: String, required: true },
    description: { type: String },
    value: { type: String },
    eligibility: { type: String }
  }],
  workEnvironment: {
    officeType: { 
      type: String, 
      enum: Object.values(OfficeType) 
    },
    dressCode: { 
      type: String, 
      enum: Object.values(DressCode) 
    },
    meetingCulture: { 
      type: String, 
      enum: Object.values(MeetingCulture) 
    },
    socialActivities: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false },
    accessibility: {
      wheelchairAccessible: { type: Boolean, default: false },
      assistiveTechnology: { type: Boolean, default: false },
      flexibleScheduling: { type: Boolean, default: false },
      accommodationSupport: { type: Boolean, default: false }
    },
    technology: {
      devicePolicy: { 
        type: String, 
        enum: Object.values(DevicePolicy) 
      },
      softwareTools: [{ type: String }],
      techStack: [{ type: String }],
      innovationBudget: { type: Boolean, default: false }
    },
    sustainability: {
      greenBuilding: { type: Boolean, default: false },
      renewableEnergy: { type: Boolean, default: false },
      recyclingProgram: { type: Boolean, default: false },
      sustainabilityScore: { type: Number, min: 0, max: 100, default: 0 }
    }
  },
  location: {
    headquarters: {
      city: { type: String, required: true },
      state: { type: String },
      country: { type: String, required: true },
      address: { type: String },
      timezone: { type: String, required: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    },
    offices: [{
      city: { type: String, required: true },
      state: { type: String },
      country: { type: String, required: true },
      address: { type: String },
      timezone: { type: String, required: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    }],
    remotePolicy: {
      remoteAllowed: { type: Boolean, required: true },
      remotePercentage: { type: Number, min: 0, max: 100, required: true },
      remoteRestrictions: [{ type: String }],
      hybridOptions: [{
        name: { type: String, required: true },
        description: { type: String, required: true },
        daysInOffice: { type: Number, min: 0, max: 7, required: true },
        flexibility: { 
          type: String, 
          enum: ['fixed', 'flexible', 'employee_choice'],
          required: true 
        }
      }]
    }
  },
  founded: { type: Number },
  funding: {
    stage: { 
      type: String, 
      enum: ['bootstrap', 'seed', 'series_a', 'series_b', 'series_c_plus', 'ipo', 'acquired']
    },
    totalRaised: { type: Number },
    lastRoundDate: { type: Date },
    investors: [{ type: String }],
    publiclyTraded: { type: Boolean, default: false },
    stockSymbol: { type: String }
  }
}, { _id: false });

// Job Skill Requirement Schema
const JobSkillRequirementSchema = new Schema<JobSkillRequirement>({
  name: { type: String, required: true, index: true },
  category: { 
    type: String, 
    enum: ['technical', 'programming', 'frameworks', 'databases', 'cloud', 'devops', 'design', 'management', 'communication', 'analytical', 'domain_specific', 'soft_skills'],
    required: true,
    index: true 
  },
  importance: { 
    type: String, 
    enum: Object.values(SkillImportance), 
    required: true,
    index: true 
  },
  minimumLevel: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  yearsRequired: { type: Number, min: 0 },
  certificationRequired: { type: Boolean, default: false },
  assessmentRequired: { type: Boolean, default: false },
  description: { type: String },
  alternatives: [{ type: String }]
}, { _id: false });

// Experience Level Schema
const ExperienceLevelSchema = new Schema<ExperienceLevel>({
  minimum: { type: Number, required: true, min: 0, index: true },
  maximum: { type: Number, min: 0 },
  level: { 
    type: String, 
    enum: Object.values(SeniorityLevel), 
    required: true,
    index: true 
  },
  specificExperience: [{
    area: { type: String, required: true },
    yearsRequired: { type: Number, required: true, min: 0 },
    importance: { 
      type: String, 
      enum: Object.values(SkillImportance), 
      required: true 
    },
    description: { type: String }
  }],
  leadershipRequired: { type: Boolean, default: false },
  managementRequired: { type: Boolean, default: false }
}, { _id: false });

// Education Requirement Schema
const EducationRequirementSchema = new Schema<EducationRequirement>({
  level: { 
    type: String, 
    enum: Object.values(EducationLevel), 
    required: true,
    index: true 
  },
  fields: [{ type: String, index: true }],
  institutions: [{ type: String }],
  gpaRequirement: { type: Number, min: 0, max: 4 },
  certifications: [{ type: String }],
  alternatives: [{
    type: { 
      type: String, 
      enum: ['experience', 'certification', 'portfolio', 'assessment'],
      required: true 
    },
    description: { type: String, required: true },
    equivalentYears: { type: Number, min: 0 }
  }],
  importance: { 
    type: String, 
    enum: Object.values(SkillImportance), 
    required: true 
  }
}, { _id: false });

// Cultural Attribute Schema
const CulturalAttributeSchema = new Schema<CulturalAttribute>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  importance: { 
    type: String, 
    enum: Object.values(SkillImportance), 
    required: true 
  },
  assessmentMethod: [{ 
    type: String, 
    enum: Object.values(AssessmentMethod) 
  }]
}, { _id: false });

// Job Location Schema
const JobLocationSchema = new Schema<JobLocation>({
  primary: {
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    address: { type: String },
    timezone: { type: String, required: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  additional: [{
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    address: { type: String },
    timezone: { type: String, required: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  }],
  remoteOptions: [{
    type: { 
      type: String, 
      enum: Object.values(RemoteWorkType), 
      required: true 
    },
    percentage: { type: Number, min: 0, max: 100, required: true },
    restrictions: [{ type: String }],
    equipment: [{ type: String }]
  }],
  travelRequirement: {
    percentage: { type: Number, min: 0, max: 100 },
    frequency: { 
      type: String, 
      enum: Object.values(TravelFrequency) 
    },
    destinations: [{ type: String }],
    duration: { type: String }
  },
  relocationSupport: {
    available: { type: Boolean, default: false },
    package: {
      movingExpenses: { type: Boolean, default: false },
      temporaryHousing: { type: Boolean, default: false },
      househuntingTrips: { type: Boolean, default: false },
      spouseSupport: { type: Boolean, default: false },
      amount: { type: Number, min: 0 },
      currency: { type: String }
    },
    restrictions: [{ type: String }]
  }
}, { _id: false });

// Salary Range Schema
const SalaryRangeSchema = new Schema<SalaryRange>({
  min: { type: Number, required: true, min: 0, index: true },
  max: { type: Number, required: true, min: 0, index: true },
  currency: { type: String, required: true, default: 'USD' },
  period: { 
    type: String, 
    enum: Object.values(SalaryPeriod), 
    required: true 
  },
  negotiable: { type: Boolean, default: true },
  equityOffered: {
    percentage: { type: Number, min: 0, max: 100 },
    options: { type: Number, min: 0 },
    vestingSchedule: {
      duration: { type: Number, required: true }, // months
      cliff: { type: Number }, // months
      acceleration: [{ 
        type: String, 
        enum: ['single_trigger', 'double_trigger', 'performance']
      }]
    },
    type: { 
      type: String, 
      enum: Object.values(EquityType) 
    }
  },
  bonusStructure: {
    type: [{ 
      type: String, 
      enum: Object.values(BonusType) 
    }],
    target: { type: Number, min: 0 },
    maximum: { type: Number, min: 0 },
    frequency: { 
      type: String, 
      enum: Object.values(BonusFrequency) 
    },
    criteria: [{ type: String }]
  },
  benefits: {
    healthInsurance: { type: Number, min: 0 },
    retirement: { type: Number, min: 0 },
    timeOff: { type: Number, min: 0 },
    totalValue: { type: Number, min: 0 },
    currency: { type: String }
  }
}, { _id: false });

// Bias Analysis Schema
const BiasAnalysisSchema = new Schema<BiasAnalysis>({
  biasScore: { type: Number, required: true, min: 0, max: 1, index: true },
  flaggedTerms: [{ type: String }],
  suggestions: [{ type: String }],
  fairnessMetrics: {
    demographicParity: { type: Number, min: 0, max: 1 },
    equalizedOdds: { type: Number, min: 0, max: 1 },
    predictiveEquality: { type: Number, min: 0, max: 1 },
    treatmentEquality: { type: Number, min: 0, max: 1 },
    disparateImpact: { type: Number, min: 0 },
    statisticalSignificance: { type: Number, min: 0, max: 1 },
    calculatedAt: { type: Date, required: true }
  },
  analysisType: { 
    type: String, 
    enum: ['job_description', 'resume', 'matching', 'interview'],
    required: true 
  },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  createdAt: { type: Date, required: true, default: Date.now }
}, { _id: false });

// Equity Metrics Schema
const EquityMetricsSchema = new Schema<EquityMetrics>({
  genderPayGap: { type: Number, index: true },
  ethnicityPayGap: { type: Number, index: true },
  promotionRates: {
    overall: { type: Number, min: 0, max: 100 },
    byGender: { type: Map, of: Number },
    byEthnicity: { type: Map, of: Number },
    byAge: { type: Map, of: Number }
  },
  hiringDiversity: {
    targetDiversity: { type: Number, min: 0, max: 100 },
    actualDiversity: { type: Number, min: 0, max: 100 },
    improvementTrend: { 
      type: String, 
      enum: ['improving', 'stable', 'declining']
    }
  },
  retentionRates: {
    overall: { type: Number, min: 0, max: 100 },
    byDemographic: { type: Map, of: Number },
    firstYearRetention: { type: Number, min: 0, max: 100 }
  },
  satisfactionScores: {
    overall: { type: Number, min: 0, max: 100 },
    byDemographic: { type: Map, of: Number },
    inclusionScore: { type: Number, min: 0, max: 100 }
  },
  lastUpdated: { type: Date, required: true, default: Date.now }
}, { _id: false });

// Main Job Requirements Schema
const JobRequirementsSchema = new Schema<JobRequirementsDocument>({
  title: { 
    type: String, 
    required: true, 
    index: true,
    text: true 
  },
  description: { 
    type: String, 
    required: true,
    text: true 
  },
  company: {
    type: CompanyInfoSchema,
    required: true
  },
  department: { type: String, index: true },
  reportingTo: { type: String },
  requiredSkills: {
    type: [JobSkillRequirementSchema],
    required: true,
    validate: {
      validator: function(skills: JobSkillRequirement[]) {
        return skills.length > 0;
      },
      message: 'At least one required skill must be specified'
    }
  },
  preferredSkills: [JobSkillRequirementSchema],
  experienceLevel: {
    type: ExperienceLevelSchema,
    required: true
  },
  educationRequirements: [EducationRequirementSchema],
  responsibilities: {
    type: [String],
    required: true,
    validate: {
      validator: function(responsibilities: string[]) {
        return responsibilities.length > 0;
      },
      message: 'At least one responsibility must be specified'
    }
  },
  qualifications: [String],
  benefits: [String],
  culturalAttributes: [CulturalAttributeSchema],
  workArrangement: {
    type: [{ 
      type: String, 
      enum: Object.values(WorkArrangement) 
    }],
    required: true,
    index: true
  },
  jobType: { 
    type: String, 
    enum: Object.values(JobType), 
    required: true,
    index: true 
  },
  location: {
    type: JobLocationSchema,
    required: true
  },
  salaryRange: SalaryRangeSchema,
  biasAnalysis: {
    type: BiasAnalysisSchema,
    required: true
  },
  equityMetrics: {
    type: EquityMetricsSchema,
    required: true
  },
  createdBy: { 
    type: String, 
    required: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: Object.values(JobStatus), 
    required: true,
    default: JobStatus.DRAFT,
    index: true 
  },
  applicationDeadline: { type: Date, index: true },
  startDate: { type: Date, index: true },
  urgency: { 
    type: String, 
    enum: Object.values(JobUrgency), 
    required: true,
    default: JobUrgency.MEDIUM,
    index: true 
  },
  visibility: { 
    type: String, 
    enum: Object.values(JobVisibility), 
    required: true,
    default: JobVisibility.PUBLIC,
    index: true 
  }
}, {
  timestamps: true,
  collection: 'job_requirements'
});

// Indexes for performance and search
JobRequirementsSchema.index({ title: 'text', description: 'text' });
JobRequirementsSchema.index({ 'requiredSkills.name': 1, 'requiredSkills.importance': 1 });
JobRequirementsSchema.index({ 'preferredSkills.name': 1 });
JobRequirementsSchema.index({ 'company.industry': 1, 'company.size': 1 });
JobRequirementsSchema.index({ 'location.primary.city': 1, 'location.primary.country': 1 });
JobRequirementsSchema.index({ 'salaryRange.min': 1, 'salaryRange.max': 1 });
JobRequirementsSchema.index({ 'experienceLevel.minimum': 1, 'experienceLevel.level': 1 });
JobRequirementsSchema.index({ 'biasAnalysis.biasScore': 1 });
JobRequirementsSchema.index({ createdAt: -1 });
JobRequirementsSchema.index({ applicationDeadline: 1 });

// Virtual for job ID
JobRequirementsSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
JobRequirementsSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Pre-save middleware to validate bias analysis and ethical constraints
JobRequirementsSchema.pre('save', async function(next) {
  try {
    // Ensure bias analysis is recent (within 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (this.biasAnalysis.createdAt < twentyFourHoursAgo) {
      const error = new Error('Bias analysis is outdated. Please run a new analysis.');
      return next(error);
    }
    
    // Validate salary range
    if (this.salaryRange && this.salaryRange.min > this.salaryRange.max) {
      const error = new Error('Minimum salary cannot be greater than maximum salary.');
      return next(error);
    }

    // Check for high bias risk
    if (this.biasAnalysis.biasScore > 0.8) {
      const error = new Error(`Job posting has high bias risk (score: ${this.biasAnalysis.biasScore}). Please review and address flagged terms: ${this.biasAnalysis.flaggedTerms.join(', ')}`);
      return next(error);
    }

    // Validate fairness metrics
    const fairnessMetrics = this.biasAnalysis.fairnessMetrics;
    if (fairnessMetrics.demographicParity < 0.8) {
      const error = new Error(`Job posting fails demographic parity threshold (${fairnessMetrics.demographicParity} < 0.8)`);
      return next(error);
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to check if job has high bias risk
JobRequirementsSchema.methods.hasHighBiasRisk = function(): boolean {
  return this.biasAnalysis.biasScore > 0.7 || this.biasAnalysis.flaggedTerms.length > 5;
};

// Method to get required skills by importance
JobRequirementsSchema.methods.getSkillsByImportance = function(importance: SkillImportance) {
  return this.requiredSkills.filter((skill: JobSkillRequirement) => skill.importance === importance);
};

// Method to check if remote work is available
JobRequirementsSchema.methods.isRemoteAvailable = function(): boolean {
  return this.location.remoteOptions.some(option => 
    option.type === RemoteWorkType.FULLY_REMOTE || 
    option.type === RemoteWorkType.HYBRID
  );
};

// Static method to find jobs by skills
JobRequirementsSchema.statics.findBySkills = function(skillNames: string[], importance?: SkillImportance) {
  const query: any = {
    'requiredSkills.name': { $in: skillNames },
    status: JobStatus.ACTIVE
  };
  
  if (importance) {
    query['requiredSkills.importance'] = importance;
  }
  
  return this.find(query);
};

// Static method to find jobs with low bias scores
JobRequirementsSchema.statics.findLowBiasJobs = function(maxBiasScore: number = 0.3) {
  return this.find({
    'biasAnalysis.biasScore': { $lte: maxBiasScore },
    status: JobStatus.ACTIVE
  });
};

// Static method to find jobs by location
JobRequirementsSchema.statics.findByLocation = function(city?: string, country?: string, remoteOk?: boolean) {
  const query: any = { status: JobStatus.ACTIVE };
  
  if (city) {
    query['location.primary.city'] = city;
  }
  
  if (country) {
    query['location.primary.country'] = country;
  }
  
  if (remoteOk) {
    query['location.remoteOptions.type'] = { 
      $in: [RemoteWorkType.FULLY_REMOTE, RemoteWorkType.HYBRID] 
    };
  }
  
  return this.find(query);
};

// Method to analyze and update bias analysis
JobRequirementsSchema.methods.analyzeBias = async function(): Promise<void> {
  try {
    const biasTerms = [
      // Exclusionary terms
      'ninja', 'rockstar', 'guru', 'wizard', 'superhero', 'champion',
      // Age bias
      'young', 'energetic', 'digital native', 'fresh graduate', 'recent grad',
      // Gender bias
      'guys', 'brotherhood', 'fraternity', 'manpower', 'chairman',
      // Masculine-coded words
      'aggressive', 'dominant', 'competitive', 'assertive', 'ambitious',
      // Cultural bias
      'culture fit', 'beer pong', 'ping pong', 'foosball',
      // Ability bias
      'walk', 'run', 'stand', 'see', 'hear'
    ];

    const inclusiveAlternatives: Record<string, string> = {
      'ninja': 'expert',
      'rockstar': 'talented professional',
      'guru': 'specialist',
      'wizard': 'expert',
      'guys': 'team members',
      'manpower': 'workforce',
      'aggressive': 'proactive',
      'dominant': 'leading',
      'competitive': 'results-driven'
    };

    const text = `${this.title} ${this.description} ${this.responsibilities.join(' ')}`.toLowerCase();
    const flaggedTerms = biasTerms.filter(term => text.includes(term.toLowerCase()));
    
    const suggestions = flaggedTerms.map(term => 
      inclusiveAlternatives[term] 
        ? `Replace "${term}" with "${inclusiveAlternatives[term]}"`
        : `Consider replacing "${term}" with more inclusive language`
    );

    // Calculate bias score (0-1, where 1 is highest bias)
    const biasScore = Math.min(1.0, flaggedTerms.length * 0.15);
    
    // Calculate fairness metrics
    const fairnessMetrics = {
      demographicParity: Math.max(0.5, 1.0 - biasScore),
      equalizedOdds: Math.max(0.6, 1.0 - biasScore * 0.8),
      predictiveEquality: Math.max(0.6, 1.0 - biasScore * 0.8),
      treatmentEquality: Math.max(0.7, 1.0 - biasScore * 0.6),
      disparateImpact: Math.max(0.8, 1.0 - biasScore * 0.4),
      statisticalSignificance: 0.95,
      calculatedAt: new Date(),
    };

    this.biasAnalysis = {
      biasScore,
      flaggedTerms,
      suggestions,
      fairnessMetrics,
      analysisType: 'job_description',
      confidence: 0.85,
      createdAt: new Date(),
    };

  } catch (error) {
    throw new Error(`Failed to analyze bias: ${error.message}`);
  }
};

// Create and export the model
export const JobRequirements = mongoose.model<JobRequirementsDocument>('JobRequirements', JobRequirementsSchema);