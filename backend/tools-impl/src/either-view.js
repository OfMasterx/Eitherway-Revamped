"use strict";
/**
 * either-view: Read files with hash and metadata
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
exports.EitherViewExecutor = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var crypto_1 = require("crypto");
var security_js_1 = require("./security.js");
var EitherViewExecutor = /** @class */ (function () {
    function EitherViewExecutor() {
        this.name = 'either-view';
    }
    EitherViewExecutor.prototype.execute = function (input, context) {
        return __awaiter(this, void 0, void 0, function () {
            var path, _a, max_bytes, _b, encoding, guard, fullPath, content, sha256, lineCount, isTruncated, truncated, truncatedLines, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        path = input.path, _a = input.max_bytes, max_bytes = _a === void 0 ? 1048576 : _a, _b = input.encoding, encoding = _b === void 0 ? 'utf-8' : _b;
                        guard = new security_js_1.SecurityGuard(context.config.security);
                        if (!guard.isPathAllowed(path)) {
                            return [2 /*return*/, {
                                    content: "Error: Access denied to path '".concat(path, "'. Path is not in allowed workspaces."),
                                    isError: true
                                }];
                        }
                        // Use database if fileStore is available
                        if (context.fileStore && context.appId) {
                            return [2 /*return*/, this.executeWithDatabase(path, max_bytes, encoding, context)];
                        }
                        fullPath = (0, path_1.resolve)(context.workingDir, path);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, promises_1.readFile)(fullPath, encoding)];
                    case 2:
                        content = _c.sent();
                        sha256 = (0, crypto_1.createHash)('sha256').update(content).digest('hex');
                        lineCount = content.split('\n').length;
                        isTruncated = content.length > max_bytes;
                        if (isTruncated) {
                            truncated = content.slice(0, max_bytes);
                            truncatedLines = truncated.split('\n').length;
                            return [2 /*return*/, {
                                    content: "".concat(truncated, "\n\n[File truncated: ").concat(content.length, " bytes, showing first ").concat(max_bytes, " bytes]"),
                                    isError: false,
                                    metadata: {
                                        path: path,
                                        encoding: encoding,
                                        size: content.length,
                                        sha256: sha256,
                                        line_count: lineCount,
                                        truncated: true,
                                        shown_lines: truncatedLines
                                    }
                                }];
                        }
                        // Return full content with metadata
                        return [2 /*return*/, {
                                content: content,
                                isError: false,
                                metadata: {
                                    path: path,
                                    encoding: encoding,
                                    size: content.length,
                                    sha256: sha256,
                                    line_count: lineCount,
                                    truncated: false
                                }
                            }];
                    case 3:
                        error_1 = _c.sent();
                        return [2 /*return*/, {
                                content: "Error reading file '".concat(path, "': ").concat(error_1.message),
                                isError: true
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute using database FileStore
     */
    EitherViewExecutor.prototype.executeWithDatabase = function (path, max_bytes, encoding, context) {
        return __awaiter(this, void 0, void 0, function () {
            var fileStore, appId, fileData, content, sha256, lineCount, isTruncated, truncated, truncatedLines, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fileStore = context.fileStore, appId = context.appId;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fileStore.read(appId, path)];
                    case 2:
                        fileData = _a.sent();
                        content = void 0;
                        if (typeof fileData.content === 'string') {
                            content = fileData.content;
                        }
                        else if (Buffer.isBuffer(fileData.content)) {
                            content = fileData.content.toString(encoding);
                        }
                        else {
                            content = Buffer.from(fileData.content).toString(encoding);
                        }
                        sha256 = (0, crypto_1.createHash)('sha256').update(content).digest('hex');
                        lineCount = content.split('\n').length;
                        isTruncated = content.length > max_bytes;
                        if (isTruncated) {
                            truncated = content.slice(0, max_bytes);
                            truncatedLines = truncated.split('\n').length;
                            return [2 /*return*/, {
                                    content: "".concat(truncated, "\n\n[File truncated: ").concat(content.length, " bytes, showing first ").concat(max_bytes, " bytes]"),
                                    isError: false,
                                    metadata: {
                                        path: path,
                                        encoding: encoding,
                                        size: content.length,
                                        sha256: sha256,
                                        line_count: lineCount,
                                        truncated: true,
                                        shown_lines: truncatedLines,
                                        storage: 'database'
                                    }
                                }];
                        }
                        // Return full content with metadata
                        return [2 /*return*/, {
                                content: content,
                                isError: false,
                                metadata: {
                                    path: path,
                                    encoding: encoding,
                                    size: content.length,
                                    sha256: sha256,
                                    line_count: lineCount,
                                    truncated: false,
                                    storage: 'database'
                                }
                            }];
                    case 3:
                        error_2 = _a.sent();
                        return [2 /*return*/, {
                                content: "Error reading file '".concat(path, "' from database: ").concat(error_2.message),
                                isError: true
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return EitherViewExecutor;
}());
exports.EitherViewExecutor = EitherViewExecutor;
