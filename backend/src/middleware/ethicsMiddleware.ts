import { Request, Response, NextFunction } from 'express';
import { EthicsService } from '@/services/EthicsService';
import { EthicalViolationType } from '../../../shared/src/types/ethics';
import { logger } from '@/utils/logger';

// Extend Request interface to include ethics validation
declare global {
  namespace Express {
    interface Request {
      ethicsValidation?: {
        valid: boolean;
        violations: EthicalViolationType[];
        requiresHumanOversight: boolean;
      };
    }
  }
}

/**
 * Middleware to enforce ethical AI requirements on all AI-related operations
 */
export const ethicsMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ethicsService = EthicsService.getInstance();
    const operation = `${req.method}_${req.path}`;
    
    // Skip ethics validation for non-AI operations
    const aiOperationPaths = ['/api/matching', '/api/bias', '/api/analysis', '/api/recommendations'];
    const isAIOperation = aiOperationPaths.some(path => req.path.startsWith(path));
    
    if (!isAIOperation) {
      return next();
    }

    // Validate ethical requirements
    const validation = await ethicsService.validateEthicalRequirements(operation, {
      ...req.body,
      ...req.query,
      candidateId: req.body.candidateId || req.params.candidateId,
      userId: req.user?.id,
    });

    // Attach validation results to request
    req.ethicsValidation = {
      ...validation,
      requiresHumanOversight: ethicsService.requiresHumanOversight(
        operation,
        req.body.confidence || 1.0,
        req.body.riskLevel || 'medium'
      ),
    };

    // Block request if critical violations found
    if (!validation.valid) {
      const criticalViolations = validation.violations.filter(v => 
        v === EthicalViolationType.PII_EXPOSURE ||
        v === EthicalViolationType.MISSING_CONSENT
      );

      if (criticalViolations.length > 0) {
        logger.error('Request blocked due to ethical violations:', {
          operation,
          violations: criticalViolations,
          userId: req.user?.id,
        });

        // Record the violation
        await ethicsService.recordViolation(
          criticalViolations[0],
          `Request blocked: ${operation}`,
          'critical',
          req.body.candidateId ? [req.body.candidateId] : [],
          req.body.jobId ? [req.body.jobId] : []
        );

        return res.status(403).json({
          error: 'Request blocked due to ethical policy violations',
          violations: criticalViolations,
          message: 'This operation cannot proceed without proper consent and data anonymization',
        });
      }
    }

    // Log ethics validation for audit trail
    await ethicsService.createAuditTrailEntry({
      action: `ethics_validation_${operation}`,
      actor: { 
        type: 'user', 
        id: req.user?.id || 'anonymous',
        role: req.user?.role 
      },
      resource: { 
        type: 'data', 
        id: req.body.candidateId || req.body.jobId || operation 
      },
      changes: { 
        validationResult: validation,
        requestData: req.body 
      },
      ethicalImpact: validation.valid ? 'none' : 'medium',
      complianceFlags: validation.violations,
    });

    next();
  } catch (error) {
    logger.error('Ethics middleware error:', error);
    
    // Fail securely - block request if ethics validation fails
    res.status(500).json({
      error: 'Ethics validation failed',
      message: 'Unable to validate ethical requirements for this operation',
    });
  }
};

/**
 * Middleware to enforce human oversight requirements
 */
export const humanOversightMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if human oversight is required
    if (req.ethicsValidation?.requiresHumanOversight) {
      const hasHumanReview = req.body.humanReview || req.headers['x-human-review'];
      
      if (!hasHumanReview) {
        logger.warn('Request requires human oversight:', {
          operation: `${req.method}_${req.path}`,
          userId: req.user?.id,
        });

        return res.status(202).json({
          message: 'This operation requires human oversight',
          requiresHumanReview: true,
          reviewInstructions: 'A human reviewer must approve this operation before it can proceed',
          estimatedReviewTime: '2-4 hours',
        });
      }

      // Validate human review credentials
      const reviewerId = req.body.reviewerId || req.headers['x-reviewer-id'];
      const reviewerRole = req.body.reviewerRole || req.headers['x-reviewer-role'];
      
      if (!reviewerId || !reviewerRole) {
        return res.status(400).json({
          error: 'Invalid human review credentials',
          message: 'Reviewer ID and role are required for human oversight',
        });
      }

      // Log human oversight for audit trail
      const ethicsService = EthicsService.getInstance();
      await ethicsService.createAuditTrailEntry({
        action: `human_oversight_${req.method}_${req.path}`,
        actor: { 
          type: 'user', 
          id: reviewerId,
          role: reviewerRole 
        },
        resource: { 
          type: 'data', 
          id: req.body.candidateId || req.body.jobId || 'operation' 
        },
        changes: { 
          originalRequest: req.body,
          humanReviewProvided: true 
        },
        ethicalImpact: 'low',
        complianceFlags: [],
      });
    }

    next();
  } catch (error) {
    logger.error('Human oversight middleware error:', error);
    res.status(500).json({
      error: 'Human oversight validation failed',
      message: 'Unable to validate human oversight requirements',
    });
  }
};

/**
 * Middleware to add ethical headers to responses
 */
export const ethicsResponseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add ethics-related headers to response
  res.setHeader('X-Ethics-Validated', req.ethicsValidation?.valid ? 'true' : 'false');
  res.setHeader('X-Human-Oversight-Required', req.ethicsValidation?.requiresHumanOversight ? 'true' : 'false');
  res.setHeader('X-Bias-Monitoring', 'enabled');
  res.setHeader('X-Data-Anonymization', 'enforced');
  res.setHeader('X-Explainable-AI', 'required');
  
  // Add audit trail ID for tracking
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Audit-Trail-ID', auditId);

  next();
};