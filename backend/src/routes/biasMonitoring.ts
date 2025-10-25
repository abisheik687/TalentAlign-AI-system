import express from 'express';
import { BiasMonitoringService } from '@/services/BiasMonitoringService';
import { authMiddleware } from '@/middleware/auth';
import { roleMiddleware } from '@/middleware/role';
import { validateRequest } from '@/middleware/validation';
import { body, query, param } from 'express-validator';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';

const router = express.Router();
const biasMonitoring = BiasMonitoringService.getInstance();

/**
 * Bias Monitoring API Routes
 * Requirements: 4.4, 8.1
 */

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * GET /api/bias-monitoring/dashboard
 * Get bias monitoring dashboard data
 */
router.get('/dashboard',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    query('timeRange').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid time range'),
    query('refresh').optional().isBoolean().withMessage('Refresh must be boolean')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { timeRange = '24h', refresh = false } = req.query;
      
      // Check cache first unless refresh is requested
      const cacheKey = `bias_monitoring:dashboard:${timeRange}`;
      if (!refresh) {
        const cached = await CacheService.get(cacheKey);
        if (cached) {
          return res.json({
            success: true,
            data: JSON.parse(cached),
            cached: true
          });
        }
      }

      const dashboardData = await biasMonitoring.getDashboardData(timeRange as any);
      
      // Cache for 5 minutes
      await CacheService.set(cacheKey, JSON.stringify(dashboardData), 300);

      res.json({
        success: true,
        data: dashboardData,
        cached: false
      });

    } catch (error) {
      logger.error('Failed to get bias monitoring dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data'
      });
    }
  }
);

/**
 * POST /api/bias-monitoring/monitor-process
 * Monitor a specific process for bias
 */
router.post('/monitor-process',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    body('processId').notEmpty().withMessage('Process ID is required'),
    body('processType').isIn(['application_review', 'interview_scheduling', 'hiring_decision', 'matching'])
      .withMessage('Invalid process type'),
    body('data').isObject().withMessage('Process data is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { processId, processType, data } = req.body;

      const result = await biasMonitoring.monitorProcess(processId, processType, data);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Failed to monitor process:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to monitor process for bias'
      });
    }
  }
);

/**
 * GET /api/bias-monitoring/process/:processId
 * Get detailed bias analysis for a specific process
 */
router.get('/process/:processId',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('processId').notEmpty().withMessage('Process ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { processId } = req.params;

      const analysis = await biasMonitoring.getProcessAnalysis(processId);

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Process analysis not found'
        });
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      logger.error('Failed to get process analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve process analysis'
      });
    }
  }
);

/**
 * PUT /api/bias-monitoring/thresholds
 * Update bias monitoring thresholds
 */
router.put('/thresholds',
  roleMiddleware(['admin']),
  [
    body('warning').optional().isFloat({ min: 0, max: 1 }).withMessage('Warning threshold must be between 0 and 1'),
    body('critical').optional().isFloat({ min: 0, max: 1 }).withMessage('Critical threshold must be between 0 and 1'),
    body('demographicParity').optional().isFloat({ min: 0, max: 1 }).withMessage('Demographic parity threshold must be between 0 and 1'),
    body('equalizedOdds').optional().isFloat({ min: 0, max: 1 }).withMessage('Equalized odds threshold must be between 0 and 1'),
    body('effectSize').optional().isFloat({ min: 0, max: 1 }).withMessage('Effect size threshold must be between 0 and 1')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const thresholds = req.body;

      await biasMonitoring.updateThresholds(thresholds);

      res.json({
        success: true,
        message: 'Bias monitoring thresholds updated successfully'
      });

    } catch (error) {
      logger.error('Failed to update thresholds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update bias monitoring thresholds'
      });
    }
  }
);

/**
 * POST /api/bias-monitoring/start
 * Start bias monitoring service
 */
router.post('/start',
  roleMiddleware(['admin']),
  [
    body('checkInterval').optional().isString().withMessage('Check interval must be a cron expression'),
    body('thresholds').optional().isObject().withMessage('Thresholds must be an object')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const config = req.body;

      await biasMonitoring.startMonitoring(config);

      res.json({
        success: true,
        message: 'Bias monitoring service started successfully'
      });

    } catch (error) {
      logger.error('Failed to start bias monitoring:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start bias monitoring service'
      });
    }
  }
);

/**
 * POST /api/bias-monitoring/stop
 * Stop bias monitoring service
 */
router.post('/stop',
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      await biasMonitoring.stopMonitoring();

      res.json({
        success: true,
        message: 'Bias monitoring service stopped successfully'
      });

    } catch (error) {
      logger.error('Failed to stop bias monitoring:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop bias monitoring service'
      });
    }
  }
);

/**
 * POST /api/bias-monitoring/reports
 * Generate bias monitoring report
 */
