import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import { FairnessMetricsService } from '@/services/FairnessMetricsService';
import { BiasMonitoringService } from '@/services/BiasMonitoringService';
import crypto from 'crypto';

/**
 * Job Description Bias Detection Service
 * Analyzes job postings for biased language and discriminatory content
 * Requirements: 1.5, 4.1
 */
export class JobBiasDetectionService {
  private static instance: JobBiasDetectionService;
  private fairnessMetrics: FairnessMetricsService;
  private biasMonitoring: BiasMonitoringService;
  private biasTermsDatabase: BiasTermsDatabase;

  private constructor() {
    this.fairnessMetrics = FairnessMetricsService.getInstance();
    this.biasMonitoring = BiasMonitoringService.getInstance();
    this.biasTermsDatabase = new BiasTermsDatabase();
  }

  static getInstance(): JobBiasDetectionService {
    if (!JobBiasDetectionService.instance) {
      JobBiasDetectionService.instance = new JobBiasDetectionService();
    }
    return JobBiasDetectionService.instance;
  }

  /**
   * Analyze job description for bias
   */
  async analyzeJobDescription(jobDescription: JobDescriptionInput): Promise<BiasAnalysisResult> {
    try {
      const analysisId = crypto.randomUUID();
      const startTime = Date.now();

      logger.info('Starting job description bias analysis', {
        analysisId,
        jobId: jobDescription.jobId,
        contentLength: jobDescription.content.length
      });

      // Check cache first
      const cacheKey = this.generateCacheKey(jobDescription);
      const cached = await this.getCachedAnalysis(cacheKey);
      if (cached) {
        logger.info('Returning cached bias analysis', { analysisId, jobId: jobDescription.jobId });
        return cached;
      }

      // Perform comprehensive bias analysis
      const biasAnalysis = await this.performBiasAnalysis(jobDescription);

      // Generate improvement suggestions
      const suggestions = await this.generateImprovementSuggestions(biasAnalysis);

      // Calculate overall bias score
      const overallBiasScore = this.calculateOverallBiasScore(biasAnalysis);

      // Determine compliance status
      const complianceStatus = this.determineComplianceStatus(overallBiasScore, biasAnalysis);

      const result: BiasAnalysisResult = {
        analysisId,
        jobId: jobDescription.jobId,
        overallBiasScore,
        complianceStatus,
        biasCategories: biasAnalysis,
        flaggedTerms: this.extractFlaggedTerms(biasAnalysis),
        suggestions,
        processingTime: Date.now() - startTime,
        analysisTimestamp: new Date(),
        metadata: {
          contentLength: jobDescription.content.length,
          language: jobDescription.language || 'en',
          analysisVersion: '1.0'
        }
      };

      // Cache the result
      await this.cacheAnalysis(cacheKey, result);

      // Monitor for bias violations
      if (overallBiasScore > 0.3) {
        await this.biasMonitoring.monitorProcess(
          jobDescription.jobId,
          'job_posting_analysis',
          { jobDescription, biasAnalysis: result }
        );
      }

      logger.info('Job description bias analysis completed', {
        analysisId,
        jobId: jobDescription.jobId,
        overallBiasScore,
        complianceStatus,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      logger.error('Job description bias analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get real-time bias score for job description content
   */
  async getRealTimeBiasScore(content: string): Promise<RealTimeBiasScore> {
    try {
      // Quick analysis for real-time feedback
      const quickAnalysis = await this.performQuickBiasCheck(content);
      
      return {
        overallScore: quickAnalysis.overallScore,
        categoryScores: quickAnalysis.categoryScores,
        immediateFlags: quickAnalysis.immediateFlags,
        confidence: quickAnalysis.confidence,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Real-time bias score calculation failed:', error);
      throw error;
    }
  }

  /**
   * Suggest alternative language for biased terms
   */
  async suggestAlternatives(flaggedTerms: FlaggedTerm[]): Promise<LanguageSuggestion[]> {
    try {
      const suggestions: LanguageSuggestion[] = [];

      for (const term of flaggedTerms) {
        const alternatives = await this.biasTermsDatabase.getAlternatives(
          term.term,
          term.category,
          term.context
        );

        suggestions.push({
          originalTerm: term.term,
          category: term.category,
          severity: term.severity,
          alternatives: alternatives.map(alt => ({
            suggestion: alt.text,
            explanation: alt.explanation,
            confidence: alt.confidence
          })),
          context: term.context,
          position: term.position
        });
      }

      return suggestions;

    } catch (error) {
      logger.error('Language suggestion generation failed:', error);
      throw error;
    }
  }

  // Private methods for bias analysis

  private async performBiasAnalysis(jobDescription: JobDescriptionInput): Promise<BiasCategory[]> {
    const categories: BiasCategory[] = [];

    // Gender bias analysis
    const genderBias = await this.analyzeGenderBias(jobDescription.content);
    categories.push(genderBias);

    // Age bias analysis
    const ageBias = await this.analyzeAgeBias(jobDescription.content);
    categories.push(ageBias);

    // Racial/ethnic bias analysis
    const racialBias = await this.analyzeRacialBias(jobDescription.content);
    categories.push(racialBias);

    // Language complexity bias
    const languageBias = await this.analyzeLanguageComplexity(jobDescription.content);
    categories.push(languageBias);

    return categories;
  }

  private async analyzeGenderBias(content: string): Promise<BiasCategory> {
    const genderBiasTerms = await this.biasTermsDatabase.getTermsByCategory('gender');
    const flaggedTerms: FlaggedTerm[] = [];
    let totalScore = 0;

    for (const term of genderBiasTerms) {
      const matches = this.findTermMatches(content, term);
      for (const match of matches) {
        flaggedTerms.push({
          term: match.text,
          category: 'gender',
          severity: term.severity,
          position: match.position,
          context: this.extractContext(content, match.position),
          explanation: term.explanation,
          confidence: match.confidence
        });
        totalScore += this.getSeverityScore(term.severity);
      }
    }

    // Additional gender-specific analysis
    const genderPronouns = this.analyzeGenderPronouns(content);
    flaggedTerms.push(...genderPronouns);

    return {
      category: 'gender',
      score: Math.min(1.0, totalScore / 10), // Normalize to 0-1
      flaggedTerms,
      description: 'Analysis of gender-biased language and assumptions',
      severity: this.calculateCategorySeverity(flaggedTerms),
      recommendations: this.generateGenderBiasRecommendations(flaggedTerms)
    };
  }

  private async analyzeAgeBias(content: string): Promise<BiasCategory> {
    const ageBiasTerms = await this.biasTermsDatabase.getTermsByCategory('age');
    const flaggedTerms: FlaggedTerm[] = [];
    let totalScore = 0;

    for (const term of ageBiasTerms) {
      const matches = this.findTermMatches(content, term);
      for (const match of matches) {
        flaggedTerms.push({
          term: match.text,
          category: 'age',
          severity: term.severity,
          position: match.position,
          context: this.extractContext(content, match.position),
          explanation: term.explanation,
          confidence: match.confidence
        });
        totalScore += this.getSeverityScore(term.severity);
      }
    }

    return {
      category: 'age',
      score: Math.min(1.0, totalScore / 10),
      flaggedTerms,
      description: 'Analysis of age-related bias and discriminatory language',
      severity: this.calculateCategorySeverity(flaggedTerms),
      recommendations: this.generateAgeBiasRecommendations(flaggedTerms)
    };
  }

  private async analyzeRacialBias(content: string): Promise<BiasCategory> {
    const racialBiasTerms = await this.biasTermsDatabase.getTermsByCategory('racial');
    const flaggedTerms: FlaggedTerm[] = [];
    let totalScore = 0;

    for (const term of racialBiasTerms) {
      const matches = this.findTermMatches(content, term);
      for (const match of matches) {
        flaggedTerms.push({
          term: match.text,
          category: 'racial',
          severity: term.severity,
          position: match.position,
          context: this.extractContext(content, match.position),
          explanation: term.explanation,
          confidence: match.confidence
        });
        totalScore += this.getSeverityScore(term.severity);
      }
    }

    return {
      category: 'racial',
      score: Math.min(1.0, totalScore / 10),
      flaggedTerms,
      description: 'Analysis of racial, ethnic, and cultural bias',
      severity: this.calculateCategorySeverity(flaggedTerms),
      recommendations: this.generateRacialBiasRecommendations(flaggedTerms)
    };
  }

  private async analyzeLanguageComplexity(content: string): Promise<BiasCategory> {
    const complexityAnalysis = this.calculateLanguageComplexity(content);
    const flaggedTerms: FlaggedTerm[] = [];

    // Check for overly complex language
    if (complexityAnalysis.readabilityScore < 60) {
      flaggedTerms.push({
        term: 'Complex Language',
        category: 'language_complexity',
        severity: 'medium',
        position: 0,
        context: 'Overall job description',
        explanation: 'Job description uses overly complex language that may exclude candidates',
        confidence: 0.8
      });
    }

    return {
      category: 'language_complexity',
      score: Math.max(0, (100 - complexityAnalysis.readabilityScore) / 100),
      flaggedTerms,
      description: 'Analysis of language complexity and accessibility',
      severity: this.calculateCategorySeverity(flaggedTerms),
      recommendations: this.generateLanguageComplexityRecommendations(complexityAnalysis)
    };
  }

  // Helper methods

  private analyzeGenderPronouns(content: string): FlaggedTerm[] {
    const genderPronouns = ['he', 'him', 'his', 'she', 'her', 'hers'];
    const flaggedTerms: FlaggedTerm[] = [];

    for (const pronoun of genderPronouns) {
      const regex = new RegExp(`\\b${pronoun}\\b`, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        flaggedTerms.push({
          term: match[0],
          category: 'gender',
          severity: 'medium',
          position: match.index,
          context: this.extractContext(content, match.index),
          explanation: 'Gender-specific pronouns may exclude candidates',
          confidence: 0.9
        });
      }
    }

    return flaggedTerms;
  }

  private findTermMatches(content: string, term: BiasTermDefinition): TermMatch[] {
    const matches: TermMatch[] = [];
    const regex = new RegExp(`\\b${term.pattern}\\b`, 'gi');
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        text: match[0],
        position: match.index,
        confidence: term.confidence || 0.8
      });
    }

    return matches;
  }

  private extractContext(content: string, position: number, contextLength = 50): string {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(content.length, position + contextLength);
    return content.substring(start, end);
  }

  private getSeverityScore(severity: string): number {
    const scores = {
      'low': 1,
      'medium': 3,
      'high': 5,
      'critical': 10
    };
    return scores[severity as keyof typeof scores] || 1;
  }

  private calculateCategorySeverity(flaggedTerms: FlaggedTerm[]): string {
    if (flaggedTerms.length === 0) return 'none';
    
    const severityScores = flaggedTerms.map(term => this.getSeverityScore(term.severity));
    const maxScore = Math.max(...severityScores);
    
    if (maxScore >= 10) return 'critical';
    if (maxScore >= 5) return 'high';
    if (maxScore >= 3) return 'medium';
    return 'low';
  }

  private calculateLanguageComplexity(content: string): LanguageComplexityAnalysis {
    // Simplified readability calculation
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);
    
    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    const readabilityScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    return {
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      avgSentenceLength,
      avgSyllablesPerWord,
      jargonDensity: 0,
      jargonTerms: []
    };
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .replace(/a$/, '')
      .length || 1;
  }

  private async performQuickBiasCheck(content: string): Promise<QuickBiasAnalysis> {
    const quickTerms = await this.biasTermsDatabase.getHighPriorityTerms();
    const categoryScores: Record<string, number> = {};
    const immediateFlags: FlaggedTerm[] = [];

    for (const term of quickTerms) {
      const matches = this.findTermMatches(content, term);
      if (matches.length > 0) {
        if (!categoryScores[term.category]) {
          categoryScores[term.category] = 0;
        }
        categoryScores[term.category] += matches.length * this.getSeverityScore(term.severity);

        if (term.severity === 'high' || term.severity === 'critical') {
          for (const match of matches) {
            immediateFlags.push({
              term: match.text,
              category: term.category,
              severity: term.severity,
              position: match.position,
              context: this.extractContext(content, match.position, 30),
              explanation: term.explanation,
              confidence: match.confidence
            });
          }
        }
      }
    }

    const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / 50;

    return {
      overallScore: Math.min(1.0, overallScore),
      categoryScores,
      immediateFlags,
      confidence: immediateFlags.length > 0 ? 0.9 : 0.7
    };
  }

  private calculateOverallBiasScore(biasCategories: BiasCategory[]): number {
    if (biasCategories.length === 0) return 0;

    const weightedScores = biasCategories.map(category => {
      const weight = this.getCategoryWeight(category.category);
      return category.score * weight;
    });

    return weightedScores.reduce((sum, score) => sum + score, 0) / biasCategories.length;
  }

  private getCategoryWeight(category: string): number {
    const weights = {
      'gender': 1.0,
      'racial': 1.0,
      'age': 0.9,
      'language_complexity': 0.6
    };
    return weights[category as keyof typeof weights] || 0.5;
  }

  private determineComplianceStatus(
    overallBiasScore: number,
    biasCategories: BiasCategory[]
  ): 'compliant' | 'needs_review' | 'non_compliant' {
    if (overallBiasScore < 0.2) return 'compliant';
    if (overallBiasScore < 0.5) return 'needs_review';
    return 'non_compliant';
  }

  private extractFlaggedTerms(biasCategories: BiasCategory[]): FlaggedTerm[] {
    return biasCategories.reduce((allTerms, category) => {
      return [...allTerms, ...category.flaggedTerms];
    }, [] as FlaggedTerm[]);
  }

  private async generateImprovementSuggestions(biasCategories: BiasCategory[]): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];

    for (const category of biasCategories) {
      if (category.flaggedTerms.length > 0) {
        for (const term of category.flaggedTerms) {
          const alternatives = await this.biasTermsDatabase.getAlternatives(
            term.term,
            term.category,
            term.context
          );

          if (alternatives.length > 0) {
            suggestions.push({
              type: 'term_replacement',
              priority: this.getSeverityScore(term.severity),
              originalText: term.term,
              suggestedText: alternatives[0].text,
              explanation: alternatives[0].explanation,
              category: term.category,
              position: term.position,
              confidence: alternatives[0].confidence
            });
          }
        }
      }
    }

    return suggestions;
  }

