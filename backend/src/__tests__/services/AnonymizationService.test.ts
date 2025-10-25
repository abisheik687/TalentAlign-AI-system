import { AnonymizationService } from '@/services/AnonymizationService';

describe('AnonymizationService', () => {
  describe('detectAndAnonymizePII', () => {
    it('should detect and anonymize email addresses', async () => {
      const text = 'Contact John Doe at john.doe@example.com for more information.';
      
      const result = await AnonymizationService.detectAndAnonymizePII(text);
      
      expect(result.hasPII).toBe(true);
      expect(result.detectedPII).toHaveLength(1);
      expect(result.detectedPII[0].type).toBe('email');
      expect(result.detectedPII[0].value).toBe('john.doe@example.com');
      expect(result.anonymizedText).not.toContain('john.doe@example.com');
    });

    it('should detect and anonymize phone numbers', async () => {
      const text = 'Call me at (555) 123-4567 or 555-987-6543.';
      
      const result = await AnonymizationService.detectAndAnonymizePII(text);
      
      expect(result.hasPII).toBe(true);
      expect(result.detectedPII.length).toBeGreaterThan(0);
      expect(result.detectedPII.some(pii => pii.type === 'phone')).toBe(true);
      expect(result.anonymizedText).not.toContain('555-123-4567');
    });

    it('should detect and anonymize SSN', async () => {
      const text = 'My SSN is 123-45-6789.';
      
      const result = await AnonymizationService.detectAndAnonymizePII(text);
      
      expect(result.hasPII).toBe(true);
      expect(result.detectedPII).toHaveLength(1);
      expect(result.detectedPII[0].type).toBe('ssn');
      expect(result.detectedPII[0].value).toBe('123-45-6789');
      expect(result.anonymizedText).toContain('XXX-XX-XXXX');
    });

    it('should handle text with no PII', async () => {
      const text = 'This is a normal text without any personal information.';
      
      const result = await AnonymizationService.detectAndAnonymizePII(text);
      
      expect(result.hasPII).toBe(false);
      expect(result.detectedPII).toHaveLength(0);
      expect(result.anonymizedText).toBe(text);
    });

    it('should use consistent mapping when enabled', async () => {
      const text1 = 'Email john.doe@example.com';
      const text2 = 'Contact john.doe@example.com again';
      
      const options = { preserveFormat: true, useConsistentMapping: true };
      
      const result1 = await AnonymizationService.detectAndAnonymizePII(text1, options);
      const result2 = await AnonymizationService.detectAndAnonymizePII(text2, options);
      
      expect(result1.detectedPII[0].replacement).toBe(result2.detectedPII[0].replacement);
    });
  });

  describe('anonymizeObject', () => {
    it('should anonymize object fields based on mapping', async () => {
      const data = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        skills: ['JavaScript', 'Python'],
      };

      const fieldMappings = {
        name: 'name',
        email: 'email',
        phone: 'phone',
        skills: 'skip',
      };

      const result = await AnonymizationService.anonymizeObject(data, fieldMappings);

      expect(result.name).not.toBe('John Doe');
      expect(result.email).not.toBe('john.doe@example.com');
      expect(result.phone).not.toBe('555-123-4567');
      expect(result.skills).toEqual(['JavaScript', 'Python']); // Should be unchanged
    });
  });

  describe('generateIrreversibleHash', () => {
    it('should generate consistent hash for same input', () => {
      const data = 'test@example.com';
      
      const hash1 = AnonymizationService.generateIrreversibleHash(data);
      const hash2 = AnonymizationService.generateIrreversibleHash(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64-character hex string
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = AnonymizationService.generateIrreversibleHash('test1@example.com');
      const hash2 = AnonymizationService.generateIrreversibleHash('test2@example.com');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should use custom salt when provided', () => {
      const data = 'test@example.com';
      const salt1 = 'salt1';
      const salt2 = 'salt2';
      
      const hash1 = AnonymizationService.generateIrreversibleHash(data, salt1);
      const hash2 = AnonymizationService.generateIrreversibleHash(data, salt2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateAnonymization', () => {
    it('should validate successful anonymization', async () => {
      const originalText = 'Contact john.doe@example.com at 555-123-4567';
      const anonymizedText = 'Contact user@example.com at XXX-XXX-XXXX';
      
      const validation = await AnonymizationService.validateAnonymization(
        originalText,
        anonymizedText
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.riskScore).toBeLessThan(0.5);
    });

    it('should detect poor anonymization', async () => {
      const originalText = 'Contact john.doe@example.com at 555-123-4567';
      const anonymizedText = 'Contact john.doe@example.com at 555-123-4567'; // No anonymization
      
      const validation = await AnonymizationService.validateAnonymization(
        originalText,
        anonymizedText
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.riskScore).toBeGreaterThan(0.5);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('generatePseudonym', () => {
    it('should generate consistent pseudonyms for same name', async () => {
      const name = 'John';
      
      const pseudonym1 = await AnonymizationService.generatePseudonym(name, 'first');
      const pseudonym2 = await AnonymizationService.generatePseudonym(name, 'first');
      
      expect(pseudonym1).toBe(pseudonym2);
      expect(pseudonym1).not.toBe(name);
    });

    it('should generate different pseudonyms for different names', async () => {
      const pseudonym1 = await AnonymizationService.generatePseudonym('John', 'first');
      const pseudonym2 = await AnonymizationService.generatePseudonym('Jane', 'first');
      
      expect(pseudonym1).not.toBe(pseudonym2);
    });

    it('should generate different pseudonyms for first and last names', async () => {
      const name = 'Smith';
      
      const firstPseudonym = await AnonymizationService.generatePseudonym(name, 'first');
      const lastPseudonym = await AnonymizationService.generatePseudonym(name, 'last');
      
      expect(firstPseudonym).not.toBe(lastPseudonym);
    });
  });
});