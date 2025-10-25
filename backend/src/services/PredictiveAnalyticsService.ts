import * as tf from '@tensorflow/tfjs-node';
import { StatisticalTestService } from './StatisticalTestService';

/**
 * Predictive Analytics Service for Hiring Outcomes
 * Implements early attrition prediction, diversity impact forecasting, and success probability
 * Requirements: 8.3, 8.4
 */

interface EmployeeData {
  employeeId: string;
  demographics: {
    age: number;
    gender: string;
    ethnicity: string;
    education: string;
  };
  hiringMetrics: {
    timeToHire: number;
    interviewScore: number;
    skillsMatch: number;
    culturalFit: number;
  };
  performance: {
    performanceRating: number;
    promotions: number;
    trainingCompleted: number;
  };
  retention: {
    tenure: number;
    leftCompany: boolean;
    reasonForLeaving?: string;
  };
}

interface AttritionPrediction {
  employeeId: string;
  attritionRisk: number;
  confidence: number;
  riskFactors: string[];
  recommendations: string[];
  timeframe: '3_months' | '6_months' | '12_months';
}

interface DiversityForecast {
  timeframe: string;
  currentDiversity: {
    gender: Record<string, number>;
    ethnicity: Record<string, number>;
    age: Record<string, number>;
  };
  projectedDiversity: {
    gender: Record<string, number>;
    ethnicity: Record<string, number>;
    age: Record<string, number>;
  };
  diversityTrend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

interface HiringSuccessPrediction {
  candidateId: string;
  successProbability: number;
  performancePrediction: number;
  retentionProbability: number;
  confidence: number;
  keyFactors: string[];
  risks: string[];
}

export class PredictiveAnalyticsService {
  private attritionModel: tf.LayersModel | null = null;
  private performanceModel: tf.LayersModel | null = null;
  private diversityModel: tf.LayersModel | null = null;
  private statisticalTestService: StatisticalTestService;

  constructor() {
    this.statisticalTestService = new StatisticalTestService();
    this.initializeModels();
  }

