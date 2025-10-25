import crypto from 'crypto';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';

/**
 * Data Anonymization Service
 * Implements PII detection, removal, and irreversible anonymization techniques
 * Requirements: 1.4, 4.1, 7.1, 10.3
 */
export class AnonymizationService {
  private static instance: AnonymizationService;
  private piiPatterns: Map<string, RegExp[]>;
  private anonymizationKey: string;

  private constructor() {
    this.anonymizationKey = process.env.ANONYMIZATION_KEY || this.generateAnonymizationKey();
    this.piiPatterns = new Map();
    this.initializePIIPatterns();
  }

  static getInstance(): AnonymizationService {
    if (!AnonymizationService.instance) {
      AnonymizationService.instance = new AnonymizationService();
    }
    return AnonymizationService.instance;
  }

  /**
   * Initialize PII detection patterns
   */
  private initializePIIPatterns(): void {
    // Email patterns
    this.piiPatterns.set('email', [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    ]);

    // Phone number patterns
    this.piiPatterns.set('phone', [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
      /\b\+\d{1,3}[-.\s]?\d{1,14}\b/g
    ]);

    // Social Security Number patterns
    this.piiPatterns.set('ssn', [
      /\b\d{3}-\d{2}-\d{4}\b/g,
      /\b\d{9}\b/g
    ]);

    // Credit card patterns
    this.piiPatterns.set('creditCard', [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
    ]);

    // Address patterns
    this.piiPatterns.set('address', [
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi
    ]);

    // Date of birth patterns
    this.piiPatterns.set('dateOfBirth', [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi
    ]);

    // IP Address patterns
    this.piiPatterns.set('ipAddress', [
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
    ]);

    // Name patterns (basic)
    this.piiPatterns.set('name', [
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g
    ]);
  }

