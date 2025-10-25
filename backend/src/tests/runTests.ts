#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Comprehensive Test Runner
 * Runs all matching engine tests with detailed reporting
 * Requirements: 2.1, 2.2, 2.5
 */

interface TestSuite {
  name: string;
  pattern: string;
  description: string;
  timeout?: number;
}

interface TestResults {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
  duration: number;
  errors: string[];
}

class TestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Matching Engine Core',
      pattern: 'MatchingEngine.test.ts',
      description: 'Core matching algorithm tests',
      timeout: 60000
    },
    {
      name: 'Bias Detection',
      pattern: 'BiasDetection.test.ts',
      description: 'Bias detection and monitoring tests',
      timeout: 45000
    },
    {
      name: 'Explainable AI',
      pattern: 'ExplainableAI.test.ts',
      description: 'AI explanation generation tests',
      timeout: 30000
    },
    {
      name: 'Skills Gap Analysis',
      pattern: 'SkillsGap.test.ts',
      description: 'Skills analysis and learning path tests',
      timeout: 30000
    },
    {
      name: 'Fairness Metrics',
      pattern: 'FairnessMetrics.test.ts',
      description: 'Fairness calculation and validation tests',
      timeout: 30000
    }
  ];

  private results: TestResults[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Matching Engine Tests\n');
    console.log('=' .repeat(60));

    const startTime = Date.now();

    // Run each test suite
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    // Generate summary report
    this.generateSummaryReport();
    
    // Generate coverage report
    await this.generateCoverageReport();

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ All tests completed in ${totalTime}ms`);
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n📋 Running ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log('-'.repeat(40));

    const suiteStartTime = Date.now();
    let result: TestResults;

    try {
      const command = `npx jest ${suite.pattern} --verbose --coverage --json`;
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: suite.timeout || 30000,
        cwd: process.cwd()
      });

      result = this.parseJestOutput(output, suite.name);
      result.duration = Date.now() - suiteStartTime;

      this.logSuiteResults(result);

    } catch (error: any) {
      result = {
        suite: suite.name,
        passed: 0,
        failed: 1,
        skipped: 0,
        coverage: 0,
        duration: Date.now() - suiteStartTime,
        errors: [error.message]
      };

      console.log(`❌ ${suite.name} failed: ${error.message}`);
    }

    this.results.push(result);
  }

  private parseJestOutput(output: string, suiteName: string): TestResults {
    try {
      // Extract JSON from Jest output
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse Jest output');
      }

      const jestResult = JSON.parse(jsonMatch[0]);

      return {
        suite: suiteName,
        passed: jestResult.numPassedTests || 0,
        failed: jestResult.numFailedTests || 0,
        skipped: jestResult.numPendingTests || 0,
        coverage: this.extractCoverage(jestResult),
        duration: jestResult.testResults?.[0]?.perfStats?.end - jestResult.testResults?.[0]?.perfStats?.start || 0,
        errors: this.extractErrors(jestResult)
      };

    } catch (error) {
      return {
        suite: suiteName,
        passed: 0,
        failed: 1,
        skipped: 0,
        coverage: 0,
        duration: 0,
        errors: ['Failed to parse test results']
      };
    }
  }

  private extractCoverage(jestResult: any): number {
    try {
      const coverage = jestResult.coverageMap;
      if (!coverage) return 0;

      // Calculate average coverage across all files
      const files = Object.keys(coverage);
      if (files.length === 0) return 0;

      let totalCoverage = 0;
      files.forEach(file => {
        const fileCoverage = coverage[file];
        const statements = fileCoverage.s || {};
        const branches = fileCoverage.b || {};
        
        const stmtCoverage = this.calculateCoveragePercentage(statements);
        const branchCoverage = this.calculateCoveragePercentage(branches);
        
        totalCoverage += (stmtCoverage + branchCoverage) / 2;
      });

      return Math.round(totalCoverage / files.length);

    } catch (error) {
      return 0;
    }
  }

  private calculateCoveragePercentage(coverageData: any): number {
    const values = Object.values(coverageData) as number[];
    if (values.length === 0) return 100;

    const covered = values.filter(v => v > 0).length;
    return (covered / values.length) * 100;
  }

  private extractErrors(jestResult: any): string[] {
    const errors: string[] = [];

    if (jestResult.testResults) {
      jestResult.testResults.forEach((testFile: any) => {
        if (testFile.message) {
          errors.push(testFile.message);
        }
      });
    }

    return errors;
  }

  private logSuiteResults(result: TestResults): void {
    const passIcon = result.failed === 0 ? '✅' : '❌';
    const coverageIcon = result.coverage >= 70 ? '✅' : result.coverage >= 50 ? '⚠️' : '❌';

    console.log(`${passIcon} Tests: ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`);
    console.log(`${coverageIcon} Coverage: ${result.coverage}%`);
    console.log(`⏱️  Duration: ${result.duration}ms`);

    if (result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach(error => {
        console.log(`   ${error}`);
      });
    }
  }

  private generateSummaryReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY REPORT');
    console.log('='.repeat(60));

    const totals = this.results.reduce((acc, result) => ({
      passed: acc.passed + result.passed,
      failed: acc.failed + result.failed,
      skipped: acc.skipped + result.skipped,
      duration: acc.duration + result.duration
    }), { passed: 0, failed: 0, skipped: 0, duration: 0 });

    const avgCoverage = this.results.reduce((sum, result) => sum + result.coverage, 0) / this.results.length;

    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Tests: ${totals.passed + totals.failed + totals.skipped}`);
    console.log(`   Passed: ${totals.passed}`);
    console.log(`   Failed: ${totals.failed}`);
    console.log(`   Skipped: ${totals.skipped}`);
    console.log(`   Average Coverage: ${Math.round(avgCoverage)}%`);
    console.log(`   Total Duration: ${totals.duration}ms`);

    console.log(`\n📋 Suite Breakdown:`);
    this.results.forEach(result => {
      const status = result.failed === 0 ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${result.suite}: ${result.passed}/${result.passed + result.failed} (${result.coverage}%)`);
    });

    // Quality gates
    console.log(`\n🎯 Quality Gates:`);
    const overallPass = totals.failed === 0;
    const coveragePass = avgCoverage >= 70;
    const performancePass = totals.duration < 300000; // 5 minutes

    console.log(`   ${overallPass ? '✅' : '❌'} All Tests Pass: ${overallPass}`);
    console.log(`   ${coveragePass ? '✅' : '❌'} Coverage >= 70%: ${Math.round(avgCoverage)}%`);
    console.log(`   ${performancePass ? '✅' : '❌'} Performance < 5min: ${Math.round(totals.duration / 1000)}s`);

    const allGatesPass = overallPass && coveragePass && performancePass;
    console.log(`\n${allGatesPass ? '🎉' : '⚠️'} Overall Quality: ${allGatesPass ? 'PASS' : 'FAIL'}`);
  }

  private async generateCoverageReport(): Promise<void> {
    console.log('\n📊 Generating detailed coverage report...');

    try {
      // Generate HTML coverage report
      execSync('npx jest --coverage --coverageReporters=html', {
        encoding: 'utf8',
        cwd: process.cwd()
      });

      console.log('✅ Coverage report generated in ./coverage/lcov-report/index.html');

    } catch (error) {
      console.log('⚠️  Could not generate coverage report');
    }
  }

  async runSpecificTests(patterns: string[]): Promise<void> {
    console.log(`🎯 Running specific tests: ${patterns.join(', ')}\n`);

    for (const pattern of patterns) {
      const suite = this.testSuites.find(s => s.pattern.includes(pattern)) || {
        name: `Custom: ${pattern}`,
        pattern,
        description: 'Custom test pattern'
      };

      await this.runTestSuite(suite);
    }

    this.generateSummaryReport();
  }

  async runPerformanceTests(): Promise<void> {
    console.log('🚀 Running Performance Tests\n');

    const performanceTests = [
      'should handle large candidate pools efficiently',
      'should cache matching results appropriately',
      'should handle concurrent matching requests'
    ];

    for (const testName of performanceTests) {
      console.log(`⏱️  Running: ${testName}`);
      
      try {
        const command = `npx jest --testNamePattern="${testName}" --verbose`;
        const startTime = Date.now();
        
        execSync(command, { 
          encoding: 'utf8',
          cwd: process.cwd()
        });

        const duration = Date.now() - startTime;
        console.log(`   ✅ Completed in ${duration}ms`);

      } catch (error) {
        console.log(`   ❌ Failed: ${error}`);
      }
    }
  }

  async runBiasTests(): Promise<void> {
    console.log('⚖️  Running Bias and Fairness Tests\n');

    const biasTests = [
      'should apply fairness constraints during matching',
      'should detect and report bias in matching results',
      'should ensure demographic parity across experience levels'
    ];

    for (const testName of biasTests) {
      console.log(`🔍 Running: ${testName}`);
      
      try {
        const command = `npx jest --testNamePattern="${testName}" --verbose`;
        execSync(command, { 
          encoding: 'utf8',
          cwd: process.cwd()
        });

        console.log(`   ✅ Passed`);

      } catch (error) {
        console.log(`   ❌ Failed`);
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.length === 0) {
    await runner.runAllTests();
  } else if (args[0] === '--performance') {
    await runner.runPerformanceTests();
  } else if (args[0] === '--bias') {
    await runner.runBiasTests();
  } else if (args[0] === '--pattern') {
    await runner.runSpecificTests(args.slice(1));
  } else {
    console.log('Usage:');
    console.log('  npm run test:matching              # Run all tests');
    console.log('  npm run test:matching --performance # Run performance tests');
    console.log('  npm run test:matching --bias        # Run bias tests');
    console.log('  npm run test:matching --pattern <pattern> # Run specific pattern');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default TestRunner;