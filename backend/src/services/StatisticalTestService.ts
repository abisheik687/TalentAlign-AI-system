/**
 * Statistical Test Service for Fairness Analysis
 * Implements various statistical tests for bias detection
 * Requirements: 4.3, 8.1, 8.2, 8.3
 */

interface ChiSquareResult {
  statistic: number;
  pValue: number;
  degreesOfFreedom: number;
  isSignificant: boolean;
}

interface FisherExactResult {
  pValue: number;
  oddsRatio: number;
  confidenceInterval: [number, number];
  isSignificant: boolean;
}

interface TTestResult {
  statistic: number;
  pValue: number;
  confidenceInterval: [number, number];
  isSignificant: boolean;
}

export class StatisticalTestService {
  
  /**
   * Perform Chi-square test for independence
   */
  async chiSquareTest(contingencyTable: number[][]): Promise<ChiSquareResult> {
    try {
      const rows = contingencyTable.length;
      const cols = contingencyTable[0].length;
      
      // Calculate row and column totals
      const rowTotals = contingencyTable.map(row => row.reduce((sum, val) => sum + val, 0));
      const colTotals = Array(cols).fill(0);
      
      for (let j = 0; j < cols; j++) {
        for (let i = 0; i < rows; i++) {
          colTotals[j] += contingencyTable[i][j];
        }
      }
      
      const grandTotal = rowTotals.reduce((sum, val) => sum + val, 0);
      
      // Calculate expected frequencies and chi-square statistic
      let chiSquare = 0;
      
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const expected = (rowTotals[i] * colTotals[j]) / grandTotal;
          const observed = contingencyTable[i][j];
          
          if (expected > 0) {
            chiSquare += Math.pow(observed - expected, 2) / expected;
          }
        }
      }
      
      const degreesOfFreedom = (rows - 1) * (cols - 1);
      const pValue = this.chiSquarePValue(chiSquare, degreesOfFreedom);
      
