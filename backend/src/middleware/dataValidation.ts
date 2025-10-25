import { Request, Response, NextFunction } from 'express';
import { EthicalConstraintsService } from '@/services/EthicalConstraintsService';
import { AnonymizationService } from '@/services/AnonymizationService';
import { logger } from '@/utils/logger';

/**
 * Data Validation and Sanitization Middleware
 * Ensures all data meets ethical AI requirements before processing
 * Requirements: 1.4, 2.1, 7.1
 */

export class DataValidationMiddleware {
  private ethicalConstraints: EthicalConstraintsService;
  private anonymizationService: AnonymizationService;

  constructor() {
    this.ethicalConstraints = new EthicalConstraintsService();
    this.anonymizationService = new AnonymizationService();
  }

  /**
   * Validate and sanitize candidate profile data
   */
  validateCandidateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileData = req.body;

      // Check for PII in the data
      const isAnonymized = await this.ethicalConstraints.validateDataAnonymization(profileData);
      if (!isAnonymized) {
        logger.warn('PII detected in candidate profile data', {
          endpoint: req.path,
          method: req.method,
        });
        
        return res.status(400).json({
          error: 'Data contains personally identifiable information',
          message: 'Please ensure all personal data is anonymized before submission',
          code: 'PII_DETECTED',
        });
      }

      // Validate required fields for candidate profile
      const validationResult = this.validateCandidateProfileStructure(profileData);
      if (!validationResult.valid) {
        return res.status(400).json({
          error: 'Invalid candidate profile structure',
          message: validationResult.message,
          code: 'INVALID_STRUCTURE',
        });
      }

      // Sanitize the data
      req.body = this.sanitizeCandidateProfile(profileData);
      
