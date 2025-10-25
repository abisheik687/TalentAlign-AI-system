// Candidate-Job Matching and Explainable AI Types

export interface MatchResult {
  id: string;
  candidateId: string;
  jobId: string;
  
  // Overall matching
  overallScore: number; // 0-100
  confidence: number; // 0-100
  
  // Detailed scoring
  categoryScores: CategoryScore[];
  skillsMatch: SkillsMatchResult;
  experienceMatch: ExperienceMatchResult;
  educationMatch: EducationMatchResult;
  cultureMatch: CultureMatchResult;
  
  // Explanations
  explanation: MatchExplanation;
  strengths: MatchStrength[];
  concerns: MatchConcern[];
  
  // Growth and development
  growthPotential: GrowthAssessment;
  skillsGaps: SkillGap[];
  learningPath: LearningRecommendation[];
  
  // Bias analysis
  biasAnalysis: MatchBiasAnalysis;
  fairnessScore: number; // 0-100
  
  // Metadata
  matchedAt: Date;
  matchingAlgorithmVersion: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  
  // Status
  status: MatchStatus;
  feedback?: MatchFeedback;
}

export interface CategoryScore {
  category: MatchCategory;
  score: number; // 0-100
  weight: number; // 0-100, importance in overall calculation
  confidence: number; // 0-100
  explanation: string;
  factors: ScoreFactor[];
}

export type MatchCategory = 
  | 'skills'
  | 'experience'
  | 'education'
  | 'culture'
  | 'location'
  | 'salary'
  | 'growth_potential'
  | 'team_fit'
  | 'industry_knowledge'
  | 'leadership'
  | 'communication';

export interface ScoreFactor {
  factor: string;
  impact: number; // -100 to 100, positive is good match
  weight: number; // 0-100
  explanation: string;
  evidence: string[];
}

// Skills Matching
export interface SkillsMatchResult {
  overallScore: number; // 0-100
  
  // Detailed breakdown
  requiredSkillsMatch: SkillMatchDetail[];
  preferredSkillsMatch: SkillMatchDetail[];
  
  // Analysis
  criticalSkillsGaps: string[];
  transferableSkills: string[];
  uniqueSkills: string[]; // Skills candidate has that weren't required
  
  // Scoring details
  requiredSkillsScore: number; // 0-100
  preferredSkillsScore: number; // 0-100
  skillDepthScore: number; // 0-100
  skillBreadthScore: number; // 0-100
}

export interface SkillMatchDetail {
  skillName: string;
  required: boolean;
  importance: SkillImportance;
  
  // Candidate's skill level
  candidateLevel: number; // 0-100
  candidateExperience: number; // years
  candidateConfidence: number; // 0-100
  
  // Job requirement
  requiredLevel: number; // 0-100
  preferredLevel: number; // 0-100
  
  // Match analysis
  matchScore: number; // 0-100
  gap: number; // required - candidate level
  overqualified: boolean;
  
  // Evidence
  evidenceSources: EvidenceSource[];
  validationStatus: ValidationStatus;
}

export interface EvidenceSource {
  type: 'resume' | 'portfolio' | 'certification' | 'assessment' | 'reference';
  source: string;
  confidence: number; // 0-100
  details: string;
}

export type ValidationStatus = 
  | 'verified'
  | 'self_reported'
  | 'inferred'
  | 'unverified';

// Experience Matching
export interface ExperienceMatchResult {
  overallScore: number; // 0-100
  
  // Experience analysis
  totalExperience: number; // years
  relevantExperience: number; // years
  industryExperience: number; // years
  
  // Level matching
  candidateLevel: ExperienceLevel;
  requiredLevel: ExperienceLevel;
  levelMatch: boolean;
  levelGap: number; // levels difference
  
  // Experience quality
  progressionScore: number; // 0-100, career progression quality
  diversityScore: number; // 0-100, experience diversity
  stabilityScore: number; // 0-100, job stability
  
  // Detailed analysis
  relevantRoles: RelevantRole[];
  industryAlignment: IndustryAlignment[];
  leadershipExperience: LeadershipExperience;
}

