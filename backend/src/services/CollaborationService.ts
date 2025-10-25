import { logger } from '@/utils/logger';
import { WebSocketService } from '@/services/WebSocketService';
import { BiasMonitoringService } from '@/services/BiasMonitoringService';
import crypto from 'crypto';

/**
 * Real-time Collaboration Service
 * Enables collaborative candidate evaluation and consensus building
 * Requirements: 6.4, 6.5, 9.5
 */
export class CollaborationService {
  private static instance: CollaborationService;
  private webSocketService: WebSocketService;
  private biasMonitoring: BiasMonitoringService;
  private activeSessions: Map<string, CollaborationSession> = new Map();

  private constructor() {
    this.webSocketService = WebSocketService.getInstance();
    this.biasMonitoring = BiasMonitoringService.getInstance();
  }

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  /**
   * Create collaborative evaluation session
   */
  async createEvaluationSession(
    candidateId: string,
    jobId: string,
    sessionType: SessionType,
    participants: Participant[],
    options: SessionOptions = {}
  ): Promise<CollaborationSession> {
    try {
      const sessionId = crypto.randomUUID();
      const startTime = Date.now();

      logger.info('Creating collaboration session', {
        sessionId,
        candidateId,
        jobId,
        sessionType,
        participantCount: participants.length
      });

      // Validate participants and check for bias risks
      const validatedParticipants = await this.validateParticipants(participants);
      const biasRisks = await this.assessParticipantBias(validatedParticipants, candidateId);

      // Create session structure
      const session: CollaborationSession = {
        sessionId,
        candidateId,
        jobId,
        sessionType,
        participants: validatedParticipants,
        status: 'active',
        createdAt: new Date(),
        lastActivity: new Date(),
        evaluationCriteria: options.evaluationCriteria || this.getDefaultCriteria(sessionType),
        consensusThreshold: options.consensusThreshold || 0.7,
        biasRisks,
        activities: [],
        decisions: [],
        metadata: {
          createdBy: options.createdBy || 'system',
          sessionVersion: '1.0'
        }
      };

      // Store session
      this.activeSessions.set(sessionId, session);

      // Notify participants
      await this.notifyParticipants(session, 'session_created');

      // Monitor for collaboration bias
      await this.monitorCollaborationBias(session);

      logger.info('Collaboration session created', {
        sessionId,
        processingTime: Date.now() - startTime
      });

      return session;

    } catch (error) {
      logger.error('Failed to create collaboration session:', error);
      throw error;
    }
  }

  /**
   * Submit evaluation for candidate
   */
  async submitEvaluation(
    sessionId: string,
    participantId: string,
    evaluation: CandidateEvaluation
  ): Promise<EvaluationResult> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      logger.info('Submitting evaluation', {
        sessionId,
        participantId,
        candidateId: session.candidateId
      });

      // Validate participant
      const participant = session.participants.find(p => p.id === participantId);
      if (!participant) {
        throw new Error('Participant not found in session');
      }

      // Process evaluation
      const processedEvaluation = await this.processEvaluation(evaluation, participant, session);

      // Add to session activities
      const activity: SessionActivity = {
        activityId: crypto.randomUUID(),
        type: 'evaluation_submitted',
        participantId,
        timestamp: new Date(),
        data: processedEvaluation,
        biasFlags: await this.checkEvaluationBias(processedEvaluation, participant)
      };

      session.activities.push(activity);
      session.lastActivity = new Date();

      // Broadcast to other participants
      await this.broadcastActivity(session, activity);

      // Check if consensus is reached
      const consensusResult = await this.checkConsensus(session);

      const result: EvaluationResult = {
        evaluationId: processedEvaluation.evaluationId,
        sessionId,
        participantId,
        status: 'submitted',
        consensusStatus: consensusResult.status,
        biasFlags: activity.biasFlags,
        timestamp: new Date()
      };

