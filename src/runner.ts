import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { spawn } from "child_process";
import {
  CoverageThresholds,
  RunnerConfig,
  ShardInfo,
  TestResult,
} from "./types";
import { mkdir, extractStats, parseTestStats, mergeShardStats } from "./utils";

/**
 * Run Jest tests in parallel shards
 */
export async function runParallelTests(
  config: RunnerConfig
): Promise<TestResult> {
  const {
    numShards = 12,
    memorySize = 12288,
    maxWorkers = 1,
    workingDir = process.cwd(),
    additionalJestArgs = [],
  } = config;

  // Set up environment
  process.env.NODE_OPTIONS = `--max-old-space-size=${memorySize}`;

  // Create necessary directories
  const dirs = [
    "final-coverage-files",
    ".nyc_output",
    "coverage",
    "logs",
    "tmp",
  ];
  await Promise.all(dirs.map((dir) => mkdir(path.join(workingDir, dir))));

  // Extract coverage thresholds from Jest config
  const coverageThresholds = await extractCoverageThresholds(
    workingDir,
    config.coverageThresholds
  );
  console.log(
    `Using coverage thresholds: branches=${coverageThresholds.branches}%, functions=${coverageThresholds.functions}%, lines=${coverageThresholds.lines}%, statements=${coverageThresholds.statements}%`
  );

  // List all tests
  console.log("Listing all tests...");
  const allTests = await listAllTests(workingDir);
  console.log(`Found ${allTests.length} tests to run`);

  // Split tests into shards
  const shards = splitIntoShards(allTests, numShards, workingDir);
  console.log(
    `Splitting into ${numShards} shards with approximately ${Math.ceil(
      allTests.length / numShards
    )} tests per shard`
  );

  // Record start time
  const testStartTime = Date.now();

  // Run all shards in parallel
  console.log("Starting parallel test execution...");
  const shardResults = await Promise.all(
    shards.map((shard) =>
      runTestShard(shard, maxWorkers, workingDir, additionalJestArgs)
    )
  );
  console.log("All shards have completed execution");

  // Record end time
  const testEndTime = Date.now();
  const executionTimeSeconds = Math.round((testEndTime - testStartTime) / 1000);

  // Check for test failures
  const testsSucceeded = shardResults.every((result) => result.success);

  if (!testsSucceeded) {
    console.log("⚠️ Some tests failed during execution");
  } else {
    console.log("✅ All tests passed");
  }

  // Merge coverage files
  console.log("Merging coverage files...");
  const coverageMergeSuccess = await mergeCoverageFiles(workingDir);

  // Generate coverage reports
  console.log("Generating coverage reports...");
  await generateCoverageReports(workingDir);

  // Validate coverage thresholds
  console.log("Validating coverage thresholds...");
  const coverageMeetsThreshold = await validateCoverageThresholds(
    workingDir,
    coverageThresholds
  );

  // Extract and display failed tests
  const failedTests = extractFailedTests(shardResults);
  if (failedTests.length > 0) {
    console.log(
      "============================= CONCISE FAILURE SUMMARY =========================="
    );
    failedTests.forEach((test) => console.log(test));
    console.log(
      "==============================================================================="
    );
  }

  // Aggregate test statistics
  const stats = aggregateTestStats(shardResults);

  // Display test summary
  console.log(
    "============================= TEST SUMMARY ====================================="
  );
  console.log(
    `Test Suites: ${stats.suitesFailed} failed, ${stats.suitesPassed} passed, ${
      stats.suitesFailed + stats.suitesPassed
    } total`
  );
  console.log(
    `Tests:       ${stats.testsFailed} failed, ${stats.testsPassed} passed, ${
      stats.testsFailed + stats.testsPassed
    } total`
  );
  console.log(`Snapshots:   0 total`);
  console.log(`Time:        ${executionTimeSeconds} s`);
  console.log(
    "==============================================================================="
  );

  // Determine final result
  let finalMessage: string;

  if (!testsSucceeded) {
    finalMessage = "⚠️ Build failed because tests failed";
  } else if (!coverageMeetsThreshold) {
    finalMessage = "⚠️ Build failed because coverage is below threshold";
  } else {
    finalMessage = "✅ All tests passed and coverage meets threshold";
  }

  console.log(finalMessage);

  return {
    success: testsSucceeded,
    testSuitesPassed: stats.suitesPassed,
    testSuitesFailed: stats.suitesFailed,
    testsPassed: stats.testsPassed,
    testsFailed: stats.testsFailed,
    executionTimeSeconds,
    coverageMeetsThreshold,
    failedTests: failedTests.length > 0 ? failedTests : undefined,
  };
}

