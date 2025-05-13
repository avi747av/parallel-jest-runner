"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.runParallelTests = void 0;
var promises_1 = require("fs/promises");
var fs_1 = require("fs");
var path_1 = require("path");
var child_process_1 = require("child_process");
var utils_1 = require("./utils");
/**
 * Run Jest tests in parallel shards
 */
function runParallelTests(config) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, numShards, _b, memorySize, _c, maxWorkers, _d, workingDir, _e, additionalJestArgs, dirs, coverageThresholds, allTests, shards, testStartTime, shardResults, testEndTime, executionTimeSeconds, testsSucceeded, coverageMergeSuccess, coverageMeetsThreshold, failedTests, stats, finalMessage;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _a = config.numShards, numShards = _a === void 0 ? 12 : _a, _b = config.memorySize, memorySize = _b === void 0 ? 12288 : _b, _c = config.maxWorkers, maxWorkers = _c === void 0 ? 1 : _c, _d = config.workingDir, workingDir = _d === void 0 ? process.cwd() : _d, _e = config.additionalJestArgs, additionalJestArgs = _e === void 0 ? [] : _e;
                    // Set up environment
                    process.env.NODE_OPTIONS = "--max-old-space-size=".concat(memorySize);
                    dirs = [
                        "final-coverage-files",
                        ".nyc_output",
                        "coverage",
                        "logs",
                        "tmp",
                    ];
                    return [4 /*yield*/, Promise.all(dirs.map(function (dir) { return (0, utils_1.mkdir)(path_1["default"].join(workingDir, dir)); }))];
                case 1:
                    _f.sent();
                    return [4 /*yield*/, extractCoverageThresholds(workingDir, config.coverageThresholds)];
                case 2:
                    coverageThresholds = _f.sent();
                    console.log("Using coverage thresholds: branches=".concat(coverageThresholds.branches, "%, functions=").concat(coverageThresholds.functions, "%, lines=").concat(coverageThresholds.lines, "%, statements=").concat(coverageThresholds.statements, "%"));
                    // List all tests
                    console.log("Listing all tests...");
                    return [4 /*yield*/, listAllTests(workingDir)];
                case 3:
                    allTests = _f.sent();
                    console.log("Found ".concat(allTests.length, " tests to run"));
                    shards = splitIntoShards(allTests, numShards, workingDir);
                    console.log("Splitting into ".concat(numShards, " shards with approximately ").concat(Math.ceil(allTests.length / numShards), " tests per shard"));
                    testStartTime = Date.now();
                    // Run all shards in parallel
                    console.log("Starting parallel test execution...");
                    return [4 /*yield*/, Promise.all(shards.map(function (shard) {
                            return runTestShard(shard, maxWorkers, workingDir, additionalJestArgs);
                        }))];
                case 4:
                    shardResults = _f.sent();
                    console.log("All shards have completed execution");
                    testEndTime = Date.now();
                    executionTimeSeconds = Math.round((testEndTime - testStartTime) / 1000);
                    testsSucceeded = shardResults.every(function (result) { return result.success; });
                    if (!testsSucceeded) {
                        console.log("⚠️ Some tests failed during execution");
                    }
                    else {
                        console.log("✅ All tests passed");
                    }
                    // Merge coverage files
                    console.log("Merging coverage files...");
                    return [4 /*yield*/, mergeCoverageFiles(workingDir)];
                case 5:
                    coverageMergeSuccess = _f.sent();
                    // Generate coverage reports
                    console.log("Generating coverage reports...");
                    return [4 /*yield*/, generateCoverageReports(workingDir)];
                case 6:
                    _f.sent();
                    // Validate coverage thresholds
                    console.log("Validating coverage thresholds...");
                    return [4 /*yield*/, validateCoverageThresholds(workingDir, coverageThresholds)];
                case 7:
                    coverageMeetsThreshold = _f.sent();
                    failedTests = extractFailedTests(shardResults);
                    if (failedTests.length > 0) {
                        console.log("============================= CONCISE FAILURE SUMMARY ==========================");
                        failedTests.forEach(function (test) { return console.log(test); });
                        console.log("===============================================================================");
                    }
                    stats = aggregateTestStats(shardResults);
                    // Display test summary
                    console.log("============================= TEST SUMMARY =====================================");
                    console.log("Test Suites: ".concat(stats.suitesFailed, " failed, ").concat(stats.suitesPassed, " passed, ").concat(stats.suitesFailed + stats.suitesPassed, " total"));
                    console.log("Tests:       ".concat(stats.testsFailed, " failed, ").concat(stats.testsPassed, " passed, ").concat(stats.testsFailed + stats.testsPassed, " total"));
                    console.log("Snapshots:   0 total");
                    console.log("Time:        ".concat(executionTimeSeconds, " s"));
                    console.log("===============================================================================");
                    if (!testsSucceeded) {
                        finalMessage = "⚠️ Build failed because tests failed";
                    }
                    else if (!coverageMeetsThreshold) {
                        finalMessage = "⚠️ Build failed because coverage is below threshold";
                    }
                    else {
                        finalMessage = "✅ All tests passed and coverage meets threshold";
                    }
                    console.log(finalMessage);
                    return [2 /*return*/, {
                            success: testsSucceeded,
                            testSuitesPassed: stats.suitesPassed,
                            testSuitesFailed: stats.suitesFailed,
                            testsPassed: stats.testsPassed,
                            testsFailed: stats.testsFailed,
                            executionTimeSeconds: executionTimeSeconds,
                            coverageMeetsThreshold: coverageMeetsThreshold,
                            failedTests: failedTests.length > 0 ? failedTests : undefined
                        }];
            }
        });
    });
}
exports.runParallelTests = runParallelTests;
/**
 * Run a single test shard and collect results
 */
