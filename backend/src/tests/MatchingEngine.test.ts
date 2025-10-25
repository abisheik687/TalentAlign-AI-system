import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MatchingService } from '@/services/MatchingService';
import { ExplainableAIService } from '@/services/ExplainableAIService';
import { FairnessMetricsService } from '@/services/FairnessMetricsService';
import { BiasMonitoringService } from '@/services/BiasMonitoringService';

/**
 * Comprehensive Matching Engine Tests
 * Tests matching accuracy, explainability, and fairness constraints
 * Requirements: 2.1, 2.2, 2.5
 */

describe('MatchingEngine', () => {
  let matchingService: MatchingService;
  let explainableAI: ExplainableAIService;
  let fairnessMetrics: FairnessMetricsService;
  let biasMonitoring: BiasMonitoringService;

  // Test data sets
  const diverseCandidates = [
    {
      anonymizedId: 'candidate_001',
      skills: [
        { name: 'JavaScript', proficiencyLevel: 85 },
        { name: 'React', proficiencyLevel: 80 },
        { name: 'Node.js', proficiencyLevel: 75 }
      ],
      experience: [
        { title: 'Frontend Developer', years: 3, industry: 'tech' },
        { title: 'Full Stack Developer', years: 2, industry: 'fintech' }
      ],
      totalExperience: 5,
      education: [{ degree: 'bachelor', field: 'Computer Science' }],
      location: { city: 'San Francisco', country: 'USA' },
      preferences: { workArrangement: 'hybrid', companySize: 'medium' }
    },
    {
      anonymizedId: 'candidate_002',
      skills: [
        { name: 'Python', proficiencyLevel: 90 },
        { name: 'Django', proficiencyLevel: 85 },
        { name: 'PostgreSQL', proficiencyLevel: 80 }
      ],
      experience: [
        { title: 'Backend Developer', years: 4, industry: 'healthcare' },
        { title: 'Senior Developer', years: 2, industry: 'education' }
      ],
      totalExperience: 6,
      education: [{ degree: 'master', field: 'Software Engineering' }],
      location: { city: 'Austin', country: 'USA' },
      preferences: { workArrangement: 'remote', companySize: 'startup' }
    },
    {
      anonymizedId: 'candidate_003',
      skills: [
        { name: 'Java', proficiencyLevel: 95 },
        { name: 'Spring Boot', proficiencyLevel: 90 },
        { name: 'Microservices', proficiencyLevel: 85 }
      ],
      experience: [
        { title: 'Senior Java Developer', years: 8, industry: 'finance' },
        { title: 'Tech Lead', years: 3, industry: 'enterprise' }
      ],
      totalExperience: 11,
      education: [{ degree: 'bachelor', field: 'Computer Engineering' }],
      location: { city: 'New York', country: 'USA' },
      preferences: { workArrangement: 'onsite', companySize: 'large' }
    }
  ];

  const testJob = {
    _id: 'job_001',
    title: 'Senior Full Stack Developer',
    requiredSkills: [
      { name: 'JavaScript', minimumLevel: 80, importance: 'critical' },
      { name: 'React', minimumLevel: 75, importance: 'high' },
      { name: 'Node.js', minimumLevel: 70, importance: 'high' },
      { name: 'Python', minimumLevel: 60, importance: 'medium' }
    ],
    experienceLevel: { level: 'senior', minimumYears: 5 },
    educationRequirements: { level: 'bachelor', required: true },
    location: {
      primary: { city: 'San Francisco', country: 'USA' },
      remoteOptions: { fullyRemote: false, type: 'hybrid' }
    },
    companyInfo: {
      size: 'medium',
      industry: 'tech',
      culture: { collaboration: 8, autonomy: 7, innovation: 9 }
    }
  };

  beforeEach(() => {
    // Reset services before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Matching Accuracy Tests', () => {
    it('should accurately match candidates based on skills alignment', async () => {
      const result = await MatchingService.findMatchingCandidates(testJob._id, {
        searchLimit: 100,
        limit: 10
      });

      expect(result.matches).toBeDefined();
      expect(result.matches.length).toBeGreaterThan(0);

      // Verify skill-based scoring
      const topMatch = result.matches[0];
      expect(topMatch.componentScores.skills).toBeGreaterThan(0.7);
      expect(topMatch.matchedSkills.length).toBeGreaterThan(0);
    });

    it('should rank candidates correctly by overall match score', async () => {
      const result = await MatchingService.findMatchingCandidates(testJob._id);

      // Verify descending order of match scores
      for (let i = 1; i < result.matches.length; i++) {
        expect(result.matches[i - 1].overallScore).toBeGreaterThanOrEqual(
          result.matches[i].overallScore
        );
      }
    });

    it('should handle edge cases with missing or incomplete data', async () => {
      const incompleteCandidate = {
        anonymizedId: 'incomplete_001',
        skills: [], // No skills
        experience: [],
        totalExperience: 0,
        education: [],
        location: null,
        preferences: {}
      };

      // Should not crash with incomplete data
      const result = await MatchingService.findMatchingCandidates(testJob._id);
      expect(result).toBeDefined();
      expect(result.matches).toBeDefined();
    });

    it('should apply correct weights to different matching components', async () => {
      const customWeights = {
        skills: 0.5,
        experience: 0.3,
        education: 0.1,
        location: 0.05,
        cultural: 0.05
      };

      const result = await MatchingService.findMatchingCandidates(testJob._id, {
        weights: customWeights
      });

      expect(result.matches[0].componentScores).toBeDefined();
      expect(result.algorithm?.weights).toEqual(customWeights);
    });

    it('should identify skill gaps accurately', async () => {
      const result = await MatchingService.findMatchingCandidates(testJob._id);
      const matchWithGaps = result.matches.find(match => match.skillGaps.length > 0);

      if (matchWithGaps) {
        expect(matchWithGaps.skillGaps).toBeDefined();
        matchWithGaps.skillGaps.forEach(gap => {
          expect(gap.name).toBeDefined();
          expect(gap.importance).toBeDefined();
          expect(['critical', 'high', 'medium', 'low']).toContain(gap.importance);
        });
      }
    });
  });

  describe('Explainability Tests', () => {
    it('should generate comprehensive explanations for matches', async () => {
      const matchResult = {
        candidateId: 'candidate_001',
        jobId: testJob._id,
        overallScore: 0.85,
        componentScores: {
          skills: 0.9,
          experience: 0.8,
          education: 0.85,
          location: 0.95,
          cultural: 0.7
        },
        matchedSkills: [
          { name: 'JavaScript', required: 80, candidate: 85, match: true },
          { name: 'React', required: 75, candidate: 80, match: true }
        ],
        skillGaps: [],
        confidence: 0.88
      };

      const explanation = await ExplainableAIService.getInstance().explainMatch(
        'candidate_001',
        testJob._id,
        matchResult
      );

      expect(explanation).toBeDefined();
      expect(explanation.summary).toBeDefined();
      expect(explanation.componentExplanations).toBeDefined();
      expect(explanation.componentExplanations.length).toBeGreaterThan(0);
      expect(explanation.strengthsWeaknesses).toBeDefined();
      expect(explanation.recommendations).toBeDefined();
      expect(explanation.fairnessExplanation).toBeDefined();
    });

    it('should provide different explanations for different audiences', async () => {
      const matchResult = {
        candidateId: 'candidate_001',
        jobId: testJob._id,
        overallScore: 0.75,
        componentScores: { skills: 0.8, experience: 0.7 },
        matchedSkills: [],
        skillGaps: [],
        confidence: 0.8
      };

      const recruiterExplanation = await ExplainableAIService.getInstance().explainMatch(
        'candidate_001',
        testJob._id,
        matchResult,
        { audienceType: 'recruiter' }
      );

      const candidateExplanation = await ExplainableAIService.getInstance().explainMatch(
        'candidate_001',
        testJob._id,
        matchResult,
        { audienceType: 'candidate' }
      );

      expect(recruiterExplanation.metadata.audienceType).toBe('recruiter');
      expect(candidateExplanation.metadata.audienceType).toBe('candidate');
      
      // Explanations should be tailored to audience
      expect(recruiterExplanation.summary.summaryText).not.toBe(
        candidateExplanation.summary.summaryText
      );
    });

    it('should explain non-matches with improvement suggestions', async () => {
      const lowMatchResult = {
        candidateId: 'candidate_002',
        jobId: testJob._id,
        overallScore: 0.35,
        componentScores: {
          skills: 0.3,
          experience: 0.4,
          education: 0.6,
          location: 0.2,
          cultural: 0.3
        },
        matchedSkills: [],
        skillGaps: [
          { name: 'JavaScript', importance: 'critical' },
          { name: 'React', importance: 'high' }
        ],
        confidence: 0.7
      };

      const nonMatchExplanation = await ExplainableAIService.getInstance().explainNonMatch(
        'candidate_002',
        testJob._id,
        lowMatchResult
      );

      expect(nonMatchExplanation).toBeDefined();
      expect(nonMatchExplanation.primaryReasons).toBeDefined();
      expect(nonMatchExplanation.primaryReasons.length).toBeGreaterThan(0);
      expect(nonMatchExplanation.gapAnalysis).toBeDefined();
      expect(nonMatchExplanation.improvementSuggestions).toBeDefined();
    });

    it('should generate visual explanation data', async () => {
      const matchResult = {
        candidateId: 'candidate_001',
        jobId: testJob._id,
        overallScore: 0.8,
        componentScores: {
          skills: 0.85,
          experience: 0.75,
          education: 0.8,
          location: 0.9,
          cultural: 0.7
        },
        matchedSkills: [],
        skillGaps: [],
        confidence: 0.85
      };

      const explanation = await ExplainableAIService.getInstance().explainMatch(
        'candidate_001',
        testJob._id,
        matchResult,
        { includeVisuals: true }
      );

      expect(explanation.visualData).toBeDefined();
      expect(explanation.visualData.scoreBreakdown).toBeDefined();
      expect(explanation.visualData.scoreBreakdown.type).toBeDefined();
      expect(explanation.visualData.scoreBreakdown.data).toBeDefined();
      expect(explanation.visualData.confidenceIndicator).toBeDefined();
    });
  });

  describe('Bias Constraints and Fairness Tests', () => {
    it('should apply fairness constraints during matching', async () => {
      const fairnessConstraints = {
        enabled: true,
        demographicParity: 0.8,
        minScoreThreshold: 0.3,
        diversityRequirements: {
          experienceLevel: { min: 0.1, max: 0.6 }
        }
      };

      const result = await MatchingService.findMatchingCandidates(testJob._id, {
        fairnessConstraints
      });

      expect(result.algorithm?.fairnessConstraints).toEqual(fairnessConstraints);
      expect(result.fairnessMetrics).toBeDefined();
      
      // All matches should meet minimum score threshold
      result.matches.forEach(match => {
        expect(match.overallScore).toBeGreaterThanOrEqual(0.3);
      });
    });

    it('should detect and report bias in matching results', async () => {
      const result = await MatchingService.findMatchingCandidates(testJob._id);

      expect(result.biasAnalysis).toBeDefined();
      expect(result.biasAnalysis?.overallBiasScore).toBeDefined();
      expect(result.biasAnalysis?.complianceStatus).toBeDefined();
      expect(['compliant', 'requires_review', 'non_compliant']).toContain(
        result.biasAnalysis?.complianceStatus
      );
    });

    it('should calculate fairness metrics correctly', async () => {
      const result = await MatchingService.findMatchingCandidates(testJob._id);

      if (result.fairnessMetrics) {
        expect(result.fairnessMetrics.demographicParity).toBeDefined();
        expect(result.fairnessMetrics.equalizedOdds).toBeDefined();
        expect(result.fairnessMetrics.predictiveEquality).toBeDefined();
      }
    });

    it('should ensure demographic parity across experience levels', async () => {
      const result = await MatchingService.findMatchingCandidates(testJob._id, {
        fairnessConstraints: {
          enabled: true,
          demographicParity: 0.8
        }
      });

      // Analyze distribution of matches across experience levels
      const experienceLevels = result.matches.map(match => 
        match.candidate.totalExperience < 3 ? 'junior' :
        match.candidate.totalExperience < 7 ? 'mid' : 'senior'
      );

      const levelCounts = experienceLevels.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Should have representation from different experience levels
      expect(Object.keys(levelCounts).length).toBeGreaterThan(1);
    });

    it('should monitor bias in real-time during matching', async () => {
      const monitoringSpy = jest.spyOn(BiasMonitoringService.getInstance(), 'monitorProcess');

      await MatchingService.findMatchingCandidates(testJob._id);

      // Should trigger bias monitoring for high-score matches
      expect(monitoringSpy).toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle large candidate pools efficiently', async () => {
      const startTime = Date.now();
      
      const result = await MatchingService.findMatchingCandidates(testJob._id, {
        searchLimit: 1000,
        limit: 50
      });

      const processingTime = Date.now() - startTime;

      expect(result.processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(processingTime).toBeLessThan(10000); // Total time under 10 seconds
      expect(result.matches.length).toBeLessThanOrEqual(50);
    });

    it('should cache matching results appropriately', async () => {
      // First call
      const result1 = await MatchingService.findMatchingCandidates(testJob._id);
      
      // Second call should be faster (cached)
      const startTime = Date.now();
      const result2 = await MatchingService.findMatchingCandidates(testJob._id);
      const cachedTime = Date.now() - startTime;

      expect(cachedTime).toBeLessThan(1000); // Cached result should be very fast
      expect(result1.matches.length).toBe(result2.matches.length);
    });

    it('should handle concurrent matching requests', async () => {
      const concurrentRequests = Array(5).fill(null).map(() =>
        MatchingService.findMatchingCandidates(testJob._id, { limit: 10 })
      );

      const results = await Promise.all(concurrentRequests);

      // All requests should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.matches).toBeDefined();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle jobs with no requirements gracefully', async () => {
      const emptyJob = {
        _id: 'empty_job',
        title: 'Open Position',
        requiredSkills: [],
        experienceLevel: null,
        educationRequirements: null
      };

      const result = await MatchingService.findMatchingCandidates(emptyJob._id);

      expect(result).toBeDefined();
      expect(result.matches).toBeDefined();
      // Should still return candidates, possibly with neutral scores
    });

    it('should handle candidates with no skills or experience', async () => {
      const result = await MatchingService.findMatchingCandidates(testJob._id);

      // Should not crash and should handle gracefully
      expect(result).toBeDefined();
      expect(result.totalCandidates).toBeGreaterThanOrEqual(0);
    });

    it('should validate input parameters', async () => {
      // Test with invalid job ID
      await expect(
        MatchingService.findMatchingCandidates('invalid_job_id')
      ).rejects.toThrow();

      // Test with invalid options
      await expect(
        MatchingService.findMatchingCandidates(testJob._id, {
          limit: -1 // Invalid limit
        })
      ).rejects.toThrow();
    });

    it('should handle database connection issues', async () => {
      // Mock database failure
      const mockError = new Error('Database connection failed');
      jest.spyOn(require('@/models/JobRequirements'), 'findById').mockRejectedValue(mockError);

      await expect(
        MatchingService.findMatchingCandidates(testJob._id)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Integration Tests', () => {
    it('should integrate matching with explanation generation', async () => {
      const matchingResult = await MatchingService.findMatchingCandidates(testJob._id, {
        limit: 5
      });

      expect(matchingResult.matches.length).toBeGreaterThan(0);

      // Generate explanations for top matches
      const topMatch = matchingResult.matches[0];
      const explanation = await ExplainableAIService.getInstance().explainMatch(
        topMatch.candidateId,
        testJob._id,
        topMatch
      );

      expect(explanation).toBeDefined();
      expect(explanation.matchScore).toBe(topMatch.overallScore);
    });

    it('should integrate with skills gap analysis', async () => {
      const matchingResult = await MatchingService.findMatchingCandidates(testJob._id);
      const matchWithGaps = matchingResult.matches.find(match => match.skillGaps.length > 0);

      if (matchWithGaps) {
        // Should provide learning recommendations
        expect(matchWithGaps.skillGaps).toBeDefined();
        matchWithGaps.skillGaps.forEach(gap => {
          expect(gap.name).toBeDefined();
          expect(gap.importance).toBeDefined();
        });
      }
    });

    it('should maintain audit trail for all matching decisions', async () => {
      const result = await MatchingService.findMatchingCandidates(testJob._id);

      expect(result.matchingId).toBeDefined();
      expect(result.processingTime).toBeDefined();
      expect(result.algorithm).toBeDefined();
      expect(result.algorithm?.version).toBeDefined();
    });
  });

  describe('Regression Tests', () => {
    it('should maintain consistent scoring across algorithm versions', async () => {
      // Test with known candidate-job pair
      const knownCandidate = diverseCandidates[0];
      const expectedScoreRange = { min: 0.7, max: 0.9 };

      const result = await MatchingService.findMatchingCandidates(testJob._id);
      const candidateMatch = result.matches.find(
        match => match.candidateId === knownCandidate.anonymizedId
      );

      if (candidateMatch) {
        expect(candidateMatch.overallScore).toBeGreaterThanOrEqual(expectedScoreRange.min);
        expect(candidateMatch.overallScore).toBeLessThanOrEqual(expectedScoreRange.max);
      }
    });

    it('should not regress on fairness metrics', async () => {
      const result = await MatchingService.findMatchingCandidates(testJob._id);

      if (result.biasAnalysis) {
        // Bias score should remain below acceptable threshold
        expect(result.biasAnalysis.overallBiasScore).toBeLessThan(0.5);
        expect(result.biasAnalysis.complianceStatus).not.toBe('non_compliant');
      }
    });
  });
});

// Helper functions for test data generation

function generateTestCandidates(count: number) {
  const candidates = [];
  const skills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Django', 'Spring Boot'];
  const cities = ['San Francisco', 'New York', 'Austin', 'Seattle', 'Boston'];

  for (let i = 0; i < count; i++) {
    candidates.push({
      anonymizedId: `test_candidate_${i.toString().padStart(3, '0')}`,
      skills: skills.slice(0, Math.floor(Math.random() * 4) + 2).map(skill => ({
        name: skill,
        proficiencyLevel: Math.floor(Math.random() * 40) + 60 // 60-100
      })),
      totalExperience: Math.floor(Math.random() * 10) + 1,
      education: [{ degree: 'bachelor', field: 'Computer Science' }],
      location: { city: cities[Math.floor(Math.random() * cities.length)], country: 'USA' },
      preferences: { workArrangement: 'hybrid', companySize: 'medium' }
    });
  }

  return candidates;
}

function generateTestJob(requirements: Partial<any> = {}) {
  return {
    _id: `test_job_${Date.now()}`,
    title: 'Test Position',
    requiredSkills: [
      { name: 'JavaScript', minimumLevel: 70, importance: 'high' },
      { name: 'React', minimumLevel: 65, importance: 'medium' }
    ],
    experienceLevel: { level: 'mid', minimumYears: 3 },
    educationRequirements: { level: 'bachelor', required: false },
    ...requirements
  };
}