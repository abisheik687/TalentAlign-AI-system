import { AnonymizationPipelineService } from '@/services/AnonymizationPipelineService';
import { AnonymizationService } from '@/services/AnonymizationService';
import { EthicalConstraintsService } from '@/services/EthicalConstraintsService';
import { CacheService } from '@/config/redis';

// Mock dependencies
jest.mock('@/services/AnonymizationService');
jest.mock('@/services/EthicalConstraintsService');
jest.mock('@/config/redis');

const mockAnonymizationService = AnonymizationService as jest.Mocked<typeof AnonymizationService>;
const mockEthicalConstraints = EthicalConstraintsService as jest.Mocked<typeof EthicalConstraintsService>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('AnonymizationPipelineService', () => {
  let pipelineService: AnonymizationPipelineService;

  beforeEach(() => {
    jest.clearAllMocks();
    pipelineService = new AnonymizationPipelineService();

    // Default mock implementations
    mockAnonymizationService.detectAndAnonymizePII.mockResolvedValue({
      hasPII: true,
      detectedPII: [
        {
          type: 'email',
          value: 'john@example.com',
          start: 0,
          end: 16,
          confidence: 0.95,
          replacement: 'user@example.com'
        }
      ],
      confidence: 0.95,
      anonymizedText: 'Contact: user@example.com'
    });

    mockEthicalConstraints.prototype.validateDataAnonymization = jest.fn().mockResolvedValue(true);
    mockCacheService.set.mockResolvedValue(undefined);
  });

  describe('processData', () => {
    const mockData = {
      name: 'John Doe',
      email: 'john@example.com',
      skills: ['JavaScript', 'React'],
      experience: [
        {
          company: 'Tech Corp',
          title: 'Software Engineer',
          description: 'Developed web applications'
        }
      ]
    };

    it('should successfully process candidate profile data', async () => {
      const result = await pipelineService.processData(
        mockData,
        'candidate_profile',
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.pipelineId).toBeDefined();
      expect(result.anonymizedData).toBeDefined();
      expect(result.piiDetection).toBeDefined();
      expect(result.riskAssessment).toBeDefined();
      expect(result.strategy).toBeDefined();
      expect(result.qualityAssessment).toBeDefined();
      expect(result.auditTrail).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle pre-processing validation failures', async () => {
      const invalidData = null;

      const result = await pipelineService.processData(
        invalidData,
        'candidate_profile',
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pre-processing validation failed');
    });

    it('should detect PII in data', async () => {
      const result = await pipelineService.processData(
        mockData,
        'candidate_profile',
        'user-123'
      );

      expect(mockAnonymizationService.detectAndAnonymizePII).toHaveBeenCalled();
      expect(result.piiDetection?.hasPII).toBe(true);
      expect(result.piiDetection?.detectedPII).toHaveLength(1);
    });

    it('should assess risk based on PII detection', async () => {
      const result = await pipelineService.processData(
        mockData,
        'candidate_profile',
        'user-123'
      );

      expect(result.riskAssessment).toBeDefined();
      expect(result.riskAssessment?.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(result.riskAssessment?.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskAssessment?.riskScore).toBeLessThanOrEqual(1);
    });

    it('should select appropriate anonymization strategy', async () => {
      const result = await pipelineService.processData(
        mockData,
        'candidate_profile',
        'user-123'
      );

      expect(result.strategy).toBeDefined();
      expect(result.strategy?.level).toMatch(/^(basic|standard|enhanced|maximum)$/);
      expect(Array.isArray(result.strategy?.techniques)).toBe(true);
    });

    it('should validate post-processing results', async () => {
      mockEthicalConstraints.prototype.validateDataAnonymization.mockResolvedValue(false);

      const result = await pipelineService.processData(
        mockData,
        'candidate_profile',
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should assess anonymization quality', async () => {
      const result = await pipelineService.processData(
        mockData,
        'candidate_profile',
        'user-123'
      );

      expect(result.qualityAssessment).toBeDefined();
      expect(result.qualityAssessment?.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityAssessment?.overallScore).toBeLessThanOrEqual(1);
      expect(result.qualityAssessment?.privacyScore).toBeDefined();
      expect(result.qualityAssessment?.utilityScore).toBeDefined();
      expect(result.qualityAssessment?.consistencyScore).toBeDefined();
    });

    it('should create audit trail', async () => {
      const result = await pipelineService.processData(
        mockData,
        'candidate_profile',
        'user-123'
      );

      expect(result.auditTrail).toBeDefined();
      expect(result.auditTrail?.pipelineId).toBe(result.pipelineId);
      expect(result.auditTrail?.userId).toBe('user-123');
      expect(result.auditTrail?.dataType).toBe('candidate_profile');
      expect(result.auditTrail?.timestamp).toBeInstanceOf(Date);
    });

    it('should cache results', async () => {
      await pipelineService.processData(
        mockData,
        'candidate_profile',
        'user-123'
      );

      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should handle different data types', async () => {
      const jobData = {
        title: 'Software Engineer',
        description: 'Looking for a talented developer',
        requirements: ['JavaScript', 'React']
      };

      const result = await pipelineService.processData(
        jobData,
        'job_description',
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.metadata.dataType).toBe('job_description');
    });

    it('should handle processing errors gracefully', async () => {
      mockAnonymizationService.detectAndAnonymizePII.mockRejectedValue(
        new Error('PII detection failed')
      );

      const result = await pipelineService.processData(
        mockData,
        'candidate_profile',
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('PII detection failed');
    });
  });

  describe('processBatch', () => {
    const mockBatchData = [
      {
        data: { name: 'John Doe', email: 'john@example.com' },
        dataType: 'candidate_profile',
        userId: 'user-1'
      },
      {
        data: { name: 'Jane Smith', email: 'jane@example.com' },
        dataType: 'candidate_profile',
        userId: 'user-2'
      }
    ];

    it('should process multiple data items', async () => {
      const results = await pipelineService.processBatch(mockBatchData);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].metadata.userId).toBe('user-1');
      expect(results[1].metadata.userId).toBe('user-2');
    });

    it('should handle individual item failures', async () => {
      // Mock failure for second item
      let callCount = 0;
      mockAnonymizationService.detectAndAnonymizePII.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Processing failed');
        }
        return Promise.resolve({
          hasPII: false,
          detectedPII: [],
          confidence: 0,
          anonymizedText: 'processed'
        });
      });

      const results = await pipelineService.processBatch(mockBatchData);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('Processing failed');
    });

    it('should handle empty batch', async () => {
      const results = await pipelineService.processBatch([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('anonymization techniques', () => {
    it('should apply suppression technique', async () => {
      const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      };

      const piiDetection = {
        hasPII: true,
        detectedPII: [
          { type: 'email', value: 'john@example.com', start: 0, end: 16, confidence: 0.95, replacement: '' },
          { type: 'phone', value: '123-456-7890', start: 0, end: 12, confidence: 0.9, replacement: '' }
        ],
        confidence: 0.9,
        anonymizedText: 'processed'
      };

      const result = await (pipelineService as any).applySuppression(testData, piiDetection);

      expect(result).toBeDefined();
      // Should remove fields containing PII
    });

    it('should apply generalization technique', async () => {
      const testData = {
        age: 28,
        salary: 75000,
        location: 'San Francisco, CA'
      };

      const result = await (pipelineService as any).applyGeneralization(testData);

      expect(result.ageRange).toBeDefined();
      expect(result.salaryRange).toBeDefined();
      expect(result.region).toBeDefined();
      expect(result.age).toBeUndefined();
      expect(result.salary).toBeUndefined();
      expect(result.location).toBeUndefined();
    });

    it('should apply substitution technique', async () => {
      const testData = { email: 'john@example.com' };
      const piiDetection = {
        hasPII: true,
        detectedPII: [
          { type: 'email', value: 'john@example.com', start: 0, end: 16, confidence: 0.95, replacement: 'user@example.com' }
        ],
        confidence: 0.95,
        anonymizedText: 'processed'
      };

      const result = await (pipelineService as any).applySubstitution(testData, piiDetection);

      expect(result).toBeDefined();
      expect(JSON.stringify(result)).toContain('user@example.com');
    });

    it('should apply perturbation technique', async () => {
      const testData = { experience: 5 };

      const result = await (pipelineService as any).applyPerturbation(testData);

      expect(result.experience).toBeDefined();
      expect(result.experience).toBeGreaterThanOrEqual(0);
      // Should be slightly different from original
      expect(Math.abs(result.experience - 5)).toBeLessThan(2);
    });

    it('should apply encryption technique', async () => {
      const testData = { id: 'user-123', userId: 'candidate-456' };

      const result = await (pipelineService as any).applyEncryption(testData, false);

      expect(result.id).toBeDefined();
      expect(result.userId).toBeDefined();
      expect(result.id).not.toBe('user-123');
      expect(result.userId).not.toBe('candidate-456');
    });
  });

  describe('utility methods', () => {
    it('should calculate utility score correctly', () => {
      const originalData = { a: 1, b: 2, c: 3, d: 4 };
      const anonymizedData = { a: 1, b: 2, c: 3 }; // Missing one field

      const score = (pipelineService as any).calculateUtilityScore(originalData, anonymizedData);

      expect(score).toBe(0.75); // 3/4 = 0.75
    });

    it('should calculate privacy score correctly', async () => {
      mockAnonymizationService.detectAndAnonymizePII
        .mockResolvedValueOnce({
          hasPII: true,
          detectedPII: [{ type: 'email' }, { type: 'phone' }] as any,
          confidence: 0.9,
          anonymizedText: 'original'
        })
        .mockResolvedValueOnce({
          hasPII: true,
          detectedPII: [{ type: 'email' }] as any,
          confidence: 0.8,
          anonymizedText: 'anonymized'
        });

      const score = await (pipelineService as any).calculatePrivacyScore(
        { original: 'data' },
        { anonymized: 'data' }
      );

      expect(score).toBe(0.5); // Removed 1 out of 2 PII items
    });

    it('should generalize age correctly', () => {
      expect((pipelineService as any).generalizeAge(22)).toBe('18-24');
      expect((pipelineService as any).generalizeAge(30)).toBe('25-34');
      expect((pipelineService as any).generalizeAge(40)).toBe('35-44');
      expect((pipelineService as any).generalizeAge(50)).toBe('45-54');
      expect((pipelineService as any).generalizeAge(60)).toBe('55+');
    });

    it('should generalize salary correctly', () => {
      expect((pipelineService as any).generalizeSalary(40000)).toBe('$0-$50k');
      expect((pipelineService as any).generalizeSalary(75000)).toBe('$50k-$100k');
      expect((pipelineService as any).generalizeSalary(125000)).toBe('$100k-$150k');
      expect((pipelineService as any).generalizeSalary(200000)).toBe('$150k+');
    });

    it('should generalize location correctly', () => {
      expect((pipelineService as any).generalizeLocation('San Francisco, California')).toBe('West Coast');
      expect((pipelineService as any).generalizeLocation('New York, NY')).toBe('East Coast');
      expect((pipelineService as any).generalizeLocation('Austin, Texas')).toBe('South');
      expect((pipelineService as any).generalizeLocation('Seattle, WA')).toBe('Other');
    });
  });

  describe('risk assessment', () => {
    it('should assess low risk for data without PII', async () => {
      mockAnonymizationService.detectAndAnonymizePII.mockResolvedValue({
        hasPII: false,
        detectedPII: [],
        confidence: 0,
        anonymizedText: 'clean data'
      });

      const result = await pipelineService.processData(
        { skills: ['JavaScript'] },
        'candidate_profile',
        'user-123'
      );

      expect(result.riskAssessment?.riskLevel).toBe('low');
    });

    it('should assess high risk for data with sensitive PII', async () => {
      mockAnonymizationService.detectAndAnonymizePII.mockResolvedValue({
        hasPII: true,
        detectedPII: [
          { type: 'ssn', value: '123-45-6789', start: 0, end: 11, confidence: 0.95, replacement: 'XXX-XX-XXXX' },
          { type: 'credit_card', value: '4111-1111-1111-1111', start: 0, end: 19, confidence: 0.9, replacement: 'XXXX-XXXX-XXXX-XXXX' }
        ],
        confidence: 0.9,
        anonymizedText: 'anonymized'
      });

      const result = await pipelineService.processData(
        { ssn: '123-45-6789', creditCard: '4111-1111-1111-1111' },
        'candidate_profile',
        'user-123'
      );

      expect(result.riskAssessment?.riskLevel).toMatch(/^(high|critical)$/);
    });
  });

  describe('strategy selection', () => {
    it('should select basic strategy for low risk', async () => {
      const riskAssessment = {
        riskScore: 0.2,
        riskLevel: 'low' as const,
        riskFactors: [],
        recommendedActions: []
      };

      const strategy = await (pipelineService as any).selectAnonymizationStrategy(riskAssessment, {});

      expect(strategy.level).toBe('basic');
      expect(strategy.techniques).toContain('suppression');
      expect(strategy.techniques).toContain('generalization');
    });

    it('should select maximum strategy for critical risk', async () => {
      const riskAssessment = {
        riskScore: 0.9,
        riskLevel: 'critical' as const,
        riskFactors: ['High-risk PII detected'],
        recommendedActions: ['Apply maximum anonymization']
      };

      const strategy = await (pipelineService as any).selectAnonymizationStrategy(riskAssessment, {});

      expect(strategy.level).toBe('maximum');
      expect(strategy.techniques).toContain('encryption');
    });

    it('should adjust strategy for utility preservation', async () => {
      const riskAssessment = {
        riskScore: 0.5,
        riskLevel: 'medium' as const,
        riskFactors: [],
        recommendedActions: []
      };

      const strategy = await (pipelineService as any).selectAnonymizationStrategy(
        riskAssessment, 
        { preserveUtility: true }
      );

      expect(strategy.preserveUtility).toBe(true);
      expect(strategy.techniques).not.toContain('suppression');
      expect(strategy.techniques).toContain('generalization');
    });
  });
});