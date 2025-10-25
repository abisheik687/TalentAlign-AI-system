import { StatisticalTestService } from './StatisticalTestService';
import { BiasMonitoringService } from './BiasMonitoringService';

/**
 * Comprehensive Fairness Reporting Service
 * Generates transparency reports and tracks demographic parity across hiring funnel
 * Requirements: 8.1, 8.5
 */

interface FairnessReport {
  reportId: string;
  reportType: 'quarterly' | 'annual' | 'custom';
  generatedAt: Date;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  executiveSummary: {
    overallFairnessScore: number;
    keyFindings: string[];
    recommendations: string[];
    complianceStatus: 'compliant' | 'needs_attention' | 'non_compliant';
  };
  demographicAnalysis: DemographicAnalysis;
  funnelAnalysis: FunnelAnalysis;
  statisticalTests: StatisticalTestResults;
  trendsAnalysis: TrendsAnalysis;
  actionItems: ActionItem[];
}

interface DemographicAnalysis {
  applicantPool: DemographicBreakdown;
  screeningStage: DemographicBreakdown;
  interviewStage: DemographicBreakdown;
  offerStage: DemographicBreakdown;
  hiredCandidates: DemographicBreakdown;
  diversityMetrics: {
    demographicParity: number;
    equalOpportunity: number;
    equalizedOdds: number;
  };
}

interface DemographicBreakdown {
  total: number;
  gender: Record<string, { count: number; percentage: number }>;
  ethnicity: Record<string, { count: number; percentage: number }>;
  age: Record<string, { count: number; percentage: number }>;
  disability: Record<string, { count: number; percentage: number }>;
}

interface FunnelAnalysis {
  stages: FunnelStage[];
  dropoffRates: Record<string, number>;
  biasIndicators: BiasIndicator[];
}

interface FunnelStage {
  stageName: string;
  totalCandidates: number;
  advancementRates: Record<string, number>; // By demographic group
  biasScore: number;
  statisticalSignificance: number;
}

interface BiasIndicator {
  stage: string;
  affectedGroup: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number;
  recommendation: string;
}

interface StatisticalTestResults {
  chiSquareTests: ChiSquareResult[];
  fisherExactTests: FisherExactResult[];
  significantFindings: string[];
}

interface ChiSquareResult {
  testName: string;
  pValue: number;
  chiSquareStatistic: number;
  degreesOfFreedom: number;
  isSignificant: boolean;
  interpretation: string;
}

interface FisherExactResult {
  testName: string;
  pValue: number;
  oddsRatio: number;
  confidenceInterval: [number, number];
  isSignificant: boolean;
  interpretation: string;
}

interface TrendsAnalysis {
  timeframe: string;
  diversityTrends: {
    improving: string[];
    stable: string[];
    declining: string[];
  };
  performanceMetrics: {
    timeToHire: TrendMetric;
    candidateQuality: TrendMetric;
    hiringManagerSatisfaction: TrendMetric;
  };
}

interface TrendMetric {
  current: number;
  previous: number;
  change: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  category: 'process' | 'training' | 'policy' | 'technology';
  description: string;
  owner: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

export class FairnessReportingService {
  private statisticalTestService: StatisticalTestService;
  private biasMonitoringService: BiasMonitoringService;

  constructor() {
    this.statisticalTestService = new StatisticalTestService();
    this.biasMonitoringService = new BiasMonitoringService();
  }

