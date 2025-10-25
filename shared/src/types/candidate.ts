// Candidate and Resume Analysis Types

export interface Candidate {
  id: string;
  
  // Anonymized profile data
  profile: CandidateProfile;
  
  // Application status
  status: CandidateStatus;
  source: CandidateSource;
  
  // Consent and privacy
  consentRecords: ConsentRecord[];
  dataRetentionExpiry: Date;
  anonymizationLevel: AnonymizationLevel;
  
  // Analysis results
  resumeAnalysis?: ResumeAnalysis;
  skillsAssessment?: SkillsAssessment;
  biasFlags: BiasFlag[];
  
  // Application history
  applications: JobApplication[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export interface CandidateProfile {
  // Basic info (anonymized)
  experienceLevel: ExperienceLevel;
  industryBackground: string[];
  locationPreferences: LocationPreference[];
  
  // Skills and competencies
  skills: SkillAssessment[];
  certifications: Certification[];
  languages: LanguageSkill[];
  
  // Experience
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  
  // Preferences
  jobPreferences: JobPreferences;
  salaryExpectations?: SalaryRange;
  availabilityDate?: Date;
  
  // Calculated scores
  overallScore: number; // 0-100
  confidenceScore: number; // 0-100
  completenessScore: number; // 0-100
}

export type CandidateStatus = 
  | 'new'
  | 'screening'
  | 'qualified'
  | 'interviewing'
  | 'offer_pending'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
  | 'on_hold';

export type CandidateSource = 
  | 'direct_application'
  | 'referral'
  | 'job_board'
  | 'social_media'
  | 'recruitment_agency'
  | 'career_fair'
  | 'internal_mobility'
  | 'other';

export type AnonymizationLevel = 
  | 'none'
  | 'partial'
  | 'full'
  | 'irreversible';

export type ExperienceLevel = 
  | 'entry'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'executive';

// Resume Analysis
export interface ResumeAnalysis {
  id: string;
  candidateId: string;
  
  // Parsing results
  extractedData: ExtractedResumeData;
  parsingConfidence: number; // 0-100
  
  // Content analysis
  contentAnalysis: ContentAnalysis;
  
  // Bias detection
  biasAnalysis: BiasAnalysis;
  
  // Quality assessment
  qualityScore: number; // 0-100
  completenessScore: number; // 0-100
  
  // Metadata
  originalFileName: string;
  fileSize: number;
  processingTime: number; // milliseconds
  
  // Timestamps
  analyzedAt: Date;
  createdAt: Date;
}

export interface ExtractedResumeData {
  // Personal info (will be anonymized)
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    portfolio?: string;
  };
  
  // Professional summary
  summary?: string;
  objective?: string;
  
  // Experience
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  projects: Project[];
  
  // Additional sections
  awards?: Award[];
  publications?: Publication[];
  volunteerWork?: VolunteerWork[];
  languages?: LanguageSkill[];
}

export interface ContentAnalysis {
  // Text analysis
  wordCount: number;
  readabilityScore: number;
  sentimentScore: number; // -1 to 1
  
  // Structure analysis
  sectionCompleteness: Record<string, boolean>;
  formattingQuality: number; // 0-100
  
  // Content quality
  specificityScore: number; // 0-100, how specific vs generic
  quantificationScore: number; // 0-100, use of numbers/metrics
  actionVerbScore: number; // 0-100, use of strong action verbs
  
  // Red flags
  redFlags: ContentRedFlag[];
}

export interface ContentRedFlag {
  type: 'gap' | 'inconsistency' | 'overqualification' | 'underqualification' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

// Work Experience
export interface WorkExperience {
  id: string;
  title: string;
  company: string; // Will be anonymized
  location?: string;
  startDate: Date;
  endDate?: Date; // null if current
  isCurrent: boolean;
  
  // Details
  description: string;
  responsibilities: string[];
  achievements: string[];
  skillsUsed: string[];
  
  // Metadata
  industryType: string;
  companySizeCategory: CompanySize;
  employmentType: EmploymentType;
  
  // Validation
  verified: boolean;
  verificationSource?: string;
  confidenceScore: number; // 0-100
}

export type CompanySize = 
  | 'startup'
  | 'small'
  | 'medium'
  | 'large'
  | 'enterprise';

export type EmploymentType = 
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'freelance'
  | 'internship'
  | 'volunteer';

// Education
export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string; // Will be anonymized
  location?: string;
  startDate?: Date;
  endDate?: Date;
  gpa?: number;
  
