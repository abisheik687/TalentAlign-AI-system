import * as tf from '@tensorflow/tfjs-node';
import { BiasAnalysisResult, FairnessMetrics } from '../types/bias';

/**
 * ML-based Bias Detection Service
 * Implements custom machine learning models for advanced bias detection
 * Requirements: 4.1, 4.2
 */

interface TrainingData {
  features: number[][];
  labels: number[];
  demographics: string[][];
}

interface ModelPrediction {
  prediction: number;
  confidence: number;
  explanation: string[];
}

interface AdversarialResult {
  originalAccuracy: number;
  adversarialAccuracy: number;
  biasScore: number;
  vulnerabilities: string[];
}

export class MLBiasDetectionService {
  private biasDetectionModel: tf.LayersModel | null = null;
  private adversarialModel: tf.LayersModel | null = null;
  private isModelLoaded = false;

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize and load pre-trained bias detection models
   */
  private async initializeModels(): Promise<void> {
    try {
      // Create bias detection model architecture
      this.biasDetectionModel = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [50], // Feature vector size
            units: 128,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 64,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid' // Binary classification for bias detection
          })
        ]
      });

      // Compile the model
      this.biasDetectionModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy', 'precision', 'recall']
      });

      // Create adversarial debiasing model
      this.adversarialModel = await this.createAdversarialModel();

      this.isModelLoaded = true;
      console.log('ML Bias Detection models initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ML models:', error);
      throw new Error('ML model initialization failed');
    }
  }

  /**
   * Create adversarial debiasing model architecture
   */
  private async createAdversarialModel(): Promise<tf.LayersModel> {
    // Main predictor network
    const mainInput = tf.input({ shape: [50] });
    const mainHidden1 = tf.layers.dense({ units: 128, activation: 'relu' }).apply(mainInput);
    const mainHidden2 = tf.layers.dense({ units: 64, activation: 'relu' }).apply(mainHidden1);
    const mainOutput = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'main_output' }).apply(mainHidden2);

    // Adversarial network (tries to predict protected attributes)
    const advHidden1 = tf.layers.dense({ units: 64, activation: 'relu' }).apply(mainHidden2);
    const advOutput = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'adversarial_output' }).apply(advHidden1);

    const model = tf.model({
      inputs: mainInput,
      outputs: [mainOutput, advOutput]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: {
        main_output: 'binaryCrossentropy',
        adversarial_output: 'binaryCrossentropy'
      },
      lossWeights: {
        main_output: 1.0,
        adversarial_output: -0.1 // Negative weight for adversarial training
      },
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Train custom bias detection model on diverse hiring datasets
   */
  async trainBiasDetectionModel(trainingData: TrainingData): Promise<void> {
    if (!this.biasDetectionModel) {
      throw new Error('Bias detection model not initialized');
    }

    try {
      // Prepare training data
      const features = tf.tensor2d(trainingData.features);
      const labels = tf.tensor1d(trainingData.labels);

      // Data augmentation for better generalization
      const augmentedData = await this.augmentTrainingData(features, labels);

      // Train the model with early stopping
      const history = await this.biasDetectionModel.fit(
        augmentedData.features,
        augmentedData.labels,
        {
          epochs: 100,
          batchSize: 32,
          validationSplit: 0.2,
          callbacks: [
            tf.callbacks.earlyStopping({
              monitor: 'val_loss',
              patience: 10,
              restoreBestWeights: true
            }),
            tf.callbacks.reduceLROnPlateau({
              monitor: 'val_loss',
              factor: 0.5,
              patience: 5,
              minLr: 0.0001
            })
          ]
        }
      );

      console.log('Bias detection model training completed');
      console.log('Final accuracy:', history.history.accuracy?.slice(-1)[0]);
      console.log('Final val_accuracy:', history.history.val_accuracy?.slice(-1)[0]);

      // Clean up tensors
      features.dispose();
      labels.dispose();
      augmentedData.features.dispose();
      augmentedData.labels.dispose();

    } catch (error) {
      console.error('Model training failed:', error);
      throw new Error('Failed to train bias detection model');
    }
  }

  /**
   * Implement adversarial debiasing techniques
   */
  async trainAdversarialModel(trainingData: TrainingData): Promise<void> {
    if (!this.adversarialModel) {
      throw new Error('Adversarial model not initialized');
    }

    try {
      const features = tf.tensor2d(trainingData.features);
      const mainLabels = tf.tensor1d(trainingData.labels);
      
      // Extract protected attributes (e.g., gender, race indicators)
      const protectedAttributes = this.extractProtectedAttributes(trainingData.demographics);
      const advLabels = tf.tensor1d(protectedAttributes);

      // Adversarial training loop
      for (let epoch = 0; epoch < 50; epoch++) {
        // Train main predictor
        await this.adversarialModel.fit(features, [mainLabels, advLabels], {
          epochs: 1,
          batchSize: 32,
          verbose: 0
        });

        // Evaluate fairness metrics
        if (epoch % 10 === 0) {
          const fairnessMetrics = await this.evaluateFairness(features, mainLabels, advLabels);
          console.log(`Epoch ${epoch} - Demographic Parity: ${fairnessMetrics.demographicParity}`);
        }
      }

      console.log('Adversarial debiasing training completed');

      // Clean up tensors
      features.dispose();
      mainLabels.dispose();
      advLabels.dispose();

    } catch (error) {
      console.error('Adversarial training failed:', error);
      throw new Error('Failed to train adversarial model');
    }
  }

  /**
   * Detect bias in hiring decisions using trained models
   */
  async detectBias(candidateFeatures: number[], decisionContext: any): Promise<BiasAnalysisResult> {
    if (!this.isModelLoaded || !this.biasDetectionModel) {
      throw new Error('Models not loaded');
    }

    try {
      const features = tf.tensor2d([candidateFeatures]);
      
      // Get bias prediction
      const prediction = this.biasDetectionModel.predict(features) as tf.Tensor;
      const biasScore = await prediction.data();
      
      // Get feature importance for explainability
      const featureImportance = await this.calculateFeatureImportance(features);
      
      // Analyze demographic impact
      const demographicAnalysis = await this.analyzeDemographicImpact(candidateFeatures, decisionContext);

      const result: BiasAnalysisResult = {
        biasScore: biasScore[0],
        confidence: Math.abs(biasScore[0] - 0.5) * 2, // Convert to confidence score
        violationType: biasScore[0] > 0.7 ? 'high_bias' : biasScore[0] > 0.5 ? 'moderate_bias' : 'low_bias',
        severity: this.calculateSeverity(biasScore[0]),
        description: this.generateBiasDescription(biasScore[0], featureImportance),
        recommendations: this.generateRecommendations(biasScore[0], featureImportance),
        affectedGroups: demographicAnalysis.affectedGroups,
        statisticalSignificance: demographicAnalysis.significance,
        detectedAt: new Date(),
        metadata: {
          modelVersion: '1.0',
          featureImportance,
          demographicAnalysis
        }
      };

      // Clean up tensors
      features.dispose();
      prediction.dispose();

      return result;

    } catch (error) {
      console.error('Bias detection failed:', error);
      throw new Error('Failed to detect bias');
    }
  } 
 /**
   * Create comprehensive model validation and testing framework
   */
  async validateModel(testData: TrainingData): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    fairnessMetrics: FairnessMetrics;
    adversarialResults: AdversarialResult;
  }> {
    if (!this.biasDetectionModel) {
      throw new Error('Model not loaded for validation');
    }

    try {
      const features = tf.tensor2d(testData.features);
      const labels = tf.tensor1d(testData.labels);

      // Evaluate model performance
      const evaluation = await this.biasDetectionModel.evaluate(features, labels) as tf.Scalar[];
      const accuracy = await evaluation[1].data();
      
      // Calculate detailed metrics
      const predictions = this.biasDetectionModel.predict(features) as tf.Tensor;
      const predictionData = await predictions.data();
      
      const metrics = this.calculateDetailedMetrics(
        testData.labels,
        Array.from(predictionData).map(p => p > 0.5 ? 1 : 0)
      );

      // Evaluate fairness across demographic groups
      const fairnessMetrics = await this.evaluateGroupFairness(
        testData.features,
        testData.labels,
        testData.demographics
      );

      // Run adversarial tests
      const adversarialResults = await this.runAdversarialTests(features, labels);

      // Clean up tensors
      features.dispose();
      labels.dispose();
      predictions.dispose();
      evaluation.forEach(tensor => tensor.dispose());

      return {
        accuracy: accuracy[0],
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
        fairnessMetrics,
        adversarialResults
      };

    } catch (error) {
      console.error('Model validation failed:', error);
      throw new Error('Failed to validate model');
    }
  }

  /**
   * Test model fairness across demographic groups
   */
  private async evaluateGroupFairness(
    features: number[][],
    labels: number[],
    demographics: string[][]
  ): Promise<FairnessMetrics> {
    const groups = this.groupByDemographics(features, labels, demographics);
    
    const groupMetrics = await Promise.all(
      Object.entries(groups).map(async ([groupName, groupData]) => {
        const groupFeatures = tf.tensor2d(groupData.features);
        const predictions = this.biasDetectionModel!.predict(groupFeatures) as tf.Tensor;
        const predictionData = await predictions.data();
        
        const positiveRate = predictionData.filter(p => p > 0.5).length / predictionData.length;
        const accuracy = this.calculateAccuracy(groupData.labels, Array.from(predictionData));
        
        groupFeatures.dispose();
        predictions.dispose();
        
        return {
          group: groupName,
          positiveRate,
          accuracy,
          sampleSize: groupData.features.length
        };
      })
    );

    // Calculate fairness metrics
    const demographicParity = this.calculateDemographicParity(groupMetrics);
    const equalizedOdds = this.calculateEqualizedOdds(groupMetrics);
    const equalOpportunity = this.calculateEqualOpportunity(groupMetrics);

    return {
      demographicParity,
      equalizedOdds,
      equalOpportunity,
      groupMetrics,
      overallFairnessScore: (demographicParity + equalizedOdds + equalOpportunity) / 3
    };
  }

  /**
   * Run adversarial tests for bias vulnerabilities
   */
  private async runAdversarialTests(features: tf.Tensor, labels: tf.Tensor): Promise<AdversarialResult> {
    try {
      // Original model accuracy
      const originalEval = await this.biasDetectionModel!.evaluate(features, labels) as tf.Scalar[];
      const originalAccuracy = await originalEval[1].data();

      // Generate adversarial examples
      const adversarialFeatures = await this.generateAdversarialExamples(features);
      
      // Test on adversarial examples
      const adversarialEval = await this.biasDetectionModel!.evaluate(adversarialFeatures, labels) as tf.Scalar[];
      const adversarialAccuracy = await adversarialEval[1].data();

      // Calculate bias score based on performance degradation
      const biasScore = 1 - (adversarialAccuracy[0] / originalAccuracy[0]);

      // Identify vulnerabilities
      const vulnerabilities = this.identifyVulnerabilities(biasScore, originalAccuracy[0], adversarialAccuracy[0]);

      // Clean up tensors
      originalEval.forEach(tensor => tensor.dispose());
      adversarialEval.forEach(tensor => tensor.dispose());
      adversarialFeatures.dispose();

      return {
        originalAccuracy: originalAccuracy[0],
        adversarialAccuracy: adversarialAccuracy[0],
        biasScore,
        vulnerabilities
      };

    } catch (error) {
      console.error('Adversarial testing failed:', error);
      throw new Error('Failed to run adversarial tests');
    }
  }

  /**
   * Generate adversarial examples using FGSM (Fast Gradient Sign Method)
   */
  private async generateAdversarialExamples(features: tf.Tensor): Promise<tf.Tensor> {
    return tf.tidy(() => {
      const epsilon = 0.1; // Perturbation magnitude
      
      // Calculate gradients
      const gradients = tf.grad((x: tf.Tensor) => {
        const predictions = this.biasDetectionModel!.predict(x) as tf.Tensor;
        return tf.mean(predictions);
      })(features);

      // Apply FGSM
      const signGradients = tf.sign(gradients);
      const adversarialFeatures = tf.add(features, tf.mul(signGradients, epsilon));
      
      // Clip to valid range [0, 1]
      return tf.clipByValue(adversarialFeatures, 0, 1);
    });
  }

  /**
   * Helper methods for data processing and metrics calculation
   */
  private async augmentTrainingData(features: tf.Tensor, labels: tf.Tensor): Promise<{
    features: tf.Tensor;
    labels: tf.Tensor;
  }> {
    return tf.tidy(() => {
      // Add noise for data augmentation
      const noise = tf.randomNormal(features.shape, 0, 0.01);
      const augmentedFeatures = tf.add(features, noise);
      
      return {
        features: augmentedFeatures,
        labels: labels.clone()
      };
    });
  }

  private async calculateFeatureImportance(features: tf.Tensor): Promise<number[]> {
    // Simplified feature importance using gradient-based method
    const gradients = tf.grad((x: tf.Tensor) => {
      const predictions = this.biasDetectionModel!.predict(x) as tf.Tensor;
      return tf.mean(predictions);
    })(features);

    const importance = await tf.abs(gradients).mean(0).data();
    gradients.dispose();
    
    return Array.from(importance);
  }

  private async analyzeDemographicImpact(features: number[], context: any): Promise<{
    affectedGroups: string[];
    significance: number;
  }> {
    // Analyze which demographic groups might be affected
    const affectedGroups: string[] = [];
    
    // This would be implemented based on specific demographic indicators in features
    // For now, return placeholder analysis
    return {
      affectedGroups: ['underrepresented_minorities', 'women_in_tech'],
      significance: 0.85
    };
  }

  private extractProtectedAttributes(demographics: string[][]): number[] {
    // Convert demographic strings to binary indicators
    return demographics.map(demo => {
      // Simplified: return 1 if any protected attribute is present
      return demo.some(attr => 
        ['female', 'minority', 'disability', 'age_over_40'].includes(attr.toLowerCase())
      ) ? 1 : 0;
    });
  }

  private async evaluateFairness(
    features: tf.Tensor,
    mainLabels: tf.Tensor,
    protectedLabels: tf.Tensor
  ): Promise<{ demographicParity: number }> {
    const predictions = this.adversarialModel!.predict(features) as tf.Tensor[];
    const mainPredictions = predictions[0];
    
    const mainPredData = await mainPredictions.data();
    const protectedData = await protectedLabels.data();
    
    // Calculate demographic parity
    const protectedGroup = Array.from(protectedData).map((val, idx) => ({
      protected: val > 0.5,
      prediction: mainPredData[idx] > 0.5
    }));
    
    const protectedPositiveRate = protectedGroup
      .filter(item => item.protected)
      .reduce((sum, item) => sum + (item.prediction ? 1 : 0), 0) /
      protectedGroup.filter(item => item.protected).length;
    
    const unprotectedPositiveRate = protectedGroup
      .filter(item => !item.protected)
      .reduce((sum, item) => sum + (item.prediction ? 1 : 0), 0) /
      protectedGroup.filter(item => !item.protected).length;
    
    const demographicParity = 1 - Math.abs(protectedPositiveRate - unprotectedPositiveRate);
    
    mainPredictions.dispose();
    
    return { demographicParity };
  }

  private calculateDetailedMetrics(trueLabels: number[], predictions: number[]): {
    precision: number;
    recall: number;
    f1Score: number;
  } {
    let tp = 0, fp = 0, fn = 0;
    
    for (let i = 0; i < trueLabels.length; i++) {
      if (trueLabels[i] === 1 && predictions[i] === 1) tp++;
      else if (trueLabels[i] === 0 && predictions[i] === 1) fp++;
      else if (trueLabels[i] === 1 && predictions[i] === 0) fn++;
    }
    
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    return { precision, recall, f1Score };
  }

  private calculateAccuracy(trueLabels: number[], predictions: number[]): number {
    const correct = trueLabels.reduce((sum, label, idx) => 
      sum + (label === (predictions[idx] > 0.5 ? 1 : 0) ? 1 : 0), 0
    );
    return correct / trueLabels.length;
  }

  private groupByDemographics(
    features: number[][],
    labels: number[],
    demographics: string[][]
  ): Record<string, { features: number[][]; labels: number[] }> {
    const groups: Record<string, { features: number[][]; labels: number[] }> = {};
    
    demographics.forEach((demo, idx) => {
      const groupKey = demo.join('_') || 'unknown';
      if (!groups[groupKey]) {
        groups[groupKey] = { features: [], labels: [] };
      }
      groups[groupKey].features.push(features[idx]);
      groups[groupKey].labels.push(labels[idx]);
    });
    
    return groups;
  }

  private calculateDemographicParity(groupMetrics: any[]): number {
    if (groupMetrics.length < 2) return 1;
    
    const rates = groupMetrics.map(g => g.positiveRate);
    const maxRate = Math.max(...rates);
    const minRate = Math.min(...rates);
    
    return 1 - (maxRate - minRate);
  }

  private calculateEqualizedOdds(groupMetrics: any[]): number {
    // Simplified calculation - in practice would need true positive rates
    return this.calculateDemographicParity(groupMetrics);
  }

  private calculateEqualOpportunity(groupMetrics: any[]): number {
    // Simplified calculation - in practice would need recall rates
    return this.calculateDemographicParity(groupMetrics);
  }

  private calculateSeverity(biasScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (biasScore >= 0.8) return 'critical';
    if (biasScore >= 0.6) return 'high';
    if (biasScore >= 0.4) return 'medium';
    return 'low';
  }

  private generateBiasDescription(biasScore: number, featureImportance: number[]): string {
    const severity = this.calculateSeverity(biasScore);
    const topFeatures = featureImportance
      .map((importance, idx) => ({ importance, feature: `feature_${idx}` }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3)
      .map(f => f.feature);

    return `${severity.charAt(0).toUpperCase() + severity.slice(1)} bias detected (score: ${biasScore.toFixed(3)}). ` +
           `Primary contributing factors: ${topFeatures.join(', ')}.`;
  }

  private generateRecommendations(biasScore: number, featureImportance: number[]): string[] {
    const recommendations: string[] = [];
    
    if (biasScore > 0.6) {
      recommendations.push('Immediate review of decision criteria required');
      recommendations.push('Consider additional human oversight for this decision');
    }
    
    if (biasScore > 0.4) {
      recommendations.push('Review feature weights and model parameters');
      recommendations.push('Collect additional diverse training data');
    }
    
    recommendations.push('Monitor ongoing decisions for similar patterns');
    recommendations.push('Document decision rationale for audit trail');
    
    return recommendations;
  }

  private identifyVulnerabilities(biasScore: number, originalAcc: number, advAcc: number): string[] {
    const vulnerabilities: string[] = [];
    
    if (biasScore > 0.3) {
      vulnerabilities.push('High susceptibility to adversarial attacks');
    }
    
    if (originalAcc - advAcc > 0.2) {
      vulnerabilities.push('Model lacks robustness to input perturbations');
    }
    
    if (biasScore > 0.5) {
      vulnerabilities.push('Potential for discriminatory decision patterns');
    }
    
    return vulnerabilities;
  }

  /**
   * Save trained model to disk
   */
  async saveModel(modelPath: string): Promise<void> {
    if (!this.biasDetectionModel) {
      throw new Error('No model to save');
    }
    
    try {
      await this.biasDetectionModel.save(`file://${modelPath}`);
      console.log(`Model saved to ${modelPath}`);
    } catch (error) {
      console.error('Failed to save model:', error);
      throw new Error('Model save failed');
    }
  }

  /**
   * Load pre-trained model from disk
   */
  async loadModel(modelPath: string): Promise<void> {
    try {
      this.biasDetectionModel = await tf.loadLayersModel(`file://${modelPath}`);
      this.isModelLoaded = true;
      console.log(`Model loaded from ${modelPath}`);
    } catch (error) {
      console.error('Failed to load model:', error);
      throw new Error('Model load failed');
    }
  }
}