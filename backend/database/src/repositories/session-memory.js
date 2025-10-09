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
exports.WorkingSetRepository = exports.SessionMemoryRepository = void 0;
var SessionMemoryRepository = /** @class */ (function () {
    function SessionMemoryRepository(db) {
        this.db = db;
    }
    SessionMemoryRepository.prototype.upsert = function (sessionId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.db.query("INSERT INTO core.session_memory\n       (session_id, rolling_summary, facts, last_compacted_message_id, updated_at)\n       VALUES ($1, $2, $3, $4, now())\n       ON CONFLICT (session_id)\n       DO UPDATE SET\n         rolling_summary = COALESCE($2, session_memory.rolling_summary),\n         facts = COALESCE($3, session_memory.facts),\n         last_compacted_message_id = COALESCE($4, session_memory.last_compacted_message_id),\n         updated_at = now()\n       RETURNING *", [
                            sessionId,
                            (_a = data.rollingSummary) !== null && _a !== void 0 ? _a : null,
                            data.facts ? JSON.stringify(data.facts) : null,
                            (_b = data.lastCompactedMessageId) !== null && _b !== void 0 ? _b : null
                        ])];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    SessionMemoryRepository.prototype.findBySession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.session_memory WHERE session_id = $1", [sessionId])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null];
                }
            });
        });
    };
    SessionMemoryRepository.prototype.updateSummary = function (sessionId, summary, lastMessageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.upsert(sessionId, {
                        rollingSummary: summary,
                        lastCompactedMessageId: lastMessageId
                    })];
            });
        });
    };
    SessionMemoryRepository.prototype.updateFacts = function (sessionId, facts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.upsert(sessionId, { facts: facts })];
            });
        });
    };
    SessionMemoryRepository.prototype.addFact = function (sessionId, key, value) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, currentFacts, updatedFacts;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.findBySession(sessionId)];
                    case 1:
                        existing = _b.sent();
                        currentFacts = (existing === null || existing === void 0 ? void 0 : existing.facts) || {};
                        updatedFacts = __assign(__assign({}, currentFacts), (_a = {}, _a[key] = value, _a));
                        return [2 /*return*/, this.upsert(sessionId, { facts: updatedFacts })];
                }
            });
        });
    };
    SessionMemoryRepository.prototype.delete = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("DELETE FROM core.session_memory WHERE session_id = $1", [sessionId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SessionMemoryRepository;
}());
exports.SessionMemoryRepository = SessionMemoryRepository;
var WorkingSetRepository = /** @class */ (function () {
    function WorkingSetRepository(db) {
        this.db = db;
    }
    WorkingSetRepository.prototype.add = function (sessionId_1, appId_1, fileId_1, reason_1) {
        return __awaiter(this, arguments, void 0, function (sessionId, appId, fileId, reason, pinnedBy) {
            var result;
            if (pinnedBy === void 0) { pinnedBy = 'agent'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("INSERT INTO core.working_set\n       (session_id, app_id, file_id, reason, pinned_by)\n       VALUES ($1, $2, $3, $4, $5)\n       ON CONFLICT (session_id, file_id) DO UPDATE\n       SET reason = COALESCE($4, working_set.reason),\n           pinned_by = $5\n       RETURNING *", [sessionId, appId, fileId, reason !== null && reason !== void 0 ? reason : null, pinnedBy])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    WorkingSetRepository.prototype.findBySession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.working_set\n       WHERE session_id = $1\n       ORDER BY created_at ASC", [sessionId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    WorkingSetRepository.prototype.findBySessionWithFiles = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT ws.*, f.path as file_path\n       FROM core.working_set ws\n       JOIN core.files f ON ws.file_id = f.id\n       WHERE ws.session_id = $1\n       ORDER BY ws.created_at ASC", [sessionId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    WorkingSetRepository.prototype.remove = function (sessionId, fileId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("DELETE FROM core.working_set WHERE session_id = $1 AND file_id = $2", [sessionId, fileId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WorkingSetRepository.prototype.clear = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("DELETE FROM core.working_set WHERE session_id = $1", [sessionId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WorkingSetRepository.prototype.countBySession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT COUNT(*) as count FROM core.working_set WHERE session_id = $1", [sessionId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, parseInt(result.rows[0].count, 10)];
                }
            });
        });
    };
    return WorkingSetRepository;
}());
exports.WorkingSetRepository = WorkingSetRepository;
