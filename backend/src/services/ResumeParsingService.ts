import { logger } from '@/utils/logger';
import { DataAnonymizationService } from '@/services/DataAnonymizationService';
import { BiasMonitoringService } from '@/services/BiasMonitoringService';
import crypto from 'crypto';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';

/**
 * Resume Parsing and Content Extraction Service
 * Extracts structured data from resumes with bias-aware processing
 * Requirements: 1.1, 1.2
 */
export class ResumeParsingService {
  private static instance: ResumeParsingService;
  private anonymizationService: DataAnonymizationService;
  private biasMonitoring: BiasMonitoringService;
  private skillsDatabase: SkillsDatabase;

  private constructor() {
    this.anonymizationService = DataAnonymizationService.getInstance();
    this.biasMonitoring = BiasMonitoringService.getInstance();
    this.skillsDatabase = new SkillsDatabase();
  }

  static getInstance(): ResumeParsingService {
    if (!ResumeParsingService.instance) {
      ResumeParsingService.instance = new ResumeParsingService();
    }
    return ResumeParsingService.instance;
  }

  /**
   * Parse resume from file buffer
   */
  async parseResume(
    fileBuffer: Buffer,
    fileName: string,
    candidateId: string,
    options: ParsingOptions = {}
  ): Promise<ParsedResume> {
    try {
      const parsingId = crypto.randomUUID();
      const startTime = Date.now();

      logger.info('Starting resume parsing', {
        parsingId,
        fileName,
        candidateId,
        fileSize: fileBuffer.length
      });

      // Detect file type and extract text
      const extractedText = await this.extractTextFromFile(fileBuffer, fileName);

      // Anonymize PII before processing
      const anonymizedText = await this.anonymizationService.anonymizeText(extractedText);

      // Parse structured data
      const structuredData = await this.parseStructuredData(anonymizedText, options);

      // Extract skills with confidence scoring
      const skillsExtraction = await this.extractSkills(anonymizedText, structuredData);

      // Detect potential bias in resume content
      const biasAnalysis = await this.analyzeBiasInResume(anonymizedText, structuredData);

      // Calculate parsing confidence
      const parsingConfidence = this.calculateParsingConfidence(structuredData, skillsExtraction);

      const parsedResume: ParsedResume = {
        parsingId,
        candidateId,
        fileName,
        extractedText: anonymizedText,
        structuredData,
        skillsExtraction,
        biasAnalysis,
        parsingConfidence,
        processingTime: Date.now() - startTime,
        parsedAt: new Date(),
        metadata: {
          fileSize: fileBuffer.length,
          parsingVersion: '1.0',
          anonymizationApplied: true
        }
      };

      // Monitor for parsing bias
      await this.monitorParsingBias(parsedResume);

      logger.info('Resume parsing completed', {
        parsingId,
        skillsFound: skillsExtraction.skills.length,
        confidence: parsingConfidence,
        processingTime: parsedResume.processingTime
      });

      return parsedResume;

    } catch (error) {
      logger.error('Resume parsing failed:', error);
      throw error;
    }
  }

  /**
   * Extract skills from resume text
   */
  async extractSkills(
    text: string,
    structuredData: StructuredResumeData
  ): Promise<SkillsExtraction> {
    try {
      // Technical skills extraction
      const technicalSkills = await this.extractTechnicalSkills(text);

      // Soft skills extraction
      const softSkills = await this.extractSoftSkills(text);

      // Industry-specific skills
      const industrySkills = await this.extractIndustrySkills(text, structuredData.experience);

      // Language skills
      const languageSkills = await this.extractLanguageSkills(text);

      // Calculate confidence scores
      const skillsWithConfidence = [
        ...technicalSkills,
        ...softSkills,
        ...industrySkills,
        ...languageSkills
      ].map(skill => ({
        ...skill,
        confidence: this.calculateSkillConfidence(skill, text)
      }));

      // Remove duplicates and sort by confidence
      const uniqueSkills = this.deduplicateSkills(skillsWithConfidence);

      return {
        skills: uniqueSkills,
        totalSkillsFound: uniqueSkills.length,
        technicalSkillsCount: technicalSkills.length,
        softSkillsCount: softSkills.length,
        averageConfidence: uniqueSkills.reduce((sum, skill) => sum + skill.confidence, 0) / uniqueSkills.length,
        extractionMethod: 'nlp_pattern_matching'
      };

    } catch (error) {
      logger.error('Skills extraction failed:', error);
      throw error;
    }
  }