export interface RelevantRole {
  title: string;
  relevanceScore: number; // 0-100
  duration: number; // months
  skillsAlignment: string[];
  responsibilityAlignment: string[];
}

export interface IndustryAlignment {
  industry: string;
  experience: number; // years
  relevanceScore: number; // 0-100
  transferabilityScore: number; // 0-100
}

export interface LeadershipExperience {
  hasLeadershipExperience: boolean;
  teamSizesManaged: number[];
  leadershipDuration: number; // years
  leadershipScore: number; // 0-100
}

// Education Matching
export interface EducationMatchResult {
  overallScore: number; // 0-100
  
  // Requirement matching
  meetsMinimumRequirement: boolean;
  educationLevel: EducationLevel;
  requiredLevel: EducationLevel;
  
  // Field alignment
  fieldRelevance: FieldRelevance[];
  
  // Institution quality
  institutionCredibility: number; // 0-100
  accreditationStatus: AccreditationStatus;
  
  // Additional factors
  gpaScore?: number; // 0-100 if available
  honorsScore: number; // 0-100
  relevantCourseworkScore: number; // 0-100
  
  // Alternative qualifications
  alternativeQualifications: AlternativeQualification[];
}

export interface FieldRelevance {
  field: string;
  relevanceScore: number; // 0-100
  directAlignment: boolean;
  transferableKnowledge: string[];
}

export interface AlternativeQualification {
  type: 'certification' | 'experience' | 'portfolio' | 'bootcamp' | 'other';
  description: string;
  equivalencyScore: number; // 0-100
  acceptabilityScore: number; // 0-100
}

// Culture Matching
export interface CultureMatchResult {
  overallScore: number; // 0-100
  
  // Culture dimensions
  cultureAlignment: CultureAlignment[];
  
  // Work style matching
  workStyleMatch: WorkStyleMatch;
  
  // Values alignment
  valuesAlignment: ValuesAlignment[];
  
  // Team fit
  teamFitScore: number; // 0-100
  teamDynamicsMatch: TeamDynamicsMatch;
  
  // Communication style
  communicationStyleMatch: CommunicationStyleMatch;
}

export interface CultureAlignment {
  attribute: string;
  candidateScore: number; // 0-100
  companyScore: number; // 0-100
  importance: number; // 0-100
  alignmentScore: number; // 0-100
  explanation: string;
}

export interface WorkStyleMatch {
  autonomyMatch: number; // 0-100
  collaborationMatch: number; // 0-100
  structureMatch: number; // 0-100
  paceMatch: number; // 0-100
  innovationMatch: number; // 0-100
}

export interface ValuesAlignment {
  value: string;
  candidateImportance: number; // 0-100
  companyEmphasis: number; // 0-100
  alignmentScore: number; // 0-100
}

export interface TeamDynamicsMatch {
  diversityContribution: number; // 0-100
  skillComplementarity: number; // 0-100
  experienceBalance: number; // 0-100
  personalityFit: number; // 0-100
}

export interface CommunicationStyleMatch {
  directnessMatch: number; // 0-100
  formalityMatch: number; // 0-100
  frequencyMatch: number; // 0-100
  channelPreferenceMatch: number; // 0-100
}

// Growth Assessment
export interface GrowthAssessment {
  overallPotential: number; // 0-100
  
  // Growth dimensions
  learningAgility: number; // 0-100
  adaptability: number; // 0-100
  ambition: number; // 0-100
  coachability: number; // 0-100
  
  // Career trajectory
  careerTrajectory: CareerTrajectory;
  promotionPotential: PromotionPotential;
  
  // Development areas
  developmentAreas: DevelopmentArea[];
  strengthsToLeverage: string[];
  
  // Time to productivity
  estimatedTimeToProductivity: number; // days
  onboardingComplexity: OnboardingComplexity;
}

export interface CareerTrajectory {
  direction: 'upward' | 'lateral' | 'specialist' | 'unclear';
  consistency: number; // 0-100
  acceleration: number; // 0-100
  nextLikelyRole: string;
  timeToNextLevel: number; // months
}