  /**
   * Generate a secure anonymization key
   */
  private generateAnonymizationKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Detect PII in text content
   */
  detectPII(content: string): PIIDetectionResult {
    const detectedPII: PIIMatch[] = [];
    let cleanedContent = content;

    for (const [type, patterns] of this.piiPatterns.entries()) {
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          detectedPII.push({
            type,
            value: match[0],
            position: match.index,
            length: match[0].length,
            confidence: this.calculateConfidence(type, match[0])
          });
        }
      }
    }

    return {
      originalContent: content,
      detectedPII,
      riskLevel: this.calculateRiskLevel(detectedPII),
      recommendations: this.generateRecommendations(detectedPII)
    };
  }

  /**
   * Remove PII from content
   */
  removePII(content: string, options: PIIRemovalOptions = {}): PIIRemovalResult {
    const detection = this.detectPII(content);
    let cleanedContent = content;
    const removedItems: PIIMatch[] = [];

    // Sort by position (descending) to avoid index shifting issues
    const sortedPII = detection.detectedPII.sort((a, b) => b.position - a.position);

    for (const pii of sortedPII) {
      if (options.typesToRemove && !options.typesToRemove.includes(pii.type)) {
        continue;
      }

      if (pii.confidence < (options.minConfidence || 0.7)) {
        continue;
      }

      const replacement = options.useTokens 
        ? `[${pii.type.toUpperCase()}_TOKEN]`
        : this.generateReplacement(pii.type, pii.value);

      cleanedContent = cleanedContent.substring(0, pii.position) + 
                      replacement + 
                      cleanedContent.substring(pii.position + pii.length);

      removedItems.push(pii);
    }

    return {
      originalContent: content,
      cleanedContent,
      removedPII: removedItems,
      anonymizationLevel: this.calculateAnonymizationLevel(removedItems),
      metadata: {
        processedAt: new Date(),
        method: 'pattern_based_removal',
        options
      }
    };
  }

  /**
   * Anonymize data using irreversible techniques
   */
  async anonymizeData(data: any, schema: AnonymizationSchema): Promise<AnonymizationResult> {
    try {
      const anonymizationId = crypto.randomUUID();
      const startTime = Date.now();

      logger.info('Starting data anonymization', {
        anonymizationId,
        dataType: typeof data,
        schemaFields: Object.keys(schema.fields || {}).length
      });

      const anonymizedData = await this.processDataRecursively(data, schema);
      
      // Generate anonymization mapping for audit purposes (one-way hash)
      const mapping = this.generateAnonymizationMapping(data, anonymizedData);

      const result: AnonymizationResult = {
        anonymizationId,
        originalData: null, // Never store original data
        anonymizedData,
        schema,
        mapping,
        metadata: {
          processedAt: new Date(),
          processingTime: Date.now() - startTime,
          technique: 'irreversible_anonymization',
          version: '1.0'
        }
      };

      // Store anonymization audit record
      await this.storeAnonymizationAudit(result);

      logger.info('Data anonymization completed', {
        anonymizationId,
        processingTime: result.metadata.processingTime
      });

      return result;

    } catch (error) {
      logger.error('Data anonymization failed:', error);
      throw error;
    }
  }

  /**
   * Process data recursively based on schema
   */
  private async processDataRecursively(data: any, schema: AnonymizationSchema): Promise<any> {
    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.processDataRecursively(item, schema)));
    }

    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const fieldSchema = schema.fields[key];
        
        if (fieldSchema) {
          result[key] = await this.anonymizeField(value, fieldSchema);
        } else if (schema.defaultAction === 'remove') {
          // Skip field
          continue;
        } else if (schema.defaultAction === 'anonymize') {
          result[key] = await this.anonymizeField(value, { technique: 'hash' });
        } else {
          result[key] = value; // Keep as-is
        }
      }
      
      return result;
    }

    return data;
  }

  /**
   * Anonymize individual field based on technique
   */
  private async anonymizeField(value: any, fieldSchema: FieldAnonymization): Promise<any> {
    if (value === null || value === undefined) {
      return value;
    }

    switch (fieldSchema.technique) {
      case 'remove':
        return undefined;

      case 'hash':
        return this.hashValue(value.toString());

      case 'encrypt':
        return this.encryptValue(value.toString());

      case 'tokenize':
        return await this.tokenizeValue(value.toString(), fieldSchema.tokenType);

      case 'generalize':
        return this.generalizeValue(value, fieldSchema.generalizationLevel);

      case 'noise':
        return this.addNoise(value, fieldSchema.noiseLevel);

      case 'mask':
        return this.maskValue(value.toString(), fieldSchema.maskPattern);

      case 'pseudonymize':
        return await this.pseudonymizeValue(value.toString(), fieldSchema.pseudonymType);

      case 'k_anonymity':
        return this.applyKAnonymity(value, fieldSchema.k);

      default:
        return value;
    }
  }

  /**
   * Hash value using SHA-256 with salt
   */
  private hashValue(value: string): string {
    const salt = crypto.createHash('sha256').update(this.anonymizationKey).digest('hex').substring(0, 16);
    return crypto.createHash('sha256').update(value + salt).digest('hex');
  }

  /**
   * Encrypt value using AES-256
   */
  private encryptValue(value: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.anonymizationKey);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Tokenize value with format preservation
   */
  private async tokenizeValue(value: string, tokenType?: string): Promise<string> {
    const tokenKey = `token:${this.hashValue(value)}`;
    
    // Check if token already exists
    const existingToken = await CacheService.get(tokenKey);
    if (existingToken) {
      return existingToken;
    }

    let token: string;
    
    switch (tokenType) {
      case 'email':
        token = `user${crypto.randomBytes(4).toString('hex')}@example.com`;
        break;
      case 'phone':
        token = `555-${crypto.randomInt(100, 999)}-${crypto.randomInt(1000, 9999)}`;
        break;
      case 'name':
        token = `Person${crypto.randomBytes(3).toString('hex')}`;
        break;
      default:
        token = `TOKEN_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    }

    // Store token mapping (for consistency)
    await CacheService.set(tokenKey, token, 60 * 60 * 24 * 365); // 1 year
    
    return token;
  }

  /**
   * Generalize value by reducing precision
   */
  private generalizeValue(value: any, level?: number): any {
    if (typeof value === 'number') {
      const precision = level || 1;
      return Math.round(value / Math.pow(10, precision)) * Math.pow(10, precision);
    }

    if (typeof value === 'string') {
      // For strings, generalize by truncating
      const keepLength = Math.max(1, value.length - (level || 2));
      return value.substring(0, keepLength) + '*'.repeat(value.length - keepLength);
    }

    if (value instanceof Date) {
      // Generalize date to year or month
      const date = new Date(value);
      if (level === 1) {
        return new Date(date.getFullYear(), 0, 1); // Year only
      } else {
        return new Date(date.getFullYear(), date.getMonth(), 1); // Year and month
      }
    }

    return value;
  }

  /**
   * Add statistical noise to numeric values
   */
  private addNoise(value: any, noiseLevel: number = 0.1): any {
    if (typeof value === 'number') {
      const noise = (Math.random() - 0.5) * 2 * noiseLevel * value;
      return Math.round((value + noise) * 100) / 100;
    }
    return value;
  }

  /**
   * Mask value with pattern
   */
  private maskValue(value: string, pattern?: string): string {
    if (!pattern) {
      // Default masking: show first and last character
      if (value.length <= 2) return '*'.repeat(value.length);
      return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
    }

    // Apply custom pattern (e.g., "XXX-XX-XXXX" for SSN)
    let result = '';
    let valueIndex = 0;
    
    for (const char of pattern) {
      if (char === 'X' && valueIndex < value.length) {
        result += value[valueIndex++];
      } else if (char === '*') {
        result += '*';
        valueIndex++;
      } else {
        result += char;
      }
    }
    
    return result;
  }

  /**
   * Create pseudonym for value
   */
  private async pseudonymizeValue(value: string, pseudonymType?: string): Promise<string> {
    const pseudonymKey = `pseudonym:${pseudonymType}:${this.hashValue(value)}`;
    
    const existingPseudonym = await CacheService.get(pseudonymKey);
    if (existingPseudonym) {
      return existingPseudonym;
    }

    let pseudonym: string;
    
    switch (pseudonymType) {
      case 'name':
        pseudonym = this.generatePseudonymName();
        break;
      case 'company':
        pseudonym = this.generatePseudonymCompany();
        break;
      case 'location':
        pseudonym = this.generatePseudonymLocation();
        break;
      default:
        pseudonym = `PSEUDO_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    }

    await CacheService.set(pseudonymKey, pseudonym, 60 * 60 * 24 * 365);
    
    return pseudonym;
  }

  /**
   * Apply k-anonymity by grouping similar values
   */
  private applyKAnonymity(value: any, k: number = 5): any {
    // Simplified k-anonymity implementation
    // In practice, this would require analyzing the entire dataset
    if (typeof value === 'number') {
      const range = Math.pow(10, Math.floor(Math.log10(value)));
      return `${Math.floor(value / range) * range}-${(Math.floor(value / range) + 1) * range}`;
    }
    
    return this.generalizeValue(value, 1);
  }

  /**
   * Generate pseudonym names
   */
  private generatePseudonymName(): string {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  /**
   * Generate pseudonym company names
   */
  private generatePseudonymCompany(): string {
    const prefixes = ['Tech', 'Global', 'Digital', 'Smart', 'Future', 'Advanced', 'Premier', 'Elite'];
    const suffixes = ['Solutions', 'Systems', 'Corp', 'Inc', 'Group', 'Partners', 'Dynamics', 'Innovations'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix} ${suffix}`;
  }

  /**
   * Generate pseudonym locations
   */
  private generatePseudonymLocation(): string {
    const cities = ['Springfield', 'Riverside', 'Franklin', 'Georgetown', 'Clinton', 'Madison', 'Washington', 'Arlington'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  /**
   * Calculate confidence score for PII detection
   */
  private calculateConfidence(type: string, value: string): number {
    // Simplified confidence calculation
    const baseConfidence = {
      'email': 0.9,
      'phone': 0.8,
      'ssn': 0.95,
      'creditCard': 0.9,
      'address': 0.7,
      'dateOfBirth': 0.8,
      'ipAddress': 0.85,
      'name': 0.6
    };

    let confidence = baseConfidence[type as keyof typeof baseConfidence] || 0.5;

    // Adjust based on value characteristics
    if (type === 'email' && value.includes('@') && value.includes('.')) {
      confidence = Math.min(0.95, confidence + 0.1);
    }

    if (type === 'phone' && value.length >= 10) {
      confidence = Math.min(0.9, confidence + 0.1);
    }

    return confidence;
  }

  /**
   * Calculate risk level based on detected PII
   */
  private calculateRiskLevel(detectedPII: PIIMatch[]): 'low' | 'medium' | 'high' | 'critical' {
    if (detectedPII.length === 0) return 'low';

    const highRiskTypes = ['ssn', 'creditCard'];
    const mediumRiskTypes = ['email', 'phone', 'address'];

    const hasHighRisk = detectedPII.some(pii => highRiskTypes.includes(pii.type));
    const hasMediumRisk = detectedPII.some(pii => mediumRiskTypes.includes(pii.type));

    if (hasHighRisk) return 'critical';
    if (hasMediumRisk && detectedPII.length > 3) return 'high';
    if (hasMediumRisk || detectedPII.length > 5) return 'medium';
    
    return 'low';
  }

  /**
   * Generate recommendations for PII handling
   */
  private generateRecommendations(detectedPII: PIIMatch[]): string[] {
    const recommendations: string[] = [];

    if (detectedPII.some(pii => pii.type === 'ssn')) {
      recommendations.push('Remove or encrypt Social Security Numbers immediately');
    }

    if (detectedPII.some(pii => pii.type === 'creditCard')) {
      recommendations.push('Remove credit card information - this should never be stored');
    }

    if (detectedPII.some(pii => pii.type === 'email')) {
      recommendations.push('Consider tokenizing email addresses for privacy');
    }

    if (detectedPII.length > 5) {
      recommendations.push('High amount of PII detected - consider comprehensive anonymization');
    }

    if (recommendations.length === 0) {
      recommendations.push('Review detected PII and apply appropriate anonymization techniques');
    }

    return recommendations;
  }

  /**
   * Generate replacement text for PII
   */
  private generateReplacement(type: string, value: string): string {
    switch (type) {
      case 'email':
        return 'user@example.com';
      case 'phone':
        return '555-0000';
      case 'ssn':
        return 'XXX-XX-XXXX';
      case 'creditCard':
        return 'XXXX-XXXX-XXXX-XXXX';
      case 'address':
        return '[ADDRESS REMOVED]';
      case 'name':
        return '[NAME REMOVED]';
      default:
        return `[${type.toUpperCase()} REMOVED]`;
    }
  }

  /**
   * Calculate anonymization level
   */
  private calculateAnonymizationLevel(removedPII: PIIMatch[]): number {
    if (removedPII.length === 0) return 0;
    
    const weights = {
      'ssn': 10,
      'creditCard': 10,
      'email': 5,
      'phone': 5,
      'address': 3,
      'name': 2,
      'dateOfBirth': 4,
      'ipAddress': 2
    };

    const totalWeight = removedPII.reduce((sum, pii) => {
      return sum + (weights[pii.type as keyof typeof weights] || 1);
    }, 0);

    return Math.min(100, totalWeight * 2); // Scale to 0-100
  }

  /**
   * Generate anonymization mapping for audit
   */
  private generateAnonymizationMapping(original: any, anonymized: any): AnonymizationMapping {
    return {
      mappingId: crypto.randomUUID(),
      originalHash: this.hashValue(JSON.stringify(original)),
      anonymizedHash: this.hashValue(JSON.stringify(anonymized)),
      fieldMappings: this.generateFieldMappings(original, anonymized),
      createdAt: new Date()
    };
  }

  /**
   * Generate field-level mappings
   */
  private generateFieldMappings(original: any, anonymized: any): FieldMapping[] {
    const mappings: FieldMapping[] = [];
    
    if (typeof original === 'object' && typeof anonymized === 'object') {
      for (const key in original) {
        if (original[key] !== anonymized[key]) {
          mappings.push({
            field: key,
            originalHash: this.hashValue(String(original[key])),
            anonymizedValue: anonymized[key],
            technique: 'unknown' // Would be tracked during processing
          });
        }
      }
    }
    
    return mappings;
  }

  /**
   * Store anonymization audit record
   */
  private async storeAnonymizationAudit(result: AnonymizationResult): Promise<void> {
    try {
      const auditRecord = {
        anonymizationId: result.anonymizationId,
        processedAt: result.metadata.processedAt,
        processingTime: result.metadata.processingTime,
        technique: result.metadata.technique,
        schemaUsed: result.schema,
        mappingId: result.mapping.mappingId
      };

      // Store in database (implementation would depend on your audit model)
      const AnonymizationAudit = require('@/models/AnonymizationAudit').default;
      await AnonymizationAudit.create(auditRecord);

    } catch (error) {
      logger.error('Failed to store anonymization audit:', error);
    }
  }

  /**
   * Validate anonymization effectiveness
   */
  async validateAnonymization(
    originalData: any,
    anonymizedData: any,
    schema: AnonymizationSchema
  ): Promise<ValidationResult> {
    try {
      const validationId = crypto.randomUUID();
      
      // Check for data leakage
      const leakageCheck = this.checkDataLeakage(originalData, anonymizedData);
      
      // Validate schema compliance
      const schemaCompliance = this.validateSchemaCompliance(anonymizedData, schema);
      
      // Check utility preservation
      const utilityScore = this.calculateUtilityScore(originalData, anonymizedData);
      
      // Privacy risk assessment
      const privacyRisk = this.assessPrivacyRisk(anonymizedData);

      return {
        validationId,
        isValid: leakageCheck.isValid && schemaCompliance.isValid,
        leakageCheck,
        schemaCompliance,
        utilityScore,
        privacyRisk,
        recommendations: this.generateValidationRecommendations(leakageCheck, schemaCompliance, utilityScore, privacyRisk),
        validatedAt: new Date()
      };

    } catch (error) {
      logger.error('Anonymization validation failed:', error);
      throw error;
    }
  }

  /**
   * Check for potential data leakage
   */
  private checkDataLeakage(original: any, anonymized: any): LeakageCheck {
    const issues: string[] = [];
    let isValid = true;

    // Convert to strings for comparison
    const originalStr = JSON.stringify(original).toLowerCase();
    const anonymizedStr = JSON.stringify(anonymized).toLowerCase();

    // Check for direct value leakage
    if (originalStr === anonymizedStr) {
      issues.push('No anonymization applied - data is identical');
      isValid = false;
    }

    // Check for PII patterns in anonymized data
    const piiDetection = this.detectPII(anonymizedStr);
    if (piiDetection.detectedPII.length > 0) {
      issues.push(`PII still detected in anonymized data: ${piiDetection.detectedPII.map(p => p.type).join(', ')}`);
      isValid = false;
    }

    return {
      isValid,
      issues,
      riskLevel: isValid ? 'low' : 'high'
    };
  }

  /**
   * Validate schema compliance
   */
  private validateSchemaCompliance(data: any, schema: AnonymizationSchema): SchemaCompliance {
    const issues: string[] = [];
    let isValid = true;

    // This would implement comprehensive schema validation
    // For now, basic structure check
    if (typeof data !== 'object') {
      issues.push('Anonymized data structure does not match expected format');
      isValid = false;
    }

    return {
      isValid,
      issues,
      complianceScore: isValid ? 1.0 : 0.5
    };
  }

  /**
   * Calculate utility preservation score
   */
  private calculateUtilityScore(original: any, anonymized: any): number {
    // Simplified utility calculation
    // In practice, this would be domain-specific
    
    if (typeof original !== 'object' || typeof anonymized !== 'object') {
      return 0.5;
    }

    const originalKeys = Object.keys(original);
    const anonymizedKeys = Object.keys(anonymized);
    
    const preservedKeys = anonymizedKeys.filter(key => originalKeys.includes(key));
    const structuralPreservation = preservedKeys.length / originalKeys.length;
    
    return Math.min(1.0, structuralPreservation);
  }

  /**
   * Assess privacy risk of anonymized data
   */
  private assessPrivacyRisk(anonymizedData: any): PrivacyRisk {
    const piiDetection = this.detectPII(JSON.stringify(anonymizedData));
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const riskFactors: string[] = [];

    if (piiDetection.detectedPII.length > 0) {
      riskLevel = 'high';
      riskFactors.push('PII detected in anonymized data');
    }

    // Check for potential re-identification risks
    if (this.hasReidentificationRisk(anonymizedData)) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      riskFactors.push('Potential re-identification risk detected');
    }

    return {
      riskLevel,
      riskFactors,
      riskScore: riskLevel === 'high' ? 0.8 : riskLevel === 'medium' ? 0.5 : 0.2
    };
  }

  /**
   * Check for re-identification risks
   */
  private hasReidentificationRisk(data: any): boolean {
    // Simplified re-identification risk assessment
    // In practice, this would be more sophisticated
    
    if (typeof data !== 'object') return false;
    
    const sensitiveFields = ['age', 'zipcode', 'gender', 'salary', 'department'];
    const presentFields = Object.keys(data).filter(key => 
      sensitiveFields.some(field => key.toLowerCase().includes(field))
    );
    
    // If multiple quasi-identifiers are present, there's re-identification risk
    return presentFields.length >= 3;
  }

  /**
   * Generate validation recommendations
   */
  private generateValidationRecommendations(
    leakageCheck: LeakageCheck,
    schemaCompliance: SchemaCompliance,
    utilityScore: number,
    privacyRisk: PrivacyRisk
  ): string[] {
    const recommendations: string[] = [];

    if (!leakageCheck.isValid) {
      recommendations.push('Address data leakage issues before using anonymized data');
    }

    if (!schemaCompliance.isValid) {
      recommendations.push('Ensure anonymized data complies with defined schema');
    }

    if (utilityScore < 0.7) {
      recommendations.push('Consider adjusting anonymization techniques to preserve more utility');
    }

    if (privacyRisk.riskLevel === 'high') {
      recommendations.push('Apply additional anonymization techniques to reduce privacy risk');
    }

    if (recommendations.length === 0) {
      recommendations.push('Anonymization appears successful - monitor for ongoing compliance');
    }

    return recommendations;
  }
}

// Supporting interfaces and types

export interface PIIMatch {
  type: string;
  value: string;
  position: number;
  length: number;
  confidence: number;
}

export interface PIIDetectionResult {
  originalContent: string;
  detectedPII: PIIMatch[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface PIIRemovalOptions {
  typesToRemove?: string[];
  minConfidence?: number;
  useTokens?: boolean;
}

export interface PIIRemovalResult {
  originalContent: string;
  cleanedContent: string;
  removedPII: PIIMatch[];
  anonymizationLevel: number;
  metadata: {
    processedAt: Date;
    method: string;
    options: PIIRemovalOptions;
  };
}

export interface AnonymizationSchema {
  fields: Record<string, FieldAnonymization>;
  defaultAction: 'keep' | 'remove' | 'anonymize';
}

export interface FieldAnonymization {
  technique: 'remove' | 'hash' | 'encrypt' | 'tokenize' | 'generalize' | 'noise' | 'mask' | 'pseudonymize' | 'k_anonymity';
  tokenType?: string;
  generalizationLevel?: number;
  noiseLevel?: number;
  maskPattern?: string;
  pseudonymType?: string;
  k?: number;
}

export interface AnonymizationResult {
  anonymizationId: string;
  originalData: null; // Never store original
  anonymizedData: any;
  schema: AnonymizationSchema;
  mapping: AnonymizationMapping;
  metadata: {
    processedAt: Date;
    processingTime: number;
    technique: string;
    version: string;
  };
}

export interface AnonymizationMapping {
  mappingId: string;
  originalHash: string;
  anonymizedHash: string;
  fieldMappings: FieldMapping[];
  createdAt: Date;
}

export interface FieldMapping {
  field: string;
  originalHash: string;
  anonymizedValue: any;
  technique: string;
}

export interface ValidationResult {
  validationId: string;
  isValid: boolean;
  leakageCheck: LeakageCheck;
  schemaCompliance: SchemaCompliance;
  utilityScore: number;
  privacyRisk: PrivacyRisk;
  recommendations: string[];
  validatedAt: Date;
}

export interface LeakageCheck {
  isValid: boolean;
  issues: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SchemaCompliance {
  isValid: boolean;
  issues: string[];
  complianceScore: number;
}

export interface PrivacyRisk {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  riskScore: number;
}

export default AnonymizationService;