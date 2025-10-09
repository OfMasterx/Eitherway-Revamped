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
exports.ImpactedFilesAnalyzer = void 0;
var ImpactedFilesAnalyzer = /** @class */ (function () {
    function ImpactedFilesAnalyzer(db) {
        this.db = db;
    }
    ImpactedFilesAnalyzer.prototype.analyzeImpact = function (appId_1, fileId_1) {
        return __awaiter(this, arguments, void 0, function (appId, fileId, maxDepth) {
            var sourceFile, result, impactedFileIds, impactedFiles, impactPaths;
            if (maxDepth === void 0) { maxDepth = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getFile(fileId)];
                    case 1:
                        sourceFile = _a.sent();
                        return [4 /*yield*/, this.db.query("WITH RECURSIVE impact AS (\n        SELECT\n          f.src_file_id,\n          files.path as src_path,\n          f.ref_type::text,\n          1 as depth\n        FROM core.file_references f\n        JOIN core.files files ON f.src_file_id = files.id\n        WHERE f.app_id = $1 AND f.dest_file_id = $2\n\n        UNION\n\n        SELECT\n          f.src_file_id,\n          files.path as src_path,\n          f.ref_type::text,\n          i.depth + 1\n        FROM impact i\n        JOIN core.file_references f ON f.app_id = $1 AND f.dest_file_id = i.src_file_id\n        JOIN core.files files ON f.src_file_id = files.id\n        WHERE i.depth < $3\n      )\n      SELECT DISTINCT\n        src_file_id,\n        src_path,\n        ref_type,\n        MIN(depth) as depth\n      FROM impact\n      GROUP BY src_file_id, src_path, ref_type\n      ORDER BY depth, src_path", [appId, fileId, maxDepth])];
                    case 2:
                        result = _a.sent();
                        impactedFileIds = __spreadArray([], new Set(result.rows.map(function (r) { return r.src_file_id; })), true);
                        return [4 /*yield*/, this.getFiles(impactedFileIds)];
                    case 3:
                        impactedFiles = _a.sent();
                        impactPaths = result.rows.map(function (row) { return ({
                            from: row.src_path,
                            to: sourceFile.path,
                            refType: row.ref_type
                        }); });
                        return [2 /*return*/, {
                                sourceFile: sourceFile,
                                impactedFiles: impactedFiles,
                                impactPaths: impactPaths,
                                depth: Math.max.apply(Math, __spreadArray(__spreadArray([], result.rows.map(function (r) { return r.depth; }), false), [0], false))
                            }];
                }
            });
        });
    };
    ImpactedFilesAnalyzer.prototype.findDependencies = function (appId_1, fileId_1) {
        return __awaiter(this, arguments, void 0, function (appId, fileId, maxDepth) {
            var result, fileIds;
            if (maxDepth === void 0) { maxDepth = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("WITH RECURSIVE deps AS (\n        SELECT f.src_file_id\n        FROM core.file_references f\n        WHERE f.app_id = $1 AND f.dest_file_id = $2\n\n        UNION\n\n        SELECT f.src_file_id\n        FROM deps d\n        JOIN core.file_references f ON f.app_id = $1 AND f.dest_file_id = d.src_file_id\n        WHERE (SELECT COUNT(*) FROM deps) < $3\n      )\n      SELECT DISTINCT src_file_id FROM deps", [appId, fileId, maxDepth * 100])];
                    case 1:
                        result = _a.sent();
                        fileIds = result.rows.map(function (r) { return r.src_file_id; });
                        return [2 /*return*/, this.getFiles(fileIds)];
                }
            });
        });
    };
    ImpactedFilesAnalyzer.prototype.getImpactSummary = function (appId, fileId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, directImpacts, totalImpacts, affectedTypes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("WITH RECURSIVE impact AS (\n        SELECT f.src_file_id, f.ref_type::text, 1 as depth\n        FROM core.file_references f\n        WHERE f.app_id = $1 AND f.dest_file_id = $2\n\n        UNION\n\n        SELECT f.src_file_id, f.ref_type::text, i.depth + 1\n        FROM impact i\n        JOIN core.file_references f ON f.app_id = $1 AND f.dest_file_id = i.src_file_id\n        WHERE i.depth < 10\n      )\n      SELECT depth, ref_type, COUNT(DISTINCT src_file_id)::text as count\n      FROM impact\n      GROUP BY depth, ref_type", [appId, fileId])];
                    case 1:
                        result = _a.sent();
                        directImpacts = result.rows
                            .filter(function (r) { return r.depth === 1; })
                            .reduce(function (sum, r) { return sum + parseInt(r.count, 10); }, 0);
                        totalImpacts = result.rows
                            .reduce(function (sum, r) { return sum + parseInt(r.count, 10); }, 0);
                        affectedTypes = {};
                        result.rows.forEach(function (r) {
                            affectedTypes[r.ref_type] = (affectedTypes[r.ref_type] || 0) + parseInt(r.count, 10);
                        });
                        return [2 /*return*/, { directImpacts: directImpacts, totalImpacts: totalImpacts, affectedTypes: affectedTypes }];
                }
            });
        });
    };
    ImpactedFilesAnalyzer.prototype.getFile = function (fileId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.files WHERE id = $1", [fileId])];
                    case 1:
                        result = _a.sent();
                        if (!result.rows[0]) {
                            throw new Error("File ".concat(fileId, " not found"));
                        }
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    ImpactedFilesAnalyzer.prototype.getFiles = function (fileIds) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (fileIds.length === 0)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, this.db.query("SELECT * FROM core.files WHERE id = ANY($1::uuid[]) ORDER BY path", [fileIds])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    return ImpactedFilesAnalyzer;
}());
exports.ImpactedFilesAnalyzer = ImpactedFilesAnalyzer;
