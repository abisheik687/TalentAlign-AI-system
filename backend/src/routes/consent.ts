import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ConsentController } from '@/controllers/ConsentController';
import { authMiddleware, requireRole } from '@/middleware/auth';
import { USER_ROLES } from '@/constants/roles';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation rules
const recordConsentValidation = [
  body('consentType')
    .isIn(['data_processing', 'ai_analysis', 'profile_sharing', 'marketing', 'analytics', 'third_party_sharing'])
    .withMessage('Valid consent type is required'),
  body('granted')
    .isBoolean()
    .withMessage('Granted must be a boolean'),
  body('purpose')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Purpose is required and must be less than 500 characters'),
  body('dataTypes')
    .isArray({ min: 1 })
    .withMessage('Data types array is required'),
  body('dataTypes.*')
    .isString()
    .withMessage('Each data type must be a string'),
  body('retentionPeriod')
    .isInt({ min: 0 })
    .withMessage('Retention period must be a non-negative integer'),
  body('legalBasis')
    .optional()
    .isIn(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'])
    .withMessage('Valid legal basis is required'),
  body('jurisdiction')
    .optional()
    .isString()
    .isLength({ min: 2, max: 10 })
    .withMessage('Jurisdiction must be 2-10 characters'),
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Valid user ID is required'),
];

const userIdParamValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
];

const consentTypeParamValidation = [
  param('consentType')
    .isIn(['data_processing', 'ai_analysis', 'profile_sharing', 'marketing', 'analytics', 'third_party_sharing'])
    .withMessage('Valid consent type is required'),
];

const revokeConsentValidation = [
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
];

const updateConsentValidation = [
  body('purpose')
    .optional()
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Purpose must be less than 500 characters'),
  body('dataTypes')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Data types must be an array'),
  body('dataTypes.*')
    .optional()
    .isString()
    .withMessage('Each data type must be a string'),
  body('retentionPeriod')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Retention period must be a non-negative integer'),
];

const validateConsentValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('requiredConsents')
    .isArray({ min: 1 })
    .withMessage('Required consents array is required'),
  body('requiredConsents.*')
    .isIn(['data_processing', 'ai_analysis', 'profile_sharing', 'marketing', 'analytics', 'third_party_sharing'])
    .withMessage('Each consent type must be valid'),
  body('processingPurpose')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Processing purpose is required and must be less than 500 characters'),
];

const reportQueryValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('consentType')
    .optional()
    .isIn(['data_processing', 'ai_analysis', 'profile_sharing', 'marketing', 'analytics', 'third_party_sharing'])
    .withMessage('Valid consent type is required'),
];

// Routes

/**
 * GET /api/consent/types
 * Get available consent types and their descriptions
 */
router.get('/types', ConsentController.getConsentTypes);

/**
 * POST /api/consent
 * Record user consent
 */
router.post(
  '/',
  recordConsentValidation,
  ConsentController.recordConsent
);

/**
 * GET /api/consent/users/:userId
 * Get all consent records for a user
 */
router.get(
  '/users/:userId',
  userIdParamValidation,
  ConsentController.getUserConsents
);

/**
 * GET /api/consent/users/:userId/:consentType
 * Check if user has specific consent
 */
router.get(
  '/users/:userId/:consentType',
  [...userIdParamValidation, ...consentTypeParamValidation],
  ConsentController.checkConsent
);

/**
 * DELETE /api/consent/users/:userId/:consentType
 * Revoke user consent
 */
router.delete(
  '/users/:userId/:consentType',
  [...userIdParamValidation, ...consentTypeParamValidation, ...revokeConsentValidation],
  ConsentController.revokeConsent
);

/**
 * PUT /api/consent/users/:userId/:consentType
 * Update consent terms
 */
router.put(
  '/users/:userId/:consentType',
  [...userIdParamValidation, ...consentTypeParamValidation, ...updateConsentValidation],
  ConsentController.updateConsent
);

/**
 * POST /api/consent/validate
 * Validate consent for data processing
 */
router.post(
  '/validate',
  validateConsentValidation,
  ConsentController.validateConsent
);

/**
 * GET /api/consent/expiring
 * Get expiring consents (admin/ethics officer only)
 */
router.get(
  '/expiring',
  requireRole([USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN, USER_ROLES.ETHICS_OFFICER]),
  ConsentController.getExpiringConsents
);

/**
 * GET /api/consent/report
 * Generate consent report (admin/ethics officer only)
 */
router.get(
  '/report',
  requireRole([USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN, USER_ROLES.ETHICS_OFFICER]),
  reportQueryValidation,
  ConsentController.generateConsentReport
);

// Health check for consent service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Consent service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;