function runTestShard(shard, maxWorkers, workingDir, additionalJestArgs) {
    if (additionalJestArgs === void 0) { additionalJestArgs = []; }
    return __awaiter(this, void 0, void 0, function () {
        var startTime, logFile, testsInShard, jestArgs, _a, success, stdout, stderr, testStats, hasTestFailures, failedTests, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("Starting Shard ".concat(shard.id, " with ").concat(shard.testCount, " tests at ").concat(new Date().toLocaleTimeString()));
                    startTime = Date.now();
                    logFile = path_1["default"].join(workingDir, "logs", "shard-".concat(shard.id, ".log"));
                    return [4 /*yield*/, promises_1["default"].readFile(shard.filePath, "utf8")];
                case 1:
                    testsInShard = (_c.sent())
                        .split("\n")
                        .filter(Boolean);
                    jestArgs = __spreadArray(__spreadArray(__spreadArray([
                        "jest",
                        "--runTestsByPath"
                    ], testsInShard, true), [
                        "--maxWorkers=".concat(maxWorkers),
                        "--coverage",
                        "--json",
                        "--coverageReporters=json",
                        "--coverageDirectory=./final-coverage-files/coverage-".concat(shard.id)
                    ], false), additionalJestArgs, true);
                    return [4 /*yield*/, runProcess("npx", jestArgs, workingDir)];
                case 2:
                    _a = _c.sent(), success = _a.success, stdout = _a.stdout, stderr = _a.stderr;
                    // Save log output to file
                    return [4 /*yield*/, promises_1["default"].writeFile(logFile, stdout + stderr)];
                case 3:
                    // Save log output to file
                    _c.sent();
                    return [4 /*yield*/, (0, utils_1.extractStats)(logFile)];
                case 4:
                    testStats = _c.sent();
                    hasTestFailures = stdout.includes("FAIL ");
                    if (!hasTestFailures) return [3 /*break*/, 6];
                    return [4 /*yield*/, promises_1["default"].writeFile(path_1["default"].join(workingDir, "tmp", "failed-".concat(shard.id)), "")];
                case 5:
                    _c.sent();
                    console.log("\u274C Shard ".concat(shard.id, " FAILED with test failures at ").concat(new Date().toLocaleTimeString()));
                    return [3 /*break*/, 7];
                case 6:
                    console.log("\u2705 Shard ".concat(shard.id, " SUCCEEDED at ").concat(new Date().toLocaleTimeString()));
                    _c.label = 7;
                case 7:
                    if (!hasTestFailures) return [3 /*break*/, 9];
                    return [4 /*yield*/, extractFailedTestsFromLog(logFile)];
                case 8:
                    _b = _c.sent();
                    return [3 /*break*/, 10];
                case 9:
                    _b = [];
                    _c.label = 10;
                case 10:
                    failedTests = _b;
                    return [2 /*return*/, __assign(__assign({}, shard), { success: !hasTestFailures, testStats: (0, utils_1.parseTestStats)(testStats), failedTests: failedTests, executionTimeMs: Date.now() - startTime })];
            }
        });
    });
}
/**
 * Extract coverage thresholds from Jest config
 */
