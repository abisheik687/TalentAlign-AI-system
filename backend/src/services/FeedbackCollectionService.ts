import { logger } from '@/utils/logger';
import { BiasMonitoringService } from '@/services/BiasMonitoringService';
import crypto from 'crypto';

/**
 * Candidate Feedback Collection Service
 * Collects and analyzes candidate feedback with bias detection
 * Requirements: 3.4
 */
export class FeedbackCollectionService {
  private static instance: FeedbackCollectionService;
  private biasMonitoring: BiasMonitoringService;

  private constructor() {
    this.biasMonitoring = BiasMonitoringService.getInstance();
  }

  static getInstance(): FeedbackCollectionService {
    if (!FeedbackCollectionService.instance) {
      FeedbackCollectionService.instance = new FeedbackCollectionService();
    }
    return FeedbackCollectionService.instance;
  }

  /**
   * Create feedback survey for candidate
   */
  async createFeedbackSurvey(
    candidateId: string,
    interviewId: string,
    surveyType: SurveyType,
    customQuestions?: CustomQuestion[]
  ): Promise<FeedbackSurvey> {
    try {
      const surveyId = crypto.randomUUID();

      logger.info('Creating feedback survey', {
        surveyId,
        candidateId,
        interviewId,
        surveyType
      });

      // Generate survey questions based on type
      const questions = await this.generateSurveyQuestions(surveyType, customQuestions);

      // Create anonymous survey link
      const anonymousToken = this.generateAnonymousToken(candidateId, surveyId);

      const survey: FeedbackSurvey = {
        surveyId,
        candidateId,
        interviewId,
        surveyType,
        questions,
        anonymousToken,
        status: 'active',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        responses: [],
        isAnonymous: true,
        metadata: {
          version: '1.0',
          language: 'en'
        }
      };

      // Store survey
      await this.storeSurvey(survey);

      // Send survey invitation
      await this.sendSurveyInvitation(survey);

      return survey;

    } catch (error) {
      logger.error('Failed to create feedback survey:', error);
      throw error;
    }
  }

