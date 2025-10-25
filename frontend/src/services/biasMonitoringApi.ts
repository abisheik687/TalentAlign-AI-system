import { apiClient } from './api';

/**
 * Bias Monitoring API Service
 * Client-side API for bias monitoring functionality
 * Requirements: 4.4, 8.1
 */

export interface BiasThresholds {
  warning: number;
  critical: number;
  demographicParity: number;
  equalizedOdds: number;
  effectSize: number;
}

export interface MonitoringConfig {
  checkInterval?: string;
  thresholds?: Partial<BiasThresholds>;
}

export interface ProcessData {
  candidates?: any[];
  applications?: any[];
  interviews?: any[];
  decisions?: any[];
  matches?: any[];
}

export interface BiasViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  description: string;
  processType: string;
  timestamp: Date;
}

export interface BiasAlert {
  alertId: string;
  processId: string;
  processType: string;
  violation: BiasViolation;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface BiasMonitoringResult {
  monitoringId: string;
  processId: string;
  processType: string;
  biasAnalysis: {
    overallBiasScore: number;
    biasMetrics: any;
    detectedPatterns: string[];
    mitigationRecommendations: string[];
    complianceStatus: 'compliant' | 'non_compliant';
    analysisTimestamp: Date;
  };
  violations: BiasViolation[];
  complianceStatus: 'compliant' | 'violation_detected' | 'non_compliant';
  recommendations: string[];
  processingTime: number;
  timestamp: Date;
}

export interface DashboardData {
  timeRange: string;
  startTime: Date;
  endTime: Date;
  summaryMetrics: {
    totalProcesses: number;
    violationCount: number;
    complianceRate: number;
    averageBiasScore: number;
  };
  activeAlerts: BiasAlert[];
  trendData: any[];
  complianceByProcess: Record<string, number>;
  recentResults: BiasMonitoringResult[];
  lastUpdated: Date;
}

export interface ReportOptions {
  includeDetails?: boolean;
  groupBy?: string;
  filterBy?: any;
}

export interface BiasMonitoringReport {
  reportId: string;
  reportType: 'compliance' | 'trend_analysis' | 'violation_summary' | 'process_performance';
  timeRange: string;
  startTime: Date;
  endTime: Date;
  generatedAt: Date;
  data: any;
  metadata: {
    totalProcessesMonitored: number;
    totalViolations: number;
    complianceRate: number;
  };
}

export class BiasMonitoringApi {
  private baseUrl = '/api/bias-monitoring';

  /**
   * Get bias monitoring dashboard data
   */
  async getDashboard(
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
    refresh = false
  ): Promise<{ success: boolean; data: DashboardData; cached: boolean }> {
    const response = await apiClient.get(`${this.baseUrl}/dashboard`, {
      params: { timeRange, refresh }
    });
    return response.data;
  }

  /**
   * Monitor a specific process for bias
   */
  async monitorProcess(
    processId: string,
    processType: 'application_review' | 'interview_scheduling' | 'hiring_decision' | 'matching',
    data: ProcessData
  ): Promise<{ success: boolean; data: BiasMonitoringResult }> {
    const response = await apiClient.post(`${this.baseUrl}/monitor-process`, {
      processId,
      processType,
      data
    });
    return response.data;
  }

  /**
   * Get detailed bias analysis for a specific process
   */
  async getProcessAnalysis(processId: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get(`${this.baseUrl}/process/${processId}`);
    return response.data;
  }

  /**
   * Update bias monitoring thresholds
   */
  async updateThresholds(thresholds: Partial<BiasThresholds>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`${this.baseUrl}/thresholds`, thresholds);
    return response.data;
  }