  // Recommendation generation methods

  private generateGenderBiasRecommendations(flaggedTerms: FlaggedTerm[]): string[] {
    const recommendations = [];
    
    if (flaggedTerms.some(term => term.term.match(/\b(he|him|his|she|her|hers)\b/i))) {
      recommendations.push('Use gender-neutral pronouns like "they/them" or rephrase to avoid pronouns');
    }
    
    return recommendations;
  }

  private generateAgeBiasRecommendations(flaggedTerms: FlaggedTerm[]): string[] {
    const recommendations = [];
    
    if (flaggedTerms.some(term => term.term.toLowerCase().includes('young'))) {
      recommendations.push('Focus on skills and qualifications rather than age-related descriptors');
    }
    
    return recommendations;
  }

  private generateRacialBiasRecommendations(flaggedTerms: FlaggedTerm[]): string[] {
    const recommendations = [];
    
    if (flaggedTerms.some(term => term.term.toLowerCase().includes('cultural fit'))) {
      recommendations.push('Define specific behavioral competencies instead of using "cultural fit"');
    }
    
    return recommendations;
  }

  private generateLanguageComplexityRecommendations(analysis: LanguageComplexityAnalysis): string[] {
    const recommendations = [];
    
    if (analysis.readabilityScore < 60) {
      recommendations.push('Simplify language and use shorter sentences for better accessibility');
    }
    
    return recommendations;
  }

