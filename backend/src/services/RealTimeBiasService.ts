import { JobBiasDetectionService } from '@/services/JobBiasDetectionService';
import { FairnessMetricsService } from '@/services/FairnessMetricsService';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import { EventEmitter } from 'events';

/**
 * Real-Time Bias Monitoring and Scoring Service
 * Provides live bias detection and scoring for job descriptions
 * Requirements: 1.5, 4.1
 */
export class RealTimeBiasService extends EventEmitter {
  private static instance: RealTimeBiasService;
  private biasThresholds: BiasThresholds;
  private monitoringActive: boolean = true;

  private constructor() {
    super();
    this.biasThresholds = {
      warning: 0.3,
      alert: 0.6,
      critical: 0.8
    };
  }

  static getInstance(): RealTimeBiasService {
    if (!RealTimeBiasService.instance) {
      RealTimeBiasService.instance = new RealTimeBiasService();
    }
    return RealTimeBiasService.instance;
  }

  /**
   * Analyze job description in real-time as user types
   */
  async analyzeRealTime(
    jobDescription: string,
    jobTitle: string,
    userId: string,
    sessionId: string
  ): Promise<RealTimeBiasResult> {
    try {
      if (!this.monitoringActive) {
        return this.getDisabledResult();
      }

      // Quick pattern-based analysis for real-time feedback
      const quickAnalysis = await this.performQuickBiasCheck(jobDescription, jobTitle);
      
      // Check if we need to trigger alerts
      if (quickAnalysis.biasScore >= this.biasThresholds.alert) {
        await this.triggerBiasAlert(quickAnalysis, userId, sessionId);
      }

      // Emit real-time update
      this.emit('biasUpdate', {
        sessionId,
        userId,
        analysis: quickAnalysis,
        timestamp: new Date()
      });

      return quickAnalysis;
    } catch (error) {
      logger.error('Real-time bias analysis failed:', error);
      return this.getErrorResult();
    }
  }