router.post('/reports',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    body('reportType').isIn(['compliance', 'trend_analysis', 'violation_summary', 'process_performance'])
      .withMessage('Invalid report type'),
    body('timeRange').isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid time range'),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { reportType, timeRange, options = {} } = req.body;

      const report = await biasMonitoring.generateReport(reportType, timeRange, options);

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Failed to generate bias monitoring report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate bias monitoring report'
      });
    }
  }
);

/**
 * GET /api/bias-monitoring/alerts
 * Get bias monitoring alerts
 */
router.get('/alerts',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    query('status').optional().isIn(['active', 'acknowledged', 'resolved']).withMessage('Invalid status'),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
    query('processType').optional().isIn(['application_review', 'interview_scheduling', 'hiring_decision', 'matching'])
      .withMessage('Invalid process type'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { status, severity, processType, limit = 20, offset = 0 } = req.query;

      const Alert = require('@/models/Alert').default;
      
      // Build query
      const query: any = {};
      if (status) query.status = status;
      if (severity) query['violation.severity'] = severity;
      if (processType) query.processType = processType;

      const alerts = await Alert.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string))
        .lean();

      const total = await Alert.countDocuments(query);

      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: total > parseInt(offset as string) + parseInt(limit as string)
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve alerts'
      });
    }
  }
);

/**
 * PUT /api/bias-monitoring/alerts/:alertId/acknowledge
 * Acknowledge a bias alert
 */
router.put('/alerts/:alertId/acknowledge',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('alertId').notEmpty().withMessage('Alert ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const userId = req.user.id;

      const Alert = require('@/models/Alert').default;
      
      const alert = await Alert.findOneAndUpdate(
        { alertId, status: 'active' },
        {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId
        },
        { new: true }
      );

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found or already acknowledged'
        });
      }

      res.json({
        success: true,
        data: alert,
        message: 'Alert acknowledged successfully'
      });

    } catch (error) {
      logger.error('Failed to acknowledge alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge alert'
      });
    }
  }
);

/**
 * PUT /api/bias-monitoring/alerts/:alertId/resolve
 * Resolve a bias alert
 */
router.put('/alerts/:alertId/resolve',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  [
    param('alertId').notEmpty().withMessage('Alert ID is required'),
    body('action').notEmpty().withMessage('Resolution action is required'),
    body('description').notEmpty().withMessage('Resolution description is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { action, description } = req.body;
      const userId = req.user.id;

      const Alert = require('@/models/Alert').default;
      
      const alert = await Alert.findOneAndUpdate(
        { alertId, status: { $in: ['active', 'acknowledged'] } },
        {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: userId,
          resolution: {
            action,
            description,
            timestamp: new Date()
          }
        },
        { new: true }
      );

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found or already resolved'
        });
      }

      res.json({
        success: true,
        data: alert,
        message: 'Alert resolved successfully'
      });

    } catch (error) {
      logger.error('Failed to resolve alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve alert'
      });
    }
  }
);

/**
 * GET /api/bias-monitoring/metrics/realtime
 * Get real-time bias metrics
 */
router.get('/metrics/realtime',
  roleMiddleware(['admin', 'recruiter', 'hiring_manager']),
  async (req, res) => {
    try {
      const processTypes = ['application_review', 'interview_scheduling', 'hiring_decision', 'matching'];
      const metrics: any = {};

      for (const processType of processTypes) {
        const cached = await CacheService.get(`bias_monitoring:realtime:${processType}`);
        if (cached) {
          metrics[processType] = JSON.parse(cached);
        }
      }

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Failed to get real-time metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve real-time metrics'
      });
    }
  }
);

/**
 * GET /api/bias-monitoring/status
 * Get bias monitoring service status
 */
router.get('/status',
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      // This would check if the monitoring service is running
      // For now, we'll return a simple status
      res.json({
        success: true,
        data: {
          isRunning: true, // This would be determined by checking the service state
          lastCheck: new Date(),
          activeAlerts: await getActiveAlertsCount(),
          monitoredProcesses: await getMonitoredProcessesCount()
        }
      });

    } catch (error) {
      logger.error('Failed to get monitoring status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve monitoring status'
      });
    }
  }
);

// Helper functions

async function getActiveAlertsCount(): Promise<number> {
  try {
    const Alert = require('@/models/Alert').default;
    return await Alert.countDocuments({ status: 'active' });
  } catch (error) {
    logger.error('Failed to get active alerts count:', error);
    return 0;
  }
}

async function getMonitoredProcessesCount(): Promise<number> {
  try {
    const MonitoringResult = require('@/models/MonitoringResult').default;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await MonitoringResult.countDocuments({ 
      timestamp: { $gte: oneDayAgo } 
    });
  } catch (error) {
    logger.error('Failed to get monitored processes count:', error);
    return 0;
  }
}

export default router;