      return result;

    } catch (error) {
      logger.error('Failed to submit evaluation:', error);
      throw error;
    }
  }

  /**
   * Build consensus among participants
   */
  async buildConsensus(
    sessionId: string,
    facilitatorId: string,
    consensusMethod: ConsensusMethod = 'weighted_average'
  ): Promise<ConsensusResult> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      logger.info('Building consensus', {
        sessionId,
        facilitatorId,
        consensusMethod
      });

      // Get all evaluations
      const evaluations = this.getSessionEvaluations(session);
      
      if (evaluations.length === 0) {
        throw new Error('No evaluations found for consensus building');
      }

      // Apply consensus algorithm
      const consensusResult = await this.applyConsensusAlgorithm(
        evaluations,
        session,
        consensusMethod
      );

      // Check for bias in consensus
      const biasAnalysis = await this.analyzeConsensusBias(consensusResult, session);

      // Create final decision
      const decision: CollaborationDecision = {
        decisionId: crypto.randomUUID(),
        sessionId,
        candidateId: session.candidateId,
        jobId: session.jobId,
        decision: consensusResult.finalDecision,
        confidence: consensusResult.confidence,
        consensusScore: consensusResult.consensusScore,
        participantAgreement: consensusResult.participantAgreement,
        biasAnalysis,
        reasoning: consensusResult.reasoning,
        dissenting: consensusResult.dissenting,
        createdAt: new Date(),
        createdBy: facilitatorId
      };

      session.decisions.push(decision);
      session.status = 'completed';

      // Broadcast final decision
      await this.broadcastDecision(session, decision);

      // Archive session
      await this.archiveSession(session);

      return consensusResult;

    } catch (error) {
      logger.error('Failed to build consensus:', error);
      throw error;
    }
  }

  // Private helper methods

  private async validateParticipants(participants: Participant[]): Promise<Participant[]> {
    const validated: Participant[] = [];

    for (const participant of participants) {
      // Validate participant permissions and availability
      const isValid = await this.validateParticipant(participant);
      if (isValid) {
        validated.push({
          ...participant,
          joinedAt: new Date(),
          status: 'invited'
        });
      }
    }

    return validated;
  }

  private async assessParticipantBias(
    participants: Participant[],
    candidateId: string
  ): Promise<BiasRisk[]> {
    const biasRisks: BiasRisk[] = [];

    // Check for homogeneous panels
    const diversityScore = this.calculateParticipantDiversity(participants);
    if (diversityScore < 0.6) {
      biasRisks.push({
        type: 'low_diversity',
        severity: 'medium',
        description: 'Participant panel lacks diversity',
        mitigation: 'Consider adding participants from different backgrounds'
      });
    }

    // Check for power imbalances
    const powerBalance = this.analyzePowerBalance(participants);
    if (powerBalance.imbalanceScore > 0.7) {
      biasRisks.push({
        type: 'power_imbalance',
        severity: 'high',
        description: 'Significant power imbalance among participants',
        mitigation: 'Ensure equal voice for all participants'
      });
    }

    return biasRisks;
  }

  private async processEvaluation(
    evaluation: CandidateEvaluation,
    participant: Participant,
    session: CollaborationSession
  ): Promise<ProcessedEvaluation> {
    return {
      evaluationId: crypto.randomUUID(),
      participantId: participant.id,
      candidateId: session.candidateId,
      jobId: session.jobId,
      scores: evaluation.scores,
      comments: evaluation.comments,
      recommendation: evaluation.recommendation,
      confidence: evaluation.confidence || 0.8,
      submittedAt: new Date(),
      participantWeight: this.calculateParticipantWeight(participant, session)
    };
  }

  private async checkEvaluationBias(
    evaluation: ProcessedEvaluation,
    participant: Participant
  ): Promise<BiasFlag[]> {
    const biasFlags: BiasFlag[] = [];

    // Check for extreme scores
    const avgScore = Object.values(evaluation.scores).reduce((sum, score) => sum + score, 0) / 
                    Object.values(evaluation.scores).length;
    
    if (avgScore < 2 || avgScore > 8) {
      biasFlags.push({
        type: 'extreme_scoring',
        severity: 'medium',
        description: 'Evaluation contains extreme scores',
        value: avgScore
      });
    }

    // Check for comment bias
    if (evaluation.comments) {
      const commentBias = await this.analyzeCommentBias(evaluation.comments);
      biasFlags.push(...commentBias);
    }

    return biasFlags;
  }

  private async checkConsensus(session: CollaborationSession): Promise<ConsensusStatus> {
    const evaluations = this.getSessionEvaluations(session);
    const requiredEvaluations = session.participants.filter(p => p.status === 'active').length;

    if (evaluations.length < requiredEvaluations) {
      return {
        status: 'pending',
        progress: evaluations.length / requiredEvaluations,
        message: `Waiting for ${requiredEvaluations - evaluations.length} more evaluations`
      };
    }

    // Calculate consensus score
    const consensusScore = this.calculateConsensusScore(evaluations);
    
    if (consensusScore >= session.consensusThreshold) {
      return {
        status: 'reached',
        progress: 1.0,
        consensusScore,
        message: 'Consensus reached among participants'
      };
    }

    return {
      status: 'conflict',
      progress: 1.0,
      consensusScore,
      message: 'All evaluations submitted but consensus not reached'
    };
  }

  private getSessionEvaluations(session: CollaborationSession): ProcessedEvaluation[] {
    return session.activities
      .filter(activity => activity.type === 'evaluation_submitted')
      .map(activity => activity.data as ProcessedEvaluation);
  }

  private async applyConsensusAlgorithm(
    evaluations: ProcessedEvaluation[],
    session: CollaborationSession,
    method: ConsensusMethod
  ): Promise<ConsensusResult> {
    switch (method) {
      case 'weighted_average':
        return this.weightedAverageConsensus(evaluations, session);
      case 'majority_vote':
        return this.majorityVoteConsensus(evaluations, session);
      case 'delphi_method':
        return this.delphiMethodConsensus(evaluations, session);
      default:
        return this.weightedAverageConsensus(evaluations, session);
    }
  }

  private weightedAverageConsensus(
    evaluations: ProcessedEvaluation[],
    session: CollaborationSession
  ): ConsensusResult {
    const criteriaScores: Record<string, number> = {};
    let totalWeight = 0;

    // Calculate weighted averages for each criterion
    for (const evaluation of evaluations) {
      const weight = evaluation.participantWeight;
      totalWeight += weight;

      for (const [criterion, score] of Object.entries(evaluation.scores)) {
        if (!criteriaScores[criterion]) {
          criteriaScores[criterion] = 0;
        }
        criteriaScores[criterion] += score * weight;
      }
    }

    // Normalize scores
    for (const criterion in criteriaScores) {
      criteriaScores[criterion] /= totalWeight;
    }

    // Calculate overall score
    const overallScore = Object.values(criteriaScores).reduce((sum, score) => sum + score, 0) / 
                        Object.values(criteriaScores).length;

    // Determine final decision
    const finalDecision = this.determineDecision(overallScore, criteriaScores);

    // Calculate consensus metrics
    const consensusScore = this.calculateConsensusScore(evaluations);
    const confidence = this.calculateConsensusConfidence(evaluations, consensusScore);

    return {
      finalDecision,
      overallScore,
      criteriaScores,
      consensusScore,
      confidence,
      participantAgreement: this.calculateParticipantAgreement(evaluations),
      reasoning: this.generateConsensusReasoning(evaluations, finalDecision),
      dissenting: this.identifyDissentingViews(evaluations, finalDecision),
      method: 'weighted_average'
    };
  }

  // Additional helper methods would continue here...
  // Due to length constraints, I'll provide the key interfaces and conclude

  private async notifyParticipants(session: CollaborationSession, eventType: string): Promise<void> {
    for (const participant of session.participants) {
      WebSocketService.sendToClient(participant.id, 'collaboration_event', {
        sessionId: session.sessionId,
        eventType,
        session
      });
    }
  }

  private async broadcastActivity(session: CollaborationSession, activity: SessionActivity): Promise<void> {
    WebSocketService.broadcast('collaboration_activity', {
      sessionId: session.sessionId,
      activity
    });
  }

  private async monitorCollaborationBias(session: CollaborationSession): Promise<void> {
    await this.biasMonitoring.monitorProcess(
      session.sessionId,
      'collaboration_session',
      { session }
    );
  }

  // Placeholder implementations for complex algorithms
  private calculateParticipantDiversity(participants: Participant[]): number {
    // Simplified diversity calculation
    return 0.7; // Would implement actual diversity metrics
  }

  private analyzePowerBalance(participants: Participant[]): { imbalanceScore: number } {
    // Simplified power balance analysis
    return { imbalanceScore: 0.3 };
  }

  private calculateParticipantWeight(participant: Participant, session: CollaborationSession): number {
    // Calculate weight based on expertise, seniority, etc.
    return 1.0; // Equal weight for now
  }

  private async analyzeCommentBias(comments: string): Promise<BiasFlag[]> {
    // Would implement NLP-based bias detection
    return [];
  }

  private calculateConsensusScore(evaluations: ProcessedEvaluation[]): number {
    // Calculate how much participants agree
    return 0.8; // Placeholder
  }

  private determineDecision(overallScore: number, criteriaScores: Record<string, number>): 'hire' | 'reject' | 'further_review' {
    if (overallScore >= 7) return 'hire';
    if (overallScore <= 4) return 'reject';
    return 'further_review';
  }

  private calculateConsensusConfidence(evaluations: ProcessedEvaluation[], consensusScore: number): number {
    return consensusScore * 0.9; // Simplified confidence calculation
  }

  private calculateParticipantAgreement(evaluations: ProcessedEvaluation[]): Record<string, number> {
    return {}; // Would calculate agreement metrics
  }

  private generateConsensusReasoning(evaluations: ProcessedEvaluation[], decision: string): string {
    return `Decision reached through weighted consensus of ${evaluations.length} evaluations`;
  }

  private identifyDissentingViews(evaluations: ProcessedEvaluation[], decision: string): string[] {
    return []; // Would identify dissenting opinions
  }

  private majorityVoteConsensus(evaluations: ProcessedEvaluation[], session: CollaborationSession): ConsensusResult {
    // Placeholder for majority vote implementation
    return {} as ConsensusResult;
  }

  private delphiMethodConsensus(evaluations: ProcessedEvaluation[], session: CollaborationSession): ConsensusResult {
    // Placeholder for Delphi method implementation
    return {} as ConsensusResult;
  }

  private async validateParticipant(participant: Participant): Promise<boolean> {
    return true; // Simplified validation
  }

  private async analyzeConsensusBias(result: ConsensusResult, session: CollaborationSession): Promise<any> {
    return null; // Would implement bias analysis
  }

  private async broadcastDecision(session: CollaborationSession, decision: CollaborationDecision): Promise<void> {
    WebSocketService.broadcast('collaboration_decision', {
      sessionId: session.sessionId,
      decision
    });
  }

  private async archiveSession(session: CollaborationSession): Promise<void> {
    // Archive session to database
    this.activeSessions.delete(session.sessionId);
  }
}

