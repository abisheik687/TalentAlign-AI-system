# TalentAlign AI - Technical Architecture

## System Overview

TalentAlign AI is built as a modern, scalable web application with a microservices-oriented architecture that prioritizes ethical AI principles, data privacy, and regulatory compliance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  React/TypeScript SPA  │  Material-UI Components  │  WebSocket  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
├─────────────────────────────────────────────────────────────────┤
│     Express.js Router   │   Authentication   │   Rate Limiting  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Matching Service  │  Bias Detection  │  Anonymization Service  │
│  Fairness Metrics  │  Job Analysis    │  Consent Management     │
│  Monitoring Service│  Auth Service    │  Role Management        │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│     MongoDB        │      Redis Cache      │    File Storage    │
│  (Primary DB)      │   (Sessions/Cache)    │   (Documents)      │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Application

**Technology Stack:**
- React 18 with TypeScript
- Material-UI v5 for consistent design
- Socket.io-client for real-time updates
- React Router for navigation
- React Query for state management

**Key Features:**
- Responsive design for all device types
- Real-time bias monitoring dashboard
- Interactive candidate matching interface
- Comprehensive admin panels
- Accessibility compliance (WCAG 2.1 AA)

**Architecture Patterns:**
- Component-based architecture
- Custom hooks for business logic
- Context API for global state
- Error boundaries for fault tolerance

### 2. Backend API Server

**Technology Stack:**
- Node.js 18+ with Express.js
- TypeScript for type safety
- Mongoose ODM for MongoDB
- Socket.io for WebSocket communication
- JWT for authentication

**Service Architecture:**

#### Authentication & Authorization
```typescript
// JWT-based authentication with refresh tokens
class AuthService {
  generateAccessToken(user): string
  generateRefreshToken(user): string
  verifyToken(token, type): TokenPayload
  hashPassword(password): Promise<string>
  comparePassword(password, hash): Promise<boolean>
}

// Role-based access control
class RoleService {
  hasPermission(role, resource, action): boolean
  getRolePermissions(role): Permission[]
}
```

#### Bias Detection Engine
```typescript
class JobBiasDetectionService {
  analyzeJobDescription(job): Promise<BiasAnalysisResult>
  getRealTimeBiasScore(content): Promise<RealTimeBiasScore>
  suggestAlternatives(flaggedTerms): Promise<LanguageSuggestion[]>
}

class BiasMonitoringService {
  startMonitoring(config): Promise<void>
  monitorProcess(processId, type, data): Promise<BiasMonitoringResult>
  getDashboardData(timeRange): Promise<BiasMonitoringDashboard>
}
```

#### Matching Algorithm
```typescript
class MatchingService {
  findMatchingCandidates(jobId, options): Promise<MatchingResult>
  findMatchingJobs(candidateId, options): Promise<MatchingResult>
  calculateMatchScores(job, candidates): Promise<CandidateMatch[]>
  applyFairnessConstraints(matches, constraints): Promise<CandidateMatch[]>
}
```

#### Data Anonymization
```typescript
class AnonymizationService {
  detectPII(content): PIIDetectionResult
  removePII(content, options): PIIRemovalResult
  anonymizeData(data, schema): Promise<AnonymizationResult>
  validateAnonymization(original, anonymized): Promise<ValidationResult>
}
```

### 3. Database Layer

#### MongoDB Collections

