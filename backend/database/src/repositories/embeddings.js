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
exports.EmbeddingsRepository = void 0;
var EmbeddingsRepository = /** @class */ (function () {
    function EmbeddingsRepository(db) {
        this.db = db;
    }
    EmbeddingsRepository.prototype.create = function (appId_1, scope_1, vector_1) {
        return __awaiter(this, arguments, void 0, function (appId, scope, vector, options) {
            var result;
            var _a, _b, _c;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.db.query("INSERT INTO core.doc_embeddings\n       (app_id, scope, ref_id, chunk_idx, vector, content_preview, metadata)\n       VALUES ($1, $2, $3, $4, $5, $6, $7)\n       RETURNING *", [
                            appId,
                            scope,
                            (_a = options.refId) !== null && _a !== void 0 ? _a : null,
                            (_b = options.chunkIdx) !== null && _b !== void 0 ? _b : null,
                            JSON.stringify(vector),
                            (_c = options.contentPreview) !== null && _c !== void 0 ? _c : null,
                            options.metadata ? JSON.stringify(options.metadata) : null
                        ])];
                    case 1:
                        result = _d.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    EmbeddingsRepository.prototype.findByRef = function (refId, scope) {
        return __awaiter(this, void 0, void 0, function () {
            var query, params, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = scope
                            ? "SELECT * FROM core.doc_embeddings WHERE ref_id = $1 AND scope = $2 ORDER BY chunk_idx ASC"
                            : "SELECT * FROM core.doc_embeddings WHERE ref_id = $1 ORDER BY chunk_idx ASC";
                        params = scope ? [refId, scope] : [refId];
                        return [4 /*yield*/, this.db.query(query, params)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    EmbeddingsRepository.prototype.semanticSearch = function (appId_1, queryVector_1) {
        return __awaiter(this, arguments, void 0, function (appId, queryVector, options) {
            var limit, minSimilarity, query, params, result;
            var _a, _b;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        limit = (_a = options.limit) !== null && _a !== void 0 ? _a : 10;
                        minSimilarity = (_b = options.minSimilarity) !== null && _b !== void 0 ? _b : 0.7;
                        query = "\n      SELECT *,\n        1 - (vector <=> $2::vector) AS similarity\n      FROM core.doc_embeddings\n      WHERE app_id = $1\n    ";
                        params = [appId, JSON.stringify(queryVector)];
                        if (options.scope) {
                            query += " AND scope = $".concat(params.length + 1);
                            params.push(options.scope);
                        }
                        query += "\n      AND 1 - (vector <=> $2::vector) >= $".concat(params.length + 1, "\n      ORDER BY vector <=> $2::vector\n      LIMIT $").concat(params.length + 2, "\n    ");
                        params.push(minSimilarity, limit);
                        return [4 /*yield*/, this.db.query(query, params)];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    EmbeddingsRepository.prototype.deleteByRef = function (refId, scope) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!scope) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.db.query("DELETE FROM core.doc_embeddings WHERE ref_id = $1 AND scope = $2", [refId, scope])];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.db.query("DELETE FROM core.doc_embeddings WHERE ref_id = $1", [refId])];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EmbeddingsRepository.prototype.upsertFileEmbeddings = function (appId, fileId, embeddings) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.db.transaction(function (client) { return __awaiter(_this, void 0, void 0, function () {
                        var created, _i, embeddings_1, emb, result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, client.query("DELETE FROM core.doc_embeddings WHERE app_id = $1 AND ref_id = $2 AND scope = 'file'", [appId, fileId])];
                                case 1:
                                    _a.sent();
                                    created = [];
                                    _i = 0, embeddings_1 = embeddings;
                                    _a.label = 2;
                                case 2:
                                    if (!(_i < embeddings_1.length)) return [3 /*break*/, 5];
                                    emb = embeddings_1[_i];
                                    return [4 /*yield*/, client.query("INSERT INTO core.doc_embeddings\n           (app_id, scope, ref_id, chunk_idx, vector, content_preview, metadata)\n           VALUES ($1, 'file', $2, $3, $4, $5, $6)\n           RETURNING *", [
                                            appId,
                                            fileId,
                                            emb.chunkIdx,
                                            JSON.stringify(emb.vector),
                                            emb.contentPreview,
                                            emb.metadata ? JSON.stringify(emb.metadata) : null
                                        ])];
                                case 3:
                                    result = _a.sent();
                                    created.push(result.rows[0]);
                                    _a.label = 4;
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
    EmbeddingsRepository.prototype.countByApp = function (appId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT COUNT(*) as count FROM core.doc_embeddings WHERE app_id = $1", [appId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, parseInt(result.rows[0].count, 10)];
                }
            });
        });
    };
    return EmbeddingsRepository;
}());
exports.EmbeddingsRepository = EmbeddingsRepository;
