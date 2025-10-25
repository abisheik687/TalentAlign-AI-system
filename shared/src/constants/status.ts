// Status constants for various entities

// Candidate Status
export const CANDIDATE_STATUS = {
  NEW: 'new',
  SCREENING: 'screening',
  QUALIFIED: 'qualified',
  INTERVIEWING: 'interviewing',
  OFFER_PENDING: 'offer_pending',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  ON_HOLD: 'on_hold',
} as const;

export const CANDIDATE_STATUS_DISPLAY = {
  [CANDIDATE_STATUS.NEW]: 'New',
  [CANDIDATE_STATUS.SCREENING]: 'Screening',
  [CANDIDATE_STATUS.QUALIFIED]: 'Qualified',
  [CANDIDATE_STATUS.INTERVIEWING]: 'Interviewing',
  [CANDIDATE_STATUS.OFFER_PENDING]: 'Offer Pending',
  [CANDIDATE_STATUS.HIRED]: 'Hired',
  [CANDIDATE_STATUS.REJECTED]: 'Rejected',
  [CANDIDATE_STATUS.WITHDRAWN]: 'Withdrawn',
  [CANDIDATE_STATUS.ON_HOLD]: 'On Hold',
} as const;

// Job Status
export const JOB_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  PAUSED: 'paused',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export const JOB_STATUS_DISPLAY = {
  [JOB_STATUS.DRAFT]: 'Draft',
  [JOB_STATUS.PENDING_APPROVAL]: 'Pending Approval',
  [JOB_STATUS.ACTIVE]: 'Active',
  [JOB_STATUS.PAUSED]: 'Paused',
  [JOB_STATUS.FILLED]: 'Filled',
  [JOB_STATUS.CANCELLED]: 'Cancelled',
  [JOB_STATUS.EXPIRED]: 'Expired',
} as const;

// Application Status
export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  SCREENING_PASSED: 'screening_passed',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_COMPLETED: 'interview_completed',
  REFERENCE_CHECK: 'reference_check',
  OFFER_EXTENDED: 'offer_extended',
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_DECLINED: 'offer_declined',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export const APPLICATION_STATUS_DISPLAY = {
  [APPLICATION_STATUS.SUBMITTED]: 'Submitted',
  [APPLICATION_STATUS.UNDER_REVIEW]: 'Under Review',
  [APPLICATION_STATUS.SCREENING_PASSED]: 'Screening Passed',
  [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: 'Interview Scheduled',
  [APPLICATION_STATUS.INTERVIEW_COMPLETED]: 'Interview Completed',
  [APPLICATION_STATUS.REFERENCE_CHECK]: 'Reference Check',
  [APPLICATION_STATUS.OFFER_EXTENDED]: 'Offer Extended',
  [APPLICATION_STATUS.OFFER_ACCEPTED]: 'Offer Accepted',
  [APPLICATION_STATUS.OFFER_DECLINED]: 'Offer Declined',
  [APPLICATION_STATUS.REJECTED]: 'Rejected',
  [APPLICATION_STATUS.WITHDRAWN]: 'Withdrawn',
} as const;

// Interview Status
export const INTERVIEW_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
} as const;

export const INTERVIEW_STATUS_DISPLAY = {
  [INTERVIEW_STATUS.SCHEDULED]: 'Scheduled',
  [INTERVIEW_STATUS.CONFIRMED]: 'Confirmed',
  [INTERVIEW_STATUS.IN_PROGRESS]: 'In Progress',
  [INTERVIEW_STATUS.COMPLETED]: 'Completed',
  [INTERVIEW_STATUS.CANCELLED]: 'Cancelled',
  [INTERVIEW_STATUS.NO_SHOW]: 'No Show',
  [INTERVIEW_STATUS.RESCHEDULED]: 'Rescheduled',
} as const;

// Match Status
export const MATCH_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ON_HOLD: 'on_hold',
  EXPIRED: 'expired',
} as const;

export const MATCH_STATUS_DISPLAY = {
  [MATCH_STATUS.PENDING_REVIEW]: 'Pending Review',
  [MATCH_STATUS.APPROVED]: 'Approved',
  [MATCH_STATUS.REJECTED]: 'Rejected',
  [MATCH_STATUS.ON_HOLD]: 'On Hold',
  [MATCH_STATUS.EXPIRED]: 'Expired',
} as const;