**Users Collection:**
```javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  role: String, // 'admin', 'recruiter', 'hiring_manager', 'candidate'
  permissions: [String],
  department: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**CandidateProfiles Collection:**
```javascript
{
  _id: ObjectId,
  anonymizedId: String, // Irreversible anonymized identifier
  userId: ObjectId, // Reference to Users collection
  personalInfo: {
    // All PII is anonymized
    firstName: String, // Anonymized
    lastName: String,  // Anonymized
    email: String,     // Tokenized
    phone: String      // Tokenized
  },
  skills: [{
    name: String,
    proficiencyLevel: Number, // 1-100
    yearsOfExperience: Number,
    certifications: [String]
  }],
  experience: [{
    title: String,
    company: String, // Anonymized
    duration: Number,
    description: String,
    skills: [String]
  }],
  education: [{
    degree: String,
    institution: String, // Anonymized
    graduationYear: Number,
    gpa: Number // Optional, anonymized
  }],
  preferences: {
    workArrangement: String, // 'remote', 'hybrid', 'onsite'
    salaryRange: {
      min: Number,
      max: Number
    },
    industries: [String],
    companySize: String
  },
  consentGiven: Boolean,
  consentTimestamp: Date,
  dataRetentionExpiry: Date,
  profileCompleteness: Number, // 0-100
  createdAt: Date,
  updatedAt: Date
}
```

**JobRequirements Collection:**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  requiredSkills: [{
    name: String,
    importance: String, // 'critical', 'high', 'medium', 'low'
    minimumLevel: Number // 1-100
  }],
  experienceLevel: {
    level: String, // 'entry', 'junior', 'mid', 'senior', 'lead'
    minimumYears: Number,
    preferredYears: Number
  },
  educationRequirements: {
    required: Boolean,
    level: String, // 'high_school', 'bachelor', 'master', 'doctorate'
    fieldOfStudy: [String]
  },
  location: {
    primary: {
      city: String,
      country: String
    },
    remoteOptions: {
      fullyRemote: Boolean,
      type: String // 'hybrid', 'occasional'
    }
  },
  companyInfo: {
    name: String,
    size: String, // 'startup', 'small', 'medium', 'large', 'enterprise'
    industry: String,
    culture: {
      collaboration: Number, // 1-10 scale
      autonomy: Number,
      innovation: Number,
      structure: Number
    }
  },
  biasAnalysis: {
    overallBiasScore: Number, // 0-1
    flaggedTerms: [{
      term: String,
      category: String,
      severity: String,
      suggestion: String
    }],
    complianceStatus: String, // 'compliant', 'needs_review', 'non_compliant'
    lastAnalyzed: Date
  },
  createdBy: ObjectId,
  department: String,
  status: String, // 'draft', 'active', 'paused', 'closed'
  createdAt: Date,
  updatedAt: Date
}
```

**MonitoringResults Collection:**
```javascript
{
  _id: ObjectId,
  monitoringId: String,
  processId: String,
  processType: String, // 'application_review', 'interview_scheduling', etc.
  biasAnalysis: {
    overallBiasScore: Number,
    biasMetrics: Object,
    detectedPatterns: [String],
    complianceStatus: String
  },
  violations: [{
    type: String,
    severity: String,
    metric: String,
    value: Number,
    threshold: Number,
    description: String
  }],
  recommendations: [String],
  processingTime: Number,
  timestamp: Date
}
```

**Alerts Collection:**
```javascript
{
  _id: ObjectId,
  alertId: String,
  processId: String,
  processType: String,
  violation: {
    type: String,
    severity: String, // 'low', 'medium', 'high', 'critical'
    description: String,
    value: Number,
    threshold: Number
  },
  status: String, // 'active', 'acknowledged', 'resolved'
  assignedTo: ObjectId,
  acknowledgedBy: ObjectId,
  acknowledgedAt: Date,
  resolvedBy: ObjectId,
  resolvedAt: Date,
  resolution: {
    action: String,
    description: String
  },
  createdAt: Date
}
```

#### Redis Cache Structure

**Session Storage:**
```
session:{sessionId} -> {
  userId: string,
  createdAt: Date,
  lastActivity: Date,
  metadata: object
}
```

**Rate Limiting:**
```
rate_limit:{clientId} -> count
```

**Bias Monitoring Cache:**
```
bias_monitoring:realtime:{processType} -> {
  overallBiasScore: number,
  complianceStatus: string,
  timestamp: Date
}
```

**Token Blacklist:**
```
blacklist:{token} -> "true"
```

### 4. Real-time Communication

#### WebSocket Events

**Client to Server:**
```typescript
// Subscription events
'subscribe:bias_monitoring' -> { processTypes: string[], alertLevels: string[] }
'subscribe:dashboard' -> { dashboardType: string, refreshInterval: number }
'unsubscribe' -> { type: string, details: object }

// Collaboration events
'collaboration:join_session' -> { sessionId: string, sessionType: string }
'collaboration:update' -> { sessionId: string, updateType: string, updateData: object }

// Alert management
'acknowledge_alert' -> { alertId: string }

// Keepalive
'ping' -> {}
```

