"use strict";
/**
 * Tool Runner with validation, allowlist, idempotency, metrics, and rate limiting
 */
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityGuard = exports.ToolRunner = void 0;
var crypto_1 = require("crypto");
var tools_core_1 = require("@eitherway/tools-core");
var metrics_js_1 = require("./metrics.js");
var rate_limiter_js_1 = require("./rate-limiter.js");
var ToolRunner = /** @class */ (function () {
    function ToolRunner(executors, workingDir, config) {
        this.validator = (0, tools_core_1.getValidator)();
        this.executors = new Map();
        for (var _i = 0, executors_1 = executors; _i < executors_1.length; _i++) {
            var executor = executors_1[_i];
            this.executors.set(executor.name, executor);
        }
        this.context = {
            workingDir: workingDir,
            allowedPaths: config.security.allowedWorkspaces,
            deniedPaths: config.security.deniedPaths,
            config: config
        };
        this.executionCache = new Map();
        this.metrics = new metrics_js_1.MetricsCollector(config);
        this.rateLimiter = new rate_limiter_js_1.RateLimiter();
    }
    /**
     * Execute a single tool use with metrics and rate limiting
     */
    ToolRunner.prototype.executeTool = function (toolUse) {
        return __awaiter(this, void 0, void 0, function () {
            var id, name, input, startTime, executor, validation, rateCheck, cacheKey, cached, result, latency, inputSize, outputSize, fileCount, error_1, errorMessage, latency;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        id = toolUse.id, name = toolUse.name, input = toolUse.input;
                        startTime = Date.now();
                        executor = this.executors.get(name);
                        if (!executor) {
                            return [2 /*return*/, {
                                    type: 'tool_result',
                                    tool_use_id: id,
                                    content: "Error: Unknown tool '".concat(name, "'"),
                                    is_error: true
                                }];
                        }
                        validation = this.validator.validate(name, input);
                        if (!validation.valid) {
                            return [2 /*return*/, {
                                    type: 'tool_result',
                                    tool_use_id: id,
                                    content: "Validation error: ".concat(validation.errors.join(', ')),
                                    is_error: true
                                }];
                        }
                        if (!(name.startsWith('websearch') || name.startsWith('eithergen'))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.rateLimiter.checkLimit(name.split('--')[0])];
                    case 1:
                        rateCheck = _c.sent();
                        if (!rateCheck.allowed) {
                            return [2 /*return*/, {
                                    type: 'tool_result',
                                    tool_use_id: id,
                                    content: "Rate limit exceeded for ".concat(name, ". Retry after ").concat(rateCheck.retryAfter, " seconds."),
                                    is_error: true
                                }];
                        }
                        _c.label = 2;
                    case 2:
                        cacheKey = this.getCacheKey(name, input);
                        cached = this.executionCache.get(cacheKey);
                        if (cached) {
                            return [2 /*return*/, {
                                    type: 'tool_result',
                                    tool_use_id: id,
                                    content: cached.content,
                                    is_error: cached.isError
                                }];
                        }
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, executor.execute(input, this.context)];
                    case 4:
                        result = _c.sent();
                        latency = Date.now() - startTime;
                        inputSize = JSON.stringify(input).length;
                        outputSize = result.content.length;
                        fileCount = ((_a = result.metadata) === null || _a === void 0 ? void 0 : _a.matchCount) || ((_b = result.metadata) === null || _b === void 0 ? void 0 : _b.fileCount);
                        // Record metrics
                        this.metrics.recordToolExecution({
                            tool: name,
                            latency_ms: latency,
                            input_size: inputSize,
                            output_size: outputSize,
                            file_count: fileCount,
                            success: !result.isError,
                            error: result.isError ? result.content : undefined,
                            timestamp: new Date().toISOString()
                        });
                        // Cache the result
                        this.executionCache.set(cacheKey, result);
                        return [2 /*return*/, {
                                type: 'tool_result',
                                tool_use_id: id,
                                content: result.content,
                                is_error: result.isError
                            }];
                    case 5:
                        error_1 = _c.sent();
                        errorMessage = (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || String(error_1);
                        latency = Date.now() - startTime;
                        // Record error metrics
                        this.metrics.recordToolExecution({
                            tool: name,
                            latency_ms: latency,
                            input_size: JSON.stringify(input).length,
                            output_size: errorMessage.length,
                            success: false,
                            error: errorMessage,
                            timestamp: new Date().toISOString()
                        });
                        return [2 /*return*/, {
                                type: 'tool_result',
                                tool_use_id: id,
                                content: "Execution error: ".concat(errorMessage),
                                is_error: true
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute multiple tools with parallel execution where safe
     * Reads run in parallel; writes are serialized per-path
     */
    ToolRunner.prototype.executeTools = function (toolUses) {
        return __awaiter(this, void 0, void 0, function () {
            var reads, writesByPath, _i, toolUses_1, tu, isWrite, path, concurrencyLimit, readResults, writeGroups, writeResults, resultMap, _a, _b, result;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (toolUses.length === 0)
                            return [2 /*return*/, []];
                        if (!(toolUses.length === 1)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.executeTool(toolUses[0])];
                    case 1: return [2 /*return*/, [_c.sent()]];
                    case 2:
                        reads = [];
                        writesByPath = new Map();
                        for (_i = 0, toolUses_1 = toolUses; _i < toolUses_1.length; _i++) {
                            tu = toolUses_1[_i];
                            isWrite = this.isWriteTool(tu.name);
                            if (!isWrite) {
                                reads.push(tu);
                            }
                            else {
                                path = this.extractPath(tu.input);
                                if (!writesByPath.has(path)) {
                                    writesByPath.set(path, []);
                                }
                                writesByPath.get(path).push(tu);
                            }
                        }
                        concurrencyLimit = this.context.config.limits.maxConcurrentTools || 4;
                        return [4 /*yield*/, this.runWithConcurrency(reads, concurrencyLimit)];
                    case 3:
                        readResults = _c.sent();
                        writeGroups = Array.from(writesByPath.values());
                        return [4 /*yield*/, this.runWriteGroupsInParallel(writeGroups, concurrencyLimit)];
                    case 4:
                        writeResults = _c.sent();
                        resultMap = new Map();
                        for (_a = 0, _b = __spreadArray(__spreadArray([], readResults, true), writeResults, true); _a < _b.length; _a++) {
                            result = _b[_a];
                            resultMap.set(result.tool_use_id, result);
                        }
                        return [2 /*return*/, toolUses.map(function (tu) { return resultMap.get(tu.id); })];
                }
            });
        });
    };
    /**
     * Determine if a tool performs writes
     */
    ToolRunner.prototype.isWriteTool = function (name) {
        return name === 'either-write' ||
            name === 'either-line-replace' ||
            name === 'eithergen--generate_image';
    };
    /**
     * Extract file path from tool input (used for grouping writes)
     */
    ToolRunner.prototype.extractPath = function (input) {
        return (input === null || input === void 0 ? void 0 : input.path) || '__no_path__';
    };
    /**
     * Run tools in parallel with concurrency limit
     */
    ToolRunner.prototype.runWithConcurrency = function (tools, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var results, activeCount, currentIndex;
            var _this = this;
            return __generator(this, function (_a) {
                if (tools.length === 0)
                    return [2 /*return*/, []];
                results = new Array(tools.length);
                activeCount = 0;
                currentIndex = 0;
                return [2 /*return*/, new Promise(function (resolve) {
                        var startNext = function () {
                            var _loop_1 = function () {
                                var index = currentIndex++;
                                var tool = tools[index];
                                activeCount++;
                                _this.executeTool(tool).then(function (result) {
                                    results[index] = result;
                                    activeCount--;
                                    if (currentIndex < tools.length) {
                                        startNext();
                                    }
                                    else if (activeCount === 0) {
                                        resolve(results);
                                    }
                                });
                            };
                            while (activeCount < limit && currentIndex < tools.length) {
                                _loop_1();
                            }
                        };
                        startNext();
                    })];
            });
        });
    };
    /**
     * Execute write groups: sequential within each group, parallel across groups
     */
    ToolRunner.prototype.runWriteGroupsInParallel = function (groups, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var allResults, activeCount, currentIndex;
            var _this = this;
            return __generator(this, function (_a) {
                allResults = [];
                activeCount = 0;
                currentIndex = 0;
                return [2 /*return*/, new Promise(function (resolve) {
                        if (groups.length === 0) {
                            resolve([]);
                            return;
                        }
                        var startNext = function () {
                            while (activeCount < limit && currentIndex < groups.length) {
                                var group = groups[currentIndex++];
                                activeCount++;
                                _this.executeSequentially(group).then(function (results) {
                                    allResults.push.apply(allResults, results);
                                    activeCount--;
                                    if (currentIndex < groups.length) {
                                        startNext();
                                    }
                                    else if (activeCount === 0) {
                                        resolve(allResults);
                                    }
                                });
                            }
                        };
                        startNext();
                    })];
            });
        });
    };
    /**
     * Execute tools sequentially (for same-path writes)
     */
    ToolRunner.prototype.executeSequentially = function (tools) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, tools_1, tool, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = [];
                        _i = 0, tools_1 = tools;
                        _c.label = 1;
                    case 1:
                        if (!(_i < tools_1.length)) return [3 /*break*/, 4];
                        tool = tools_1[_i];
                        _b = (_a = results).push;
                        return [4 /*yield*/, this.executeTool(tool)];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Generate cache key for idempotency
     */
    ToolRunner.prototype.getCacheKey = function (name, input) {
        var payload = JSON.stringify({ name: name, input: input });
        return crypto_1.default.createHash('sha256').update(payload).digest('hex');
    };
    /**
     * Clear execution cache (useful between turns)
     */
    ToolRunner.prototype.clearCache = function () {
        this.executionCache.clear();
    };
    /**
     * Get available tool names
     */
    ToolRunner.prototype.getAvailableTools = function () {
        return Array.from(this.executors.keys());
    };
    /**
     * Check if a tool is available
     */
    ToolRunner.prototype.hasExecutor = function (name) {
        return this.executors.has(name);
    };
    /**
     * Get metrics collector
     */
    ToolRunner.prototype.getMetrics = function () {
        return this.metrics;
    };
    /**
     * Get rate limiter
     */
    ToolRunner.prototype.getRateLimiter = function () {
        return this.rateLimiter;
    };
    /**
     * Set database context for file operations
     */
    ToolRunner.prototype.setDatabaseContext = function (fileStore, appId, sessionId) {
        this.context.fileStore = fileStore;
        this.context.appId = appId;
        this.context.sessionId = sessionId;
    };
    /**
     * Clear database context
     */
    ToolRunner.prototype.clearDatabaseContext = function () {
        delete this.context.fileStore;
        delete this.context.appId;
        delete this.context.sessionId;
    };
    return ToolRunner;
}());
exports.ToolRunner = ToolRunner;
/**
 * Security utilities for path validation
 */
