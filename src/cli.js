#!/usr/bin/env node
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
exports.startParallelJestRunner = void 0;
var commander_1 = require("commander");
var runner_1 = require("./runner");
var path_1 = require("path");
var fs_1 = require("fs");
/**
 * Start the parallel Jest runner from command line
 */
function startParallelJestRunner() {
    return __awaiter(this, void 0, void 0, function () {
        var options, config, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    commander_1.program
                        .name("parallel-jest-runner")
                        .description("Run Jest tests in parallel shards for faster execution")
                        .version(getPackageVersion())
                        .option("-s, --shards <number>", "Number of shards to split tests into", "12")
                        .option("-m, --memory <number>", "Memory size in MB for Node process", "12288")
                        .option("-w, --workers <number>", "Max workers per shard", "1")
                        .option("-d, --dir <path>", "Working directory", process.cwd())
                        .option("-a, --args <string>", "Additional Jest arguments", "")
                        .parse(process.argv);
                    options = commander_1.program.opts();
                    config = {
                        numShards: parseInt(options.shards, 10),
                        memorySize: parseInt(options.memory, 10),
                        maxWorkers: options.workers,
                        workingDir: options.dir,
                        additionalJestArgs: options.args ? options.args.split(" ") : []
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, runner_1.runParallelTests)(config)];
                case 2:
                    result = _a.sent();
                    // Exit with appropriate code
                    if (!result.success || !result.coverageMeetsThreshold) {
                        process.exit(1);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error running tests:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.startParallelJestRunner = startParallelJestRunner;
/**
 * Get package version from package.json
 */
function getPackageVersion() {
    try {
        var packageJsonPath = path_1["default"].resolve(__dirname, "../package.json");
        var packageJson = JSON.parse(fs_1["default"].readFileSync(packageJsonPath, "utf8"));
        return packageJson.version || "0.0.0";
    }
    catch (error) {
        return "0.0.0";
    }
}
// // Run if directly executed
// if (require.main === module) {
//   startParallelJestRunner();
// }
startParallelJestRunner();