/**
 * Run a single test shard and collect results
 */
async function runTestShard(
  shard: ShardInfo,
  maxWorkers: number | string,
  workingDir: string,
  additionalJestArgs: string[] = []
): Promise<ShardInfo> {
  console.log(
    `Starting Shard ${shard.id} with ${
      shard.testCount
    } tests at ${new Date().toLocaleTimeString()}`
  );

  const startTime = Date.now();
  const logFile = path.join(workingDir, "logs", `shard-${shard.id}.log`);

  // Read all tests from the shard file
  const testsInShard = (await fs.readFile(shard.filePath, "utf8"))
    .split("\n")
    .filter(Boolean);

  // Build arguments for Jest
  const jestArgs = [
    "jest",
    "--runTestsByPath",
    ...testsInShard,
    `--maxWorkers=${maxWorkers}`,
    "--coverage",
    "--json",
    "--coverageReporters=json",
    `--coverageDirectory=./final-coverage-files/coverage-${shard.id}`,
    ...additionalJestArgs,
  ];

  // Run Jest process
  const { success, stdout, stderr } = await runProcess(
    "npx",
    jestArgs,
    workingDir
  );

  // Save log output to file
  await fs.writeFile(logFile, stdout + stderr);

  // Extract test statistics
  const testStats = await extractStats(logFile);

  // Check for test failures
  const hasTestFailures = stdout.includes("FAIL ");
  if (hasTestFailures) {
    await fs.writeFile(path.join(workingDir, "tmp", `failed-${shard.id}`), "");
    console.log(
      `❌ Shard ${
        shard.id
      } FAILED with test failures at ${new Date().toLocaleTimeString()}`
    );
  } else {
    console.log(
      `✅ Shard ${shard.id} SUCCEEDED at ${new Date().toLocaleTimeString()}`
    );
  }

  // Extract failed tests
  const failedTests = hasTestFailures
    ? await extractFailedTestsFromLog(logFile)
    : [];

  return {
    ...shard,
    success: !hasTestFailures,
    testStats: parseTestStats(testStats),
    failedTests,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Extract coverage thresholds from Jest config
 */
async function extractCoverageThresholds(
  workingDir: string,
  configThresholds?: RunnerConfig["coverageThresholds"]
): Promise<CoverageThresholds> {
  // If thresholds are provided in config, use them
  if (configThresholds) {
    return {
      branches: configThresholds.branches ?? 80,
      functions: configThresholds.functions ?? 80,
      lines: configThresholds.lines ?? 80,
      statements: configThresholds.statements ?? 80,
    };
  }

  console.log("Extracting coverage thresholds from Jest config...");

  // Find Jest config file
  const possibleConfigFiles = [
    "jest.config.js",
    "jest.config.ts",
    "jest.config.json",
    "package.json",
  ];
  let configFile: string | undefined;

  for (const file of possibleConfigFiles) {
    const filePath = path.join(workingDir, file);
    if (existsSync(filePath)) {
      configFile = file;
      break;
    }
  }

  if (!configFile) {
    console.log(
      "Warning: Could not find Jest config file. Using default threshold of 80%."
    );
    return {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    };
  }

  console.log(`Found Jest config file: ${configFile}`);

  try {
    // Extract thresholds based on file type
    if (configFile.endsWith(".js")) {
      return await extractThresholdsFromJsFile(
        path.join(workingDir, configFile)
      );
    } else if (configFile.endsWith(".ts")) {
      return await extractThresholdsFromTsFile(
        path.join(workingDir, configFile)
      );
    } else if (configFile.endsWith(".json")) {
      return await extractThresholdsFromJsonFile(
        path.join(workingDir, configFile)
      );
    } else if (configFile === "package.json") {
      return await extractThresholdsFromPackageJson(
        path.join(workingDir, configFile)
      );
    }
  } catch (error) {
    console.log(`Error extracting thresholds: ${error}`);
  }

  // Default to 80% if extraction fails
  console.log("Using default threshold of 80%.");
  return {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  };
}

/**
 * Extract thresholds from JavaScript config file
 */
async function extractThresholdsFromJsFile(
  filePath: string
): Promise<CoverageThresholds> {
  const { stdout } = await runProcess("node", [
    "-e",
    `try {
      const config = require('${filePath}');
      const thresholds = config.coverageThreshold && config.coverageThreshold.global || {};
      console.log(JSON.stringify({
        branches: thresholds.branches || 80,
        functions: thresholds.functions || 80,
        lines: thresholds.lines || 80,
        statements: thresholds.statements || 80
      }));
    } catch(e) {
      console.log(JSON.stringify({
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }));
    }`,
  ]);

  return JSON.parse(stdout);
}

/**
 * Extract thresholds from TypeScript config file
 */
async function extractThresholdsFromTsFile(
  filePath: string
): Promise<CoverageThresholds> {
  const { stdout } = await runProcess("npx", [
    "ts-node",
    "-e",
    `try {
      const config = require('${filePath}');
      const thresholds = config.coverageThreshold && config.coverageThreshold.global || {};
      console.log(JSON.stringify({
        branches: thresholds.branches || 80,
        functions: thresholds.functions || 80,
        lines: thresholds.lines || 80,
        statements: thresholds.statements || 80
      }));
    } catch(e) {
      console.log(JSON.stringify({
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }));
    }`,
  ]);

  return JSON.parse(stdout);
}

/**
 * Extract thresholds from JSON config file
 */
async function extractThresholdsFromJsonFile(
  filePath: string
): Promise<CoverageThresholds> {
  const { stdout } = await runProcess("node", [
    "-e",
    `try {
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('${filePath}', 'utf8'));
      const thresholds = config.coverageThreshold && config.coverageThreshold.global || {};
      console.log(JSON.stringify({
        branches: thresholds.branches || 80,
        functions: thresholds.functions || 80,
        lines: thresholds.lines || 80,
        statements: thresholds.statements || 80
      }));
    } catch(e) {
      console.log(JSON.stringify({
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }));
    }`,
  ]);

  return JSON.parse(stdout);
}

/**
 * Extract thresholds from package.json
 */
async function extractThresholdsFromPackageJson(
  filePath: string
): Promise<CoverageThresholds> {
  const { stdout } = await runProcess("node", [
    "-e",
    `try {
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('${filePath}', 'utf8'));
      const thresholds = pkg.jest && pkg.jest.coverageThreshold && pkg.jest.coverageThreshold.global || {};
      console.log(JSON.stringify({
        branches: thresholds.branches || 80,
        functions: thresholds.functions || 80,
        lines: thresholds.lines || 80,
        statements: thresholds.statements || 80
      }));
    } catch(e) {
      console.log(JSON.stringify({
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }));
    }`,
  ]);

  return JSON.parse(stdout);
}

/**
 * List all tests using Jest's --listTests option
 */
async function listAllTests(workingDir: string): Promise<string[]> {
  const tempFile = path.join(workingDir, "all-tests.txt");

  // Run Jest with --listTests flag
  await runProcess("npx", ["jest", "--listTests"], workingDir, tempFile);

  // Read the list of tests
  const testsContent = await fs.readFile(tempFile, "utf8");
  const tests = testsContent.split("\n").filter(Boolean);

  return tests;
}

/**
 * Split tests into multiple shards
 */
function splitIntoShards(
  tests: string[],
  numShards: number,
  workingDir: string
): ShardInfo[] {
  const testsPerShard = Math.ceil(tests.length / numShards);
  const shards: ShardInfo[] = [];

  for (let i = 0; i < numShards; i++) {
    const startIdx = i * testsPerShard;
    const endIdx = Math.min(startIdx + testsPerShard, tests.length);

    if (startIdx >= tests.length) {
      break; // No more tests to assign
    }

    const shardTests = tests.slice(startIdx, endIdx);
    const shardFilePath = path.join(workingDir, `shard-${i + 1}`);

    // Write tests to shard file
    fs.writeFile(shardFilePath, shardTests.join("\n"));

    shards.push({
      id: i + 1,
      filePath: shardFilePath,
      testCount: shardTests.length,
    });
  }

  return shards;
}

/**
 * Merge coverage files from all shards
 */
async function mergeCoverageFiles(workingDir: string): Promise<boolean> {
  const outputPath = path.join(
    workingDir,
    ".nyc_output",
    "coverage-final.json"
  );
  const coverageGlob = path.join(
    workingDir,
    "final-coverage-files",
    "*",
    "coverage-final.json"
  );

  try {
    // Try using istanbul-merge first
    const { success: mergeSuccess } = await runProcess(
      "npx",
      ["istanbul-merge", "--out", outputPath, coverageGlob],
      workingDir
    );

    if (mergeSuccess && existsSync(outputPath)) {
      console.log("Coverage file created successfully");
      return true;
    }

    // Fallback to nyc merge if istanbul-merge fails
    console.log(
      "ERROR: Coverage file was not created! Trying alternate merge method..."
    );

    const { success: nycSuccess } = await runProcess(
      "npx",
      [
        "nyc",
        "merge",
        path.join(workingDir, "final-coverage-files"),
        outputPath,
      ],
      workingDir
    );

    if (nycSuccess && existsSync(outputPath)) {
      console.log("Coverage file created successfully with fallback method");
      return true;
    }

    console.log(
      "ERROR: Both merge methods failed. No coverage data available."
    );
    return false;
  } catch (error) {
    console.error("Error merging coverage files:", error);
    return false;
  }
}

/**
 * Generate coverage reports
 */
async function generateCoverageReports(workingDir: string): Promise<void> {
  await runProcess(
    "npx",
    [
      "nyc",
      "report",
      "--reporter=html",
      "--reporter=text",
      "--reporter=text-summary",
    ],
    workingDir
  );
}

/**
 * Validate coverage against thresholds
 */
async function validateCoverageThresholds(
  workingDir: string,
  thresholds: CoverageThresholds
): Promise<boolean> {
  const coverageFile = path.join(
    workingDir,
    ".nyc_output",
    "coverage-final.json"
  );

  if (!existsSync(coverageFile)) {
    console.log(
      "ERROR: Cannot validate thresholds - no coverage data available"
    );
    return false;
  }

  const { success, stdout } = await runProcess(
    "npx",
    [
      "nyc",
      "check-coverage",
      `--lines=${thresholds.lines}`,
      `--functions=${thresholds.functions}`,
      `--branches=${thresholds.branches}`,
      `--statements=${thresholds.statements}`,
    ],
    workingDir
  );

  if (!success) {
    console.log(
      `FAILURE: Coverage is below the threshold of branches=${thresholds.branches}%, functions=${thresholds.functions}%, lines=${thresholds.lines}%, statements=${thresholds.statements}%`
    );
    console.log(stdout);
    return false;
  }

  console.log("SUCCESS: Coverage meets or exceeds the thresholds");
  return true;
}

/**
 * Extract failed tests from log files
 */
async function extractFailedTestsFromLog(logFile: string): Promise<string[]> {
  try {
    const logContent = await fs.readFile(logFile, "utf8");
    const lines = logContent.split("\n");
    const failedTests: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes("FAIL ")) {
        const testFile = line.replace(/.*FAIL\s+/, "").trim();

        // Look for test description (lines with ● that aren't console output)
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.includes("●") && !nextLine.includes("Console")) {
            const testDesc = nextLine.replace(/.*●\s+/, "").trim();
            failedTests.push(`${testFile} - ${testDesc}`);
            break;
          }
        }
      }
    }

    return failedTests;
  } catch (error) {
    console.error("Error extracting failed tests:", error);
    return [];
  }
}