  /**
   * Initialize predictive models
   */
  private async initializeModels(): Promise<void> {
    try {
      // Attrition prediction model
      this.attritionModel = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [25], // Feature vector for employee data
            units: 64,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid' // Probability of attrition
          })
        ]
      });

      this.attritionModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy', 'precision', 'recall']
      });

      // Performance prediction model
      this.performanceModel = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [20],
            units: 64,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'linear' // Continuous performance score
          })
        ]
      });

      this.performanceModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      // Diversity impact model (time series forecasting)
      this.diversityModel = tf.sequential({
        layers: [
          tf.layers.lstm({
            inputShape: [12, 10], // 12 months, 10 diversity features
            units: 50,
            returnSequences: true
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.lstm({
            units: 25,
            returnSequences: false
          }),
          tf.layers.dense({
            units: 10,
            activation: 'softmax' // Diversity distribution prediction
          })
        ]
      });

      this.diversityModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      console.log('Predictive analytics models initialized successfully');
    } catch (error) {
      console.error('Failed to initialize predictive models:', error);
      throw new Error('Predictive model initialization failed');
    }
  }

  /**
   * Predict early attrition risk for employees
   */
  async predictAttrition(employees: EmployeeData[]): Promise<AttritionPrediction[]> {
    if (!this.attritionModel) {
      throw new Error('Attrition model not initialized');
    }

    try {
      const predictions: AttritionPrediction[] = [];

      for (const employee of employees) {
        const features = this.extractAttritionFeatures(employee);
        const featureTensor = tf.tensor2d([features]);

        const prediction = this.attritionModel.predict(featureTensor) as tf.Tensor;
        const attritionRisk = (await prediction.data())[0];

        // Analyze risk factors
        const riskFactors = this.identifyAttritionRiskFactors(employee, features);
        const recommendations = this.generateAttritionRecommendations(attritionRisk, riskFactors);

        predictions.push({
          employeeId: employee.employeeId,
          attritionRisk,
          confidence: this.calculatePredictionConfidence(attritionRisk),
          riskFactors,
          recommendations,
          timeframe: this.determineAttritionTimeframe(attritionRisk)
        });

        featureTensor.dispose();
        prediction.dispose();
      }

      return predictions;
    } catch (error) {
      console.error('Attrition prediction failed:', error);
      throw new Error('Failed to predict attrition');
    }
  }

  /**
   * Forecast diversity impact of hiring decisions
   */
  async forecastDiversityImpact(
    currentHiringData: any[],
    projectionMonths: number = 12
  ): Promise<DiversityForecast> {
    if (!this.diversityModel) {
      throw new Error('Diversity model not initialized');
    }

    try {
      // Analyze current diversity metrics
      const currentDiversity = this.calculateCurrentDiversity(currentHiringData);

      // Prepare time series data for forecasting
      const timeSeriesData = this.prepareTimeSeriesData(currentHiringData, 12);
      const inputTensor = tf.tensor3d([timeSeriesData]);

      // Generate diversity forecast
      const forecast = this.diversityModel.predict(inputTensor) as tf.Tensor;
      const forecastData = await forecast.data();

      // Convert forecast to diversity distribution
      const projectedDiversity = this.convertForecastToDiversity(Array.from(forecastData));

      // Analyze diversity trend
      const diversityTrend = this.analyzeDiversityTrend(currentDiversity, projectedDiversity);

      // Generate recommendations
      const recommendations = this.generateDiversityRecommendations(
        currentDiversity,
        projectedDiversity,
        diversityTrend
      );

      inputTensor.dispose();
      forecast.dispose();

      return {
        timeframe: `${projectionMonths} months`,
        currentDiversity,
        projectedDiversity,
        diversityTrend,
        recommendations
      };
    } catch (error) {
      console.error('Diversity forecasting failed:', error);
      throw new Error('Failed to forecast diversity impact');
    }
  }

  /**
   * Calculate hiring success probability for candidates
   */
  async predictHiringSuccess(candidateData: any[]): Promise<HiringSuccessPrediction[]> {
    if (!this.performanceModel || !this.attritionModel) {
      throw new Error('Prediction models not initialized');
    }

    try {
      const predictions: HiringSuccessPrediction[] = [];

      for (const candidate of candidateData) {
        // Extract features for performance prediction
        const performanceFeatures = this.extractPerformanceFeatures(candidate);
        const performanceTensor = tf.tensor2d([performanceFeatures]);

        // Predict performance
        const performancePred = this.performanceModel.predict(performanceTensor) as tf.Tensor;
        const performancePrediction = (await performancePred.data())[0];

        // Extract features for retention prediction
        const retentionFeatures = this.extractRetentionFeatures(candidate);
        const retentionTensor = tf.tensor2d([retentionFeatures]);

        // Predict retention (inverse of attrition)
        const attritionPred = this.attritionModel.predict(retentionTensor) as tf.Tensor;
        const retentionProbability = 1 - (await attritionPred.data())[0];

        // Calculate overall success probability
        const successProbability = (performancePrediction * 0.6 + retentionProbability * 0.4);

        // Identify key factors and risks
        const keyFactors = this.identifySuccessFactors(candidate, performanceFeatures);
        const risks = this.identifySuccessRisks(candidate, retentionFeatures);

        predictions.push({
          candidateId: candidate.candidateId,
          successProbability,
          performancePrediction,
          retentionProbability,
          confidence: this.calculatePredictionConfidence(successProbability),
          keyFactors,
          risks
        });

        performanceTensor.dispose();
        performancePred.dispose();
        retentionTensor.dispose();
        attritionPred.dispose();
      }

      return predictions;
    } catch (error) {
      console.error('Hiring success prediction failed:', error);
      throw new Error('Failed to predict hiring success');
    }
  }

  /**
   * Train models on historical data
   */
  async trainModels(historicalData: {
    employees: EmployeeData[];
    hiringOutcomes: any[];
    diversityTimeSeries: any[];
  }): Promise<void> {
    try {
      console.log('Training predictive analytics models...');

      // Train attrition model
      await this.trainAttritionModel(historicalData.employees);

      // Train performance model
      await this.trainPerformanceModel(historicalData.hiringOutcomes);

      // Train diversity model
      await this.trainDiversityModel(historicalData.diversityTimeSeries);

      console.log('All predictive models trained successfully');
    } catch (error) {
      console.error('Model training failed:', error);
      throw new Error('Failed to train predictive models');
    }
  }

  /**
   * Private helper methods
   */
  private async trainAttritionModel(employees: EmployeeData[]): Promise<void> {
    if (!this.attritionModel) return;

    const features = employees.map(emp => this.extractAttritionFeatures(emp));
    const labels = employees.map(emp => emp.retention.leftCompany ? 1 : 0);

    const featureTensor = tf.tensor2d(features);
    const labelTensor = tf.tensor1d(labels);

    await this.attritionModel.fit(featureTensor, labelTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: [
        tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: 10
        })
      ]
    });

    featureTensor.dispose();
    labelTensor.dispose();
  }

  private async trainPerformanceModel(hiringOutcomes: any[]): Promise<void> {
    if (!this.performanceModel) return;

    const features = hiringOutcomes.map(outcome => this.extractPerformanceFeatures(outcome));
    const labels = hiringOutcomes.map(outcome => outcome.performanceRating);

    const featureTensor = tf.tensor2d(features);
    const labelTensor = tf.tensor1d(labels);

    await this.performanceModel.fit(featureTensor, labelTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2
    });

    featureTensor.dispose();
    labelTensor.dispose();
  }

  private async trainDiversityModel(diversityTimeSeries: any[]): Promise<void> {
    if (!this.diversityModel) return;

    // Prepare time series data
    const sequences = this.prepareDiversitySequences(diversityTimeSeries);
    const features = sequences.map(seq => seq.features);
    const labels = sequences.map(seq => seq.label);

    const featureTensor = tf.tensor3d(features);
    const labelTensor = tf.tensor2d(labels);

    await this.diversityModel.fit(featureTensor, labelTensor, {
      epochs: 30,
      batchSize: 16,
      validationSplit: 0.2
    });

    featureTensor.dispose();
    labelTensor.dispose();
  }  private 
