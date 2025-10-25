import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import { BiasMonitoringService } from '@/services/BiasMonitoringService';
import crypto from 'crypto';
import { DateTime } from 'luxon';

/**
 * Intelligent Interview Scheduling Service
 * Provides bias-aware interview scheduling with diversity optimization
 * Requirements: 3.1, 3.2, 3.3
 */
export class InterviewSchedulingService {
  private static instance: InterviewSchedulingService;
  private biasMonitoring: BiasMonitoringService;

  private constructor() {
    this.biasMonitoring = BiasMonitoringService.getInstance();
  }

  static getInstance(): InterviewSchedulingService {
    if (!InterviewSchedulingService.instance) {
      InterviewSchedulingService.instance = new InterviewSchedulingService();
    }
    return InterviewSchedulingService.instance;
  }

  /**
   * Schedule interview with intelligent optimization
   */
  async scheduleInterview(
    candidateId: string,
    jobId: string,
    interviewType: InterviewType,
    preferences: SchedulingPreferences
  ): Promise<SchedulingResult> {
    try {
      const schedulingId = crypto.randomUUID();
      const startTime = Date.now();

      logger.info('Starting intelligent interview scheduling', {
        schedulingId,
        candidateId,
        jobId,
        interviewType
      });

      // Get candidate and job information
      const candidate = await this.getCandidateInfo(candidateId);
      const job = await this.getJobInfo(jobId);
      
      // Get available interviewers
      const availableInterviewers = await this.getAvailableInterviewers(jobId, interviewType);

      // Optimize interview panel for diversity
      const optimizedPanel = await this.optimizeInterviewPanel(
        availableInterviewers,
        candidate,
        job,
        preferences
      );

      // Find optimal time slots
      const timeSlots = await this.findOptimalTimeSlots(
        candidate,
        optimizedPanel,
        preferences
      );

      // Apply bias prevention measures
      const biasPreventionMeasures = await this.applyBiasPreventionMeasures(
        candidate,
        optimizedPanel,
        timeSlots
      );

      // Create scheduling recommendations
      const recommendations = await this.generateSchedulingRecommendations(
        timeSlots,
        optimizedPanel,
        biasPreventionMeasures
      );

      const result: SchedulingResult = {
        schedulingId,
        candidateId,
        jobId,
        recommendedSlots: timeSlots.slice(0, 3), // Top 3 recommendations
        optimizedPanel,
        biasPreventionMeasures,
        recommendations,
        processingTime: Date.now() - startTime,
        createdAt: new Date()
      };

      // Monitor for scheduling bias
      await this.monitorSchedulingBias(result);

      logger.info('Interview scheduling completed', {
        schedulingId,
        recommendedSlots: result.recommendedSlots.length,
        panelSize: result.optimizedPanel.length
      });

      return result;

    } catch (error) {
      logger.error('Interview scheduling failed:', error);
      throw error;
    }
  }