export interface PromotionPotential {
  shortTerm: number; // 0-100, within 1 year
  mediumTerm: number; // 0-100, within 2-3 years
  longTerm: number; // 0-100, within 5 years
  limitingFactors: string[];
  acceleratingFactors: string[];
}

export interface DevelopmentArea {
  area: string;
  currentLevel: number; // 0-100
  targetLevel: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  developmentPath: string[];
  timeframe: string;
}

export type OnboardingComplexity = 
  | 'simple'
  | 'moderate'
  | 'complex'
  | 'extensive';

// Match Explanation and Transparency
export interface MatchExplanation {
  summary: string;
  keyFactors: ExplanationFactor[];
  methodology: MatchingMethodology;
  assumptions: string[];
  limitations: string[];
  confidence: number; // 0-100
}

export interface ExplanationFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-100
  explanation: string;
  evidence: string[];
  confidence: number; // 0-100
}

export interface MatchingMethodology {
  algorithmVersion: string;
  modelType: string;
  trainingData: string;
  biasAdjustments: string[];
  weightingScheme: WeightingScheme;
}

export interface WeightingScheme {
  skillsWeight: number; // 0-100
  experienceWeight: number; // 0-100
  educationWeight: number; // 0-100
  cultureWeight: number; // 0-100
  customWeights: Record<string, number>;
}

// Match Quality and Feedback
export interface MatchStrength {
  area: string;
  score: number; // 0-100
  description: string;
  evidence: string[];
  businessImpact: string;
}

export interface MatchConcern {
  area: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  mitigation: string[];
  dealBreaker: boolean;
}

export type MatchStatus = 
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'on_hold'
  | 'expired';

export interface MatchFeedback {
  reviewerId: string;
  rating: number; // 1-5
  accuracy: number; // 1-5
  usefulness: number; // 1-5
  comments: string;
  improvements: string[];
  createdAt: Date;
}

// Bias Analysis for Matching
export interface MatchBiasAnalysis {
  overallBiasScore: number; // 0-1, lower is better
  biasFlags: MatchBiasFlag[];
  fairnessMetrics: MatchFairnessMetrics;
  demographicImpact: DemographicImpact[];
  mitigationApplied: BiasMitigation[];
}

export interface MatchBiasFlag {
  type: BiasType;
  severity: BiasSeverity;
  description: string;
  affectedFactor: string;
  evidence: string;
  recommendation: string;
}

export type BiasType = 
  | 'demographic'
  | 'educational'
  | 'experiential'
  | 'linguistic'
  | 'cultural'
  | 'algorithmic';

export interface MatchFairnessMetrics {
  demographicParity: number; // 0-1
  equalizedOdds: number; // 0-1
  calibration: number; // 0-1
  individualFairness: number; // 0-1
}

export interface DemographicImpact {
  demographic: string;
  representation: number; // percentage in candidate pool
  selectionRate: number; // percentage selected
  averageScore: number; // average match score
  disparateImpact: number; // ratio compared to reference group
}

export interface BiasMitigation {
  technique: string;
  description: string;
  effectiveness: number; // 0-100
  appliedTo: string[];
}

// Matching Configuration
export interface MatchingConfig {
  // Algorithm settings
  algorithmType: 'weighted_sum' | 'neural_network' | 'ensemble' | 'hybrid';
  modelVersion: string;
  
  // Scoring weights
  categoryWeights: Record<MatchCategory, number>;
  
  // Bias mitigation
  biasAdjustments: BiasAdjustment[];
  fairnessConstraints: FairnessConstraint[];
  
  // Quality thresholds
  minimumMatchScore: number; // 0-100
  confidenceThreshold: number; // 0-100
  
  // Explanation settings
  explanationDepth: 'basic' | 'detailed' | 'comprehensive';
  includeNegativeFactors: boolean;
  
  // Performance settings
  maxCandidatesPerJob: number;
  maxJobsPerCandidate: number;
  refreshFrequency: number; // hours
}

export interface BiasAdjustment {
  type: string;
  target: string;
  adjustment: number; // -1 to 1
  condition: string;
}

export interface FairnessConstraint {
  metric: keyof MatchFairnessMetrics;
  threshold: number;
  enforcement: 'soft' | 'hard';
}