  /**
   * Get live bias score for job description
   */
  async getLiveBiasScore(
    jobDescription: string,
    jobTitle: string
  ): Promise<LiveBiasScore> {
    try {
      const analysis = await this.performQuickBiasCheck(jobDescription, jobTitle);
      
      return {
        score: analysis.biasScore,
        level: this.getBiasLevel(analysis.biasScore),
        flaggedCount: analysis.flaggedTerms.length,
        topIssues: analysis.flaggedTerms
          .sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity))
          .slice(0, 3)
          .map(term => term.term),
        recommendations: analysis.suggestions.slice(0, 2),
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Live bias score calculation failed:', error);
      return {
        score: 0,
        level: 'unknown',
        flaggedCount: 0,
        topIssues: [],
        recommendations: ['Analysis unavailable'],
        timestamp: new Date()
      };
    }
  }

  /**
   * Perform quick bias check for real-time feedback
   */
  private async performQuickBiasCheck(
    jobDescription: string,
    jobTitle: string
  ): Promise<RealTimeBiasResult> {
    const flaggedTerms: any[] = [];
    let biasScore = 0;

    // Quick pattern matching for common bias indicators
    const quickPatterns = [
      { pattern: /\b(ninja|rockstar|guru|wizard)\b/gi, weight: 0.2, category: 'exclusionary' },
      { pattern: /\b(young|energetic|fresh)\b/gi, weight: 0.3, category: 'age' },
      { pattern: /\b(guys|manpower|aggressive)\b/gi, weight: 0.3, category: 'gender' },
      { pattern: /\b(culture fit|beer|ping pong)\b/gi, weight: 0.2, category: 'cultural' }
    ];

    for (const { pattern, weight, category } of quickPatterns) {
      const matches = jobDescription.match(pattern) || [];
      for (const match of matches) {
        flaggedTerms.push({
          term: match,
          category,
          severity: weight > 0.25 ? 'high' : 'medium',
          position: jobDescription.indexOf(match)
        });
        biasScore += weight;
      }
    }

    // Cap bias score at 1.0
    biasScore = Math.min(1.0, biasScore);

    // Generate quick suggestions
    const suggestions = this.generateQuickSuggestions(flaggedTerms);

    return {
      biasScore,
      level: this.getBiasLevel(biasScore),
      flaggedTerms,
      suggestions,
      isRealTime: true,
      confidence: 0.8, // Lower confidence for quick analysis
      timestamp: new Date()
    };
  }

  /**
   * Generate quick suggestions for flagged terms
   */
  private generateQuickSuggestions(flaggedTerms: any[]): string[] {
    const suggestions: string[] = [];
    const categories = new Set(flaggedTerms.map(term => term.category));

    if (categories.has('exclusionary')) {
      suggestions.push('Replace exclusionary terms with professional alternatives');
    }
    if (categories.has('age')) {
      suggestions.push('Remove age-related language and focus on skills');
    }
    if (categories.has('gender')) {
      suggestions.push('Use gender-neutral language throughout');
    }
    if (categories.has('cultural')) {
      suggestions.push('Focus on job requirements rather than cultural activities');
    }

    return suggestions;
  }

  /**
   * Trigger bias alert when thresholds are exceeded
   */
  private async triggerBiasAlert(
    analysis: RealTimeBiasResult,
    userId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const alertLevel = analysis.biasScore >= this.biasThresholds.critical ? 'critical' :
                        analysis.biasScore >= this.biasThresholds.alert ? 'alert' : 'warning';

      const alert: BiasAlert = {
        alertId: crypto.randomUUID(),
        level: alertLevel,
        biasScore: analysis.biasScore,
        userId,
        sessionId,
        flaggedTerms: analysis.flaggedTerms,
        timestamp: new Date(),
        acknowledged: false
      };

      // Store alert
      await CacheService.set(
        `bias_alert:${alert.alertId}`,
        JSON.stringify(alert),
        24 * 60 * 60 // Keep for 24 hours
      );

      // Emit alert event
      this.emit('biasAlert', alert);

      // Log alert
      logger.warn('Bias alert triggered', {
        alertId: alert.alertId,
        level: alertLevel,
        biasScore: analysis.biasScore,
        userId,
        flaggedTermsCount: analysis.flaggedTerms.length
      });

    } catch (error) {
      logger.error('Failed to trigger bias alert:', error);
    }
  }

  /**
   * Get bias level description
   */
  private getBiasLevel(score: number): string {
    if (score >= this.biasThresholds.critical) return 'critical';
    if (score >= this.biasThresholds.alert) return 'high';
    if (score >= this.biasThresholds.warning) return 'medium';
    return 'low';
  }

  /**
   * Get severity weight for sorting
   */
  private getSeverityWeight(severity: string): number {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[severity as keyof typeof weights] || 1;
  }

  /**
   * Fallback results for error cases
   */
  private getDisabledResult(): RealTimeBiasResult {
    return {
      biasScore: 0,
      level: 'disabled',
      flaggedTerms: [],
      suggestions: ['Real-time bias monitoring is disabled'],
      isRealTime: true,
      confidence: 0,
      timestamp: new Date()
    };
  }

  private getErrorResult(): RealTimeBiasResult {
    return {
      biasScore: 0,
      level: 'error',
      flaggedTerms: [],
      suggestions: ['Bias analysis temporarily unavailable'],
      isRealTime: true,
      confidence: 0,
      timestamp: new Date()
    };
  }

  /**
   * Configuration methods
   */
  setThresholds(thresholds: Partial<BiasThresholds>): void {
    this.biasThresholds = { ...this.biasThresholds, ...thresholds };
    logger.info('Bias thresholds updated', this.biasThresholds);
  }

  enableMonitoring(): void {
    this.monitoringActive = true;
    logger.info('Real-time bias monitoring enabled');
  }

  disableMonitoring(): void {
    this.monitoringActive = false;
    logger.info('Real-time bias monitoring disabled');
  }

  getStatus(): { active: boolean; thresholds: BiasThresholds } {
    return {
      active: this.monitoringActive,
      thresholds: this.biasThresholds
    };
  }
}

// Supporting interfaces
export interface BiasThresholds {
  warning: number;
  alert: number;
  critical: number;
}

export interface RealTimeBiasResult {
  biasScore: number;
  level: string;
  flaggedTerms: any[];
  suggestions: string[];
  isRealTime: boolean;
  confidence: number;
  timestamp: Date;
}

export interface LiveBiasScore {
  score: number;
  level: string;
  flaggedCount: number;
  topIssues: string[];
  recommendations: string[];
  timestamp: Date;
}

export interface BiasAlert {
  alertId: string;
  level: 'warning' | 'alert' | 'critical';
  biasScore: number;
  userId: string;
  sessionId: string;
  flaggedTerms: any[];
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export default RealTimeBiasService;