  // Cache methods

  private generateCacheKey(jobDescription: JobDescriptionInput): string {
    const contentHash = crypto.createHash('md5').update(jobDescription.content).digest('hex');
    return `job_bias_analysis:${contentHash}`;
  }

  private async getCachedAnalysis(cacheKey: string): Promise<BiasAnalysisResult | null> {
    try {
      const cached = await CacheService.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache retrieval failed:', error);
      return null;
    }
  }

  private async cacheAnalysis(cacheKey: string, result: BiasAnalysisResult): Promise<void> {
    try {
      await CacheService.set(cacheKey, JSON.stringify(result), 60 * 60 * 24); // 24 hours
    } catch (error) {
      logger.error('Cache storage failed:', error);
    }
  }
}

// Bias Terms Database Class
class BiasTermsDatabase {
  private terms: Map<string, BiasTermDefinition[]> = new Map();

  constructor() {
    this.initializeTerms();
  }

  private initializeTerms(): void {
    // Gender bias terms
    this.terms.set('gender', [
      {
        pattern: 'guys',
        category: 'gender',
        severity: 'medium',
        explanation: 'Use gender-neutral terms like "team" or "everyone"',
        confidence: 0.9
      },
      {
        pattern: 'manpower',
        category: 'gender',
        severity: 'medium',
        explanation: 'Use "workforce" or "staff" instead',
        confidence: 0.9
      }
    ]);

    // Age bias terms
    this.terms.set('age', [
      {
        pattern: 'young',
        category: 'age',
        severity: 'medium',
        explanation: 'May discourage older candidates',
        confidence: 0.7
      },
      {
        pattern: 'energetic',
        category: 'age',
        severity: 'medium',
        explanation: 'Focus on specific skills instead',
        confidence: 0.6
      }
    ]);

    // Racial bias terms
    this.terms.set('racial', [
      {
        pattern: 'cultural fit',
        category: 'racial',
        severity: 'high',
        explanation: 'Define specific behavioral competencies instead',
        confidence: 0.8
      }
    ]);
  }

