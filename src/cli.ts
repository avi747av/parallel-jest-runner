#!/usr/bin/env node
import { program } from "commander";
import { runParallelTests } from "./runner";
import { RunnerConfig } from "./types";
import path from "path";
import fs from "fs";

/**
 * Start the parallel Jest runner from command line
 */
export async function startParallelJestRunner(): Promise<void> {
  program
    .name("parallel-jest-runner")
    .description("Run Jest tests in parallel shards for faster execution")
    .version(getPackageVersion())
    .option(
      "-s, --shards <number>",
      "Number of shards to split tests into",
      "12"
    )
    .option(
      "-m, --memory <number>",
      "Memory size in MB for Node process",
      "12288"
    )
    .option("-w, --workers <number>", "Max workers per shard", "1")
    .option("-d, --dir <path>", "Working directory", process.cwd())
    .option("-a, --args <string>", "Additional Jest arguments", "")
    .parse(process.argv);

  const options = program.opts();

  const config: RunnerConfig = {
    numShards: parseInt(options.shards, 10),
    memorySize: parseInt(options.memory, 10),
    maxWorkers: options.workers,
    workingDir: options.dir,
    additionalJestArgs: options.args ? options.args.split(" ") : [],
  };

  try {
    const result = await runParallelTests(config);

    // Exit with appropriate code
    if (!result.success || !result.coverageMeetsThreshold) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Error running tests:", error);
    process.exit(1);
  }
}

/**
 * Get package version from package.json
 */
function getPackageVersion(): string {
  try {
    const packageJsonPath = path.resolve(__dirname, "../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return packageJson.version || "0.0.0";
  } catch (error) {
    return "0.0.0";
  }
}

// Run if directly executed
if (require.main === module) {
  startParallelJestRunner();
}
