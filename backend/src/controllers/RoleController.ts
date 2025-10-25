import { Request, Response } from 'express';
import { RoleService } from '@/services/RoleService';
import { logger } from '@/utils/logger';
import { validationResult } from 'express-validator';
import { USER_ROLES, ROLE_PERMISSIONS, ROLE_DISPLAY_NAMES } from '@/constants/roles';

export class RoleController {
  /**
   * Get all available roles
   */
  static async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      
      // Only admins and system admins can view all roles
      if (!RoleService.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to view roles',
          },
        });
        return;
      }

      const roles = Object.entries(USER_ROLES).map(([key, value]) => ({
        key,
        value,
        displayName: ROLE_DISPLAY_NAMES[value as keyof typeof ROLE_DISPLAY_NAMES],
        permissions: ROLE_PERMISSIONS[value as keyof typeof ROLE_PERMISSIONS] || [],
      }));

      res.status(200).json({
        success: true,
        data: { roles },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get roles error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Get permissions for a specific role
   */
  static async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { role } = req.params;

      if (!RoleService.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to view role permissions',
          },
        });
        return;
      }

      const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
      
      if (!permissions) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          role,
          permissions,
          displayName: ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES],
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get role permissions error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Assign role to user
   */
  static async assignRole(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const currentUser = req.user!;
      const { userId, role } = req.body;

      // Check if current user can assign this role
      if (!RoleService.canAssignRole(currentUser, role)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to assign this role',
          },
        });
        return;
      }

      // Get target user
      const UserModel = require('@/models/User').default;
      const targetUser = await UserModel.findById(userId);
      
      if (!targetUser) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      // Check if role transition is allowed
      if (!RoleService.canTransitionRole(targetUser.role, role, currentUser)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE_TRANSITION',
            message: 'Invalid role transition',
          },
        });
        return;
      }

      // Update user role and permissions
      const newPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
      const formattedPermissions = newPermissions.map(permission => {
        const [resource, action] = permission.split(':');
        return { resource, actions: [action] };
      });

      const oldRole = targetUser.role;
      targetUser.role = role;
      targetUser.permissions = formattedPermissions;
      targetUser.updatedAt = new Date();

      await targetUser.save();

      // Log role assignment
      logger.info('Role assigned', {
        assignedBy: currentUser.id,
        targetUserId: userId,
        oldRole,
        newRole: role,
        timestamp: new Date(),
      });

      res.status(200).json({
        success: true,
        data: {
          user: targetUser.toObject(),
          message: `Role changed from ${oldRole} to ${role}`,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Assign role error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Check user permissions
   */
  static async checkPermissions(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Permissions must be an array',
          },
        });
        return;
      }

      const permissionResults = permissions.map(permission => ({
        permission,
        granted: RoleService.hasPermission(currentUser, permission),
      }));

      const effectivePermissions = RoleService.getEffectivePermissions(currentUser);

      res.status(200).json({
        success: true,
        data: {
          userId: currentUser.id,
          role: currentUser.role,
          requestedPermissions: permissionResults,
          effectivePermissions,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Check permissions error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Get user's effective permissions
   */
  static async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { userId } = req.params;

      // Users can view their own permissions, admins can view any user's permissions
      if (userId !== currentUser.id && !RoleService.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN])) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to view user permissions',
          },
        });
        return;
      }

      let targetUser = currentUser;
      
      if (userId !== currentUser.id) {
        const UserModel = require('@/models/User').default;
        targetUser = await UserModel.findById(userId);
        
        if (!targetUser) {
          res.status(404).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
          return;
        }
      }

      const effectivePermissions = RoleService.getEffectivePermissions(targetUser);
      const roleHierarchy = RoleService.getRoleHierarchy(targetUser);

      res.status(200).json({
        success: true,
        data: {
          userId: targetUser.id,
          role: targetUser.role,
          effectivePermissions,
          roleHierarchy,
          canDelegate: RoleService.hasPermission(targetUser, 'permissions:delegate'),
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Get user permissions error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  /**
   * Validate bulk operation permissions
   */
  static async validateBulkOperation(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const { operation, resourceCount } = req.body;

      if (!operation || typeof resourceCount !== 'number') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Operation and resourceCount are required',
          },
        });
        return;
      }

      const canPerform = RoleService.canPerformBulkOperation(currentUser, operation, resourceCount);

      res.status(200).json({
        success: true,
        data: {
          operation,
          resourceCount,
          allowed: canPerform,
          userRole: currentUser.role,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    } catch (error) {
      logger.error('Validate bulk operation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }
}