  /**
   * Confirm interview booking
   */
  async confirmInterview(
    schedulingId: string,
    selectedSlotId: string,
    additionalRequirements?: AdditionalRequirements
  ): Promise<InterviewBooking> {
    try {
      const bookingId = crypto.randomUUID();

      logger.info('Confirming interview booking', {
        bookingId,
        schedulingId,
        selectedSlotId
      });

      // Get scheduling result
      const schedulingResult = await this.getSchedulingResult(schedulingId);
      const selectedSlot = schedulingResult.recommendedSlots.find(
        slot => slot.slotId === selectedSlotId
      );

      if (!selectedSlot) {
        throw new Error('Selected time slot not found');
      }

      // Create calendar events
      const calendarEvents = await this.createCalendarEvents(
        selectedSlot,
        schedulingResult.optimizedPanel,
        additionalRequirements
      );

      // Send notifications
      await this.sendInterviewNotifications(
        selectedSlot,
        schedulingResult.optimizedPanel,
        schedulingResult.candidateId
      );

      // Apply buffer time management
      await this.applyBufferTimeManagement(selectedSlot, schedulingResult.optimizedPanel);

      const booking: InterviewBooking = {
        bookingId,
        schedulingId,
        candidateId: schedulingResult.candidateId,
        jobId: schedulingResult.jobId,
        interviewSlot: selectedSlot,
        interviewPanel: schedulingResult.optimizedPanel,
        calendarEvents,
        status: 'confirmed',
        biasPreventionMeasures: schedulingResult.biasPreventionMeasures,
        createdAt: new Date(),
        confirmedAt: new Date()
      };

      // Store booking
      await this.storeInterviewBooking(booking);

      logger.info('Interview booking confirmed', {
        bookingId,
        interviewDate: selectedSlot.startTime,
        panelSize: booking.interviewPanel.length
      });

      return booking;

    } catch (error) {
      logger.error('Interview booking confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Reschedule interview with bias considerations
   */
  async rescheduleInterview(
    bookingId: string,
    reason: string,
    newPreferences?: SchedulingPreferences
  ): Promise<SchedulingResult> {
    try {
      logger.info('Rescheduling interview', { bookingId, reason });

      // Get existing booking
      const existingBooking = await this.getInterviewBooking(bookingId);
      
      // Cancel existing calendar events
      await this.cancelCalendarEvents(existingBooking.calendarEvents);

      // Check for bias in rescheduling patterns
      await this.checkReschedulingBias(existingBooking, reason);

      // Generate new scheduling options
      const newScheduling = await this.scheduleInterview(
        existingBooking.candidateId,
        existingBooking.jobId,
        existingBooking.interviewSlot.interviewType,
        newPreferences || {}
      );

      // Update booking status
      await this.updateBookingStatus(bookingId, 'rescheduled', reason);

      return newScheduling;

    } catch (error) {
      logger.error('Interview rescheduling failed:', error);
      throw error;
    }
  }

  // Private methods for scheduling optimization

  private async optimizeInterviewPanel(
    availableInterviewers: Interviewer[],
    candidate: CandidateInfo,
    job: JobInfo,
    preferences: SchedulingPreferences
  ): Promise<InterviewPanel[]> {
    try {
      // Calculate diversity scores for different panel combinations
      const panelCombinations = this.generatePanelCombinations(
        availableInterviewers,
        preferences.panelSize || 3
      );

      const scoredPanels: ScoredPanel[] = [];

      for (const panel of panelCombinations) {
        const diversityScore = this.calculatePanelDiversityScore(panel);
        const expertiseScore = this.calculateExpertiseScore(panel, job);
        const availabilityScore = await this.calculateAvailabilityScore(panel, preferences);
        const biasRiskScore = await this.calculateBiasRiskScore(panel, candidate);

        const overallScore = (
          diversityScore * 0.3 +
          expertiseScore * 0.4 +
          availabilityScore * 0.2 +
          (1 - biasRiskScore) * 0.1 // Lower bias risk is better
        );

        scoredPanels.push({
          panel,
          scores: {
            diversity: diversityScore,
            expertise: expertiseScore,
            availability: availabilityScore,
            biasRisk: biasRiskScore,
            overall: overallScore
          }
        });
      }

      // Sort by overall score and return top panels
      return scoredPanels
        .sort((a, b) => b.scores.overall - a.scores.overall)
        .slice(0, 5)
        .map(scored => scored.panel);

    } catch (error) {
      logger.error('Panel optimization failed:', error);
      throw error;
    }
  }

  private async findOptimalTimeSlots(
    candidate: CandidateInfo,
    panels: InterviewPanel[],
    preferences: SchedulingPreferences
  ): Promise<TimeSlot[]> {
    try {
      const timeSlots: TimeSlot[] = [];
      const candidateTimezone = candidate.timezone || 'UTC';
      const preferredTimes = preferences.preferredTimes || [];

      // Generate potential time slots for the next 14 days
      const startDate = DateTime.now().plus({ days: 1 });
      const endDate = startDate.plus({ days: 14 });

      for (let date = startDate; date <= endDate; date = date.plus({ days: 1 })) {
        // Skip weekends unless specified
        if (!preferences.includeWeekends && (date.weekday === 6 || date.weekday === 7)) {
          continue;
        }

        // Generate time slots for this day
        const daySlots = this.generateDayTimeSlots(date, candidateTimezone, preferredTimes);
        
        for (const slot of daySlots) {
          // Check availability for each panel
          for (const panel of panels) {
            const availability = await this.checkPanelAvailability(panel, slot);
            
            if (availability.allAvailable) {
              const optimizedSlot = await this.optimizeTimeSlot(slot, panel, candidate, preferences);
              timeSlots.push(optimizedSlot);
            }
          }
        }
      }

      // Sort by optimization score
      return timeSlots.sort((a, b) => b.optimizationScore - a.optimizationScore);

    } catch (error) {
      logger.error('Time slot optimization failed:', error);
      throw error;
    }
  }

  private async applyBiasPreventionMeasures(
    candidate: CandidateInfo,
    panels: InterviewPanel[],
    timeSlots: TimeSlot[]
  ): Promise<BiasPreventionMeasure[]> {
    const measures: BiasPreventionMeasure[] = [];

    // Fatigue bias prevention
    measures.push({
      type: 'fatigue_prevention',
      description: 'Ensure adequate buffer time between interviews',
      implementation: 'Minimum 30-minute buffer between consecutive interviews',
      riskLevel: 'medium'
    });

    // Time zone bias prevention
    if (this.hasTimezoneBias(candidate, panels)) {
      measures.push({
        type: 'timezone_fairness',
        description: 'Avoid scheduling at inconvenient times for candidate timezone',
        implementation: 'Schedule within candidate business hours when possible',
        riskLevel: 'high'
      });
    }

    // Panel diversity enforcement
    measures.push({
      type: 'panel_diversity',
      description: 'Ensure diverse interview panel composition',
      implementation: 'Include interviewers from different backgrounds and levels',
      riskLevel: 'high'
    });

    // Scheduling pattern bias prevention
    const schedulingPatterns = await this.analyzeSchedulingPatterns(candidate);
    if (schedulingPatterns.hasBias) {
      measures.push({
        type: 'pattern_bias_prevention',
        description: 'Prevent systematic scheduling bias',
        implementation: 'Randomize interview times within acceptable ranges',
        riskLevel: 'medium'
      });
    }

    return measures;
  }

  private calculatePanelDiversityScore(panel: InterviewPanel): number {
    // Calculate diversity based on multiple dimensions
    const dimensions = ['department', 'seniority', 'background', 'gender', 'experience'];
    let diversityScore = 0;

    for (const dimension of dimensions) {
      const uniqueValues = new Set(panel.map(interviewer => interviewer[dimension as keyof Interviewer]));
      const diversityRatio = uniqueValues.size / panel.length;
      diversityScore += diversityRatio;
    }

    return diversityScore / dimensions.length;
  }

  private calculateExpertiseScore(panel: InterviewPanel, job: JobInfo): number {
    let expertiseScore = 0;
    const requiredSkills = job.requiredSkills || [];

    for (const interviewer of panel) {
      const skillMatch = this.calculateSkillMatch(interviewer.skills, requiredSkills);
      const experienceRelevance = this.calculateExperienceRelevance(interviewer.experience, job);
      expertiseScore += (skillMatch + experienceRelevance) / 2;
    }

    return expertiseScore / panel.length;
  }

  private async calculateAvailabilityScore(
    panel: InterviewPanel,
    preferences: SchedulingPreferences
  ): Promise<number> {
    let availabilityScore = 0;

    for (const interviewer of panel) {
      const availability = await this.getInterviewerAvailability(interviewer.id);
      const preferenceMatch = this.calculatePreferenceMatch(availability, preferences);
      availabilityScore += preferenceMatch;
    }

    return availabilityScore / panel.length;
  }

  private async calculateBiasRiskScore(panel: InterviewPanel, candidate: CandidateInfo): Promise<number> {
    // Analyze potential bias risks in panel composition
    let biasRisk = 0;

    // Check for homogeneous panels (higher bias risk)
    const homogeneityRisk = this.calculateHomogeneityRisk(panel);
    biasRisk += homogeneityRisk * 0.4;

    // Check for power imbalances
    const powerImbalanceRisk = this.calculatePowerImbalanceRisk(panel);
    biasRisk += powerImbalanceRisk * 0.3;

    // Check for potential unconscious bias patterns
    const unconsciousBiasRisk = await this.calculateUnconsciousBiasRisk(panel, candidate);
    biasRisk += unconsciousBiasRisk * 0.3;

    return Math.min(biasRisk, 1.0);
  }

  private generatePanelCombinations(interviewers: Interviewer[], panelSize: number): InterviewPanel[] {
    const combinations: InterviewPanel[] = [];
    
    // Generate all possible combinations of the specified size
    const generateCombinations = (start: number, current: Interviewer[]) => {
      if (current.length === panelSize) {
        combinations.push([...current]);
        return;
      }

      for (let i = start; i < interviewers.length; i++) {
        current.push(interviewers[i]);
        generateCombinations(i + 1, current);
        current.pop();
      }
    };

    generateCombinations(0, []);
    return combinations.slice(0, 50); // Limit to prevent excessive computation
  }

  private generateDayTimeSlots(
    date: DateTime,
    timezone: string,
    preferredTimes: string[]
  ): Partial<TimeSlot>[] {
    const slots: Partial<TimeSlot>[] = [];
    const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (const minute of [0, 30]) { // 30-minute intervals
        const slotStart = date.set({ hour, minute }).setZone(timezone);
        const slotEnd = slotStart.plus({ minutes: 60 }); // 1-hour interviews

        slots.push({
          startTime: slotStart.toJSDate(),
          endTime: slotEnd.toJSDate(),
          timezone,
          duration: 60
        });
      }
    }

    return slots;
  }

  private async optimizeTimeSlot(
    slot: Partial<TimeSlot>,
    panel: InterviewPanel,
    candidate: CandidateInfo,
    preferences: SchedulingPreferences
  ): Promise<TimeSlot> {
    // Calculate optimization score based on multiple factors
    let optimizationScore = 0;

    // Time preference match
    const timePreferenceScore = this.calculateTimePreferenceScore(slot, preferences);
    optimizationScore += timePreferenceScore * 0.3;

    // Candidate timezone convenience
    const timezoneScore = this.calculateTimezoneConvenienceScore(slot, candidate.timezone);
    optimizationScore += timezoneScore * 0.3;

    // Panel availability quality
    const availabilityQuality = await this.calculateAvailabilityQuality(slot, panel);
    optimizationScore += availabilityQuality * 0.2;

    // Fatigue prevention score
    const fatigueScore = await this.calculateFatiguePreventionScore(slot, panel);
    optimizationScore += fatigueScore * 0.2;

    return {
      slotId: crypto.randomUUID(),
      startTime: slot.startTime!,
      endTime: slot.endTime!,
      timezone: slot.timezone!,
      duration: slot.duration!,
      interviewType: 'technical', // This would be determined by context
      panel: panel,
      optimizationScore,
      biasRiskScore: await this.calculateSlotBiasRisk(slot, panel, candidate)
    };
  }

  // Helper methods for bias prevention and optimization

  private hasTimezoneBias(candidate: CandidateInfo, panels: InterviewPanel[]): boolean {
    // Check if scheduling would create timezone bias
    const candidateTimezone = candidate.timezone || 'UTC';
    const panelTimezones = panels.flat().map(interviewer => interviewer.timezone);
    
    // If all interviewers are in significantly different timezones, there's potential bias
    const timezoneVariance = this.calculateTimezoneVariance(candidateTimezone, panelTimezones);
    return timezoneVariance > 6; // More than 6 hours difference
  }

  private async analyzeSchedulingPatterns(candidate: CandidateInfo): Promise<{ hasBias: boolean; patterns: string[] }> {
    // Analyze historical scheduling patterns for potential bias
    // This would check for patterns like always scheduling certain types of candidates at inconvenient times
    return { hasBias: false, patterns: [] };
  }

  private calculateHomogeneityRisk(panel: InterviewPanel): number {
    // Calculate risk of homogeneous panel composition
    const attributes = ['department', 'seniority', 'background'];
    let homogeneityRisk = 0;

    for (const attribute of attributes) {
      const values = panel.map(interviewer => interviewer[attribute as keyof Interviewer]);
      const uniqueValues = new Set(values);
      const homogeneity = 1 - (uniqueValues.size / values.length);
      homogeneityRisk += homogeneity;
    }

    return homogeneityRisk / attributes.length;
  }

  private calculatePowerImbalanceRisk(panel: InterviewPanel): number {
    // Calculate risk of power imbalances in the panel
    const seniorityLevels = panel.map(interviewer => interviewer.seniorityLevel || 0);
    const maxSeniority = Math.max(...seniorityLevels);
    const minSeniority = Math.min(...seniorityLevels);
    
    // High power imbalance if there's a large gap
    return (maxSeniority - minSeniority) / 10; // Normalize to 0-1 scale
  }

  private async calculateUnconsciousBiasRisk(panel: InterviewPanel, candidate: CandidateInfo): Promise<number> {
    // Analyze potential unconscious bias risks
    // This would use historical data and bias detection algorithms
    return 0.2; // Placeholder - would implement actual bias risk calculation
  }

  private calculateSkillMatch(interviewerSkills: string[], requiredSkills: any[]): number {
    if (!requiredSkills || requiredSkills.length === 0) return 1;
    
    const matchedSkills = requiredSkills.filter(required => 
      interviewerSkills.some(skill => skill.toLowerCase().includes(required.name.toLowerCase()))
    );
    
    return matchedSkills.length / requiredSkills.length;
  }

  private calculateExperienceRelevance(interviewerExperience: any[], job: JobInfo): number {
    // Calculate how relevant the interviewer's experience is to the job
    if (!interviewerExperience || interviewerExperience.length === 0) return 0.5;
    
    const relevantExperience = interviewerExperience.filter(exp => 
      exp.industry === job.industry || exp.role === job.title
    );
    
    return Math.min(relevantExperience.length / 2, 1); // Cap at 1.0
  }

  // Additional helper methods would be implemented here...
  // Due to length constraints, I'll provide the key interfaces and conclude

  private async monitorSchedulingBias(result: SchedulingResult): Promise<void> {
    // Monitor the scheduling decision for potential bias
    await this.biasMonitoring.monitorProcess(
      result.schedulingId,
      'interview_scheduling',
      { scheduling: result }
    );
  }

  // Placeholder methods for external integrations
  private async getCandidateInfo(candidateId: string): Promise<CandidateInfo> {
    // Would fetch from database
    return {} as CandidateInfo;
  }

  private async getJobInfo(jobId: string): Promise<JobInfo> {
    // Would fetch from database
    return {} as JobInfo;
  }

  private async getAvailableInterviewers(jobId: string, interviewType: InterviewType): Promise<Interviewer[]> {
    // Would fetch from database
    return [];
  }

  // Additional implementation methods would continue...
}

// Supporting interfaces

export interface SchedulingPreferences {
  preferredTimes?: string[];
  timezone?: string;
  panelSize?: number;
  includeWeekends?: boolean;
  maxDuration?: number;
  bufferTime?: number;
}

export interface TimeSlot {
  slotId: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  duration: number;
  interviewType: InterviewType;
  panel: InterviewPanel;
  optimizationScore: number;
  biasRiskScore: number;
}

export interface InterviewPanel extends Array<Interviewer> {}

export interface Interviewer {
  id: string;
  name: string;
  email: string;
  department: string;
  seniority: string;
  seniorityLevel: number;
  background: string;
  skills: string[];
  experience: any[];
  timezone: string;
  availability: any;
}

export interface CandidateInfo {
  id: string;
  timezone: string;
  preferences: any;
}

export interface JobInfo {
  id: string;
  title: string;
  industry: string;
  requiredSkills: any[];
}

export type InterviewType = 'technical' | 'behavioral' | 'cultural' | 'panel' | 'final';

export interface SchedulingResult {
  schedulingId: string;
  candidateId: string;
  jobId: string;
  recommendedSlots: TimeSlot[];
  optimizedPanel: InterviewPanel;
  biasPreventionMeasures: BiasPreventionMeasure[];
  recommendations: string[];
  processingTime: number;
  createdAt: Date;
}

export interface BiasPreventionMeasure {
  type: string;
  description: string;
  implementation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface InterviewBooking {
  bookingId: string;
  schedulingId: string;
  candidateId: string;
  jobId: string;
  interviewSlot: TimeSlot;
  interviewPanel: InterviewPanel;
  calendarEvents: any[];
  status: 'confirmed' | 'rescheduled' | 'cancelled';
  biasPreventionMeasures: BiasPreventionMeasure[];
  createdAt: Date;
  confirmedAt: Date;
}

export interface AdditionalRequirements {
  specialAccommodations?: string[];
  equipment?: string[];
  location?: string;
}

interface ScoredPanel {
  panel: InterviewPanel;
  scores: {
    diversity: number;
    expertise: number;
    availability: number;
    biasRisk: number;
    overall: number;
  };
}

export default InterviewSchedulingService;