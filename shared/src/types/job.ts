// Job and Job Requirements Types

export interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  location: JobLocation;
  
  // Requirements
  requirements: JobRequirements;
  
  // Company info
  companyId: string;
  companyProfile: CompanyProfile;
  
  // Job details
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryRange?: SalaryRange;
  benefits: string[];
  
  // Status and workflow
  status: JobStatus;
  priority: JobPriority;
  urgency: JobUrgency;
  
  // Hiring process
  hiringProcess: HiringStage[];
  interviewProcess: InterviewStage[];
  
  // Bias analysis
  biasAnalysis: BiasAnalysis;
  inclusivityScore: number; // 0-100
  
  // Metrics
  metrics: JobMetrics;
  
  // Team and culture
  teamInfo: TeamInfo;
  cultureAttributes: CultureAttribute[];
  
  // Timestamps and ownership
  createdBy: string;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  closedAt?: Date;
  
  // Application settings
  applicationDeadline?: Date;
  maxApplications?: number;
  autoScreening: boolean;
}

export interface JobRequirements {
  // Skills categorization
  requiredSkills: SkillRequirement[];
  preferredSkills: SkillRequirement[];
  
  // Experience requirements
  minimumExperience: number; // years
  preferredExperience: number; // years
  industryExperience: string[];
  
  // Education requirements
  educationRequirements: EducationRequirement[];
  
  // Certifications
  requiredCertifications: string[];
  preferredCertifications: string[];
  
  // Language requirements
  languageRequirements: LanguageRequirement[];
  
  // Other requirements
  travelRequirement: number; // 0-100 percentage
  physicalRequirements: string[];
  securityClearance?: SecurityClearanceLevel;
  
  // Soft skills and attributes
  softSkills: string[];
  personalityTraits: string[];
  workStylePreferences: string[];
}

export interface SkillRequirement {
  name: string;
  category: SkillCategory;
  importance: SkillImportance;
  minimumLevel: number; // 0-100
  preferredLevel: number; // 0-100
  yearsRequired?: number;
  alternatives: string[]; // Alternative skills that could substitute
  assessmentMethod?: AssessmentMethod;
}

export type SkillCategory = 
  | 'technical'
  | 'soft'
  | 'industry'
  | 'tool'
  | 'framework'
  | 'language'
  | 'methodology'
  | 'domain';

export type SkillImportance = 
  | 'critical'
  | 'important'
  | 'preferred'
  | 'nice_to_have';

export interface EducationRequirement {
  level: EducationLevel;
  field?: string[];
  required: boolean;
  alternatives: string[]; // e.g., "equivalent experience"
  accreditationRequired: boolean;
}

export type EducationLevel = 
  | 'high_school'
  | 'associate'
  | 'bachelor'
  | 'master'
  | 'doctorate'
  | 'professional'
  | 'certification';

export interface LanguageRequirement {
  language: string;
  proficiency: LanguageProficiency;
  required: boolean;
  businessContext?: string;
}

export type SecurityClearanceLevel = 
  | 'public_trust'
  | 'confidential'
  | 'secret'
  | 'top_secret'
  | 'sci';

// Job Status and Workflow
export type JobStatus = 
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'paused'
  | 'filled'
  | 'cancelled'
  | 'expired';

export type JobPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type JobUrgency = 
  | 'standard'
  | 'expedited'
  | 'emergency';

export interface HiringStage {
  id: string;
  name: string;
  description: string;
  order: number;
  required: boolean;
  estimatedDuration: number; // days
  
  // Stage configuration
  autoAdvance: boolean;
  requiresApproval: boolean;
  approvers: string[];
  
  // Bias mitigation
  blindReview: boolean;
  diversityRequirements: DiversityRequirement[];
  
  // Criteria
  passingCriteria: StageCriteria[];
  scoringRubric?: ScoringRubric;
}

export interface InterviewStage {
  id: string;
  name: string;
  type: InterviewType;
  duration: number; // minutes
  
  // Participants
  interviewers: InterviewerRequirement[];
  panelSize: number;
  diversityRequirements: DiversityRequirement[];
  
  // Format and structure
  format: InterviewFormat;
  structure: InterviewStructure;
  questions: InterviewQuestion[];
  
  // Scheduling
  bufferTime: number; // minutes between interviews
  timeSlots: TimeSlot[];
  timezoneFlexible: boolean;
  
  // Assessment
  evaluationCriteria: EvaluationCriteria[];
  scoringMethod: ScoringMethod;
}

export type InterviewType = 
  | 'phone_screening'
  | 'video_interview'
  | 'in_person'
  | 'technical'
  | 'behavioral'
  | 'panel'
  | 'presentation'
  | 'case_study';

export type InterviewFormat = 
  | 'structured'
  | 'semi_structured'
  | 'unstructured'
  | 'competency_based';

export interface InterviewerRequirement {
  role: string;
  required: boolean;
  alternates: string[];
  diversityAttributes?: string[];
}

export interface DiversityRequirement {
  attribute: string;
  representation: 'required' | 'preferred' | 'balanced';
  minimumCount?: number;
}

// Company and Team Information
export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  size: CompanySize;
  description: string;
  
  // Culture and values
  values: string[];
  cultureDescription: string;
  workEnvironment: WorkEnvironment;
  
  // Diversity and inclusion
  diversityStatement: string;
  inclusionInitiatives: string[];
  diversityMetrics?: DiversityMetrics;
  
  // Benefits and perks
  benefits: Benefit[];
  perks: string[];
  
  // Location and remote work
  headquarters: Location;
  offices: Location[];
  remotePolicy: RemotePolicy;
}