function extractCoverageThresholds(workingDir, configThresholds) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function () {
        var possibleConfigFiles, configFile, _i, possibleConfigFiles_1, file, filePath, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    // If thresholds are provided in config, use them
                    if (configThresholds) {
                        return [2 /*return*/, {
                                branches: (_a = configThresholds.branches) !== null && _a !== void 0 ? _a : 80,
                                functions: (_b = configThresholds.functions) !== null && _b !== void 0 ? _b : 80,
                                lines: (_c = configThresholds.lines) !== null && _c !== void 0 ? _c : 80,
                                statements: (_d = configThresholds.statements) !== null && _d !== void 0 ? _d : 80
                            }];
                    }
                    console.log("Extracting coverage thresholds from Jest config...");
                    possibleConfigFiles = [
                        "jest.config.js",
                        "jest.config.ts",
                        "jest.config.json",
                        "package.json",
                    ];
                    for (_i = 0, possibleConfigFiles_1 = possibleConfigFiles; _i < possibleConfigFiles_1.length; _i++) {
                        file = possibleConfigFiles_1[_i];
                        filePath = path_1["default"].join(workingDir, file);
                        if ((0, fs_1.existsSync)(filePath)) {
                            configFile = file;
                            break;
                        }
                    }
                    if (!configFile) {
                        console.log("Warning: Could not find Jest config file. Using default threshold of 80%.");
                        return [2 /*return*/, {
                                branches: 80,
                                functions: 80,
                                lines: 80,
                                statements: 80
                            }];
                    }
                    console.log("Found Jest config file: ".concat(configFile));
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 10, , 11]);
                    if (!configFile.endsWith(".js")) return [3 /*break*/, 3];
                    return [4 /*yield*/, extractThresholdsFromJsFile(path_1["default"].join(workingDir, configFile))];
                case 2: return [2 /*return*/, _e.sent()];
                case 3:
                    if (!configFile.endsWith(".ts")) return [3 /*break*/, 5];
                    return [4 /*yield*/, extractThresholdsFromTsFile(path_1["default"].join(workingDir, configFile))];
                case 4: return [2 /*return*/, _e.sent()];
                case 5:
                    if (!configFile.endsWith(".json")) return [3 /*break*/, 7];
                    return [4 /*yield*/, extractThresholdsFromJsonFile(path_1["default"].join(workingDir, configFile))];
                case 6: return [2 /*return*/, _e.sent()];
                case 7:
                    if (!(configFile === "package.json")) return [3 /*break*/, 9];
                    return [4 /*yield*/, extractThresholdsFromPackageJson(path_1["default"].join(workingDir, configFile))];
                case 8: return [2 /*return*/, _e.sent()];
                case 9: return [3 /*break*/, 11];
                case 10:
                    error_1 = _e.sent();
                    console.log("Error extracting thresholds: ".concat(error_1));
                    return [3 /*break*/, 11];
                case 11:
                    // Default to 80% if extraction fails
                    console.log("Using default threshold of 80%.");
                    return [2 /*return*/, {
                            branches: 80,
                            functions: 80,
                            lines: 80,
                            statements: 80
                        }];
            }
        });
    });
}
/**
 * Extract thresholds from JavaScript config file
 */
function extractThresholdsFromJsFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var stdout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runProcess("node", [
                        "-e",
                        "try {\n      const config = require('".concat(filePath, "');\n      const thresholds = config.coverageThreshold && config.coverageThreshold.global || {};\n      console.log(JSON.stringify({\n        branches: thresholds.branches || 80,\n        functions: thresholds.functions || 80,\n        lines: thresholds.lines || 80,\n        statements: thresholds.statements || 80\n      }));\n    } catch(e) {\n      console.log(JSON.stringify({\n        branches: 80,\n        functions: 80,\n        lines: 80,\n        statements: 80\n      }));\n    }"),
                    ])];
                case 1:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, JSON.parse(stdout)];
            }
        });
    });
}
/**
 * Extract thresholds from TypeScript config file
 */
function extractThresholdsFromTsFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var stdout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runProcess("npx", [
                        "ts-node",
                        "-e",
                        "try {\n      const config = require('".concat(filePath, "');\n      const thresholds = config.coverageThreshold && config.coverageThreshold.global || {};\n      console.log(JSON.stringify({\n        branches: thresholds.branches || 80,\n        functions: thresholds.functions || 80,\n        lines: thresholds.lines || 80,\n        statements: thresholds.statements || 80\n      }));\n    } catch(e) {\n      console.log(JSON.stringify({\n        branches: 80,\n        functions: 80,\n        lines: 80,\n        statements: 80\n      }));\n    }"),
                    ])];
                case 1:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, JSON.parse(stdout)];
            }
        });
    });
}
/**
 * Extract thresholds from JSON config file
 */
function extractThresholdsFromJsonFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var stdout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runProcess("node", [
                        "-e",
                        "try {\n      const fs = require('fs');\n      const config = JSON.parse(fs.readFileSync('".concat(filePath, "', 'utf8'));\n      const thresholds = config.coverageThreshold && config.coverageThreshold.global || {};\n      console.log(JSON.stringify({\n        branches: thresholds.branches || 80,\n        functions: thresholds.functions || 80,\n        lines: thresholds.lines || 80,\n        statements: thresholds.statements || 80\n      }));\n    } catch(e) {\n      console.log(JSON.stringify({\n        branches: 80,\n        functions: 80,\n        lines: 80,\n        statements: 80\n      }));\n    }"),
                    ])];
                case 1:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, JSON.parse(stdout)];
            }
        });
    });
}
/**
 * Extract thresholds from package.json
 */
function extractThresholdsFromPackageJson(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var stdout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runProcess("node", [
                        "-e",
                        "try {\n      const fs = require('fs');\n      const pkg = JSON.parse(fs.readFileSync('".concat(filePath, "', 'utf8'));\n      const thresholds = pkg.jest && pkg.jest.coverageThreshold && pkg.jest.coverageThreshold.global || {};\n      console.log(JSON.stringify({\n        branches: thresholds.branches || 80,\n        functions: thresholds.functions || 80,\n        lines: thresholds.lines || 80,\n        statements: thresholds.statements || 80\n      }));\n    } catch(e) {\n      console.log(JSON.stringify({\n        branches: 80,\n        functions: 80,\n        lines: 80,\n        statements: 80\n      }));\n    }"),
                    ])];
                case 1:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, JSON.parse(stdout)];
            }
        });
    });
}
/**
 * List all tests using Jest's --listTests option
 */
