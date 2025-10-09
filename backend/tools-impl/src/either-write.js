"use strict";
/**
 * either-write: Create new files with diff summary
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EitherWriteExecutor = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var crypto_1 = require("crypto");
var security_js_1 = require("./security.js");
var EitherWriteExecutor = /** @class */ (function () {
    function EitherWriteExecutor() {
        this.name = 'either-write';
    }
    EitherWriteExecutor.prototype.execute = function (input, context) {
        return __awaiter(this, void 0, void 0, function () {
            var path, content, _a, overwrite, _b, create_dirs, guard, fullPath, isExisting, oldContent, oldSha256, _c, dir, maxSize, newSha256, lineCount, diffSummary, oldLines, newLines, lines, preview, more, error_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        path = input.path, content = input.content, _a = input.overwrite, overwrite = _a === void 0 ? false : _a, _b = input.create_dirs, create_dirs = _b === void 0 ? true : _b;
                        guard = new security_js_1.SecurityGuard(context.config.security);
                        if (!guard.isPathAllowed(path)) {
                            return [2 /*return*/, {
                                    content: "Error: Access denied to path '".concat(path, "'. Path is not in allowed workspaces."),
                                    isError: true
                                }];
                        }
                        // Use database if fileStore is available
                        if (context.fileStore && context.appId) {
                            return [2 /*return*/, this.executeWithDatabase(path, content, context)];
                        }
                        fullPath = (0, path_1.resolve)(context.workingDir, path);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 10, , 11]);
                        isExisting = false;
                        oldContent = '';
                        oldSha256 = '';
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, (0, promises_1.access)(fullPath)];
                    case 3:
                        _d.sent();
                        isExisting = true;
                        if (!overwrite) {
                            return [2 /*return*/, {
                                    content: "Error: File '".concat(path, "' already exists. Set overwrite=true to replace it."),
                                    isError: true
                                }];
                        }
                        return [4 /*yield*/, (0, promises_1.readFile)(fullPath, 'utf-8')];
                    case 4:
                        // Read existing content for diff
                        oldContent = _d.sent();
                        oldSha256 = (0, crypto_1.createHash)('sha256').update(oldContent).digest('hex');
                        return [3 /*break*/, 6];
                    case 5:
                        _c = _d.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        if (!create_dirs) return [3 /*break*/, 8];
                        dir = (0, path_1.dirname)(fullPath);
                        return [4 /*yield*/, (0, promises_1.mkdir)(dir, { recursive: true })];
                    case 7:
                        _d.sent();
                        _d.label = 8;
                    case 8:
                        maxSize = context.config.limits.maxToolPayloadSize;
                        if (content.length > maxSize) {
                            return [2 /*return*/, {
                                    content: "Error: Content size (".concat(content.length, " bytes) exceeds limit (").concat(maxSize, " bytes)"),
                                    isError: true
                                }];
                        }
                        // Write file
                        return [4 /*yield*/, (0, promises_1.writeFile)(fullPath, content, 'utf-8')];
                    case 9:
                        // Write file
                        _d.sent();
                        newSha256 = (0, crypto_1.createHash)('sha256').update(content).digest('hex');
                        lineCount = content.split('\n').length;
                        diffSummary = void 0;
                        if (isExisting) {
                            oldLines = oldContent.split('\n');
                            newLines = content.split('\n');
                            diffSummary = this.generateDiffSummary(path, oldLines, newLines);
                        }
                        else {
                            lines = content.split('\n');
                            preview = lines.slice(0, 10).map(function (line, idx) { return "".concat(idx + 1, "+ ").concat(line); }).join('\n');
                            more = lines.length > 10 ? "\n... ".concat(lines.length - 10, " more lines") : '';
                            diffSummary = "+++ ".concat(path, " (new file)\n").concat(preview).concat(more);
                        }
                        return [2 /*return*/, {
                                content: "Successfully wrote '".concat(path, "'\n\n").concat(diffSummary),
                                isError: false,
                                metadata: {
                                    path: path,
                                    size: content.length,
                                    sha256: newSha256,
                                    line_count: lineCount,
                                    overwritten: isExisting,
                                    old_sha256: oldSha256 || undefined
                                }
                            }];
                    case 10:
                        error_1 = _d.sent();
                        return [2 /*return*/, {
                                content: "Error writing file '".concat(path, "': ").concat(error_1.message),
                                isError: true
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute using database FileStore
     */
    EitherWriteExecutor.prototype.executeWithDatabase = function (path, content, context) {
        return __awaiter(this, void 0, void 0, function () {
            var fileStore, appId, isExisting, oldContent, existingFile, _a, newSha256, lineCount, diffSummary, oldLines, newLines, lines, preview, more, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fileStore = context.fileStore, appId = context.appId;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        isExisting = false;
                        oldContent = '';
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, fileStore.read(appId, path)];
                    case 3:
                        existingFile = _b.sent();
                        isExisting = true;
                        // Convert content to string if it's a buffer
                        if (typeof existingFile.content === 'string') {
                            oldContent = existingFile.content;
                        }
                        else if (Buffer.isBuffer(existingFile.content)) {
                            oldContent = existingFile.content.toString('utf-8');
                        }
                        else {
                            oldContent = Buffer.from(existingFile.content).toString('utf-8');
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5: 
                    // Write to database
                    return [4 /*yield*/, fileStore.write(appId, path, content)];
                    case 6:
                        // Write to database
                        _b.sent();
                        newSha256 = (0, crypto_1.createHash)('sha256').update(content).digest('hex');
                        lineCount = content.split('\n').length;
                        diffSummary = void 0;
                        if (isExisting) {
                            oldLines = oldContent.split('\n');
                            newLines = content.split('\n');
                            diffSummary = this.generateDiffSummary(path, oldLines, newLines);
                        }
                        else {
                            lines = content.split('\n');
                            preview = lines.slice(0, 10).map(function (line, idx) { return "".concat(idx + 1, "+ ").concat(line); }).join('\n');
                            more = lines.length > 10 ? "\n... ".concat(lines.length - 10, " more lines") : '';
                            diffSummary = "+++ ".concat(path, " (new file)\n").concat(preview).concat(more);
                        }
                        return [2 /*return*/, {
                                content: "Successfully wrote '".concat(path, "' to database\n\n").concat(diffSummary),
                                isError: false,
                                metadata: {
                                    path: path,
                                    size: content.length,
                                    sha256: newSha256,
                                    line_count: lineCount,
                                    overwritten: isExisting,
                                    storage: 'database'
                                }
                            }];
                    case 7:
                        error_2 = _b.sent();
                        return [2 /*return*/, {
                                content: "Error writing file '".concat(path, "' to database: ").concat(error_2.message),
                                isError: true
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a simple diff summary
     */
    EitherWriteExecutor.prototype.generateDiffSummary = function (path, oldLines, newLines) {
        var maxPreview = 20;
        var diff = ["--- ".concat(path, " (before)"), "+++ ".concat(path, " (after)")];
        // Simple line-by-line diff for preview
        var minLen = Math.min(oldLines.length, newLines.length, maxPreview);
        for (var i = 0; i < minLen; i++) {
            if (oldLines[i] !== newLines[i]) {
                diff.push("".concat(i + 1, "- ").concat(oldLines[i]));
                diff.push("".concat(i + 1, "+ ").concat(newLines[i]));
            }
        }
        // Handle length differences
        if (newLines.length > oldLines.length) {
            var added = newLines.length - oldLines.length;
            diff.push("... +".concat(added, " lines added"));
        }
        else if (oldLines.length > newLines.length) {
            var removed = oldLines.length - newLines.length;
            diff.push("... -".concat(removed, " lines removed"));
        }
        return diff.join('\n');
    };
    return EitherWriteExecutor;
}());
exports.EitherWriteExecutor = EitherWriteExecutor;
