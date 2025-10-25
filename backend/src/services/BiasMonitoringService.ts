import { EventEmitter } from 'events';
import { FairnessMetricsService } from '@/services/FairnessMetricsService';
import { StatisticalTestService } from '@/services/StatisticalTestService';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';
import { WebSocketService } from '@/services/WebSocketService';
import cron from 'node-cron';
import crypto from 'crypto';

/**
 * Real-time Bias Monitoring and Alerting Service
 * Provides continuous monitoring of bias metrics with automated alerting
 * Requirements: 4.4, 8.1
 */
export class BiasMonitoringService extends EventEmitter {
  private static instance: BiasMonitoringService;
  private fairnessMetrics: FairnessMetricsService;
  private statisticalTests: StatisticalTestService;
  private monitoringJobs: Map<string, any> = new Map();
  private alertThresholds: BiasThresholds;
  private isMonitoring: boolean = false;

  private constructor() {
    super();
    this.fairnessMetrics = FairnessMetricsService.getInstance();
    this.statisticalTests = StatisticalTestService.getInstance();
    this.alertThresholds = this.getDefaultThresholds();
    this.setupEventHandlers();
  }

  static getInstance(): BiasMonitoringService {
    if (!BiasMonitoringService.instance) {
      BiasMonitoringService.instance = new BiasMonitoringService();
    }
    return BiasMonitoringService.instance;
  }