**Server to Client:**
```typescript
// Bias monitoring
'bias_alert' -> BiasAlert
'bias_metrics_update' -> BiasMetrics
'critical_bias_alert' -> CriticalAlert

// Dashboard updates
'dashboard:update' -> { type: string, data: object }

// Collaboration
'collaboration:participant_joined' -> { userId: string, role: string }
'collaboration:update_received' -> { updateType: string, updateData: object }

// System events
'connected' -> { message: string, clientId: string }
'pong' -> { timestamp: Date }
```

## Security Architecture

### Authentication Flow

```
1. User Login Request
   ├── Validate Credentials
   ├── Check Account Lock Status
   ├── Generate Access Token (15min)
   ├── Generate Refresh Token (7d)
   └── Store Session in Redis

2. API Request with Token
   ├── Extract Bearer Token
   ├── Verify JWT Signature
   ├── Check Token Blacklist
   ├── Validate User Status
   └── Attach User Context

3. Token Refresh
   ├── Validate Refresh Token
   ├── Generate New Access Token
   ├── Optionally Rotate Refresh Token
   └── Update Session
```

### Authorization Matrix

| Role | Candidates | Jobs | Applications | Interviews | Bias Monitoring | Admin |
|------|------------|------|--------------|------------|-----------------|-------|
| Admin | Full | Full | Full | Full | Full | Full |
| Ethics Officer | Read | Read | Read | Read | Full | Limited |
| HR Admin | Full | Full | Full | Full | Read | Limited |
| Hiring Manager | Dept Only | Own/Dept | Dept Only | Own/Dept | Read | None |
| Recruiter | Read/Create | Own | Read/Update | Create/Update | Read | None |
| Candidate | Own Only | Read | Own Only | Own Only | None | None |

### Data Protection Measures

#### Encryption
- **At Rest**: AES-256 encryption for sensitive data
- **In Transit**: TLS 1.3 for all communications
- **Database**: MongoDB encryption at rest
- **Backups**: Encrypted backup storage

#### Anonymization Pipeline
```
1. PII Detection
   ├── Pattern-based detection (regex)
   ├── ML-based entity recognition
   ├── Context-aware analysis
   └── Confidence scoring

2. Anonymization Techniques
   ├── Hashing (SHA-256 + salt)
   ├── Tokenization (format-preserving)
   ├── Generalization (k-anonymity)
   ├── Noise addition (differential privacy)
   └── Pseudonymization

3. Validation
   ├── Leakage detection
   ├── Utility preservation
   ├── Re-identification risk assessment
   └── Compliance verification
```

## Bias Detection & Fairness

### Statistical Fairness Metrics

#### Demographic Parity
```typescript
// Equal selection rates across groups
demographicParity = |P(Y=1|A=0) - P(Y=1|A=1)|
// Where Y is selection outcome, A is protected attribute
```

#### Equalized Odds
```typescript
// Equal true positive rates across groups
equalizedOdds = |P(Y=1|A=0,D=1) - P(Y=1|A=1,D=1)|
// Where D is the true qualification
```

#### Predictive Equality
```typescript
// Equal false positive rates across groups
predictiveEquality = |P(Y=1|A=0,D=0) - P(Y=1|A=1,D=0)|
```

### Bias Detection Pipeline

```
1. Data Collection
   ├── Hiring process data
   ├── Decision outcomes
   ├── Candidate demographics (anonymized)
   └── Temporal information

2. Statistical Analysis
   ├── Chi-square tests for independence
   ├── Fisher's exact test for small samples
   ├── Effect size calculations (Cohen's d)
   └── Confidence interval estimation

3. Pattern Detection
   ├── Language bias in job descriptions
   ├── Requirement bias analysis
   ├── Cultural assumption identification
   └── Accessibility barrier detection

4. Real-time Monitoring
   ├── Threshold-based alerting
   ├── Trend analysis
   ├── Anomaly detection
   └── Automated intervention
```

### Fairness Constraints in Matching

```typescript
interface FairnessConstraints {
  enabled: boolean;
  demographicParity?: number; // Maximum allowed difference
  equalizedOdds?: number;
  minScoreThreshold?: number; // Minimum qualification threshold
  diversityRequirements?: {
    experienceLevel: { min: number; max: number };
    educationLevel: { min: number; max: number };
  };
}

// Applied during matching process
function applyFairnessConstraints(
  matches: CandidateMatch[],
  constraints: FairnessConstraints
): CandidateMatch[] {
  // Implementation ensures fair representation
  // while maintaining merit-based selection
}
```

## Performance & Scalability

### Caching Strategy

