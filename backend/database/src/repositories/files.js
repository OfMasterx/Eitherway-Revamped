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
exports.FileReferencesRepository = exports.FilesRepository = void 0;
var crypto_1 = require("crypto");
var FilesRepository = /** @class */ (function () {
    function FilesRepository(db) {
        this.db = db;
    }
    FilesRepository.prototype.upsertFile = function (appId, path, content, userId, mimeType) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.db.transaction(function (client) { return __awaiter(_this, void 0, void 0, function () {
                        var isBuffer, isBinary, bytes, sha256, sizeBytes, fileResult, file, versionCountResult, nextVersion, contentText, contentBytes, versionResult, version;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    isBuffer = Buffer.isBuffer(content);
                                    isBinary = !!(isBuffer ||
                                        ((_a = mimeType === null || mimeType === void 0 ? void 0 : mimeType.startsWith('image/')) !== null && _a !== void 0 ? _a : false) ||
                                        ((_b = mimeType === null || mimeType === void 0 ? void 0 : mimeType.startsWith('application/')) !== null && _b !== void 0 ? _b : false));
                                    bytes = isBuffer ? content : Buffer.from(content, 'utf-8');
                                    sha256 = (0, crypto_1.createHash)('sha256').update(bytes).digest();
                                    sizeBytes = bytes.length;
                                    return [4 /*yield*/, client.query("INSERT INTO core.files (app_id, path, is_binary, mime_type, size_bytes, sha256)\n         VALUES ($1, $2, $3, $4, $5, $6)\n         ON CONFLICT (app_id, path)\n         DO UPDATE SET\n           is_binary = EXCLUDED.is_binary,\n           mime_type = EXCLUDED.mime_type,\n           size_bytes = EXCLUDED.size_bytes,\n           sha256 = EXCLUDED.sha256,\n           updated_at = now()\n         RETURNING *", [appId, path, isBinary, mimeType !== null && mimeType !== void 0 ? mimeType : null, sizeBytes, sha256])];
                                case 1:
                                    fileResult = _c.sent();
                                    file = fileResult.rows[0];
                                    return [4 /*yield*/, client.query("SELECT COUNT(*) as count FROM core.file_versions WHERE file_id = $1", [file.id])];
                                case 2:
                                    versionCountResult = _c.sent();
                                    nextVersion = parseInt(versionCountResult.rows[0].count, 10) + 1;
                                    contentText = isBinary ? null : (Buffer.isBuffer(content) ? content.toString('utf-8') : content);
                                    contentBytes = isBinary ? bytes : null;
                                    return [4 /*yield*/, client.query("INSERT INTO core.file_versions\n         (file_id, version, parent_version_id, content_text, content_bytes, created_by)\n         VALUES ($1, $2, $3, $4, $5, $6)\n         RETURNING *", [
                                            file.id,
                                            nextVersion,
                                            file.head_version_id,
                                            contentText,
                                            contentBytes,
                                            userId !== null && userId !== void 0 ? userId : null
                                        ])];
                                case 3:
                                    versionResult = _c.sent();
                                    version = versionResult.rows[0];
                                    return [4 /*yield*/, client.query("UPDATE core.files SET head_version_id = $1 WHERE id = $2", [version.id, file.id])];
                                case 4:
                                    _c.sent();
                                    return [2 /*return*/, __assign(__assign({}, file), { head_version_id: version.id })];
                            }
                        });
                    }); })];
            });
        });
    };
    FilesRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.files WHERE id = $1", [id])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null];
                }
            });
        });
    };
    FilesRepository.prototype.findByAppAndPath = function (appId, path) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.files WHERE app_id = $1 AND path = $2", [appId, path])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null];
                }
            });
        });
    };
    FilesRepository.prototype.findByApp = function (appId_1) {
        return __awaiter(this, arguments, void 0, function (appId, limit) {
            var result;
            if (limit === void 0) { limit = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.files\n       WHERE app_id = $1\n       ORDER BY path ASC\n       LIMIT $2", [appId, limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    FilesRepository.prototype.searchByPath = function (appId_1, pathPattern_1) {
        return __awaiter(this, arguments, void 0, function (appId, pathPattern, limit) {
            var result;
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.files\n       WHERE app_id = $1 AND path ILIKE $2\n       ORDER BY path ASC\n       LIMIT $3", [appId, "%".concat(pathPattern, "%"), limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    FilesRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("DELETE FROM core.files WHERE id = $1", [id])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    FilesRepository.prototype.getHeadVersion = function (fileId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT fv.*\n       FROM core.file_versions fv\n       JOIN core.files f ON f.head_version_id = fv.id\n       WHERE f.id = $1", [fileId])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null];
                }
            });
        });
    };
    FilesRepository.prototype.getVersionHistory = function (fileId_1) {
        return __awaiter(this, arguments, void 0, function (fileId, limit) {
            var result;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.file_versions\n       WHERE file_id = $1\n       ORDER BY version DESC\n       LIMIT $2", [fileId, limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    FilesRepository.prototype.getVersion = function (fileId, version) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.file_versions\n       WHERE file_id = $1 AND version = $2", [fileId, version])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null];
                }
            });
        });
    };
    return FilesRepository;
}());
exports.FilesRepository = FilesRepository;
var FileReferencesRepository = /** @class */ (function () {
    function FileReferencesRepository(db) {
        this.db = db;
    }
    FileReferencesRepository.prototype.create = function (appId_1, srcFileId_1, refType_1) {
        return __awaiter(this, arguments, void 0, function (appId, srcFileId, refType, options) {
            var result;
            var _a, _b, _c;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.db.query("INSERT INTO core.file_references\n       (app_id, src_file_id, dest_file_id, raw_target, symbol, ref_type)\n       VALUES ($1, $2, $3, $4, $5, $6)\n       RETURNING *", [
                            appId,
                            srcFileId,
                            (_a = options.destFileId) !== null && _a !== void 0 ? _a : null,
                            (_b = options.rawTarget) !== null && _b !== void 0 ? _b : null,
                            (_c = options.symbol) !== null && _c !== void 0 ? _c : null,
                            refType
                        ])];
                    case 1:
                        result = _d.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    FileReferencesRepository.prototype.findBySourceFile = function (srcFileId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.file_references\n       WHERE src_file_id = $1\n       ORDER BY created_at ASC", [srcFileId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    FileReferencesRepository.prototype.findByDestFile = function (destFileId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.file_references\n       WHERE dest_file_id = $1\n       ORDER BY created_at ASC", [destFileId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    FileReferencesRepository.prototype.findByApp = function (appId_1) {
        return __awaiter(this, arguments, void 0, function (appId, limit) {
            var result;
            if (limit === void 0) { limit = 10000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.file_references\n       WHERE app_id = $1\n       LIMIT $2", [appId, limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    FileReferencesRepository.prototype.deleteBySourceFile = function (srcFileId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("DELETE FROM core.file_references WHERE src_file_id = $1", [srcFileId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    FileReferencesRepository.prototype.rebuildReferencesForFile = function (appId, srcFileId, references) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.db.transaction(function (client) { return __awaiter(_this, void 0, void 0, function () {
                        var created, _i, references_1, ref, result;
                        var _a, _b, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0: return [4 /*yield*/, client.query("DELETE FROM core.file_references WHERE src_file_id = $1", [srcFileId])];
                                case 1:
                                    _d.sent();
                                    created = [];
                                    _i = 0, references_1 = references;
                                    _d.label = 2;
                                case 2:
                                    if (!(_i < references_1.length)) return [3 /*break*/, 5];
                                    ref = references_1[_i];
                                    return [4 /*yield*/, client.query("INSERT INTO core.file_references\n           (app_id, src_file_id, dest_file_id, raw_target, symbol, ref_type)\n           VALUES ($1, $2, $3, $4, $5, $6)\n           RETURNING *", [
                                            appId,
                                            srcFileId,
                                            (_a = ref.destFileId) !== null && _a !== void 0 ? _a : null,
                                            (_b = ref.rawTarget) !== null && _b !== void 0 ? _b : null,
                                            (_c = ref.symbol) !== null && _c !== void 0 ? _c : null,
                                            ref.refType
                                        ])];
                                case 3:
                                    result = _d.sent();
                                    created.push(result.rows[0]);
                                    _d.label = 4;
                                case 4:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 5: return [2 /*return*/, created];
                            }
                        });
                    }); })];
            });
        });
    };
    return FileReferencesRepository;
}());
exports.FileReferencesRepository = FileReferencesRepository;
