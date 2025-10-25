import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import crypto from 'crypto';

/**
 * Skills Gap Analysis and Learning Path Recommendation Service
 * Requirements: 2.4, 5.3
 */
export class SkillsGapAnalysisService {
  private static instance: SkillsGapAnalysisService;

  static getInstance(): SkillsGapAnalysisService {
    if (!SkillsGapAnalysisService.instance) {
      SkillsGapAnalysisService.instance = new SkillsGapAnalysisService();
    }
    return SkillsGapAnalysisService.instance;
  }

  /**
   * Analyze skills gaps for a candidate against job requirements
   */
  async analyzeSkillsGaps(
    candidateId: string,
    jobId: string,
    candidateSkills: CandidateSkill[],
    jobRequirements: JobSkillRequirement[]
  ): Promise<SkillsGapAnalysis> {
    try {
      const analysisId = crypto.randomUUID();
      const startTime = Date.now();

      logger.info('Starting skills gap analysis', {
        analysisId,
        candidateId,
        jobId
      });

      // Identify skill gaps
      const skillGaps = this.identifySkillGaps(candidateSkills, jobRequirements);

      // Analyze transferable skills
      const transferableSkills = this.analyzeTransferableSkills(candidateSkills, jobRequirements);

      // Generate learning paths
      const learningPaths = await this.generateLearningPaths(skillGaps);

      // Calculate scores
      const overallGapScore = this.calculateOverallGapScore(skillGaps);
      const readinessScore = this.calculateReadinessScore(candidateSkills, jobRequirements);

      const analysis: SkillsGapAnalysis = {
        analysisId,
        candidateId,
        jobId,
        skillGaps,
        transferableSkills,
        learningPaths,
        overallGapScore,
        readinessScore,
        recommendations: this.generateRecommendations(skillGaps),
        processingTime: Date.now() - startTime,
        analysisTimestamp: new Date()
      };

      return analysis;

    } catch (error) {
      logger.error('Skills gap analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate personalized learning path
   */
  async generatePersonalizedLearningPath(
    candidateId: string,
    targetSkills: string[],
    currentSkills: CandidateSkill[]
  ): Promise<PersonalizedLearningPath> {
    try {
      const pathId = crypto.randomUUID();

      const learningModules = await this.createLearningModules(targetSkills, currentSkills);
      const timeline = this.createLearningTimeline(learningModules);
      const milestones = this.createLearningMilestones(learningModules);

      return {
        pathId,
        candidateId,
        targetSkills,
        learningModules,
        timeline,
        milestones,
        estimatedDuration: this.calculateEstimatedDuration(learningModules),
        createdAt: new Date()
      };

    } catch (error) {
      logger.error('Learning path generation failed:', error);
      throw error;
    }
  }

  // Private helper methods

  private identifySkillGaps(
    candidateSkills: CandidateSkill[],
    jobRequirements: JobSkillRequirement[]
  ): SkillGap[] {
    const gaps: SkillGap[] = [];

    for (const requirement of jobRequirements) {
      const candidateSkill = candidateSkills.find(
        skill => skill.name.toLowerCase() === requirement.skillName.toLowerCase()
      );

      if (!candidateSkill) {
        gaps.push({
          skillName: requirement.skillName,
          category: requirement.category,
          requiredLevel: requirement.minimumLevel,
          currentLevel: 0,
          gapSize: requirement.minimumLevel,
          gapType: 'missing',
          importance: requirement.importance,
          estimatedTimeToClose: this.estimateTimeToClose(requirement.skillName, 0, requirement.minimumLevel)
        });
      } else if (candidateSkill.proficiencyLevel < requirement.minimumLevel) {
        gaps.push({
          skillName: requirement.skillName,
          category: requirement.category,
          requiredLevel: requirement.minimumLevel,
          currentLevel: candidateSkill.proficiencyLevel,
          gapSize: requirement.minimumLevel - candidateSkill.proficiencyLevel,
          gapType: 'insufficient',
          importance: requirement.importance,
          estimatedTimeToClose: this.estimateTimeToClose(
            requirement.skillName,
            candidateSkill.proficiencyLevel,
            requirement.minimumLevel
          )
        });
      }
    }

    return gaps;
  }

  private analyzeTransferableSkills(
    candidateSkills: CandidateSkill[],
    jobRequirements: JobSkillRequirement[]
  ): TransferableSkill[] {
    const transferableSkills: TransferableSkill[] = [];

    // Simplified transferability analysis
    for (const candidateSkill of candidateSkills) {
      for (const requirement of jobRequirements) {
        const transferability = this.calculateTransferability(candidateSkill.name, requirement.skillName);
        
        if (transferability > 0.3) {
          transferableSkills.push({
            sourceSkill: candidateSkill.name,
            targetSkill: requirement.skillName,
            transferabilityScore: transferability,
            currentProficiency: candidateSkill.proficiencyLevel,
            projectedProficiency: candidateSkill.proficiencyLevel * transferability
          });
        }
      }
    }

    return transferableSkills;
  }

  private async generateLearningPaths(skillGaps: SkillGap[]): Promise<LearningPath[]> {
    const paths: LearningPath[] = [];

    // Group by category
    const categories = [...new Set(skillGaps.map(gap => gap.category))];

    for (const category of categories) {
      const categoryGaps = skillGaps.filter(gap => gap.category === category);
      
      paths.push({
        pathId: crypto.randomUUID(),
        name: `${category} Skills Development`,
        category,
        skillGaps: categoryGaps,
        estimatedDuration: categoryGaps.reduce((sum, gap) => sum + gap.estimatedTimeToClose, 0),
        difficulty: this.calculatePathDifficulty(categoryGaps),
        resources: await this.getResourcesForSkills(categoryGaps.map(gap => gap.skillName))
      });
    }

    return paths;
  }

  private calculateTransferability(sourceSkill: string, targetSkill: string): number {
    // Simplified transferability calculation
    const skillSimilarity = this.calculateSkillSimilarity(sourceSkill, targetSkill);
    return skillSimilarity;
  }

  private calculateSkillSimilarity(skill1: string, skill2: string): number {
    // Basic similarity based on string matching and predefined relationships
    if (skill1.toLowerCase() === skill2.toLowerCase()) return 1.0;
    
    // Check for common keywords
    const words1 = skill1.toLowerCase().split(/\s+/);
    const words2 = skill2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private estimateTimeToClose(skillName: string, currentLevel: number, targetLevel: number): number {
    // Simplified time estimation (in weeks)
    const levelDifference = targetLevel - currentLevel;
    const baseTimePerLevel = 4; // 4 weeks per proficiency level
    return levelDifference * baseTimePerLevel;
  }

  private calculateOverallGapScore(skillGaps: SkillGap[]): number {
    if (skillGaps.length === 0) return 0;
    
    const totalGapSize = skillGaps.reduce((sum, gap) => sum + gap.gapSize, 0);
    const maxPossibleGap = skillGaps.length * 100; // Assuming max proficiency is 100
    
    return (totalGapSize / maxPossibleGap) * 100;
  }

  private calculateReadinessScore(
    candidateSkills: CandidateSkill[],
    jobRequirements: JobSkillRequirement[]
  ): number {
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const requirement of jobRequirements) {
      const weight = this.getImportanceWeight(requirement.importance);
      totalWeight += weight;

      const candidateSkill = candidateSkills.find(
        skill => skill.name.toLowerCase() === requirement.skillName.toLowerCase()
      );

      if (candidateSkill && candidateSkill.proficiencyLevel >= requirement.minimumLevel) {
        matchedWeight += weight;
      }
    }

    return totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
  }

  private getImportanceWeight(importance: string): number {
    const weights = {
      'critical': 1.0,
      'high': 0.8,
      'medium': 0.6,
      'low': 0.4
    };
    return weights[importance as keyof typeof weights] || 0.5;
  }

  private generateRecommendations(skillGaps: SkillGap[]): string[] {
    const recommendations: string[] = [];

    const criticalGaps = skillGaps.filter(gap => gap.importance === 'critical');
    if (criticalGaps.length > 0) {
      recommendations.push(`Focus on ${criticalGaps.length} critical skill gaps first`);
    }

    const quickWins = skillGaps.filter(gap => gap.estimatedTimeToClose <= 4);
    if (quickWins.length > 0) {
      recommendations.push(`Start with ${quickWins.length} skills that can be developed quickly`);
    }

    return recommendations;
  }

  private async createLearningModules(
    targetSkills: string[],
    currentSkills: CandidateSkill[]
  ): Promise<LearningModule[]> {
    const modules: LearningModule[] = [];

    for (const skill of targetSkills) {
      const currentSkill = currentSkills.find(cs => cs.name.toLowerCase() === skill.toLowerCase());
      const currentLevel = currentSkill?.proficiencyLevel || 0;

      modules.push({
        moduleId: crypto.randomUUID(),
        skillName: skill,
        currentLevel,
        targetLevel: 80, // Default target
        resources: await this.getResourcesForSkill(skill),
        estimatedDuration: this.estimateTimeToClose(skill, currentLevel, 80),
        prerequisites: []
      });
    }

    return modules;
  }

  private createLearningTimeline(modules: LearningModule[]): LearningTimeline {
    const startDate = new Date();
    const phases: TimelinePhase[] = [];
    let currentDate = new Date(startDate);

    for (const module of modules) {
      const endDate = new Date(currentDate.getTime() + module.estimatedDuration * 7 * 24 * 60 * 60 * 1000);
      
      phases.push({
        phaseId: crypto.randomUUID(),
        name: `Learn ${module.skillName}`,
        startDate: new Date(currentDate),
        endDate,
        modules: [module.moduleId],
        milestones: [`Complete ${module.skillName} training`]
      });

      currentDate = endDate;
    }

    return {
      timelineId: crypto.randomUUID(),
      startDate,
      endDate: currentDate,
      totalDuration: phases.reduce((sum, phase) => 
        sum + (phase.endDate.getTime() - phase.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000), 0
      ),
      phases
    };
  }

  private createLearningMilestones(modules: LearningModule[]): LearningMilestone[] {
    return modules.map((module, index) => ({
      milestoneId: crypto.randomUUID(),
      name: `${module.skillName} Proficiency`,
      description: `Achieve target proficiency in ${module.skillName}`,
      targetDate: new Date(Date.now() + (index + 1) * module.estimatedDuration * 7 * 24 * 60 * 60 * 1000),
      criteria: [`Score ${module.targetLevel}% or higher in ${module.skillName} assessment`],
      rewards: [`${module.skillName} certification`]
    }));
  }

  private calculateEstimatedDuration(modules: LearningModule[]): number {
    return modules.reduce((sum, module) => sum + module.estimatedDuration, 0);
  }

  private calculatePathDifficulty(skillGaps: SkillGap[]): 'beginner' | 'intermediate' | 'advanced' {
    const avgGapSize = skillGaps.reduce((sum, gap) => sum + gap.gapSize, 0) / skillGaps.length;
    
    if (avgGapSize <= 30) return 'beginner';
    if (avgGapSize <= 60) return 'intermediate';
    return 'advanced';
  }

  private async getResourcesForSkills(skillNames: string[]): Promise<LearningResource[]> {
    const resources: LearningResource[] = [];
    
    for (const skillName of skillNames) {
      resources.push(...await this.getResourcesForSkill(skillName));
    }
    
    return resources;
  }

  private async getResourcesForSkill(skillName: string): Promise<LearningResource[]> {
    // Simplified resource generation
    return [
      {
        resourceId: crypto.randomUUID(),
        title: `${skillName} Fundamentals`,
        type: 'course',
        provider: 'Online Learning Platform',
        duration: 20,
        difficulty: 'beginner',
        rating: 4.5,
        url: `https://example.com/courses/${skillName.toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        resourceId: crypto.randomUUID(),
        title: `Advanced ${skillName}`,
        type: 'course',
        provider: 'Professional Training',
        duration: 40,
        difficulty: 'advanced',
        rating: 4.7,
        url: `https://example.com/advanced/${skillName.toLowerCase().replace(/\s+/g, '-')}`
      }
    ];
  }
}

// Supporting interfaces

export interface CandidateSkill {
  name: string;
  proficiencyLevel: number;
  yearsOfExperience?: number;
  lastUsed?: Date;
  certifications?: string[];
}

export interface JobSkillRequirement {
  skillName: string;
  category: string;
  minimumLevel: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
  description?: string;
}

export interface SkillGap {
  skillName: string;
  category: string;
  requiredLevel: number;
  currentLevel: number;
  gapSize: number;
  gapType: 'missing' | 'insufficient';
  importance: string;
  estimatedTimeToClose: number;
}

export interface TransferableSkill {
  sourceSkill: string;
  targetSkill: string;
  transferabilityScore: number;
  currentProficiency: number;
  projectedProficiency: number;
}

export interface LearningPath {
  pathId: string;
  name: string;
  category: string;
  skillGaps: SkillGap[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  resources: LearningResource[];
}

export interface LearningResource {
  resourceId: string;
  title: string;
  type: 'course' | 'tutorial' | 'book' | 'certification' | 'project';
  provider: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  url: string;
}

export interface SkillsGapAnalysis {
  analysisId: string;
  candidateId: string;
  jobId: string;
  skillGaps: SkillGap[];
  transferableSkills: TransferableSkill[];
  learningPaths: LearningPath[];
  overallGapScore: number;
  readinessScore: number;
  recommendations: string[];
  processingTime: number;
  analysisTimestamp: Date;
}

export interface PersonalizedLearningPath {
  pathId: string;
  candidateId: string;
  targetSkills: string[];
  learningModules: LearningModule[];
  timeline: LearningTimeline;
  milestones: LearningMilestone[];
  estimatedDuration: number;
  createdAt: Date;
}

export interface LearningModule {
  moduleId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  resources: LearningResource[];
  estimatedDuration: number;
  prerequisites: string[];
}

export interface LearningTimeline {
  timelineId: string;
  startDate: Date;
  endDate: Date;
  totalDuration: number;
  phases: TimelinePhase[];
}

export interface TimelinePhase {
  phaseId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  modules: string[];
  milestones: string[];
}

export interface LearningMilestone {
  milestoneId: string;
  name: string;
  description: string;
  targetDate: Date;
  criteria: string[];
  rewards: string[];
}

export default SkillsGapAnalysisService;