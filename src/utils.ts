import fs from "fs/promises";
import { existsSync } from "fs";
import { ShardInfo } from "./types";

/**
 * Create a directory if it doesn't exist
 */
export async function mkdir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Extract test statistics from log file
 */
export async function extractStats(logFile: string): Promise<{
  suites: string;
  tests: string;
  time: string;
}> {
  try {
    const logContent = await fs.readFile(logFile, "utf8");
    const lines = logContent.split("\n");

    const stats = {
      suites: "",
      tests: "",
      time: "",
    };

    // Find the last occurrence of each stat line
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];

      if (line.includes("Test Suites:") && !stats.suites) {
        stats.suites = line.trim();
      } else if (line.includes("Tests:") && !stats.tests) {
        stats.tests = line.trim();
      } else if (line.includes("Time:") && !stats.time) {
        stats.time = line.trim();
      }

      // Stop searching once we have all stats
      if (stats.suites && stats.tests && stats.time) {
        break;
      }
    }

    return stats;
  } catch (error) {
    console.error("Error extracting stats:", error);
    return { suites: "", tests: "", time: "" };
  }
}

/**
 * Parse test statistics from text lines
 */
export function parseTestStats(stats: {
  suites: string;
  tests: string;
  time: string;
}): {
  suitesPassed: number;
  suitesFailed: number;
  testsPassed: number;
  testsFailed: number;
} {
  const parsed = {
    suitesPassed: 0,
    suitesFailed: 0,
    testsPassed: 0,
    testsFailed: 0,
  };

  // Parse suites statistics
  const suitesMatch = stats.suites.match(/(\d+)\s+failed/) || [];
  if (suitesMatch[1]) {
    parsed.suitesFailed = parseInt(suitesMatch[1], 10);
  }

  const suitesPassMatch = stats.suites.match(/(\d+)\s+passed/) || [];
  if (suitesPassMatch[1]) {
    parsed.suitesPassed = parseInt(suitesPassMatch[1], 10);
  }

  // Parse tests statistics
  const testsMatch = stats.tests.match(/(\d+)\s+failed/) || [];
  if (testsMatch[1]) {
    parsed.testsFailed = parseInt(testsMatch[1], 10);
  }

  const testsPassMatch = stats.tests.match(/(\d+)\s+passed/) || [];
  if (testsPassMatch[1]) {
    parsed.testsPassed = parseInt(testsPassMatch[1], 10);
  }

  return parsed;
}

/**
 * Merge statistics from multiple shards
 */
export function mergeShardStats(shards: ShardInfo[]): {
  suitesPassed: number;
  suitesFailed: number;
  testsPassed: number;
  testsFailed: number;
} {
  return shards.reduce(
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
