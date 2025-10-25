import { jest } from '@jest/globals';

/**
 * Test Setup and Configuration
 * Global test setup for matching engine tests
 */

// Mock external dependencies
jest.mock('@/config/redis', () => ({
  CacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('@/models/CandidateProfile', () => ({
  default: {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0)
  }
}));

jest.mock('@/models/JobRequirements', () => ({
  default: {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue({
      _id: 'test_job_001',
      title: 'Test Job',
      requiredSkills: [
        { name: 'JavaScript', minimumLevel: 80, importance: 'critical' }
      ],
      experienceLevel: { level: 'mid', minimumYears: 3 }
    }),
    create: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('@/models/MonitoringResult', () => ({
  default: {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0)
  }
}));

jest.mock('@/models/Alert', () => ({
  default: {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0)
  }
}));

// Mock WebSocket service
jest.mock('@/services/WebSocketService', () => ({
  WebSocketService: {
    broadcast: jest.fn(),
    sendToClient: jest.fn(),
    sendToRole: jest.fn()
  }
}));

// Mock consent service
jest.mock('@/services/ConsentService', () => ({
  ConsentService: {
    hasConsent: jest.fn().mockResolvedValue(true),
    grantConsent: jest.fn().mockResolvedValue(true),
    revokeConsent: jest.fn().mockResolvedValue(true)
  }
}));

// Global test timeout
jest.setTimeout(30000);

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/talentalign-test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Global test data
export const testCandidates = [
  {
    anonymizedId: 'test_candidate_001',
    skills: [
      { name: 'JavaScript', proficiencyLevel: 85 },
      { name: 'React', proficiencyLevel: 80 },
      { name: 'Node.js', proficiencyLevel: 75 }
    ],
    experience: [
      { title: 'Frontend Developer', years: 3, industry: 'tech' }
    ],
    totalExperience: 5,
    education: [{ degree: 'bachelor', field: 'Computer Science' }],
    location: { city: 'San Francisco', country: 'USA' },
    preferences: { workArrangement: 'hybrid' },
    profileCompleteness: 85,
    consentGiven: true,
    dataRetentionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  },
  {
    anonymizedId: 'test_candidate_002',
    skills: [
      { name: 'Python', proficiencyLevel: 90 },
      { name: 'Django', proficiencyLevel: 85 }
    ],
    experience: [
      { title: 'Backend Developer', years: 4, industry: 'fintech' }
    ],
    totalExperience: 6,
    education: [{ degree: 'master', field: 'Software Engineering' }],
    location: { city: 'Austin', country: 'USA' },
    preferences: { workArrangement: 'remote' },
    profileCompleteness: 90,
    consentGiven: true,
    dataRetentionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  }
];

export const testJob = {
  _id: 'test_job_001',
  title: 'Senior Full Stack Developer',
  requiredSkills: [
    { name: 'JavaScript', minimumLevel: 80, importance: 'critical' },
    { name: 'React', minimumLevel: 75, importance: 'high' },
    { name: 'Node.js', minimumLevel: 70, importance: 'high' }
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
  },
  status: 'active'
};

// Test utilities
export class TestUtils {
  static generateRandomCandidate(overrides: any = {}) {
    return {
      anonymizedId: `test_${Math.random().toString(36).substr(2, 9)}`,
      skills: [
        { name: 'JavaScript', proficiencyLevel: Math.floor(Math.random() * 40) + 60 }
      ],
      totalExperience: Math.floor(Math.random() * 10) + 1,
      education: [{ degree: 'bachelor', field: 'Computer Science' }],
      location: { city: 'Test City', country: 'USA' },
      preferences: { workArrangement: 'hybrid' },
      profileCompleteness: 80,
      consentGiven: true,
      dataRetentionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ...overrides
    };
  }

  static generateMatchResult(candidateId: string, jobId: string, overrides: any = {}) {
    return {
      candidateId,
      jobId,
      overallScore: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      componentScores: {
        skills: Math.random() * 0.3 + 0.7,
        experience: Math.random() * 0.3 + 0.7,
        education: Math.random() * 0.3 + 0.7,
        location: Math.random() * 0.3 + 0.7,
        cultural: Math.random() * 0.3 + 0.7
      },
      matchedSkills: [
        { name: 'JavaScript', required: 80, candidate: 85, match: true }
      ],
      skillGaps: [],
      confidence: Math.random() * 0.2 + 0.8,
      ...overrides
    };
  }

  static async waitFor(condition: () => boolean, timeout = 5000) {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!condition()) {
      throw new Error('Condition not met within timeout');
    }
  }

  static mockConsoleError() {
    const originalError = console.error;
    console.error = jest.fn();
    return () => {
      console.error = originalError;
    };
  }

  static expectArrayToBeOrdered(array: number[], ascending = false) {
    for (let i = 1; i < array.length; i++) {
      if (ascending) {
        expect(array[i]).toBeGreaterThanOrEqual(array[i - 1]);
      } else {
        expect(array[i]).toBeLessThanOrEqual(array[i - 1]);
      }
    }
  }

  static expectScoreInRange(score: number, min = 0, max = 1) {
    expect(score).toBeGreaterThanOrEqual(min);
    expect(score).toBeLessThanOrEqual(max);
  }
}

// Performance testing utilities
export class PerformanceTestUtils {
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    return { result, time };
  }

  static async runConcurrentTests<T>(
    testFn: () => Promise<T>,
    concurrency: number
  ): Promise<{ results: T[]; totalTime: number; averageTime: number }> {
    const start = Date.now();
    const promises = Array(concurrency).fill(null).map(() => testFn());
    const results = await Promise.all(promises);
    const totalTime = Date.now() - start;
    const averageTime = totalTime / concurrency;
    
    return { results, totalTime, averageTime };
  }
}

// Bias testing utilities
export class BiasTestUtils {
  static generateBiasedDataset(biasType: 'experience' | 'education' | 'skills') {
    const candidates = [];
    
    for (let i = 0; i < 100; i++) {
      let candidate;
      
      switch (biasType) {
        case 'experience':
          candidate = TestUtils.generateRandomCandidate({
            totalExperience: i < 50 ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 8) + 5
          });
          break;
        case 'education':
          candidate = TestUtils.generateRandomCandidate({
            education: [{ 
              degree: i < 50 ? 'bachelor' : 'master',
              field: 'Computer Science'
            }]
          });
          break;
        case 'skills':
          candidate = TestUtils.generateRandomCandidate({
            skills: [{
              name: 'JavaScript',
              proficiencyLevel: i < 50 ? Math.floor(Math.random() * 30) + 40 : Math.floor(Math.random() * 30) + 70
            }]
          });
          break;
      }
      
      candidates.push(candidate);
    }
    
    return candidates;
  }

  static calculateDemographicParity(outcomes: boolean[], groups: string[]) {
    const groupStats = new Map();
    
    groups.forEach((group, index) => {
      if (!groupStats.has(group)) {
        groupStats.set(group, { total: 0, positive: 0 });
      }
      const stats = groupStats.get(group);
      stats.total++;
      if (outcomes[index]) {
        stats.positive++;
      }
    });

    const rates = Array.from(groupStats.values()).map(stats => stats.positive / stats.total);
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);
    
    return maxRate - minRate;
  }
}

export default {
  TestUtils,
  PerformanceTestUtils,
  BiasTestUtils,
  testCandidates,
  testJob
};