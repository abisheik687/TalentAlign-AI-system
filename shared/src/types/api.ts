// API Response and Request Types

// Generic API Response Structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string; // Only in development
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filtering and Search
export interface FilterRequest {
  filters?: Record<string, unknown>;
  search?: string;
  searchFields?: string[];
}

export interface SortRequest {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Bulk Operations
export interface BulkRequest<T> {
  items: T[];
  options?: BulkOptions;
}

export interface BulkOptions {
  continueOnError?: boolean;
  validateAll?: boolean;
  batchSize?: number;
}

export interface BulkResponse<T> {
  successful: T[];
  failed: BulkError[];
  summary: BulkSummary;
}

export interface BulkError {
  item: unknown;
  error: ApiError;
  index: number;
}

export interface BulkSummary {
  total: number;
  successful: number;
  failed: number;
  processingTime: number; // milliseconds
}

// File Upload
export interface FileUploadRequest {
  file: File;
  metadata?: Record<string, unknown>;
  options?: FileUploadOptions;
}

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  virusScan?: boolean;
}

export interface FileUploadResponse {
  fileId: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

// WebSocket Messages
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  messageId: string;
  userId?: string;
}

export interface WebSocketResponse<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  messageId: string;
  success: boolean;
  error?: ApiError;
}

// Health Check
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: ServiceHealth[];
  metrics?: HealthMetrics;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export interface HealthMetrics {
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  requestsPerMinute: number;
}

// Rate Limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // seconds
}

// API Versioning
export interface ApiVersion {
  version: string;
  deprecated: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  supportedUntil?: string;
}

// Request Context
export interface RequestContext {
  userId?: string;
  userRole?: string;
  organizationId?: string;
  requestId: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  correlationId?: string;
}

// Validation Errors
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ValidationErrorResponse {
  message: string;
  errors: ValidationError[];
}

// Cache Control
export interface CacheInfo {
  cached: boolean;
  cacheKey?: string;
  ttl?: number; // seconds
  lastModified?: string;
  etag?: string;
}

// Audit Information
export interface AuditInfo {
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  version: number;
}

// Export/Import
export interface ExportRequest {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  filters?: Record<string, unknown>;
  fields?: string[];
  options?: ExportOptions;
}

export interface ExportOptions {
  includeHeaders?: boolean;
  dateFormat?: string;
  timezone?: string;
  compression?: boolean;
}

export interface ExportResponse {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
  fileSize?: number;
  recordCount?: number;
}

export interface ImportRequest {
  fileId: string;
  options?: ImportOptions;
}

export interface ImportOptions {
  skipHeaders?: boolean;
  delimiter?: string;
  encoding?: string;
  validateOnly?: boolean;
  upsert?: boolean;
}

export interface ImportResponse {
  importId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: ImportSummary;
  errors?: ImportError[];
}

export interface ImportSummary {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;
  processingTime: number;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: unknown;
}