// Bias Alert Status
export const BIAS_ALERT_STATUS = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  FALSE_POSITIVE: 'false_positive',
} as const;

export const BIAS_ALERT_STATUS_DISPLAY = {
  [BIAS_ALERT_STATUS.ACTIVE]: 'Active',
  [BIAS_ALERT_STATUS.ACKNOWLEDGED]: 'Acknowledged',
  [BIAS_ALERT_STATUS.RESOLVED]: 'Resolved',
  [BIAS_ALERT_STATUS.FALSE_POSITIVE]: 'False Positive',
} as const;

// Compliance Status
export const COMPLIANCE_STATUS = {
  FULLY_COMPLIANT: 'fully_compliant',
  SUBSTANTIALLY_COMPLIANT: 'substantially_compliant',
  PARTIALLY_COMPLIANT: 'partially_compliant',
  NON_COMPLIANT: 'non_compliant',
} as const;

export const COMPLIANCE_STATUS_DISPLAY = {
  [COMPLIANCE_STATUS.FULLY_COMPLIANT]: 'Fully Compliant',
  [COMPLIANCE_STATUS.SUBSTANTIALLY_COMPLIANT]: 'Substantially Compliant',
  [COMPLIANCE_STATUS.PARTIALLY_COMPLIANT]: 'Partially Compliant',
  [COMPLIANCE_STATUS.NON_COMPLIANT]: 'Non-Compliant',
} as const;

// Audit Status
export const AUDIT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
} as const;

export const AUDIT_STATUS_DISPLAY = {
  [AUDIT_STATUS.OPEN]: 'Open',
  [AUDIT_STATUS.IN_PROGRESS]: 'In Progress',
  [AUDIT_STATUS.CLOSED]: 'Closed',
} as const;

// Action Item Status
export const ACTION_ITEM_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue',
} as const;

export const ACTION_ITEM_STATUS_DISPLAY = {
  [ACTION_ITEM_STATUS.OPEN]: 'Open',
  [ACTION_ITEM_STATUS.IN_PROGRESS]: 'In Progress',
  [ACTION_ITEM_STATUS.BLOCKED]: 'Blocked',
  [ACTION_ITEM_STATUS.COMPLETED]: 'Completed',
  [ACTION_ITEM_STATUS.CANCELLED]: 'Cancelled',
  [ACTION_ITEM_STATUS.OVERDUE]: 'Overdue',
} as const;

// Recommendation Status
export const RECOMMENDATION_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  ON_HOLD: 'on_hold',
} as const;

export const RECOMMENDATION_STATUS_DISPLAY = {
  [RECOMMENDATION_STATUS.DRAFT]: 'Draft',
  [RECOMMENDATION_STATUS.PENDING_APPROVAL]: 'Pending Approval',
  [RECOMMENDATION_STATUS.APPROVED]: 'Approved',
  [RECOMMENDATION_STATUS.IN_PROGRESS]: 'In Progress',
  [RECOMMENDATION_STATUS.COMPLETED]: 'Completed',
  [RECOMMENDATION_STATUS.REJECTED]: 'Rejected',
  [RECOMMENDATION_STATUS.ON_HOLD]: 'On Hold',
} as const;

// Progress Status
export const PROGRESS_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const PROGRESS_STATUS_DISPLAY = {
  [PROGRESS_STATUS.PENDING]: 'Pending',
  [PROGRESS_STATUS.IN_PROGRESS]: 'In Progress',
  [PROGRESS_STATUS.COMPLETED]: 'Completed',
  [PROGRESS_STATUS.FAILED]: 'Failed',
  [PROGRESS_STATUS.CANCELLED]: 'Cancelled',
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
  CRITICAL: 'critical',
} as const;

export const PRIORITY_DISPLAY = {
  [PRIORITY_LEVELS.LOW]: 'Low',
  [PRIORITY_LEVELS.MEDIUM]: 'Medium',
  [PRIORITY_LEVELS.HIGH]: 'High',
  [PRIORITY_LEVELS.URGENT]: 'Urgent',
  [PRIORITY_LEVELS.CRITICAL]: 'Critical',
} as const;

// Severity Levels
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const SEVERITY_DISPLAY = {
  [SEVERITY_LEVELS.LOW]: 'Low',
  [SEVERITY_LEVELS.MEDIUM]: 'Medium',
  [SEVERITY_LEVELS.HIGH]: 'High',
  [SEVERITY_LEVELS.CRITICAL]: 'Critical',
} as const;

