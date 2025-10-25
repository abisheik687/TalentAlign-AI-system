// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import your existing app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Vercel
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TalentAlign AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic auth endpoints for demo
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo authentication
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: '1',
          email: email,
          firstName: 'Demo',
          lastName: 'User',
          role: email.includes('recruiter') ? 'recruiter' : 'candidate'
        },
        tokens: {
          accessToken: 'demo-access-token',
          refreshToken: 'demo-refresh-token'
        }
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
});

app.post('/auth/register', (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  
  if (email && password && firstName && lastName) {
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: Date.now().toString(),
          email,
          firstName,
          lastName,
          role: role || 'candidate'
        },
        tokens: {
          accessToken: 'demo-access-token',
          refreshToken: 'demo-refresh-token'
        }
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
});

app.get('/auth/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        email: 'demo@talentalign.ai',
        firstName: 'Demo',
        lastName: 'User',
        role: 'candidate'
      }
    }
  });
});

// Demo endpoints
app.get('/jobs', (req, res) => {
  res.json({
    success: true,
    data: {
      jobs: [
        {
          id: '1',
          title: 'Senior Software Engineer',
          company: 'TechCorp Inc.',
          location: 'San Francisco, CA',
          workType: 'hybrid',
          description: 'Join our team to build amazing products...',
          biasAnalysis: {
            overallScore: 0.15,
            inclusivityScore: 0.85
          }
        },
        {
          id: '2',
          title: 'Product Manager',
          company: 'Innovation Labs',
          location: 'New York, NY',
          workType: 'remote',
          description: 'Lead product development initiatives...',
          biasAnalysis: {
            overallScore: 0.12,
            inclusivityScore: 0.88
          }
        }
      ],
      total: 2,
      page: 1,
      limit: 10
    }
  });
});

app.get('/bias/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      summaryMetrics: {
        complianceRate: 0.92,
        violationCount: 3,
        averageBiasScore: 0.15
      },
      lastUpdated: new Date().toISOString()
    }
  });
});

app.get('/bias/alerts', (req, res) => {
  res.json({
    success: true,
    data: {
      alerts: [
        {
          alertId: 'alert_001',
          processType: 'job_posting',
          violation: {
            type: 'gender_bias',
            severity: 'medium',
            description: 'Job description contains potentially biased language'
          },
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ]
    }
  });
});

app.get('/metrics/performance', (req, res) => {
  res.json({
    success: true,
    data: {
      timeToHire: {
        averageDays: 28,
        trend: 'improving'
      },
      hiringManagerSatisfaction: {
        overallScore: 4.2,
        responseRate: 0.78
      },
      diversityMetrics: {
        currentState: {
          gender: { female: 0.45, male: 0.52, other: 0.03 },
          ethnicity: { asian: 0.25, black: 0.15, hispanic: 0.18, white: 0.38, other: 0.04 }
        }
      }
    }
  });
});

// Catch all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

module.exports = app;