// User roles and permissions constants

export const USER_ROLES = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
  ADMIN: 'admin',
  ETHICS_OFFICER: 'ethics_officer',
  SYSTEM_ADMIN: 'system_admin',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.CANDIDATE]: [
    'profile:read',
    'profile:update',
    'applications:read',
    'applications:create',
    'interviews:read',
    'feedback:read',
    'data:export',
    'data:delete',
    'consent:manage',
  ],
  
  [USER_ROLES.RECRUITER]: [
    'candidates:read',
    'candidates:create',
    'candidates:update',
    'jobs:read',
    'jobs:create',
    'jobs:update',
    'applications:read',
    'applications:update',
    'interviews:read',
    'interviews:create',
    'interviews:update',
    'matching:read',
    'matching:create',
    'bias:read',
    'analytics:read',
    'notes:create',
    'notes:read',
    'notes:update',
  ],
  
  [USER_ROLES.HIRING_MANAGER]: [
    'candidates:read',
    'jobs:read',
    'jobs:create',
    'jobs:update',
    'applications:read',
    'applications:update',
    'interviews:read',
    'interviews:create',
    'interviews:update',
    'interviews:schedule',
    'matching:read',
    'bias:read',
    'analytics:read',
    'decisions:make',
    'offers:create',
    'offers:approve',
    'feedback:create',
    'feedback:read',
    'team:manage',
  ],
  
  [USER_ROLES.ADMIN]: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'roles:manage',
    'permissions:manage',
    'organizations:manage',
    'settings:read',
    'settings:update',
    'audit:read',
    'reports:read',
    'reports:create',
    'integrations:manage',
    'billing:manage',
  ],
  
  [USER_ROLES.ETHICS_OFFICER]: [
    'bias:read',
    'bias:investigate',
    'bias:resolve',
    'ethics:read',
    'ethics:update',
    'compliance:read',
    'compliance:manage',
    'audits:read',
    'audits:create',
    'policies:read',
    'policies:update',
    'training:manage',
    'reports:ethics',
    'alerts:manage',
    'investigations:manage',
  ],
  
  [USER_ROLES.SYSTEM_ADMIN]: [
    'system:read',
    'system:update',
    'system:maintain',
    'logs:read',
    'monitoring:read',
    'monitoring:configure',
    'backups:manage',
    'security:manage',
    'performance:monitor',
    'infrastructure:manage',
    'deployments:manage',
  ],
} as const;

export const PERMISSION_CATEGORIES = {
  PROFILE: 'profile',
  CANDIDATES: 'candidates',
  JOBS: 'jobs',
  APPLICATIONS: 'applications',
  INTERVIEWS: 'interviews',
  MATCHING: 'matching',
  BIAS: 'bias',
  ETHICS: 'ethics',
  ANALYTICS: 'analytics',
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  ORGANIZATIONS: 'organizations',
  SETTINGS: 'settings',
  AUDIT: 'audit',
  REPORTS: 'reports',
  COMPLIANCE: 'compliance',
  SYSTEM: 'system',
  DATA: 'data',
  CONSENT: 'consent',
  NOTES: 'notes',
  DECISIONS: 'decisions',
  OFFERS: 'offers',
  FEEDBACK: 'feedback',
  TEAM: 'team',
  INTEGRATIONS: 'integrations',
  BILLING: 'billing',
  INVESTIGATIONS: 'investigations',
  POLICIES: 'policies',
  TRAINING: 'training',
  ALERTS: 'alerts',
  LOGS: 'logs',
  MONITORING: 'monitoring',
  BACKUPS: 'backups',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  INFRASTRUCTURE: 'infrastructure',
  DEPLOYMENTS: 'deployments',
} as const;

export const PERMISSION_ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  APPROVE: 'approve',
  REJECT: 'reject',
  SCHEDULE: 'schedule',
  EXPORT: 'export',
  IMPORT: 'import',
  INVESTIGATE: 'investigate',
  RESOLVE: 'resolve',
  CONFIGURE: 'configure',
  MAINTAIN: 'maintain',
  MONITOR: 'monitor',
  MAKE: 'make',
} as const;

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY = {
  [USER_ROLES.SYSTEM_ADMIN]: 6,
  [USER_ROLES.ADMIN]: 5,
  [USER_ROLES.ETHICS_OFFICER]: 4,
  [USER_ROLES.HIRING_MANAGER]: 3,
  [USER_ROLES.RECRUITER]: 2,
  [USER_ROLES.CANDIDATE]: 1,
} as const;

// Default role assignments
export const DEFAULT_ROLE = USER_ROLES.CANDIDATE;

// Role display names
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.CANDIDATE]: 'Candidate',
  [USER_ROLES.RECRUITER]: 'Recruiter',
  [USER_ROLES.HIRING_MANAGER]: 'Hiring Manager',
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.ETHICS_OFFICER]: 'Ethics Officer',
  [USER_ROLES.SYSTEM_ADMIN]: 'System Administrator',
} as const;

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  [USER_ROLES.CANDIDATE]: 'Job seekers who can apply for positions and manage their profiles',
  [USER_ROLES.RECRUITER]: 'Recruitment professionals who source and screen candidates',
  [USER_ROLES.HIRING_MANAGER]: 'Managers who make hiring decisions and conduct interviews',
  [USER_ROLES.ADMIN]: 'Organization administrators who manage users and settings',
  [USER_ROLES.ETHICS_OFFICER]: 'Specialists who ensure ethical AI practices and compliance',
  [USER_ROLES.SYSTEM_ADMIN]: 'Technical administrators who manage system infrastructure',
} as const;

// Helper functions
export const hasPermission = (userRole: string, permission: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions?.includes(permission) ?? false;
};

export const hasAnyPermission = (userRole: string, permissions: string[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole: string, permissions: string[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

export const getRoleLevel = (role: string): number => {
  return ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] ?? 0;
};

export const canAccessRole = (userRole: string, targetRole: string): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(targetRole);
};

export const getAllPermissions = (role: string): string[] => {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] ?? [];
};

export const getPermissionsByCategory = (role: string, category: string): string[] => {
  const allPermissions = getAllPermissions(role);
  return allPermissions.filter(permission => permission.startsWith(`${category}:`));
};

// Type exports
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type Permission = string;
export type PermissionCategory = typeof PERMISSION_CATEGORIES[keyof typeof PERMISSION_CATEGORIES];
export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];