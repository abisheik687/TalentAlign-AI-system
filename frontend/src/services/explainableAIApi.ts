import { BaseApiService } from './api';

/**
 * Explainable AI API Service
 * Client-side API for explainable AI functionality
 * Requirements: 2.2, 2.5, 5.1, 5.2
 */

export interface MatchResult {
  candidateId: string;
  jobId: string;
  overallScore: number;
  componentScores: {
    skills?: number;
    experience?: number;
    education?: number;
    location?: number;
    cultural?: number;
  };
  matchedSkills?: any[];
  skillGaps?: any[];
  requiredSkills?: any[];
  confidence?: number;
  candidate?: any;
  job?: any;
  jobUrgency?: string;
}

export interface ExplanationOptions {
  audienceType?: 'recruiter' | 'hiring_manager' | 'candidate' | 'admin';
  detailLevel?: 'basic' | 'standard' | 'detailed';
  language?: string;
  forceRefresh?: boolean;
  includeVisuals?: boolean;
}

export interface MatchExplanation {
  explanationId: string;
  candidateId: string;
  jobId: string;
  matchScore: number;
  summary: MatchSummary;
  componentExplanations: ComponentExplanation[];
  strengthsWeaknesses: StrengthsWeaknessesAnalysis;
  recommendations: Recommendation[];
  fairnessExplanation: FairnessExplanation;
  confidenceAssessment: ConfidenceAssessment;
  visualData: VisualExplanationData;
  contextualFactors: ContextualFactor[];
  generatedAt: Date;
  processingTime: number;
  metadata: {
    explanationVersion: string;
    audienceType: string;
    detailLevel: string;
    language: string;
  };
}

export interface NonMatchExplanation {
  explanationId: string;
  candidateId: string;
  jobId: string;
  matchScore: number;
  primaryReasons: NonMatchReason[];
  gapAnalysis: SkillsGapAnalysis;
  improvementSuggestions: ImprovementSuggestion[];
  alternativeOpportunities: AlternativeOpportunity[];
  fairnessAssessment: FairnessAssessment;
  generatedAt: Date;
  metadata: {
    explanationVersion: string;
    audienceType: string;
    language: string;
  };
}

export interface BatchExplanationResult {
  batchId: string;
  totalMatches: number;
  successfulExplanations: number;
  failedExplanations: number;
  explanations: MatchExplanation[];
  errors: ExplanationError[];
  batchInsights: BatchInsights;
  processingTime: number;
  generatedAt: Date;
}

export interface AlgorithmExplanation {
  explanationId: string;
  decisionType: string;
  algorithmLogic: AlgorithmLogic;
  featureImportance: FeatureImportance[];
  decisionBoundaries: DecisionBoundaries;
  biasAnalysis: BiasAnalysis;
  transparencyReport: TransparencyReport;
  generatedAt: Date;
  metadata: {
    algorithmVersion: string;
    dataVersion: string;
    explanationVersion: string;
  };
}

export interface ExplanationRequest {
  requestId: string;
  candidateId: string;
  jobId: string;
  requestType: 'match_decision' | 'rejection_reason' | 'algorithm_details';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  createdAt: Date;
  completedAt?: Date;
  explanationId?: string;
}

export interface ExplanationFeedback {
  explanationId: string;
  rating: number;
  feedback?: string;
  categories?: string[];
  userId: string;
  submittedAt: Date;
}

export interface ExplanationAnalytics {
  totalExplanations: number;
  averageRating: number;
  usageByAudience: Record<string, number>;
  commonFeedbackCategories: Array<{ category: string; count: number }>;
  explanationTypes: Record<string, number>;
  averageProcessingTime: number;
  timeRange: string;
  generatedAt: Date;
}

// Supporting interfaces
export interface MatchSummary {
  overallScore: number;
  confidence: number;
  summaryText: string;
  recommendation: string;
  keyStrengths: string[];
  primaryConcerns: string[];
}

export interface ComponentExplanation {
  component: string;
  score: number;
  explanation: string;
  importance: number;
  details: any;
  visualType: string;
}

export interface StrengthsWeaknessesAnalysis {
  strengths: Strength[];
  weaknesses: Weakness[];
  overallAssessment: string;
}

export interface Strength {
  area: string;
  score: number;
  description: string;
  impact: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface Weakness {
  area: string;
  score: number;
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestions: string[];
}

export interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
}

