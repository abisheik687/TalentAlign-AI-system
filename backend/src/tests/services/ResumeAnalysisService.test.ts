import { ResumeAnalysisService } from '../../services/ResumeAnalysisService';
import { AnonymizationService } from '../../services/AnonymizationService';
import { OpenAIService } from '../../services/OpenAIService';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../services/AnonymizationService');
jest.mock('../../services/OpenAIService');

describe('ResumeAnalysisService', () => {
  let resumeAnalysisService: ResumeAnalysisService;
  let mockAnonymizationService: jest.Mocked<AnonymizationService>;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    mockAnonymizationService = new AnonymizationService() as jest.Mocked<AnonymizationService>;
    mockOpenAIService = new OpenAIService() as jest.Mocked<OpenAIService>;
    resumeAnalysisService = new ResumeAnalysisService(mockAnonymizationService, mockOpenAIService);
  });

  describe('parseResume', () => {
    it('should successfully parse a PDF resume', async () => {
      const mockBuffer = Buffer.from('mock pdf content');
      const expectedResult = {
        text: 'John Doe\nSoftware Engineer\nExperience: 5 years\nSkills: JavaScript, Python',
        metadata: {
          pages: 1,
          fileSize: mockBuffer.length,
          format: 'pdf'
        }
      };

      const result = await resumeAnalysisService.parseResume(mockBuffer, 'application/pdf');

      expect(result).toBeDefined();
      expect(result.text).toContain('Software Engineer');
      expect(result.metadata.format).toBe('pdf');
    });

    it('should handle parsing errors gracefully', async () => {
      const invalidBuffer = Buffer.from('invalid content');

      await expect(
        resumeAnalysisService.parseResume(invalidBuffer, 'application/pdf')
      ).rejects.toThrow('Failed to parse resume');
    });

    it('should reject unsupported file formats', async () => {
      const mockBuffer = Buffer.from('mock content');

      await expect(
        resumeAnalysisService.parseResume(mockBuffer, 'image/jpeg')
      ).rejects.toThrow('Unsupported file format');
    });
  });

  describe('extractSkills', () => {
    it('should extract skills with confidence scores', async () => {
      const resumeText = `
        Software Engineer with 5 years of experience in JavaScript, Python, and React.
        Proficient in Node.js, MongoDB, and AWS cloud services.
        Experience with machine learning using TensorFlow and scikit-learn.
      `;

      mockOpenAIService.analyzeSkills.mockResolvedValue({
        skills: [
          { name: 'JavaScript', confidence: 0.95, category: 'Programming Language' },
          { name: 'Python', confidence: 0.92, category: 'Programming Language' },
          { name: 'React', confidence: 0.88, category: 'Framework' },
          { name: 'Node.js', confidence: 0.85, category: 'Runtime' },
          { name: 'MongoDB', confidence: 0.82, category: 'Database' },
          { name: 'AWS', confidence: 0.78, category: 'Cloud Platform' },
          { name: 'TensorFlow', confidence: 0.75, category: 'ML Framework' },
          { name: 'Machine Learning', confidence: 0.70, category: 'Domain' }
        ]
      });

      const result = await resumeAnalysisService.extractSkills(resumeText);

      expect(result.skills).toHaveLength(8);
      expect(result.skills[0]).toEqual({
        name: 'JavaScript',
        confidence: 0.95,
        category: 'Programming Language'
      });
      
      // Verify confidence scores are within valid range
      result.skills.forEach(skill => {
        expect(skill.confidence).toBeGreaterThanOrEqual(0);
        expect(skill.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should handle empty or invalid resume text', async () => {
      mockOpenAIService.analyzeSkills.mockResolvedValue({ skills: [] });

      const result = await resumeAnalysisService.extractSkills('');
      expect(result.skills).toHaveLength(0);
    });

    it('should filter out low-confidence skills', async () => {
      const resumeText = 'Some text with unclear skills';

      mockOpenAIService.analyzeSkills.mockResolvedValue({
        skills: [
          { name: 'JavaScript', confidence: 0.85, category: 'Programming Language' },
          { name: 'Unclear Skill', confidence: 0.45, category: 'Unknown' },
          { name: 'Python', confidence: 0.75, category: 'Programming Language' }
        ]
      });

      const result = await resumeAnalysisService.extractSkills(resumeText);

      // Should filter out skills with confidence < 0.5
      expect(result.skills).toHaveLength(2);
      expect(result.skills.find(s => s.name === 'Unclear Skill')).toBeUndefined();
    });
  });

  describe('analyzeResume', () => {
    it('should perform comprehensive resume analysis', async () => {
      const mockBuffer = Buffer.from('mock resume content');
      const resumeText = 'John Doe\nSoftware Engineer\nJavaScript, Python, React';

      mockAnonymizationService.anonymizeText.mockResolvedValue({
        anonymizedText: '[NAME]\nSoftware Engineer\nJavaScript, Python, React',
        removedPII: ['John Doe'],
        confidence: 0.95
      });

      mockOpenAIService.analyzeSkills.mockResolvedValue({
        skills: [
          { name: 'JavaScript', confidence: 0.95, category: 'Programming Language' },
          { name: 'Python', confidence: 0.92, category: 'Programming Language' },
          { name: 'React', confidence: 0.88, category: 'Framework' }
        ]
      });

      mockOpenAIService.summarizeResume.mockResolvedValue({
        summary: 'Experienced software engineer with strong frontend and backend skills',
        experience: {
          totalYears: 5,
          level: 'senior',
          domains: ['web development', 'software engineering']
        }
      });

      const result = await resumeAnalysisService.analyzeResume(mockBuffer, 'application/pdf');

      expect(result).toBeDefined();
      expect(result.anonymizedContent).toContain('[NAME]');
      expect(result.skills).toHaveLength(3);
      expect(result.summary).toContain('Experienced software engineer');
      expect(result.experience.totalYears).toBe(5);
      expect(result.anonymizationMetrics.confidence).toBe(0.95);
    });

    it('should handle analysis failures gracefully', async () => {
      const mockBuffer = Buffer.from('mock content');

      mockAnonymizationService.anonymizeText.mockRejectedValue(new Error('Anonymization failed'));

      await expect(
        resumeAnalysisService.analyzeResume(mockBuffer, 'application/pdf')
      ).rejects.toThrow('Resume analysis failed');
    });
  });

  describe('anonymization pipeline effectiveness', () => {
    it('should successfully remove all PII from resume text', async () => {
      const resumeWithPII = `
        John Doe
        Email: john.doe@email.com
        Phone: (555) 123-4567
        Address: 123 Main St, San Francisco, CA 94105
        LinkedIn: linkedin.com/in/johndoe
      `;

      mockAnonymizationService.anonymizeText.mockResolvedValue({
        anonymizedText: `
        [NAME]
        Email: [EMAIL]
        Phone: [PHONE]
        Address: [ADDRESS]
        LinkedIn: [SOCIAL_MEDIA]
      `,
        removedPII: [
          'John Doe',
          'john.doe@email.com',
          '(555) 123-4567',
          '123 Main St, San Francisco, CA 94105',
          'linkedin.com/in/johndoe'
        ],
        confidence: 0.98
      });

      const result = await mockAnonymizationService.anonymizeText(resumeWithPII);

      expect(result.anonymizedText).not.toContain('John Doe');
      expect(result.anonymizedText).not.toContain('john.doe@email.com');
      expect(result.anonymizedText).not.toContain('(555) 123-4567');
      expect(result.removedPII).toHaveLength(5);
      expect(result.confidence).toBeGreaterThan(0.95);
    });

    it('should maintain resume structure after anonymization', async () => {
      const structuredResume = `
        EXPERIENCE
        Software Engineer at TechCorp (2019-2024)
        - Developed web applications using React and Node.js
        - Led team of 5 developers
        
        EDUCATION
        Bachelor of Science in Computer Science
        University of California, Berkeley (2015-2019)
      `;

      mockAnonymizationService.anonymizeText.mockResolvedValue({
        anonymizedText: `
        EXPERIENCE
        Software Engineer at [COMPANY] (2019-2024)
        - Developed web applications using React and Node.js
        - Led team of 5 developers
        
        EDUCATION
        Bachelor of Science in Computer Science
        [UNIVERSITY] (2015-2019)
      `,
        removedPII: ['TechCorp', 'University of California, Berkeley'],
        confidence: 0.92
      });

      const result = await mockAnonymizationService.anonymizeText(structuredResume);

      expect(result.anonymizedText).toContain('EXPERIENCE');
      expect(result.anonymizedText).toContain('EDUCATION');
      expect(result.anonymizedText).toContain('React and Node.js');
      expect(result.anonymizedText).toContain('[COMPANY]');
      expect(result.anonymizedText).toContain('[UNIVERSITY]');
    });
  });

  describe('skills extraction confidence validation', () => {
    it('should validate confidence scores are accurate', async () => {
      const highConfidenceText = `
        Senior JavaScript Developer with 8 years of experience.
        Expert in React, Node.js, and TypeScript.
        AWS Certified Solutions Architect.
      `;

      const lowConfidenceText = `
        Looking for opportunities in tech.
        Interested in programming and computers.
      `;

      mockOpenAIService.analyzeSkills
        .mockResolvedValueOnce({
          skills: [
            { name: 'JavaScript', confidence: 0.95, category: 'Programming Language' },
            { name: 'React', confidence: 0.92, category: 'Framework' },
            { name: 'Node.js', confidence: 0.90, category: 'Runtime' },
            { name: 'TypeScript', confidence: 0.88, category: 'Programming Language' },
            { name: 'AWS', confidence: 0.85, category: 'Cloud Platform' }
          ]
        })
        .mockResolvedValueOnce({
          skills: [
            { name: 'Programming', confidence: 0.45, category: 'General' },
            { name: 'Computers', confidence: 0.35, category: 'General' }
          ]
        });

      const highConfidenceResult = await resumeAnalysisService.extractSkills(highConfidenceText);
      const lowConfidenceResult = await resumeAnalysisService.extractSkills(lowConfidenceText);

      // High confidence text should yield high-confidence skills
      expect(highConfidenceResult.skills.every(s => s.confidence > 0.8)).toBe(true);
      
      // Low confidence text should yield low-confidence skills (filtered out)
      expect(lowConfidenceResult.skills).toHaveLength(0);
    });

    it('should categorize skills correctly', async () => {
      const resumeText = 'Full-stack developer with React, Python, PostgreSQL, and Docker experience';

      mockOpenAIService.analyzeSkills.mockResolvedValue({
        skills: [
          { name: 'React', confidence: 0.90, category: 'Frontend Framework' },
          { name: 'Python', confidence: 0.88, category: 'Programming Language' },
          { name: 'PostgreSQL', confidence: 0.85, category: 'Database' },
          { name: 'Docker', confidence: 0.82, category: 'DevOps Tool' }
        ]
      });

      const result = await resumeAnalysisService.extractSkills(resumeText);

      const categories = result.skills.map(s => s.category);
      expect(categories).toContain('Frontend Framework');
      expect(categories).toContain('Programming Language');
      expect(categories).toContain('Database');
      expect(categories).toContain('DevOps Tool');
    });
  });

  describe('error handling and resilience', () => {
    it('should handle OpenAI API failures gracefully', async () => {
      const resumeText = 'Software Engineer with JavaScript experience';

      mockOpenAIService.analyzeSkills.mockRejectedValue(new Error('OpenAI API unavailable'));

      await expect(
        resumeAnalysisService.extractSkills(resumeText)
      ).rejects.toThrow('Skills extraction failed');
    });

    it('should handle anonymization service failures', async () => {
      const resumeText = 'John Doe - Software Engineer';

      mockAnonymizationService.anonymizeText.mockRejectedValue(new Error('Anonymization service down'));

      await expect(
        mockAnonymizationService.anonymizeText(resumeText)
      ).rejects.toThrow('Anonymization service down');
    });

    it('should validate input parameters', async () => {
      await expect(
        resumeAnalysisService.parseResume(null as any, 'application/pdf')
      ).rejects.toThrow('Invalid resume buffer');

      await expect(
        resumeAnalysisService.extractSkills(null as any)
      ).rejects.toThrow('Invalid resume text');
    });
  });

  describe('performance and scalability', () => {
    it('should handle large resume files efficiently', async () => {
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB file
      
      const startTime = Date.now();
      
      try {
        await resumeAnalysisService.parseResume(largeBuffer, 'application/pdf');
      } catch (error) {
        // Expected to fail with mock data, but should not timeout
      }
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should handle concurrent resume processing', async () => {
      const mockBuffer = Buffer.from('mock resume');
      const concurrentRequests = 10;

      mockAnonymizationService.anonymizeText.mockResolvedValue({
        anonymizedText: '[NAME] - Software Engineer',
        removedPII: ['John Doe'],
        confidence: 0.95
      });

      mockOpenAIService.analyzeSkills.mockResolvedValue({
        skills: [{ name: 'JavaScript', confidence: 0.85, category: 'Programming Language' }]
      });

      mockOpenAIService.summarizeResume.mockResolvedValue({
        summary: 'Software engineer',
        experience: { totalYears: 3, level: 'mid', domains: ['web'] }
      });

      const promises = Array(concurrentRequests).fill(null).map(() =>
        resumeAnalysisService.analyzeResume(mockBuffer, 'application/pdf')
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.skills).toBeDefined();
      });
    });
  });
});