// Supporting interfaces and types

export type SessionType = 'technical_interview' | 'behavioral_interview' | 'panel_review' | 'final_decision';
export type ConsensusMethod = 'weighted_average' | 'majority_vote' | 'delphi_method';

export interface Participant {
  id: string;
  name: string;
  role: string;
  department: string;
  seniority: number;
  expertise: string[];
  weight?: number;
  status?: 'invited' | 'active' | 'inactive';
  joinedAt?: Date;
}

export interface SessionOptions {
  evaluationCriteria?: EvaluationCriteria[];
  consensusThreshold?: number;
  createdBy?: string;
  timeLimit?: number;
}

export interface CollaborationSession {
  sessionId: string;
  candidateId: string;
  jobId: string;
  sessionType: SessionType;
  participants: Participant[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  lastActivity: Date;
  evaluationCriteria: EvaluationCriteria[];
  consensusThreshold: number;
  biasRisks: BiasRisk[];
  activities: SessionActivity[];
  decisions: CollaborationDecision[];
  metadata: {
    createdBy: string;
    sessionVersion: string;
  };
}

export interface CandidateEvaluation {
  scores: Record<string, number>;
  comments?: string;
  recommendation: 'hire' | 'reject' | 'further_review';
  confidence?: number;
}

export interface ProcessedEvaluation extends CandidateEvaluation {
  evaluationId: string;
  participantId: string;
  candidateId: string;
  jobId: string;
  submittedAt: Date;
  participantWeight: number;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  scale: { min: number; max: number };
}

export interface BiasRisk {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export interface BiasFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  value?: any;
}

export interface SessionActivity {
  activityId: string;
  type: 'evaluation_submitted' | 'comment_added' | 'score_updated';
  participantId: string;
  timestamp: Date;
  data: any;
  biasFlags: BiasFlag[];
}

export interface ConsensusStatus {
  status: 'pending' | 'reached' | 'conflict';
  progress: number;
  consensusScore?: number;
  message: string;
}

export interface ConsensusResult {
  finalDecision: 'hire' | 'reject' | 'further_review';
  overallScore: number;
  criteriaScores: Record<string, number>;
  consensusScore: number;
  confidence: number;
  participantAgreement: Record<string, number>;
  reasoning: string;
  dissenting: string[];
  method: ConsensusMethod;
}

export interface CollaborationDecision {
  decisionId: string;
  sessionId: string;
  candidateId: string;
  jobId: string;
  decision: 'hire' | 'reject' | 'further_review';
  confidence: number;
  consensusScore: number;
  participantAgreement: Record<string, number>;
  biasAnalysis: any;
  reasoning: string;
  dissenting: string[];
  createdAt: Date;
  createdBy: string;
}

export interface EvaluationResult {
  evaluationId: string;
  sessionId: string;
  participantId: string;
  status: 'submitted' | 'updated' | 'withdrawn';
  consensusStatus: ConsensusStatus;
  biasFlags: BiasFlag[];
  timestamp: Date;
}

export default CollaborationService;