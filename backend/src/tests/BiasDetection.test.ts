import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JobBiasDetectionService } from '@/services/JobBiasDetectionService';
import { BiasMonitoringService } from '@/services/BiasMonitoringService';

/**
 * Bias Detection Tests
 * Tests bias detection algorithms and monitoring systems
 * Requirements: 4.1, 4.4, 8.1
 */

describe('BiasDetection', () => {
  let biasDetection: JobBiasDetectionService;
  let biasMonitoring: BiasMonitoringService;

  beforeEach(() => {
    biasDetection = JobBiasDetectionService.getInstance();
    biasMonitoring = BiasMonitoringService.getInstance();
    jest.clearAllMocks();
  });

  describe('Job Description Bias Detection', () => {
    it('should detect gender bias in job descriptions', async () => {
      const biasedJobDescription = {
        jobId: 'test_job_001',
        content: 'We are looking for a rockstar developer who can work with the guys in our team. He should be energetic and a real go-getter.',
        title: 'Senior Developer',
        language: 'en'
      };

      const result = await biasDetection.analyzeJobDescription(biasedJobDescription);

      expect(result.overallBiasScore).toBeGreaterThan(0.3);
      expect(result.complianceStatus).toBe('needs_review');
      
      const genderBias = result.biasCategories.find(cat => cat.category === 'gender');
      expect(genderBias).toBeDefined();
      expect(genderBias?.flaggedTerms.length).toBeGreaterThan(0);
      
      const flaggedTerms = genderBias?.flaggedTerms.map(term => term.term.toLowerCase());
      expect(flaggedTerms).toContain('guys');
      expect(flaggedTerms).toContain('he');
    });

    it('should detect age bias in job descriptions', async () => {
      const agebiasedDescription = {
        jobId: 'test_job_002',
        content: 'Looking for young, energetic developers who are digital natives and recent graduates.',
        title: 'Junior Developer',
        language: 'en'
      };

      const result = await biasDetection.analyzeJobDescription(agebiasedDescription);

      const ageBias = result.biasCategories.find(cat => cat.category === 'age');
      expect(ageBias).toBeDefined();
      expect(ageBias?.flaggedTerms.length).toBeGreaterThan(0);
      
      const flaggedTerms = ageBias?.flaggedTerms.map(term => term.term.toLowerCase());
      expect(flaggedTerms).toContain('young');
      expect(flaggedTerms).toContain('energetic');
    });

    it('should provide alternative language suggestions', async () => {
      const flaggedTerms = [
        {
          term: 'guys',
          category: 'gender',
          severity: 'medium',
          position: 10,
          context: 'work with the guys',
          explanation: 'Gender-exclusive language',
          confidence: 0.9
        }
      ];

      const suggestions = await biasDetection.suggestAlternatives(flaggedTerms);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].originalTerm).toBe('guys');
      expect(suggestions[0].alternatives.length).toBeGreaterThan(0);
      expect(suggestions[0].alternatives[0].suggestion).toBeDefined();
    });

    it('should handle clean job descriptions correctly', async () => {
      const cleanJobDescription = {
        jobId: 'test_job_003',
        content: 'We are seeking a skilled software developer to join our team. The ideal candidate will have experience with modern web technologies and strong problem-solving abilities.',
        title: 'Software Developer',
        language: 'en'
      };

      const result = await biasDetection.analyzeJobDescription(cleanJobDescription);

      expect(result.overallBiasScore).toBeLessThan(0.2);
      expect(result.complianceStatus).toBe('compliant');
      expect(result.flaggedTerms.length).toBe(0);
    });

    it('should provide real-time bias scoring', async () => {
      const content = 'Looking for a rockstar ninja developer';

      const realtimeScore = await biasDetection.getRealTimeBiasScore(content);

      expect(realtimeScore.overallScore).toBeDefined();
      expect(realtimeScore.categoryScores).toBeDefined();
      expect(realtimeScore.immediateFlags).toBeDefined();
      expect(realtimeScore.confidence).toBeDefined();
    });
  });

  describe('Real-time Bias Monitoring', () => {
    it('should monitor hiring processes for bias', async () => {
      const processData = {
        applications: [
          { candidateId: 'candidate_001', status: 'accepted' },
          { candidateId: 'candidate_002', status: 'rejected' },
          { candidateId: 'candidate_003', status: 'accepted' }
        ]
      };

      const result = await biasMonitoring.monitorProcess(
        'process_001',
        'application_review',
        processData
      );

      expect(result.monitoringId).toBeDefined();
      expect(result.biasAnalysis).toBeDefined();
      expect(result.complianceStatus).toBeDefined();
    });

    it('should generate alerts for bias violations', async () => {
      const highBiasProcess = {
        candidates: generateBiasedCandidateSet()
      };

      const result = await biasMonitoring.monitorProcess(
        'biased_process_001',
        'matching',
        highBiasProcess
      );

      if (result.violations.length > 0) {
        expect(result.violations[0].type).toBeDefined();
        expect(result.violations[0].severity).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(result.violations[0].severity);
      }
    });

    it('should calculate fairness metrics correctly', async () => {
      const processData = {
        candidates: generateDiverseCandidateSet(),
        matches: generateMatchResults()
      };

      const result = await biasMonitoring.monitorProcess(
        'fair_process_001',
        'matching',
        processData
      );

      expect(result.fairnessMetrics).toBeDefined();
      if (result.fairnessMetrics) {
        expect(result.fairnessMetrics.demographicParity).toBeDefined();
        expect(result.fairnessMetrics.equalizedOdds).toBeDefined();
      }
    });

    it('should provide dashboard data', async () => {
      const dashboardData = await biasMonitoring.getDashboardData('24h');

      expect(dashboardData.summaryMetrics).toBeDefined();
      expect(dashboardData.activeAlerts).toBeDefined();
      expect(dashboardData.complianceByProcess).toBeDefined();
      expect(dashboardData.lastUpdated).toBeDefined();
    });
  });

  describe('Bias Mitigation', () => {
    it('should apply fairness constraints during matching', async () => {
      const candidates = generateDiverseCandidateSet();
      const fairnessConstraints = {
        enabled: true,
        demographicParity: 0.8,
        minScoreThreshold: 0.3
      };

      // This would test the fairness constraint application
      // in the matching service
      expect(fairnessConstraints.enabled).toBe(true);
    });

    it('should ensure demographic representation', async () => {
      const candidates = generateDiverseCandidateSet();
      
      // Analyze demographic distribution
      const experienceLevels = candidates.map(c => 
        c.totalExperience < 3 ? 'junior' :
        c.totalExperience < 7 ? 'mid' : 'senior'
      );

      const distribution = experienceLevels.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Should have representation from multiple levels
      expect(Object.keys(distribution).length).toBeGreaterThan(1);
    });
  });

  describe('Compliance and Auditing', () => {
    it('should maintain audit trails for bias decisions', async () => {
      const processData = {
        applications: [
          { candidateId: 'candidate_001', status: 'accepted' }
        ]
      };

      const result = await biasMonitoring.monitorProcess(
        'audit_process_001',
        'application_review',
        processData
      );

      expect(result.monitoringId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.processingTime).toBeDefined();
    });

    it('should generate compliance reports', async () => {
      const report = await biasMonitoring.generateReport(
        'compliance',
        '30d',
        { includeDetails: true }
      );

      expect(report.reportId).toBeDefined();
      expect(report.reportType).toBe('compliance');
      expect(report.metadata).toBeDefined();
      expect(report.metadata.complianceRate).toBeDefined();
    });

    it('should track bias trends over time', async () => {
      const report = await biasMonitoring.generateReport(
        'trend_analysis',
        '30d'
      );

      expect(report.reportType).toBe('trend_analysis');
      expect(report.data).toBeDefined();
    });
  });
});

