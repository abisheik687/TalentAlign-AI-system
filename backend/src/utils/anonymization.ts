import crypto from 'crypto';
import { 
  AnonymizationConfig, 
  AnonymizationTechnique,
  DataCategory 
} from '../../../shared/src/types/ethics';
import { logger } from '@/utils/logger';

/**
 * Data Anonymization Utility Class
 * Implements various anonymization techniques to protect candidate privacy
 */
export class AnonymizationService {
  private static instance: AnonymizationService;
  private config: AnonymizationConfig;
  private saltRounds = 12;
  private encryptionKey: string;

  private constructor() {
    this.config = this.loadAnonymizationConfig();
    this.encryptionKey = process.env.ANONYMIZATION_KEY || this.generateEncryptionKey();
  }

  public static getInstance(): AnonymizationService {
    if (!AnonymizationService.instance) {
      AnonymizationService.instance = new AnonymizationService();
    }
    return AnonymizationService.instance;
  }

  private loadAnonymizationConfig(): AnonymizationConfig {
    return {
      enabled: process.env.ANONYMIZATION_ENABLED !== 'false',
      techniques: [
        AnonymizationTechnique.PSEUDONYMIZATION,
        AnonymizationTechnique.GENERALIZATION,
        AnonymizationTechnique.SUPPRESSION,
      ],
      preserveUtility: true,
      privacyLevel: (process.env.PRIVACY_LEVEL as any) || 'standard',
      reversibilityProhibited: true,
      validationRequired: true,
    };
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Anonymize candidate data based on configuration
   */
  public async anonymizeCandidate(candidateData: Record<string, any>): Promise<Record<string, any>> {
    if (!this.config.enabled) {
      return candidateData;
    }

    try {
      const anonymized = { ...candidateData };

      // Remove or anonymize personal identifiers
      anonymized.id = this.pseudonymize(candidateData.id || candidateData._id);
      delete anonymized._id;
      delete anonymized.email;
      delete anonymized.phone;
      delete anonymized.address;
      delete anonymized.socialSecurityNumber;
      delete anonymized.dateOfBirth;

      // Anonymize name fields
      if (candidateData.firstName || candidateData.lastName) {
        delete anonymized.firstName;
        delete anonymized.lastName;
        delete anonymized.fullName;
        // Keep only initials if needed for utility
        if (this.config.preserveUtility) {
          anonymized.initials = this.generateInitials(candidateData.firstName, candidateData.lastName);
        }
      }

      // Generalize location data
      if (candidateData.location) {
        anonymized.location = this.generalizeLocation(candidateData.location);
      }

      // Anonymize work history
      if (candidateData.experience) {
        anonymized.experience = await this.anonymizeExperience(candidateData.experience);
      }

      // Anonymize education
      if (candidateData.education) {
        anonymized.education = await this.anonymizeEducation(candidateData.education);
      }

      // Preserve skills and qualifications (non-identifying)
      if (candidateData.skills) {
        anonymized.skills = candidateData.skills;
      }

      // Add anonymization metadata
      anonymized.anonymizedAt = new Date();
      anonymized.anonymizationVersion = '1.0';
      anonymized.privacyLevel = this.config.privacyLevel;

      // Validate anonymization
      if (this.config.validationRequired) {
        const isValid = await this.validateAnonymization(anonymized);
        if (!isValid) {
          throw new Error('Anonymization validation failed');
        }
      }

      logger.info('Candidate data anonymized successfully', {
        originalFields: Object.keys(candidateData).length,
        anonymizedFields: Object.keys(anonymized).length,
        privacyLevel: this.config.privacyLevel,
      });

      return anonymized;
    } catch (error) {
      logger.error('Error anonymizing candidate data:', error);
      throw new Error('Failed to anonymize candidate data');
    }
  }

  /**
   * Pseudonymize identifiers using one-way hashing
   */
  private pseudonymize(identifier: string): string {
    if (!identifier) return '';
    
    const hash = crypto.createHash('sha256');
    hash.update(identifier + this.encryptionKey);
    return `anon_${hash.digest('hex').substring(0, 16)}`;
  }

  /**
   * Generate initials from first and last name
   */
  private generateInitials(firstName?: string, lastName?: string): string {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`.trim() || 'XX';
  }

  /**
   * Generalize location to broader geographic area
   */
  private generalizeLocation(location: string): string {
    // Extract state/region and country, remove specific city/address
    const locationParts = location.split(',').map(part => part.trim());
    
    if (locationParts.length >= 2) {
      // Return state/region and country only
      return locationParts.slice(-2).join(', ');
    }
    
    return locationParts[0] || 'Unknown Location';
  }

  /**
   * Anonymize work experience data
   */
  private async anonymizeExperience(experience: any[]): Promise<any[]> {
    return experience.map(exp => ({
      title: exp.title, // Keep job title as it's relevant for matching
      company: this.anonymizeCompany(exp.company),
      duration: exp.duration,
      startDate: this.generalizeDate(exp.startDate),
      endDate: this.generalizeDate(exp.endDate),
      responsibilities: exp.responsibilities,
      skills: exp.skills,
      industryType: exp.industryType,
      companySizeCategory: this.categorizeCompanySize(exp.companySize),
    }));
  }

  /**
   * Anonymize company names
   */
  private anonymizeCompany(companyName: string): string {
    if (!companyName) return 'Unknown Company';
    
    // Create a consistent pseudonym for the company
    const hash = crypto.createHash('md5');
    hash.update(companyName + this.encryptionKey);
    const hashValue = hash.digest('hex').substring(0, 8);
    
    return `Company_${hashValue}`;
  }

  /**
   * Generalize dates to year/quarter only
   */
  private generalizeDate(date: string | Date): string {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const quarter = Math.ceil((dateObj.getMonth() + 1) / 3);
    
    return `Q${quarter} ${year}`;
  }

  /**
   * Categorize company size
   */
  private categorizeCompanySize(size: number | string): string {
    if (typeof size === 'string') return size;
    if (!size) return 'unknown';
    
    if (size < 50) return 'startup';
    if (size < 200) return 'small';
    if (size < 1000) return 'medium';
    if (size < 5000) return 'large';
    return 'enterprise';
  }

  /**
   * Anonymize education data
   */
  private async anonymizeEducation(education: any[]): Promise<any[]> {
    return education.map(edu => ({
      degree: edu.degree,
      field: edu.field,
      institution: this.anonymizeInstitution(edu.institution),
      graduationYear: edu.graduationYear,
      gpa: this.generalizeGPA(edu.gpa),
      honors: edu.honors,
      relevantCoursework: edu.relevantCoursework,
    }));
  }

  /**
   * Anonymize institution names
   */
  private anonymizeInstitution(institutionName: string): string {
    if (!institutionName) return 'Unknown Institution';
    
    // Create a consistent pseudonym for the institution
    const hash = crypto.createHash('md5');
    hash.update(institutionName + this.encryptionKey);
    const hashValue = hash.digest('hex').substring(0, 8);
    
    return `Institution_${hashValue}`;
  }

  /**
   * Generalize GPA to ranges
   */
  private generalizeGPA(gpa: number): string {
    if (!gpa) return 'Not Provided';
    
    if (gpa >= 3.7) return 'High (3.7+)';
    if (gpa >= 3.3) return 'Above Average (3.3-3.7)';
    if (gpa >= 3.0) return 'Average (3.0-3.3)';
    return 'Below Average (<3.0)';
  }

  /**
   * Validate that anonymization was successful
   */
  private async validateAnonymization(anonymizedData: Record<string, any>): Promise<boolean> {
    try {
      // Check for common PII patterns
      const dataString = JSON.stringify(anonymizedData);
      
      const piiPatterns = [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN
        /\b\d{3}-\d{3}-\d{4}\b/, // Phone
        /\b\d{1,5}\s\w+\s(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/i, // Address
      ];

      const hasPII = piiPatterns.some(pattern => pattern.test(dataString));
      
      if (hasPII) {
        logger.warn('PII detected in anonymized data');
        return false;
      }

      // Check for required anonymization fields
      const requiredFields = ['anonymizedAt', 'anonymizationVersion', 'privacyLevel'];
      const hasRequiredFields = requiredFields.every(field => anonymizedData[field]);
      
      if (!hasRequiredFields) {
        logger.warn('Missing required anonymization metadata');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating anonymization:', error);
      return false;
    }
  }

  /**
   * Check if data contains personal information
   */
  public async containsPersonalInfo(data: Record<string, any>): Promise<boolean> {
    const dataString = JSON.stringify(data);
    
    const personalInfoPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Full names
      /\b\d{1,5}\s\w+\s(Street|St|Avenue|Ave|Road|Rd)\b/i, // Address
    ];

    return personalInfoPatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Get anonymization configuration
   */
  public getConfig(): AnonymizationConfig {
    return { ...this.config };
  }

  /**
   * Update anonymization configuration
   */
  public updateConfig(updates: Partial<AnonymizationConfig>): void {
    this.config = { ...this.config, ...updates };
    logger.info('Anonymization configuration updated:', updates);
  }
}