  /**
   * Start bias monitoring service
   */
  async startMonitoring(config: MonitoringConfig = {}): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/start`, config);
    return response.data;
  }

  /**
   * Stop bias monitoring service
   */
  async stopMonitoring(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/stop`);
    return response.data;
  }

  /**
   * Generate bias monitoring report
   */
  async generateReport(
    reportType: 'compliance' | 'trend_analysis' | 'violation_summary' | 'process_performance',
    timeRange: '1h' | '24h' | '7d' | '30d',
    options: ReportOptions = {}
  ): Promise<{ success: boolean; data: BiasMonitoringReport }> {
    const response = await apiClient.post(`${this.baseUrl}/reports`, {
      reportType,
      timeRange,
      options
    });
    return response.data;
  }

  /**
   * Get bias monitoring alerts
   */
  async getAlerts(params: {
    status?: 'active' | 'acknowledged' | 'resolved';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    processType?: 'application_review' | 'interview_scheduling' | 'hiring_decision' | 'matching';
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    success: boolean;
    data: {
      alerts: BiasAlert[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/alerts`, { params });
    return response.data;
  }

  /**
   * Acknowledge a bias alert
   */
  async acknowledgeAlert(alertId: string): Promise<{ success: boolean; data: BiasAlert; message: string }> {
    const response = await apiClient.put(`${this.baseUrl}/alerts/${alertId}/acknowledge`);
    return response.data;
  }

  /**
   * Resolve a bias alert
   */
  async resolveAlert(
    alertId: string,
    action: string,
    description: string
  ): Promise<{ success: boolean; data: BiasAlert; message: string }> {
    const response = await apiClient.put(`${this.baseUrl}/alerts/${alertId}/resolve`, {
      action,
      description
    });
    return response.data;
  }

  /**
   * Get real-time bias metrics
   */
  async getRealTimeMetrics(): Promise<{
    success: boolean;
    data: Record<string, {
      processType: string;
      overallBiasScore: number;
      complianceStatus: 'compliant' | 'non_compliant';
      timestamp: Date;
    }>;
    timestamp: Date;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/metrics/realtime`);
    return response.data;
  }

  /**
   * Get bias monitoring service status
   */
  async getStatus(): Promise<{
    success: boolean;
    data: {
      isRunning: boolean;
      lastCheck: Date;
      activeAlerts: number;
      monitoredProcesses: number;
    };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/status`);
    return response.data;
  }

  /**
   * Get alerts summary for dashboard
   */
  async getAlertsSummary(): Promise<{
    success: boolean;
    data: {
      total: number;
      bySeverity: Record<string, number>;
      byStatus: Record<string, number>;
      byProcessType: Record<string, number>;
    };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/alerts/summary`);
    return response.data;
  }

  /**
   * Get bias trends over time
   */
  async getBiasTrends(
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
    processType?: string
  ): Promise<{
    success: boolean;
    data: Array<{
      timestamp: Date;
      overallBiasScore: number;
      complianceRate: number;
      violationCount: number;
    }>;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/trends`, {
      params: { timeRange, processType }
    });
    return response.data;
  }

  /**
   * Export bias monitoring data
   */
  async exportData(
    format: 'csv' | 'json' | 'pdf',
    timeRange: '1h' | '24h' | '7d' | '30d',
    includeDetails = false
  ): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      params: { format, timeRange, includeDetails },
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Test bias monitoring configuration
   */
  async testConfiguration(config: MonitoringConfig): Promise<{
    success: boolean;
    data: {
      configValid: boolean;
      issues: string[];
      recommendations: string[];
    };
  }> {
    const response = await apiClient.post(`${this.baseUrl}/test-config`, config);
    return response.data;
  }

  /**
   * Get bias monitoring metrics history
   */
  async getMetricsHistory(
    processId: string,
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    success: boolean;
    data: Array<{
      timestamp: Date;
      biasScore: number;
      complianceStatus: string;
      violations: BiasViolation[];
    }>;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/process/${processId}/history`, {
      params: { timeRange }
    });
    return response.data;
  }

  /**
   * Bulk acknowledge alerts
   */
  async bulkAcknowledgeAlerts(alertIds: string[]): Promise<{
    success: boolean;
    data: {
      acknowledged: number;
      failed: number;
      errors: string[];
    };
  }> {
    const response = await apiClient.post(`${this.baseUrl}/alerts/bulk-acknowledge`, {
      alertIds
    });
    return response.data;
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    success: boolean;
    data: {
      overallCompliance: number;
      complianceByProcess: Record<string, number>;
      violations: BiasViolation[];
      recommendations: string[];
      generatedAt: Date;
    };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/compliance-report`, {
      params: { timeRange }
    });
    return response.data;
  }
}

// Export singleton instance
export const biasMonitoringApi = new BiasMonitoringApi();