      return {
        statistic: chiSquare,
        pValue,
        degreesOfFreedom,
        isSignificant: pValue < 0.05
      };
    } catch (error) {
      console.error('Chi-square test failed:', error);
      throw new Error('Failed to perform chi-square test');
    }
  }

  /**
   * Perform Fisher's exact test
   */
  async fisherExactTest(contingencyTable: number[][]): Promise<FisherExactResult> {
    try {
      // Simplified Fisher's exact test for 2x2 tables
      if (contingencyTable.length !== 2 || contingencyTable[0].length !== 2) {
        throw new Error('Fisher exact test requires 2x2 contingency table');
      }
      
      const [[a, b], [c, d]] = contingencyTable;
      const n = a + b + c + d;
      
      // Calculate odds ratio
      const oddsRatio = (a * d) / (b * c);
      
      // Simplified p-value calculation (hypergeometric distribution)
      const pValue = this.hypergeometricPValue(a, b, c, d);
      
      // Confidence interval for odds ratio (simplified)
      const logOR = Math.log(oddsRatio);
      const seLogOR = Math.sqrt(1/a + 1/b + 1/c + 1/d);
      const ci95Lower = Math.exp(logOR - 1.96 * seLogOR);
      const ci95Upper = Math.exp(logOR + 1.96 * seLogOR);
      
      return {
        pValue,
        oddsRatio,
        confidenceInterval: [ci95Lower, ci95Upper],
        isSignificant: pValue < 0.05
      };
    } catch (error) {
      console.error('Fisher exact test failed:', error);
      throw new Error('Failed to perform Fisher exact test');
    }
  }

  /**
   * Perform two-sample t-test
   */
  async tTest(sample1: number[], sample2: number[]): Promise<TTestResult> {
    try {
      const n1 = sample1.length;
      const n2 = sample2.length;
      
      if (n1 < 2 || n2 < 2) {
        throw new Error('Each sample must have at least 2 observations');
      }
      
      // Calculate means
      const mean1 = sample1.reduce((sum, val) => sum + val, 0) / n1;
      const mean2 = sample2.reduce((sum, val) => sum + val, 0) / n2;
      
      // Calculate variances
      const var1 = sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
      const var2 = sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);
      
      // Pooled standard error
      const pooledSE = Math.sqrt(var1/n1 + var2/n2);
      
      // t-statistic
      const tStatistic = (mean1 - mean2) / pooledSE;
      
      // Degrees of freedom (Welch's formula)
      const df = Math.pow(var1/n1 + var2/n2, 2) / 
                 (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1));
      
      // p-value (two-tailed)
      const pValue = 2 * (1 - this.tCDF(Math.abs(tStatistic), df));
      
      // Confidence interval for difference in means
      const criticalT = this.tCritical(0.05, df);
      const marginError = criticalT * pooledSE;
      const diffMeans = mean1 - mean2;
      
      return {
        statistic: tStatistic,
        pValue,
        confidenceInterval: [diffMeans - marginError, diffMeans + marginError],
        isSignificant: pValue < 0.05
      };
    } catch (error) {
      console.error('T-test failed:', error);
      throw new Error('Failed to perform t-test');
    }
  }

  /**
   * Calculate demographic parity difference
   */
  calculateDemographicParity(
    protectedGroupPositiveRate: number,
    unprotectedGroupPositiveRate: number
  ): number {
    return Math.abs(protectedGroupPositiveRate - unprotectedGroupPositiveRate);
  }

  /**
   * Calculate equalized odds difference
   */
  calculateEqualizedOdds(
    protectedGroupTPR: number,
    unprotectedGroupTPR: number,
    protectedGroupFPR: number,
    unprotectedGroupFPR: number
  ): number {
    const tprDiff = Math.abs(protectedGroupTPR - unprotectedGroupTPR);
    const fprDiff = Math.abs(protectedGroupFPR - unprotectedGroupFPR);
    return Math.max(tprDiff, fprDiff);
  }

  /**
   * Private helper methods for statistical calculations
   */
  private chiSquarePValue(chiSquare: number, df: number): number {
    // Simplified chi-square p-value calculation
    // In production, use a proper statistical library
    if (df === 1) {
      if (chiSquare > 10.83) return 0.001;
      if (chiSquare > 6.63) return 0.01;
      if (chiSquare > 3.84) return 0.05;
      if (chiSquare > 2.71) return 0.1;
      return 0.5;
    }
    
    // Rough approximation for other degrees of freedom
    const criticalValues = [3.84, 5.99, 7.81, 9.49, 11.07];
    for (let i = 0; i < criticalValues.length; i++) {
      if (chiSquare > criticalValues[i] + (df - 1) * 2) {
        return [0.05, 0.025, 0.01, 0.005, 0.001][i];
      }
    }
    return 0.5;
  }

  private hypergeometricPValue(a: number, b: number, c: number, d: number): number {
    // Simplified hypergeometric p-value
    // In production, use a proper statistical library
    const n = a + b + c + d;
    const k = a + c;
    const n1 = a + b;
    
    // Very rough approximation
    const expected = (k * n1) / n;
    const variance = (k * n1 * (n - n1) * (n - k)) / (n * n * (n - 1));
    const z = Math.abs(a - expected) / Math.sqrt(variance);
    
    // Approximate p-value using normal approximation
    return 2 * (1 - this.normalCDF(z));
  }

  private tCDF(t: number, df: number): number {
    // Simplified t-distribution CDF
    // In production, use a proper statistical library
    if (df >= 30) {
      return this.normalCDF(t);
    }
    
    // Rough approximation for small df
    const x = t / Math.sqrt(df);
    return 0.5 + 0.5 * Math.sign(t) * Math.min(0.5, Math.abs(x) / 2);
  }

  private tCritical(alpha: number, df: number): number {
    // Simplified critical t-value
    if (df >= 30) return 1.96; // Normal approximation
    if (df >= 20) return 2.09;
    if (df >= 10) return 2.23;
    return 2.78; // Conservative estimate for small df
  }

  private normalCDF(z: number): number {
    // Approximation of standard normal CDF
    const sign = z >= 0 ? 1 : -1;
    z = Math.abs(z);
    
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
    
    return 0.5 + sign * y * 0.5;
  }
}