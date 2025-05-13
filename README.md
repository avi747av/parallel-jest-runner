# Parallel Jest Runner

Run Jest tests in parallel shards for faster execution and improved performance.

[![npm version](https://badge.fury.io/js/parallel-jest-runner.svg)](https://badge.fury.io/js/parallel-jest-runner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Parallel Jest Runner is a utility for running Jest tests in parallel across multiple shards to significantly reduce test execution time in large projects. It handles test distribution, coverage reporting, and error aggregation automatically.

## Features

- **Parallel Test Execution**: Split tests into configurable shards for faster runs
- **Coverage Reporting**: Automatically merges coverage reports from all shards
- **Smart Threshold Detection**: Extracts coverage thresholds from your Jest config
- **Detailed Error Reporting**: Provides comprehensive failure summaries
- **Configurable**: Customize shards, memory limits, and more

## Installation

```bash
npm install --save-dev parallel-jest-runner
```

## Usage

### Command Line

```bash
npx parallel-jest-runner
```

#### Options

- `-s, --shards <number>` - Number of shards to split tests into (default: 12)
- `-m, --memory <number>` - Memory size in MB for Node process (default: 12288)
- `-w, --workers <number>` - Max workers per shard (default: 1)
- `-d, --dir <path>` - Working directory (default: current directory)
- `-a, --args <string>` - Additional Jest arguments

### Programmatic API

```typescript
import { runParallelTests } from 'parallel-jest-runner';

async function runTests() {
  const result = await runParallelTests({
    numShards: 8,
    memorySize: 8192,
    maxWorkers: 2,
    workingDir: './my-project',
    additionalJestArgs: ['--bail']
  });
  
  console.log('Tests passed:', result.success);
  console.log('Test suites passed:', result.testSuitesPassed);
  console.log('Tests passed:', result.testsPassed);
}

runTests();
```

## Benefits

- **Faster CI Builds**: Dramatically reduces test execution time
- **Resource Optimization**: Better utilization of multi-core systems
- **Simplified Coverage**: Handles coverage merging automatically
- **Improved Reporting**: Detailed failure information aggregated from all shards

## Requirements

- Node.js 14 or higher
- Jest 26 or higher

## License

MIT