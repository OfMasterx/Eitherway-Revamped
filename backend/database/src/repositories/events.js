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
exports.EventsRepository = void 0;
var EventsRepository = /** @class */ (function () {
    function EventsRepository(db) {
        this.db = db;
    }
    EventsRepository.prototype.log = function (kind_1, payload_1) {
        return __awaiter(this, arguments, void 0, function (kind, payload, options) {
            var result;
            var _a, _b, _c;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.db.query("INSERT INTO core.events (session_id, app_id, actor, kind, payload)\n       VALUES ($1, $2, $3, $4, $5)\n       RETURNING *", [
                            (_a = options.sessionId) !== null && _a !== void 0 ? _a : null,
                            (_b = options.appId) !== null && _b !== void 0 ? _b : null,
                            (_c = options.actor) !== null && _c !== void 0 ? _c : null,
                            kind,
                            JSON.stringify(payload)
                        ])];
                    case 1:
                        result = _d.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    EventsRepository.prototype.findBySession = function (sessionId_1) {
        return __awaiter(this, arguments, void 0, function (sessionId, limit, offset) {
            var result;
            if (limit === void 0) { limit = 100; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.events\n       WHERE session_id = $1\n       ORDER BY id DESC\n       LIMIT $2 OFFSET $3", [sessionId, limit, offset])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    EventsRepository.prototype.findByApp = function (appId_1) {
        return __awaiter(this, arguments, void 0, function (appId, limit, offset) {
            var result;
            if (limit === void 0) { limit = 100; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.events\n       WHERE app_id = $1\n       ORDER BY id DESC\n       LIMIT $2 OFFSET $3", [appId, limit, offset])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    EventsRepository.prototype.findByKind = function (kind_1) {
        return __awaiter(this, arguments, void 0, function (kind, limit, offset) {
            var result;
            if (limit === void 0) { limit = 100; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.events\n       WHERE kind = $1\n       ORDER BY created_at DESC\n       LIMIT $2 OFFSET $3", [kind, limit, offset])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    EventsRepository.prototype.findRecent = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var result;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.events\n       ORDER BY id DESC\n       LIMIT $1", [limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    EventsRepository.prototype.deleteBySession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("DELETE FROM core.events WHERE session_id = $1", [sessionId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    EventsRepository.prototype.deleteOlderThan = function (daysAgo) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("WITH deleted AS (\n         DELETE FROM core.events\n         WHERE created_at < now() - interval '1 day' * $1\n         RETURNING id\n       )\n       SELECT COUNT(*) as count FROM deleted", [daysAgo])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, parseInt(result.rows[0].count, 10)];
                }
            });
        });
    };
    return EventsRepository;
}());
exports.EventsRepository = EventsRepository;