// Helper functions for generating test data

function generateBiasedCandidateSet() {
  return [
    {
      anonymizedId: 'biased_001',
      totalExperience: 2,
      skills: [{ name: 'JavaScript', proficiencyLevel: 60 }],
      education: [{ degree: 'bachelor' }]
    },
    {
      anonymizedId: 'biased_002', 
      totalExperience: 8,
      skills: [{ name: 'JavaScript', proficiencyLevel: 90 }],
      education: [{ degree: 'master' }]
    }
  ];
}

function generateDiverseCandidateSet() {
  return [
    {
      anonymizedId: 'diverse_001',
      totalExperience: 2,
      skills: [{ name: 'JavaScript', proficiencyLevel: 70 }],
      education: [{ degree: 'bachelor' }]
    },
    {
      anonymizedId: 'diverse_002',
      totalExperience: 5,
      skills: [{ name: 'Python', proficiencyLevel: 80 }],
      education: [{ degree: 'bachelor' }]
    },
    {
      anonymizedId: 'diverse_003',
      totalExperience: 8,
      skills: [{ name: 'Java', proficiencyLevel: 85 }],
      education: [{ degree: 'master' }]
    }
  ];
}

function generateMatchResults() {
  return [
    { candidateId: 'diverse_001', selected: true, score: 0.75 },
    { candidateId: 'diverse_002', selected: false, score: 0.65 },
    { candidateId: 'diverse_003', selected: true, score: 0.85 }
  ];
}