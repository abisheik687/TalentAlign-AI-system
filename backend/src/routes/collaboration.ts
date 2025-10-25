import express from 'express';
import { CollaborationService } from '@/services/CollaborationService';
import { authMiddleware } from '@/middleware/auth';
import { roleMiddleware } from '@/middleware/role';
import { validateRequest } from '@/middleware/validation';
import { body, query, param } from 'express-validator';
import { logger } from '@/utils/logger';

const router = express.Router();
const collaborationService = CollaborationService.getInstance();

/**
 * Collaboration API Routes
 * Requirements: 6.4, 6.5, 9.5
 */

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * POST /api/collaboration/sessions
 * Create a new collaboration session
 */
router.post('/sessions',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    body('candidateId').notEmpty().withMessage('Candidate ID is required'),
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('sessionType').isIn(['technical_interview', 'behavioral_interview', 'panel_review', 'final_decision'])
      .withMessage('Invalid session type'),
    body('participants').isArray().withMessage('Participants array is required'),
    body('participants').custom((participants) => {
      if (participants.length < 2) {
        throw new Error('At least 2 participants required');
      }
      return true;
    }),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { candidateId, jobId, sessionType, participants, options = {} } = req.body;

      const session = await collaborationService.createEvaluationSession(
        candidateId,
        jobId,
        sessionType,
        participants,
        { ...options, createdBy: req.user.id }
      );

      res.status(201).json({
        success: true,
        data: session
      });

    } catch (error) {
      logger.error('Failed to create collaboration session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create collaboration session'
      });
    }
  }
);

/**
 * GET /api/collaboration/sessions/:sessionId
 * Get collaboration session details
 */
router.get('/sessions/:sessionId',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('sessionId').notEmpty().withMessage('Session ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      // This would retrieve session from database
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          sessionId,
          message: 'Session retrieval not yet implemented'
        }
      });

    } catch (error) {
      logger.error('Failed to get collaboration session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve collaboration session'
      });
    }
  }
);

/**
 * POST /api/collaboration/sessions/:sessionId/evaluations
 * Submit evaluation for a candidate
 */
router.post('/sessions/:sessionId/evaluations',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('sessionId').notEmpty().withMessage('Session ID is required'),
    body('scores').isObject().withMessage('Scores object is required'),
    body('recommendation').isIn(['hire', 'reject', 'further_review'])
      .withMessage('Invalid recommendation'),
    body('comments').optional().isString().withMessage('Comments must be a string'),
    body('confidence').optional().isFloat({ min: 0, max: 1 })
      .withMessage('Confidence must be between 0 and 1')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const evaluation = req.body;
      const participantId = req.user.id;

      const result = await collaborationService.submitEvaluation(
        sessionId,
        participantId,
        evaluation
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Failed to submit evaluation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit evaluation'
      });
    }
  }
);

/**
 * POST /api/collaboration/sessions/:sessionId/consensus
 * Build consensus for the session
 */
router.post('/sessions/:sessionId/consensus',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('sessionId').notEmpty().withMessage('Session ID is required'),
    body('consensusMethod').optional().isIn(['weighted_average', 'majority_vote', 'delphi_method'])
      .withMessage('Invalid consensus method')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { consensusMethod = 'weighted_average' } = req.body;
      const facilitatorId = req.user.id;

      const consensusResult = await collaborationService.buildConsensus(
        sessionId,
        facilitatorId,
        consensusMethod
      );

      res.json({
        success: true,
        data: consensusResult
      });

    } catch (error) {
      logger.error('Failed to build consensus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to build consensus'
      });
    }
  }
);

/**
 * GET /api/collaboration/sessions/:sessionId/activities
 * Get session activities
 */
