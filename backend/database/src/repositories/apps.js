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
exports.AppsRepository = void 0;
var AppsRepository = /** @class */ (function () {
    function AppsRepository(db) {
        this.db = db;
    }
    AppsRepository.prototype.create = function (ownerId_1, name_1) {
        return __awaiter(this, arguments, void 0, function (ownerId, name, visibility) {
            var result;
            if (visibility === void 0) { visibility = 'private'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("INSERT INTO core.apps (owner_id, name, visibility)\n       VALUES ($1, $2, $3)\n       RETURNING *", [ownerId, name, visibility])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    AppsRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.apps WHERE id = $1", [id])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null];
                }
            });
        });
    };
    AppsRepository.prototype.findByOwner = function (ownerId_1) {
        return __awaiter(this, arguments, void 0, function (ownerId, limit, offset) {
            var result;
            if (limit === void 0) { limit = 50; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.apps\n       WHERE owner_id = $1\n       ORDER BY created_at DESC\n       LIMIT $2 OFFSET $3", [ownerId, limit, offset])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    AppsRepository.prototype.update = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.db.query("UPDATE core.apps\n       SET name = COALESCE($2, name),\n           visibility = COALESCE($3, visibility),\n           default_session_id = COALESCE($4, default_session_id)\n       WHERE id = $1\n       RETURNING *", [id, (_a = data.name) !== null && _a !== void 0 ? _a : null, (_b = data.visibility) !== null && _b !== void 0 ? _b : null, (_c = data.default_session_id) !== null && _c !== void 0 ? _c : null])];
                    case 1:
                        result = _d.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    AppsRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("DELETE FROM core.apps WHERE id = $1", [id])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return AppsRepository;
}());
exports.AppsRepository = AppsRepository;
