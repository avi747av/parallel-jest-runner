"use strict";
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
exports.__esModule = true;
exports.mergeShardStats = exports.parseTestStats = exports.extractStats = exports.mkdir = void 0;
var promises_1 = require("fs/promises");
var fs_1 = require("fs");
/**
 * Create a directory if it doesn't exist
 */
function mkdir(dirPath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!(0, fs_1.existsSync)(dirPath)) return [3 /*break*/, 2];
                    return [4 /*yield*/, promises_1["default"].mkdir(dirPath, { recursive: true })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
exports.mkdir = mkdir;
/**
 * Extract test statistics from log file
 */
function extractStats(logFile) {
    return __awaiter(this, void 0, void 0, function () {
        var logContent, lines, stats, i, line, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promises_1["default"].readFile(logFile, "utf8")];
                case 1:
                    logContent = _a.sent();
                    lines = logContent.split("\n");
                    stats = {
                        suites: "",
                        tests: "",
                        time: ""
                    };
                    // Find the last occurrence of each stat line
                    for (i = lines.length - 1; i >= 0; i--) {
                        line = lines[i];
                        if (line.includes("Test Suites:") && !stats.suites) {
                            stats.suites = line.trim();
                        }
                        else if (line.includes("Tests:") && !stats.tests) {
                            stats.tests = line.trim();
                        }
                        else if (line.includes("Time:") && !stats.time) {
                            stats.time = line.trim();
                        }
                        // Stop searching once we have all stats
                        if (stats.suites && stats.tests && stats.time) {
                            break;
                        }
                    }
                    return [2 /*return*/, stats];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error extracting stats:", error_1);
                    return [2 /*return*/, { suites: "", tests: "", time: "" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.extractStats = extractStats;
/**
 * Parse test statistics from text lines
 */
function parseTestStats(stats) {
    var parsed = {
        suitesPassed: 0,
        suitesFailed: 0,
        testsPassed: 0,
        testsFailed: 0
    };
    // Parse suites statistics
    var suitesMatch = stats.suites.match(/(\d+)\s+failed/) || [];
    if (suitesMatch[1]) {
        parsed.suitesFailed = parseInt(suitesMatch[1], 10);
    }
    var suitesPassMatch = stats.suites.match(/(\d+)\s+passed/) || [];
    if (suitesPassMatch[1]) {
        parsed.suitesPassed = parseInt(suitesPassMatch[1], 10);
    }
    // Parse tests statistics
    var testsMatch = stats.tests.match(/(\d+)\s+failed/) || [];
    if (testsMatch[1]) {
        parsed.testsFailed = parseInt(testsMatch[1], 10);
    }
    var testsPassMatch = stats.tests.match(/(\d+)\s+passed/) || [];
    if (testsPassMatch[1]) {
        parsed.testsPassed = parseInt(testsPassMatch[1], 10);
    }
    return parsed;
}
exports.parseTestStats = parseTestStats;
/**
 * Merge statistics from multiple shards
 */
function mergeShardStats(shards) {
    return shards.reduce(function (acc, shard) {
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
exports.mergeShardStats = mergeShardStats;
