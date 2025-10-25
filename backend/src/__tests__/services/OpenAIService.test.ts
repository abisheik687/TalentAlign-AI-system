import { OpenAIService } from '@/services/OpenAIService';
import { EthicalConstraintsService } from '@/services/EthicalConstraintsService';
import { CacheService } from '@/config/redis';
import OpenAI from 'openai';

// Mock dependencies
jest.mock('@/services/EthicalConstraintsService');
jest.mock('@/config/redis');
jest.mock('openai');

const mockEthicalConstraints = EthicalConstraintsService as jest.Mocked<typeof EthicalConstraintsService>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('OpenAIService', () => {
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as any;

    // Set up the static openai instance
    (OpenAIService as any).openai = mockOpenAI;
    (OpenAIService as any).ethicalConstraints = {
      validateCandidateConsent: jest.fn().mockResolvedValue(true)
    };

    // Default cache mocks
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);
  });

  describe('analyzeResumeContent', () => {
    const mockResumeText = 'John Doe\nSoftware Engineer\nSkills: JavaScript, React, Node.js';
    const candidateId = 'candidate-123';

    it('should successfully analyze resume content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              skills: ['JavaScript', 'React', 'Node.js'],
              experience: [{ title: 'Software Engineer', years: 3 }],
              education: [{ degree: 'BS Computer Science' }],
              qualityScore: 85,
              completenessScore: 90,
              recommendations: ['Add more project details'],
              extractedData: { name: 'John Doe' }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.analyzeResumeContent(mockResumeText, candidateId);

      expect(result).toBeDefined();
      expect(result.skills).toEqual(['JavaScript', 'React', 'Node.js']);
      expect(result.qualityScore).toBe(85);
      expect(result.completenessScore).toBe(90);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' })
          ]),
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      );
    });

    it('should return cached result when available', async () => {
      const cachedResult = {
        skills: ['Cached Skills'],
        qualityScore: 75
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await OpenAIService.analyzeResumeContent(mockResumeText, candidateId);

      expect(result).toEqual(cachedResult);
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should handle ethical constraint violations', async () => {
      (OpenAIService as any).ethicalConstraints.validateCandidateConsent.mockResolvedValue(false);

      await expect(OpenAIService.analyzeResumeContent(mockResumeText, candidateId))
        .rejects.toThrow('Ethical constraint violation');
    });

    it('should retry on API failures', async () => {
      mockOpenAI.chat.completions.create
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                skills: [],
                experience: [],
                education: [],
                qualityScore: 50,
                completenessScore: 50,
                recommendations: [],
                extractedData: {}
              })
            }
          }]
        } as any);

      const result = await OpenAIService.analyzeResumeContent(mockResumeText, candidateId);

      expect(result).toBeDefined();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it('should return fallback result after max retries', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await OpenAIService.analyzeResumeContent(mockResumeText, candidateId);

      expect(result).toBeDefined();
      expect(result.recommendations).toContain('API unavailable - manual review recommended');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should cache successful results', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              skills: ['JavaScript'],
              experience: [],
              education: [],
              qualityScore: 80,
              completenessScore: 75,
              recommendations: [],
              extractedData: {}
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await OpenAIService.analyzeResumeContent(mockResumeText, candidateId);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('openai:resume_analysis:'),
        expect.any(String),
        24 * 60 * 60 // 24 hours
      );
    });
  });

  describe('analyzeJobDescription', () => {
    const mockJobDescription = 'We are looking for a rockstar developer to join our team';
    const userId = 'user-123';

    it('should successfully analyze job description', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              biasScore: 0.7,
              biasIndicators: ['rockstar'],
              qualityScore: 60,
              recommendations: ['Replace "rockstar" with "talented"'],
              inclusivitySuggestions: ['Use more inclusive language']
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.analyzeJobDescription(mockJobDescription, userId);

      expect(result).toBeDefined();
      expect(result.biasScore).toBe(0.7);
      expect(result.biasIndicators).toContain('rockstar');
      expect(result.recommendations).toContain('Replace "rockstar" with "talented"');
    });

    it('should handle API failures with fallback', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await OpenAIService.analyzeJobDescription(mockJobDescription, userId);

      expect(result).toBeDefined();
      expect(result.biasScore).toBe(0.5);
      expect(result.recommendations).toContain('API unavailable - manual review recommended');
    });
  });

  describe('generateMatchExplanation', () => {
    const mockCandidate = {
      skills: ['JavaScript', 'React', 'Node.js']
    };
    const mockJob = {
      title: 'Frontend Developer',
      requiredSkills: [
        { name: 'JavaScript' },
        { name: 'React' },
        { name: 'CSS' }
      ]
    };
    const matchScore = 85;

    it('should generate match explanation', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Strong match based on technical skills',
              strengths: ['JavaScript expertise', 'React experience'],
              gaps: ['CSS knowledge could be improved'],
              recommendations: ['Consider CSS training'],
              confidence: 0.9
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.generateMatchExplanation(
        mockCandidate, 
        mockJob, 
        matchScore
      );

      expect(result).toBeDefined();
      expect(result.summary).toContain('Strong match');
      expect(result.strengths).toContain('JavaScript expertise');
      expect(result.gaps).toContain('CSS knowledge could be improved');
      expect(result.confidence).toBe(0.9);
    });

    it('should handle API failures with fallback', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await OpenAIService.generateMatchExplanation(
        mockCandidate, 
        mockJob, 
        matchScore
      );

      expect(result).toBeDefined();
      expect(result.summary).toContain('85%');
      expect(result.recommendations).toContain('Manual review recommended');
    });
  });

  describe('generateInterviewQuestions', () => {
    const mockCandidate = { skills: ['JavaScript', 'React'] };
    const mockJob = {
      title: 'Frontend Developer',
      requiredSkills: [{ name: 'JavaScript' }, { name: 'React' }],
      experienceLevel: { level: 'mid' }
    };

    it('should generate technical interview questions', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              questions: [
                'Explain the difference between let, const, and var in JavaScript',
                'How does React\'s virtual DOM work?',
                'Describe your experience with state management in React'
              ],
              evaluationCriteria: ['Technical accuracy', 'Depth of understanding'],
              difficulty: 'medium',
              estimatedDuration: 45
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.generateInterviewQuestions(
        mockCandidate,
        mockJob,
        'technical'
      );

      expect(result).toBeDefined();
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0]).toContain('JavaScript');
      expect(result.difficulty).toBe('medium');
      expect(result.estimatedDuration).toBe(45);
    });

    it('should generate behavioral interview questions', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await OpenAIService.generateInterviewQuestions(
        mockCandidate,
        mockJob,
        'behavioral'
      );

      expect(result).toBeDefined();
      expect(result.questions).toContain('Tell me about a challenging project you worked on.');
      expect(result.questions).toContain('Describe a time when you had to work with a difficult team member.');
    });
  });

  describe('analyzeCommunication', () => {
    const mockText = 'This candidate seems very qualified and professional';
    const userId = 'user-123';

    it('should analyze communication for bias and sentiment', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              sentiment: 'positive',
              biasScore: 0.1,
              professionalismScore: 90,
              issues: [],
              suggestions: ['Communication appears professional and unbiased']
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.analyzeCommunication(mockText, 'email', userId);

      expect(result).toBeDefined();
      expect(result.sentiment).toBe('positive');
      expect(result.biasScore).toBe(0.1);
      expect(result.professionalismScore).toBe(90);
    });

    it('should handle API failures with fallback', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const result = await OpenAIService.analyzeCommunication(mockText, 'email', userId);

      expect(result).toBeDefined();
      expect(result.sentiment).toBe('neutral');
      expect(result.suggestions).toContain('API unavailable - manual review recommended');
    });
  });

  describe('utility methods', () => {
    describe('generateCacheKey', () => {
      it('should generate consistent cache keys', () => {
        const key1 = (OpenAIService as any).generateCacheKey('test', 'content');
        const key2 = (OpenAIService as any).generateCacheKey('test', 'content');
        const key3 = (OpenAIService as any).generateCacheKey('test', 'different');

        expect(key1).toBe(key2);
        expect(key1).not.toBe(key3);
        expect(key1).toContain('openai:test:');
      });
    });

    describe('estimateTokens', () => {
      it('should estimate token count', () => {
        const shortText = 'Hello';
        const longText = 'This is a much longer text that should have more tokens';

        const shortTokens = (OpenAIService as any).estimateTokens(shortText);
        const longTokens = (OpenAIService as any).estimateTokens(longText);

        expect(shortTokens).toBeLessThan(longTokens);
        expect(shortTokens).toBeGreaterThan(0);
      });
    });

    describe('getSystemPrompt', () => {
      it('should return appropriate system prompts', () => {
        const resumePrompt = (OpenAIService as any).getSystemPrompt('resume_analysis');
        const jobPrompt = (OpenAIService as any).getSystemPrompt('job_analysis');
        const defaultPrompt = (OpenAIService as any).getSystemPrompt('unknown');

        expect(resumePrompt).toContain('resume analyzer');
        expect(jobPrompt).toContain('job description analyzer');
        expect(defaultPrompt).toContain('resume analyzer'); // fallback
      });
    });
  });

  describe('error handling and fallbacks', () => {
    it('should handle JSON parsing errors in responses', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.analyzeResumeContent('test', 'candidate-123');

      expect(result).toBeDefined();
      expect(result.recommendations).toContain('API unavailable - manual review recommended');
    });

    it('should handle missing response content', async () => {
      const mockResponse = {
        choices: [{
          message: {}
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.analyzeResumeContent('test', 'candidate-123');

      expect(result).toBeDefined();
      expect(result.recommendations).toContain('API unavailable - manual review recommended');
    });

    it('should handle empty choices array', async () => {
      const mockResponse = {
        choices: []
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.analyzeResumeContent('test', 'candidate-123');

      expect(result).toBeDefined();
      expect(result.recommendations).toContain('API unavailable - manual review recommended');
    });
  });

  describe('caching behavior', () => {
    it('should skip cache when forceRefresh is true', async () => {
      const cachedResult = { skills: ['Cached'] };
      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedResult));

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              skills: ['Fresh'],
              experience: [],
              education: [],
              qualityScore: 80,
              completenessScore: 75,
              recommendations: [],
              extractedData: {}
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.analyzeResumeContent(
        'test', 
        'candidate-123', 
        { forceRefresh: true }
      );

      expect(result.skills).toEqual(['Fresh']);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));
      mockCacheService.set.mockRejectedValue(new Error('Cache error'));

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              skills: [],
              experience: [],
              education: [],
              qualityScore: 80,
              completenessScore: 75,
              recommendations: [],
              extractedData: {}
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await OpenAIService.analyzeResumeContent('test', 'candidate-123');

      expect(result).toBeDefined();
      // Should still work despite cache errors
    });
  });
});