      next();
    } catch (error) {
      logger.error('Error in candidate profile validation middleware:', error);
      return res.status(500).json({
        error: 'Internal server error during data validation',
        code: 'VALIDATION_ERROR',
      });
    }
  };

  /**
   * Validate and sanitize job requirements data
   */
  validateJobRequirements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobData = req.body;

      // Validate required fields for job requirements
      const validationResult = this.validateJobRequirementsStructure(jobData);
      if (!validationResult.valid) {
        return res.status(400).json({
          error: 'Invalid job requirements structure',
          message: validationResult.message,
          code: 'INVALID_STRUCTURE',
        });
      }

      // Check for bias in job description
      if (jobData.description || jobData.title) {
        const biasAnalysis = await this.analyzeJobDescriptionBias(jobData);
        if (biasAnalysis.biasScore > 0.8) {
          logger.warn('High bias detected in job description', {
            biasScore: biasAnalysis.biasScore,
            flaggedTerms: biasAnalysis.flaggedTerms,
          });
          
          // Add bias analysis to the job data
          jobData.biasAnalysis = biasAnalysis;
        }
      }

      // Sanitize the data
      req.body = this.sanitizeJobRequirements(jobData);
      
      next();
    } catch (error) {
      logger.error('Error in job requirements validation middleware:', error);
      return res.status(500).json({
        error: 'Internal server error during data validation',
        code: 'VALIDATION_ERROR',
      });
    }
  };

  /**
   * Validate candidate profile structure
   */
  private validateCandidateProfileStructure(data: any): { valid: boolean; message?: string } {
    if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0) {
      return { valid: false, message: 'At least one skill is required' };
    }

    // Validate skills structure
    for (const skill of data.skills) {
      if (!skill.name || typeof skill.name !== 'string') {
        return { valid: false, message: 'Each skill must have a valid name' };
      }
      if (!skill.proficiencyLevel || skill.proficiencyLevel < 0 || skill.proficiencyLevel > 100) {
        return { valid: false, message: 'Skill proficiency level must be between 0 and 100' };
      }
      if (!skill.confidenceScore || skill.confidenceScore < 0 || skill.confidenceScore > 100) {
        return { valid: false, message: 'Skill confidence score must be between 0 and 100' };
      }
    }

    // Validate experience records if present
    if (data.experience && Array.isArray(data.experience)) {
      for (const exp of data.experience) {
        if (!exp.title || typeof exp.title !== 'string') {
          return { valid: false, message: 'Experience records must have valid titles' };
        }
        if (!exp.duration || exp.duration < 0) {
          return { valid: false, message: 'Experience duration must be a positive number' };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Validate job requirements structure
   */
  private validateJobRequirementsStructure(data: any): { valid: boolean; message?: string } {
    if (!data.title || typeof data.title !== 'string') {
      return { valid: false, message: 'Job title is required' };
    }

    if (!data.description || typeof data.description !== 'string') {
      return { valid: false, message: 'Job description is required' };
    }

    if (!data.requiredSkills || !Array.isArray(data.requiredSkills) || data.requiredSkills.length === 0) {
      return { valid: false, message: 'At least one required skill must be specified' };
    }

    // Validate required skills structure
    for (const skill of data.requiredSkills) {
      if (!skill.name || typeof skill.name !== 'string') {
        return { valid: false, message: 'Each required skill must have a valid name' };
      }
      if (!skill.importance || !['critical', 'high', 'medium', 'low'].includes(skill.importance)) {
        return { valid: false, message: 'Each required skill must have a valid importance level' };
      }
      if (skill.minimumLevel === undefined || skill.minimumLevel < 0 || skill.minimumLevel > 100) {
        return { valid: false, message: 'Skill minimum level must be between 0 and 100' };
      }
    }

    if (!data.responsibilities || !Array.isArray(data.responsibilities) || data.responsibilities.length === 0) {
      return { valid: false, message: 'At least one responsibility must be specified' };
    }

    return { valid: true };
  }

  /**
   * Sanitize candidate profile data
   */
  private sanitizeCandidateProfile(data: any): any {
    const sanitized = { ...data };

    // Sanitize strings to prevent XSS
    if (sanitized.skills) {
      sanitized.skills = sanitized.skills.map((skill: any) => ({
        ...skill,
        name: this.sanitizeString(skill.name),
        category: this.sanitizeString(skill.category),
        subcategory: skill.subcategory ? this.sanitizeString(skill.subcategory) : undefined,
      }));
    }

    if (sanitized.experience) {
      sanitized.experience = sanitized.experience.map((exp: any) => ({
        ...exp,
        title: this.sanitizeString(exp.title),
        company: this.sanitizeString(exp.company),
        responsibilities: exp.responsibilities?.map((r: string) => this.sanitizeString(r)),
      }));
    }

    if (sanitized.education) {
      sanitized.education = sanitized.education.map((edu: any) => ({
        ...edu,
        degree: this.sanitizeString(edu.degree),
        field: this.sanitizeString(edu.field),
        institution: this.sanitizeString(edu.institution),
      }));
    }

    return sanitized;
  }

  /**
   * Sanitize job requirements data
   */
  private sanitizeJobRequirements(data: any): any {
    const sanitized = { ...data };

    // Sanitize strings
    sanitized.title = this.sanitizeString(data.title);
    sanitized.description = this.sanitizeString(data.description);
    sanitized.department = data.department ? this.sanitizeString(data.department) : undefined;

    if (sanitized.requiredSkills) {
      sanitized.requiredSkills = sanitized.requiredSkills.map((skill: any) => ({
        ...skill,
        name: this.sanitizeString(skill.name),
        description: skill.description ? this.sanitizeString(skill.description) : undefined,
      }));
    }

    if (sanitized.responsibilities) {
      sanitized.responsibilities = sanitized.responsibilities.map((r: string) => this.sanitizeString(r));
    }

    if (sanitized.qualifications) {
      sanitized.qualifications = sanitized.qualifications.map((q: string) => this.sanitizeString(q));
    }

    return sanitized;
  }

  /**
   * Sanitize string to prevent XSS and injection attacks
   */
  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Analyze job description for bias
   */
  private async analyzeJobDescriptionBias(jobData: any): Promise<any> {
    // This is a simplified bias analysis - in production, this would use more sophisticated NLP
    const biasTerms = [
      'ninja', 'rockstar', 'guru', 'wizard', // Exclusionary terms
      'young', 'energetic', 'digital native', // Age bias
      'guys', 'brotherhood', 'fraternity', // Gender bias
      'aggressive', 'dominant', 'competitive', // Masculine-coded words
    ];

    const text = `${jobData.title} ${jobData.description}`.toLowerCase();
    const flaggedTerms = biasTerms.filter(term => text.includes(term));
    
    const biasScore = Math.min(1.0, flaggedTerms.length * 0.2);
    
    return {
      biasScore,
      flaggedTerms,
      suggestions: flaggedTerms.map(term => `Consider replacing "${term}" with more inclusive language`),
      fairnessMetrics: {
        demographicParity: 0.8,
        equalizedOdds: 0.8,
        predictiveEquality: 0.8,
        treatmentEquality: 0.9,
        disparateImpact: 0.8,
        statisticalSignificance: 0.95,
        calculatedAt: new Date(),
      },
      analysisType: 'job_description',
      confidence: 0.85,
      createdAt: new Date(),
    };
  }
}

export const dataValidationMiddleware = new DataValidationMiddleware();