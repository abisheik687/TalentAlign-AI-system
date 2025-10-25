// Common utility types and interfaces

// Generic ID type
export type ID = string;

// Date range
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Time period
export interface TimePeriod {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
}

// Address
export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  coordinates?: Coordinates;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Contact information
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  linkedIn?: string;
  twitter?: string;
}

// File information
export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Attachment
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

// Note or comment
export interface Note {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt?: Date;
  isPrivate: boolean;
  tags?: string[];
}

// Tag
export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  category?: string;
}

// Status with metadata
export interface StatusInfo {
  status: string;
  changedAt: Date;
  changedBy: string;
  reason?: string;
  notes?: string;
}

// Approval workflow
export interface ApprovalRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  approverId: string;
  approverName: string;
  status: ApprovalStatus;
  requestedAt: Date;
  respondedAt?: Date;
  reason?: string;
  comments?: string;
}

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'bias_alert'
  | 'candidate_update'
  | 'interview_reminder'
  | 'system_update';

// Activity log entry
export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Search result
export interface SearchResult<T> {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
  explanation?: string;
}

// Metric
export interface Metric {
  name: string;
  value: number;
  unit?: string;
  trend?: TrendDirection;
  change?: number;
  changePercent?: number;
  target?: number;
  benchmark?: number;
  timestamp: Date;
}

export type TrendDirection = 'up' | 'down' | 'stable';

// Chart data point
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

// Time series data
export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

// Key-value pair
export interface KeyValuePair<T = string> {
  key: string;
  value: T;
  label?: string;
  description?: string;
}

// Option for dropdowns/selects
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
  description?: string;
  icon?: string;
}

// Form field configuration
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: ValidationRule[];
  options?: SelectOption[];
  defaultValue?: unknown;
  disabled?: boolean;
  visible?: boolean;
}

export type FormFieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'file'
  | 'url'
  | 'phone';

export interface ValidationRule {
  type: ValidationType;
  value?: unknown;
  message: string;
}

export type ValidationType = 
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom';

// Error with context
export interface ContextualError {
  message: string;
  code?: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  stack?: string;
}

// Progress indicator
export interface Progress {
  current: number;
  total: number;
  percentage: number;
  status: ProgressStatus;
  message?: string;
  estimatedTimeRemaining?: number;
}

export type ProgressStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Feature flag
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  conditions?: FeatureFlagCondition[];
  rolloutPercentage?: number;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'user_role' | 'organization_id' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';
  value: unknown;
}

// Configuration setting
export interface ConfigSetting {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  category?: string;
  sensitive?: boolean;
  updatedAt: Date;
  updatedBy: string;
}

// Utility types for better type safety
export type NonEmptyArray<T> = [T, ...T[]];

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Branded types for better type safety
export type Brand<T, B> = T & { __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type CandidateId = Brand<string, 'CandidateId'>;
export type JobId = Brand<string, 'JobId'>;
export type OrganizationId = Brand<string, 'OrganizationId'>;

// Result type for error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Maybe type for nullable values
export type Maybe<T> = T | null | undefined;

// Enum-like object type
export type EnumLike<T> = {
  readonly [K in keyof T]: T[K];
};

// Extract enum values
export type EnumValues<T> = T[keyof T];

// Function types
export type AsyncFunction<T extends unknown[], R> = (...args: T) => Promise<R>;
export type SyncFunction<T extends unknown[], R> = (...args: T) => R;
export type AnyFunction = (...args: unknown[]) => unknown;

// Event handler types
export type EventHandler<T = unknown> = (event: T) => void;
export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>;

// Callback types
export type Callback<T = void> = (error?: Error, result?: T) => void;
export type AsyncCallback<T = void> = (error?: Error, result?: T) => Promise<void>;

// Predicate types
export type Predicate<T> = (value: T) => boolean;
export type AsyncPredicate<T> = (value: T) => Promise<boolean>;

// Transformer types
export type Transformer<T, U> = (value: T) => U;
export type AsyncTransformer<T, U> = (value: T) => Promise<U>;

// Comparator types
export type Comparator<T> = (a: T, b: T) => number;

// Factory types
export type Factory<T> = () => T;
export type AsyncFactory<T> = () => Promise<T>;

// Builder pattern types
export type Builder<T> = {
  build(): T;
};

// Fluent interface types
export type FluentInterface<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? R extends void
      ? (...args: A) => FluentInterface<T>
      : (...args: A) => R
    : T[K];
};