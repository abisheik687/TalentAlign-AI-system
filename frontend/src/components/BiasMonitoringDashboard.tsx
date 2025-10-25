import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';
import { biasMonitoringApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

/**
 * Bias Monitoring Dashboard Component
 * Real-time bias monitoring with alerts and metrics
 * Requirements: 4.4, 8.1
 */

interface BiasMetrics {
  processType: string;
  overallBiasScore: number;
  complianceStatus: 'compliant' | 'non_compliant';
  timestamp: Date;
}

interface BiasAlert {
  alertId: string;
  processId: string;
  processType: string;
  violation: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    value: number;
    threshold: number;
    description: string;
  };
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
}

interface DashboardData {
  summaryMetrics: {
    totalProcesses: number;
    violationCount: number;
    complianceRate: number;
    averageBiasScore: number;
  };
  activeAlerts: BiasAlert[];
  complianceByProcess: Record<string, number>;
  lastUpdated: Date;
}

const BiasMonitoringDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<Record<string, BiasMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<BiasAlert | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // WebSocket connection for real-time updates
  const { socket, isConnected } = useWebSocket();

  // Load initial dashboard data
  const loadDashboardData = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await biasMonitoringApi.getDashboard(timeRange, refresh);
      setDashboardData(response.data);

      // Load real-time metrics
      const metricsResponse = await biasMonitoringApi.getRealTimeMetrics();
      setRealTimeMetrics(metricsResponse.data);

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!socket || !realTimeEnabled) return;

    // Subscribe to bias monitoring updates
    socket.emit('subscribe:bias_monitoring', {
      processTypes: ['application_review', 'interview_scheduling', 'hiring_decision', 'matching'],
      alertLevels: ['medium', 'high', 'critical']
    });

    socket.emit('subscribe:dashboard', {
      dashboardType: 'bias_monitoring',
      refreshInterval: 30000 // 30 seconds
    });

    // Handle real-time bias alerts
    const handleBiasAlert = (alert: BiasAlert) => {
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          activeAlerts: [alert, ...prev.activeAlerts].slice(0, 10), // Keep latest 10
          summaryMetrics: {
            ...prev.summaryMetrics,
            violationCount: prev.summaryMetrics.violationCount + 1
          }
        };
      });

      // Show notification for critical alerts
      if (alert.violation.severity === 'critical') {
        showNotification('Critical Bias Alert', alert.violation.description, 'error');
      }
    };

    // Handle bias metrics updates
    const handleMetricsUpdate = (metrics: BiasMetrics) => {
      setRealTimeMetrics(prev => ({
        ...prev,
        [metrics.processType]: metrics
      }));
    };

    // Handle dashboard updates
    const handleDashboardUpdate = (data: any) => {
      if (data.type === 'bias_monitoring') {
        setDashboardData(data.data);
      }
    };

    socket.on('bias_alert', handleBiasAlert);
    socket.on('bias_metrics_update', handleMetricsUpdate);
    socket.on('dashboard:update', handleDashboardUpdate);

    return () => {
      socket.off('bias_alert', handleBiasAlert);
      socket.off('bias_metrics_update', handleMetricsUpdate);
      socket.off('dashboard:update', handleDashboardUpdate);
    };
  }, [socket, realTimeEnabled]);

  // Load data on component mount and time range change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await biasMonitoringApi.acknowledgeAlert(alertId);
      
      // Update local state
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          activeAlerts: prev.activeAlerts.map(alert =>
            alert.alertId === alertId
              ? { ...alert, status: 'acknowledged' as const }
              : alert
          )
        };
      });

      // Send acknowledgment via WebSocket
      if (socket) {
        socket.emit('acknowledge_alert', { alertId });
      }

      showNotification('Alert Acknowledged', 'Alert has been acknowledged successfully', 'success');
    } catch (err: any) {
      showNotification('Error', err.message || 'Failed to acknowledge alert', 'error');
    }
  };

  // Show browser notification
  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  // Get compliance status color
  const getComplianceColor = (rate: number) => {
    if (rate >= 0.95) return 'success';
    if (rate >= 0.8) return 'warning';
    return 'error';
  };

  if (loading && !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Bias Monitoring Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => loadDashboardData()}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Bias Monitoring Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Real-time Updates"
          />
          <Chip
            icon={isConnected ? <CheckCircleIcon /> : <ErrorIcon />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadDashboardData(true)}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Metrics */}
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Processes Monitored
                </Typography>
                <Typography variant="h4">
                  {dashboardData.summaryMetrics.totalProcesses}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Last {timeRange}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Violations
                </Typography>
                <Typography variant="h4" color="error">
                  {dashboardData.summaryMetrics.violationCount}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Require attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Compliance Rate
                </Typography>
                <Typography 
                  variant="h4" 
                  color={getComplianceColor(dashboardData.summaryMetrics.complianceRate)}
                >
                  {(dashboardData.summaryMetrics.complianceRate * 100).toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.summaryMetrics.complianceRate * 100}
                  color={getComplianceColor(dashboardData.summaryMetrics.complianceRate)}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Bias Score
                </Typography>
                <Typography variant="h4">
                  {dashboardData.summaryMetrics.averageBiasScore.toFixed(3)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Lower is better
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Real-time Process Metrics
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(realTimeMetrics).map(([processType, metrics]) => (
                  <Grid item xs={12} sm={6} md={3} key={processType}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {processType.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="h6">
                        {metrics.overallBiasScore.toFixed(3)}
                      </Typography>
                      <Chip
                        size="small"
                        label={metrics.complianceStatus}
                        color={metrics.complianceStatus === 'compliant' ? 'success' : 'error'}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {formatDistanceToNow(new Date(metrics.timestamp))} ago
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Alerts */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Active Alerts
                </Typography>
                <Chip
                  icon={<NotificationsActiveIcon />}
                  label={`${dashboardData?.activeAlerts.length || 0} Active`}
                  color="warning"
                />
              </Box>
              
              {dashboardData?.activeAlerts.length === 0 ? (
                <Alert severity="success">
                  No active bias alerts. All processes are compliant.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Severity</TableCell>
                        <TableCell>Process Type</TableCell>
                        <TableCell>Violation</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData?.activeAlerts.map((alert) => (
                        <TableRow key={alert.alertId}>
                          <TableCell>
                            <Chip
                              size="small"
                              label={alert.violation.severity}
                              color={getSeverityColor(alert.violation.severity) as any}
                              icon={
                                alert.violation.severity === 'critical' ? <ErrorIcon /> :
                                alert.violation.severity === 'high' ? <WarningIcon /> :
                                undefined
                              }
                            />
                          </TableCell>
                          <TableCell>{alert.processType.replace('_', ' ')}</TableCell>
                          <TableCell>{alert.violation.type.replace('_', ' ')}</TableCell>
                          <TableCell>
                            {alert.violation.value.toFixed(3)} / {alert.violation.threshold.toFixed(3)}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(alert.createdAt))} ago
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={alert.status}
                              color={alert.status === 'active' ? 'error' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedAlert(alert);
                                  setAlertDialogOpen(true);
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            {alert.status === 'active' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleAcknowledgeAlert(alert.alertId)}
                                sx={{ ml: 1 }}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert Details Dialog */}
      <Dialog
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Alert Details
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Alert ID
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedAlert.alertId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Process ID
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedAlert.processId}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedAlert.violation.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Metric
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedAlert.violation.metric}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Threshold Exceeded
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedAlert.violation.value.toFixed(3)} > {selectedAlert.violation.threshold.toFixed(3)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>
            Close
          </Button>
          {selectedAlert?.status === 'active' && (
            <Button
              variant="contained"
              onClick={() => {
                handleAcknowledgeAlert(selectedAlert.alertId);
                setAlertDialogOpen(false);
              }}
            >
              Acknowledge
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BiasMonitoringDashboard;