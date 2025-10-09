"use strict";
/**
 * VerifierRunner: Automatic verification of workspace changes
 * Runs tests, linting, and builds to ensure changes are valid
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierRunner = void 0;
var child_process_1 = require("child_process");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var VerifierRunner = /** @class */ (function () {
    function VerifierRunner(workingDir) {
        this.workingDir = workingDir;
    }
    /**
     * Run verification checks based on project type
     */
    VerifierRunner.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, pkgPath, pkg, content, _a, steps, scriptChecks, _i, scriptChecks_1, check, stepStartTime, result, duration, _b, _c, totalDuration, passed;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        startTime = Date.now();
                        pkgPath = (0, path_1.resolve)(this.workingDir, 'package.json');
                        pkg = null;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, promises_1.readFile)(pkgPath, 'utf-8')];
                    case 2:
                        content = _e.sent();
                        pkg = JSON.parse(content);
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _e.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        steps = [];
                        if (!pkg) return [3 /*break*/, 9];
                        scriptChecks = [
                            { script: 'typecheck', name: 'Type Check' },
                            { script: 'lint', name: 'Lint' },
                            { script: 'test', name: 'Test' },
                            { script: 'build', name: 'Build' }
                        ];
                        _i = 0, scriptChecks_1 = scriptChecks;
                        _e.label = 5;
                    case 5:
                        if (!(_i < scriptChecks_1.length)) return [3 /*break*/, 8];
                        check = scriptChecks_1[_i];
                        if (!((_d = pkg.scripts) === null || _d === void 0 ? void 0 : _d[check.script])) return [3 /*break*/, 7];
                        stepStartTime = Date.now();
                        return [4 /*yield*/, this.runCommand(['npm', 'run', check.script])];
                    case 6:
                        result = _e.sent();
                        duration = Date.now() - stepStartTime;
                        steps.push({
                            name: check.name,
                            ok: result.ok,
                            output: result.output,
                            duration: duration
                        });
                        // If a critical step fails, stop verification
                        if (!result.ok && (check.script === 'typecheck' || check.script === 'test')) {
                            return [3 /*break*/, 8];
                        }
                        _e.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        // Static project - basic sanity checks
                        _c = (_b = steps).push;
                        return [4 /*yield*/, this.runStaticChecks()];
                    case 10:
                        // Static project - basic sanity checks
                        _c.apply(_b, [_e.sent()]);
                        _e.label = 11;
                    case 11:
                        totalDuration = Date.now() - startTime;
                        passed = steps.length > 0 ? steps.every(function (s) { return s.ok; }) : true;
                        return [2 /*return*/, {
                                steps: steps,
                                passed: passed,
                                totalDuration: totalDuration
                            }];
                }
            });
        });
    };
    /**
     * Run basic sanity checks for static projects
     */
    VerifierRunner.prototype.runStaticChecks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var indexPath, content, hasDoctype, hasClosingHtml, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        indexPath = (0, path_1.resolve)(this.workingDir, 'index.html');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, promises_1.readFile)(indexPath, 'utf-8')];
                    case 2:
                        content = _b.sent();
                        hasDoctype = content.trim().toLowerCase().startsWith('<!doctype html');
                        hasClosingHtml = content.includes('</html>');
                        if (hasDoctype && hasClosingHtml) {
                            return [2 /*return*/, {
                                    name: 'Static Validation',
                                    ok: true,
                                    output: 'index.html appears well-formed',
                                    duration: 0
                                }];
                        }
                        else {
                            return [2 /*return*/, {
                                    name: 'Static Validation',
                                    ok: false,
                                    output: 'index.html may be malformed (missing doctype or closing tag)',
                                    duration: 0
                                }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, {
                                name: 'Static Validation',
                                ok: true,
                                output: 'No index.html found - skipping validation',
                                duration: 0
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute a shell command and return result
     */
    VerifierRunner.prototype.runCommand = function (cmd) {
        var _this = this;
        return new Promise(function (resolve) {
            var proc = (0, child_process_1.spawn)(cmd[0], cmd.slice(1), {
                cwd: _this.workingDir,
                shell: process.platform === 'win32',
                env: __assign(__assign({}, process.env), { CI: 'true', NODE_ENV: 'test' })
            });
            var output = '';
            var outputLimit = 5000; // Limit output to 5000 chars
            proc.stdout.on('data', function (data) {
                if (output.length < outputLimit) {
                    output += data.toString();
                }
            });
            proc.stderr.on('data', function (data) {
                if (output.length < outputLimit) {
                    output += data.toString();
                }
            });
            proc.on('close', function (code) {
                if (output.length >= outputLimit) {
                    output = output.slice(0, outputLimit) + '\n... (output truncated)';
                }
                resolve({
                    ok: code === 0,
                    output: output.trim()
                });
            });
            proc.on('error', function (error) {
                resolve({
                    ok: false,
                    output: "Failed to execute command: ".concat(error.message)
                });
            });
            // Timeout after 60 seconds
            setTimeout(function () {
                proc.kill();
                resolve({
                    ok: false,
                    output: 'Command timed out after 60 seconds'
                });
            }, 60000);
        });
    };
    /**
     * Format verification result as a concise summary
     */
    VerifierRunner.formatSummary = function (result) {
        if (result.steps.length === 0) {
            return '✓ No verification steps configured';
        }
        var lines = ['\n**Verification Results:**'];
        for (var _i = 0, _a = result.steps; _i < _a.length; _i++) {
            var step = _a[_i];
            var icon = step.ok ? '✓' : '✗';
            var time = step.duration ? " (".concat(step.duration, "ms)") : '';
            lines.push("  ".concat(icon, " ").concat(step.name).concat(time));
            // Include brief error output for failed steps
            if (!step.ok && step.output) {
                var errorLines = step.output.split('\n').slice(0, 5); // First 5 lines
                for (var _b = 0, errorLines_1 = errorLines; _b < errorLines_1.length; _b++) {
                    var line = errorLines_1[_b];
                    if (line.trim()) {
                        lines.push("    ".concat(line.trim()));
                    }
                }
            }
        }
        var summary = result.passed ? 'All checks passed ✓' : 'Some checks failed ✗';
        lines.push("\n".concat(summary, " (").concat(result.totalDuration, "ms total)"));
        return lines.join('\n');
    };
    return VerifierRunner;
}());
exports.VerifierRunner = VerifierRunner;