function listAllTests(workingDir) {
    return __awaiter(this, void 0, void 0, function () {
        var tempFile, testsContent, tests;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tempFile = path_1["default"].join(workingDir, "all-tests.txt");
                    // Run Jest with --listTests flag
                    return [4 /*yield*/, runProcess("npx", ["jest", "--listTests"], workingDir, tempFile)];
                case 1:
                    // Run Jest with --listTests flag
                    _a.sent();
                    return [4 /*yield*/, promises_1["default"].readFile(tempFile, "utf8")];
                case 2:
                    testsContent = _a.sent();
                    tests = testsContent.split("\n").filter(Boolean);
                    return [2 /*return*/, tests];
            }
        });
    });
}
/**
 * Split tests into multiple shards
 */
function splitIntoShards(tests, numShards, workingDir) {
    var testsPerShard = Math.ceil(tests.length / numShards);
    var shards = [];
    for (var i = 0; i < numShards; i++) {
        var startIdx = i * testsPerShard;
        var endIdx = Math.min(startIdx + testsPerShard, tests.length);
        if (startIdx >= tests.length) {
            break; // No more tests to assign
        }
        var shardTests = tests.slice(startIdx, endIdx);
        var shardFilePath = path_1["default"].join(workingDir, "shard-".concat(i + 1));
        // Write tests to shard file
        promises_1["default"].writeFile(shardFilePath, shardTests.join("\n"));
        shards.push({
            id: i + 1,
            filePath: shardFilePath,
            testCount: shardTests.length
        });
    }
    return shards;
}
/**
 * Merge coverage files from all shards
 */
function mergeCoverageFiles(workingDir) {
    return __awaiter(this, void 0, void 0, function () {
        var outputPath, coverageGlob, mergeSuccess, nycSuccess, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    outputPath = path_1["default"].join(workingDir, ".nyc_output", "coverage-final.json");
                    coverageGlob = path_1["default"].join(workingDir, "final-coverage-files", "*", "coverage-final.json");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, runProcess("npx", ["istanbul-merge", "--out", outputPath, coverageGlob], workingDir)];
                case 2:
                    mergeSuccess = (_a.sent()).success;
                    if (mergeSuccess && (0, fs_1.existsSync)(outputPath)) {
                        console.log("Coverage file created successfully");
                        return [2 /*return*/, true];
                    }
                    // Fallback to nyc merge if istanbul-merge fails
                    console.log("ERROR: Coverage file was not created! Trying alternate merge method...");
                    return [4 /*yield*/, runProcess("npx", [
                            "nyc",
                            "merge",
                            path_1["default"].join(workingDir, "final-coverage-files"),
                            outputPath,
                        ], workingDir)];
                case 3:
                    nycSuccess = (_a.sent()).success;
                    if (nycSuccess && (0, fs_1.existsSync)(outputPath)) {
                        console.log("Coverage file created successfully with fallback method");
                        return [2 /*return*/, true];
                    }
                    console.log("ERROR: Both merge methods failed. No coverage data available.");
                    return [2 /*return*/, false];
                case 4:
                    error_2 = _a.sent();
                    console.error("Error merging coverage files:", error_2);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Generate coverage reports
 */
function generateCoverageReports(workingDir) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runProcess("npx", [
                        "nyc",
                        "report",
                        "--reporter=html",
                        "--reporter=text",
                        "--reporter=text-summary",
                    ], workingDir)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Validate coverage against thresholds
 */
function validateCoverageThresholds(workingDir, thresholds) {
    return __awaiter(this, void 0, void 0, function () {
        var coverageFile, _a, success, stdout;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    coverageFile = path_1["default"].join(workingDir, ".nyc_output", "coverage-final.json");
                    if (!(0, fs_1.existsSync)(coverageFile)) {
                        console.log("ERROR: Cannot validate thresholds - no coverage data available");
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, runProcess("npx", [
                            "nyc",
                            "check-coverage",
                            "--lines=".concat(thresholds.lines),
                            "--functions=".concat(thresholds.functions),
                            "--branches=".concat(thresholds.branches),
                            "--statements=".concat(thresholds.statements),
                        ], workingDir)];
                case 1:
                    _a = _b.sent(), success = _a.success, stdout = _a.stdout;
                    if (!success) {
                        console.log("FAILURE: Coverage is below the threshold of branches=".concat(thresholds.branches, "%, functions=").concat(thresholds.functions, "%, lines=").concat(thresholds.lines, "%, statements=").concat(thresholds.statements, "%"));
                        console.log(stdout);
                        return [2 /*return*/, false];
                    }
                    console.log("SUCCESS: Coverage meets or exceeds the thresholds");
                    return [2 /*return*/, true];
            }
        });
    });
}
/**
 * Extract failed tests from log files
 */