  // Additional details
  honors?: string[];
  relevantCoursework?: string[];
  thesis?: string;
  activities?: string[];
  
  // Validation
  verified: boolean;
  credibilityScore: number; // 0-100, based on institution ranking
  accreditationStatus: AccreditationStatus;
}

export type AccreditationStatus = 
  | 'fully_accredited'
  | 'conditionally_accredited'
  | 'not_accredited'
  | 'unknown';

// Skills Assessment
export interface SkillsAssessment {
  id: string;
  candidateId: string;
  
  // Overall assessment
  overallScore: number; // 0-100
  skillsGap: SkillGap[];
  strengths: string[];
  developmentAreas: string[];
  
  // Detailed skills
  technicalSkills: SkillAssessment[];
  softSkills: SkillAssessment[];
  industryKnowledge: SkillAssessment[];
  
  // Assessment metadata
  assessmentMethod: AssessmentMethod[];
  assessedAt: Date;
  validUntil: Date;
}

export interface SkillGap {
  skill: string;
  required: number; // 0-100
  current: number; // 0-100
  gap: number; // required - current
  priority: 'low' | 'medium' | 'high' | 'critical';
  learningPath?: LearningRecommendation[];
}

export interface LearningRecommendation {
  type: 'course' | 'certification' | 'project' | 'mentorship' | 'book' | 'other';
  title: string;
  provider?: string;
  duration?: string;
  cost?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relevanceScore: number; // 0-100
}

export type AssessmentMethod = 
  | 'resume_analysis'
  | 'portfolio_review'
  | 'technical_test'
  | 'behavioral_assessment'
  | 'reference_check'
  | 'interview'
  | 'work_sample';

// Job Application
export interface JobApplication {
  id: string;
  candidateId: string;
  jobId: string;
  
  // Application details
  status: ApplicationStatus;
  appliedAt: Date;
  source: CandidateSource;
  
  // Matching
  matchScore: number; // 0-100
  matchExplanation: MatchExplanation;
  
  // Process tracking
  stageHistory: ApplicationStage[];
  currentStage: string;
  
  // Feedback
  feedback: ApplicationFeedback[];
  
  // Decision
  finalDecision?: ApplicationDecision;
  decisionReason?: string;
  decisionMadeBy?: string;
  decisionMadeAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationStatus = 
  | 'submitted'
  | 'under_review'
  | 'screening_passed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'reference_check'
  | 'offer_extended'
  | 'offer_accepted'
  | 'offer_declined'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationStage {
  stage: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  completedBy?: string;
}

export interface ApplicationFeedback {
  id: string;
  stage: string;
  reviewer: string;
  rating?: number; // 1-5
  comments: string;
  strengths: string[];
  concerns: string[];
  recommendation: 'advance' | 'reject' | 'hold' | 'reassess';
  createdAt: Date;
}

export type ApplicationDecision = 
  | 'hire'
  | 'reject'
  | 'hold'
  | 'refer_other_position';

// Additional supporting types
export interface Certification {
  name: string;
  issuer: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  verified: boolean;
}

export interface LanguageSkill {
  language: string;
  proficiency: LanguageProficiency;
  certified: boolean;
  certificationName?: string;
}

export type LanguageProficiency = 
  | 'basic'
  | 'conversational'
  | 'professional'
  | 'fluent'
  | 'native';

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  role: string;
  duration?: string;
  teamSize?: number;
  outcomes: string[];
  url?: string;
  repositoryUrl?: string;
}

export interface Award {
  name: string;
  issuer: string;
  date?: Date;
  description?: string;
}

export interface Publication {
  title: string;
  publisher: string;
  date?: Date;
  url?: string;
  coAuthors?: string[];
}

export interface VolunteerWork {
  organization: string;
  role: string;
  startDate?: Date;
  endDate?: Date;
  description: string;
  skillsUsed: string[];
}

export interface JobPreferences {
  jobTypes: EmploymentType[];
  industries: string[];
  companySizes: CompanySize[];
  workArrangement: WorkArrangement[];
  travelWillingness: number; // 0-100 percentage
  relocationWillingness: boolean;
}

export type WorkArrangement = 
  | 'on_site'
  | 'remote'
  | 'hybrid'
  | 'flexible';

export interface LocationPreference {
  city: string;
  state?: string;
  country: string;
  priority: number; // 1 = highest priority
  willingToRelocate: boolean;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  frequency: 'hourly' | 'monthly' | 'annually';
  negotiable: boolean;
}