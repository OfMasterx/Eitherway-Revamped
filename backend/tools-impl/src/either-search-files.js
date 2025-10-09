"use strict";
/**
 * either-search-files: Search code for patterns with regex support
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
exports.EitherSearchFilesExecutor = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var fast_glob_1 = require("fast-glob");
var security_js_1 = require("./security.js");
var EitherSearchFilesExecutor = /** @class */ (function () {
    function EitherSearchFilesExecutor() {
        this.name = 'either-search-files';
    }
    EitherSearchFilesExecutor.prototype.execute = function (input, context) {
        return __awaiter(this, void 0, void 0, function () {
            var query, _a, glob, _b, max_results, _c, regex, _d, context_lines, files, guard, matches, searchPattern, escapedQuery, _i, files_1, file, fullPath, content, lines, i, match, startIdx, endIdx, error_1, resultText, error_2;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        query = input.query, _a = input.glob, glob = _a === void 0 ? 'src/**/*' : _a, _b = input.max_results, max_results = _b === void 0 ? 100 : _b, _c = input.regex, regex = _c === void 0 ? false : _c, _d = input.context_lines, context_lines = _d === void 0 ? 0 : _d;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 9, , 10]);
                        // Use database if fileStore is available
                        if (context.fileStore && context.appId) {
                            return [2 /*return*/, this.executeWithDatabase(query, glob, max_results, regex, context_lines, context)];
                        }
                        return [4 /*yield*/, (0, fast_glob_1.default)(glob, {
                                cwd: context.workingDir,
                                absolute: false,
                                onlyFiles: true,
                                ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '*.min.js', '*.map']
                            })];
                    case 2:
                        files = _e.sent();
                        guard = new security_js_1.SecurityGuard(context.config.security);
                        matches = [];
                        searchPattern = void 0;
                        if (regex) {
                            try {
                                searchPattern = new RegExp(query, 'g');
                            }
                            catch (error) {
                                return [2 /*return*/, {
                                        content: "Invalid regex pattern: ".concat(error.message),
                                        isError: true
                                    }];
                            }
                        }
                        else {
                            escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            searchPattern = new RegExp(escapedQuery, 'g');
                        }
                        _i = 0, files_1 = files;
                        _e.label = 3;
                    case 3:
                        if (!(_i < files_1.length)) return [3 /*break*/, 8];
                        file = files_1[_i];
                        if (!guard.isPathAllowed(file)) {
                            return [3 /*break*/, 7]; // Skip disallowed files
                        }
                        _e.label = 4;
                    case 4:
                        _e.trys.push([4, 6, , 7]);
                        fullPath = (0, path_1.resolve)(context.workingDir, file);
                        return [4 /*yield*/, (0, promises_1.readFile)(fullPath, 'utf-8')];
                    case 5:
                        content = _e.sent();
                        lines = content.split('\n');
                        // Search for pattern
                        for (i = 0; i < lines.length; i++) {
                            // Reset regex lastIndex before each test to avoid missed matches
                            searchPattern.lastIndex = 0;
                            if (searchPattern.test(lines[i])) {
                                match = {
                                    path: file,
                                    line: i + 1,
                                    snippet: lines[i]
                                };
                                // Add context lines if requested
                                if (context_lines > 0) {
                                    startIdx = Math.max(0, i - context_lines);
                                    endIdx = Math.min(lines.length - 1, i + context_lines);
                                    if (startIdx < i) {
                                        match.contextBefore = lines.slice(startIdx, i);
                                    }
                                    if (endIdx > i) {
                                        match.contextAfter = lines.slice(i + 1, endIdx + 1);
                                    }
                                }
                                matches.push(match);
                                if (matches.length >= max_results) {
                                    break;
                                }
                            }
                        }
                        if (matches.length >= max_results) {
                            return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _e.sent();
                        // Skip files that can't be read (binary, etc.)
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8:
                        if (matches.length === 0) {
                            return [2 /*return*/, {
                                    content: "No matches found for \"".concat(query, "\" in ").concat(glob),
                                    isError: false,
                                    metadata: {
                                        query: query,
                                        glob: glob,
                                        regex: regex,
                                        filesSearched: files.length,
                                        matchCount: 0
                                    }
                                }];
                        }
                        resultText = matches.map(function (m) {
                            var output = "".concat(m.path, ":").concat(m.line, ": ").concat(m.snippet);
                            if (m.contextBefore && m.contextBefore.length > 0) {
                                var before = m.contextBefore.map(function (line, idx) {
                                    return "  ".concat(m.line - m.contextBefore.length + idx, " | ").concat(line);
                                }).join('\n');
                                output = "".concat(before, "\n").concat(output);
                            }
                            if (m.contextAfter && m.contextAfter.length > 0) {
                                var after = m.contextAfter.map(function (line, idx) {
                                    return "  ".concat(m.line + idx + 1, " | ").concat(line);
                                }).join('\n');
                                output = "".concat(output, "\n").concat(after);
                            }
                            return output;
                        }).join('\n---\n');
                        return [2 /*return*/, {
                                content: "Found ".concat(matches.length, " match(es) in ").concat(glob, ":\n\n").concat(resultText),
                                isError: false,
                                metadata: {
                                    query: query,
                                    glob: glob,
                                    regex: regex,
                                    filesSearched: files.length,
                                    matchCount: matches.length,
                                    matches: matches.map(function (m) { return ({ path: m.path, line: m.line }); })
                                }
                            }];
                    case 9:
                        error_2 = _e.sent();
                        return [2 /*return*/, {
                                content: "Error searching files: ".concat(error_2.message),
                                isError: true
                            }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute using database FileStore
     */
    EitherSearchFilesExecutor.prototype.executeWithDatabase = function (query, glob, max_results, regex, context_lines, context) {
        return __awaiter(this, void 0, void 0, function () {
            var fileStore, appId, allFiles, globPattern, globRegex_1, files, guard, matches, searchPattern, escapedQuery, _i, files_2, file, filePath, fileData, content, lines, i, match, startIdx, endIdx, error_3, resultText, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fileStore = context.fileStore, appId = context.appId;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, fileStore.list(appId)];
                    case 2:
                        allFiles = _a.sent();
                        globPattern = glob
                            .replace(/\./g, '\\.')
                            .replace(/\*\*/g, '.*')
                            .replace(/\*/g, '[^/]*')
                            .replace(/\?/g, '.');
                        globRegex_1 = new RegExp("^".concat(globPattern, "$"));
                        files = allFiles.filter(function (file) {
                            var path = file.path || file;
                            return globRegex_1.test(path);
                        });
                        guard = new security_js_1.SecurityGuard(context.config.security);
                        matches = [];
                        searchPattern = void 0;
                        if (regex) {
                            try {
                                searchPattern = new RegExp(query, 'g');
                            }
                            catch (error) {
                                return [2 /*return*/, {
                                        content: "Invalid regex pattern: ".concat(error.message),
                                        isError: true
                                    }];
                            }
                        }
                        else {
                            escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            searchPattern = new RegExp(escapedQuery, 'g');
                        }
                        _i = 0, files_2 = files;
                        _a.label = 3;
                    case 3:
                        if (!(_i < files_2.length)) return [3 /*break*/, 8];
                        file = files_2[_i];
                        filePath = file.path || file;
                        if (!guard.isPathAllowed(filePath)) {
                            return [3 /*break*/, 7]; // Skip disallowed files
                        }
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, fileStore.read(appId, filePath)];
                    case 5:
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
                        lines = content.split('\n');
                        // Search for pattern
                        for (i = 0; i < lines.length; i++) {
                            // Reset regex lastIndex before each test to avoid missed matches
                            searchPattern.lastIndex = 0;
                            if (searchPattern.test(lines[i])) {
                                match = {
                                    path: filePath,
                                    line: i + 1,
                                    snippet: lines[i]
                                };
                                // Add context lines if requested
                                if (context_lines > 0) {
                                    startIdx = Math.max(0, i - context_lines);
                                    endIdx = Math.min(lines.length - 1, i + context_lines);
                                    if (startIdx < i) {
                                        match.contextBefore = lines.slice(startIdx, i);
                                    }
                                    if (endIdx > i) {
                                        match.contextAfter = lines.slice(i + 1, endIdx + 1);
                                    }
                                }
                                matches.push(match);
                                if (matches.length >= max_results) {
                                    break;
                                }
                            }
                        }
                        if (matches.length >= max_results) {
                            return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        // Skip files that can't be read or don't exist
                        if (!error_3.message.includes('File not found')) {
                            console.error("Error reading file ".concat(filePath, ":"), error_3.message);
                        }
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8:
                        if (matches.length === 0) {
                            return [2 /*return*/, {
                                    content: "No matches found for \"".concat(query, "\" in ").concat(glob),
                                    isError: false,
                                    metadata: {
                                        query: query,
                                        glob: glob,
                                        regex: regex,
                                        filesSearched: files.length,
                                        matchCount: 0,
                                        storage: 'database'
                                    }
                                }];
                        }
                        resultText = matches.map(function (m) {
                            var output = "".concat(m.path, ":").concat(m.line, ": ").concat(m.snippet);
                            if (m.contextBefore && m.contextBefore.length > 0) {
                                var before = m.contextBefore.map(function (line, idx) {
                                    return "  ".concat(m.line - m.contextBefore.length + idx, " | ").concat(line);
                                }).join('\n');
                                output = "".concat(before, "\n").concat(output);
                            }
                            if (m.contextAfter && m.contextAfter.length > 0) {
                                var after = m.contextAfter.map(function (line, idx) {
                                    return "  ".concat(m.line + idx + 1, " | ").concat(line);
                                }).join('\n');
                                output = "".concat(output, "\n").concat(after);
                            }
                            return output;
                        }).join('\n---\n');
                        return [2 /*return*/, {
                                content: "Found ".concat(matches.length, " match(es) in ").concat(glob, ":\n\n").concat(resultText),
                                isError: false,
                                metadata: {
                                    query: query,
                                    glob: glob,
                                    regex: regex,
                                    filesSearched: files.length,
                                    matchCount: matches.length,
                                    matches: matches.map(function (m) { return ({ path: m.path, line: m.line }); }),
                                    storage: 'database'
                                }
                            }];
                    case 9:
                        error_4 = _a.sent();
                        return [2 /*return*/, {
                                content: "Error searching files in database: ".concat(error_4.message),
                                isError: true
                            }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return EitherSearchFilesExecutor;
}());
exports.EitherSearchFilesExecutor = EitherSearchFilesExecutor;
