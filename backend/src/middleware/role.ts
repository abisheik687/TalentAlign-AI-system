import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { logger } from '@/utils/logger';

/**
 * Role-based Access Control Middleware
 * Implements permission-based route protection and candidate consent management
 * Requirements: 7.2, 10.4
 */

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  name: string;
  permissions: Permission[];
  inherits?: string[];
}

export class RoleService {
  private static roles: Map<string, Role> = new Map();

  static {
    this.initializeRoles();
  }

  /**
   * Initialize default roles and permissions
   */
  private static initializeRoles(): void {
    // Admin role - full access
    this.roles.set('admin', {
      name: 'admin',
      permissions: [
        { resource: '*', action: '*' }
      ]
    });

    // Recruiter role
    this.roles.set('recruiter', {
      name: 'recruiter',
      permissions: [
        { resource: 'candidates', action: 'read' },
        { resource: 'candidates', action: 'create' },
        { resource: 'candidates', action: 'update', conditions: { own: true } },
        { resource: 'jobs', action: 'read' },
        { resource: 'jobs', action: 'create' },
        { resource: 'jobs', action: 'update', conditions: { own: true } },
        { resource: 'applications', action: 'read' },
        { resource: 'applications', action: 'update' },
        { resource: 'interviews', action: 'read' },
        { resource: 'interviews', action: 'create' },
        { resource: 'interviews', action: 'update' },
        { resource: 'bias_monitoring', action: 'read' },
        { resource: 'fairness_metrics', action: 'read' },
        { resource: 'matching', action: 'read' },
        { resource: 'matching', action: 'create' }
      ]
    });

    // Hiring Manager role
    this.roles.set('hiring_manager', {
      name: 'hiring_manager',
      permissions: [
        { resource: 'candidates', action: 'read', conditions: { department: true } },
        { resource: 'jobs', action: 'read', conditions: { department: true } },
        { resource: 'jobs', action: 'create' },
        { resource: 'jobs', action: 'update', conditions: { own: true } },
        { resource: 'applications', action: 'read', conditions: { department: true } },
        { resource: 'applications', action: 'update', conditions: { department: true } },
        { resource: 'interviews', action: 'read', conditions: { department: true } },
        { resource: 'interviews', action: 'create' },
        { resource: 'interviews', action: 'update', conditions: { own: true } },
        { resource: 'hiring_decisions', action: 'create' },
        { resource: 'hiring_decisions', action: 'update', conditions: { own: true } },
        { resource: 'bias_monitoring', action: 'read' },
        { resource: 'fairness_metrics', action: 'read' },
        { resource: 'matching', action: 'read' }
      ]
    });

    // Candidate role
    this.roles.set('candidate', {
      name: 'candidate',
      permissions: [
        { resource: 'profile', action: 'read', conditions: { own: true } },
        { resource: 'profile', action: 'update', conditions: { own: true } },
        { resource: 'profile', action: 'delete', conditions: { own: true } },
        { resource: 'applications', action: 'read', conditions: { own: true } },
        { resource: 'applications', action: 'create' },
        { resource: 'interviews', action: 'read', conditions: { own: true } },
        { resource: 'feedback', action: 'create', conditions: { own: true } },
        { resource: 'consent', action: 'read', conditions: { own: true } },
        { resource: 'consent', action: 'update', conditions: { own: true } },
        { resource: 'data_export', action: 'create', conditions: { own: true } },
        { resource: 'explanations', action: 'read', conditions: { own: true } },
        { resource: 'appeals', action: 'create', conditions: { own: true } }
      ]
    });

    // HR Admin role
    this.roles.set('hr_admin', {
      name: 'hr_admin',
      permissions: [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'update' },
        { resource: 'roles', action: 'read' },
        { resource: 'roles', action: 'update' },
        { resource: 'compliance', action: 'read' },
        { resource: 'compliance', action: 'create' },
        { resource: 'audit_logs', action: 'read' },
        { resource: 'bias_monitoring', action: 'read' },
        { resource: 'bias_monitoring', action: 'update' },
        { resource: 'fairness_metrics', action: 'read' },
        { resource: 'reports', action: 'read' },
        { resource: 'reports', action: 'create' }
      ],
      inherits: ['recruiter']
    });