  /**
   * Submit feedback response
   */
  async submitFeedback(
    surveyId: string,
    responses: FeedbackResponse[],
    anonymousToken?: string
  ): Promise<FeedbackSubmission> {
    try {
      const submissionId = crypto.randomUUID();

      logger.info('Submitting feedback', {
        submissionId,
        surveyId,
        responseCount: responses.length,
        isAnonymous: !!anonymousToken
      });

      // Validate survey and token
      const survey = await this.getSurvey(surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      if (survey.isAnonymous && anonymousToken !== survey.anonymousToken) {
        throw new Error('Invalid anonymous token');
      }

      // Process and validate responses
      const processedResponses = await this.processResponses(responses, survey);

      // Analyze feedback for bias
      const biasAnalysis = await this.analyzeFeedbackBias(processedResponses, survey);

      // Create submission
      const submission: FeedbackSubmission = {
        submissionId,
        surveyId,
        candidateId: survey.candidateId,
        interviewId: survey.interviewId,
        responses: processedResponses,
        biasAnalysis,
        submittedAt: new Date(),
        isAnonymous: !!anonymousToken,
        ipAddress: anonymousToken ? null : 'masked', // Privacy protection
        metadata: {
          userAgent: 'masked',
          submissionVersion: '1.0'
        }
      };

      // Store submission
      await this.storeSubmission(submission);

      // Update survey status
      await this.updateSurveyStatus(surveyId, 'completed');

      // Trigger feedback analysis
      await this.triggerFeedbackAnalysis(submission);

      return submission;

    } catch (error) {
      logger.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * Analyze feedback trends and patterns
   */
  async analyzeFeedbackTrends(
    timeRange: TimeRange,
    filters: FeedbackFilters = {}
  ): Promise<FeedbackAnalysis> {
    try {
      logger.info('Analyzing feedback trends', { timeRange, filters });

      // Get feedback data
      const feedbackData = await this.getFeedbackData(timeRange, filters);

      // Calculate satisfaction metrics
      const satisfactionMetrics = this.calculateSatisfactionMetrics(feedbackData);

      // Identify improvement areas
      const improvementAreas = this.identifyImprovementAreas(feedbackData);

      // Analyze bias patterns
      const biasPatterns = await this.analyzeBiasPatterns(feedbackData);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        satisfactionMetrics,
        improvementAreas,
        biasPatterns
      );

      const analysis: FeedbackAnalysis = {
        analysisId: crypto.randomUUID(),
        timeRange,
        filters,
        satisfactionMetrics,
        improvementAreas,
        biasPatterns,
        recommendations,
        totalResponses: feedbackData.length,
        responseRate: this.calculateResponseRate(feedbackData, timeRange),
        generatedAt: new Date()
      };

      return analysis;

    } catch (error) {
      logger.error('Failed to analyze feedback trends:', error);
      throw error;
    }
  }

  // Private helper methods

  private async generateSurveyQuestions(
    surveyType: SurveyType,
    customQuestions?: CustomQuestion[]
  ): Promise<SurveyQuestion[]> {
    const baseQuestions = this.getBaseQuestions(surveyType);
    const questions: SurveyQuestion[] = [...baseQuestions];

    if (customQuestions) {
      questions.push(...customQuestions.map(q => ({
        questionId: crypto.randomUUID(),
        ...q
      })));
    }

    return questions;
  }

  private getBaseQuestions(surveyType: SurveyType): SurveyQuestion[] {
    const commonQuestions: SurveyQuestion[] = [
      {
        questionId: 'overall_experience',
        type: 'rating',
        text: 'How would you rate your overall interview experience?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] }
      },
      {
        questionId: 'process_fairness',
        type: 'rating',
        text: 'How fair did you find the interview process?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Very Unfair', 'Unfair', 'Neutral', 'Fair', 'Very Fair'] }
      },
      {
        questionId: 'interviewer_professionalism',
        type: 'rating',
        text: 'How professional were the interviewers?',
        required: true,
        scale: { min: 1, max: 5 }
      },
      {
        questionId: 'process_clarity',
        type: 'rating',
        text: 'How clear was the interview process explained to you?',
        required: true,
        scale: { min: 1, max: 5 }
      },
      {
        questionId: 'bias_concerns',
        type: 'multiple_choice',
        text: 'Did you experience any form of bias during the interview?',
        required: false,
        options: [
          'No bias experienced',
          'Age-related bias',
          'Gender-related bias',
          'Racial/ethnic bias',
          'Other bias',
          'Prefer not to answer'
        ]
      },
      {
        questionId: 'improvement_suggestions',
        type: 'text',
        text: 'What suggestions do you have for improving the interview process?',
        required: false,
        maxLength: 1000
      }
    ];

    // Add survey-type specific questions
    switch (surveyType) {
      case 'post_interview':
        return [
          ...commonQuestions,
          {
            questionId: 'technical_assessment',
            type: 'rating',
            text: 'How relevant were the technical questions to the role?',
            required: false,
            scale: { min: 1, max: 5 }
          }
        ];
      case 'post_rejection':
        return [
          ...commonQuestions,
          {
            questionId: 'feedback_quality',
            type: 'rating',
            text: 'How helpful was the feedback you received?',
            required: false,
            scale: { min: 1, max: 5 }
          }
        ];
      case 'post_offer':
        return [
          ...commonQuestions,
          {
            questionId: 'offer_process',
            type: 'rating',
            text: 'How satisfied are you with the offer process?',
            required: false,
            scale: { min: 1, max: 5 }
          }
        ];
      default:
        return commonQuestions;
    }
  }

  private generateAnonymousToken(candidateId: string, surveyId: string): string {
    return crypto.createHash('sha256')
      .update(`${candidateId}:${surveyId}:${Date.now()}`)
      .digest('hex');
  }

  private async processResponses(
    responses: FeedbackResponse[],
    survey: FeedbackSurvey
  ): Promise<ProcessedResponse[]> {
    const processed: ProcessedResponse[] = [];

    for (const response of responses) {
      const question = survey.questions.find(q => q.questionId === response.questionId);
      if (!question) continue;

      // Validate response format
      const isValid = this.validateResponse(response, question);
      if (!isValid) continue;

      // Process response based on type
      const processedResponse: ProcessedResponse = {
        questionId: response.questionId,
        questionType: question.type,
        value: response.value,
        normalizedValue: this.normalizeResponseValue(response.value, question),
        sentiment: question.type === 'text' ? await this.analyzeSentiment(response.value as string) : null,
        processedAt: new Date()
      };

      processed.push(processedResponse);
    }

    return processed;
  }

