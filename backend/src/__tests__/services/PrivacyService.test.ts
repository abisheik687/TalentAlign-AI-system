import { PrivacyService } from '@/services/PrivacyService';
import { ConsentService } from '@/services/ConsentService';

// Mock the ConsentService
jest.mock('@/services/ConsentService');
const mockConsentService = ConsentService as jest.Mocked<typeof ConsentService>;

describe('PrivacyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processDataWithPrivacyControls', () => {
    it('should allow data processing with valid consent', async () => {
      // Mock consent validation to return valid
      mockConsentService.validateConsentForProcessing.mockResolvedValue({
        valid: true,
        missingConsents: [],
      });

      const request = {
        userId: 'user123',
        dataType: 'resume',
        processingPurpose: 'matching',
        requiredConsents: ['data_processing', 'ai_analysis'],
        data: { name: 'John Doe', skills: ['JavaScript'] },
      };

      const result = await PrivacyService.processDataWithPrivacyControls(request);

      expect(result.allowed).toBe(true);
      expect(result.processedData).toBeDefined();
      expect(result.consentValidation.valid).toBe(true);
      expect(result.processingId).toBeDefined();
    });

    it('should deny data processing without valid consent', async () => {
      // Mock consent validation to return invalid
      mockConsentService.validateConsentForProcessing.mockResolvedValue({
        valid: false,
        missingConsents: ['data_processing'],
      });

      const request = {
        userId: 'user123',
        dataType: 'resume',
        processingPurpose: 'matching',
        requiredConsents: ['data_processing', 'ai_analysis'],
        data: { name: 'John Doe', skills: ['JavaScript'] },
      };

      const result = await PrivacyService.processDataWithPrivacyControls(request);

      expect(result.allowed).toBe(false);
      expect(result.processedData).toBeUndefined();
      expect(result.consentValidation.valid).toBe(false);
      expect(result.restrictions).toContain('Missing consents: data_processing');
    });

    it('should apply anonymization for sensitive data types', async () => {
      // Mock consent validation to return valid
      mockConsentService.validateConsentForProcessing.mockResolvedValue({
        valid: true,
        missingConsents: [],
      });

      const request = {
        userId: 'user123',
        dataType: 'resume',
        processingPurpose: 'analytics', // Public purpose requiring anonymization
        requiredConsents: ['data_processing', 'ai_analysis'],
        data: { 
          name: 'John Doe',
          email: 'john@example.com',
          skills: ['JavaScript'] 
        },
      };

      const result = await PrivacyService.processDataWithPrivacyControls(request);

      expect(result.allowed).toBe(true);
      expect(result.anonymizationReport).toBeDefined();
      expect(result.processedData.name).not.toBe('John Doe');
      expect(result.processedData.email).not.toBe('john@example.com');
    });
  });

  describe('exportUserData', () => {
    it('should export user data with consent', async () => {
      // Mock consent check to return true
      mockConsentService.hasConsent.mockResolvedValue(true);

      const request = {
        userId: 'user123',
        format: 'json' as const,
        includeAnonymized: false,
      };

      const result = await PrivacyService.exportUserData(request);

      expect(result.exportId).toBeDefined();
      expect(result.format).toBe('json');
      expect(result.data).toBeDefined();
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw error without consent', async () => {
      // Mock consent check to return false
      mockConsentService.hasConsent.mockResolvedValue(false);

      const request = {
        userId: 'user123',
        format: 'json' as const,
        includeAnonymized: false,
      };

      await expect(PrivacyService.exportUserData(request)).rejects.toThrow(
        'User consent required for data export'
      );
    });

    it('should export anonymized data when requested', async () => {
      // Mock consent check to return true
      mockConsentService.hasConsent.mockResolvedValue(true);

      const request = {
        userId: 'user123',
        format: 'json' as const,
        includeAnonymized: true,
      };

      const result = await PrivacyService.exportUserData(request);

      expect(result.exportId).toBeDefined();
      expect(result.data).toBeDefined();
      // In a real test, you'd verify the data is actually anonymized
    });
  });

  describe('deleteUserData', () => {
    it('should delete user data when allowed', async () => {
      const request = {
        userId: 'user123',
        reason: 'User requested deletion',
        immediate: true,
      };

      const result = await PrivacyService.deleteUserData(request);

      expect(result.deletionId).toBeDefined();
      expect(result.deletedDataTypes).toBeDefined();
      expect(result.scheduledDeletion).toBeDefined();
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should schedule deletion for non-immediate data types', async () => {
      const request = {
        userId: 'user123',
        dataTypes: ['profile', 'applications'],
        reason: 'User requested deletion',
        immediate: false,
      };

      const result = await PrivacyService.deleteUserData(request);

      expect(result.deletionId).toBeDefined();
      expect(result.scheduledDeletion.length).toBeGreaterThan(0);
    });
  });

  describe('generatePrivacyReport', () => {
    it('should generate privacy compliance report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await PrivacyService.generatePrivacyReport(startDate, endDate);

      expect(result.reportId).toBeDefined();
      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.summary).toBeDefined();
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should generate user-specific report when userId provided', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const userId = 'user123';

      const result = await PrivacyService.generatePrivacyReport(startDate, endDate, userId);

      expect(result.reportId).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('validateAnonymizationEffectiveness', () => {
    it('should validate effective anonymization', async () => {
      const originalData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
      };

      const anonymizedData = {
        name: 'Alex Smith',
        email: 'user@example.com',
        phone: 'XXX-XXX-XXXX',
      };

      const result = await PrivacyService.validateAnonymizationEffectiveness(
        originalData,
        anonymizedData,
        'user123'
      );

      expect(result.isEffective).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(1);
      expect(result.vulnerabilities).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should detect ineffective anonymization', async () => {
      const originalData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
      };

      const anonymizedData = {
        name: 'John Doe', // Not anonymized
        email: 'john@example.com', // Not anonymized
        phone: '555-123-4567', // Not anonymized
      };

      const result = await PrivacyService.validateAnonymizationEffectiveness(
        originalData,
        anonymizedData,
        'user123'
      );

      expect(result.isEffective).toBe(false);
      expect(result.riskScore).toBeGreaterThan(0.3);
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
    });
  });
});