export interface TeamInfo {
  id: string;
  name: string;
  description: string;
  size: number;
  
  // Team composition
  currentMembers: TeamMember[];
  diversityProfile: DiversityProfile;
  
  // Team dynamics
  workStyle: WorkStyle;
  collaborationTools: string[];
  meetingCadence: string;
  
  // Growth and development
  learningOpportunities: string[];
  careerProgression: string[];
  mentorshipAvailable: boolean;
}

export interface TeamMember {
  id: string;
  role: string;
  seniority: ExperienceLevel;
  tenure: number; // months
  // Note: No personal identifiers for privacy
}

export interface DiversityProfile {
  genderDistribution: Record<string, number>;
  experienceLevelDistribution: Record<string, number>;
  tenureDistribution: Record<string, number>;
  // Note: Aggregated data only, no individual identification
}

export interface CultureAttribute {
  name: string;
  description: string;
  importance: number; // 0-100
  examples: string[];
  assessmentQuestions: string[];
}

// Job Metrics and Analytics
export interface JobMetrics {
  // Application metrics
  totalApplications: number;
  qualifiedApplications: number;
  applicationRate: number; // applications per day
  
  // Conversion metrics
  screeningPassRate: number; // 0-100
  interviewToOfferRate: number; // 0-100
  offerAcceptanceRate: number; // 0-100
  
  // Time metrics
  averageTimeToHire: number; // days
  timeToFirstInterview: number; // days
  timeToOffer: number; // days
  
  // Quality metrics
  candidateQualityScore: number; // 0-100
  hiringManagerSatisfaction: number; // 0-100
  newHireRetention: number; // 0-100 at 90 days
  
  // Diversity metrics
  diversityMetrics: DiversityMetrics;
  
  // Bias metrics
  biasMetrics: FairnessMetrics;
  
  // Cost metrics
  costPerHire: number;
  timeToProductivity: number; // days
  
  // Updated timestamp
  lastUpdated: Date;
}

export interface DiversityMetrics {
  applicantDiversity: Record<string, number>; // percentage by demographic
  hiredDiversity: Record<string, number>; // percentage by demographic
  diversityGoals: Record<string, number>; // target percentages
  diversityTrends: DiversityTrend[];
}

export interface DiversityTrend {
  period: string; // e.g., "2024-Q1"
  metric: string;
  value: number;
  change: number; // percentage change from previous period
}

// Assessment and Evaluation
export interface StageCriteria {
  criterion: string;
  weight: number; // 0-100
  passingScore: number; // 0-100
  evaluationMethod: string;
}

export interface ScoringRubric {
  id: string;
  name: string;
  criteria: RubricCriterion[];
  scoringScale: ScoringScale;
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number; // 0-100
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
  indicators: string[];
}

export interface ScoringScale {
  min: number;
  max: number;
  increment: number;
  labels: Record<number, string>;
}

export interface EvaluationCriteria {
  criterion: string;
  description: string;
  weight: number; // 0-100
  assessmentMethod: string;
  passingThreshold: number; // 0-100
}

export type ScoringMethod = 
  | 'numeric'
  | 'rubric'
  | 'ranking'
  | 'pass_fail'
  | 'competency_based';

// Supporting Types
export interface JobLocation {
  type: LocationType;
  city?: string;
  state?: string;
  country: string;
  remote: boolean;
  hybrid: boolean;
  relocationAssistance: boolean;
}

export type LocationType = 
  | 'on_site'
  | 'remote'
  | 'hybrid'
  | 'flexible';

export interface Location {
  city: string;
  state?: string;
  country: string;
  timezone: string;
}

export interface Benefit {
  category: BenefitCategory;
  name: string;
  description: string;
  value?: string;
}

export type BenefitCategory = 
  | 'health'
  | 'retirement'
  | 'time_off'
  | 'professional_development'
  | 'wellness'
  | 'financial'
  | 'family'
  | 'transportation'
  | 'other';

export interface RemotePolicy {
  type: RemotePolicyType;
  description: string;
  requirements: string[];
  equipment: string[];
  allowance?: number;
}

export type RemotePolicyType = 
  | 'fully_remote'
  | 'hybrid_required'
  | 'hybrid_optional'
  | 'office_required'
  | 'flexible';

export interface WorkEnvironment {
  type: 'startup' | 'corporate' | 'agency' | 'nonprofit' | 'government';
  pace: 'fast' | 'moderate' | 'steady';
  structure: 'hierarchical' | 'flat' | 'matrix';
  culture: 'collaborative' | 'competitive' | 'innovative' | 'traditional';
}

export interface WorkStyle {
  collaboration: 'high' | 'medium' | 'low';
  autonomy: 'high' | 'medium' | 'low';
  structure: 'high' | 'medium' | 'low';
  innovation: 'high' | 'medium' | 'low';
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6, Sunday = 0
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: QuestionType;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedDuration: number; // minutes
  followUpQuestions: string[];
  evaluationCriteria: string[];
}

export type QuestionType = 
  | 'behavioral'
  | 'technical'
  | 'situational'
  | 'case_study'
  | 'problem_solving'
  | 'culture_fit';

export interface InterviewStructure {
  introduction: number; // minutes
  questions: number; // minutes
  candidateQuestions: number; // minutes
  wrap_up: number; // minutes
  buffer: number; // minutes
}