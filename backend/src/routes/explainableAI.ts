import express from 'express';
import { ExplainableAIService } from '@/services/ExplainableAIService';
import { authMiddleware } from '@/middleware/auth';
import { roleMiddleware } from '@/middleware/role';
import { validateRequest } from '@/middleware/validation';
import { body, query, param } from 'express-validator';
import { logger } from '@/utils/logger';

const router = express.Router();
const explainableAI = ExplainableAIService.getInstance();

/**
 * Explainable AI API Routes
 * Requirements: 2.2, 2.5, 5.1, 5.2
 */

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * POST /api/explainable-ai/explain-match
 * Generate explanation for a candidate-job match
 */
router.post('/explain-match',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    body('candidateId').notEmpty().withMessage('Candidate ID is required'),
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('matchResult').isObject().withMessage('Match result is required'),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { candidateId, jobId, matchResult, options = {} } = req.body;

      const explanation = await explainableAI.explainMatch(
        candidateId,
        jobId,
        matchResult,
        options
      );

      res.json({
        success: true,
        data: explanation
      });

    } catch (error) {
      logger.error('Match explanation generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate match explanation'
      });
    }
  }
);

/**
 * POST /api/explainable-ai/explain-non-match
 * Generate explanation for why a candidate was not matched
 */
router.post('/explain-non-match',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager', 'candidate']),
  [
    body('candidateId').notEmpty().withMessage('Candidate ID is required'),
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('matchResult').isObject().withMessage('Match result is required'),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { candidateId, jobId, matchResult, options = {} } = req.body;

      // Ensure candidates can only get explanations for their own applications
      if (req.user.role === 'candidate' && req.user.candidateId !== candidateId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied - can only view your own explanations'
        });
      }

      const explanation = await explainableAI.explainNonMatch(
        candidateId,
        jobId,
        matchResult,
        options
      );

      res.json({
        success: true,
        data: explanation
      });

    } catch (error) {
      logger.error('Non-match explanation generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate non-match explanation'
      });
    }
  }
);

/**
 * POST /api/explainable-ai/explain-batch
 * Generate explanations for multiple matches
 */
router.post('/explain-batch',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    body('matches').isArray().withMessage('Matches array is required'),
    body('matches').custom((matches) => {
      if (matches.length === 0) {
        throw new Error('At least one match is required');
      }
      if (matches.length > 100) {
        throw new Error('Maximum 100 matches allowed per batch');
      }
      return true;
    }),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { matches, options = {} } = req.body;

      const batchResult = await explainableAI.explainBatchMatches(matches, options);

      res.json({
        success: true,
        data: batchResult
      });

    } catch (error) {
      logger.error('Batch explanation generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate batch explanations'
      });
    }
  }
);

/**
 * POST /api/explainable-ai/explain-algorithm
 * Generate explanation for algorithm decision
 */
router.post('/explain-algorithm',
  roleMiddleware(['admin']),
  [
    body('decisionContext').isObject().withMessage('Decision context is required'),
    body('decisionContext.decisionType').notEmpty().withMessage('Decision type is required'),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { decisionContext, options = {} } = req.body;

      const explanation = await explainableAI.explainAlgorithmDecision(
        decisionContext,
        options
      );

      res.json({
        success: true,
        data: explanation
      });

    } catch (error) {
      logger.error('Algorithm explanation generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate algorithm explanation'
      });
    }
  }
);

/**
 * GET /api/explainable-ai/explanation/:explanationId
 * Retrieve a previously generated explanation
 */
router.get('/explanation/:explanationId',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager', 'candidate']),
  [
    param('explanationId').notEmpty().withMessage('Explanation ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { explanationId } = req.params;

      // This would retrieve from database in a real implementation
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          explanationId,
          message: 'Explanation retrieval not yet implemented'
        }
      });

    } catch (error) {
      logger.error('Explanation retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve explanation'
      });
    }
  }
);

/**
 * GET /api/explainable-ai/candidate/:candidateId/explanations
 * Get all explanations for a specific candidate
 */
router.get('/candidate/:candidateId/explanations',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager', 'candidate']),
  [
    param('candidateId').notEmpty().withMessage('Candidate ID is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('jobId').optional().notEmpty().withMessage('Job ID cannot be empty if provided')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { candidateId } = req.params;
      const { limit = 20, offset = 0, jobId } = req.query;

      // Ensure candidates can only access their own explanations
      if (req.user.role === 'candidate' && req.user.candidateId !== candidateId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied - can only view your own explanations'
        });
      }

      // This would query the database for explanations
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          explanations: [],
          pagination: {
            total: 0,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: false
          }
        }
      });

    } catch (error) {
      logger.error('Candidate explanations retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve candidate explanations'
      });
    }
  }
);