// Status Colors (for UI)
export const STATUS_COLORS = {
  // Candidate Status Colors
  [CANDIDATE_STATUS.NEW]: '#3b82f6', // blue
  [CANDIDATE_STATUS.SCREENING]: '#f59e0b', // amber
  [CANDIDATE_STATUS.QUALIFIED]: '#10b981', // emerald
  [CANDIDATE_STATUS.INTERVIEWING]: '#8b5cf6', // violet
  [CANDIDATE_STATUS.OFFER_PENDING]: '#f97316', // orange
  [CANDIDATE_STATUS.HIRED]: '#059669', // emerald-600
  [CANDIDATE_STATUS.REJECTED]: '#ef4444', // red
  [CANDIDATE_STATUS.WITHDRAWN]: '#6b7280', // gray
  [CANDIDATE_STATUS.ON_HOLD]: '#d97706', // amber-600
  
  // Job Status Colors
  [JOB_STATUS.DRAFT]: '#9ca3af', // gray-400
  [JOB_STATUS.PENDING_APPROVAL]: '#f59e0b', // amber
  [JOB_STATUS.ACTIVE]: '#10b981', // emerald
  [JOB_STATUS.PAUSED]: '#f97316', // orange
  [JOB_STATUS.FILLED]: '#059669', // emerald-600
  [JOB_STATUS.CANCELLED]: '#ef4444', // red
  [JOB_STATUS.EXPIRED]: '#6b7280', // gray
  
  // Priority Colors
  [PRIORITY_LEVELS.LOW]: '#10b981', // emerald
  [PRIORITY_LEVELS.MEDIUM]: '#f59e0b', // amber
  [PRIORITY_LEVELS.HIGH]: '#f97316', // orange
  [PRIORITY_LEVELS.URGENT]: '#ef4444', // red
  [PRIORITY_LEVELS.CRITICAL]: '#dc2626', // red-600
  
  // Severity Colors
  [SEVERITY_LEVELS.LOW]: '#10b981', // emerald
  [SEVERITY_LEVELS.MEDIUM]: '#f59e0b', // amber
  [SEVERITY_LEVELS.HIGH]: '#f97316', // orange
  [SEVERITY_LEVELS.CRITICAL]: '#dc2626', // red-600
} as const;

// Helper functions
export const getStatusDisplay = (status: string, statusType: string): string => {
  switch (statusType) {
    case 'candidate':
      return CANDIDATE_STATUS_DISPLAY[status as keyof typeof CANDIDATE_STATUS_DISPLAY] || status;
    case 'job':
      return JOB_STATUS_DISPLAY[status as keyof typeof JOB_STATUS_DISPLAY] || status;
    case 'application':
      return APPLICATION_STATUS_DISPLAY[status as keyof typeof APPLICATION_STATUS_DISPLAY] || status;
    case 'interview':
      return INTERVIEW_STATUS_DISPLAY[status as keyof typeof INTERVIEW_STATUS_DISPLAY] || status;
    case 'match':
      return MATCH_STATUS_DISPLAY[status as keyof typeof MATCH_STATUS_DISPLAY] || status;
    case 'bias_alert':
      return BIAS_ALERT_STATUS_DISPLAY[status as keyof typeof BIAS_ALERT_STATUS_DISPLAY] || status;
    case 'compliance':
      return COMPLIANCE_STATUS_DISPLAY[status as keyof typeof COMPLIANCE_STATUS_DISPLAY] || status;
    case 'audit':
      return AUDIT_STATUS_DISPLAY[status as keyof typeof AUDIT_STATUS_DISPLAY] || status;
    case 'action_item':
      return ACTION_ITEM_STATUS_DISPLAY[status as keyof typeof ACTION_ITEM_STATUS_DISPLAY] || status;
    case 'recommendation':
      return RECOMMENDATION_STATUS_DISPLAY[status as keyof typeof RECOMMENDATION_STATUS_DISPLAY] || status;
    case 'progress':
      return PROGRESS_STATUS_DISPLAY[status as keyof typeof PROGRESS_STATUS_DISPLAY] || status;
    case 'priority':
      return PRIORITY_DISPLAY[status as keyof typeof PRIORITY_DISPLAY] || status;
    case 'severity':
      return SEVERITY_DISPLAY[status as keyof typeof SEVERITY_DISPLAY] || status;
    default:
      return status;
  }
};

