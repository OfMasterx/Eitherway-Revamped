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
exports.PreparedQueries = void 0;
var PreparedQueries = /** @class */ (function () {
    function PreparedQueries(db) {
        this.db = db;
    }
    PreparedQueries.prototype.getRecentMessages = function (sessionId_1) {
        return __awaiter(this, arguments, void 0, function (sessionId, limit) {
            var result;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT id, session_id, role, content, model, token_count, created_at\n       FROM core.messages\n       WHERE session_id = $1\n       ORDER BY created_at DESC\n       LIMIT $2", [sessionId, limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.reverse()];
                }
            });
        });
    };
    PreparedQueries.prototype.getSessionWithMemory = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionResult, _a, messages, memoryResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.sessions WHERE id = $1", [sessionId])];
                    case 1:
                        sessionResult = _b.sent();
                        if (sessionResult.rows.length === 0)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, Promise.all([
                                this.getRecentMessages(sessionId, 10),
                                this.db.query("SELECT * FROM core.session_memory WHERE session_id = $1", [sessionId])
                            ])];
                    case 2:
                        _a = _b.sent(), messages = _a[0], memoryResult = _a[1];
                        return [2 /*return*/, {
                                session: sessionResult.rows[0],
                                recentMessages: messages,
                                memory: memoryResult.rows[0] || null
                            }];
                }
            });
        });
    };
    PreparedQueries.prototype.getAppFiles = function (appId_1) {
        return __awaiter(this, arguments, void 0, function (appId, limit) {
            var result;
            if (limit === void 0) { limit = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT id, app_id, path, is_binary, mime_type, size_bytes, sha256,\n              head_version_id, created_at, updated_at\n       FROM core.files\n       WHERE app_id = $1\n       ORDER BY path ASC\n       LIMIT $2", [appId, limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    PreparedQueries.prototype.getFilesByPaths = function (appId, paths) {
        return __awaiter(this, void 0, void 0, function () {
            var result, map;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (paths.length === 0)
                            return [2 /*return*/, new Map()];
                        return [4 /*yield*/, this.db.query("SELECT * FROM core.files\n       WHERE app_id = $1 AND path = ANY($2::text[])", [appId, paths])];
                    case 1:
                        result = _a.sent();
                        map = new Map();
                        result.rows.forEach(function (file) {
                            map.set(file.path, file);
                        });
                        return [2 /*return*/, map];
                }
            });
        });
    };
    PreparedQueries.prototype.getWorkingSetWithFiles = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT session_id, app_id, file_id, reason, pinned_by, created_at,\n              file_path, is_binary, mime_type, size_bytes, file_updated_at\n       FROM core.working_set_enriched\n       WHERE session_id = $1\n       ORDER BY created_at ASC", [sessionId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    PreparedQueries.prototype.bulkInsertMessages = function (messages) {
        return __awaiter(this, void 0, void 0, function () {
            var values, params, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (messages.length === 0)
                            return [2 /*return*/, []];
                        values = messages.map(function (_m, i) {
                            var base = i * 5;
                            return "($".concat(base + 1, ", $").concat(base + 2, ", $").concat(base + 3, ", $").concat(base + 4, ", $").concat(base + 5, ")");
                        }).join(', ');
                        params = [];
                        messages.forEach(function (m) {
                            var _a, _b;
                            params.push(m.sessionId, m.role, JSON.stringify(m.content), (_a = m.model) !== null && _a !== void 0 ? _a : null, (_b = m.tokenCount) !== null && _b !== void 0 ? _b : null);
                        });
                        return [4 /*yield*/, this.db.query("INSERT INTO core.messages (session_id, role, content, model, token_count)\n       VALUES ".concat(values, "\n       RETURNING *"), params)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    return PreparedQueries;
}());
exports.PreparedQueries = PreparedQueries;
