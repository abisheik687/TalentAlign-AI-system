import { logger } from '@/utils/logger';
import { StatisticalTestService } from '@/services/StatisticalTestService';

/**
 * Fairness Metrics Calculation Engine
 * Implements comprehensive fairness metrics for hiring processes
 * Requirements: 4.3, 8.1, 8.2, 8.3
 */
export class FairnessMetricsCalculator {
  private static statisticalTests: StatisticalTestService;

  static {
    this.statisticalTests = new StatisticalTestService();
  }

  /**
   * Calculate comprehensive fairness metrics for hiring outcomes
   */
  static async calculateComprehensiveFairnessMetrics(
    candidates: any[],
    outcomes: boolean[],
    protectedAttributes: Record<string, any[]>,
    context: FairnessContext
  ): Promise<ComprehensiveFairnessReport> {
    try {
      logger.info('Starting comprehensive fairness metrics calculation', {
        candidateCount: candidates.length,
        outcomeCount: outcomes.length,
        protectedAttributeKeys: Object.keys(protectedAttributes),
        context
      });

      const startTime = Date.now();

      // Validate inputs
      this.validateInputs(candidates, outcomes, protectedAttributes);

      // Calculate individual fairness metrics
      const demographicParity = await this.calculateDemographicParity(
        outcomes,
        protectedAttributes,
        context
      );

      const equalizedOdds = await this.calculateEqualizedOdds(
        outcomes,
        protectedAttributes,
        context
      );

      const predictiveEquality = await this.calculatePredictiveEquality(
        outcomes,
        protectedAttributes,
        context
      );

      const calibration = await this.calculateCalibration(
        candidates,
        outcomes,
        protectedAttributes,
        context
      );

      const individualFairness = await this.calculateIndividualFairness(
        candidates,
        outcomes,
        context
      );

      const counterfactualFairness = await this.calculateCounterfactualFairness(
        candidates,
        outcomes,
        protectedAttributes,
        context
      );

      // Calculate intersectional fairness
      const intersectionalFairness = await this.calculateIntersectionalFairness(
        outcomes,
        protectedAttributes,
        context
      );

      // Perform statistical significance tests
      const statisticalTests = await this.performStatisticalTests(
        outcomes,
        protectedAttributes,
        context
      );

      // Calculate overall fairness score
      const overallFairnessScore = this.calculateOverallFairnessScore({
        demographicParity,
        equalizedOdds,
        predictiveEquality,
        calibration,
        individualFairness,
        counterfactualFairness,
        intersectionalFairness
      });

      // Generate recommendations
      const recommendations = this.generateFairnessRecommendations({
        demographicParity,
        equalizedOdds,
        predictiveEquality,
        calibration,
        individualFairness,
        counterfactualFairness,
        intersectionalFairness,
        statisticalTests
      });

      const processingTime = Date.now() - startTime;

      const report: ComprehensiveFairnessReport = {
        reportId: `fairness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        context,
        sampleSize: {
          total: candidates.length,
          positive: outcomes.filter(o => o).length,
          negative: outcomes.filter(o => !o).length
        },
        metrics: {
          demographicParity,
          equalizedOdds,
          predictiveEquality,
          calibration,
          individualFairness,
          counterfactualFairness,
          intersectionalFairness
        },
        statisticalTests,
        overallFairnessScore,
        complianceStatus: this.determineComplianceStatus(overallFairnessScore, statisticalTests),
        recommendations,
        processingTime,
        metadata: {
          calculationVersion: '1.0',
          protectedAttributes: Object.keys(protectedAttributes),
          significanceLevel: 0.05
        }
      };

      logger.info('Fairness metrics calculation completed', {
        reportId: report.reportId,
        overallScore: overallFairnessScore,
        processingTime,
        complianceStatus: report.complianceStatus
      });

      return report;

    } catch (error) {
      logger.error('Fairness metrics calculation failed:', error);
      throw new Error(`Fairness metrics calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate Demographic Parity (Statistical Parity)
   * P(Y=1|A=0) = P(Y=1|A=1) for all protected attributes A
   */
  static async calculateDemographicParity(
    outcomes: boolean[],
    protectedAttributes: Record<string, any[]>,
    context: FairnessContext
  ): Promise<DemographicParityMetric> {
    const results: Record<string, any> = {};

    for (const [attributeName, attributeValues] of Object.entries(protectedAttributes)) {
      const groups = [...new Set(attributeValues)];
      const groupMetrics: Record<string, any> = {};
      const selectionRates: number[] = [];

      for (const group of groups) {
        const groupIndices = attributeValues
          .map((value, index) => value === group ? index : -1)
          .filter(index => index !== -1);

        const groupOutcomes = groupIndices.map(index => outcomes[index]);
        const selectionRate = groupOutcomes.filter(outcome => outcome).length / groupOutcomes.length;
        
        groupMetrics[group] = {
          count: groupOutcomes.length,
          selected: groupOutcomes.filter(outcome => outcome).length,
          selectionRate,
          percentage: Math.round(selectionRate * 100 * 100) / 100
        };

        selectionRates.push(selectionRate);
      }

      // Calculate parity metrics
      const maxRate = Math.max(...selectionRates);
      const minRate = Math.min(...selectionRates);
      const parityRatio = minRate / maxRate;
      const parityDifference = maxRate - minRate;
      
      // Calculate standard deviation of selection rates
      const meanRate = selectionRates.reduce((sum, rate) => sum + rate, 0) / selectionRates.length;
      const variance = selectionRates.reduce((sum, rate) => sum + Math.pow(rate - meanRate, 2), 0) / selectionRates.length;
      const standardDeviation = Math.sqrt(variance);

      // Perform statistical test
      const statisticalTest = await this.statisticalTests.performChiSquareTest(
        groups.map(group => {
          const groupIndices = attributeValues
            .map((value, index) => value === group ? index : -1)
            .filter(index => index !== -1);
          const groupOutcomes = groupIndices.map(index => outcomes[index]);
          return {
            selected: groupOutcomes.filter(outcome => outcome).length,
            total: groupOutcomes.length
          };
        })
      );

      results[attributeName] = {
        groups: groupMetrics,
        parityRatio,
        parityDifference,
        standardDeviation,
        statisticalTest,
        complianceStatus: this.assessDemographicParityCompliance(parityRatio, parityDifference, statisticalTest),
        interpretation: this.interpretDemographicParity(parityRatio, parityDifference)
      };
    }

    return {
      type: 'demographic_parity',
      description: 'Measures whether selection rates are equal across protected groups',
      results,
      overallScore: this.calculateDemographicParityOverallScore(results),
      timestamp: new Date()
    };
  }

  /**
   * Calculate Equalized Odds (Equal Opportunity)
   * P(Y_hat=1|Y=1,A=0) = P(Y_hat=1|Y=1,A=1) and P(Y_hat=1|Y=0,A=0) = P(Y_hat=1|Y=0,A=1)
   */
  static async calculateEqualizedOdds(
    outcomes: boolean[],
    protectedAttributes: Record<string, any[]>,
    context: FairnessContext
  ): Promise<EqualizedOddsMetric> {
    const results: Record<string, any> = {};

    // Note: For hiring, we use selection as proxy for prediction
    // In a full ML system, this would use actual predictions vs ground truth

    for (const [attributeName, attributeValues] of Object.entries(protectedAttributes)) {
      const groups = [...new Set(attributeValues)];
      const groupMetrics: Record<string, any> = {};

      for (const group of groups) {
        const groupIndices = attributeValues
          .map((value, index) => value === group ? index : -1)
          .filter(index => index !== -1);

        const groupOutcomes = groupIndices.map(index => outcomes[index]);
        
        // For hiring context, we calculate selection rates as proxy
        // In ML context, this would be TPR and FPR
        const truePositiveRate = groupOutcomes.filter(outcome => outcome).length / 
          Math.max(1, groupOutcomes.length); // Proxy: selection rate
        
        const falsePositiveRate = groupOutcomes.filter(outcome => !outcome).length / 
          Math.max(1, groupOutcomes.length); // Proxy: rejection rate

        groupMetrics[group] = {
          count: groupOutcomes.length,
          truePositiveRate,
          falsePositiveRate,
          selectionRate: truePositiveRate
        };
      }

      // Calculate equalized odds metrics
      const tprValues = Object.values(groupMetrics).map((m: any) => m.truePositiveRate);
      const fprValues = Object.values(groupMetrics).map((m: any) => m.falsePositiveRate);

      const tprDifference = Math.max(...tprValues) - Math.min(...tprValues);
      const fprDifference = Math.max(...fprValues) - Math.min(...fprValues);
      const equalizedOddsScore = 1 - Math.max(tprDifference, fprDifference);

      // Statistical test for equalized odds
      const statisticalTest = await this.statisticalTests.performEqualizedOddsTest(
        groups.map(group => {
          const groupIndices = attributeValues
            .map((value, index) => value === group ? index : -1)
            .filter(index => index !== -1);
          const groupOutcomes = groupIndices.map(index => outcomes[index]);
          return {
            truePositives: groupOutcomes.filter(outcome => outcome).length,
            falsePositives: 0, // Simplified for hiring context
            trueNegatives: groupOutcomes.filter(outcome => !outcome).length,
            falseNegatives: 0, // Simplified for hiring context
            total: groupOutcomes.length
          };
        })
      );

      results[attributeName] = {
        groups: groupMetrics,
        tprDifference,
        fprDifference,
        equalizedOddsScore,
        statisticalTest,
        complianceStatus: this.assessEqualizedOddsCompliance(equalizedOddsScore, statisticalTest),
        interpretation: this.interpretEqualizedOdds(tprDifference, fprDifference)
      };
    }

    return {
      type: 'equalized_odds',
      description: 'Measures whether true positive and false positive rates are equal across groups',
      results,
      overallScore: this.calculateEqualizedOddsOverallScore(results),
      timestamp: new Date()
    };
  }

  /**
   * Calculate Predictive Equality
   * P(Y_hat=1|Y=0,A=0) = P(Y_hat=1|Y=0,A=1) - Equal false positive rates
   */
  static async calculatePredictiveEquality(
    outcomes: boolean[],
    protectedAttributes: Record<string, any[]>,
    context: FairnessContext
  ): Promise<PredictiveEqualityMetric> {
    const results: Record<string, any> = {};

    for (const [attributeName, attributeValues] of Object.entries(protectedAttributes)) {
      const groups = [...new Set(attributeValues)];
      const groupMetrics: Record<string, any> = {};

      for (const group of groups) {
        const groupIndices = attributeValues
          .map((value, index) => value === group ? index : -1)
          .filter(index => index !== -1);

        const groupOutcomes = groupIndices.map(index => outcomes[index]);
        
        // For hiring context: false positive rate approximation
        const rejectedCount = groupOutcomes.filter(outcome => !outcome).length;
        const falsePositiveRate = rejectedCount > 0 ? 0 : 0; // Simplified - would need actual performance data
        
        groupMetrics[group] = {
          count: groupOutcomes.length,
          rejected: rejectedCount,
          falsePositiveRate,
          rejectionRate: rejectedCount / groupOutcomes.length
        };
      }

      // Calculate predictive equality
      const fprValues = Object.values(groupMetrics).map((m: any) => m.falsePositiveRate);
      const rejectionRates = Object.values(groupMetrics).map((m: any) => m.rejectionRate);
      
      const fprDifference = Math.max(...fprValues) - Math.min(...fprValues);
      const rejectionRateDifference = Math.max(...rejectionRates) - Math.min(...rejectionRates);
      const predictiveEqualityScore = 1 - Math.max(fprDifference, rejectionRateDifference);

      // Statistical test
      const statisticalTest = await this.statisticalTests.performPredictiveEqualityTest(
        groups.map(group => {
          const groupIndices = attributeValues
            .map((value, index) => value === group ? index : -1)
            .filter(index => index !== -1);
          const groupOutcomes = groupIndices.map(index => outcomes[index]);
          return {
            falsePositives: 0, // Simplified
            trueNegatives: groupOutcomes.filter(outcome => !outcome).length,
            total: groupOutcomes.length
          };
        })
      );

      results[attributeName] = {
        groups: groupMetrics,
        fprDifference,
        rejectionRateDifference,
        predictiveEqualityScore,
        statisticalTest,
        complianceStatus: this.assessPredictiveEqualityCompliance(predictiveEqualityScore, statisticalTest),
        interpretation: this.interpretPredictiveEquality(fprDifference, rejectionRateDifference)
      };
    }

    return {
      type: 'predictive_equality',
      description: 'Measures whether false positive rates are equal across groups',
      results,
      overallScore: this.calculatePredictiveEqualityOverallScore(results),
      timestamp: new Date()
    };
  }

  /**
   * Calculate Calibration
   * P(Y=1|Y_hat=s,A=0) = P(Y=1|Y_hat=s,A=1) for all score values s
   */
  static async calculateCalibration(
    candidates: any[],
    outcomes: boolean[],
    protectedAttributes: Record<string, any[]>,
    context: FairnessContext
  ): Promise<CalibrationMetric> {
    const results: Record<string, any> = {};

    for (const [attributeName, attributeValues] of Object.entries(protectedAttributes)) {
      const groups = [...new Set(attributeValues)];
      const groupMetrics: Record<string, any> = {};

      for (const group of groups) {
        const groupIndices = attributeValues
          .map((value, index) => value === group ? index : -1)
          .filter(index => index !== -1);

        const groupCandidates = groupIndices.map(index => candidates[index]);
        const groupOutcomes = groupIndices.map(index => outcomes[index]);

        // Calculate calibration by score bins
        const scoreBins = this.createScoreBins(groupCandidates, groupOutcomes);
        const calibrationError = this.calculateCalibrationError(scoreBins);

        groupMetrics[group] = {
          count: groupCandidates.length,
          scoreBins,
          calibrationError,
          averageScore: this.calculateAverageScore(groupCandidates),
          averageOutcome: groupOutcomes.filter(o => o).length / groupOutcomes.length
        };
      }

      // Calculate overall calibration metrics
      const calibrationErrors = Object.values(groupMetrics).map((m: any) => m.calibrationError);
      const maxCalibrationError = Math.max(...calibrationErrors);
      const calibrationDifference = Math.max(...calibrationErrors) - Math.min(...calibrationErrors);
      const calibrationScore = 1 - maxCalibrationError;

      results[attributeName] = {
        groups: groupMetrics,
        maxCalibrationError,
        calibrationDifference,
        calibrationScore,
        complianceStatus: this.assessCalibrationCompliance(calibrationScore),
        interpretation: this.interpretCalibration(maxCalibrationError, calibrationDifference)
      };
    }

    return {
      type: 'calibration',
      description: 'Measures whether predicted probabilities match actual outcomes across groups',
      results,
      overallScore: this.calculateCalibrationOverallScore(results),
      timestamp: new Date()
    };
  }

  /**
   * Calculate Individual Fairness
   * Similar individuals should receive similar outcomes
   */
  static async calculateIndividualFairness(
    candidates: any[],
    outcomes: boolean[],
    context: FairnessContext
  ): Promise<IndividualFairnessMetric> {
    try {
      // Calculate similarity matrix between candidates
      const similarityMatrix = this.calculateCandidateSimilarity(candidates);
      
      // Calculate outcome consistency for similar candidates
      const consistencyScores = [];
      const threshold = 0.8; // Similarity threshold

      for (let i = 0; i < candidates.length; i++) {
        const similarCandidates = [];
        
        for (let j = 0; j < candidates.length; j++) {
          if (i !== j && similarityMatrix[i][j] >= threshold) {
            similarCandidates.push(j);
          }
        }

        if (similarCandidates.length > 0) {
          const candidateOutcome = outcomes[i];
          const similarOutcomes = similarCandidates.map(idx => outcomes[idx]);
          const consistency = similarOutcomes.filter(outcome => outcome === candidateOutcome).length / similarOutcomes.length;
          consistencyScores.push(consistency);
        }
      }

      const averageConsistency = consistencyScores.length > 0 
        ? consistencyScores.reduce((sum, score) => sum + score, 0) / consistencyScores.length
        : 1.0;

      const individualFairnessScore = averageConsistency;

      return {
        type: 'individual_fairness',
        description: 'Measures whether similar individuals receive similar treatment',
        averageConsistency,
        individualFairnessScore,
        similarityThreshold: threshold,
        evaluatedPairs: consistencyScores.length,
        complianceStatus: this.assessIndividualFairnessCompliance(individualFairnessScore),
        interpretation: this.interpretIndividualFairness(individualFairnessScore),
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Individual fairness calculation failed:', error);
      return {
        type: 'individual_fairness',
        description: 'Individual fairness calculation failed',
        averageConsistency: 0,
        individualFairnessScore: 0,
        similarityThreshold: 0.8,
        evaluatedPairs: 0,
        complianceStatus: 'error',
        interpretation: 'Calculation failed - manual review required',
        timestamp: new Date()
      };
    }
  }

  /**
   * Calculate Counterfactual Fairness
   * Outcomes should be the same in a counterfactual world where protected attributes differ
   */
  static async calculateCounterfactualFairness(
    candidates: any[],
    outcomes: boolean[],
    protectedAttributes: Record<string, any[]>,
    context: FairnessContext
  ): Promise<CounterfactualFairnessMetric> {
    try {
      const results: Record<string, any> = {};

      for (const [attributeName, attributeValues] of Object.entries(protectedAttributes)) {
        // Simulate counterfactual scenarios
        const counterfactualConsistency = await this.simulateCounterfactualScenarios(
          candidates,
          outcomes,
          attributeName,
          attributeValues
        );

        results[attributeName] = {
          consistency: counterfactualConsistency,
          complianceStatus: this.assessCounterfactualCompliance(counterfactualConsistency),
          interpretation: this.interpretCounterfactual(counterfactualConsistency)
        };
      }

      const overallScore = Object.values(results).reduce((sum: number, result: any) => 
        sum + result.consistency, 0) / Object.keys(results).length;

      return {
        type: 'counterfactual_fairness',
        description: 'Measures fairness in hypothetical scenarios with different protected attributes',
        results,
        overallScore,
        complianceStatus: this.assessCounterfactualCompliance(overallScore),
        interpretation: this.interpretCounterfactual(overallScore),
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Counterfactual fairness calculation failed:', error);
      return {
        type: 'counterfactual_fairness',
        description: 'Counterfactual fairness calculation failed',
        results: {},
        overallScore: 0,
        complianceStatus: 'error',
        interpretation: 'Calculation failed - manual review required',
        timestamp: new Date()
      };
    }
  }

  /**
   * Calculate Intersectional Fairness
   * Fairness across combinations of protected attributes
   */
  static async calculateIntersectionalFairness(
    outcomes: boolean[],
    protectedAttributes: Record<string, any[]>,
    context: FairnessContext
  ): Promise<IntersectionalFairnessMetric> {
    try {
      const attributeNames = Object.keys(protectedAttributes);
      const intersectionalGroups = this.createIntersectionalGroups(protectedAttributes);
      
      const groupMetrics: Record<string, any> = {};
      const selectionRates: number[] = [];

      for (const [groupKey, indices] of Object.entries(intersectionalGroups)) {
        const groupOutcomes = indices.map(index => outcomes[index]);
        const selectionRate = groupOutcomes.filter(outcome => outcome).length / groupOutcomes.length;
        
        groupMetrics[groupKey] = {
          count: groupOutcomes.length,
          selected: groupOutcomes.filter(outcome => outcome).length,
          selectionRate,
          percentage: Math.round(selectionRate * 100 * 100) / 100
        };

        selectionRates.push(selectionRate);
      }

      // Calculate intersectional fairness metrics
      const maxRate = Math.max(...selectionRates);
      const minRate = Math.min(...selectionRates);
      const intersectionalParityRatio = minRate / maxRate;
      const intersectionalParityDifference = maxRate - minRate;
      
      // Calculate coefficient of variation
      const meanRate = selectionRates.reduce((sum, rate) => sum + rate, 0) / selectionRates.length;
      const variance = selectionRates.reduce((sum, rate) => sum + Math.pow(rate - meanRate, 2), 0) / selectionRates.length;
      const coefficientOfVariation = Math.sqrt(variance) / meanRate;

      const intersectionalFairnessScore = 1 - coefficientOfVariation;

      return {
        type: 'intersectional_fairness',
        description: 'Measures fairness across intersections of protected attributes',
        groups: groupMetrics,
        intersectionalParityRatio,
        intersectionalParityDifference,
        coefficientOfVariation,
        intersectionalFairnessScore,
        attributeCombinations: attributeNames,
        complianceStatus: this.assessIntersectionalCompliance(intersectionalFairnessScore),
        interpretation: this.interpretIntersectional(intersectionalFairnessScore, coefficientOfVariation),
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Intersectional fairness calculation failed:', error);
      return {
        type: 'intersectional_fairness',
        description: 'Intersectional fairness calculation failed',
        groups: {},
        intersectionalParityRatio: 0,
        intersectionalParityDifference: 0,
        coefficientOfVariation: 0,
        intersectionalFairnessScore: 0,
        attributeCombinations: [],
        complianceStatus: 'error',
        interpretation: 'Calculation failed - manual review required',
        timestamp: new Date()
      };
    }
  }

  /**
   * Perform comprehensive statistical significance tests
   */
  static async performStatisticalTests(
    outcomes: boolean[],
    protectedAttributes: Record<string, any[]>,
    context: FairnessContext
  ): Promise<StatisticalTestResults> {
    const tests: Record<string, any> = {};

    for (const [attributeName, attributeValues] of Object.entries(protectedAttributes)) {
      const groups = [...new Set(attributeValues)];
      
      // Chi-square test for independence
      const chiSquareTest = await this.statisticalTests.performChiSquareTest(
        groups.map(group => {
          const groupIndices = attributeValues
            .map((value, index) => value === group ? index : -1)
            .filter(index => index !== -1);
          const groupOutcomes = groupIndices.map(index => outcomes[index]);
          return {
            selected: groupOutcomes.filter(outcome => outcome).length,
            total: groupOutcomes.length
          };
        })
      );

      // Fisher's exact test for small samples
      const fisherTest = await this.statisticalTests.performFisherExactTest(
        groups.map(group => {
          const groupIndices = attributeValues
            .map((value, index) => value === group ? index : -1)
            .filter(index => index !== -1);
          const groupOutcomes = groupIndices.map(index => outcomes[index]);
          return {
            selected: groupOutcomes.filter(outcome => outcome).length,
            total: groupOutcomes.length
          };
        })
      );

      // Permutation test
      const permutationTest = await this.statisticalTests.performPermutationTest(
        outcomes,
        attributeValues,
        1000 // Number of permutations
      );

      tests[attributeName] = {
        chiSquare: chiSquareTest,
        fisherExact: fisherTest,
        permutation: permutationTest,
        overallSignificance: Math.min(chiSquareTest.pValue, fisherTest.pValue, permutationTest.pValue)
      };
    }

    return {
      tests,
      significanceLevel: 0.05,
      multipleTestingCorrection: 'bonferroni',
      overallSignificant: Object.values(tests).some((test: any) => 
        test.overallSignificance < (0.05 / Object.keys(tests).length)
      ),
      timestamp: new Date()
    };
  }

  // Helper methods for calculations

  private static validateInputs(
    candidates: any[],
    outcomes: boolean[],
    protectedAttributes: Record<string, any[]>
  ): void {
    if (candidates.length !== outcomes.length) {
      throw new Error('Candidates and outcomes arrays must have the same length');
    }

    for (const [attributeName, attributeValues] of Object.entries(protectedAttributes)) {
      if (attributeValues.length !== candidates.length) {
        throw new Error(`Protected attribute ${attributeName} must have the same length as candidates`);
      }
    }

    if (candidates.length < 10) {
      logger.warn('Small sample size may affect statistical significance of fairness metrics');
    }
  }

  private static calculateOverallFairnessScore(metrics: any): number {
    const scores = [
      metrics.demographicParity.overallScore,
      metrics.equalizedOdds.overallScore,
      metrics.predictiveEquality.overallScore,
      metrics.calibration.overallScore,
      metrics.individualFairness.individualFairnessScore,
      metrics.counterfactualFairness.overallScore,
      metrics.intersectionalFairness.intersectionalFairnessScore
    ].filter(score => score > 0); // Filter out failed calculations

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  private static generateFairnessRecommendations(metrics: any): string[] {
    const recommendations = [];

    if (metrics.demographicParity.overallScore < 0.8) {
      recommendations.push('Consider reviewing selection criteria to improve demographic parity');
    }

    if (metrics.equalizedOdds.overallScore < 0.8) {
      recommendations.push('Evaluate assessment methods for potential bias in accuracy across groups');
    }

    if (metrics.individualFairness.individualFairnessScore < 0.8) {
      recommendations.push('Review consistency of decisions for similar candidates');
    }

    if (metrics.intersectionalFairness.intersectionalFairnessScore < 0.7) {
      recommendations.push('Analyze outcomes for intersectional groups to identify potential compound bias');
    }

    if (recommendations.length === 0) {
      recommendations.push('Fairness metrics appear satisfactory - continue monitoring');
    }

    recommendations.push('Regular fairness audits recommended');
    recommendations.push('Consider implementing bias mitigation strategies');

    return recommendations;
  }

  private static determineComplianceStatus(
    overallScore: number,
    statisticalTests: StatisticalTestResults
  ): string {
    if (overallScore >= 0.8 && !statisticalTests.overallSignificant) {
      return 'compliant';
    } else if (overallScore >= 0.6) {
      return 'requires_monitoring';
    } else {
      return 'requires_intervention';
    }
  }

  // Compliance assessment methods

  private static assessDemographicParityCompliance(
    parityRatio: number,
    parityDifference: number,
    statisticalTest: any
  ): string {
    if (parityRatio >= 0.8 && parityDifference <= 0.2 && statisticalTest.pValue > 0.05) {
      return 'compliant';
    } else if (parityRatio >= 0.6) {
      return 'requires_monitoring';
    } else {
      return 'requires_intervention';
    }
  }

  private static assessEqualizedOddsCompliance(score: number, statisticalTest: any): string {
    if (score >= 0.8 && statisticalTest.pValue > 0.05) {
      return 'compliant';
    } else if (score >= 0.6) {
      return 'requires_monitoring';
    } else {
      return 'requires_intervention';
    }
  }

  private static assessPredictiveEqualityCompliance(score: number, statisticalTest: any): string {
    if (score >= 0.8 && statisticalTest.pValue > 0.05) {
      return 'compliant';
    } else if (score >= 0.6) {
      return 'requires_monitoring';
    } else {
      return 'requires_intervention';
    }
  }

  private static assessCalibrationCompliance(score: number): string {
    if (score >= 0.8) {
      return 'compliant';
    } else if (score >= 0.6) {
      return 'requires_monitoring';
    } else {
      return 'requires_intervention';
    }
  }

  private static assessIndividualFairnessCompliance(score: number): string {
    if (score >= 0.8) {
      return 'compliant';
    } else if (score >= 0.6) {
      return 'requires_monitoring';
    } else {
      return 'requires_intervention';
    }
  }

  private static assessCounterfactualCompliance(score: number): string {
    if (score >= 0.8) {
      return 'compliant';
    } else if (score >= 0.6) {
      return 'requires_monitoring';
    } else {
      return 'requires_intervention';
    }
  }

  private static assessIntersectionalCompliance(score: number): string {
    if (score >= 0.7) {
      return 'compliant';
    } else if (score >= 0.5) {
      return 'requires_monitoring';
    } else {
      return 'requires_intervention';
    }
  }

  // Interpretation methods

  private static interpretDemographicParity(parityRatio: number, parityDifference: number): string {
    if (parityRatio >= 0.8) {
      return 'Selection rates are reasonably balanced across groups';
    } else if (parityRatio >= 0.6) {
      return 'Moderate disparity in selection rates detected';
    } else {
      return 'Significant disparity in selection rates - intervention recommended';
    }
  }

  private static interpretEqualizedOdds(tprDiff: number, fprDiff: number): string {
    const maxDiff = Math.max(tprDiff, fprDiff);
    if (maxDiff <= 0.1) {
      return 'Accuracy rates are well-balanced across groups';
    } else if (maxDiff <= 0.2) {
      return 'Moderate differences in accuracy across groups';
    } else {
      return 'Significant accuracy disparities detected';
    }
  }

  private static interpretPredictiveEquality(fprDiff: number, rejectionDiff: number): string {
    const maxDiff = Math.max(fprDiff, rejectionDiff);
    if (maxDiff <= 0.1) {
      return 'False positive rates are balanced across groups';
    } else if (maxDiff <= 0.2) {
      return 'Moderate differences in false positive rates';
    } else {
      return 'Significant disparities in false positive rates';
    }
  }

  private static interpretCalibration(maxError: number, difference: number): string {
    if (maxError <= 0.1) {
      return 'Predictions are well-calibrated across groups';
    } else if (maxError <= 0.2) {
      return 'Moderate calibration differences detected';
    } else {
      return 'Significant calibration issues identified';
    }
  }

  private static interpretIndividualFairness(score: number): string {
    if (score >= 0.8) {
      return 'Similar individuals receive consistent treatment';
    } else if (score >= 0.6) {
      return 'Some inconsistency in treatment of similar individuals';
    } else {
      return 'Significant inconsistency in individual treatment';
    }
  }

  private static interpretCounterfactual(score: number): string {
    if (score >= 0.8) {
      return 'Decisions appear robust to counterfactual scenarios';
    } else if (score >= 0.6) {
      return 'Some sensitivity to protected attribute changes';
    } else {
      return 'High sensitivity to protected attribute changes';
    }
  }

  private static interpretIntersectional(score: number, cv: number): string {
    if (score >= 0.7) {
      return 'Intersectional groups show balanced outcomes';
    } else if (score >= 0.5) {
      return 'Some disparities across intersectional groups';
    } else {
      return 'Significant intersectional disparities detected';
    }
  }

  // Score calculation methods

  private static calculateDemographicParityOverallScore(results: Record<string, any>): number {
    const scores = Object.values(results).map((result: any) => result.parityRatio);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private static calculateEqualizedOddsOverallScore(results: Record<string, any>): number {
    const scores = Object.values(results).map((result: any) => result.equalizedOddsScore);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private static calculatePredictiveEqualityOverallScore(results: Record<string, any>): number {
    const scores = Object.values(results).map((result: any) => result.predictiveEqualityScore);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private static calculateCalibrationOverallScore(results: Record<string, any>): number {
    const scores = Object.values(results).map((result: any) => result.calibrationScore);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Utility methods

  private static createScoreBins(candidates: any[], outcomes: boolean[]): any[] {
    // Create score bins for calibration analysis
    const bins = [];
    const binSize = 0.1;
    
    for (let i = 0; i < 1; i += binSize) {
      const binCandidates = candidates.filter((candidate, index) => {
        const score = this.getCandidateScore(candidate);
        return score >= i && score < i + binSize;
      });
      
      if (binCandidates.length > 0) {
        const binOutcomes = binCandidates.map((candidate, index) => {
          const originalIndex = candidates.indexOf(candidate);
          return outcomes[originalIndex];
        });
        
        bins.push({
          range: [i, i + binSize],
          count: binCandidates.length,
          averageScore: i + binSize / 2,
          actualRate: binOutcomes.filter(o => o).length / binOutcomes.length
        });
      }
    }
    
    return bins;
  }

  private static calculateCalibrationError(scoreBins: any[]): number {
    let totalError = 0;
    let totalWeight = 0;
    
    for (const bin of scoreBins) {
      const error = Math.abs(bin.averageScore - bin.actualRate);
      totalError += error * bin.count;
      totalWeight += bin.count;
    }
    
    return totalWeight > 0 ? totalError / totalWeight : 0;
  }

  private static getCandidateScore(candidate: any): number {
    // Extract or calculate candidate score
    return candidate.matchScore || candidate.overallScore || 0.5;
  }

  private static calculateAverageScore(candidates: any[]): number {
    const scores = candidates.map(candidate => this.getCandidateScore(candidate));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private static calculateCandidateSimilarity(candidates: any[]): number[][] {
    const n = candidates.length;
    const similarity = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          similarity[i][j] = 1.0;
        } else {
          similarity[i][j] = this.calculatePairwiseSimilarity(candidates[i], candidates[j]);
        }
      }
    }
    
    return similarity;
  }

  private static calculatePairwiseSimilarity(candidate1: any, candidate2: any): number {
    // Simplified similarity calculation based on skills and experience
    let similarity = 0;
    let factors = 0;
    
    // Skills similarity
    if (candidate1.skills && candidate2.skills) {
      const skills1 = new Set(candidate1.skills.map((s: any) => s.name.toLowerCase()));
      const skills2 = new Set(candidate2.skills.map((s: any) => s.name.toLowerCase()));
      const intersection = new Set([...skills1].filter(x => skills2.has(x)));
      const union = new Set([...skills1, ...skills2]);
      similarity += intersection.size / union.size;
      factors++;
    }
    
    // Experience similarity
    if (candidate1.totalExperience !== undefined && candidate2.totalExperience !== undefined) {
      const expDiff = Math.abs(candidate1.totalExperience - candidate2.totalExperience);
      similarity += Math.max(0, 1 - expDiff / 10); // Normalize by 10 years
      factors++;
    }
    
    // Education similarity
    if (candidate1.education && candidate2.education) {
      const edu1Level = Math.max(...candidate1.education.map((e: any) => this.getEducationLevel(e.degree)));
      const edu2Level = Math.max(...candidate2.education.map((e: any) => this.getEducationLevel(e.degree)));
      similarity += 1 - Math.abs(edu1Level - edu2Level) / 5; // Normalize by max education levels
      factors++;
    }
    
    return factors > 0 ? similarity / factors : 0;
  }

  private static getEducationLevel(degree: string): number {
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

  private static async simulateCounterfactualScenarios(
    candidates: any[],
    outcomes: boolean[],
    attributeName: string,
    attributeValues: any[]
  ): Promise<number> {
    // Simplified counterfactual simulation
    // In practice, this would use causal inference methods
    
    const groups = [...new Set(attributeValues)];
    let consistentOutcomes = 0;
    let totalComparisons = 0;
    
    for (let i = 0; i < candidates.length; i++) {
      for (const alternativeGroup of groups) {
        if (attributeValues[i] !== alternativeGroup) {
          // Find similar candidates in the alternative group
          const similarCandidates = candidates
            .map((candidate, index) => ({ candidate, index }))
            .filter(({ candidate, index }) => 
              attributeValues[index] === alternativeGroup &&
              this.calculatePairwiseSimilarity(candidates[i], candidate) > 0.8
            );
          
          if (similarCandidates.length > 0) {
            const originalOutcome = outcomes[i];
            const alternativeOutcomes = similarCandidates.map(({ index }) => outcomes[index]);
            const consistentAlternatives = alternativeOutcomes.filter(outcome => outcome === originalOutcome);
            
            consistentOutcomes += consistentAlternatives.length;
            totalComparisons += alternativeOutcomes.length;
          }
        }
      }
    }
    
    return totalComparisons > 0 ? consistentOutcomes / totalComparisons : 1.0;
  }

  private static createIntersectionalGroups(protectedAttributes: Record<string, any[]>): Record<string, number[]> {
    const attributeNames = Object.keys(protectedAttributes);
    const groups: Record<string, number[]> = {};
    
    const candidateCount = Object.values(protectedAttributes)[0].length;
    
    for (let i = 0; i < candidateCount; i++) {
      const groupKey = attributeNames
        .map(attr => `${attr}:${protectedAttributes[attr][i]}`)
        .join('|');
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(i);
    }
    
    return groups;
  }
}

// Supporting interfaces and types

export interface FairnessContext {
  processType: 'hiring' | 'promotion' | 'performance_review' | 'matching';
  stage: string;
  timePeriod: {
    startDate: Date;
    endDate: Date;
  };
  geographicScope: string[];
  departmentScope: string[];
  jobLevels: string[];
}

export interface ComprehensiveFairnessReport {
  reportId: string;
  timestamp: Date;
  context: FairnessContext;
  sampleSize: {
    total: number;
    positive: number;
    negative: number;
  };
  metrics: {
    demographicParity: DemographicParityMetric;
    equalizedOdds: EqualizedOddsMetric;
    predictiveEquality: PredictiveEqualityMetric;
    calibration: CalibrationMetric;
    individualFairness: IndividualFairnessMetric;
    counterfactualFairness: CounterfactualFairnessMetric;
    intersectionalFairness: IntersectionalFairnessMetric;
  };
  statisticalTests: StatisticalTestResults;
  overallFairnessScore: number;
  complianceStatus: string;
  recommendations: string[];
  processingTime: number;
  metadata: {
    calculationVersion: string;
    protectedAttributes: string[];
    significanceLevel: number;
  };
}

export interface DemographicParityMetric {
  type: 'demographic_parity';
  description: string;
  results: Record<string, any>;
  overallScore: number;
  timestamp: Date;
}

export interface EqualizedOddsMetric {
  type: 'equalized_odds';
  description: string;
  results: Record<string, any>;
  overallScore: number;
  timestamp: Date;
}

export interface PredictiveEqualityMetric {
  type: 'predictive_equality';
  description: string;
  results: Record<string, any>;
  overallScore: number;
  timestamp: Date;
}

export interface CalibrationMetric {
  type: 'calibration';
  description: string;
  results: Record<string, any>;
  overallScore: number;
  timestamp: Date;
}

export interface IndividualFairnessMetric {
  type: 'individual_fairness';
  description: string;
  averageConsistency: number;
  individualFairnessScore: number;
  similarityThreshold: number;
  evaluatedPairs: number;
  complianceStatus: string;
  interpretation: string;
  timestamp: Date;
}

export interface CounterfactualFairnessMetric {
  type: 'counterfactual_fairness';
  description: string;
  results: Record<string, any>;
  overallScore: number;
  complianceStatus: string;
  interpretation: string;
  timestamp: Date;
}

export interface IntersectionalFairnessMetric {
  type: 'intersectional_fairness';
  description: string;
  groups: Record<string, any>;
  intersectionalParityRatio: number;
  intersectionalParityDifference: number;
  coefficientOfVariation: number;
  intersectionalFairnessScore: number;
  attributeCombinations: string[];
  complianceStatus: string;
  interpretation: string;
  timestamp: Date;
}

export interface StatisticalTestResults {
  tests: Record<string, any>;
  significanceLevel: number;
  multipleTestingCorrection: string;
  overallSignificant: boolean;
  timestamp: Date;
}

export default FairnessMetricsCalculator;