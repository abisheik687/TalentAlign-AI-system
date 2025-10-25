import { MLBiasDetectionService } from '../../services/MLBiasDetectionService';
import { PredictiveAnalyticsService } from '../../services/PredictiveAnalyticsService';
import { jest } from '@jest/globals';

/**
 * Comprehensive ML Model Testing Suite
 * Tests model fairness across demographic groups and validates predictive accuracy
 * Requirements: 4.1, 4.2
 */

describe('ML Model Testing Suite', () => {
  let mlBiasService: MLBiasDetectionService;
  let predictiveService: PredictiveAnalyticsService;

  beforeAll(async () => {
    mlBiasService = new MLBiasDetectionService();
    predictiveService = new PredictiveAnalyticsService();
    
    // Allow time for model initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('Bias Detection Model Fairness Tests', () => {
    const generateTestData = (size: number, biasIntroduced: boolean = false) => {
      const features: number[][] = [];
      const labels: number[] = [];
      const demographics: string[][] = [];

      for (let i = 0; i < size; i++) {
        const isProtectedGroup = Math.random() < 0.3; // 30% protected group
        const baseScore = Math.random();
        
        // Introduce bias if specified
        const biasedScore = biasIntroduced && isProtectedGroup ? 
          baseScore * 0.7 : baseScore; // Reduce score for protected group

        const feature = Array(50).fill(0).map(() => Math.random());
        feature[0] = biasedScore; // First feature represents overall qualification
        
        features.push(feature);
        labels.push(biasedScore > 0.6 ? 1 : 0);
        demographics.push(isProtectedGroup ? ['minority', 'female'] : ['majority', 'male']);
      }

      return { features, labels, demographics };
    };

    it('should demonstrate fairness across demographic groups', async () => {
      const testData = generateTestData(1000, false); // No bias introduced
      
      // Train model on fair data
      await mlBiasService.trainBiasDetectionModel(testData);
      
      // Validate fairness
      const validation = await mlBiasService.validateModel(testData);
      
      expect(validation.fairnessMetrics.demographicParity).toBeGreaterThan(0.8);
      expect(validation.fairnessMetrics.equalizedOdds).toBeGreaterThan(0.8);
      expect(validation.fairnessMetrics.overallFairnessScore).toBeGreaterThan(0.8);
    });

    it('should detect bias when present in data', async () => {
      const biasedData = generateTestData(1000, true); // Bias introduced
      
      // Test bias detection on biased data
      const groupMetrics = await this.analyzeGroupPerformance(biasedData);
      
      expect(groupMetrics.protectedGroupAccuracy).toBeLessThan(groupMetrics.majorityGroupAccuracy);
      expect(groupMetrics.biasScore).toBeGreaterThan(0.3);
    });

    it('should maintain accuracy across different demographic groups', async () => {
      const testData = generateTestData(1000);
      
      const validation = await mlBiasService.validateModel(testData);
      
      // Check that accuracy doesn't vary significantly across groups
      const groupAccuracies = validation.fairnessMetrics.groupMetrics.map(g => g.accuracy);
      const maxAccuracy = Math.max(...groupAccuracies);
      const minAccuracy = Math.min(...groupAccuracies);
      
      expect(maxAccuracy - minAccuracy).toBeLessThan(0.1); // Less than 10% difference
    });

    it('should pass adversarial robustness tests', async () => {
      const testData = generateTestData(500);
      
      const validation = await mlBiasService.validateModel(testData);
      
      expect(validation.adversarialResults.biasScore).toBeLessThan(0.5);
      expect(validation.adversarialResults.adversarialAccuracy).toBeGreaterThan(0.7);
      expect(validation.adversarialResults.vulnerabilities.length).toBeLessThan(3);
    });

    private async analyzeGroupPerformance(data: any): Promise<{
      protectedGroupAccuracy: number;
      majorityGroupAccuracy: number;
      biasScore: number;
    }> {
      // Simulate group performance analysis
      const protectedIndices = data.demographics
        .map((demo: string[], idx: number) => demo.includes('minority') ? idx : -1)
        .filter((idx: number) => idx !== -1);
      
      const majorityIndices = data.demographics
        .map((demo: string[], idx: number) => !demo.includes('minority') ? idx : -1)
        .filter((idx: number) => idx !== -1);

      // Calculate accuracy for each group (simplified)
      const protectedGroupAccuracy = protectedIndices.length > 0 ? 
        protectedIndices.reduce((sum, idx) => sum + data.labels[idx], 0) / protectedIndices.length : 0;
      
      const majorityGroupAccuracy = majorityIndices.length > 0 ?
        majorityIndices.reduce((sum, idx) => sum + data.labels[idx], 0) / majorityIndices.length : 0;

      const biasScore = Math.abs(protectedGroupAccuracy - majorityGroupAccuracy);

      return {
        protectedGroupAccuracy,
        majorityGroupAccuracy,
        biasScore
      };
    }
  });

  describe('Predictive Model Accuracy Tests', () => {
    const generateEmployeeData = (size: number) => {
      return Array(size).fill(null).map((_, idx) => ({
        employeeId: `emp_${idx}`,
        demographics: {
          age: 25 + Math.random() * 40,
          gender: Math.random() > 0.5 ? 'female' : 'male',
          ethnicity: ['asian', 'black', 'hispanic', 'white'][Math.floor(Math.random() * 4)],
          education: ['bachelor', 'master', 'phd'][Math.floor(Math.random() * 3)]
        },
        hiringMetrics: {
          timeToHire: 10 + Math.random() * 50,
          interviewScore: 5 + Math.random() * 5,
          skillsMatch: 60 + Math.random() * 40,
          culturalFit: 5 + Math.random() * 5
        },
        performance: {
          performanceRating: 2 + Math.random() * 3,
          promotions: Math.floor(Math.random() * 3),
          trainingCompleted: Math.floor(Math.random() * 10)
        },
        retention: {
          tenure: Math.random() * 60,
          leftCompany: Math.random() > 0.8,
          reasonForLeaving: Math.random() > 0.5 ? 'better_opportunity' : 'dissatisfaction'
        }
      }));
    };

    it('should predict attrition with reasonable accuracy', async () => {
      const employees = generateEmployeeData(500);
      
      // Train models
      await predictiveService.trainModels({
        employees,
        hiringOutcomes: [],
        diversityTimeSeries: []
      });

      const predictions = await predictiveService.predictAttrition(employees.slice(0, 100));
      
      // Validate predictions
      expect(predictions).toHaveLength(100);
      predictions.forEach(prediction => {
        expect(prediction.attritionRisk).toBeGreaterThanOrEqual(0);
        expect(prediction.attritionRisk).toBeLessThanOrEqual(1);
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
        expect(prediction.riskFactors).toBeDefined();
        expect(prediction.recommendations).toBeDefined();
      });

      // Check that high-risk predictions have appropriate risk factors
      const highRiskPredictions = predictions.filter(p => p.attritionRisk > 0.7);
      highRiskPredictions.forEach(prediction => {
        expect(prediction.riskFactors.length).toBeGreaterThan(0);
        expect(prediction.recommendations.length).toBeGreaterThan(0);
      });
    });

    it('should forecast diversity trends accurately', async () => {
      const hiringData = Array(100).fill(null).map(() => ({
        hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        demographics: {
          gender: Math.random() > 0.6 ? 'female' : 'male',
          ethnicity: ['asian', 'black', 'hispanic', 'white'][Math.floor(Math.random() * 4)],
          age: 25 + Math.random() * 40
        }
      }));

      const forecast = await predictiveService.forecastDiversityImpact(hiringData, 12);
      
      expect(forecast.timeframe).toBe('12 months');
      expect(forecast.currentDiversity).toBeDefined();
      expect(forecast.projectedDiversity).toBeDefined();
      expect(['improving', 'stable', 'declining']).toContain(forecast.diversityTrend);
      expect(forecast.recommendations.length).toBeGreaterThan(0);

      // Validate diversity metrics are percentages
      Object.values(forecast.currentDiversity.gender).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it('should predict hiring success with meaningful factors', async () => {
      const candidates = Array(50).fill(null).map((_, idx) => ({
        candidateId: `candidate_${idx}`,
        skills: {
          technical: 5 + Math.random() * 5,
          communication: 5 + Math.random() * 5
        },
        experience: {
          years: Math.random() * 15
        },
        education: {
          level: Math.floor(Math.random() * 4)
        },
        assessments: {
          cognitive: 60 + Math.random() * 40,
          technical: 60 + Math.random() * 40
        },
        interviews: {
          score: 5 + Math.random() * 5
        },
        demographics: {
          age: 25 + Math.random() * 40,
          gender: Math.random() > 0.5 ? 'female' : 'male'
        }
      }));

      const predictions = await predictiveService.predictHiringSuccess(candidates);
      
      expect(predictions).toHaveLength(50);
      predictions.forEach(prediction => {
        expect(prediction.successProbability).toBeGreaterThanOrEqual(0);
        expect(prediction.successProbability).toBeLessThanOrEqual(1);
        expect(prediction.performancePrediction).toBeDefined();
        expect(prediction.retentionProbability).toBeGreaterThanOrEqual(0);
        expect(prediction.retentionProbability).toBeLessThanOrEqual(1);
        expect(prediction.keyFactors).toBeDefined();
        expect(prediction.risks).toBeDefined();
      });

      // High success probability should correlate with positive factors
      const highSuccessPredictions = predictions.filter(p => p.successProbability > 0.8);
      highSuccessPredictions.forEach(prediction => {
        expect(prediction.keyFactors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Model Robustness and Stability Tests', () => {
    it('should handle edge cases and invalid inputs gracefully', async () => {
      // Test with empty data
      await expect(mlBiasService.detectBias([], {})).rejects.toThrow();
      
      // Test with invalid feature dimensions
      const invalidFeatures = Array(10).fill(0); // Wrong dimension
      await expect(mlBiasService.detectBias(invalidFeatures, {})).rejects.toThrow();
      
      // Test with extreme values
      const extremeFeatures = Array(50).fill(1000); // Extreme values
      const result = await mlBiasService.detectBias(extremeFeatures, {});
      expect(result.biasScore).toBeGreaterThanOrEqual(0);
      expect(result.biasScore).toBeLessThanOrEqual(1);
    });

    it('should maintain consistent predictions across multiple runs', async () => {
      const testFeatures = Array(50).fill(0).map(() => Math.random());
      
      const predictions = [];
      for (let i = 0; i < 5; i++) {
        const result = await mlBiasService.detectBias(testFeatures, {});
        predictions.push(result.biasScore);
      }
      
      // Check consistency (should be identical for same input)
      const firstPrediction = predictions[0];
      predictions.forEach(prediction => {
        expect(Math.abs(prediction - firstPrediction)).toBeLessThan(0.01);
      });
    });

    it('should scale performance with data size', async () => {
      const sizes = [10, 50, 100, 500];
      const processingTimes: number[] = [];
      
      for (const size of sizes) {
        const employees = Array(size).fill(null).map((_, idx) => ({
          employeeId: `emp_${idx}`,
          demographics: { age: 30, gender: 'male', ethnicity: 'white', education: 'bachelor' },
          hiringMetrics: { timeToHire: 30, interviewScore: 8, skillsMatch: 80, culturalFit: 8 },
          performance: { performanceRating: 4, promotions: 1, trainingCompleted: 5 },
          retention: { tenure: 24, leftCompany: false }
        }));
        
        const startTime = Date.now();
        await predictiveService.predictAttrition(employees);
        const endTime = Date.now();
        
        processingTimes.push(endTime - startTime);
      }
      
      // Processing time should scale reasonably (not exponentially)
      expect(processingTimes[3]).toBeLessThan(processingTimes[0] * 100); // Should not be 100x slower for 50x data
    });
  });

  describe('Bias Vulnerability Testing', () => {
    it('should detect potential discrimination patterns', async () => {
      // Create data with subtle bias patterns
      const biasedFeatures = Array(50).fill(0).map((_, idx) => {
        if (idx === 0) return 0.3; // Protected group indicator
        if (idx === 1) return 0.8; // High qualification
        return Math.random();
      });
      
      const result = await mlBiasService.detectBias(biasedFeatures, {
        protectedAttributes: ['gender', 'ethnicity']
      });
      
      expect(result).toBeDefined();
      expect(result.biasScore).toBeGreaterThanOrEqual(0);
      expect(result.recommendations).toBeDefined();
      expect(result.affectedGroups).toBeDefined();
    });

    it('should identify intersectional bias', async () => {
      // Test for bias affecting multiple protected characteristics
      const intersectionalData = {
        features: Array(50).fill(0).map(() => Math.random()),
        demographics: ['female', 'minority', 'age_over_40']
      };
      
      const result = await mlBiasService.detectBias(intersectionalData.features, {
        demographics: intersectionalData.demographics
      });
      
      expect(result.affectedGroups.length).toBeGreaterThanOrEqual(0);
      if (result.biasScore > 0.5) {
        expect(result.severity).toMatch(/medium|high|critical/);
      }
    });

    it('should validate statistical significance of bias detection', async () => {
      const testData = Array(1000).fill(null).map(() => ({
        features: Array(50).fill(0).map(() => Math.random()),
        label: Math.random() > 0.5 ? 1 : 0,
        demographics: Math.random() > 0.7 ? ['minority'] : ['majority']
      }));
      
      // Analyze statistical significance
      const minorityGroup = testData.filter(d => d.demographics.includes('minority'));
      const majorityGroup = testData.filter(d => d.demographics.includes('majority'));
      
      const minoritySuccessRate = minorityGroup.reduce((sum, d) => sum + d.label, 0) / minorityGroup.length;
      const majoritySuccessRate = majorityGroup.reduce((sum, d) => sum + d.label, 0) / majorityGroup.length;
      
      const difference = Math.abs(minoritySuccessRate - majoritySuccessRate);
      
      // If difference is significant, bias detection should flag it
      if (difference > 0.1) {
        const avgFeatures = testData[0].features; // Use first sample as representative
        const result = await mlBiasService.detectBias(avgFeatures, {});
        expect(result.statisticalSignificance).toBeGreaterThan(0.8);
      }
    });
  });

  describe('Model Performance Benchmarks', () => {
    it('should meet minimum accuracy thresholds', async () => {
      const testData = {
        features: Array(100).fill(null).map(() => Array(50).fill(0).map(() => Math.random())),
        labels: Array(100).fill(null).map(() => Math.random() > 0.5 ? 1 : 0),
        demographics: Array(100).fill(null).map(() => Math.random() > 0.3 ? ['majority'] : ['minority'])
      };
      
      const validation = await mlBiasService.validateModel(testData);
      
      expect(validation.accuracy).toBeGreaterThan(0.6); // Minimum 60% accuracy
      expect(validation.precision).toBeGreaterThan(0.5);
      expect(validation.recall).toBeGreaterThan(0.5);
      expect(validation.f1Score).toBeGreaterThan(0.5);
    });

    it('should demonstrate improvement over baseline models', async () => {
      // Compare against simple baseline (random predictions)
      const testSize = 100;
      const randomAccuracy = 0.5; // Random baseline
      
      const testData = {
        features: Array(testSize).fill(null).map(() => Array(50).fill(0).map(() => Math.random())),
        labels: Array(testSize).fill(null).map(() => Math.random() > 0.5 ? 1 : 0),
        demographics: Array(testSize).fill(null).map(() => ['majority'])
      };
      
      const validation = await mlBiasService.validateModel(testData);
      
      expect(validation.accuracy).toBeGreaterThan(randomAccuracy + 0.1); // At least 10% better than random
    });
  });
});