  async getTermsByCategory(category: string): Promise<BiasTermDefinition[]> {
    return this.terms.get(category) || [];
  }

  async getHighPriorityTerms(): Promise<BiasTermDefinition[]> {
    const allTerms: BiasTermDefinition[] = [];
    for (const categoryTerms of this.terms.values()) {
      allTerms.push(...categoryTerms.filter(term => 
        term.severity === 'high' || term.severity === 'critical'
      ));
    }
    return allTerms;
  }

  async getAlternatives(term: string, category: string, context: string): Promise<AlternativeText[]> {
    const alternatives: Record<string, AlternativeText[]> = {
      'guys': [
        {
          text: 'team',
          explanation: 'Gender-neutral term for a group of people',
          confidence: 0.9
        }
      ],
      'manpower': [
        {
          text: 'workforce',
          explanation: 'Gender-neutral term for human resources',
          confidence: 0.9
        }
      ]
    };

    return alternatives[term.toLowerCase()] || [];
  }
}

// Supporting interfaces and types

export interface JobDescriptionInput {
  jobId: string;
  content: string;
  title: string;
  language?: string;
}

export interface BiasAnalysisResult {
  analysisId: string;
  jobId: string;
  overallBiasScore: number;
  complianceStatus: 'compliant' | 'needs_review' | 'non_compliant';
  biasCategories: BiasCategory[];
  flaggedTerms: FlaggedTerm[];
  suggestions: ImprovementSuggestion[];
  processingTime: number;
  analysisTimestamp: Date;
  metadata: {
    contentLength: number;
    language: string;
    analysisVersion: string;
  };
}

