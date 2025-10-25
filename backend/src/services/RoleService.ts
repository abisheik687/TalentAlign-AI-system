import { User } from '@/types/auth';
import { ROLE_PERMISSIONS, USER_ROLES, hasPermission, hasAnyPermission, getRoleLevel } from '@/constants/roles';
import { logger } from '@/utils/logger';

export class RoleService {
  /**
   * Check if user has a specific permission
   */
  static hasPermission(user: User, permission: string): boolean {
    if (!user || !user.isActive) return false;
    
    return hasPermission(user.role, permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(user: User, permissions: string[]): boolean {
    if (!user || !user.isActive) return false;
    
    return hasAnyPermission(user.role, permissions);
  }

  /**
   * Check if user has all specified permissions
   */
  static hasAllPermissions(user: User, permissions: string[]): boolean {
    if (!user || !user.isActive) return false;
    
    return permissions.every(permission => hasPermission(user.role, permission));
  }

  /**
   * Check if user has a specific role
   */
  static hasRole(user: User, role: string): boolean {
    if (!user || !user.isActive) return false;
    
    return user.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(user: User, roles: string[]): boolean {
    if (!user || !user.isActive) return false;
    
    return roles.includes(user.role);
  }

  /**
   * Check if user can access another user's data
   */
  static canAccessUser(currentUser: User, targetUserId: string): boolean {
    if (!currentUser || !currentUser.isActive) return false;
    
    // Users can always access their own data
    if (currentUser.id === targetUserId) return true;
    
    // Admins and system admins can access any user
    if (this.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN])) {
      return true;
    }
    
    // Ethics officers can access user data for compliance purposes
    if (this.hasRole(currentUser, USER_ROLES.ETHICS_OFFICER)) {
      return true;
    }
    
    // Hiring managers and recruiters can access candidate data
    if (this.hasAnyRole(currentUser, [USER_ROLES.HIRING_MANAGER, USER_ROLES.RECRUITER])) {
      // This would need additional logic to check if the target user is a candidate
      // and if the current user has permission to view that specific candidate
      return this.hasPermission(currentUser, 'candidates:read');
    }
    
    return false;
  }

  /**
   * Check if user can modify another user's data
   */
  static canModifyUser(currentUser: User, targetUserId: string): boolean {
    if (!currentUser || !currentUser.isActive) return false;
    
    // Users can modify their own profile (limited fields)
    if (currentUser.id === targetUserId) {
      return this.hasPermission(currentUser, 'profile:update');
    }
    
    // Only admins and system admins can modify other users
    return this.hasAnyRole(currentUser, [USER_ROLES.ADMIN, USER_ROLES.SYSTEM_ADMIN]);
  }

  /**
   * Check if user can assign roles
   */
  static canAssignRole(currentUser: User, targetRole: string): boolean {
    if (!currentUser || !currentUser.isActive) return false;
    
    const currentUserLevel = getRoleLevel(currentUser.role);
    const targetRoleLevel = getRoleLevel(targetRole);
    
    // Users can only assign roles at or below their level
    return currentUserLevel >= targetRoleLevel && 
           this.hasPermission(currentUser, 'roles:manage');
  }

  /**
   * Get filtered permissions based on user role
   */
  static getFilteredPermissions(user: User, requestedPermissions: string[]): string[] {
    if (!user || !user.isActive) return [];
    
    return requestedPermissions.filter(permission => 
      this.hasPermission(user, permission)
    );
  }

  /**
   * Check if user can access resource with specific conditions
   */
  static canAccessResource(
    user: User, 
    resource: string, 
    action: string, 
    conditions?: Record<string, any>
  ): boolean {
    if (!user || !user.isActive) return false;
    
    const permission = `${resource}:${action}`;
    
    if (!this.hasPermission(user, permission)) {
      return false;
    }
    
    // Apply additional conditions if provided
    if (conditions) {
      return this.evaluateConditions(user, conditions);
    }
    
    return true;
  }

  /**
   * Evaluate additional access conditions
   */
  private static evaluateConditions(user: User, conditions: Record<string, any>): boolean {
    // Department-based access
    if (conditions.department && user.department !== conditions.department) {
      return false;
    }
    
    // Organization-based access (if implemented)
    if (conditions.organizationId && user.organizationId !== conditions.organizationId) {
      return false;
    }
    
    // Time-based access
    if (conditions.timeRestriction) {
      const now = new Date();
      const startTime = new Date(conditions.timeRestriction.start);
      const endTime = new Date(conditions.timeRestriction.end);
      
      if (now < startTime || now > endTime) {
        return false;
      }
    }
    
    // Custom conditions can be added here
    
    return true;
  }

  /**
   * Get user's effective permissions (including inherited ones)
   */
  static getEffectivePermissions(user: User): string[] {
    if (!user || !user.isActive) return [];
    
    const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
    const userPermissions = user.permissions?.map(p => 
      p.actions.map(action => `${p.resource}:${action}`)
    ).flat() || [];
    
    // Combine role permissions with user-specific permissions
    return [...new Set([...rolePermissions, ...userPermissions])];
  }

  /**
   * Check if user can perform bulk operations
   */
  static canPerformBulkOperation(user: User, operation: string, resourceCount: number): boolean {
    if (!user || !user.isActive) return false;
    
    // Define bulk operation limits by role
    const bulkLimits: Record<string, number> = {
      [USER_ROLES.CANDIDATE]: 10,
      [USER_ROLES.RECRUITER]: 100,
      [USER_ROLES.HIRING_MANAGER]: 200,
      [USER_ROLES.ADMIN]: 1000,
      [USER_ROLES.ETHICS_OFFICER]: 500,
      [USER_ROLES.SYSTEM_ADMIN]: Infinity,
    };
    
    const userLimit = bulkLimits[user.role] || 0;
    
    return resourceCount <= userLimit && this.hasPermission(user, operation);
  }

  /**
   * Log access attempt for audit purposes
   */
  static logAccessAttempt(
    user: User, 
    resource: string, 
    action: string, 
    granted: boolean,
    additionalInfo?: Record<string, any>
  ): void {
    logger.info('Access attempt logged', {
      userId: user.id,
      userRole: user.role,
      resource,
      action,
      granted,
      timestamp: new Date().toISOString(),
      ...additionalInfo,
    });
  }

  /**
   * Get role hierarchy for user
   */
  static getRoleHierarchy(user: User): string[] {
    if (!user || !user.isActive) return [];
    
    const userLevel = getRoleLevel(user.role);
    
    return Object.entries(ROLE_PERMISSIONS)
      .filter(([role]) => getRoleLevel(role) <= userLevel)
      .map(([role]) => role);
  }

  /**
   * Check if user can delegate permissions
   */
  static canDelegatePermission(user: User, permission: string, targetUser: User): boolean {
    if (!user || !user.isActive || !targetUser || !targetUser.isActive) return false;
    
    // User must have the permission they want to delegate
    if (!this.hasPermission(user, permission)) return false;
    
    // User must have delegation rights
    if (!this.hasPermission(user, 'permissions:delegate')) return false;
    
    // Cannot delegate to users with higher role level
    const currentUserLevel = getRoleLevel(user.role);
    const targetUserLevel = getRoleLevel(targetUser.role);
    
    return currentUserLevel >= targetUserLevel;
  }

  /**
   * Validate role transition
   */
  static canTransitionRole(currentRole: string, newRole: string, requestingUser: User): boolean {
    if (!requestingUser || !requestingUser.isActive) return false;
    
    // Check if requesting user can assign the new role
    if (!this.canAssignRole(requestingUser, newRole)) return false;
    
    // Define allowed role transitions
    const allowedTransitions: Record<string, string[]> = {
      [USER_ROLES.CANDIDATE]: [USER_ROLES.RECRUITER],
      [USER_ROLES.RECRUITER]: [USER_ROLES.HIRING_MANAGER, USER_ROLES.CANDIDATE],
      [USER_ROLES.HIRING_MANAGER]: [USER_ROLES.RECRUITER, USER_ROLES.ADMIN],
      [USER_ROLES.ADMIN]: [USER_ROLES.HIRING_MANAGER, USER_ROLES.ETHICS_OFFICER],
      [USER_ROLES.ETHICS_OFFICER]: [USER_ROLES.ADMIN],
      [USER_ROLES.SYSTEM_ADMIN]: Object.values(USER_ROLES),
    };
    
    const allowedTargetRoles = allowedTransitions[currentRole] || [];
    
    return allowedTargetRoles.includes(newRole);
  }

  /**
   * Check if user can access candidate data based on consent
   */
  static async canAccessCandidateData(
    user: User, 
    candidateId: string, 
    dataType: string
  ): Promise<boolean> {
    if (!user || !user.isActive) return false;
    
    // Check basic permission first
    if (!this.hasPermission(user, 'candidates:read')) return false;
    
    // Import ConsentService to check consent
    const { ConsentService } = require('@/services/ConsentService');
    
    // Check if candidate has given consent for this type of data access
    const hasConsent = await ConsentService.hasValidConsent(candidateId, dataType);
    
    if (!hasConsent) {
      this.logAccessAttempt(user, 'candidate_data', 'read', false, {
        candidateId,
        dataType,
        reason: 'no_consent'
      });
      return false;
    }
    
    this.logAccessAttempt(user, 'candidate_data', 'read', true, {
      candidateId,
      dataType
    });
    
    return true;
  }

  /**
   * Get data access permissions based on role and consent
   */
  static async getDataAccessPermissions(user: User, candidateId: string): Promise<string[]> {
    if (!user || !user.isActive) return [];
    
    const { ConsentService } = require('@/services/ConsentService');
    
    // Define data types that require consent
    const dataTypes = [
      'personal_info',
      'professional_info', 
      'skills_assessment',
      'behavioral_data',
      'communication_data',
      'technical_metadata'
    ];
    
    const allowedDataTypes: string[] = [];
    
    for (const dataType of dataTypes) {
      const hasConsent = await ConsentService.hasValidConsent(candidateId, dataType);
      const hasPermission = this.hasPermission(user, `candidates:read:${dataType}`);
      
      if (hasConsent && hasPermission) {
        allowedDataTypes.push(dataType);
      }
    }
    
    return allowedDataTypes;
  }

  /**
   * Check if user can perform AI analysis on candidate data
   */
  static async canPerformAIAnalysis(user: User, candidateId: string): Promise<boolean> {
    if (!user || !user.isActive) return false;
    
    // Check if user has AI analysis permission
    if (!this.hasPermission(user, 'ai_analysis:execute')) return false;
    
    // Check if candidate has consented to AI analysis
    const { ConsentService } = require('@/services/ConsentService');
    const hasConsent = await ConsentService.hasValidConsent(candidateId, 'ai_analysis');
    
    if (!hasConsent) {
      this.logAccessAttempt(user, 'ai_analysis', 'execute', false, {
        candidateId,
        reason: 'no_ai_consent'
      });
      return false;
    }
    
    return true;
  }

  /**
   * Check if user can access bias analysis results
   */
  static canAccessBiasAnalysis(user: User, analysisLevel: 'basic' | 'detailed' | 'full'): boolean {
    if (!user || !user.isActive) return false;
    
    const requiredPermissions: Record<string, string> = {
      'basic': 'bias_analysis:read_basic',
      'detailed': 'bias_analysis:read_detailed', 
      'full': 'bias_analysis:read_full'
    };
    
    return this.hasPermission(user, requiredPermissions[analysisLevel]);
  }

  /**
   * Check if user can modify ethical AI settings
   */
  static canModifyEthicalSettings(user: User, settingType: string): boolean {
    if (!user || !user.isActive) return false;
    
    // Only ethics officers and system admins can modify ethical settings
    if (!this.hasAnyRole(user, [USER_ROLES.ETHICS_OFFICER, USER_ROLES.SYSTEM_ADMIN])) {
      return false;
    }
    
    return this.hasPermission(user, `ethical_settings:${settingType}`);
  }

  /**
   * Get role-based dashboard configuration
   */
  static getDashboardConfig(user: User): Record<string, any> {
    if (!user || !user.isActive) return {};
    
    const baseConfig = {
      widgets: [],
      permissions: this.getEffectivePermissions(user),
      role: user.role
    };
    
    switch (user.role) {
      case USER_ROLES.CANDIDATE:
        return {
          ...baseConfig,
          widgets: ['profile_completion', 'job_matches', 'application_status', 'consent_management'],
          defaultView: 'job_search',
          features: ['profile_management', 'job_applications', 'consent_control']
        };
        
      case USER_ROLES.RECRUITER:
        return {
          ...baseConfig,
          widgets: ['candidate_pipeline', 'job_postings', 'bias_alerts', 'matching_results'],
          defaultView: 'candidate_search',
          features: ['candidate_search', 'job_posting', 'bias_monitoring', 'interview_scheduling']
        };
        
      case USER_ROLES.HIRING_MANAGER:
        return {
          ...baseConfig,
          widgets: ['team_pipeline', 'interview_schedule', 'bias_reports', 'hiring_metrics'],
          defaultView: 'team_overview',
          features: ['team_management', 'interview_coordination', 'decision_making', 'reporting']
        };
        
      case USER_ROLES.ETHICS_OFFICER:
        return {
          ...baseConfig,
          widgets: ['bias_dashboard', 'compliance_status', 'audit_logs', 'fairness_metrics'],
          defaultView: 'ethics_overview',
          features: ['bias_monitoring', 'compliance_management', 'audit_review', 'policy_enforcement']
        };
        
      case USER_ROLES.ADMIN:
        return {
          ...baseConfig,
          widgets: ['system_overview', 'user_management', 'security_alerts', 'performance_metrics'],
          defaultView: 'admin_dashboard',
          features: ['user_management', 'system_configuration', 'security_monitoring', 'analytics']
        };
        
      case USER_ROLES.SYSTEM_ADMIN:
        return {
          ...baseConfig,
          widgets: ['system_health', 'security_dashboard', 'audit_overview', 'performance_analytics'],
          defaultView: 'system_dashboard',
          features: ['full_system_access', 'security_management', 'audit_control', 'system_maintenance']
        };
        
      default:
        return baseConfig;
    }
  }
}