  private async analyzeFeedbackBias(
    responses: ProcessedResponse[],
    survey: FeedbackSurvey
  ): Promise<FeedbackBiasAnalysis> {
    // Check for bias indicators in responses
    const biasIndicators: BiasIndicator[] = [];

    // Check for bias-related responses
    const biasResponse = responses.find(r => r.questionId === 'bias_concerns');
    if (biasResponse && biasResponse.value !== 'No bias experienced') {
      biasIndicators.push({
        type: 'reported_bias',
        severity: 'high',
        description: `Candidate reported: ${biasResponse.value}`,
        questionId: 'bias_concerns'
      });
    }

    // Analyze text responses for bias indicators
    const textResponses = responses.filter(r => r.questionType === 'text');
    for (const response of textResponses) {
      const textBias = await this.analyzeTextForBias(response.value as string);
      biasIndicators.push(...textBias);
    }

    // Calculate overall bias risk
    const biasRisk = this.calculateBiasRisk(biasIndicators, responses);

    return {
      biasRisk,
      biasIndicators,
      requiresReview: biasRisk > 0.3,
      analysisTimestamp: new Date()
    };
  }

  private calculateSatisfactionMetrics(feedbackData: FeedbackSubmission[]): SatisfactionMetrics {
    const ratings = feedbackData.flatMap(submission => 
      submission.responses.filter(r => r.questionType === 'rating')
    );

    const overallRatings = ratings.filter(r => r.questionId === 'overall_experience');
    const fairnessRatings = ratings.filter(r => r.questionId === 'process_fairness');

    return {
      overallSatisfaction: this.calculateAverageRating(overallRatings),
      processFairness: this.calculateAverageRating(fairnessRatings),
      responseCount: feedbackData.length,
      satisfactionTrend: this.calculateTrend(overallRatings),
      fairnessTrend: this.calculateTrend(fairnessRatings)
    };
  }

  private identifyImprovementAreas(feedbackData: FeedbackSubmission[]): ImprovementArea[] {
    // Analyze low-scoring areas and common complaints
    const areas: ImprovementArea[] = [];

    // Find questions with low average scores
    const questionScores = new Map<string, number[]>();
    
    feedbackData.forEach(submission => {
      submission.responses.forEach(response => {
        if (response.questionType === 'rating') {
          if (!questionScores.has(response.questionId)) {
            questionScores.set(response.questionId, []);
          }
          questionScores.get(response.questionId)!.push(response.normalizedValue);
        }
      });
    });

    questionScores.forEach((scores, questionId) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore < 3.0) { // Below average
        areas.push({
          area: questionId,
          averageScore: avgScore,
          priority: avgScore < 2.5 ? 'high' : 'medium',
          affectedResponses: scores.length,
          suggestions: this.generateImprovementSuggestions(questionId, avgScore)
        });
      }
    });

    return areas.sort((a, b) => a.averageScore - b.averageScore);
  }

  // Additional helper methods would be implemented here...
  // Due to length constraints, providing key placeholder implementations

  private async storeSurvey(survey: FeedbackSurvey): Promise<void> {
    // Store in database
  }

  private async sendSurveyInvitation(survey: FeedbackSurvey): Promise<void> {
    // Send email invitation
  }

  private async getSurvey(surveyId: string): Promise<FeedbackSurvey | null> {
    // Retrieve from database
    return null;
  }

  private async storeSubmission(submission: FeedbackSubmission): Promise<void> {
    // Store in database
  }

  private async updateSurveyStatus(surveyId: string, status: string): Promise<void> {
    // Update database
  }

  private async triggerFeedbackAnalysis(submission: FeedbackSubmission): Promise<void> {
    // Trigger analysis pipeline
  }

  private validateResponse(response: FeedbackResponse, question: SurveyQuestion): boolean {
    return true; // Simplified validation
  }

  private normalizeResponseValue(value: any, question: SurveyQuestion): number {
    if (question.type === 'rating' && question.scale) {
      return (value - question.scale.min) / (question.scale.max - question.scale.min);
    }
    return 0;
  }

  private async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    // Implement sentiment analysis
    return { score: 0, label: 'neutral' };
  }

  private async analyzeTextForBias(text: string): Promise<BiasIndicator[]> {
    // Implement bias detection in text
    return [];
  }

  private calculateBiasRisk(indicators: BiasIndicator[], responses: ProcessedResponse[]): number {
    return indicators.length > 0 ? 0.5 : 0.1;
  }

  private calculateAverageRating(ratings: ProcessedResponse[]): number {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r.normalizedValue, 0) / ratings.length;
  }

  private calculateTrend(ratings: ProcessedResponse[]): 'improving' | 'declining' | 'stable' {
    return 'stable'; // Simplified trend calculation
  }

  private generateImprovementSuggestions(questionId: string, score: number): string[] {
    return [`Improve ${questionId} (current score: ${score.toFixed(1)})`];
  }

  private async getFeedbackData(timeRange: TimeRange, filters: FeedbackFilters): Promise<FeedbackSubmission[]> {
    return []; // Would query database
  }

  private calculateResponseRate(data: FeedbackSubmission[], timeRange: TimeRange): number {
    return 0.75; // Placeholder
  }

  private async analyzeBiasPatterns(data: FeedbackSubmission[]): Promise<BiasPattern[]> {
    return []; // Would implement bias pattern analysis
  }

  private generateRecommendations(
    satisfaction: SatisfactionMetrics,
    improvements: ImprovementArea[],
    biasPatterns: BiasPattern[]
  ): string[] {
    return ['Improve interview process based on feedback'];
  }
}

