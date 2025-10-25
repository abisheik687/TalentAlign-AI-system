import { Router } from 'express';
import { body, param } from 'express-validator';
import { RoleController } from '@/controllers/RoleController';
import { authMiddleware, requireRole, requirePermission } from '@/middleware/auth';
import { USER_ROLES } from '@/constants/roles';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation rules
const assignRoleValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('role')
    .isIn(Object.values(USER_ROLES))
    .withMessage('Valid role is required'),
];

const checkPermissionsValidation = [
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('Permissions array is required'),
  body('permissions.*')
    .isString()
    .matches(/^[a-z_]+:[a-z_]+$/)
    .withMessage('Each permission must be in format "resource:action"'),
];

const validateBulkOperationValidation = [
  body('operation')
    .isString()
    .matches(/^[a-z_]+:[a-z_]+$/)
    .withMessage('Operation must be in format "resource:action"'),
  body('resourceCount')
    .isInt({ min: 1 })
    .withMessage('Resource count must be a positive integer'),
];

const userIdParamValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
];

// Routes

/**
 * GET /api/roles
 * Get all available roles (admin/system admin only)
 */
router.get(
  '/',
  requireRole([USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN]),
  RoleController.getRoles
);

/**
 * GET /api/roles/:role/permissions
 * Get permissions for a specific role (admin/system admin only)
 */
router.get(
  '/:role/permissions',
  requireRole([USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN]),
  RoleController.getRolePermissions
);

/**
 * POST /api/roles/assign
 * Assign role to user (admin/system admin only)
 */
router.post(
  '/assign',
  requirePermission('roles:manage'),
  assignRoleValidation,
  RoleController.assignRole
);

/**
 * POST /api/roles/check-permissions
 * Check if current user has specific permissions
 */
router.post(
  '/check-permissions',
  checkPermissionsValidation,
  RoleController.checkPermissions
);

/**
 * GET /api/roles/users/:userId/permissions
 * Get user's effective permissions
 */
router.get(
  '/users/:userId/permissions',
  userIdParamValidation,
  RoleController.getUserPermissions
);

/**
 * POST /api/roles/validate-bulk-operation
 * Validate if user can perform bulk operation
 */
router.post(
  '/validate-bulk-operation',
  validateBulkOperationValidation,
  RoleController.validateBulkOperation
);

// Health check for roles service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Roles service is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;