export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280';
};

export const isActiveStatus = (status: string, statusType: string): boolean => {
  const activeStatuses = {
    candidate: [CANDIDATE_STATUS.NEW, CANDIDATE_STATUS.SCREENING, CANDIDATE_STATUS.QUALIFIED, CANDIDATE_STATUS.INTERVIEWING, CANDIDATE_STATUS.OFFER_PENDING],
    job: [JOB_STATUS.ACTIVE, JOB_STATUS.PENDING_APPROVAL],
    application: [APPLICATION_STATUS.SUBMITTED, APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.SCREENING_PASSED, APPLICATION_STATUS.INTERVIEW_SCHEDULED, APPLICATION_STATUS.INTERVIEW_COMPLETED, APPLICATION_STATUS.REFERENCE_CHECK, APPLICATION_STATUS.OFFER_EXTENDED],
    interview: [INTERVIEW_STATUS.SCHEDULED, INTERVIEW_STATUS.CONFIRMED, INTERVIEW_STATUS.IN_PROGRESS],
    match: [MATCH_STATUS.PENDING_REVIEW, MATCH_STATUS.APPROVED],
    bias_alert: [BIAS_ALERT_STATUS.ACTIVE, BIAS_ALERT_STATUS.ACKNOWLEDGED],
    audit: [AUDIT_STATUS.OPEN, AUDIT_STATUS.IN_PROGRESS],
    action_item: [ACTION_ITEM_STATUS.OPEN, ACTION_ITEM_STATUS.IN_PROGRESS],
    recommendation: [RECOMMENDATION_STATUS.PENDING_APPROVAL, RECOMMENDATION_STATUS.APPROVED, RECOMMENDATION_STATUS.IN_PROGRESS],
  };
  
  const activeList = activeStatuses[statusType as keyof typeof activeStatuses];
  return activeList ? activeList.includes(status as never) : false;
};

export const isCompletedStatus = (status: string, statusType: string): boolean => {
  const completedStatuses = {
    candidate: [CANDIDATE_STATUS.HIRED, CANDIDATE_STATUS.REJECTED, CANDIDATE_STATUS.WITHDRAWN],
    job: [JOB_STATUS.FILLED, JOB_STATUS.CANCELLED, JOB_STATUS.EXPIRED],
    application: [APPLICATION_STATUS.OFFER_ACCEPTED, APPLICATION_STATUS.OFFER_DECLINED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
    interview: [INTERVIEW_STATUS.COMPLETED, INTERVIEW_STATUS.CANCELLED, INTERVIEW_STATUS.NO_SHOW],
    match: [MATCH_STATUS.REJECTED, MATCH_STATUS.EXPIRED],
    bias_alert: [BIAS_ALERT_STATUS.RESOLVED, BIAS_ALERT_STATUS.FALSE_POSITIVE],
    audit: [AUDIT_STATUS.CLOSED],
    action_item: [ACTION_ITEM_STATUS.COMPLETED, ACTION_ITEM_STATUS.CANCELLED],
    recommendation: [RECOMMENDATION_STATUS.COMPLETED, RECOMMENDATION_STATUS.REJECTED],
  };
  
  const completedList = completedStatuses[statusType as keyof typeof completedStatuses];
  return completedList ? completedList.includes(status as never) : false;
};

// Type exports
export type CandidateStatus = typeof CANDIDATE_STATUS[keyof typeof CANDIDATE_STATUS];
export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];
export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];
export type InterviewStatus = typeof INTERVIEW_STATUS[keyof typeof INTERVIEW_STATUS];
export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];
export type BiasAlertStatus = typeof BIAS_ALERT_STATUS[keyof typeof BIAS_ALERT_STATUS];
export type ComplianceStatus = typeof COMPLIANCE_STATUS[keyof typeof COMPLIANCE_STATUS];
export type AuditStatus = typeof AUDIT_STATUS[keyof typeof AUDIT_STATUS];
export type ActionItemStatus = typeof ACTION_ITEM_STATUS[keyof typeof ACTION_ITEM_STATUS];
export type RecommendationStatus = typeof RECOMMENDATION_STATUS[keyof typeof RECOMMENDATION_STATUS];
export type ProgressStatus = typeof PROGRESS_STATUS[keyof typeof PROGRESS_STATUS];
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];
export type SeverityLevel = typeof SEVERITY_LEVELS[keyof typeof SEVERITY_LEVELS];