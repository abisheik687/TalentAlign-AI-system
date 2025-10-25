// Ethical AI Requirements Interface
export interface EthicalAIRequirements {
  explainableDecisions: boolean;
  biasMonitoring: boolean;
  dataAnonymization: boolean;
  candidateConsent: boolean;
  algorithmTransparency: boolean;
  humanOversight: boolean;
}

// Fairness Metrics Interface
export interface FairnessMetrics {
  demographicParity: number;
  equalizedOdds: number;
  predictiveEquality: number;
  treatmentEquality: number;
  disparateImpact: number;
  statisticalSignificance: number;
  calculatedAt: Date;
}

// Bias Analysis Interface
export interface BiasAnalysis {
  biasScore: number;
  flaggedTerms: string[];
  suggestions: string[];
  fairnessMetrics: FairnessMetrics;
  analysisType: 'job_description' | 'resume' | 'matching' | 'interview';
  confidence: number;
  createdAt: Date;
}

// Anonymized Candidate Profile
export interface CandidateProfile {
  id: string;
  skills: SkillAssessment[];
  experience: ExperienceRecord[];
  education: EducationRecord[];
  projects: ProjectRecord[];
  anonymizedAt: Date;
  consentGiven: boolean;
  dataRetentionExpiry: Date;
}

// Skill Assessment
export interface SkillAssessment {
  name: string;
  category: string;
  proficiencyLevel: number; // 0-100
  confidenceScore: number; // 0-100
  yearsOfExperience: number;
  certifications: string[];
  validatedBy: 'resume' | 'portfolio' | 'assessment' | 'reference';
}

// Experience Record
export interface ExperienceRecord {
  title: string;
  company: string; // Anonymized company identifier
  duration: number; // in months
  responsibilities: string[];
  achievements: string[];
  skillsUsed: string[];
  industryType: string;
  companySizeCategory: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
}

// Education Record
export interface EducationRecord {
  degree: string;
  field: string;
  institution: string; // Anonymized institution identifier
  graduationYear: number;
  gpa?: number;
  honors?: string[];
  relevantCoursework: string[];
  credibilityScore: number; // Based on institution accreditation
}

// Project Record
export interface ProjectRecord {
  title: string;
  description: string;
  technologies: string[];
  duration: number; // in months
  teamSize: number;
  role: string;
  outcomes: string[];
  portfolioUrl?: string; // Anonymized portfolio link
}