export interface FairnessExplanation {
  biasRisk: number;
  biasFactors: string[];
  demographicImpact: any;
  fairnessMetrics: any;
  mitigationMeasures: string[];
  complianceStatus: 'compliant' | 'requires_review' | 'non_compliant';
  explanation: string;
}

export interface ConfidenceAssessment {
  overallConfidence: number;
  confidenceLevel: string;
  factors: ConfidenceFactor[];
  explanation: string;
  limitations: string[];
}

export interface ConfidenceFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

export interface VisualExplanationData {
  scoreBreakdown: {
    type: string;
    data: any[];
  };
  skillsMatch: {
    type: string;
    data: any;
  };
  confidenceIndicator: {
    type: string;
    data: any;
  };
  matchTrend: {
    type: string;
    data: any[];
  };
}

export interface ContextualFactor {
  factor: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export interface NonMatchReason {
  category: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SkillsGapAnalysis {
  criticalGaps: any[];
  developableGaps: any[];
  timeToClose: string;
  developmentPath: string[];
}

export interface ImprovementSuggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timeframe: string;
}

export interface AlternativeOpportunity {
  jobId: string;
  title: string;
  matchScore: number;
  reason: string;
}

export interface FairnessAssessment {
  fairnessScore: number;
  biasRisk: string;
  explanation: string;
}

export interface ExplanationError {
  candidateId: string;
  jobId: string;
  error: string;
}

export interface BatchInsights {
  averageMatchScore: number;
  commonStrengths: string[];
  commonWeaknesses: string[];
  recommendationDistribution: Record<string, number>;
}

export interface AlgorithmLogic {
  algorithmType: string;
  description: string;
  steps: string[];
  weights: Record<string, number>;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  description: string;
}

export interface DecisionBoundaries {
  thresholds: Record<string, number>;
  description: string;
  rationale: string;
}

export interface BiasAnalysis {
  overallRisk: number;
  identifiedFactors: string[];
  mitigationMeasures: string[];
  complianceStatus: string;
}

export interface TransparencyReport {
  dataUsed: string[];
  dataNotUsed: string[];
  algorithmVersion: string;
  lastUpdated: Date;
  auditTrail: string;
}

export class ExplainableAIApi extends BaseApiService {
  constructor() {
    super('/api/explainable-ai');
  }

  /**
   * Generate explanation for a candidate-job match
   */
  async explainMatch(
    candidateId: string,
    jobId: string,
    matchResult: MatchResult,
    options: ExplanationOptions = {}
  ): Promise<{ success: boolean; data: MatchExplanation }> {
    return this.post('/explain-match', {
      candidateId,
      jobId,
      matchResult,
      options
    });
  }

  /**
   * Generate explanation for why a candidate was not matched
   */
  async explainNonMatch(
    candidateId: string,
    jobId: string,
    matchResult: MatchResult,
    options: ExplanationOptions = {}
  ): Promise<{ success: boolean; data: NonMatchExplanation }> {
    return this.post('/explain-non-match', {
      candidateId,
      jobId,
      matchResult,
      options
    });
  }

  /**
   * Generate explanations for multiple matches
   */
  async explainBatchMatches(
    matches: MatchResult[],
    options: ExplanationOptions = {}
  ): Promise<{ success: boolean; data: BatchExplanationResult }> {
    return this.post('/explain-batch', {
      matches,
      options
    });
  }

  /**
   * Generate explanation for algorithm decision
   */
  async explainAlgorithmDecision(
    decisionContext: {
      decisionType: string;
      algorithmType?: string;
      algorithmVersion?: string;
      dataVersion?: string;
      weights?: Record<string, number>;
    },
    options: ExplanationOptions = {}
  ): Promise<{ success: boolean; data: AlgorithmExplanation }> {
    return this.post('/explain-algorithm', {
      decisionContext,
      options
    });
  }

  /**
   * Retrieve a previously generated explanation
   */
  async getExplanation(explanationId: string): Promise<{ success: boolean; data: MatchExplanation }> {
    return this.get(`/explanation/${explanationId}`);
  }

