import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { DataOwnershipController } from '@/controllers/DataOwnershipController';
import { authMiddleware, requireRole } from '@/middleware/auth';
import { USER_ROLES } from '@/constants/roles';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation rules
const ownershipRequestValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('requestType')
    .isIn(['access_request', 'portability_request', 'rectification_request', 'erasure_request', 'restriction_request', 'objection_request'])
    .withMessage('Valid request type is required'),
  body('dataTypes')
    .optional()
    .isArray()
    .withMessage('Data types must be an array'),
  body('dataTypes.*')
    .optional()
    .isString()
    .withMessage('Each data type must be a string'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Reason must be less than 1000 characters'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Urgency must be low, medium, high, or urgent'),
];

const scheduleDeletionValidation = [
  body('dataTypes')
    .isArray({ min: 1 })
    .withMessage('Data types array is required'),
  body('dataTypes.*')
    .isString()
    .withMessage('Each data type must be a string'),
  body('deletionDate')
    .isISO8601()
    .withMessage('Valid deletion date is required'),
  body('reason')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason is required and must be less than 500 characters'),
];

const dataSharingValidation = [
  body('recipientId')
    .isMongoId()
    .withMessage('Valid recipient ID is required'),
  body('dataTypes')
    .isArray({ min: 1 })
    .withMessage('Data types array is required'),
  body('dataTypes.*')
    .isString()
    .withMessage('Each data type must be a string'),
  body('purpose')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Purpose is required and must be less than 500 characters'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (seconds)'),
  body('restrictions')
    .optional()
    .isArray()
    .withMessage('Restrictions must be an array'),
  body('restrictions.*')
    .optional()
    .isString()
    .withMessage('Each restriction must be a string'),
];

const revokeSharingValidation = [
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
];

const userIdParamValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
];

const dataIdParamValidation = [
  param('dataId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Valid data ID is required'),
];

const sharingIdParamValidation = [
  param('sharingId')
    .isUUID()
    .withMessage('Valid sharing ID is required'),
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

const userIdQueryValidation = [
  query('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
];

// Routes

/**
 * GET /api/data-ownership/request-types
 * Get available data ownership request types
 */
router.get('/request-types', DataOwnershipController.getRequestTypes);

/**
 * GET /api/data-ownership/data-categories
 * Get available data categories that can be managed
 */
router.get('/data-categories', DataOwnershipController.getDataCategories);

/**
 * POST /api/data-ownership/requests
 * Submit data ownership request (GDPR Articles 15-21)
 */
router.post(
  '/requests',
  ownershipRequestValidation,
  DataOwnershipController.submitOwnershipRequest
);

/**
 * GET /api/data-ownership/users/:userId/inventory
 * Get user's comprehensive data inventory
 */
router.get(
  '/users/:userId/inventory',
  userIdParamValidation,
  DataOwnershipController.getDataInventory
);

/**
 * GET /api/data-ownership/data/:dataId/lineage
 * Get data lineage for specific data item
 */
router.get(
  '/data/:dataId/lineage',
  [...dataIdParamValidation, ...userIdQueryValidation],
  DataOwnershipController.getDataLineage
);

/**
 * POST /api/data-ownership/users/:userId/schedule-deletion
 * Schedule automatic data deletion
 */
router.post(
  '/users/:userId/schedule-deletion',
  [...userIdParamValidation, ...scheduleDeletionValidation],
  DataOwnershipController.scheduleAutomaticDeletion
);

/**
 * POST /api/data-ownership/users/:userId/data-sharing
 * Manage data sharing permissions
 */
router.post(
  '/users/:userId/data-sharing',
  [...userIdParamValidation, ...dataSharingValidation],
  DataOwnershipController.manageDataSharing
);

/**
 * DELETE /api/data-ownership/users/:userId/data-sharing/:sharingId
 * Revoke data sharing permissions
 */
router.delete(
  '/users/:userId/data-sharing/:sharingId',
  [...userIdParamValidation, ...sharingIdParamValidation, ...revokeSharingValidation],
  DataOwnershipController.revokeDataSharing
);

/**
 * GET /api/data-ownership/users/:userId/sharing-history
 * Get data sharing history for user
 */
router.get(
  '/users/:userId/sharing-history',
  [...userIdParamValidation, ...dateQueryValidation],
  DataOwnershipController.getDataSharingHistory
);

/**
 * GET /api/data-ownership/users/:userId/report
 * Generate comprehensive data ownership report
 */
router.get(
  '/users/:userId/report',
  userIdParamValidation,
  DataOwnershipController.generateOwnershipReport
);

// Health check for data ownership service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Data ownership service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;