import { Router } from 'express';
import { body, param } from 'express-validator';
import { ResumeController } from '@/controllers/ResumeController';
import { authMiddleware, requireRole } from '@/middleware/auth';
import { USER_ROLES } from '@/constants/roles';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation rules
const analyzeResumeValidation = [
  body('candidateId')
    .optional()
    .isMongoId()
    .withMessage('Valid candidate ID is required'),
  body('anonymize')
    .optional()
    .isBoolean()
    .withMessage('Anonymize must be a boolean'),
];

const analysisIdParamValidation = [
  param('analysisId')
    .isUUID()
    .withMessage('Valid analysis ID is required'),
];

const candidateIdParamValidation = [
  param('candidateId')
    .isMongoId()
    .withMessage('Valid candidate ID is required'),
];

// Routes

/**
 * GET /api/resume/supported-types
 * Get supported file types for resume upload
 */
router.get('/supported-types', ResumeController.getSupportedFileTypes);

/**
 * POST /api/resume/analyze
 * Upload and analyze resume
 */
router.post(
  '/analyze',
  ResumeController.uploadMiddleware,
  analyzeResumeValidation,
  ResumeController.analyzeResume
);

/**
 * GET /api/resume/analysis/:analysisId
 * Get resume analysis by ID
 */
router.get(
  '/analysis/:analysisId',
  analysisIdParamValidation,
  ResumeController.getAnalysis
);

/**
 * GET /api/resume/candidates/:candidateId/analyses
 * Get all resume analyses for a candidate
 */
router.get(
  '/candidates/:candidateId/analyses',
  candidateIdParamValidation,
  ResumeController.getCandidateAnalyses
);

/**
 * GET /api/resume/analysis/:analysisId/skills
 * Get skills assessment from resume analysis
 */
router.get(
  '/analysis/:analysisId/skills',
  analysisIdParamValidation,
  ResumeController.getSkillsAssessment
);

/**
 * GET /api/resume/analysis/:analysisId/bias
 * Get bias analysis from resume analysis (ethics officer/admin only)
 */
router.get(
  '/analysis/:analysisId/bias',
  requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.ETHICS_OFFICER,
    USER_ROLES.SYSTEM_ADMIN
  ]),
  analysisIdParamValidation,
  ResumeController.getBiasAnalysis
);

// Health check for resume service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Resume service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;