#### Application-Level Caching
```typescript
// Bias analysis results (24h TTL)
`job_bias_analysis:${contentHash}` -> BiasAnalysisResult

// Matching results (1h TTL)
`matching:job:${jobId}:${optionsHash}` -> MatchingResult

// Real-time metrics (5min TTL)
`bias_monitoring:realtime:${processType}` -> BiasMetrics

// User sessions (7d TTL)
`session:${sessionId}` -> SessionData
```

#### Database Optimization
```javascript
// Compound indexes for efficient queries
db.candidateProfiles.createIndex({ 
  "skills.name": 1, 
  "consentGiven": 1, 
  "profileCompleteness": 1 
});

db.jobRequirements.createIndex({ 
  "status": 1, 
  "createdAt": -1,
  "biasAnalysis.complianceStatus": 1 
});

db.monitoringResults.createIndex({ 
  "processType": 1, 
  "timestamp": -1,
  "complianceStatus": 1 
});

// TTL indexes for automatic cleanup
db.alerts.createIndex(
  { "resolvedAt": 1 }, 
  { expireAfterSeconds: 31536000 } // 1 year
);
```

### Horizontal Scaling

#### Load Balancing
```nginx
upstream talentalign_backend {
    server backend1:5000 weight=3;
    server backend2:5000 weight=3;
    server backend3:5000 weight=2;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://talentalign_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Database Sharding Strategy
```javascript
// Shard key based on anonymized user ID
sh.shardCollection("talentalign.candidateProfiles", { "anonymizedId": "hashed" });
sh.shardCollection("talentalign.monitoringResults", { "processId": "hashed" });

// Ensure even distribution across shards
sh.enableSharding("talentalign");
```

## Monitoring & Observability

### Application Metrics

#### Custom Metrics
```typescript
// Bias detection metrics
bias_detection_requests_total{type, status}
bias_score_histogram{process_type}
fairness_violations_total{severity, type}

// Matching performance
matching_requests_total{job_type, status}
matching_duration_seconds{algorithm_version}
matching_accuracy_score{time_period}

// User engagement
user_sessions_active{role}
api_requests_total{endpoint, method, status}
websocket_connections_active{type}
```

#### Health Checks
```typescript
// Application health endpoint
GET /health -> {
  status: "healthy" | "degraded" | "unhealthy",
  checks: {
    database: { status, latency },
    redis: { status, latency },
    external_apis: { status, latency },
    bias_detection: { status, last_check }
  },
  timestamp: Date
}
```

### Error Tracking & Logging

#### Structured Logging
```typescript
logger.info('Bias analysis completed', {
  analysisId: 'analysis-123',
  jobId: 'job-456',
  overallBiasScore: 0.15,
  complianceStatus: 'compliant',
  processingTime: 1250,
  flaggedTermsCount: 2
});

logger.warn('Bias threshold exceeded', {
  processId: 'process-789',
  processType: 'application_review',
  biasScore: 0.75,
  threshold: 0.5,
  violationType: 'demographic_parity'
});
```

#### Error Boundaries
```typescript
// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date()
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.id
  });
});
```

## Deployment Architecture

### Container Strategy

#### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 5000
USER node
CMD ["npm", "start"]
```

#### Docker Compose (Development)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/talentalign
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

### Kubernetes Deployment

#### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: talentalign-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: talentalign-backend
  template:
    metadata:
      labels:
        app: talentalign-backend
    spec:
      containers:
      - name: backend
        image: talentalign/backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: talentalign-secrets
              key: mongodb-uri
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service & Ingress
```yaml
apiVersion: v1
kind: Service
metadata:
  name: talentalign-backend-service
spec:
  selector:
    app: talentalign-backend
  ports:
  - port: 80
    targetPort: 5000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: talentalign-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.talentalign.ai
    secretName: talentalign-tls
  rules:
  - host: api.talentalign.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: talentalign-backend-service
            port:
              number: 80
```

## Data Flow Diagrams