  /**
   * Start continuous bias monitoring
   */
  async startMonitoring(config: MonitoringConfig = {}): Promise<void> {
    try {
      if (this.isMonitoring) {
        logger.warn('Bias monitoring is already running');
        return;
      }

      logger.info('Starting bias monitoring service', { config });

      // Update thresholds if provided
      if (config.thresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...config.thresholds };
      }

      // Start real-time monitoring
      await this.startRealTimeMonitoring();

      // Schedule periodic comprehensive checks
      this.schedulePeriodicChecks(config.checkInterval || '*/15 * * * *'); // Every 15 minutes

      // Schedule daily reports
      this.scheduleDailyReports();

      // Schedule weekly trend analysis
      this.scheduleWeeklyAnalysis();

      this.isMonitoring = true;

      // Emit monitoring started event
      this.emit('monitoring:started', {
        timestamp: new Date(),
        config: {
          thresholds: this.alertThresholds,
          checkInterval: config.checkInterval || '*/15 * * * *'
        }
      });

      logger.info('Bias monitoring service started successfully');

    } catch (error) {
      logger.error('Failed to start bias monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop bias monitoring
   */
  async stopMonitoring(): Promise<void> {
    try {
      logger.info('Stopping bias monitoring service');

      // Stop all cron jobs
      for (const [jobName, job] of this.monitoringJobs.entries()) {
        job.stop();
        this.monitoringJobs.delete(jobName);
        logger.info(`Stopped monitoring job: ${jobName}`);
      }

      this.isMonitoring = false;

      // Emit monitoring stopped event
      this.emit('monitoring:stopped', {
        timestamp: new Date()
      });

      logger.info('Bias monitoring service stopped');

    } catch (error) {
      logger.error('Failed to stop bias monitoring:', error);
      throw error;
    }
  }

  /**
   * Monitor specific process for bias
   */
  async monitorProcess(
    processId: string,
    processType: ProcessType,
    data: ProcessData
  ): Promise<BiasMonitoringResult> {
    try {
      const monitoringId = crypto.randomUUID();
      const startTime = Date.now();

      logger.info('Starting process bias monitoring', {
        monitoringId,
        processId,
        processType,
        dataSize: data.candidates?.length || data.applications?.length || 0
      });

      // Perform bias analysis
      const biasAnalysis = await this.performBiasAnalysis(processType, data);

      // Check against thresholds
      const violations = this.checkThresholdViolations(biasAnalysis, processType);

      // Generate alerts if needed
      if (violations.length > 0) {
        await this.generateAlerts(processId, processType, violations, biasAnalysis);
      }

      // Create audit trail entry
      await this.createAuditTrailEntry({
        monitoringId,
        processId,
        processType,
        biasAnalysis,
        violations,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      });

      // Update real-time metrics
      await this.updateRealTimeMetrics(processType, biasAnalysis);

      const result: BiasMonitoringResult = {
        monitoringId,
        processId,
        processType,
        biasAnalysis,
        violations,
        complianceStatus: violations.length === 0 ? 'compliant' : 'violation_detected',
        recommendations: this.generateRecommendations(violations, biasAnalysis),
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };

      // Emit monitoring result event
      this.emit('process:monitored', result);

      logger.info('Process bias monitoring completed', {
        monitoringId,
        processId,
        complianceStatus: result.complianceStatus,
        violationCount: violations.length
      });

      return result;

    } catch (error) {
      logger.error('Process bias monitoring failed:', error);
      throw error;
    }
  }

  /**
   * Get current bias monitoring dashboard data
   */
  async getDashboardData(timeRange: TimeRange = '24h'): Promise<BiasMonitoringDashboard> {
    try {
      const endTime = new Date();
      const startTime = this.getStartTimeForRange(timeRange, endTime);

      // Get recent monitoring results
      const recentResults = await this.getMonitoringResults(startTime, endTime);

      // Calculate summary metrics
      const summaryMetrics = this.calculateSummaryMetrics(recentResults);

      // Get active alerts
      const activeAlerts = await this.getActiveAlerts();

      // Get trend data
      const trendData = await this.getTrendData(startTime, endTime);

      // Get compliance status by process type
      const complianceByProcess = this.calculateComplianceByProcess(recentResults);

      return {
        timeRange,
        startTime,
        endTime,
        summaryMetrics,
        activeAlerts,
        trendData,
        complianceByProcess,
        recentResults: recentResults.slice(0, 50), // Latest 50 results
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get detailed bias analysis for a specific process
   */
  async getProcessAnalysis(processId: string): Promise<DetailedBiasAnalysis | null> {
    try {
      // Get monitoring results for this process
      const MonitoringResult = require('@/models/MonitoringResult').default;
      const results = await MonitoringResult.find({ processId })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

      if (results.length === 0) {
        return null;
      }

      const latestResult = results[0];

      // Get historical trend for this process
      const historicalTrend = results.map(result => ({
        timestamp: result.timestamp,
        overallBiasScore: result.biasAnalysis.overallBiasScore,
        complianceStatus: result.complianceStatus
      }));

      // Analyze bias patterns
      const biasPatterns = this.analyzeBiasPatterns(results);

      // Generate improvement recommendations
      const improvements = this.generateImprovementRecommendations(results);

      return {
        processId,
        latestAnalysis: latestResult.biasAnalysis,
        historicalTrend,
        biasPatterns,
        improvements,
        complianceHistory: results.map(r => ({
          timestamp: r.timestamp,
          status: r.complianceStatus,
          violationCount: r.violations.length
        })),
        lastAnalyzed: latestResult.timestamp
      };

    } catch (error) {
      logger.error('Failed to get process analysis:', error);
      throw error;
    }
  }

  /**
   * Update bias monitoring thresholds
   */
  async updateThresholds(newThresholds: Partial<BiasThresholds>): Promise<void> {
    try {
      logger.info('Updating bias monitoring thresholds', { newThresholds });

      this.alertThresholds = { ...this.alertThresholds, ...newThresholds };

      // Save to cache for persistence
      await CacheService.set('bias_monitoring:thresholds', JSON.stringify(this.alertThresholds));

      // Emit threshold update event
      this.emit('thresholds:updated', {
        oldThresholds: this.alertThresholds,
        newThresholds: this.alertThresholds,
        timestamp: new Date()
      });

      logger.info('Bias monitoring thresholds updated successfully');

    } catch (error) {
      logger.error('Failed to update thresholds:', error);
      throw error;
    }
  }

  /**
   * Generate bias monitoring report
   */
  async generateReport(
    reportType: ReportType,
    timeRange: TimeRange,
    options: ReportOptions = {}
  ): Promise<BiasMonitoringReport> {
    try {
      const reportId = crypto.randomUUID();
      const endTime = new Date();
      const startTime = this.getStartTimeForRange(timeRange, endTime);

      logger.info('Generating bias monitoring report', {
        reportId,
        reportType,
        timeRange,
        startTime,
        endTime
      });

      // Get monitoring data for the time range
      const monitoringResults = await this.getMonitoringResults(startTime, endTime);

      // Generate report based on type
      let reportData: any;
      switch (reportType) {
        case 'compliance':
          reportData = await this.generateComplianceReport(monitoringResults, options);
          break;
        case 'trend_analysis':
          reportData = await this.generateTrendAnalysisReport(monitoringResults, options);
          break;
        case 'violation_summary':
          reportData = await this.generateViolationSummaryReport(monitoringResults, options);
          break;
        case 'process_performance':
          reportData = await this.generateProcessPerformanceReport(monitoringResults, options);
          break;
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }

      const report: BiasMonitoringReport = {
        reportId,
        reportType,
        timeRange,
        startTime,
        endTime,
        generatedAt: new Date(),
        data: reportData,
        metadata: {
          totalProcessesMonitored: new Set(monitoringResults.map(r => r.processId)).size,
          totalViolations: monitoringResults.reduce((sum, r) => sum + r.violations.length, 0),
          complianceRate: this.calculateOverallComplianceRate(monitoringResults)
        }
      };

      // Cache the report
      await CacheService.set(
        `bias_monitoring:report:${reportId}`,
        JSON.stringify(report),
        60 * 60 * 24 // 24 hours
      );

      logger.info('Bias monitoring report generated', {
        reportId,
        reportType,
        complianceRate: report.metadata.complianceRate
      });

      return report;

    } catch (error) {
      logger.error('Failed to generate bias monitoring report:', error);
      throw error;
    }
  }

  // Private methods

  private setupEventHandlers(): void {
    // Handle bias violations
    this.on('violation:detected', async (violation: BiasViolation) => {
      await this.handleBiasViolation(violation);
    });

    // Handle threshold breaches
    this.on('threshold:breached', async (breach: ThresholdBreach) => {
      await this.handleThresholdBreach(breach);
    });

    // Handle monitoring errors
    this.on('error', (error: Error) => {
      logger.error('Bias monitoring error:', error);
    });
  }

  private async startRealTimeMonitoring(): Promise<void> {
    // Listen for new hiring processes
    const HiringProcess = require('@/models/HiringProcess').default;
    
    // Monitor new applications
    this.monitorCollection('applications', async (doc: any) => {
      if (doc.operationType === 'insert') {
        await this.monitorProcess(
          doc.fullDocument._id,
          'application_review',
          { applications: [doc.fullDocument] }
        );
      }
    });

    // Monitor interview scheduling
    this.monitorCollection('interviews', async (doc: any) => {
      if (doc.operationType === 'insert') {
        await this.monitorProcess(
          doc.fullDocument._id,
          'interview_scheduling',
          { interviews: [doc.fullDocument] }
        );
      }
    });

    // Monitor hiring decisions
    this.monitorCollection('hiring_decisions', async (doc: any) => {
      if (doc.operationType === 'insert' || doc.operationType === 'update') {
        await this.monitorProcess(
          doc.fullDocument._id,
          'hiring_decision',
          { decisions: [doc.fullDocument] }
        );
      }
    });
  }

  private monitorCollection(collectionName: string, handler: (doc: any) => Promise<void>): void {
    // This would integrate with MongoDB change streams in a real implementation
    logger.info(`Setting up real-time monitoring for ${collectionName}`);
  }

  private schedulePeriodicChecks(interval: string): void {
    const job = cron.schedule(interval, async () => {
      try {
        await this.performPeriodicCheck();
      } catch (error) {
        logger.error('Periodic bias check failed:', error);
      }
    }, { scheduled: false });

    job.start();
    this.monitoringJobs.set('periodic_check', job);
    logger.info(`Scheduled periodic bias checks: ${interval}`);
  }

  private scheduleDailyReports(): void {
    const job = cron.schedule('0 9 * * *', async () => { // 9 AM daily
      try {
        await this.generateDailyReport();
      } catch (error) {
        logger.error('Daily bias report generation failed:', error);
      }
    }, { scheduled: false });

    job.start();
    this.monitoringJobs.set('daily_report', job);
    logger.info('Scheduled daily bias reports at 9 AM');
  }

  private scheduleWeeklyAnalysis(): void {
    const job = cron.schedule('0 10 * * 1', async () => { // 10 AM on Mondays
      try {
        await this.generateWeeklyAnalysis();
      } catch (error) {
        logger.error('Weekly bias analysis failed:', error);
      }
    }, { scheduled: false });

    job.start();
    this.monitoringJobs.set('weekly_analysis', job);
    logger.info('Scheduled weekly bias analysis on Mondays at 10 AM');
  }

  private async performBiasAnalysis(
    processType: ProcessType,
    data: ProcessData
  ): Promise<BiasAnalysisResult> {
    try {
      // Extract relevant data based on process type
      let candidates: any[] = [];
      let outcomes: boolean[] = [];
      let protectedAttributes: any = {};

      switch (processType) {
        case 'application_review':
          candidates = data.applications || [];
          outcomes = candidates.map(app => app.status === 'accepted');
          break;
        case 'interview_scheduling':
          candidates = data.interviews?.map(int => int.candidate) || [];
          outcomes = candidates.map(() => true); // All scheduled
          break;
        case 'hiring_decision':
          candidates = data.decisions?.map(dec => dec.candidate) || [];
          outcomes = data.decisions?.map(dec => dec.decision === 'hire') || [];
          break;
        case 'matching':
          candidates = data.candidates || [];
          outcomes = data.matches?.map(match => match.selected) || [];
          break;
      }

      if (candidates.length === 0) {
        return {
          overallBiasScore: 0,
          biasMetrics: null,
          detectedPatterns: [],
          mitigationRecommendations: [],
          complianceStatus: 'compliant',
          analysisTimestamp: new Date()
        };
      }

      // Extract protected attributes (anonymized)
      protectedAttributes = {
        experienceLevel: candidates.map(c => this.categorizeExperience(c.totalExperience || 0)),
        educationLevel: candidates.map(c => this.categorizeEducation(c.education || [])),
        skillLevel: candidates.map(c => this.categorizeSkillLevel(c.skills || []))
      };

      // Calculate fairness metrics
      const context = {
        processType,
        stage: this.getProcessStage(processType),
        timePeriod: {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          endDate: new Date()
        },
        geographicScope: ['global'],
        departmentScope: ['all'],
        jobLevels: ['all']
      };

      const fairnessMetrics = await this.fairnessMetrics.calculateFairnessMetrics(
        candidates,
        outcomes,
        protectedAttributes,
        context
      );

      // Perform statistical tests
      const statisticalTests = await this.performStatisticalTests(
        candidates,
        outcomes,
        protectedAttributes
      );

      // Detect bias patterns
      const biasPatterns = this.detectBiasPatterns(candidates, outcomes, protectedAttributes);

      // Calculate overall bias score
      const overallBiasScore = this.calculateOverallBiasScore(fairnessMetrics, statisticalTests);

      // Generate recommendations
      const mitigationRecommendations = this.generateMitigationRecommendations(
        fairnessMetrics,
        biasPatterns,
        overallBiasScore
      );

      return {
        overallBiasScore,
        biasMetrics: fairnessMetrics,
        statisticalTests,
        detectedPatterns: biasPatterns,
        mitigationRecommendations,
        complianceStatus: overallBiasScore < this.alertThresholds.critical ? 'compliant' : 'non_compliant',
        analysisTimestamp: new Date()
      };

    } catch (error) {
      logger.error('Bias analysis failed:', error);
      throw error;
    }
  }

  private checkThresholdViolations(
    biasAnalysis: BiasAnalysisResult,
    processType: ProcessType
  ): BiasViolation[] {
    const violations: BiasViolation[] = [];

    // Check overall bias score
    if (biasAnalysis.overallBiasScore >= this.alertThresholds.critical) {
      violations.push({
        type: 'critical_bias',
        severity: 'critical',
        metric: 'overall_bias_score',
        value: biasAnalysis.overallBiasScore,
        threshold: this.alertThresholds.critical,
        description: `Critical bias detected: Overall bias score (${biasAnalysis.overallBiasScore.toFixed(3)}) exceeds critical threshold (${this.alertThresholds.critical})`,
        processType,
        timestamp: new Date()
      });
    } else if (biasAnalysis.overallBiasScore >= this.alertThresholds.warning) {
      violations.push({
        type: 'elevated_bias',
        severity: 'warning',
        metric: 'overall_bias_score',
        value: biasAnalysis.overallBiasScore,
        threshold: this.alertThresholds.warning,
        description: `Elevated bias detected: Overall bias score (${biasAnalysis.overallBiasScore.toFixed(3)}) exceeds warning threshold (${this.alertThresholds.warning})`,
        processType,
        timestamp: new Date()
      });
    }

    // Check specific fairness metrics
    if (biasAnalysis.biasMetrics) {
      const metrics = biasAnalysis.biasMetrics;

      // Check demographic parity
      if (metrics.demographicParity && metrics.demographicParity.maxDifference > this.alertThresholds.demographicParity) {
        violations.push({
          type: 'demographic_parity_violation',
          severity: 'high',
          metric: 'demographic_parity',
          value: metrics.demographicParity.maxDifference,
          threshold: this.alertThresholds.demographicParity,
          description: `Demographic parity violation: Maximum difference (${metrics.demographicParity.maxDifference.toFixed(3)}) exceeds threshold`,
          processType,
          timestamp: new Date()
        });
      }

      // Check equalized odds
      if (metrics.equalizedOdds && metrics.equalizedOdds.maxDifference > this.alertThresholds.equalizedOdds) {
        violations.push({
          type: 'equalized_odds_violation',
          severity: 'high',
          metric: 'equalized_odds',
          value: metrics.equalizedOdds.maxDifference,
          threshold: this.alertThresholds.equalizedOdds,
          description: `Equalized odds violation: Maximum difference (${metrics.equalizedOdds.maxDifference.toFixed(3)}) exceeds threshold`,
          processType,
          timestamp: new Date()
        });
      }
    }

    // Check statistical significance
    if (biasAnalysis.statisticalTests) {
      for (const test of biasAnalysis.statisticalTests) {
        if (test.pValue < 0.05 && test.effectSize > this.alertThresholds.effectSize) {
          violations.push({
            type: 'statistical_bias',
            severity: 'medium',
            metric: test.testName,
            value: test.effectSize,
            threshold: this.alertThresholds.effectSize,
            description: `Statistical bias detected: ${test.testName} shows significant effect (p=${test.pValue.toFixed(4)}, effect size=${test.effectSize.toFixed(3)})`,
            processType,
            timestamp: new Date()
          });
        }
      }
    }

    return violations;
  }

  private async generateAlerts(
    processId: string,
    processType: ProcessType,
    violations: BiasViolation[],
    biasAnalysis: BiasAnalysisResult
  ): Promise<void> {
    try {
      for (const violation of violations) {
        const alert: BiasAlert = {
          alertId: crypto.randomUUID(),
          processId,
          processType,
          violation,
          biasAnalysis,
          status: 'active',
          createdAt: new Date(),
          acknowledgedAt: null,
          resolvedAt: null
        };

        // Save alert to database
        await this.saveAlert(alert);

        // Send real-time notification
        await this.sendRealTimeAlert(alert);

        // Send email notification for critical alerts
        if (violation.severity === 'critical') {
          await this.sendEmailAlert(alert);
        }

        // Emit alert event
        this.emit('alert:generated', alert);

        logger.warn('Bias alert generated', {
          alertId: alert.alertId,
          processId,
          violationType: violation.type,
          severity: violation.severity
        });
      }
    } catch (error) {
      logger.error('Failed to generate alerts:', error);
    }
  }

  private async createAuditTrailEntry(entry: AuditTrailEntry): Promise<void> {
    try {
      const AuditTrail = require('@/models/AuditTrail').default;
      await AuditTrail.create({
        ...entry,
        type: 'bias_monitoring'
      });

      logger.info('Audit trail entry created', {
        monitoringId: entry.monitoringId,
        processId: entry.processId,
        violationCount: entry.violations.length
      });
    } catch (error) {
      logger.error('Failed to create audit trail entry:', error);
    }
  }

  private async updateRealTimeMetrics(
    processType: ProcessType,
    biasAnalysis: BiasAnalysisResult
  ): Promise<void> {
    try {
      const metrics = {
        processType,
        overallBiasScore: biasAnalysis.overallBiasScore,
        complianceStatus: biasAnalysis.complianceStatus,
        timestamp: new Date()
      };

      // Update cache with latest metrics
      await CacheService.set(
        `bias_monitoring:realtime:${processType}`,
        JSON.stringify(metrics),
        60 * 5 // 5 minutes
      );

      // Send to WebSocket clients
      WebSocketService.broadcast('bias_metrics_update', metrics);

    } catch (error) {
      logger.error('Failed to update real-time metrics:', error);
    }
  }

  // Helper methods for categorization and analysis

  private categorizeExperience(totalExp: number): string {
    if (totalExp < 2) return 'entry';
    if (totalExp < 5) return 'mid';
    return 'senior';
  }

  private categorizeEducation(education: any[]): string {
    if (!education || education.length === 0) return 'none';
    const maxLevel = Math.max(...education.map(edu => this.getEducationLevel(edu.degree)));
    if (maxLevel >= 4) return 'advanced';
    if (maxLevel >= 3) return 'bachelor';
    return 'basic';
  }

  private categorizeSkillLevel(skills: any[]): string {
    if (!skills || skills.length === 0) return 'basic';
    const avgProficiency = skills.reduce((sum, skill) => sum + skill.proficiencyLevel, 0) / skills.length;
    if (avgProficiency >= 80) return 'expert';
    if (avgProficiency >= 60) return 'intermediate';
    return 'basic';
  }

  private getEducationLevel(degree: string): number {
    const levels = {
      'high_school': 1,
      'associate': 2,
      'bachelor': 3,
      'master': 4,
      'doctorate': 5,
      'phd': 5
    };
    return levels[degree?.toLowerCase() as keyof typeof levels] || 2;
  }

  private getProcessStage(processType: ProcessType): string {
    const stages = {
      'application_review': 'screening',
      'interview_scheduling': 'interview',
      'hiring_decision': 'decision',
      'matching': 'matching'
    };
    return stages[processType] || 'unknown';
  }

  private async performStatisticalTests(
    candidates: any[],
    outcomes: boolean[],
    protectedAttributes: any
  ): Promise<any[]> {
    const tests = [];

    try {
      // Chi-square test for independence
      for (const [attribute, values] of Object.entries(protectedAttributes)) {
        const chiSquareResult = await this.statisticalTests.chiSquareTest(
          values as string[],
          outcomes,
          { alpha: 0.05 }
        );
        tests.push({
          testName: `chi_square_${attribute}`,
          ...chiSquareResult
        });
      }

      return tests;
    } catch (error) {
      logger.error('Statistical tests failed:', error);
      return [];
    }
  }

  private detectBiasPatterns(
    candidates: any[],
    outcomes: boolean[],
    protectedAttributes: any
  ): string[] {
    const patterns = [];

    try {
      // Analyze selection rates by protected attributes
      for (const [attribute, values] of Object.entries(protectedAttributes)) {
        const groups = [...new Set(values as string[])];
        const selectionRates = new Map();

        for (const group of groups) {
          const groupIndices = (values as string[]).map((val, idx) => val === group ? idx : -1).filter(idx => idx !== -1);
          const groupOutcomes = groupIndices.map(idx => outcomes[idx]);
          const selectionRate = groupOutcomes.filter(outcome => outcome).length / groupOutcomes.length;
          selectionRates.set(group, selectionRate);
        }

        // Check for significant differences
        const rates = Array.from(selectionRates.values());
        const maxRate = Math.max(...rates);
        const minRate = Math.min(...rates);
        
        if (maxRate - minRate > 0.2) { // 20% difference threshold
          const maxGroup = Array.from(selectionRates.entries()).find(([_, rate]) => rate === maxRate)?.[0];
          const minGroup = Array.from(selectionRates.entries()).find(([_, rate]) => rate === minRate)?.[0];
          patterns.push(`${attribute}: ${maxGroup} group has ${((maxRate - minRate) * 100).toFixed(1)}% higher selection rate than ${minGroup} group`);
        }
      }

      return patterns;
    } catch (error) {
      logger.error('Bias pattern detection failed:', error);
      return [];
    }
  }

  private calculateOverallBiasScore(fairnessMetrics: any, statisticalTests: any[]): number {
    try {
      let biasScore = 0;
      let components = 0;

      // Factor in demographic parity
      if (fairnessMetrics?.demographicParity) {
        biasScore += fairnessMetrics.demographicParity.maxDifference;
        components++;
      }

      // Factor in equalized odds
      if (fairnessMetrics?.equalizedOdds) {
        biasScore += fairnessMetrics.equalizedOdds.maxDifference;
        components++;
      }

      // Factor in statistical significance
      if (statisticalTests && statisticalTests.length > 0) {
        const significantTests = statisticalTests.filter(test => test.pValue < 0.05);
        if (significantTests.length > 0) {
          const avgEffectSize = significantTests.reduce((sum, test) => sum + test.effectSize, 0) / significantTests.length;
          biasScore += avgEffectSize;
          components++;
        }
      }

      return components > 0 ? biasScore / components : 0;
    } catch (error) {
      logger.error('Overall bias score calculation failed:', error);
      return 0;
    }
  }

  private generateMitigationRecommendations(
    fairnessMetrics: any,
    biasPatterns: string[],
    overallBiasScore: number
  ): string[] {
    const recommendations = [];

    if (overallBiasScore > 0.5) {
      recommendations.push('Immediate review of selection criteria and process required');
      recommendations.push('Consider implementing blind review processes');
    }

    if (biasPatterns.length > 0) {
      recommendations.push('Review identified bias patterns and adjust algorithms');
      recommendations.push('Implement additional fairness constraints');
    }

    if (fairnessMetrics?.demographicParity?.maxDifference > 0.2) {
      recommendations.push('Improve demographic representation in candidate pool');
    }

    recommendations.push('Regular bias audits and monitoring recommended');
    recommendations.push('Human oversight required for all hiring decisions');

    return recommendations;
  }

  private getDefaultThresholds(): BiasThresholds {
    return {
      warning: 0.3,
      critical: 0.5,
      demographicParity: 0.2,
      equalizedOdds: 0.15,
      effectSize: 0.3
    };
  }

  // Additional helper methods would be implemented here...
  // (Continuing with remaining methods for completeness)

  private async performPeriodicCheck(): Promise<void> {
    logger.info('Performing periodic bias check');
    // Implementation for periodic comprehensive checks
  }

  private async generateDailyReport(): Promise<void> {
    logger.info('Generating daily bias report');
    // Implementation for daily report generation
  }

  private async generateWeeklyAnalysis(): Promise<void> {
    logger.info('Generating weekly bias analysis');
    // Implementation for weekly trend analysis
  }

  private async handleBiasViolation(violation: BiasViolation): Promise<void> {
    logger.warn('Handling bias violation', { violation });
    // Implementation for violation handling
  }

  private async handleThresholdBreach(breach: ThresholdBreach): Promise<void> {
    logger.warn('Handling threshold breach', { breach });
    // Implementation for threshold breach handling
  }

  private async saveAlert(alert: BiasAlert): Promise<void> {
    const Alert = require('@/models/Alert').default;
    await Alert.create(alert);
  }

  private async sendRealTimeAlert(alert: BiasAlert): Promise<void> {
    WebSocketService.broadcast('bias_alert', alert);
  }

  private async sendEmailAlert(alert: BiasAlert): Promise<void> {
    // Implementation for email notifications
    logger.info('Sending email alert', { alertId: alert.alertId });
  }

  private getStartTimeForRange(timeRange: TimeRange, endTime: Date): Date {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return new Date(endTime.getTime() - ranges[timeRange]);
  }

  private async getMonitoringResults(startTime: Date, endTime: Date): Promise<any[]> {
    const MonitoringResult = require('@/models/MonitoringResult').default;
    return await MonitoringResult.find({
      timestamp: { $gte: startTime, $lte: endTime }
    }).sort({ timestamp: -1 }).lean();
  }

  private calculateSummaryMetrics(results: any[]): any {
    return {
      totalProcesses: results.length,
      violationCount: results.reduce((sum, r) => sum + r.violations.length, 0),
      complianceRate: results.filter(r => r.complianceStatus === 'compliant').length / results.length,
      averageBiasScore: results.reduce((sum, r) => sum + r.biasAnalysis.overallBiasScore, 0) / results.length
    };
  }

  private async getActiveAlerts(): Promise<BiasAlert[]> {
    const Alert = require('@/models/Alert').default;
    return await Alert.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10).lean();
  }

  private async getTrendData(startTime: Date, endTime: Date): Promise<any[]> {
    // Implementation for trend data calculation
    return [];
  }

  private calculateComplianceByProcess(results: any[]): any {
    const byProcess = new Map();
    for (const result of results) {
      if (!byProcess.has(result.processType)) {
        byProcess.set(result.processType, { total: 0, compliant: 0 });
      }
      const stats = byProcess.get(result.processType);
      stats.total++;
      if (result.complianceStatus === 'compliant') {
        stats.compliant++;
      }
    }

    const compliance: any = {};
    for (const [processType, stats] of byProcess.entries()) {
      compliance[processType] = stats.compliant / stats.total;
    }
    return compliance;
  }

  private analyzeBiasPatterns(results: any[]): string[] {
    // Implementation for bias pattern analysis
    return [];
  }

  private generateImprovementRecommendations(results: any[]): string[] {
    // Implementation for improvement recommendations
    return [];
  }

  private calculateOverallComplianceRate(results: any[]): number {
    if (results.length === 0) return 1;
    return results.filter(r => r.complianceStatus === 'compliant').length / results.length;
  }

  private async generateComplianceReport(results: any[], options: ReportOptions): Promise<any> {
    // Implementation for compliance report generation
    return {};
  }

  private async generateTrendAnalysisReport(results: any[], options: ReportOptions): Promise<any> {
    // Implementation for trend analysis report generation
    return {};
  }

  private async generateViolationSummaryReport(results: any[], options: ReportOptions): Promise<any> {
    // Implementation for violation summary report generation
    return {};
  }

  private async generateProcessPerformanceReport(results: any[], options: ReportOptions): Promise<any> {
    // Implementation for process performance report generation
    return {};
  }
}

// Supporting interfaces and types

export interface MonitoringConfig {
  thresholds?: Partial<BiasThresholds>;
  checkInterval?: string;
  enableRealTime?: boolean;
  enableAlerts?: boolean;
}

export interface BiasThresholds {
  warning: number;
  critical: number;
  demographicParity: number;
  equalizedOdds: number;
  effectSize: number;
}

export type ProcessType = 'application_review' | 'interview_scheduling' | 'hiring_decision' | 'matching';

export interface ProcessData {
  candidates?: any[];
  applications?: any[];
  interviews?: any[];
  decisions?: any[];
  matches?: any[];
}

export interface BiasMonitoringResult {
  monitoringId: string;
  processId: string;
  processType: ProcessType;
  biasAnalysis: BiasAnalysisResult;
  violations: BiasViolation[];
  complianceStatus: 'compliant' | 'violation_detected' | 'non_compliant';
  recommendations: string[];
  processingTime: number;
  timestamp: Date;
}

export interface BiasAnalysisResult {
  overallBiasScore: number;
  biasMetrics: any;
  statisticalTests?: any[];
  detectedPatterns: string[];
  mitigationRecommendations: string[];
  complianceStatus: 'compliant' | 'non_compliant';
  analysisTimestamp: Date;
}

export interface BiasViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  description: string;
  processType: ProcessType;
  timestamp: Date;
}

export interface BiasAlert {
  alertId: string;
  processId: string;
  processType: ProcessType;
  violation: BiasViolation;
  biasAnalysis: BiasAnalysisResult;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
}

export interface ThresholdBreach {
  metric: string;
  value: number;
  threshold: number;
  processType: ProcessType;
  timestamp: Date;
}

export interface AuditTrailEntry {
  monitoringId: string;
  processId: string;
  processType: ProcessType;
  biasAnalysis: BiasAnalysisResult;
  violations: BiasViolation[];
  timestamp: Date;
  processingTime: number;
}

export type TimeRange = '1h' | '24h' | '7d' | '30d';

export interface BiasMonitoringDashboard {
  timeRange: TimeRange;
  startTime: Date;
  endTime: Date;
  summaryMetrics: any;
  activeAlerts: BiasAlert[];
  trendData: any[];
  complianceByProcess: any;
  recentResults: any[];
  lastUpdated: Date;
}

export interface DetailedBiasAnalysis {
  processId: string;
  latestAnalysis: BiasAnalysisResult;
  historicalTrend: any[];
  biasPatterns: string[];
  improvements: string[];
  complianceHistory: any[];
  lastAnalyzed: Date;
}

export type ReportType = 'compliance' | 'trend_analysis' | 'violation_summary' | 'process_performance';

export interface ReportOptions {
  includeDetails?: boolean;
  groupBy?: string;
  filterBy?: any;
}

export interface BiasMonitoringReport {
  reportId: string;
  reportType: ReportType;
  timeRange: TimeRange;
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

export default BiasMonitoringService;