    // Ethics Officer role
    this.roles.set('ethics_officer', {
      name: 'ethics_officer',
      permissions: [
        { resource: 'bias_monitoring', action: '*' },
        { resource: 'fairness_metrics', action: '*' },
        { resource: 'compliance', action: '*' },
        { resource: 'audit_logs', action: 'read' },
        { resource: 'ethics_dashboard', action: '*' },
        { resource: 'bias_alerts', action: '*' },
        { resource: 'appeals', action: 'read' },
        { resource: 'appeals', action: 'update' },
        { resource: 'reports', action: '*' }
      ]
    });
  }

  /**
   * Get role by name
   */
  static getRole(roleName: string): Role | undefined {
    return this.roles.get(roleName);
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  static getRolePermissions(roleName: string): Permission[] {
    const role = this.getRole(roleName);
    if (!role) return [];

    let permissions = [...role.permissions];

    // Add inherited permissions
    if (role.inherits) {
      for (const inheritedRole of role.inherits) {
        const inheritedPermissions = this.getRolePermissions(inheritedRole);
        permissions = [...permissions, ...inheritedPermissions];
      }
    }

    return permissions;
  }

  /**
   * Check if user has permission for resource and action
   */
  static hasPermission(
    userRole: string,
    resource: string,
    action: string,
    context: Record<string, any> = {}
  ): boolean {
    const permissions = this.getRolePermissions(userRole);

    for (const permission of permissions) {
      // Check for wildcard permissions
      if (permission.resource === '*' && permission.action === '*') {
        return true;
      }

      // Check for resource wildcard
      if (permission.resource === '*' && permission.action === action) {
        return true;
      }

      // Check for action wildcard
      if (permission.resource === resource && permission.action === '*') {
        return true;
      }

      // Check exact match
      if (permission.resource === resource && permission.action === action) {
        // Check conditions if present
        if (permission.conditions) {
          if (!this.checkConditions(permission.conditions, context)) {
            continue;
          }
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Check permission conditions
   */
  private static checkConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'own':
          if (value && !context.isOwner) {
            return false;
          }
          break;
        case 'department':
          if (value && !context.sameDepartment) {
            return false;
          }
          break;
        default:
          if (context[key] !== value) {
            return false;
          }
      }
    }
    return true;
  }

  /**
   * Add custom role
   */
  static addRole(role: Role): void {
    this.roles.set(role.name, role);
  }

  /**
   * Update role permissions
   */
  static updateRole(roleName: string, permissions: Permission[]): boolean {
    const role = this.roles.get(roleName);
    if (!role) return false;

    role.permissions = permissions;
    this.roles.set(roleName, role);
    return true;
  }

  /**
   * Get all available roles
   */
  static getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }
}

/**
 * Role-based access control middleware
 */
export const roleMiddleware = (
  allowedRoles: string[],
  resource?: string,
  action?: string
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const userRole = req.user.role;

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Access denied - insufficient role', {
          userId: req.user.id,
          userRole,
          allowedRoles,
          resource,
          action
        });

        res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
        return;
      }

      // If resource and action are specified, check specific permission
      if (resource && action) {
        const context = {
          userId: req.user.id,
          userRole: req.user.role,
          isOwner: false, // This would be determined based on the specific resource
          sameDepartment: false // This would be determined based on user's department
        };

        if (!RoleService.hasPermission(userRole, resource, action, context)) {
          logger.warn('Access denied - insufficient permissions', {
            userId: req.user.id,
            userRole,
            resource,
            action
          });

          res.status(403).json({
            success: false,
            error: 'Insufficient permissions for this action'
          });
          return;
        }
      }

      next();
    } catch (error) {
      logger.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

/**
 * Permission-based middleware (more granular than role-based)
 */
export const permissionMiddleware = (resource: string, action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Build context for permission check
      const context = {
        userId: req.user.id,
        userRole: req.user.role,
        isOwner: false,
        sameDepartment: false
      };

      // Determine ownership context
      if (req.params.id || req.params.userId) {
        const resourceId = req.params.id || req.params.userId;
        context.isOwner = resourceId === req.user.id;
      }

      // Check permission
      if (!RoleService.hasPermission(req.user.role, resource, action, context)) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          userRole: req.user.role,
          resource,
          action,
          context
        });

        res.status(403).json({
          success: false,
          error: `Permission denied for ${action} on ${resource}`
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

/**
 * Candidate consent validation middleware
 */
export const consentMiddleware = (consentType: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // For candidate users, check their own consent
      let candidateId = req.user.id;

      // For other roles, get candidate ID from request
      if (req.user.role !== 'candidate') {
        candidateId = req.params.candidateId || req.body.candidateId;
        
        if (!candidateId) {
          res.status(400).json({
            success: false,
            error: 'Candidate ID required for consent validation'
          });
          return;
        }
      }

      // Check consent
      const ConsentService = require('@/services/ConsentService').default;
      const hasConsent = await ConsentService.hasConsent(candidateId, consentType);

      if (!hasConsent) {
        logger.warn('Consent required but not granted', {
          candidateId,
          consentType,
          requestedBy: req.user.id
        });

        res.status(403).json({
          success: false,
          error: `Candidate consent required for ${consentType}`,
          code: 'CONSENT_REQUIRED',
          consentType
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Consent middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Consent validation failed'
      });
    }
  };
};

/**
 * Data ownership middleware - ensures users can only access their own data
 */
export const ownershipMiddleware = (resourceField: string = 'userId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Admin can access all data
      if (req.user.role === 'admin') {
        next();
        return;
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: 'Resource ID required'
        });
        return;
      }

      // This would need to be implemented based on the specific resource model
      // For now, we'll assume the resource has a userId field
      const resourceUserId = req.params.userId || req.body.userId;
      
      if (resourceUserId && resourceUserId !== req.user.id) {
        logger.warn('Data ownership violation', {
          userId: req.user.id,
          resourceId,
          resourceUserId
        });

        res.status(403).json({
          success: false,
          error: 'Access denied - not resource owner'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Ownership validation failed'
      });
    }
  };
};

/**
 * Department-based access middleware
 */
export const departmentMiddleware = () => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Admin and HR can access all departments
      if (['admin', 'hr_admin', 'ethics_officer'].includes(req.user.role)) {
        next();
        return;
      }

      // Get user's department
      const User = require('@/models/User').default;
      const user = await User.findById(req.user.id).select('department');
      
      if (!user || !user.department) {
        res.status(403).json({
          success: false,
          error: 'Department access required'
        });
        return;
      }

      // Add department context to request
      req.user.department = user.department;
      
      next();
    } catch (error) {
      logger.error('Department middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Department validation failed'
      });
    }
  };
};

export { RoleService };
export default roleMiddleware;