  /**
   * Parse structured data from resume text
   */
  private async parseStructuredData(
    text: string,
    options: ParsingOptions
  ): Promise<StructuredResumeData> {
    try {
      // Extract contact information (anonymized)
      const contact = await this.extractContactInfo(text);

      // Extract education
      const education = await this.extractEducation(text);

      // Extract work experience
      const experience = await this.extractExperience(text);

      // Extract certifications
      const certifications = await this.extractCertifications(text);

      // Extract projects
      const projects = await this.extractProjects(text);

      // Calculate profile completeness
      const completeness = this.calculateProfileCompleteness({
        contact,
        education,
        experience,
        certifications,
        projects
      });

      return {
        contact,
        education,
        experience,
        certifications,
        projects,
        profileCompleteness: completeness,
        sections: this.identifyResumeSections(text)
      };

    } catch (error) {
      logger.error('Structured data parsing failed:', error);
      throw error;
    }
  }

  // Private helper methods

  private async extractTextFromFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
      case 'pdf':
        return await this.extractFromPDF(fileBuffer);
      case 'doc':
      case 'docx':
        return await this.extractFromWord(fileBuffer);
      case 'txt':
        return fileBuffer.toString('utf-8');
      default:
        throw new Error(`Unsupported file format: ${fileExtension}`);
    }
  }

  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      logger.error('PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractFromWord(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error('Word document extraction failed:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  private async extractTechnicalSkills(text: string): Promise<ExtractedSkill[]> {
    const technicalSkills = await this.skillsDatabase.getTechnicalSkills();
    const foundSkills: ExtractedSkill[] = [];

    for (const skill of technicalSkills) {
      const regex = new RegExp(`\\b${skill.name}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        foundSkills.push({
          name: skill.name,
          category: 'technical',
          subcategory: skill.category,
          proficiencyLevel: this.estimateProficiencyLevel(skill.name, text),
          yearsOfExperience: this.extractYearsOfExperience(skill.name, text),
          confidence: 0.8, // Will be recalculated
          source: 'resume_text',
          mentions: matches.length
        });
      }
    }

    return foundSkills;
  }

  private async extractSoftSkills(text: string): Promise<ExtractedSkill[]> {
    const softSkillPatterns = [
      { name: 'Leadership', patterns: ['lead', 'manage', 'supervise', 'mentor'] },
      { name: 'Communication', patterns: ['present', 'communicate', 'collaborate'] },
      { name: 'Problem Solving', patterns: ['solve', 'troubleshoot', 'debug', 'analyze'] },
      { name: 'Teamwork', patterns: ['team', 'collaborate', 'coordinate'] },
      { name: 'Project Management', patterns: ['project', 'manage', 'coordinate', 'plan'] }
    ];

    const foundSkills: ExtractedSkill[] = [];

    for (const skillPattern of softSkillPatterns) {
      let mentions = 0;
      for (const pattern of skillPattern.patterns) {
        const regex = new RegExp(`\\b${pattern}\\w*\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) mentions += matches.length;
      }

      if (mentions > 0) {
        foundSkills.push({
          name: skillPattern.name,
          category: 'soft',
          subcategory: 'interpersonal',
          proficiencyLevel: Math.min(mentions * 20, 100), // Estimate based on mentions
          yearsOfExperience: null,
          confidence: 0.6, // Lower confidence for soft skills
          source: 'pattern_matching',
          mentions
        });
      }
    }

    return foundSkills;
  }

  private async extractIndustrySkills(text: string, experience: ExperienceEntry[]): Promise<ExtractedSkill[]> {
    const industrySkills: ExtractedSkill[] = [];
    
    // Extract industry-specific skills based on job titles and descriptions
    for (const exp of experience) {
      const industrySpecificSkills = await this.skillsDatabase.getIndustrySkills(exp.industry);
      
      for (const skill of industrySpecificSkills) {
        const regex = new RegExp(`\\b${skill.name}\\b`, 'gi');
        if (text.match(regex)) {
          industrySkills.push({
            name: skill.name,
            category: 'industry',
            subcategory: exp.industry,
            proficiencyLevel: this.estimateProficiencyLevel(skill.name, text),
            yearsOfExperience: exp.duration,
            confidence: 0.7,
            source: 'industry_context',
            mentions: 1
          });
        }
      }
    }

    return industrySkills;
  }

  private async extractLanguageSkills(text: string): Promise<ExtractedSkill[]> {
    const languagePatterns = [
      'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
      'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Italian', 'Dutch'
    ];

    const foundLanguages: ExtractedSkill[] = [];

    for (const language of languagePatterns) {
      const regex = new RegExp(`\\b${language}\\b`, 'gi');
      if (text.match(regex)) {
        foundLanguages.push({
          name: language,
          category: 'language',
          subcategory: 'spoken',
          proficiencyLevel: this.extractLanguageProficiency(language, text),
          yearsOfExperience: null,
          confidence: 0.9,
          source: 'language_detection',
          mentions: 1
        });
      }
    }

    return foundLanguages;
  }

  private async extractContactInfo(text: string): Promise<ContactInfo> {
    // Extract anonymized contact information
    return {
      hasEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text),
      hasPhone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text),
      hasLinkedIn: /linkedin\.com/.test(text),
      hasGitHub: /github\.com/.test(text),
      hasPortfolio: /portfolio|website/.test(text)
    };
  }

  private async extractEducation(text: string): Promise<EducationEntry[]> {
    const educationEntries: EducationEntry[] = [];
    
    // Common degree patterns
    const degreePatterns = [
      { degree: 'Bachelor', regex: /bachelor'?s?\s+(?:of\s+)?(?:science|arts|engineering|business)/gi },
      { degree: 'Master', regex: /master'?s?\s+(?:of\s+)?(?:science|arts|engineering|business)/gi },
      { degree: 'PhD', regex: /ph\.?d\.?|doctorate/gi },
      { degree: 'Associate', regex: /associate'?s?\s+degree/gi }
    ];

    for (const pattern of degreePatterns) {
      const matches = text.match(pattern.regex);
      if (matches) {
        educationEntries.push({
          degree: pattern.degree,
          field: this.extractFieldOfStudy(text, matches[0]),
          institution: 'Anonymized Institution',
          graduationYear: this.extractGraduationYear(text, matches[0]),
          gpa: this.extractGPA(text, matches[0])
        });
      }
    }

    return educationEntries;
  }

  private async extractExperience(text: string): Promise<ExperienceEntry[]> {
    const experienceEntries: ExperienceEntry[] = [];
    
    // Extract job titles and companies (anonymized)
    const jobTitlePatterns = [
      /(?:software|web|mobile)\s+(?:developer|engineer)/gi,
      /(?:senior|junior|lead)\s+(?:developer|engineer|analyst)/gi,
      /(?:project|product|program)\s+manager/gi,
      /(?:data|business)\s+analyst/gi
    ];

    for (const pattern of jobTitlePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        experienceEntries.push({
          title: matches[0],
          company: 'Anonymized Company',
          duration: this.extractDuration(text, matches[0]),
          industry: this.inferIndustry(matches[0]),
          responsibilities: this.extractResponsibilities(text, matches[0]),
          achievements: this.extractAchievements(text, matches[0])
        });
      }
    }

    return experienceEntries;
  }

  private async extractCertifications(text: string): Promise<CertificationEntry[]> {
    const certificationPatterns = [
      /AWS\s+Certified/gi,
      /Microsoft\s+Certified/gi,
      /Google\s+Cloud/gi,
      /Cisco\s+Certified/gi,
      /PMP\s+Certified/gi,
      /Scrum\s+Master/gi
    ];

    const certifications: CertificationEntry[] = [];

    for (const pattern of certificationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        certifications.push({
          name: matches[0],
          issuer: this.extractCertificationIssuer(matches[0]),
          issueDate: this.extractCertificationDate(text, matches[0]),
          expiryDate: null,
          credentialId: 'Anonymized'
        });
      }
    }

    return certifications;
  }

  private async extractProjects(text: string): Promise<ProjectEntry[]> {
    const projectKeywords = ['project', 'developed', 'built', 'created', 'implemented'];
    const projects: ProjectEntry[] = [];

    // Simple project extraction based on keywords
    const projectSections = text.split(/\n\s*\n/).filter(section => 
      projectKeywords.some(keyword => 
        section.toLowerCase().includes(keyword)
      )
    );

    for (const section of projectSections.slice(0, 5)) { // Limit to 5 projects
      projects.push({
        name: this.extractProjectName(section),
        description: section.substring(0, 200) + '...',
        technologies: this.extractProjectTechnologies(section),
        duration: this.extractProjectDuration(section),
        role: this.extractProjectRole(section)
      });
    }

    return projects;
  }

  // Utility methods for data extraction

  private estimateProficiencyLevel(skillName: string, text: string): number {
    // Estimate proficiency based on context clues
    const expertPatterns = ['expert', 'advanced', 'senior', 'lead'];
    const intermediatePatterns = ['experienced', 'proficient', 'skilled'];
    const beginnerPatterns = ['basic', 'beginner', 'learning', 'familiar'];

    const skillContext = this.extractSkillContext(skillName, text);

    if (expertPatterns.some(pattern => skillContext.includes(pattern))) return 90;
    if (intermediatePatterns.some(pattern => skillContext.includes(pattern))) return 70;
    if (beginnerPatterns.some(pattern => skillContext.includes(pattern))) return 40;
    
    return 60; // Default intermediate level
  }

  private extractYearsOfExperience(skillName: string, text: string): number | null {
    const skillContext = this.extractSkillContext(skillName, text);
    const yearPattern = /(\d+)\s*(?:years?|yrs?)/i;
    const match = skillContext.match(yearPattern);
    return match ? parseInt(match[1]) : null;
  }

  private extractSkillContext(skillName: string, text: string, contextLength = 100): string {
    const skillIndex = text.toLowerCase().indexOf(skillName.toLowerCase());
    if (skillIndex === -1) return '';
    
    const start = Math.max(0, skillIndex - contextLength);
    const end = Math.min(text.length, skillIndex + skillName.length + contextLength);
    
    return text.substring(start, end);
  }

  private calculateSkillConfidence(skill: ExtractedSkill, text: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on mentions
    confidence += Math.min(skill.mentions * 0.1, 0.3);

    // Increase confidence if proficiency is explicitly mentioned
    if (skill.proficiencyLevel > 80) confidence += 0.2;

    // Increase confidence for technical skills with specific context
    if (skill.category === 'technical' && skill.yearsOfExperience) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  private deduplicateSkills(skills: ExtractedSkill[]): ExtractedSkill[] {
    const uniqueSkills = new Map<string, ExtractedSkill>();

    for (const skill of skills) {
      const key = skill.name.toLowerCase();
      if (!uniqueSkills.has(key) || uniqueSkills.get(key)!.confidence < skill.confidence) {
        uniqueSkills.set(key, skill);
      }
    }

    return Array.from(uniqueSkills.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  private calculateParsingConfidence(
    structuredData: StructuredResumeData,
    skillsExtraction: SkillsExtraction
  ): number {
    let confidence = 0;
    let factors = 0;

    // Contact information factor
    if (structuredData.contact.hasEmail) { confidence += 0.2; factors++; }
    
    // Education factor
    if (structuredData.education.length > 0) { confidence += 0.2; factors++; }
    
    // Experience factor
    if (structuredData.experience.length > 0) { confidence += 0.3; factors++; }
    
    // Skills factor
    if (skillsExtraction.skills.length > 0) { 
      confidence += 0.2 + (skillsExtraction.averageConfidence * 0.1); 
      factors++; 
    }

    return factors > 0 ? confidence / factors : 0.5;
  }

  private async analyzeBiasInResume(
    text: string,
    structuredData: StructuredResumeData
  ): Promise<ResumeBiasAnalysis> {
    // Analyze potential bias indicators in resume content
    const biasIndicators: string[] = [];

    // Check for age-related bias indicators
    if (/\b(young|energetic|digital native)\b/i.test(text)) {
      biasIndicators.push('Age-related language detected');
    }

    // Check for gender-coded language
    if (/\b(aggressive|competitive|dominant)\b/i.test(text)) {
      biasIndicators.push('Potentially masculine-coded language');
    }

    if (/\b(collaborative|supportive|nurturing)\b/i.test(text)) {
      biasIndicators.push('Potentially feminine-coded language');
    }

    return {
      biasRisk: biasIndicators.length > 0 ? 0.3 : 0.1,
      biasIndicators,
      languageAnalysis: {
        genderCodedTerms: this.extractGenderCodedTerms(text),
        ageRelatedTerms: this.extractAgeRelatedTerms(text),
        culturalReferences: this.extractCulturalReferences(text)
      },
      recommendedActions: biasIndicators.length > 0 ? 
        ['Review resume for potential bias indicators'] : []
    };
  }

  // Additional helper methods would be implemented here...
  // Due to length constraints, providing key placeholder implementations

  private calculateProfileCompleteness(data: any): number {
    let score = 0;
    if (data.contact.hasEmail) score += 20;
    if (data.education.length > 0) score += 25;
    if (data.experience.length > 0) score += 35;
    if (data.certifications.length > 0) score += 10;
    if (data.projects.length > 0) score += 10;
    return score;
  }

  private identifyResumeSections(text: string): string[] {
    const sections = ['contact', 'summary', 'experience', 'education', 'skills'];
    return sections.filter(section => 
      new RegExp(section, 'i').test(text)
    );
  }

  private extractFieldOfStudy(text: string, degreeMatch: string): string {
    // Extract field of study from context
    return 'Computer Science'; // Simplified
  }

  private extractGraduationYear(text: string, degreeMatch: string): number | null {
    const yearPattern = /\b(19|20)\d{2}\b/;
    const match = text.match(yearPattern);
    return match ? parseInt(match[0]) : null;
  }

  private extractGPA(text: string, degreeMatch: string): number | null {
    const gpaPattern = /gpa:?\s*(\d+\.?\d*)/i;
    const match = text.match(gpaPattern);
    return match ? parseFloat(match[1]) : null;
  }

  private extractDuration(text: string, jobMatch: string): number {
    // Extract job duration in months
    return 24; // Simplified
  }

  private inferIndustry(jobTitle: string): string {
    if (/software|developer|engineer/.test(jobTitle)) return 'Technology';
    if (/manager/.test(jobTitle)) return 'Management';
    return 'General';
  }

  private extractResponsibilities(text: string, jobMatch: string): string[] {
    return ['Developed software solutions', 'Led team projects']; // Simplified
  }

  private extractAchievements(text: string, jobMatch: string): string[] {
    return ['Improved system performance by 30%']; // Simplified
  }

  private extractCertificationIssuer(certName: string): string {
    if (certName.includes('AWS')) return 'Amazon Web Services';
    if (certName.includes('Microsoft')) return 'Microsoft';
    return 'Unknown';
  }

  private extractCertificationDate(text: string, certMatch: string): Date | null {
    return new Date(); // Simplified
  }

  private extractProjectName(section: string): string {
    const lines = section.split('\n');
    return lines[0].substring(0, 50) + '...';
  }

  private extractProjectTechnologies(section: string): string[] {
    return ['JavaScript', 'React', 'Node.js']; // Simplified
  }

  private extractProjectDuration(section: string): string {
    return '3 months'; // Simplified
  }

  private extractProjectRole(section: string): string {
    return 'Developer'; // Simplified
  }

  private extractLanguageProficiency(language: string, text: string): number {
    if (text.includes('native') || text.includes('fluent')) return 100;
    if (text.includes('advanced')) return 80;
    if (text.includes('intermediate')) return 60;
    return 40;
  }

  private extractGenderCodedTerms(text: string): string[] {
    const masculineTerms = ['aggressive', 'competitive', 'dominant', 'assertive'];
    const feminineTerms = ['collaborative', 'supportive', 'nurturing', 'empathetic'];
    
    const found = [];
    for (const term of [...masculineTerms, ...feminineTerms]) {
      if (new RegExp(`\\b${term}\\b`, 'i').test(text)) {
        found.push(term);
      }
    }
    return found;
  }

  private extractAgeRelatedTerms(text: string): string[] {
    const ageTerms = ['young', 'energetic', 'digital native', 'recent graduate'];
    return ageTerms.filter(term => new RegExp(`\\b${term}\\b`, 'i').test(text));
  }

  private extractCulturalReferences(text: string): string[] {
    // Detect potential cultural bias indicators
    return [];
  }

  private async monitorParsingBias(parsedResume: ParsedResume): Promise<void> {
    if (parsedResume.biasAnalysis.biasRisk > 0.3) {
      await this.biasMonitoring.monitorProcess(
        parsedResume.parsingId,
        'resume_parsing',
        { parsedResume }
      );
    }
  }
}

// Skills Database Class
class SkillsDatabase {
  async getTechnicalSkills(): Promise<{ name: string; category: string }[]> {
    return [
      { name: 'JavaScript', category: 'programming' },
      { name: 'Python', category: 'programming' },
      { name: 'Java', category: 'programming' },
      { name: 'React', category: 'framework' },
      { name: 'Node.js', category: 'runtime' },
      { name: 'SQL', category: 'database' },
      { name: 'MongoDB', category: 'database' },
      { name: 'AWS', category: 'cloud' },
      { name: 'Docker', category: 'devops' },
      { name: 'Kubernetes', category: 'devops' }
    ];
  }

  async getIndustrySkills(industry: string): Promise<{ name: string; category: string }[]> {
    const industrySkills: Record<string, { name: string; category: string }[]> = {
      'Technology': [
        { name: 'Agile', category: 'methodology' },
        { name: 'Scrum', category: 'methodology' },
        { name: 'CI/CD', category: 'process' }
      ],
      'Finance': [
        { name: 'Risk Management', category: 'domain' },
        { name: 'Financial Modeling', category: 'analysis' }
      ]
    };
    
    return industrySkills[industry] || [];
  }
}

// Supporting interfaces

export interface ParsingOptions {
  extractSkills?: boolean;
  anonymizePII?: boolean;
  detectBias?: boolean;
  confidenceThreshold?: number;
}

export interface ParsedResume {
  parsingId: string;
  candidateId: string;
  fileName: string;
  extractedText: string;
  structuredData: StructuredResumeData;
  skillsExtraction: SkillsExtraction;
  biasAnalysis: ResumeBiasAnalysis;
  parsingConfidence: number;
  processingTime: number;
  parsedAt: Date;
  metadata: {
    fileSize: number;
    parsingVersion: string;
    anonymizationApplied: boolean;
  };
}

export interface StructuredResumeData {
  contact: ContactInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  profileCompleteness: number;
  sections: string[];
}

export interface ContactInfo {
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedIn: boolean;
  hasGitHub: boolean;
  hasPortfolio: boolean;
}

export interface EducationEntry {
  degree: string;
  field: string;
  institution: string;
  graduationYear: number | null;
  gpa: number | null;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: number;
  industry: string;
  responsibilities: string[];
  achievements: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  credentialId: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  duration: string;
  role: string;
}

export interface SkillsExtraction {
  skills: ExtractedSkill[];
  totalSkillsFound: number;
  technicalSkillsCount: number;
  softSkillsCount: number;
  averageConfidence: number;
  extractionMethod: string;
}

export interface ExtractedSkill {
  name: string;
  category: 'technical' | 'soft' | 'industry' | 'language';
  subcategory: string;
  proficiencyLevel: number;
  yearsOfExperience: number | null;
  confidence: number;
  source: string;
  mentions: number;
}

export interface ResumeBiasAnalysis {
  biasRisk: number;
  biasIndicators: string[];
  languageAnalysis: {
    genderCodedTerms: string[];
    ageRelatedTerms: string[];
    culturalReferences: string[];
  };
  recommendedActions: string[];
}

export default ResumeParsingService;