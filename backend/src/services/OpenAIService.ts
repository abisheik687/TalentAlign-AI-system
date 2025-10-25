import OpenAI from 'openai';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import crypto from 'crypto';

/**
 * OpenAI API Integration Service
 * Provides AI-powered resume analysis and content processing
 * Requirements: 1.1, 9.4
 */
export class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI;
  private fallbackService: FallbackNLPService;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 3
    });
    this.fallbackService = new FallbackNLPService();
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Analyze resume content using OpenAI
   */
  async analyzeResumeContent(
    resumeText: string,
    jobRequirements?: any
  ): Promise<ResumeAnalysis> {
    try {
      const analysisId = crypto.randomUUID();
      const startTime = Date.now();

      logger.info('Starting OpenAI resume analysis', {
        analysisId,
        textLength: resumeText.length
      });

      // Check cache first
      const cacheKey = this.generateCacheKey('resume_analysis', resumeText);
      const cached = await this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }

      // Prepare analysis prompt
      const prompt = this.buildResumeAnalysisPrompt(resumeText, jobRequirements);

      // Call OpenAI API with fallback
      const analysis = await this.callWithFallback(
        () => this.performOpenAIAnalysis(prompt),
        () => this.fallbackService.analyzeResume(resumeText)
      );

      // Process and validate results
      const processedAnalysis = this.processAnalysisResults(analysis, resumeText);

      const result: ResumeAnalysis = {
        analysisId,
        summary: processedAnalysis.summary,
        skills: processedAnalysis.skills,
        experience: processedAnalysis.experience,
        strengths: processedAnalysis.strengths,
        weaknesses: processedAnalysis.weaknesses,
        recommendations: processedAnalysis.recommendations,
        matchScore: jobRequirements ? processedAnalysis.matchScore : null,
        confidence: processedAnalysis.confidence,
        processingTime: Date.now() - startTime,
        analysisMethod: analysis.method,
        createdAt: new Date()
      };

      // Cache result
      await this.cacheResult(cacheKey, result);

      logger.info('Resume analysis completed', {
        analysisId,
        method: result.analysisMethod,
        confidence: result.confidence,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      logger.error('Resume analysis failed:', error);
      throw error;
    }
  }

  /**
   * Summarize resume content
   */
  async summarizeResume(resumeText: string): Promise<ResumeSummary> {
    try {
      const summaryId = crypto.randomUUID();

      logger.info('Generating resume summary', { summaryId });

      const prompt = `
        Please provide a concise professional summary of this resume in 2-3 sentences.
        Focus on key qualifications, experience level, and primary skills.
        Avoid any demographic assumptions or biased language.
        
        Resume content:
        ${resumeText.substring(0, 2000)}...
      `;

      const summary = await this.callWithFallback(
        () => this.generateOpenAISummary(prompt),
        () => this.fallbackService.generateSummary(resumeText)
      );

      return {
        summaryId,
        summary: summary.text,
        keyPoints: summary.keyPoints || [],
        confidence: summary.confidence || 0.8,
        method: summary.method,
        createdAt: new Date()
      };

    } catch (error) {
      logger.error('Resume summarization failed:', error);
      throw error;
    }
  }

  /**
   * Extract and categorize skills using AI
   */
  async extractSkillsWithAI(resumeText: string): Promise<AISkillsExtraction> {
    try {
      const extractionId = crypto.randomUUID();

      logger.info('Extracting skills with AI', { extractionId });

      const prompt = `
        Extract all technical and professional skills from this resume.
        Categorize them as: technical, soft, industry-specific, or language.
        Provide confidence scores (0-1) for each skill.
        Format as JSON with structure: {skills: [{name, category, confidence, proficiencyLevel}]}
        
        Resume content:
        ${resumeText.substring(0, 3000)}...
      `;

      const extraction = await this.callWithFallback(
        () => this.performOpenAISkillsExtraction(prompt),
        () => this.fallbackService.extractSkills(resumeText)
      );

      return {
        extractionId,
        skills: extraction.skills,
        totalSkills: extraction.skills.length,
        averageConfidence: extraction.skills.reduce((sum, skill) => sum + skill.confidence, 0) / extraction.skills.length,
        method: extraction.method,
        createdAt: new Date()
      };

    } catch (error) {
      logger.error('AI skills extraction failed:', error);
      throw error;
    }
  }

  // Private methods

  private buildResumeAnalysisPrompt(resumeText: string, jobRequirements?: any): string {
    let prompt = `
      Analyze this resume and provide a comprehensive assessment.
      Focus on professional qualifications and avoid any demographic assumptions.
      
      Please provide:
      1. Professional summary (2-3 sentences)
      2. Key skills with proficiency estimates
      3. Experience analysis
      4. Strengths and areas for improvement
      5. Professional recommendations
    `;

    if (jobRequirements) {
      prompt += `
      
      Job Requirements for Matching:
      ${JSON.stringify(jobRequirements, null, 2)}
      
      Also provide a match score (0-100) and specific alignment analysis.
      `;
    }

    prompt += `
      
      Resume Content:
      ${resumeText.substring(0, 4000)}...
      
      Respond in JSON format with clear structure.
    `;

    return prompt;
  }

  private async performOpenAIAnalysis(prompt: string): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR analyst specializing in resume evaluation. Provide objective, bias-free analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return {
        content: JSON.parse(content),
        method: 'openai',
        usage: completion.usage
      };

    } catch (error) {
      logger.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  private async generateOpenAISummary(prompt: string): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Generate concise, professional resume summaries without demographic assumptions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      });

      return {
        text: completion.choices[0]?.message?.content || '',
        method: 'openai',
        confidence: 0.9
      };

    } catch (error) {
      logger.error('OpenAI summary generation failed:', error);
      throw error;
    }
  }

  private async performOpenAISkillsExtraction(prompt: string): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Extract skills from resumes with high accuracy and confidence scoring.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      });

      const content = completion.choices[0]?.message?.content;
      const parsed = JSON.parse(content || '{"skills": []}');

      return {
        skills: parsed.skills || [],
        method: 'openai'
      };

    } catch (error) {
      logger.error('OpenAI skills extraction failed:', error);
      throw error;
    }
  }

  private async callWithFallback<T>(
    primaryCall: () => Promise<T>,
    fallbackCall: () => Promise<T>
  ): Promise<T> {
    try {
      return await primaryCall();
    } catch (error) {
      logger.warn('Primary API call failed, using fallback', { error: error.message });
      return await fallbackCall();
    }
  }

  private processAnalysisResults(analysis: any, originalText: string): any {
    // Process and validate OpenAI results
    return {
      summary: analysis.content?.summary || 'Professional with relevant experience',
      skills: analysis.content?.skills || [],
      experience: analysis.content?.experience || 'Multiple years of experience',
      strengths: analysis.content?.strengths || [],
      weaknesses: analysis.content?.weaknesses || [],
      recommendations: analysis.content?.recommendations || [],
      matchScore: analysis.content?.matchScore || null,
      confidence: 0.8
    };
  }

  // Cache methods

  private generateCacheKey(operation: string, content: string): string {
    const contentHash = crypto.createHash('md5').update(content).digest('hex');
    return `openai:${operation}:${contentHash}`;
  }

  private async getCachedResult(cacheKey: string): Promise<any> {
    try {
      const cached = await CacheService.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  private async cacheResult(cacheKey: string, result: any): Promise<void> {
    try {
      await CacheService.set(cacheKey, JSON.stringify(result), 60 * 60 * 24); // 24 hours
    } catch (error) {
      logger.error('Failed to cache result:', error);
    }
  }
}

// Fallback NLP Service
class FallbackNLPService {
  async analyzeResume(resumeText: string): Promise<any> {
    // Fallback analysis using rule-based methods
    return {
      content: {
        summary: 'Professional candidate with relevant background',
        skills: this.extractSkillsRuleBased(resumeText),
        experience: 'Multiple years of professional experience',
        strengths: ['Technical skills', 'Professional experience'],
        weaknesses: ['Limited information available'],
        recommendations: ['Consider additional skills assessment']
      },
      method: 'fallback'
    };
  }

  async generateSummary(resumeText: string): Promise<any> {
    return {
      text: 'Experienced professional with relevant qualifications',
      method: 'fallback',
      confidence: 0.6
    };
  }

  async extractSkills(resumeText: string): Promise<any> {
    return {
      skills: this.extractSkillsRuleBased(resumeText),
      method: 'fallback'
    };
  }

  private extractSkillsRuleBased(text: string): any[] {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js',
      'SQL', 'MongoDB', 'AWS', 'Docker', 'Git'
    ];

    return commonSkills
      .filter(skill => new RegExp(`\\b${skill}\\b`, 'i').test(text))
      .map(skill => ({
        name: skill,
        category: 'technical',
        confidence: 0.7,
        proficiencyLevel: 70
      }));
  }
}

// Supporting interfaces

export interface ResumeAnalysis {
  analysisId: string;
  summary: string;
  skills: any[];
  experience: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  matchScore: number | null;
  confidence: number;
  processingTime: number;
  analysisMethod: string;
  createdAt: Date;
}

export interface ResumeSummary {
  summaryId: string;
  summary: string;
  keyPoints: string[];
  confidence: number;
  method: string;
  createdAt: Date;
}

export interface AISkillsExtraction {
  extractionId: string;
  skills: any[];
  totalSkills: number;
  averageConfidence: number;
  method: string;
  createdAt: Date;
}

export default OpenAIService;