  /**
   * Generate comprehensive quarterly transparency report
   */
  async generateQuarterlyReport(
    startDate: Date,
    endDate: Date,
    includeRecommendations: boolean = true
  ): Promise<FairnessReport> {
    try {
      const reportId = `fairness_report_${Date.now()}`;
      
      // Collect hiring data for the period
      const hiringData = await this.collectHiringData(startDate, endDate);
      
      // Perform demographic analysis
      const demographicAnalysis = await this.analyzeDemographics(hiringData);
      
      // Analyze hiring funnel
      const funnelAnalysis = await this.analyzeFunnel(hiringData);
      
      // Run statistical tests
      const statisticalTests = await this.runStatisticalTests(hiringData);
      
      // Analyze trends
      const trendsAnalysis = await this.analyzeTrends(hiringData, startDate, endDate);
      
      // Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(
        demographicAnalysis,
        funnelAnalysis,
        statisticalTests,
        trendsAnalysis
      );
      
      // Generate action items
      const actionItems = includeRecommendations ? 
        await this.generateActionItems(demographicAnalysis, funnelAnalysis, statisticalTests) : [];

      const report: FairnessReport = {
        reportId,
        reportType: 'quarterly',
        generatedAt: new Date(),
        reportPeriod: { startDate, endDate },
        executiveSummary,
        demographicAnalysis,
        funnelAnalysis,
        statisticalTests,
        trendsAnalysis,
        actionItems
      };

      // Store report for audit trail
      await this.storeReport(report);
      
      return report;
    } catch (error) {
      console.error('Failed to generate fairness report:', error);
      throw new Error('Fairness report generation failed');
    }
  }

