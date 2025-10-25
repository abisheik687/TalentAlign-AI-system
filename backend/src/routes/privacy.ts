import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrivacyController } from '@/controllers/PrivacyController';
import { authMiddleware, requireRole } from '@/middleware/auth';
import { USER_ROLES } from '@/constants/roles';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation rules
const processDataValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('dataType')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Data type is required and must be less than 100 characters'),
  body('processingPurpose')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Processing purpose is required and must be less than 500 characters'),
  body('requiredConsents')
    .isArray({ min: 1 })
    .withMessage('Required consents array is required'),
  body('requiredConsents.*')
    .isString()
    .withMessage('Each consent must be a string'),
  body('data')
    .notEmpty()
    .withMessage('Data is required'),
  body('retentionPeriod')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Retention period must be a non-negative integer'),
];

const anonymizeDataValidation = [
  body('text')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Text is required'),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object'),
  body('options.preserveFormat')
    .optional()
    .isBoolean()
    .withMessage('Preserve format must be a boolean'),
  body('options.useConsistentMapping')
    .optional()
    .isBoolean()
    .withMessage('Use consistent mapping must be a boolean'),
];

const validateAnonymizationValidation = [
  body('originalText')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Original text is required'),
  body('anonymizedText')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Anonymized text is required'),
];

const exportDataValidation = [
  body('format')
    .optional()
    .isIn(['json', 'csv', 'xml'])
    .withMessage('Format must be json, csv, or xml'),
  body('includeAnonymized')
    .optional()
    .isBoolean()
    .withMessage('Include anonymized must be a boolean'),
  body('dataTypes')
    .optional()
    .isArray()
    .withMessage('Data types must be an array'),
  body('dataTypes.*')
    .optional()
    .isString()
    .withMessage('Each data type must be a string'),
];

const deleteDataValidation = [
  body('dataTypes')
    .optional()
    .isArray()
    .withMessage('Data types must be an array'),
  body('dataTypes.*')
    .optional()
    .isString()
    .withMessage('Each data type must be a string'),
  body('reason')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason is required and must be less than 500 characters'),
  body('immediate')
    .optional()
    .isBoolean()
    .withMessage('Immediate must be a boolean'),
];

const userIdParamValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
];

const reportIdParamValidation = [
  param('reportId')
    .isUUID()
    .withMessage('Valid report ID is required'),
];

const exportIdParamValidation = [
  param('exportId')
    .isUUID()
    .withMessage('Valid export ID is required'),
];

const dateQueryValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];

// Routes

/**
 * POST /api/privacy/process-data
 * Process data with privacy controls and anonymization
 */
router.post(
  '/process-data',
  processDataValidation,
  PrivacyController.processData
);

/**
 * POST /api/privacy/anonymize
 * Anonymize text data
 */
router.post(
  '/anonymize',
  requireRole([
    USER_ROLES.RECRUITER,
    USER_ROLES.HIRING_MANAGER,
    USER_ROLES.ADMIN,
    USER_ROLES.ETHICS_OFFICER,
    USER_ROLES.SYSTEM_ADMIN
  ]),
  anonymizeDataValidation,
  PrivacyController.anonymizeData
);

/**
 * POST /api/privacy/validate-anonymization
 * Validate anonymization effectiveness (ethics officer/admin only)
 */
router.post(
  '/validate-anonymization',
  requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.ETHICS_OFFICER,
    USER_ROLES.SYSTEM_ADMIN
  ]),
  validateAnonymizationValidation,
  PrivacyController.validateAnonymization
);

/**
 * POST /api/privacy/users/:userId/export
 * Export user data (GDPR Article 20)
 */
router.post(
  '/users/:userId/export',
  [...userIdParamValidation, ...exportDataValidation],
  PrivacyController.exportUserData
);

/**
 * DELETE /api/privacy/users/:userId/data
 * Delete user data (GDPR Article 17)
 */
router.delete(
  '/users/:userId/data',
  [...userIdParamValidation, ...deleteDataValidation],
  PrivacyController.deleteUserData
);

/**
 * GET /api/privacy/reports
 * Generate privacy compliance report (ethics officer/admin only)
 */
router.get(
  '/reports',
  requireRole([
    USER_ROLES.ADMIN,
    USER_ROLES.ETHICS_OFFICER,
    USER_ROLES.SYSTEM_ADMIN
  ]),
  dateQueryValidation,
  PrivacyController.generatePrivacyReport
);

/**
 * GET /api/privacy/anonymization-reports/:reportId
 * Get anonymization report
 */
router.get(
  '/anonymization-reports/:reportId',
  requireRole([
    USER_ROLES.RECRUITER,
    USER_ROLES.HIRING_MANAGER,
    USER_ROLES.ADMIN,
    USER_ROLES.ETHICS_OFFICER,
    USER_ROLES.SYSTEM_ADMIN
  ]),
  reportIdParamValidation,
  PrivacyController.getAnonymizationReport
);

/**
 * GET /api/privacy/exports/:exportId/download
 * Download exported data
 */
router.get(
  '/exports/:exportId/download',
  exportIdParamValidation,
  PrivacyController.downloadExportedData
);

/**
 * GET /api/privacy/users/:userId/activity
 * Get privacy activity log for user
 */
router.get(
  '/users/:userId/activity',
  [...userIdParamValidation, ...dateQueryValidation],
  PrivacyController.getPrivacyActivityLog
);

// Health check for privacy service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Privacy service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;