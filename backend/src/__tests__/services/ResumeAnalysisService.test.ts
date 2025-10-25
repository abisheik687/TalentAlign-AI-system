import { ResumeAnalysisService } from '@/services/ResumeAnalysisService';
import { ConsentService } from '@/services/ConsentService';
import { AnonymizationService } from '@/services/AnonymizationService';
import { CacheService } from '@/config/redis';
import OpenAI from 'openai';

// Mock dependencies
jest.mock('@/services/ConsentService');
jest.mock('@/services/AnonymizationService');
jest.mock('@/config/redis');
jest.mock('openai');
jest.mock('pdf-parse');

const mockConsentService = ConsentService as jest.Mocked<typeof ConsentService>;
const mockAnonymizationService = AnonymizationService as jest.Mocked<typeof AnonymizationService>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('ResumeAnalysisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockConsentService.hasConsent.mockResolvedValue(true);
    mockAnonymizationService.anonymizeObject.mockResolvedValue({} as any);
    mockCacheService.set.mockResolvedValue(undefined);
  });

  describe('analyzeResume', () => {
    const mockRequest = {
      candidateId: 'candidate-123',
      resumeFile: Buffer.from('mock resume content'),
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
      anonymize: true
    };

    it('should successfully analyze a resume', async () => {
      // Mock PDF parsing
      const mockPdfParse = require('pdf-parse');
      mockPdfParse.mockResolvedValue({ text: 'Mock resume text content' });

      // Mock OpenAI response
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    personalInfo: { name: 'John Doe', email: 'john@example.com' },
                    skills: ['JavaScript', 'React', 'Node.js'],
                    workExperience: [{
                      title: 'Software Engineer',
                      company: 'Tech Corp',
                      startDate: '2020-01',
                      endDate: '2023-01',
                      duration: '3 years'
                    }],
                    education: [{
                      degree: 'Bachelor of Science',
                      field: 'Computer Science',
                      institution: 'University'
                    }]
                  })
                }
              }]
            })
          }
        }
      };

      // Replace the static openai instance
      (ResumeAnalysisService as any).openai = mockOpenAI;

      const result = await ResumeAnalysisService.analyzeResume(mockRequest);

      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
      expect(result.candidateId).toBe(mockRequest.candidateId);
      expect(result.extractedData).toBeDefined();
      expect(result.skillsAssessment).toBeDefined();
      expect(result.experienceAnalysis).toBeDefined();
      expect(result.educationAnalysis).toBeDefined();
      expect(result.biasAnalysis).toBeDefined();
      expect(result.anonymized).toBe(true);
    });

    it('should throw error when consent is not given', async () => {
      mockConsentService.hasConsent.mockResolvedValue(false);

      await expect(ResumeAnalysisService.analyzeResume(mockRequest))
        .rejects.toThrow('AI analysis consent required');
    });

    it('should handle PDF parsing errors gracefully', async () => {
      const mockPdfParse = require('pdf-parse');
      mockPdfParse.mockRejectedValue(new Error('PDF parsing failed'));

      await expect(ResumeAnalysisService.analyzeResume(mockRequest))
        .rejects.toThrow('Failed to extract text from resume file');
    });

    it('should handle unsupported file types', async () => {
      const unsupportedRequest = {
        ...mockRequest,
        mimeType: 'image/jpeg'
      };

      await expect(ResumeAnalysisService.analyzeResume(unsupportedRequest))
        .rejects.toThrow('Failed to extract text from resume file');
    });

    it('should cache analysis results', async () => {
      const mockPdfParse = require('pdf-parse');
      mockPdfParse.mockResolvedValue({ text: 'Mock resume text' });

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    personalInfo: {},
                    skills: [],
                    workExperience: [],
                    education: []
                  })
                }
              }]
            })
          }
        }
      };

      (ResumeAnalysisService as any).openai = mockOpenAI;

      await ResumeAnalysisService.analyzeResume(mockRequest);

      expect(mockCacheService.set).toHaveBeenCalled();
      const cacheCall = mockCacheService.set.mock.calls[0];
      expect(cacheCall[0]).toContain('resume_analysis:');
      expect(cacheCall[2]).toBe(24 * 60 * 60); // 24 hours TTL
    });
  });

  describe('extractTextFromFile', () => {
    it('should extract text from PDF files', async () => {
      const mockPdfParse = require('pdf-parse');
      mockPdfParse.mockResolvedValue({ text: 'Extracted PDF text' });

      const buffer = Buffer.from('mock pdf content');
      const result = await (ResumeAnalysisService as any).extractTextFromFile(buffer, 'application/pdf');

      expect(result).toBe('Extracted PDF text');
      expect(mockPdfParse).toHaveBeenCalledWith(buffer);
    });

    it('should extract text from plain text files', async () => {
      const buffer = Buffer.from('Plain text content');
      const result = await (ResumeAnalysisService as any).extractTextFromFile(buffer, 'text/plain');

      expect(result).toBe('Plain text content');
    });

    it('should handle Word documents', async () => {
      const buffer = Buffer.from('mock word content');
      const result = await (ResumeAnalysisService as any).extractTextFromFile(buffer, 'application/msword');

      expect(result).toBe('Word document parsing not implemented yet');
    });

    it('should throw error for unsupported file types', async () => {
      const buffer = Buffer.from('mock content');
      
      await expect((ResumeAnalysisService as any).extractTextFromFile(buffer, 'image/jpeg'))
        .rejects.toThrow('Unsupported file type: image/jpeg');
    });
  });

  describe('parseResumeContent', () => {
    it('should parse resume content using OpenAI', async () => {
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    personalInfo: { name: 'John Doe' },
                    skills: ['JavaScript', 'React'],
                    workExperience: [],
                    education: []
                  })
                }
              }]
            })
          }
        }
      };

      (ResumeAnalysisService as any).openai = mockOpenAI;

      const result = await (ResumeAnalysisService as any).parseResumeContent('Mock resume text');

      expect(result).toBeDefined();
      expect(result.personalInfo).toBeDefined();
      expect(result.skills).toEqual(['JavaScript', 'React']);
      expect(Array.isArray(result.workExperience)).toBe(true);
      expect(Array.isArray(result.education)).toBe(true);
    });

    it('should handle OpenAI API errors', async () => {
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      };

      (ResumeAnalysisService as any).openai = mockOpenAI;

      await expect((ResumeAnalysisService as any).parseResumeContent('Mock text'))
        .rejects.toThrow('Failed to parse resume content');
    });

    it('should handle invalid JSON responses', async () => {
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'Invalid JSON response'
                }
              }]
            })
          }
        }
      };

      (ResumeAnalysisService as any).openai = mockOpenAI;

      await expect((ResumeAnalysisService as any).parseResumeContent('Mock text'))
        .rejects.toThrow('Failed to parse resume content');
    });
  });

  describe('validateAndCleanExtractedData', () => {
    it('should ensure required arrays exist', () => {
      const inputData = {
        personalInfo: { name: 'John Doe' }
      };

      const result = (ResumeAnalysisService as any).validateAndCleanExtractedData(inputData);

      expect(Array.isArray(result.workExperience)).toBe(true);
      expect(Array.isArray(result.education)).toBe(true);
      expect(Array.isArray(result.skills)).toBe(true);
      expect(Array.isArray(result.certifications)).toBe(true);
      expect(Array.isArray(result.projects)).toBe(true);
    });

    it('should clean email addresses', () => {
      const inputData = {
        personalInfo: { 
          name: 'John Doe',
          email: 'JOHN@EXAMPLE.COM'
        }
      };

      const result = (ResumeAnalysisService as any).validateAndCleanExtractedData(inputData);

      expect(result.personalInfo.email).toBe('john@example.com');
    });

    it('should filter and clean skills array', () => {
      const inputData = {
        skills: ['JavaScript', '', '  React  ', null, 'Node.js']
      };

      const result = (ResumeAnalysisService as any).validateAndCleanExtractedData(inputData);

      expect(result.skills).toEqual(['JavaScript', 'React', 'Node.js']);
    });
  });

  describe('categorizeSkills', () => {
    it('should categorize programming languages correctly', async () => {
      const skills = ['JavaScript', 'Python', 'Java', 'HTML', 'CSS'];
      
      const result = await (ResumeAnalysisService as any).categorizeSkills(skills);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      const programmingCategory = result.find((cat: any) => cat.category === 'Programming Languages');
      expect(programmingCategory).toBeDefined();
      expect(programmingCategory.skills.length).toBeGreaterThan(0);
    });

    it('should categorize web technologies correctly', async () => {
      const skills = ['React', 'Angular', 'Vue.js', 'Node.js', 'Express'];
      
      const result = await (ResumeAnalysisService as any).categorizeSkills(skills);

      const webCategory = result.find((cat: any) => cat.category === 'Web Technologies');
      expect(webCategory).toBeDefined();
      expect(webCategory.skills.length).toBeGreaterThan(0);
    });

    it('should handle empty skills array', async () => {
      const result = await (ResumeAnalysisService as any).categorizeSkills([]);
      expect(result).toEqual([]);
    });
  });

  describe('extractSoftSkills', () => {
    it('should extract soft skills from resume data', async () => {
      const resumeData = {
        summary: 'Experienced leader with strong communication skills',
        workExperience: [{
          description: 'Led a team of 5 developers, demonstrating excellent project management and collaboration skills'
        }]
      };

      const result = await (ResumeAnalysisService as any).extractSoftSkills(resumeData);

      expect(result).toContain('leadership');
      expect(result).toContain('communication');
      expect(result).toContain('project management');
      expect(result).toContain('collaboration');
    });

    it('should return unique soft skills', async () => {
      const resumeData = {
        summary: 'Strong leadership and leadership experience',
        objective: 'Seeking leadership role'
      };

      const result = await (ResumeAnalysisService as any).extractSoftSkills(resumeData);

      const leadershipCount = result.filter((skill: string) => skill === 'leadership').length;
      expect(leadershipCount).toBe(1);
    });

    it('should handle missing text fields', async () => {
      const resumeData = {};

      const result = await (ResumeAnalysisService as any).extractSoftSkills(resumeData);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('calculateTotalExperience', () => {
    it('should calculate total experience correctly', () => {
      const workExperience = [
        { startDate: '2020-01', endDate: '2022-01' }, // 24 months
        { startDate: '2022-02', endDate: '2023-02' }  // 12 months
      ];

      const result = (ResumeAnalysisService as any).calculateTotalExperience(workExperience);

      expect(result).toBe(3.0); // 36 months = 3 years
    });

    it('should handle empty work experience', () => {
      const result = (ResumeAnalysisService as any).calculateTotalExperience([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateJobDuration', () => {
    it('should calculate job duration in months', () => {
      const result = (ResumeAnalysisService as any).calculateJobDuration('2020-01', '2022-01');
      expect(result).toBeGreaterThan(20); // Approximately 24 months
      expect(result).toBeLessThan(30);
    });

    it('should handle "Present" end date', () => {
      const result = (ResumeAnalysisService as any).calculateJobDuration('2023-01', 'Present');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle invalid dates gracefully', () => {
      const result = (ResumeAnalysisService as any).calculateJobDuration('invalid', 'invalid');
      expect(result).toBe(12); // Default fallback
    });

    it('should return minimum 1 month', () => {
      const result = (ResumeAnalysisService as any).calculateJobDuration('2023-01', '2023-01');
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });

  describe('identifyEmploymentGaps', () => {
    it('should identify employment gaps', () => {
      const workExperience = [
        { startDate: '2020-01', endDate: '2021-01' },
        { startDate: '2021-06', endDate: '2022-06' } // 5-month gap
      ];

      const result = (ResumeAnalysisService as any).identifyEmploymentGaps(workExperience);

      expect(result.length).toBe(1);
      expect(result[0].duration).toBeGreaterThan(2);
      expect(result[0].impact).toBe('medium');
    });

    it('should not identify small gaps', () => {
      const workExperience = [
        { startDate: '2020-01', endDate: '2021-01' },
        { startDate: '2021-02', endDate: '2022-02' } // 1-month gap
      ];

      const result = (ResumeAnalysisService as any).identifyEmploymentGaps(workExperience);

      expect(result.length).toBe(0);
    });

    it('should handle single job', () => {
      const workExperience = [
        { startDate: '2020-01', endDate: '2023-01' }
      ];

      const result = (ResumeAnalysisService as any).identifyEmploymentGaps(workExperience);

      expect(result.length).toBe(0);
    });

    it('should classify gap impact correctly', () => {
      const workExperience = [
        { startDate: '2020-01', endDate: '2021-01' },
        { startDate: '2022-06', endDate: '2023-06' } // 17-month gap
      ];

      const result = (ResumeAnalysisService as any).identifyEmploymentGaps(workExperience);

      expect(result[0].impact).toBe('high');
    });
  });

  describe('calculateCompletenessScore', () => {
    it('should calculate high score for complete resume', () => {
      const completeData = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          location: 'New York'
        },
        workExperience: [
          { title: 'Engineer', achievements: ['Built system'] },
          { title: 'Senior Engineer', achievements: ['Led team'] }
        ],
        education: [
          { degree: 'BS', gpa: 3.8 }
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
        summary: 'Experienced developer',
        certifications: [{ name: 'AWS Certified' }],
        projects: [{ name: 'Web App' }]
      };

      const result = (ResumeAnalysisService as any).calculateCompletenessScore(completeData);

      expect(result).toBeGreaterThan(80);
    });

    it('should calculate low score for incomplete resume', () => {
      const incompleteData = {
        personalInfo: { name: 'John Doe' },
        skills: ['JavaScript']
      };

      const result = (ResumeAnalysisService as any).calculateCompletenessScore(incompleteData);

      expect(result).toBeLessThan(50);
    });

    it('should not exceed maximum score', () => {
      const overCompleteData = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          location: 'New York'
        },
        workExperience: Array(10).fill({ title: 'Engineer', achievements: ['Achievement'] }),
        education: Array(5).fill({ degree: 'BS', gpa: 4.0 }),
        skills: Array(20).fill('Skill'),
        summary: 'Summary',
        certifications: Array(10).fill({ name: 'Cert' }),
        projects: Array(10).fill({ name: 'Project' })
      };

      const result = (ResumeAnalysisService as any).calculateCompletenessScore(overCompleteData);

      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('estimateSkillProficiency', () => {
    it('should assign higher proficiency to complex skills', () => {
      const highProficiencyResult = (ResumeAnalysisService as any).estimateSkillProficiency('machine learning');
      const mediumProficiencyResult = (ResumeAnalysisService as any).estimateSkillProficiency('react');
      const basicProficiencyResult = (ResumeAnalysisService as any).estimateSkillProficiency('unknown skill');

      expect(highProficiencyResult).toBeGreaterThanOrEqual(70);
      expect(mediumProficiencyResult).toBeGreaterThanOrEqual(50);
      expect(basicProficiencyResult).toBeGreaterThanOrEqual(40);
    });
  });

  describe('estimateYearsOfExperience', () => {
    it('should assign appropriate experience ranges', () => {
      const matureSkillExp = (ResumeAnalysisService as any).estimateYearsOfExperience('java');
      const modernSkillExp = (ResumeAnalysisService as any).estimateYearsOfExperience('react');
      const emergingSkillExp = (ResumeAnalysisService as any).estimateYearsOfExperience('rust');

      expect(matureSkillExp).toBeGreaterThanOrEqual(2);
      expect(matureSkillExp).toBeLessThanOrEqual(10);
      
      expect(modernSkillExp).toBeGreaterThanOrEqual(1);
      expect(modernSkillExp).toBeLessThanOrEqual(6);
      
      expect(emergingSkillExp).toBeGreaterThanOrEqual(1);
      expect(emergingSkillExp).toBeLessThanOrEqual(4);
    });
  });
});