/**
 * Extract and combine all failed tests from shard results
 */
function extractFailedTests(shardResults: ShardInfo[]): string[] {
  const allFailedTests: string[] = [];

  shardResults.forEach((shard) => {
    if (shard.failedTests && shard.failedTests.length > 0) {
      allFailedTests.push(...shard.failedTests);
    }
  });

  // Remove duplicates and sort
  return [...new Set(allFailedTests)].sort();
}

/**
 * Aggregate test statistics from all shards
 */
function aggregateTestStats(shardResults: ShardInfo[]): {
  suitesPassed: number;
  suitesFailed: number;
  testsPassed: number;
  testsFailed: number;
} {
  return shardResults.reduce(
    (acc, shard) => {
      if (shard.testStats) {
        return {
          suitesPassed: acc.suitesPassed + (shard.testStats.suitesPassed || 0),
          suitesFailed: acc.suitesFailed + (shard.testStats.suitesFailed || 0),
          testsPassed: acc.testsPassed + (shard.testStats.testsPassed || 0),
          testsFailed: acc.testsFailed + (shard.testStats.testsFailed || 0),
        };
      }
      return acc;
    },
    { suitesPassed: 0, suitesFailed: 0, testsPassed: 0, testsFailed: 0 }
  );
}

/**
 * Run a child process and return its output
 */
async function runProcess(
  command: string,
  args: string[],
  cwd?: string,
  outputToFile?: string
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { cwd, shell: true });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on("close", async (code) => {
      if (outputToFile) {
        try {
          await fs.writeFile(outputToFile, stdout);
        } catch (error) {
          console.error(`Error writing to file ${outputToFile}:`, error);
        }
      }

      resolve({
        success: code === 0,
        stdout,
        stderr,
      });
    });
  });
}