  /**
   * Track demographic parity across hiring funnel stages
   */
  async trackDemographicParity(
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<{
    currentParity: number;
    historicalTrend: Array<{ date: Date; parity: number }>;
    alerts: string[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Set timeframe
      switch (timeframe) {
        case 'daily':
          startDate.setDate(endDate.getDate() - 30); // Last 30 days
          break;
        case 'weekly':
          startDate.setDate(endDate.getDate() - 84); // Last 12 weeks
          break;
        case 'monthly':
          startDate.setMonth(endDate.getMonth() - 12); // Last 12 months
          break;
      }

      const hiringData = await this.collectHiringData(startDate, endDate);
      const currentParity = await this.calculateDemographicParity(hiringData);
      
      // Generate historical trend
      const historicalTrend = await this.generateParityTrend(startDate, endDate, timeframe);
      
      // Check for alerts
      const alerts = this.generateParityAlerts(currentParity, historicalTrend);

      return {
        currentParity,
        historicalTrend,
        alerts
      };
    } catch (error) {
      console.error('Failed to track demographic parity:', error);
      throw new Error('Demographic parity tracking failed');
    }
  }

  /**
   * Add statistical significance testing for all metrics
   */
  async validateStatisticalSignificance(
    hiringData: any[],
    confidenceLevel: number = 0.95
  ): Promise<{
    significantFindings: string[];
    testResults: any[];
    recommendations: string[];
  }> {
    try {
      const testResults = [];
      const significantFindings = [];
      const recommendations = [];

      // Test for gender bias in hiring decisions
      const genderTest = await this.testGenderBias(hiringData, confidenceLevel);
      testResults.push(genderTest);
      
      if (genderTest.isSignificant) {
        significantFindings.push(`Significant gender bias detected (p=${genderTest.pValue.toFixed(4)})`);
        recommendations.push('Review gender-neutral job descriptions and interview processes');
      }

      // Test for ethnicity bias
      const ethnicityTest = await this.testEthnicityBias(hiringData, confidenceLevel);
      testResults.push(ethnicityTest);
      
      if (ethnicityTest.isSignificant) {
        significantFindings.push(`Significant ethnicity bias detected (p=${ethnicityTest.pValue.toFixed(4)})`);
        recommendations.push('Implement blind resume screening and diverse interview panels');
      }

      // Test for age bias
      const ageTest = await this.testAgeBias(hiringData, confidenceLevel);
      testResults.push(ageTest);
      
      if (ageTest.isSignificant) {
        significantFindings.push(`Significant age bias detected (p=${ageTest.pValue.toFixed(4)})`);
        recommendations.push('Review age-inclusive language and eliminate age-related requirements');
      }

      // Test for intersectional bias
      const intersectionalTest = await this.testIntersectionalBias(hiringData, confidenceLevel);
      testResults.push(intersectionalTest);
      
      if (intersectionalTest.isSignificant) {
        significantFindings.push('Significant intersectional bias detected');
        recommendations.push('Analyze compound effects of multiple protected characteristics');
      }

      return {
        significantFindings,
        testResults,
        recommendations
      };
    } catch (error) {
      console.error('Statistical significance validation failed:', error);
      throw new Error('Failed to validate statistical significance');
    }
  }

  /**
   * Private helper methods
   */
  private async collectHiringData(startDate: Date, endDate: Date): Promise<any[]> {
    // In real implementation, this would query the database
    // For now, return mock data
    return Array(1000).fill(null).map((_, idx) => ({
      candidateId: `candidate_${idx}`,
      applicationDate: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())),
      demographics: {
        gender: Math.random() > 0.5 ? 'female' : 'male',
        ethnicity: ['asian', 'black', 'hispanic', 'white', 'other'][Math.floor(Math.random() * 5)],
        age: 22 + Math.random() * 43,
        disability: Math.random() > 0.9 ? 'yes' : 'no'
      },
      stages: {
        applied: true,
        screened: Math.random() > 0.3,
        interviewed: Math.random() > 0.6,
        offered: Math.random() > 0.8,
        hired: Math.random() > 0.9
      },
      scores: {
        resume: Math.random() * 100,
        interview: Math.random() * 100,
        technical: Math.random() * 100
      }
    }));
  }

  private async analyzeDemographics(hiringData: any[]): Promise<DemographicAnalysis> {
    const stages = ['applied', 'screened', 'interviewed', 'offered', 'hired'];
    const analysis: any = {};

    for (const stage of stages) {
      const stageData = hiringData.filter(candidate => candidate.stages[stage]);
      analysis[stage === 'applied' ? 'applicantPool' : 
              stage === 'screened' ? 'screeningStage' :
              stage === 'interviewed' ? 'interviewStage' :
              stage === 'offered' ? 'offerStage' : 'hiredCandidates'] = 
        this.calculateDemographicBreakdown(stageData);
    }

    // Calculate diversity metrics
    const diversityMetrics = {
      demographicParity: await this.calculateDemographicParity(hiringData),
      equalOpportunity: await this.calculateEqualOpportunity(hiringData),
      equalizedOdds: await this.calculateEqualizedOdds(hiringData)
    };

    return { ...analysis, diversityMetrics };
  }

  private calculateDemographicBreakdown(data: any[]): DemographicBreakdown {
    const total = data.length;
    const breakdown: DemographicBreakdown = {
      total,
      gender: {},
      ethnicity: {},
      age: {},
      disability: {}
    };

    // Calculate gender breakdown
    const genderCounts = data.reduce((acc, candidate) => {
      const gender = candidate.demographics.gender;
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    Object.entries(genderCounts).forEach(([gender, count]) => {
      breakdown.gender[gender] = {
        count: count as number,
        percentage: ((count as number) / total) * 100
      };
    });

    // Calculate ethnicity breakdown
    const ethnicityCounts = data.reduce((acc, candidate) => {
      const ethnicity = candidate.demographics.ethnicity;
      acc[ethnicity] = (acc[ethnicity] || 0) + 1;
      return acc;
    }, {});

    Object.entries(ethnicityCounts).forEach(([ethnicity, count]) => {
      breakdown.ethnicity[ethnicity] = {
        count: count as number,
        percentage: ((count as number) / total) * 100
      };
    });

    // Calculate age breakdown
    const ageCounts = data.reduce((acc, candidate) => {
      const age = candidate.demographics.age;
      const ageGroup = age < 30 ? '20-30' : age < 40 ? '30-40' : age < 50 ? '40-50' : '50+';
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {});

    Object.entries(ageCounts).forEach(([ageGroup, count]) => {
      breakdown.age[ageGroup] = {
        count: count as number,
        percentage: ((count as number) / total) * 100
      };
    });

    // Calculate disability breakdown
    const disabilityCounts = data.reduce((acc, candidate) => {
      const disability = candidate.demographics.disability;
      acc[disability] = (acc[disability] || 0) + 1;
      return acc;
    }, {});

    Object.entries(disabilityCounts).forEach(([disability, count]) => {
      breakdown.disability[disability] = {
        count: count as number,
        percentage: ((count as number) / total) * 100
      };
    });

    return breakdown;
  }

  private async analyzeFunnel(hiringData: any[]): Promise<FunnelAnalysis> {
    const stages = [
      { name: 'Application', field: 'applied' },
      { name: 'Screening', field: 'screened' },
      { name: 'Interview', field: 'interviewed' },
      { name: 'Offer', field: 'offered' },
      { name: 'Hire', field: 'hired' }
    ];

    const funnelStages: FunnelStage[] = [];
    const dropoffRates: Record<string, number> = {};
    const biasIndicators: BiasIndicator[] = [];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const stageData = hiringData.filter(candidate => candidate.stages[stage.field]);
      
      // Calculate advancement rates by demographic group
      const advancementRates: Record<string, number> = {};
      
      ['male', 'female'].forEach(gender => {
        const genderCandidates = stageData.filter(c => c.demographics.gender === gender);
        const nextStage = stages[i + 1];
        
        if (nextStage) {
          const advancedCandidates = genderCandidates.filter(c => c.stages[nextStage.field]);
          advancementRates[gender] = genderCandidates.length > 0 ? 
            advancedCandidates.length / genderCandidates.length : 0;
        }
      });

      // Calculate bias score for this stage
      const biasScore = this.calculateStageBiasScore(advancementRates);
      
      // Calculate statistical significance
      const statisticalSignificance = await this.calculateStageSignificance(stageData, stage.field);

      funnelStages.push({
        stageName: stage.name,
        totalCandidates: stageData.length,
        advancementRates,
        biasScore,
        statisticalSignificance
      });

      // Calculate dropoff rates
      if (i > 0) {
        const previousStage = stages[i - 1];
        const previousStageData = hiringData.filter(candidate => candidate.stages[previousStage.field]);
        dropoffRates[stage.name] = 1 - (stageData.length / previousStageData.length);
      }

      // Identify bias indicators
      if (biasScore > 0.2 && statisticalSignificance > 0.95) {
        biasIndicators.push({
          stage: stage.name,
          affectedGroup: this.identifyMostAffectedGroup(advancementRates),
          severity: biasScore > 0.5 ? 'high' : biasScore > 0.3 ? 'medium' : 'low',
          description: `Significant advancement rate disparity detected in ${stage.name} stage`,
          impact: biasScore,
          recommendation: this.generateStageRecommendation(stage.name, biasScore)
        });
      }
    }

    return {
      stages: funnelStages,
      dropoffRates,
      biasIndicators
    };
  }  privat
e async runStatisticalTests(hiringData: any[]): Promise<StatisticalTestResults> {
    const chiSquareTests: ChiSquareResult[] = [];
    const fisherExactTests: FisherExactResult[] = [];
    const significantFindings: string[] = [];

    // Chi-square test for gender distribution across stages
    const genderChiSquare = await this.statisticalTestService.chiSquareTest(
      this.prepareContingencyTable(hiringData, 'gender', 'hired')
    );
    
    chiSquareTests.push({
      testName: 'Gender Distribution in Hiring',
      pValue: genderChiSquare.pValue,
      chiSquareStatistic: genderChiSquare.statistic,
      degreesOfFreedom: genderChiSquare.degreesOfFreedom,
      isSignificant: genderChiSquare.pValue < 0.05,
      interpretation: genderChiSquare.pValue < 0.05 ? 
        'Significant gender bias detected in hiring decisions' :
        'No significant gender bias detected'
    });

    if (genderChiSquare.pValue < 0.05) {
      significantFindings.push('Gender bias in hiring decisions');
    }

    // Fisher's exact test for small sample groups
    const ethnicityFisher = await this.statisticalTestService.fisherExactTest(
      this.prepareContingencyTable(hiringData, 'ethnicity', 'hired')
    );
    
    fisherExactTests.push({
      testName: 'Ethnicity Distribution in Hiring',
      pValue: ethnicityFisher.pValue,
      oddsRatio: ethnicityFisher.oddsRatio,
      confidenceInterval: ethnicityFisher.confidenceInterval,
      isSignificant: ethnicityFisher.pValue < 0.05,
      interpretation: ethnicityFisher.pValue < 0.05 ?
        'Significant ethnicity bias detected in hiring decisions' :
        'No significant ethnicity bias detected'
    });

    if (ethnicityFisher.pValue < 0.05) {
      significantFindings.push('Ethnicity bias in hiring decisions');
    }

    return {
      chiSquareTests,
      fisherExactTests,
      significantFindings
    };
  }

  private async analyzeTrends(hiringData: any[], startDate: Date, endDate: Date): Promise<TrendsAnalysis> {
    // Compare with previous period
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate);
    
    const previousData = await this.collectHiringData(previousStartDate, previousEndDate);
    
    // Analyze diversity trends
    const currentDiversity = await this.analyzeDemographics(hiringData);
    const previousDiversity = await this.analyzeDemographics(previousData);
    
    const diversityTrends = this.compareDiversityMetrics(currentDiversity, previousDiversity);
    
    // Analyze performance metrics
    const performanceMetrics = {
      timeToHire: this.calculateTrendMetric(
        this.calculateAverageTimeToHire(hiringData),
        this.calculateAverageTimeToHire(previousData)
      ),
      candidateQuality: this.calculateTrendMetric(
        this.calculateAverageCandidateQuality(hiringData),
        this.calculateAverageCandidateQuality(previousData)
      ),
      hiringManagerSatisfaction: this.calculateTrendMetric(
        this.calculateAverageHiringManagerSatisfaction(hiringData),
        this.calculateAverageHiringManagerSatisfaction(previousData)
      )
    };

    return {
      timeframe: `${Math.ceil(periodLength / (1000 * 60 * 60 * 24))} days`,
      diversityTrends,
      performanceMetrics
    };
  }

  private generateExecutiveSummary(
    demographicAnalysis: DemographicAnalysis,
    funnelAnalysis: FunnelAnalysis,
    statisticalTests: StatisticalTestResults,
    trendsAnalysis: TrendsAnalysis
  ): any {
    const overallFairnessScore = (
      demographicAnalysis.diversityMetrics.demographicParity +
      demographicAnalysis.diversityMetrics.equalOpportunity +
      demographicAnalysis.diversityMetrics.equalizedOdds
    ) / 3;

    const keyFindings: string[] = [];
    const recommendations: string[] = [];

    // Analyze key findings
    if (overallFairnessScore < 0.7) {
      keyFindings.push('Overall fairness score below acceptable threshold');
      recommendations.push('Implement comprehensive bias mitigation strategies');
    }

    if (funnelAnalysis.biasIndicators.length > 0) {
      keyFindings.push(`${funnelAnalysis.biasIndicators.length} bias indicators detected across hiring stages`);
      recommendations.push('Address specific bias indicators in hiring funnel');
    }

    if (statisticalTests.significantFindings.length > 0) {
      keyFindings.push('Statistically significant bias detected');
      recommendations.push('Immediate intervention required for significant bias findings');
    }

    // Determine compliance status
    let complianceStatus: 'compliant' | 'needs_attention' | 'non_compliant';
    if (overallFairnessScore >= 0.8 && statisticalTests.significantFindings.length === 0) {
      complianceStatus = 'compliant';
    } else if (overallFairnessScore >= 0.6) {
      complianceStatus = 'needs_attention';
    } else {
      complianceStatus = 'non_compliant';
    }

    return {
      overallFairnessScore,
      keyFindings,
      recommendations,
      complianceStatus
    };
  }

  private async generateActionItems(
    demographicAnalysis: DemographicAnalysis,
    funnelAnalysis: FunnelAnalysis,
    statisticalTests: StatisticalTestResults
  ): Promise<ActionItem[]> {
    const actionItems: ActionItem[] = [];

    // Generate action items based on bias indicators
    funnelAnalysis.biasIndicators.forEach(indicator => {
      actionItems.push({
        priority: indicator.severity === 'high' || indicator.severity === 'critical' ? 'high' : 'medium',
        category: 'process',
        description: indicator.recommendation,
        owner: 'Hiring Manager',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'pending'
      });
    });

    // Generate action items based on statistical findings
    statisticalTests.significantFindings.forEach(finding => {
      actionItems.push({
        priority: 'high',
        category: 'policy',
        description: `Address ${finding} through policy review and training`,
        owner: 'HR Director',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'pending'
      });
    });

    // Generate general improvement action items
    if (demographicAnalysis.diversityMetrics.demographicParity < 0.8) {
      actionItems.push({
        priority: 'medium',
        category: 'training',
        description: 'Conduct unconscious bias training for all hiring managers',
        owner: 'Training Coordinator',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        status: 'pending'
      });
    }

    return actionItems;
  }

  private async storeReport(report: FairnessReport): Promise<void> {
    // In real implementation, this would store the report in database
    console.log(`Storing fairness report ${report.reportId}`);
  }

  private async calculateDemographicParity(hiringData: any[]): Promise<number> {
    const hiredCandidates = hiringData.filter(candidate => candidate.stages.hired);
    
    if (hiredCandidates.length === 0) return 1;

    const genderRates: Record<string, number> = {};
    
    ['male', 'female'].forEach(gender => {
      const genderApplicants = hiringData.filter(c => c.demographics.gender === gender);
      const genderHired = hiredCandidates.filter(c => c.demographics.gender === gender);
      
      genderRates[gender] = genderApplicants.length > 0 ? 
        genderHired.length / genderApplicants.length : 0;
    });

    const rates = Object.values(genderRates);
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);
    
    return maxRate > 0 ? minRate / maxRate : 1;
  }

  private async calculateEqualOpportunity(hiringData: any[]): Promise<number> {
    // Simplified calculation - in practice would need true positive rates
    return this.calculateDemographicParity(hiringData);
  }

  private async calculateEqualizedOdds(hiringData: any[]): Promise<number> {
    // Simplified calculation - in practice would need both TPR and FPR
    return this.calculateDemographicParity(hiringData);
  }

  private async generateParityTrend(
    startDate: Date,
    endDate: Date,
    timeframe: string
  ): Promise<Array<{ date: Date; parity: number }>> {
    const trend = [];
    const intervalMs = timeframe === 'daily' ? 24 * 60 * 60 * 1000 :
                     timeframe === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
                     30 * 24 * 60 * 60 * 1000;

    for (let date = new Date(startDate); date <= endDate; date = new Date(date.getTime() + intervalMs)) {
      const periodEnd = new Date(Math.min(date.getTime() + intervalMs, endDate.getTime()));
      const periodData = await this.collectHiringData(date, periodEnd);
      const parity = await this.calculateDemographicParity(periodData);
      
      trend.push({ date: new Date(date), parity });
    }

    return trend;
  }

  private generateParityAlerts(
    currentParity: number,
    historicalTrend: Array<{ date: Date; parity: number }>
  ): string[] {
    const alerts: string[] = [];

    if (currentParity < 0.8) {
      alerts.push('Current demographic parity below acceptable threshold (0.8)');
    }

    if (historicalTrend.length >= 3) {
      const recentTrend = historicalTrend.slice(-3);
      const isDecreasing = recentTrend.every((point, idx) => 
        idx === 0 || point.parity < recentTrend[idx - 1].parity
      );
      
      if (isDecreasing) {
        alerts.push('Demographic parity showing declining trend');
      }
    }

    return alerts;
  }

  private async testGenderBias(hiringData: any[], confidenceLevel: number): Promise<ChiSquareResult> {
    const contingencyTable = this.prepareContingencyTable(hiringData, 'gender', 'hired');
    const result = await this.statisticalTestService.chiSquareTest(contingencyTable);
    
    return {
      testName: 'Gender Bias Test',
      pValue: result.pValue,
      chiSquareStatistic: result.statistic,
      degreesOfFreedom: result.degreesOfFreedom,
      isSignificant: result.pValue < (1 - confidenceLevel),
      interpretation: result.pValue < 0.05 ? 
        'Significant gender bias detected' : 'No significant gender bias'
    };
  }

  private async testEthnicityBias(hiringData: any[], confidenceLevel: number): Promise<FisherExactResult> {
    const contingencyTable = this.prepareContingencyTable(hiringData, 'ethnicity', 'hired');
    const result = await this.statisticalTestService.fisherExactTest(contingencyTable);
    
    return {
      testName: 'Ethnicity Bias Test',
      pValue: result.pValue,
      oddsRatio: result.oddsRatio,
      confidenceInterval: result.confidenceInterval,
      isSignificant: result.pValue < (1 - confidenceLevel),
      interpretation: result.pValue < 0.05 ? 
        'Significant ethnicity bias detected' : 'No significant ethnicity bias'
    };
  }

  private async testAgeBias(hiringData: any[], confidenceLevel: number): Promise<ChiSquareResult> {
    // Group ages and test for bias
    const ageGroupedData = hiringData.map(candidate => ({
      ...candidate,
      demographics: {
        ...candidate.demographics,
        ageGroup: candidate.demographics.age < 40 ? 'under_40' : 'over_40'
      }
    }));
    
    const contingencyTable = this.prepareContingencyTable(ageGroupedData, 'ageGroup', 'hired');
    const result = await this.statisticalTestService.chiSquareTest(contingencyTable);
    
    return {
      testName: 'Age Bias Test',
      pValue: result.pValue,
      chiSquareStatistic: result.statistic,
      degreesOfFreedom: result.degreesOfFreedom,
      isSignificant: result.pValue < (1 - confidenceLevel),
      interpretation: result.pValue < 0.05 ? 
        'Significant age bias detected' : 'No significant age bias'
    };
  }

  private async testIntersectionalBias(hiringData: any[], confidenceLevel: number): Promise<ChiSquareResult> {
    // Test for intersectional bias (e.g., women of color)
    const intersectionalData = hiringData.map(candidate => ({
      ...candidate,
      demographics: {
        ...candidate.demographics,
        intersectional: candidate.demographics.gender === 'female' && 
                       ['black', 'hispanic'].includes(candidate.demographics.ethnicity) ? 
                       'women_of_color' : 'other'
      }
    }));
    
    const contingencyTable = this.prepareContingencyTable(intersectionalData, 'intersectional', 'hired');
    const result = await this.statisticalTestService.chiSquareTest(contingencyTable);
    
    return {
      testName: 'Intersectional Bias Test',
      pValue: result.pValue,
      chiSquareStatistic: result.statistic,
      degreesOfFreedom: result.degreesOfFreedom,
      isSignificant: result.pValue < (1 - confidenceLevel),
      interpretation: result.pValue < 0.05 ? 
        'Significant intersectional bias detected' : 'No significant intersectional bias'
    };
  }

  private prepareContingencyTable(hiringData: any[], demographicField: string, outcomeField: string): number[][] {
    const groups = [...new Set(hiringData.map(candidate => 
      demographicField.includes('.') ? 
        candidate.demographics[demographicField.split('.')[1]] :
        candidate.demographics[demographicField]
    ))];
    
    const table = groups.map(group => {
      const groupData = hiringData.filter(candidate => 
        (demographicField.includes('.') ? 
          candidate.demographics[demographicField.split('.')[1]] :
          candidate.demographics[demographicField]) === group
      );
      
      const positive = groupData.filter(candidate => candidate.stages[outcomeField]).length;
      const negative = groupData.length - positive;
      
      return [positive, negative];
    });
    
    return table;
  }

  private calculateStageBiasScore(advancementRates: Record<string, number>): number {
    const rates = Object.values(advancementRates);
    if (rates.length < 2) return 0;
    
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);
    
    return maxRate > 0 ? 1 - (minRate / maxRate) : 0;
  }

  private async calculateStageSignificance(stageData: any[], stageField: string): Promise<number> {
    // Simplified significance calculation
    return stageData.length > 30 ? 0.95 : 0.8;
  }

  private identifyMostAffectedGroup(advancementRates: Record<string, number>): string {
    return Object.entries(advancementRates)
      .sort(([,a], [,b]) => a - b)[0][0];
  }

  private generateStageRecommendation(stageName: string, biasScore: number): string {
    const recommendations = {
      'Application': 'Review job posting language and recruitment channels',
      'Screening': 'Implement blind resume screening process',
      'Interview': 'Standardize interview questions and use diverse panels',
      'Offer': 'Review offer criteria and negotiation processes',
      'Hire': 'Analyze final decision-making factors'
    };
    
    return recommendations[stageName as keyof typeof recommendations] || 'Review stage processes for bias';
  }

  private compareDiversityMetrics(current: DemographicAnalysis, previous: DemographicAnalysis): {
    improving: string[];
    stable: string[];
    declining: string[];
  } {
    const improving: string[] = [];
    const stable: string[] = [];
    const declining: string[] = [];

    // Compare demographic parity
    const parityChange = current.diversityMetrics.demographicParity - previous.diversityMetrics.demographicParity;
    if (parityChange > 0.05) improving.push('Demographic Parity');
    else if (parityChange < -0.05) declining.push('Demographic Parity');
    else stable.push('Demographic Parity');

    // Compare equal opportunity
    const opportunityChange = current.diversityMetrics.equalOpportunity - previous.diversityMetrics.equalOpportunity;
    if (opportunityChange > 0.05) improving.push('Equal Opportunity');
    else if (opportunityChange < -0.05) declining.push('Equal Opportunity');
    else stable.push('Equal Opportunity');

    return { improving, stable, declining };
  }

  private calculateTrendMetric(current: number, previous: number): TrendMetric {
    const change = current - previous;
    const trend = change > 0.05 ? 'improving' : change < -0.05 ? 'declining' : 'stable';
    
    return { current, previous, change, trend };
  }

  private calculateAverageTimeToHire(hiringData: any[]): number {
    const hiredCandidates = hiringData.filter(candidate => candidate.stages.hired);
    if (hiredCandidates.length === 0) return 0;
    
    // Mock calculation - in real implementation would calculate actual time to hire
    return 25 + Math.random() * 10;
  }

  private calculateAverageCandidateQuality(hiringData: any[]): number {
    const hiredCandidates = hiringData.filter(candidate => candidate.stages.hired);
    if (hiredCandidates.length === 0) return 0;
    
    return hiredCandidates.reduce((sum, candidate) => 
      sum + (candidate.scores.resume + candidate.scores.interview + candidate.scores.technical) / 3, 0
    ) / hiredCandidates.length;
  }

  private calculateAverageHiringManagerSatisfaction(hiringData: any[]): number {
    // Mock calculation - in real implementation would use actual satisfaction scores
    return 7.5 + Math.random() * 2;
  }
}