export interface BiasCategory {
  category: string;
  score: number;
  flaggedTerms: FlaggedTerm[];
  description: string;
  severity: string;
  recommendations: string[];
}

export interface FlaggedTerm {
  term: string;
  category: string;
  severity: string;
  position: number;
  context: string;
  explanation: string;
  confidence: number;
}

export interface ImprovementSuggestion {
  type: string;
  priority: number;
  originalText: string;
  suggestedText: string;
  explanation: string;
  category: string;
  position: number;
  confidence: number;
}

export interface RealTimeBiasScore {
  overallScore: number;
  categoryScores: Record<string, number>;
  immediateFlags: FlaggedTerm[];
  confidence: number;
  timestamp: Date;
}

export interface LanguageSuggestion {
  originalTerm: string;
  category: string;
  severity: string;
  alternatives: Array<{
    suggestion: string;
    explanation: string;
    confidence: number;
  }>;
  context: string;
  position: number;
}

// Additional supporting interfaces

interface BiasTermDefinition {
  pattern: string;
  category: string;
  severity: string;
  explanation: string;
  confidence: number;
}

interface TermMatch {
  text: string;
  position: number;
  confidence: number;
}

interface AlternativeText {
  text: string;
  explanation: string;
  confidence: number;
}

interface LanguageComplexityAnalysis {
  readabilityScore: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  jargonDensity: number;
  jargonTerms: string[];
}

interface QuickBiasAnalysis {
  overallScore: number;
  categoryScores: Record<string, number>;
  immediateFlags: FlaggedTerm[];
  confidence: number;
}

export default JobBiasDetectionService;