export * from './runner';
export * from './types';
export { startParallelJestRunner } from './cli';

// src/types.ts - Type definitions
export interface RunnerConfig {
  numShards: number;
  memorySize: number;
  coverageThresholds?: {
    branches?: number;
    functions?: number;
    lines?: number;
    statements?: number;
  };
  maxWorkers?: number | string;
  workingDir?: string;
  additionalJestArgs?: string[];
}

export interface CoverageThresholds {
  branches: number;
  functions: number;
  lines: number;
  statements: number;
}

export interface TestResult {
  success: boolean;
  testSuitesPassed: number;
  testSuitesFailed: number;
  testsPassed: number;
  testsFailed: number;
  executionTimeSeconds: number;
  coverageMeetsThreshold: boolean;
  failedTests?: string[];
}

export interface ShardInfo {
  id: number;
  filePath: string;
  testCount: number;
  success?: boolean;
  testStats?: {
    suitesPassed?: number;
    suitesFailed?: number;
    testsPassed?: number;
    testsFailed?: number;
  };
  failedTests?: string[];
  executionTimeMs?: number;
}