  /**
   * Get all explanations for a specific candidate
   */
  async getCandidateExplanations(
    candidateId: string,
    params: {
      limit?: number;
      offset?: number;
      jobId?: string;
    } = {}
  ): Promise<{
    success: boolean;
    data: {
      explanations: MatchExplanation[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    };
  }> {
    return this.get(`/candidate/${candidateId}/explanations`, { params });
  }

  /**
   * Get all explanations for a specific job
   */
  async getJobExplanations(
    jobId: string,
    params: {
      limit?: number;
      offset?: number;
      minScore?: number;
      maxScore?: number;
    } = {}
  ): Promise<{
    success: boolean;
    data: {
      explanations: MatchExplanation[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
      filters: {
        minScore?: number;
        maxScore?: number;
      };
    };
  }> {
    return this.get(`/job/${jobId}/explanations`, { params });
  }

  /**
   * Submit feedback on explanation quality
   */
  async submitFeedback(
    explanationId: string,
    rating: number,
    feedback?: string,
    categories?: string[]
  ): Promise<{ success: boolean; message: string }> {
    return this.post('/feedback', {
      explanationId,
      rating,
      feedback,
      categories
    });
  }

  /**
   * Get analytics on explanation quality and usage
   */
  async getExplanationAnalytics(params: {
    timeRange?: '7d' | '30d' | '90d' | '1y';
    audienceType?: 'recruiter' | 'hiring_manager' | 'candidate' | 'admin';
  } = {}): Promise<{ success: boolean; data: ExplanationAnalytics }> {
    return this.get('/analytics/explanation-quality', { params });
  }

  /**
   * Request explanation for a specific decision (candidate-initiated)
   */
  async requestExplanation(
    jobId: string,
    requestType: 'match_decision' | 'rejection_reason' | 'algorithm_details',
    message?: string
  ): Promise<{
    success: boolean;
    data: {
      requestId: string;
      status: string;
      estimatedCompletionTime: string;
      message: string;
    };
  }> {
    return this.post('/request-explanation', {
      jobId,
      requestType,
      message
    });
  }

  /**
   * Check status of explanation request
   */
  async getRequestStatus(requestId: string): Promise<{
    success: boolean;
    data: {
      requestId: string;
      status: string;
      completedAt?: Date;
      explanationId?: string;
      message: string;
    };
  }> {
    return this.get(`/request/${requestId}/status`);
  }

  /**
   * Get explanation summary for dashboard
   */
  async getExplanationSummary(params: {
    timeRange?: '7d' | '30d' | '90d';
    userId?: string;
  } = {}): Promise<{
    success: boolean;
    data: {
      totalExplanations: number;
      recentExplanations: MatchExplanation[];
      averageRating: number;
      pendingRequests: number;
      topCategories: Array<{ category: string; count: number }>;
    };
  }> {
    return this.get('/summary', { params });
  }

  /**
   * Export explanations data
   */
  async exportExplanations(
    format: 'csv' | 'json' | 'pdf',
    params: {
      timeRange?: '7d' | '30d' | '90d';
      candidateId?: string;
      jobId?: string;
      includeDetails?: boolean;
    } = {}
  ): Promise<Blob> {
    const response = await this.get('/export', {
      params: { ...params, format },
      responseType: 'blob'
    });
    return response as any;
  }

  /**
   * Get explanation templates for different audiences
   */
  async getExplanationTemplates(audienceType?: string): Promise<{
    success: boolean;
    data: {
      templates: Array<{
        id: string;
        name: string;
        audienceType: string;
        description: string;
        sections: string[];
      }>;
    };
  }> {
    return this.get('/templates', {
      params: audienceType ? { audienceType } : {}
    });
  }

  /**
   * Validate explanation configuration
   */
  async validateConfiguration(config: {
    audienceType: string;
    detailLevel: string;
    includeVisuals: boolean;
    language: string;
  }): Promise<{
    success: boolean;
    data: {
      isValid: boolean;
      issues: string[];
      recommendations: string[];
    };
  }> {
    return this.post('/validate-config', config);
  }

  /**
   * Get explanation performance metrics
   */
  async getPerformanceMetrics(params: {
    timeRange?: '7d' | '30d' | '90d';
    metricType?: 'processing_time' | 'accuracy' | 'user_satisfaction';
  } = {}): Promise<{
    success: boolean;
    data: {
      averageProcessingTime: number;
      accuracyScore: number;
      userSatisfactionScore: number;
      trendsData: Array<{
        date: string;
        processingTime: number;
        accuracy: number;
        satisfaction: number;
      }>;
    };
  }> {
    return this.get('/performance-metrics', { params });
  }

  /**
   * Test explanation generation with sample data
   */
  async testExplanation(
    sampleData: {
      candidateProfile: any;
      jobRequirements: any;
      matchResult: MatchResult;
    },
    options: ExplanationOptions = {}
  ): Promise<{ success: boolean; data: MatchExplanation }> {
    return this.post('/test-explanation', {
      sampleData,
      options
    });
  }
}

// Export singleton instance
export const explainableAIApi = new ExplainableAIApi();