extractAttritionFeatures(employee: EmployeeData): number[] {
    return [
      employee.demographics.age / 100, // Normalize age
      employee.demographics.gender === 'female' ? 1 : 0,
      employee.demographics.education === 'bachelor' ? 1 : 0,
      employee.demographics.education === 'master' ? 1 : 0,
      employee.demographics.education === 'phd' ? 1 : 0,
      employee.hiringMetrics.timeToHire / 100, // Normalize
      employee.hiringMetrics.interviewScore / 10,
      employee.hiringMetrics.skillsMatch / 100,
      employee.hiringMetrics.culturalFit / 10,
      employee.performance.performanceRating / 5,
      employee.performance.promotions,
      employee.performance.trainingCompleted / 10,
      employee.retention.tenure / 60, // Normalize months
      // Additional derived features
      employee.hiringMetrics.interviewScore * employee.hiringMetrics.skillsMatch / 1000,
      employee.performance.performanceRating * employee.retention.tenure / 300,
      employee.demographics.age > 40 ? 1 : 0,
      employee.demographics.age < 30 ? 1 : 0,
      employee.hiringMetrics.timeToHire > 30 ? 1 : 0,
      employee.performance.promotions > 0 ? 1 : 0,
      employee.performance.trainingCompleted > 5 ? 1 : 0,
      employee.hiringMetrics.culturalFit > 7 ? 1 : 0,
      employee.performance.performanceRating > 4 ? 1 : 0,
      employee.retention.tenure > 24 ? 1 : 0,
      employee.hiringMetrics.skillsMatch > 80 ? 1 : 0,
      employee.hiringMetrics.interviewScore > 8 ? 1 : 0
    ];
  }

  private extractPerformanceFeatures(candidate: any): number[] {
    return [
      candidate.skills?.technical || 0,
      candidate.skills?.communication || 0,
      candidate.skills?.leadership || 0,
      candidate.experience?.years || 0,
      candidate.education?.level || 0,
      candidate.interviewScore || 0,
      candidate.assessmentScore || 0,
      candidate.culturalFitScore || 0,
      candidate.motivationScore || 0,
      candidate.adaptabilityScore || 0,
      candidate.problemSolvingScore || 0,
      candidate.teamworkScore || 0,
      candidate.innovationScore || 0,
      candidate.reliabilityScore || 0,
      candidate.learningAgilityScore || 0,
      // Derived features
      (candidate.skills?.technical || 0) * (candidate.experience?.years || 0) / 100,
      (candidate.interviewScore || 0) * (candidate.assessmentScore || 0) / 100,
      (candidate.culturalFitScore || 0) * (candidate.motivationScore || 0) / 100,
      candidate.experience?.years > 5 ? 1 : 0,
      candidate.education?.level > 3 ? 1 : 0
    ];
  }

  private extractRetentionFeatures(candidate: any): number[] {
    // Similar to attrition features but for candidates
    return [
      candidate.demographics?.age / 100 || 0,
      candidate.demographics?.gender === 'female' ? 1 : 0,
      candidate.jobPreferences?.workLifeBalance || 0,
      candidate.jobPreferences?.careerGrowth || 0,
      candidate.jobPreferences?.compensation || 0,
      candidate.culturalFitScore || 0,
      candidate.motivationScore || 0,
      candidate.stabilityIndicators?.jobHopping || 0,
      candidate.stabilityIndicators?.careerProgression || 0,
      candidate.personalFactors?.familyStatus || 0,
      candidate.personalFactors?.locationStability || 0,
      candidate.skills?.adaptability || 0,
      candidate.experience?.industryRelevance || 0,
      candidate.references?.quality || 0,
      candidate.interviewFeedback?.enthusiasm || 0,
      // Additional features for retention prediction
      candidate.demographics?.age > 35 ? 1 : 0,
      candidate.demographics?.age < 25 ? 1 : 0,
      candidate.jobPreferences?.workLifeBalance > 8 ? 1 : 0,
      candidate.stabilityIndicators?.jobHopping < 3 ? 1 : 0,
      candidate.culturalFitScore > 8 ? 1 : 0,
      candidate.motivationScore > 8 ? 1 : 0,
      candidate.experience?.industryRelevance > 7 ? 1 : 0,
      candidate.personalFactors?.locationStability > 7 ? 1 : 0,
      candidate.references?.quality > 8 ? 1 : 0,
      candidate.interviewFeedback?.enthusiasm > 8 ? 1 : 0
    ];
  }

  private identifyAttritionRiskFactors(employee: EmployeeData, features: number[]): string[] {
    const riskFactors: string[] = [];

    if (employee.performance.performanceRating < 3) {
      riskFactors.push('Low performance rating');
    }
    if (employee.hiringMetrics.culturalFit < 6) {
      riskFactors.push('Poor cultural fit');
    }
    if (employee.performance.promotions === 0 && employee.retention.tenure > 24) {
      riskFactors.push('Lack of career advancement');
    }
    if (employee.performance.trainingCompleted < 2) {
      riskFactors.push('Limited professional development');
    }
    if (employee.demographics.age < 30 && employee.retention.tenure > 18) {
      riskFactors.push('Early career transition risk');
    }
    if (employee.hiringMetrics.timeToHire > 45) {
      riskFactors.push('Extended hiring process may indicate poor fit');
    }

    return riskFactors;
  }

  private generateAttritionRecommendations(attritionRisk: number, riskFactors: string[]): string[] {
    const recommendations: string[] = [];

    if (attritionRisk > 0.7) {
      recommendations.push('Immediate intervention required - schedule retention conversation');
      recommendations.push('Review compensation and benefits package');
      recommendations.push('Explore career development opportunities');
    }

    if (riskFactors.includes('Low performance rating')) {
      recommendations.push('Implement performance improvement plan');
      recommendations.push('Provide additional training and mentoring');
    }

    if (riskFactors.includes('Poor cultural fit')) {
      recommendations.push('Consider team reassignment or role adjustment');
      recommendations.push('Provide cultural integration support');
    }

    if (riskFactors.includes('Lack of career advancement')) {
      recommendations.push('Discuss promotion timeline and requirements');
      recommendations.push('Create individual development plan');
    }

    recommendations.push('Conduct stay interview to understand concerns');
    recommendations.push('Monitor engagement levels closely');

    return recommendations;
  }

  private determineAttritionTimeframe(attritionRisk: number): '3_months' | '6_months' | '12_months' {
    if (attritionRisk > 0.8) return '3_months';
    if (attritionRisk > 0.6) return '6_months';
    return '12_months';
  }

  private calculateCurrentDiversity(hiringData: any[]): {
    gender: Record<string, number>;
    ethnicity: Record<string, number>;
    age: Record<string, number>;
  } {
    const total = hiringData.length;
    const diversity = {
      gender: {} as Record<string, number>,
      ethnicity: {} as Record<string, number>,
      age: {} as Record<string, number>
    };

    hiringData.forEach(hire => {
      // Gender distribution
      const gender = hire.demographics?.gender || 'unknown';
      diversity.gender[gender] = (diversity.gender[gender] || 0) + 1;

      // Ethnicity distribution
      const ethnicity = hire.demographics?.ethnicity || 'unknown';
      diversity.ethnicity[ethnicity] = (diversity.ethnicity[ethnicity] || 0) + 1;

      // Age distribution
      const age = hire.demographics?.age || 0;
      const ageGroup = age < 30 ? 'under_30' : age < 40 ? '30_39' : age < 50 ? '40_49' : 'over_50';
      diversity.age[ageGroup] = (diversity.age[ageGroup] || 0) + 1;
    });

    // Convert to percentages
    Object.keys(diversity.gender).forEach(key => {
      diversity.gender[key] = diversity.gender[key] / total;
    });
    Object.keys(diversity.ethnicity).forEach(key => {
      diversity.ethnicity[key] = diversity.ethnicity[key] / total;
    });
    Object.keys(diversity.age).forEach(key => {
      diversity.age[key] = diversity.age[key] / total;
    });

    return diversity;
  }

  private prepareTimeSeriesData(hiringData: any[], sequenceLength: number): number[][] {
    // Prepare monthly diversity metrics for time series analysis
    const monthlyData: number[][] = [];
    
    // Group hiring data by month
    const monthlyHires = this.groupHiresByMonth(hiringData);
    
    // Convert to feature vectors for each month
    Object.keys(monthlyHires).forEach(month => {
      const monthData = monthlyHires[month];
      const diversity = this.calculateCurrentDiversity(monthData);
      
      const features = [
        diversity.gender.female || 0,
        diversity.gender.male || 0,
        diversity.ethnicity.asian || 0,
        diversity.ethnicity.black || 0,
        diversity.ethnicity.hispanic || 0,
        diversity.ethnicity.white || 0,
        diversity.age.under_30 || 0,
        diversity.age['30_39'] || 0,
        diversity.age['40_49'] || 0,
        diversity.age.over_50 || 0
      ];
      
      monthlyData.push(features);
    });

    return monthlyData.slice(-sequenceLength); // Return last N months
  }

  private groupHiresByMonth(hiringData: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    hiringData.forEach(hire => {
      const date = new Date(hire.hireDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(hire);
    });
    
    return grouped;
  }

  private convertForecastToDiversity(forecastData: number[]): {
    gender: Record<string, number>;
    ethnicity: Record<string, number>;
    age: Record<string, number>;
  } {
    // Convert model output to diversity distribution
    return {
      gender: {
        female: forecastData[0] || 0,
        male: forecastData[1] || 0
      },
      ethnicity: {
        asian: forecastData[2] || 0,
        black: forecastData[3] || 0,
        hispanic: forecastData[4] || 0,
        white: forecastData[5] || 0
      },
      age: {
        under_30: forecastData[6] || 0,
        '30_39': forecastData[7] || 0,
        '40_49': forecastData[8] || 0,
        over_50: forecastData[9] || 0
      }
    };
  }

  private analyzeDiversityTrend(
    current: any,
    projected: any
  ): 'improving' | 'stable' | 'declining' {
    // Calculate overall diversity score
    const currentScore = this.calculateDiversityScore(current);
    const projectedScore = this.calculateDiversityScore(projected);
    
    const change = projectedScore - currentScore;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  private calculateDiversityScore(diversity: any): number {
    // Calculate Shannon diversity index
    let score = 0;
    
    ['gender', 'ethnicity', 'age'].forEach(category => {
      const values = Object.values(diversity[category]) as number[];
      const total = values.reduce((sum, val) => sum + val, 0);
      
      if (total > 0) {
        values.forEach(val => {
          if (val > 0) {
            const proportion = val / total;
            score -= proportion * Math.log(proportion);
          }
        });
      }
    });
    
    return score;
  }

  private generateDiversityRecommendations(
    current: any,
    projected: any,
    trend: string
  ): string[] {
    const recommendations: string[] = [];

    if (trend === 'declining') {
      recommendations.push('Implement targeted diversity recruitment strategies');
      recommendations.push('Review job posting language for inclusive terminology');
      recommendations.push('Expand recruitment channels to reach underrepresented groups');
    }

    // Check specific diversity gaps
    if (current.gender.female < 0.4) {
      recommendations.push('Focus on attracting more female candidates');
      recommendations.push('Partner with women in tech organizations');
    }

    if (current.age.under_30 < 0.3) {
      recommendations.push('Enhance campus recruitment and internship programs');
      recommendations.push('Improve entry-level position offerings');
    }

    recommendations.push('Monitor diversity metrics monthly');
    recommendations.push('Provide unconscious bias training for hiring teams');

    return recommendations;
  }

  private identifySuccessFactors(candidate: any, features: number[]): string[] {
    const factors: string[] = [];

    if (candidate.skills?.technical > 8) {
      factors.push('Strong technical skills');
    }
    if (candidate.experience?.years > 5) {
      factors.push('Extensive relevant experience');
    }
    if (candidate.culturalFitScore > 8) {
      factors.push('Excellent cultural fit');
    }
    if (candidate.interviewScore > 8) {
      factors.push('Outstanding interview performance');
    }
    if (candidate.references?.quality > 8) {
      factors.push('Exceptional references');
    }

    return factors;
  }

  private identifySuccessRisks(candidate: any, features: number[]): string[] {
    const risks: string[] = [];

    if (candidate.stabilityIndicators?.jobHopping > 3) {
      risks.push('History of frequent job changes');
    }
    if (candidate.motivationScore < 6) {
      risks.push('Low motivation indicators');
    }
    if (candidate.culturalFitScore < 6) {
      risks.push('Potential cultural fit issues');
    }
    if (candidate.demographics?.age < 25) {
      risks.push('Early career - higher attrition risk');
    }

    return risks;
  }

  private calculatePredictionConfidence(prediction: number): number {
    // Calculate confidence based on how far the prediction is from 0.5 (uncertainty)
    return Math.abs(prediction - 0.5) * 2;
  }

  private prepareDiversitySequences(timeSeries: any[]): Array<{
    features: number[][];
    label: number[];
  }> {
    const sequences = [];
    const sequenceLength = 12;

    for (let i = sequenceLength; i < timeSeries.length; i++) {
      const features = timeSeries.slice(i - sequenceLength, i);
      const label = timeSeries[i];
      
      sequences.push({
        features: features.map(month => this.monthToDiversityVector(month)),
        label: this.monthToDiversityVector(label)
      });
    }

    return sequences;
  }

  private monthToDiversityVector(monthData: any): number[] {
    const diversity = this.calculateCurrentDiversity(monthData.hires || []);
    return [
      diversity.gender.female || 0,
      diversity.gender.male || 0,
      diversity.ethnicity.asian || 0,
      diversity.ethnicity.black || 0,
      diversity.ethnicity.hispanic || 0,
      diversity.ethnicity.white || 0,
      diversity.age.under_30 || 0,
      diversity.age['30_39'] || 0,
      diversity.age['40_49'] || 0,
      diversity.age.over_50 || 0
    ];
  }
}  private 
extractAttritionFeatures(employee: EmployeeData): number[] {
    return [
      employee.demographics.age / 100, // Normalize age
      employee.demographics.gender === 'female' ? 1 : 0,
      employee.demographics.education === 'bachelor' ? 1 : employee.demographics.education === 'master' ? 2 : 3,
      employee.hiringMetrics.timeToHire / 100, // Normalize
      employee.hiringMetrics.interviewScore / 10,
      employee.hiringMetrics.skillsMatch / 100,
      employee.hiringMetrics.culturalFit / 10,
      employee.performance.performanceRating / 5,
      employee.performance.promotions,
      employee.performance.trainingCompleted / 10,
      employee.retention.tenure / 60, // Normalize months
      // Add more derived features
      employee.hiringMetrics.interviewScore * employee.hiringMetrics.skillsMatch / 1000,
      employee.performance.performanceRating * employee.performance.promotions,
      employee.demographics.age > 40 ? 1 : 0,
      employee.retention.tenure < 12 ? 1 : 0,
      // Additional contextual features
      ...Array(10).fill(0).map(() => Math.random() * 0.1) // Placeholder for additional features
    ];
  }

  private extractPerformanceFeatures(candidate: any): number[] {
    return [
      candidate.skills?.technical || 0,
      candidate.skills?.communication || 0,
      candidate.experience?.years || 0,
      candidate.education?.level || 0,
      candidate.assessments?.cognitive || 0,
      candidate.assessments?.technical || 0,
      candidate.interviews?.score || 0,
      candidate.references?.rating || 0,
      candidate.culturalFit?.score || 0,
      candidate.motivation?.score || 0,
      // Derived features
      (candidate.skills?.technical || 0) * (candidate.experience?.years || 0) / 100,
      (candidate.assessments?.cognitive || 0) + (candidate.assessments?.technical || 0),
      candidate.education?.level > 2 ? 1 : 0,
      candidate.experience?.years > 5 ? 1 : 0,
      candidate.interviews?.score > 8 ? 1 : 0,
      // Additional features
      ...Array(5).fill(0).map(() => Math.random() * 0.1)
    ];
  }

  private extractRetentionFeatures(candidate: any): number[] {
    // Similar to attrition features but for candidates
    return [
      candidate.demographics?.age / 100 || 0,
      candidate.demographics?.gender === 'female' ? 1 : 0,
      candidate.location?.distance || 0,
      candidate.salary?.expectation / 100000 || 0,
      candidate.motivation?.jobSecurity || 0,
      candidate.motivation?.careerGrowth || 0,
      candidate.workPreferences?.remote || 0,
      candidate.workPreferences?.flexible || 0,
      candidate.culturalFit?.teamwork || 0,
      candidate.culturalFit?.values || 0,
      // Derived features
      candidate.salary?.expectation > 80000 ? 1 : 0,
      candidate.demographics?.age < 30 ? 1 : 0,
      candidate.motivation?.careerGrowth > 8 ? 1 : 0,
      // Additional features
      ...Array(12).fill(0).map(() => Math.random() * 0.1)
    ];
  }

  private identifyAttritionRiskFactors(employee: EmployeeData, features: number[]): string[] {
    const riskFactors: string[] = [];
    
    if (employee.performance.performanceRating < 3) {
      riskFactors.push('Low performance rating');
    }
    if (employee.hiringMetrics.culturalFit < 6) {
      riskFactors.push('Poor cultural fit');
    }
    if (employee.retention.tenure < 6) {
      riskFactors.push('Short tenure');
    }
    if (employee.performance.promotions === 0 && employee.retention.tenure > 24) {
      riskFactors.push('Lack of career progression');
    }
    if (employee.demographics.age < 25) {
      riskFactors.push('Early career stage');
    }
    
    return riskFactors;
  }

  private generateAttritionRecommendations(attritionRisk: number, riskFactors: string[]): string[] {
    const recommendations: string[] = [];
    
    if (attritionRisk > 0.7) {
      recommendations.push('Immediate intervention required');
      recommendations.push('Schedule one-on-one meeting with manager');
      recommendations.push('Review compensation and benefits');
    }
    
    if (riskFactors.includes('Poor cultural fit')) {
      recommendations.push('Provide mentorship or team reassignment');
    }
    
    if (riskFactors.includes('Lack of career progression')) {
      recommendations.push('Discuss career development opportunities');
      recommendations.push('Consider promotion or role expansion');
    }
    
    if (riskFactors.includes('Low performance rating')) {
      recommendations.push('Implement performance improvement plan');
      recommendations.push('Provide additional training and support');
    }
    
    return recommendations;
  }

  private determineAttritionTimeframe(attritionRisk: number): '3_months' | '6_months' | '12_months' {
    if (attritionRisk > 0.8) return '3_months';
    if (attritionRisk > 0.6) return '6_months';
    return '12_months';
  }

  private calculateCurrentDiversity(hiringData: any[]): {
    gender: Record<string, number>;
    ethnicity: Record<string, number>;
    age: Record<string, number>;
  } {
    const diversity = {
      gender: {} as Record<string, number>,
      ethnicity: {} as Record<string, number>,
      age: {} as Record<string, number>
    };

    hiringData.forEach(hire => {
      // Gender distribution
      const gender = hire.demographics?.gender || 'unknown';
      diversity.gender[gender] = (diversity.gender[gender] || 0) + 1;

      // Ethnicity distribution
      const ethnicity = hire.demographics?.ethnicity || 'unknown';
      diversity.ethnicity[ethnicity] = (diversity.ethnicity[ethnicity] || 0) + 1;

      // Age distribution
      const ageGroup = this.getAgeGroup(hire.demographics?.age || 0);
      diversity.age[ageGroup] = (diversity.age[ageGroup] || 0) + 1;
    });

    // Convert to percentages
    const total = hiringData.length;
    Object.keys(diversity.gender).forEach(key => {
      diversity.gender[key] = diversity.gender[key] / total;
    });
    Object.keys(diversity.ethnicity).forEach(key => {
      diversity.ethnicity[key] = diversity.ethnicity[key] / total;
    });
    Object.keys(diversity.age).forEach(key => {
      diversity.age[key] = diversity.age[key] / total;
    });

    return diversity;
  }

  private prepareTimeSeriesData(hiringData: any[], sequenceLength: number): number[][] {
    // Prepare time series data for LSTM model
    const timeSeriesData: number[][] = [];
    
    for (let i = 0; i < sequenceLength; i++) {
      const monthData = this.getMonthlyDiversityMetrics(hiringData, i);
      timeSeriesData.push(monthData);
    }
    
    return timeSeriesData;
  }

  private getMonthlyDiversityMetrics(hiringData: any[], monthOffset: number): number[] {
    // Calculate diversity metrics for a specific month
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - monthOffset);
    
    const monthHires = hiringData.filter(hire => {
      const hireDate = new Date(hire.hireDate);
      return hireDate.getMonth() === targetDate.getMonth() && 
             hireDate.getFullYear() === targetDate.getFullYear();
    });

    const diversity = this.calculateCurrentDiversity(monthHires);
    
    // Convert to feature vector
    return [
      diversity.gender.female || 0,
      diversity.gender.male || 0,
      diversity.ethnicity.asian || 0,
      diversity.ethnicity.black || 0,
      diversity.ethnicity.hispanic || 0,
      diversity.ethnicity.white || 0,
      diversity.age['20-30'] || 0,
      diversity.age['30-40'] || 0,
      diversity.age['40-50'] || 0,
      diversity.age['50+'] || 0
    ];
  }

  private convertForecastToDiversity(forecastData: number[]): {
    gender: Record<string, number>;
    ethnicity: Record<string, number>;
    age: Record<string, number>;
  } {
    return {
      gender: {
        female: forecastData[0] || 0,
        male: forecastData[1] || 0
      },
      ethnicity: {
        asian: forecastData[2] || 0,
        black: forecastData[3] || 0,
        hispanic: forecastData[4] || 0,
        white: forecastData[5] || 0
      },
      age: {
        '20-30': forecastData[6] || 0,
        '30-40': forecastData[7] || 0,
        '40-50': forecastData[8] || 0,
        '50+': forecastData[9] || 0
      }
    };
  }

  private analyzeDiversityTrend(
    current: any,
    projected: any
  ): 'improving' | 'stable' | 'declining' {
    // Calculate overall diversity score
    const currentScore = this.calculateDiversityScore(current);
    const projectedScore = this.calculateDiversityScore(projected);
    
    const change = projectedScore - currentScore;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  private calculateDiversityScore(diversity: any): number {
    // Calculate Shannon diversity index
    let score = 0;
    
    ['gender', 'ethnicity', 'age'].forEach(category => {
      const values = Object.values(diversity[category]) as number[];
      const total = values.reduce((sum, val) => sum + val, 0);
      
      if (total > 0) {
        values.forEach(val => {
          if (val > 0) {
            const proportion = val / total;
            score -= proportion * Math.log2(proportion);
          }
        });
      }
    });
    
    return score / 3; // Average across categories
  }

  private generateDiversityRecommendations(
    current: any,
    projected: any,
    trend: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (trend === 'declining') {
      recommendations.push('Implement targeted diversity recruitment strategies');
      recommendations.push('Review job posting language for inclusive terminology');
      recommendations.push('Expand recruitment channels to reach underrepresented groups');
    }
    
    // Check specific diversity gaps
    if (current.gender.female < 0.4) {
      recommendations.push('Focus on attracting more female candidates');
    }
    
    if (current.ethnicity.black < 0.1 || current.ethnicity.hispanic < 0.1) {
      recommendations.push('Partner with diversity-focused organizations');
    }
    
    if (current.age['20-30'] > 0.7) {
      recommendations.push('Consider age-inclusive recruitment practices');
    }
    
    recommendations.push('Monitor diversity metrics monthly');
    recommendations.push('Set specific diversity targets for next quarter');
    
    return recommendations;
  }

  private identifySuccessFactors(candidate: any, features: number[]): string[] {
    const factors: string[] = [];
    
    if (candidate.skills?.technical > 8) {
      factors.push('Strong technical skills');
    }
    if (candidate.experience?.years > 5) {
      factors.push('Extensive experience');
    }
    if (candidate.education?.level > 2) {
      factors.push('Advanced education');
    }
    if (candidate.interviews?.score > 8) {
      factors.push('Excellent interview performance');
    }
    if (candidate.references?.rating > 4) {
      factors.push('Strong references');
    }
    
    return factors;
  }

  private identifySuccessRisks(candidate: any, features: number[]): string[] {
    const risks: string[] = [];
    
    if (candidate.salary?.expectation > 120000) {
      risks.push('High salary expectations');
    }
    if (candidate.location?.distance > 50) {
      risks.push('Long commute distance');
    }
    if (candidate.motivation?.jobSecurity < 5) {
      risks.push('Low job security motivation');
    }
    if (candidate.workPreferences?.remote > 8 && !candidate.company?.remotePolicy) {
      risks.push('Remote work preference mismatch');
    }
    
    return risks;
  }

  private calculatePredictionConfidence(prediction: number): number {
    // Calculate confidence based on how far the prediction is from 0.5 (uncertain)
    return Math.abs(prediction - 0.5) * 2;
  }

  private getAgeGroup(age: number): string {
    if (age < 30) return '20-30';
    if (age < 40) return '30-40';
    if (age < 50) return '40-50';
    return '50+';
  }

  private prepareDiversitySequences(diversityTimeSeries: any[]): Array<{
    features: number[][];
    label: number[];
  }> {
    const sequences = [];
    const sequenceLength = 12;
    
    for (let i = sequenceLength; i < diversityTimeSeries.length; i++) {
      const features = [];
      for (let j = i - sequenceLength; j < i; j++) {
        features.push(this.getMonthlyDiversityMetrics(diversityTimeSeries, j));
      }
      
      const label = this.getMonthlyDiversityMetrics(diversityTimeSeries, i);
      sequences.push({ features, label });
    }
    
    return sequences;
  }
}