function extractFailedTestsFromLog(logFile) {
    return __awaiter(this, void 0, void 0, function () {
        var logContent, lines, failedTests, i, line, testFile, j, nextLine, testDesc, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promises_1["default"].readFile(logFile, "utf8")];
                case 1:
                    logContent = _a.sent();
                    lines = logContent.split("\n");
                    failedTests = [];
                    for (i = 0; i < lines.length; i++) {
                        line = lines[i];
                        if (line.includes("FAIL ")) {
                            testFile = line.replace(/.*FAIL\s+/, "").trim();
                            // Look for test description (lines with ● that aren't console output)
                            for (j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                                nextLine = lines[j];
                                if (nextLine.includes("●") && !nextLine.includes("Console")) {
                                    testDesc = nextLine.replace(/.*●\s+/, "").trim();
                                    failedTests.push("".concat(testFile, " - ").concat(testDesc));
                                    break;
                                }
                            }
                        }
                    }
                    return [2 /*return*/, failedTests];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error extracting failed tests:", error_3);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Extract and combine all failed tests from shard results
 */
function extractFailedTests(shardResults) {
    var allFailedTests = [];
    shardResults.forEach(function (shard) {
        if (shard.failedTests && shard.failedTests.length > 0) {
            allFailedTests.push.apply(allFailedTests, shard.failedTests);
        }
    });
    // Remove duplicates and sort
    return __spreadArray([], new Set(allFailedTests), true).sort();
}
/**
 * Aggregate test statistics from all shards
 */
function aggregateTestStats(shardResults) {
    return shardResults.reduce(function (acc, shard) {
        if (shard.testStats) {
            return {
                suitesPassed: acc.suitesPassed + (shard.testStats.suitesPassed || 0),
                suitesFailed: acc.suitesFailed + (shard.testStats.suitesFailed || 0),
                testsPassed: acc.testsPassed + (shard.testStats.testsPassed || 0),
                testsFailed: acc.testsFailed + (shard.testStats.testsFailed || 0)
            };
        }
        return acc;
    }, { suitesPassed: 0, suitesFailed: 0, testsPassed: 0, testsFailed: 0 });
}
/**
 * Run a child process and return its output
 */
function runProcess(command, args, cwd, outputToFile) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var proc = (0, child_process_1.spawn)(command, args, { cwd: cwd, shell: true });
                    var stdout = "";
                    var stderr = "";
                    proc.stdout.on("data", function (data) {
                        stdout += data.toString();
                        process.stdout.write(data);
                    });
                    proc.stderr.on("data", function (data) {
                        stderr += data.toString();
                        process.stderr.write(data);
                    });
                    proc.on("close", function (code) { return __awaiter(_this, void 0, void 0, function () {
                        var error_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!outputToFile) return [3 /*break*/, 4];
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, promises_1["default"].writeFile(outputToFile, stdout)];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_4 = _a.sent();
                                    console.error("Error writing to file ".concat(outputToFile, ":"), error_4);
                                    return [3 /*break*/, 4];
                                case 4:
                                    resolve({
                                        success: code === 0,
                                        stdout: stdout,
                                        stderr: stderr
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                })];
        });
    });
}