var SecurityGuard = /** @class */ (function () {
    function SecurityGuard(config) {
        this.allowedPaths = config.allowedWorkspaces;
        this.deniedPaths = config.deniedPaths;
        this.secretPatterns = config.secretPatterns.map(function (p) { return new RegExp(p, 'g'); });
    }
    /**
     * Check if a path is allowed
     */
    SecurityGuard.prototype.isPathAllowed = function (path) {
        // Check denied paths first
        for (var _i = 0, _a = this.deniedPaths; _i < _a.length; _i++) {
            var denied = _a[_i];
            if (this.matchGlob(path, denied)) {
                return false;
            }
        }
        // Check allowed paths
        for (var _b = 0, _c = this.allowedPaths; _b < _c.length; _b++) {
            var allowed = _c[_b];
            if (this.matchGlob(path, allowed)) {
                return true;
            }
        }
        return false;
    };
    /**
     * Redact secrets from content
     */
    SecurityGuard.prototype.redactSecrets = function (content) {
        var redacted = content;
        for (var _i = 0, _a = this.secretPatterns; _i < _a.length; _i++) {
            var pattern = _a[_i];
            redacted = redacted.replace(pattern, '[REDACTED]');
        }
        return redacted;
    };
    /**
     * Simple glob matching (supports ** and *)
     */
    SecurityGuard.prototype.matchGlob = function (path, pattern) {
        var regex = this.globToRegExp(pattern);
        return regex.test(path);
    };
    // Convert a glob to a RegExp with proper ** semantics:
    //  - "**/"   => "(?:.*/)?", i.e., zero or more directories (including none)
    //  - "**"    => ".*"
    //  - "*"     => "[^/]*"
    //  - "?"     => "[^/]"
    SecurityGuard.prototype.globToRegExp = function (pattern) {
        var specials = /[.+^${}()|[\]\\]/;
        var i = 0;
        var out = '^';
        while (i < pattern.length) {
            var ch = pattern[i];
            if (ch === '*') {
                var next = pattern[i + 1];
                if (next === '*') {
                    var hasSlash = pattern[i + 2] === '/';
                    if (hasSlash) {
                        out += '(?:.*/)?'; // zero or more directories, including none
                        i += 3;
                    }
                    else {
                        out += '.*'; // any characters, including '/'
                        i += 2;
                    }
                }
                else {
                    out += '[^/]*'; // any chars except '/'
                    i += 1;
                }
            }
            else if (ch === '?') {
                out += '[^/]';
                i += 1;
            }
            else {
                out += specials.test(ch) ? '\\' + ch : ch;
                i += 1;
            }
        }
        out += '$';
        return new RegExp(out);
    };
    return SecurityGuard;
}());
exports.SecurityGuard = SecurityGuard;
