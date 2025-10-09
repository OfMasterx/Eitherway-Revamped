"use strict";
/**
 * either-line-replace: Targeted line edits with text editor pattern
 * Enhanced with exact string matching and comprehensive verification
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
exports.EitherLineReplaceExecutor = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var crypto_1 = require("crypto");
var security_js_1 = require("./security.js");
var EitherLineReplaceExecutor = /** @class */ (function () {
    function EitherLineReplaceExecutor() {
        this.name = 'either-line-replace';
    }
    EitherLineReplaceExecutor.prototype.execute = function (input, context) {
        return __awaiter(this, void 0, void 0, function () {
            var path, locator, replacement, _a, verify_after, start_line, end_line, needle, guard, fullPath, content, originalSha256, lines, targetLines, targetText, needleOccurrences, preview, before, after, replacementLines, newLines, newContent, newSha256, verificationMsg, isVerified, verified, verifiedSha256, linesReplaced, newLineCount, netLineChange, diff, summary, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        path = input.path, locator = input.locator, replacement = input.replacement, _a = input.verify_after, verify_after = _a === void 0 ? true : _a;
                        start_line = locator.start_line, end_line = locator.end_line, needle = locator.needle;
                        guard = new security_js_1.SecurityGuard(context.config.security);
                        if (!guard.isPathAllowed(path)) {
                            return [2 /*return*/, {
                                    content: "Error: Access denied to path '".concat(path, "'. Path is not in allowed workspaces."),
                                    isError: true
                                }];
                        }
                        // Use database if fileStore is available
                        if (context.fileStore && context.appId) {
                            return [2 /*return*/, this.executeWithDatabase(path, locator, replacement, context)];
                        }
                        fullPath = (0, path_1.resolve)(context.workingDir, path);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, (0, promises_1.readFile)(fullPath, 'utf-8')];
                    case 2:
                        content = _b.sent();
                        originalSha256 = (0, crypto_1.createHash)('sha256').update(content).digest('hex');
                        lines = content.split('\n');
                        // Validate line numbers
                        if (start_line < 1 || start_line > lines.length) {
                            return [2 /*return*/, {
                                    content: "Error: start_line ".concat(start_line, " out of range (file has ").concat(lines.length, " lines)"),
                                    isError: true
                                }];
                        }
                        if (end_line < start_line || end_line > lines.length) {
                            return [2 /*return*/, {
                                    content: "Error: end_line ".concat(end_line, " invalid (must be >= start_line and <= ").concat(lines.length, ")"),
                                    isError: true
                                }];
                        }
                        targetLines = lines.slice(start_line - 1, end_line);
                        targetText = targetLines.join('\n');
                        // Verify needle if provided (text editor pattern: exact match verification)
                        if (needle) {
                            needleOccurrences = content.split(needle).length - 1;
                            if (needleOccurrences === 0) {
                                preview = targetText.length > 100 ? targetText.substring(0, 100) + '...' : targetText;
                                return [2 /*return*/, {
                                        content: "Error: Needle text not found in file.\n\nExpected to find:\n\"".concat(needle, "\"\n\nBut in lines ").concat(start_line, "-").concat(end_line, " found:\n\"").concat(preview, "\"\n\nUse either-view to verify current file contents and exact text to match."),
                                        isError: true,
                                        metadata: {
                                            path: path,
                                            needle_mismatch: true,
                                            expected: needle,
                                            actualPreview: preview,
                                            suggestion: 'Use either-view to check file contents and provide exact matching text'
                                        }
                                    }];
                            }
                            if (needleOccurrences > 1) {
                                return [2 /*return*/, {
                                        content: "Error: Needle text appears ".concat(needleOccurrences, " times in file. Provide more context to create a unique match.\n\nSearching for:\n\"").concat(needle, "\"\n\nProvide more surrounding lines or unique identifiers."),
                                        isError: true,
                                        metadata: {
                                            path: path,
                                            needle_occurrences: needleOccurrences,
                                            suggestion: 'Include more context in needle to create a unique match'
                                        }
                                    }];
                            }
                            if (!targetText.includes(needle)) {
                                return [2 /*return*/, {
                                        content: "Error: Needle found in file but not at specified line range ".concat(start_line, "-").concat(end_line, ".\n\nUse either-search-files to locate the correct line numbers."),
                                        isError: true,
                                        metadata: {
                                            path: path,
                                            needle_location_mismatch: true,
                                            suggestion: 'Use either-search-files to find correct line numbers'
                                        }
                                    }];
                            }
                        }
                        before = lines.slice(0, start_line - 1);
                        after = lines.slice(end_line);
                        replacementLines = replacement.split('\n');
                        newLines = __spreadArray(__spreadArray(__spreadArray([], before, true), replacementLines, true), after, true);
                        newContent = newLines.join('\n');
                        newSha256 = (0, crypto_1.createHash)('sha256').update(newContent).digest('hex');
                        // Write back
                        return [4 /*yield*/, (0, promises_1.writeFile)(fullPath, newContent, 'utf-8')];
                    case 3:
                        // Write back
                        _b.sent();
                        verificationMsg = '';
                        isVerified = false;
                        if (!verify_after) return [3 /*break*/, 5];
                        return [4 /*yield*/, (0, promises_1.readFile)(fullPath, 'utf-8')];
                    case 4:
                        verified = _b.sent();
                        verifiedSha256 = (0, crypto_1.createHash)('sha256').update(verified).digest('hex');
                        isVerified = verifiedSha256 === newSha256;
                        if (!isVerified) {
                            verificationMsg = '\n\nWarning: Verification failed - file content differs from expected. File may have been modified by another process.';
                        }
                        _b.label = 5;
                    case 5:
                        linesReplaced = end_line - start_line + 1;
                        newLineCount = replacementLines.length;
                        netLineChange = newLineCount - linesReplaced;
                        diff = this.generateUnifiedDiff(path, targetLines, replacementLines, start_line);
                        summary = netLineChange === 0
                            ? "".concat(linesReplaced, " line(s)")
                            : "".concat(linesReplaced, " line(s) \u2192 ").concat(newLineCount, " line(s) (").concat(netLineChange > 0 ? '+' : '').concat(netLineChange, ")");
                        return [2 /*return*/, {
                                content: "Successfully replaced lines ".concat(start_line, "-").concat(end_line, " in '").concat(path, "' (").concat(summary, ")\n\n").concat(diff).concat(verificationMsg),
                                isError: false,
                                metadata: {
                                    path: path,
                                    startLine: start_line,
                                    endLine: end_line,
                                    linesReplaced: linesReplaced,
                                    newLineCount: newLineCount,
                                    netLineChange: netLineChange,
                                    original_sha256: originalSha256,
                                    new_sha256: newSha256,
                                    verified: isVerified,
                                    needleVerified: needle ? true : false
                                }
                            }];
                    case 6:
                        error_1 = _b.sent();
                        return [2 /*return*/, {
                                content: "Error replacing lines in '".concat(path, "': ").concat(error_1.message),
                                isError: true
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute using database FileStore
     */
    EitherLineReplaceExecutor.prototype.executeWithDatabase = function (path, locator, replacement, context) {
        return __awaiter(this, void 0, void 0, function () {
            var fileStore, appId, start_line, end_line, needle, fileData, content, originalSha256, lines, targetLines, targetText, needleOccurrences, preview, before, after, replacementLines, newLines, newContent, newSha256, linesReplaced, newLineCount, netLineChange, diff, summary, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fileStore = context.fileStore, appId = context.appId;
                        start_line = locator.start_line, end_line = locator.end_line, needle = locator.needle;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fileStore.read(appId, path)];
                    case 2:
                        fileData = _a.sent();
                        content = void 0;
                        if (typeof fileData.content === 'string') {
                            content = fileData.content;
                        }
                        else if (Buffer.isBuffer(fileData.content)) {
                            content = fileData.content.toString('utf-8');
                        }
                        else {
                            content = Buffer.from(fileData.content).toString('utf-8');
                        }
                        originalSha256 = (0, crypto_1.createHash)('sha256').update(content).digest('hex');
                        lines = content.split('\n');
                        // Validate line numbers
                        if (start_line < 1 || start_line > lines.length) {
                            return [2 /*return*/, {
                                    content: "Error: start_line ".concat(start_line, " out of range (file has ").concat(lines.length, " lines)"),
                                    isError: true
                                }];
                        }
                        if (end_line < start_line || end_line > lines.length) {
                            return [2 /*return*/, {
                                    content: "Error: end_line ".concat(end_line, " invalid (must be >= start_line and <= ").concat(lines.length, ")"),
                                    isError: true
                                }];
                        }
                        targetLines = lines.slice(start_line - 1, end_line);
                        targetText = targetLines.join('\n');
                        // Verify needle if provided
                        if (needle) {
                            needleOccurrences = content.split(needle).length - 1;
                            if (needleOccurrences === 0) {
                                preview = targetText.length > 100 ? targetText.substring(0, 100) + '...' : targetText;
                                return [2 /*return*/, {
                                        content: "Error: Needle text not found in file.\n\nExpected to find:\n\"".concat(needle, "\"\n\nBut in lines ").concat(start_line, "-").concat(end_line, " found:\n\"").concat(preview, "\"\n\nUse either-view to verify current file contents and exact text to match."),
                                        isError: true,
                                        metadata: {
                                            path: path,
                                            needle_mismatch: true,
                                            expected: needle,
                                            actualPreview: preview,
                                            suggestion: 'Use either-view to check file contents and provide exact matching text'
                                        }
                                    }];
                            }
                            if (needleOccurrences > 1) {
                                return [2 /*return*/, {
                                        content: "Error: Needle text appears ".concat(needleOccurrences, " times in file. Provide more context to create a unique match.\n\nSearching for:\n\"").concat(needle, "\"\n\nProvide more surrounding lines or unique identifiers."),
                                        isError: true,
                                        metadata: {
                                            path: path,
                                            needle_occurrences: needleOccurrences,
                                            suggestion: 'Include more context in needle to create a unique match'
                                        }
                                    }];
                            }
                            if (!targetText.includes(needle)) {
                                return [2 /*return*/, {
                                        content: "Error: Needle found in file but not at specified line range ".concat(start_line, "-").concat(end_line, ".\n\nUse either-search-files to locate the correct line numbers."),
                                        isError: true,
                                        metadata: {
                                            path: path,
                                            needle_location_mismatch: true,
                                            suggestion: 'Use either-search-files to find correct line numbers'
                                        }
                                    }];
                            }
                        }
                        before = lines.slice(0, start_line - 1);
                        after = lines.slice(end_line);
                        replacementLines = replacement.split('\n');
                        newLines = __spreadArray(__spreadArray(__spreadArray([], before, true), replacementLines, true), after, true);
                        newContent = newLines.join('\n');
                        newSha256 = (0, crypto_1.createHash)('sha256').update(newContent).digest('hex');
                        // Write back to database
                        return [4 /*yield*/, fileStore.write(appId, path, newContent)];
                    case 3:
                        // Write back to database
                        _a.sent();
                        linesReplaced = end_line - start_line + 1;
                        newLineCount = replacementLines.length;
                        netLineChange = newLineCount - linesReplaced;
                        diff = this.generateUnifiedDiff(path, targetLines, replacementLines, start_line);
                        summary = netLineChange === 0
                            ? "".concat(linesReplaced, " line(s)")
                            : "".concat(linesReplaced, " line(s) \u2192 ").concat(newLineCount, " line(s) (").concat(netLineChange > 0 ? '+' : '').concat(netLineChange, ")");
                        return [2 /*return*/, {
                                content: "Successfully replaced lines ".concat(start_line, "-").concat(end_line, " in '").concat(path, "' (").concat(summary, ") in database\n\n").concat(diff),
                                isError: false,
                                metadata: {
                                    path: path,
                                    startLine: start_line,
                                    endLine: end_line,
                                    linesReplaced: linesReplaced,
                                    newLineCount: newLineCount,
                                    netLineChange: netLineChange,
                                    original_sha256: originalSha256,
                                    new_sha256: newSha256,
                                    needleVerified: needle ? true : false,
                                    storage: 'database'
                                }
                            }];
                    case 4:
                        error_2 = _a.sent();
                        return [2 /*return*/, {
                                content: "Error replacing lines in '".concat(path, "' in database: ").concat(error_2.message),
                                isError: true
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate unified diff format
     */
    EitherLineReplaceExecutor.prototype.generateUnifiedDiff = function (path, oldLines, newLines, startLine) {
        var diff = [];
        diff.push("--- ".concat(path));
        diff.push("+++ ".concat(path));
        diff.push("@@ -".concat(startLine, ",").concat(oldLines.length, " +").concat(startLine, ",").concat(newLines.length, " @@"));
        // Show removed lines
        oldLines.forEach(function (line) {
            diff.push("-".concat(line));
        });
        // Show added lines
        newLines.forEach(function (line) {
            diff.push("+".concat(line));
        });
        return diff.join('\n');
    };
    return EitherLineReplaceExecutor;
}());
exports.EitherLineReplaceExecutor = EitherLineReplaceExecutor;