### Candidate Matching Flow
```
1. Job Creation
   ├── Bias Analysis of Job Description
   ├── Store Job Requirements
   └── Trigger Matching Process

2. Candidate Retrieval
   ├── Check Consent Status
   ├── Apply Privacy Filters
   ├── Retrieve Anonymized Profiles
   └── Filter by Basic Criteria

3. Matching Algorithm
   ├── Calculate Skill Scores
   ├── Assess Experience Fit
   ├── Evaluate Cultural Alignment
   ├── Apply Fairness Constraints
   └── Generate Explanations

4. Bias Monitoring
   ├── Analyze Selection Patterns
   ├── Calculate Fairness Metrics
   ├── Detect Bias Violations
   └── Generate Alerts if Needed

5. Result Delivery
   ├── Rank Candidates by Score
   ├── Provide Match Explanations
   ├── Include Bias Analysis
   └── Log Audit Trail
```

### Real-time Bias Monitoring Flow
```
1. Process Event
   ├── Application Submitted
   ├── Interview Scheduled
   ├── Decision Made
   └── Trigger Monitoring

2. Data Collection
   ├── Extract Process Data
   ├── Anonymize PII
   ├── Validate Consent
   └── Prepare for Analysis

3. Bias Analysis
   ├── Calculate Fairness Metrics
   ├── Run Statistical Tests
   ├── Detect Patterns
   └── Assess Compliance

4. Threshold Checking
   ├── Compare Against Limits
   ├── Determine Severity
   ├── Generate Violations
   └── Create Alerts

5. Real-time Notification
   ├── WebSocket Broadcast
   ├── Email Notifications
   ├── Dashboard Updates
   └── Audit Logging
```

## API Design Patterns

### RESTful API Structure
```
/api/v1/
├── /auth/
│   ├── POST /login
│   ├── POST /refresh
│   ├── POST /logout
│   └── GET /me
├── /candidates/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── /jobs/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── POST /:id/analyze-bias
├── /matching/
│   ├── POST /candidates
│   ├── POST /jobs
│   └── GET /results/:id
├── /bias-monitoring/
│   ├── GET /dashboard
│   ├── POST /monitor-process
│   ├── GET /alerts
│   └── PUT /alerts/:id/acknowledge
└── /admin/
    ├── GET /users
    ├── POST /users
    ├── GET /audit-logs
    └── GET /compliance-reports
```

### Response Format Standards
```typescript
// Success Response
{
  success: true,
  data: T,
  metadata?: {
    pagination?: PaginationInfo,
    timing?: number,
    version?: string
  }
}

// Error Response
{
  success: false,
  error: string,
  code?: string,
  details?: object,
  requestId?: string
}

// Paginated Response
{
  success: true,
  data: T[],
  pagination: {
    total: number,
    limit: number,
    offset: number,
    hasMore: boolean
  }
}
```

## Testing Strategy

### Unit Testing
```typescript
// Service layer testing
describe('BiasDetectionService', () => {
  it('should detect gender bias in job descriptions', async () => {
    const service = BiasDetectionService.getInstance();
    const result = await service.analyzeJobDescription({
      jobId: 'test-job',
      content: 'Looking for a rockstar developer who can work with the guys',
      title: 'Software Engineer'
    });
    
    expect(result.overallBiasScore).toBeGreaterThan(0.3);
    expect(result.flaggedTerms).toContainEqual(
      expect.objectContaining({
        term: 'rockstar',
        category: 'cultural'
      })
    );
  });
});
```

### Integration Testing
```typescript
// API endpoint testing
describe('POST /api/bias-monitoring/monitor-process', () => {
  it('should monitor hiring process for bias', async () => {
    const response = await request(app)
      .post('/api/bias-monitoring/monitor-process')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        processId: 'test-process',
        processType: 'application_review',
        data: { applications: mockApplications }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.biasAnalysis).toBeDefined();
  });
});
```

### End-to-End Testing
```typescript
// Full workflow testing
describe('Candidate Matching Workflow', () => {
  it('should complete bias-free matching process', async () => {
    // 1. Create job with bias analysis
    const job = await createTestJob();
    
    // 2. Add candidates with consent
    const candidates = await createTestCandidates();
    
    // 3. Run matching algorithm
    const matches = await runMatching(job.id);
    
    // 4. Verify bias metrics
    expect(matches.fairnessMetrics.demographicParity.maxDifference)
      .toBeLessThan(0.2);
    
    // 5. Check audit trail
    const auditLogs = await getAuditLogs(job.id);
    expect(auditLogs).toHaveLength(1);
  });
});
```

This technical architecture provides a comprehensive foundation for building an ethical, scalable, and compliant AI-powered hiring platform. The modular design allows for independent scaling of components while maintaining strict ethical standards throughout the system.