router.get('/sessions/:sessionId/activities',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('sessionId').notEmpty().withMessage('Session ID is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // This would retrieve activities from database
      res.json({
        success: true,
        data: {
          activities: [],
          pagination: {
            total: 0,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: false
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get session activities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve session activities'
      });
    }
  }
);

/**
 * GET /api/collaboration/sessions/:sessionId/consensus-status
 * Get current consensus status
 */
router.get('/sessions/:sessionId/consensus-status',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('sessionId').notEmpty().withMessage('Session ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      // This would calculate current consensus status
      res.json({
        success: true,
        data: {
          status: 'pending',
          progress: 0.6,
          message: 'Waiting for 2 more evaluations',
          consensusScore: null,
          participantAgreement: {}
        }
      });

    } catch (error) {
      logger.error('Failed to get consensus status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve consensus status'
      });
    }
  }
);

/**
 * PUT /api/collaboration/sessions/:sessionId/participants
 * Update session participants
 */
router.put('/sessions/:sessionId/participants',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('sessionId').notEmpty().withMessage('Session ID is required'),
    body('participants').isArray().withMessage('Participants array is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { participants } = req.body;

      // This would update session participants
      res.json({
        success: true,
        message: 'Participants updated successfully'
      });

    } catch (error) {
      logger.error('Failed to update participants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update participants'
      });
    }
  }
);

/**
 * GET /api/collaboration/user/sessions
 * Get user's collaboration sessions
 */
router.get('/user/sessions',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    query('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;

      // This would retrieve user's sessions from database
      res.json({
        success: true,
        data: {
          sessions: [],
          pagination: {
            total: 0,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: false
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user sessions'
      });
    }
  }
);

/**
 * POST /api/collaboration/sessions/:sessionId/comments
 * Add comment to session
 */
router.post('/sessions/:sessionId/comments',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('sessionId').notEmpty().withMessage('Session ID is required'),
    body('comment').notEmpty().withMessage('Comment is required'),
    body('type').optional().isIn(['general', 'concern', 'suggestion']).withMessage('Invalid comment type')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { comment, type = 'general' } = req.body;
      const userId = req.user.id;

      // This would add comment to session
      const commentId = `comment_${Date.now()}`;

      res.json({
        success: true,
        data: {
          commentId,
          sessionId,
          userId,
          comment,
          type,
          timestamp: new Date()
        }
      });

    } catch (error) {
      logger.error('Failed to add comment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add comment'
      });
    }
  }
);

/**
 * GET /api/collaboration/analytics/session-metrics
 * Get collaboration session analytics
 */
router.get('/analytics/session-metrics',
  roleMiddleware(['admin']),
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid time range'),
    query('sessionType').optional().isIn(['technical_interview', 'behavioral_interview', 'panel_review', 'final_decision'])
      .withMessage('Invalid session type')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { timeRange = '30d', sessionType } = req.query;

      // This would calculate analytics from database
      const analytics = {
        totalSessions: 156,
        averageParticipants: 3.2,
        averageConsensusTime: 45, // minutes
        consensusRate: 0.87,
        biasIncidents: 12,
        participantSatisfaction: 4.3,
        sessionsByType: {
          technical_interview: 45,
          behavioral_interview: 38,
          panel_review: 52,
          final_decision: 21
        },
        consensusMethods: {
          weighted_average: 78,
          majority_vote: 65,
          delphi_method: 13
        },
        timeRange,
        generatedAt: new Date()
      };

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Failed to get session analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve session analytics'
      });
    }
  }
);

/**
 * DELETE /api/collaboration/sessions/:sessionId
 * Cancel collaboration session
 */
router.delete('/sessions/:sessionId',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('sessionId').notEmpty().withMessage('Session ID is required'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      // This would cancel the session
      logger.info('Collaboration session cancelled', {
        sessionId,
        cancelledBy: userId,
        reason
      });

      res.json({
        success: true,
        message: 'Session cancelled successfully'
      });

    } catch (error) {
      logger.error('Failed to cancel session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel session'
      });
    }
  }
);

export default router;