// Supporting interfaces

export type SurveyType = 'post_interview' | 'post_rejection' | 'post_offer' | 'general';
export type TimeRange = '7d' | '30d' | '90d' | '1y';

export interface FeedbackSurvey {
  surveyId: string;
  candidateId: string;
  interviewId: string;
  surveyType: SurveyType;
  questions: SurveyQuestion[];
  anonymousToken: string;
  status: 'active' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  responses: ProcessedResponse[];
  isAnonymous: boolean;
  metadata: {
    version: string;
    language: string;
  };
}

export interface SurveyQuestion {
  questionId: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'yes_no';
  text: string;
  required: boolean;
  scale?: { min: number; max: number; labels?: string[] };
  options?: string[];
  maxLength?: number;
}

export interface CustomQuestion {
  type: 'rating' | 'text' | 'multiple_choice' | 'yes_no';
  text: string;
  required: boolean;
  scale?: { min: number; max: number };
  options?: string[];
}

export interface FeedbackResponse {
  questionId: string;
  value: string | number | boolean;
}

export interface ProcessedResponse {
  questionId: string;
  questionType: string;
  value: any;
  normalizedValue: number;
  sentiment: SentimentAnalysis | null;
  processedAt: Date;
}

export interface FeedbackSubmission {
  submissionId: string;
  surveyId: string;
  candidateId: string;
  interviewId: string;
  responses: ProcessedResponse[];
  biasAnalysis: FeedbackBiasAnalysis;
  submittedAt: Date;
  isAnonymous: boolean;
  ipAddress: string | null;
  metadata: {
    userAgent: string;
    submissionVersion: string;
  };
}

export interface FeedbackBiasAnalysis {
  biasRisk: number;
  biasIndicators: BiasIndicator[];
  requiresReview: boolean;
  analysisTimestamp: Date;
}

export interface BiasIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  questionId?: string;
}

export interface SentimentAnalysis {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
}

export interface FeedbackFilters {
  surveyType?: SurveyType;
  interviewType?: string;
  department?: string;
  biasReported?: boolean;
}

export interface FeedbackAnalysis {
  analysisId: string;
  timeRange: TimeRange;
  filters: FeedbackFilters;
  satisfactionMetrics: SatisfactionMetrics;
  improvementAreas: ImprovementArea[];
  biasPatterns: BiasPattern[];
  recommendations: string[];
  totalResponses: number;
  responseRate: number;
  generatedAt: Date;
}

export interface SatisfactionMetrics {
  overallSatisfaction: number;
  processFairness: number;
  responseCount: number;
  satisfactionTrend: 'improving' | 'declining' | 'stable';
  fairnessTrend: 'improving' | 'declining' | 'stable';
}

export interface ImprovementArea {
  area: string;
  averageScore: number;
  priority: 'high' | 'medium' | 'low';
  affectedResponses: number;
  suggestions: string[];
}

export interface BiasPattern {
  type: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedGroups: string[];
}

export default FeedbackCollectionService;