/**
 * GET /api/explainable-ai/job/:jobId/explanations
 * Get all explanations for a specific job
 */
router.get('/job/:jobId/explanations',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('jobId').notEmpty().withMessage('Job ID is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('minScore').optional().isFloat({ min: 0, max: 1 }).withMessage('Min score must be between 0 and 1'),
    query('maxScore').optional().isFloat({ min: 0, max: 1 }).withMessage('Max score must be between 0 and 1')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { limit = 20, offset = 0, minScore, maxScore } = req.query;

      // This would query the database for job explanations
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          explanations: [],
          pagination: {
            total: 0,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: false
          },
          filters: {
            minScore: minScore ? parseFloat(minScore as string) : undefined,
            maxScore: maxScore ? parseFloat(maxScore as string) : undefined
          }
        }
      });

    } catch (error) {
      logger.error('Job explanations retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve job explanations'
      });
    }
  }
);

/**
 * POST /api/explainable-ai/feedback
 * Submit feedback on explanation quality
 */
router.post('/feedback',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager', 'candidate']),
  [
    body('explanationId').notEmpty().withMessage('Explanation ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('feedback').optional().isString().withMessage('Feedback must be a string'),
    body('categories').optional().isArray().withMessage('Categories must be an array')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { explanationId, rating, feedback, categories = [] } = req.body;
      const userId = req.user.id;

      // This would store feedback in the database
      // For now, just log and return success
      logger.info('Explanation feedback received', {
        explanationId,
        rating,
        feedback,
        categories,
        userId
      });

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });

    } catch (error) {
      logger.error('Feedback submission failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit feedback'
      });
    }
  }
);

/**
 * GET /api/explainable-ai/analytics/explanation-quality
 * Get analytics on explanation quality and usage
 */
router.get('/analytics/explanation-quality',
  roleMiddleware(['admin']),
  [
    query('timeRange').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid time range'),
    query('audienceType').optional().isIn(['recruiter', 'hiring_manager', 'candidate', 'admin']).withMessage('Invalid audience type')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { timeRange = '30d', audienceType } = req.query;

      // This would calculate analytics from the database
      // For now, return placeholder analytics
      const analytics = {
        totalExplanations: 1250,
        averageRating: 4.2,
        usageByAudience: {
          recruiter: 45,
          hiring_manager: 35,
          candidate: 15,
          admin: 5
        },
        commonFeedbackCategories: [
          { category: 'clarity', count: 89 },
          { category: 'completeness', count: 67 },
          { category: 'accuracy', count: 45 }
        ],
        explanationTypes: {
          match: 70,
          non_match: 25,
          algorithm: 5
        },
        averageProcessingTime: 245,
        timeRange,
        generatedAt: new Date()
      };

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Explanation analytics retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve explanation analytics'
      });
    }
  }
);

/**
 * POST /api/explainable-ai/request-explanation
 * Request explanation for a specific decision (candidate-initiated)
 */
router.post('/request-explanation',
  roleMiddleware(['candidate']),
  [
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('requestType').isIn(['match_decision', 'rejection_reason', 'algorithm_details']).withMessage('Invalid request type'),
    body('message').optional().isString().withMessage('Message must be a string')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { jobId, requestType, message } = req.body;
      const candidateId = req.user.candidateId;

      // This would create an explanation request in the database
      // and potentially trigger an automated explanation generation
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Explanation request received', {
        requestId,
        candidateId,
        jobId,
        requestType,
        message
      });

      res.json({
        success: true,
        data: {
          requestId,
          status: 'pending',
          estimatedCompletionTime: '2-5 minutes',
          message: 'Your explanation request has been received and is being processed'
        }
      });

    } catch (error) {
      logger.error('Explanation request failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit explanation request'
      });
    }
  }
);

/**
 * GET /api/explainable-ai/request/:requestId/status
 * Check status of explanation request
 */
router.get('/request/:requestId/status',
  roleMiddleware(['candidate', 'admin', 'recruiter', 'hiring_manager']),
  [
    param('requestId').notEmpty().withMessage('Request ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { requestId } = req.params;

      // This would check the request status in the database
      // For now, return a placeholder status
      res.json({
        success: true,
        data: {
          requestId,
          status: 'completed',
          completedAt: new Date(),
          explanationId: `exp_${requestId}`,
          message: 'Explanation has been generated and is ready for viewing'
        }
      });

    } catch (error) {
      logger.error('Request status check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check request status'
      });
    }
  }
);

export default router;