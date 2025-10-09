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
exports.DiffBuilder = void 0;
var files_js_1 = require("../repositories/files.js");
var diff_1 = require("diff");
var DiffBuilder = /** @class */ (function () {
    function DiffBuilder(db) {
        this.db = db;
        this.filesRepo = new files_js_1.FilesRepository(db);
    }
    DiffBuilder.prototype.buildDiff = function (_appId, fileId, newContent) {
        return __awaiter(this, void 0, void 0, function () {
            var file, currentVersion, oldContent, patch, lines, linesAdded, linesRemoved;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.filesRepo.findById(fileId)];
                    case 1:
                        file = _a.sent();
                        if (!file) {
                            throw new Error("File ".concat(fileId, " not found"));
                        }
                        return [4 /*yield*/, this.filesRepo.getHeadVersion(fileId)];
                    case 2:
                        currentVersion = _a.sent();
                        oldContent = (currentVersion === null || currentVersion === void 0 ? void 0 : currentVersion.content_text) || '';
                        patch = (0, diff_1.createTwoFilesPatch)(file.path, file.path, oldContent, newContent, 'current', 'proposed');
                        lines = patch.split('\n');
                        linesAdded = lines.filter(function (l) { return l.startsWith('+'); }).length;
                        linesRemoved = lines.filter(function (l) { return l.startsWith('-'); }).length;
                        return [2 /*return*/, {
                                path: file.path,
                                oldContent: oldContent,
                                newContent: newContent,
                                patch: patch,
                                linesAdded: linesAdded,
                                linesRemoved: linesRemoved
                            }];
                }
            });
        });
    };
    DiffBuilder.prototype.buildMultiFileDiff = function (appId, changes) {
        return __awaiter(this, void 0, void 0, function () {
            var changedFiles, _i, changes_1, change, diff, impactedFileIds, impactedFiles, totalChanges;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        changedFiles = [];
                        _i = 0, changes_1 = changes;
                        _a.label = 1;
                    case 1:
                        if (!(_i < changes_1.length)) return [3 /*break*/, 4];
                        change = changes_1[_i];
                        return [4 /*yield*/, this.buildDiff(appId, change.fileId, change.newContent)];
                    case 2:
                        diff = _a.sent();
                        changedFiles.push(diff);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, this.getImpactedFiles(appId, changes.map(function (c) { return c.fileId; }))];
                    case 5:
                        impactedFileIds = _a.sent();
                        return [4 /*yield*/, Promise.all(impactedFileIds.map(function (id) { return __awaiter(_this, void 0, void 0, function () {
                                var file;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.filesRepo.findById(id)];
                                        case 1:
                                            file = _a.sent();
                                            return [2 /*return*/, {
                                                    path: (file === null || file === void 0 ? void 0 : file.path) || 'unknown',
                                                    reason: 'Referenced by changed file'
                                                }];
                                    }
                                });
                            }); }))];
                    case 6:
                        impactedFiles = _a.sent();
                        totalChanges = {
                            filesChanged: changedFiles.length,
                            linesAdded: changedFiles.reduce(function (sum, f) { return sum + f.linesAdded; }, 0),
                            linesRemoved: changedFiles.reduce(function (sum, f) { return sum + f.linesRemoved; }, 0)
                        };
                        return [2 /*return*/, {
                                changedFiles: changedFiles,
                                impactedFiles: impactedFiles,
                                totalChanges: totalChanges
                            }];
                }
            });
        });
    };
    DiffBuilder.prototype.formatDiffForPrompt = function (diffContext, maxLines) {
        if (maxLines === void 0) { maxLines = 500; }
        var sections = [];
        sections.push('# Proposed Changes\n');
        if (diffContext.changedFiles.length > 0) {
            sections.push("Files changed: ".concat(diffContext.totalChanges.filesChanged));
            sections.push("Lines added: +".concat(diffContext.totalChanges.linesAdded));
            sections.push("Lines removed: -".concat(diffContext.totalChanges.linesRemoved, "\n"));
            var totalLines = 0;
            for (var _i = 0, _a = diffContext.changedFiles; _i < _a.length; _i++) {
                var file = _a[_i];
                if (totalLines >= maxLines) {
                    sections.push('... (diff truncated due to size)');
                    break;
                }
                sections.push("## ".concat(file.path));
                sections.push('```diff');
                var patchLines = file.patch.split('\n').slice(4);
                var displayLines = patchLines.slice(0, Math.min(patchLines.length, maxLines - totalLines));
                sections.push(displayLines.join('\n'));
                sections.push('```\n');
                totalLines += displayLines.length;
            }
        }
        if (diffContext.impactedFiles.length > 0) {
            sections.push('## Potentially Impacted Files\n');
            diffContext.impactedFiles.slice(0, 10).forEach(function (f) {
                sections.push("- ".concat(f.path, " (").concat(f.reason, ")"));
            });
            if (diffContext.impactedFiles.length > 10) {
                sections.push("... and ".concat(diffContext.impactedFiles.length - 10, " more"));
            }
        }
        return sections.join('\n');
    };
    DiffBuilder.prototype.getImpactedFiles = function (appId, sourceFileIds) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (sourceFileIds.length === 0)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, this.db.query("WITH RECURSIVE impact AS (\n        SELECT f.dest_file_id\n        FROM core.file_references f\n        WHERE f.app_id = $1 AND f.src_file_id = ANY($2::uuid[])\n\n        UNION\n\n        SELECT f.dest_file_id\n        FROM impact i\n        JOIN core.file_references f ON f.app_id = $1 AND f.src_file_id = i.dest_file_id\n        WHERE (SELECT COUNT(*) FROM impact) < 100\n      )\n      SELECT DISTINCT dest_file_id FROM impact", [appId, sourceFileIds])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (r) { return r.dest_file_id; })];
                }
            });
        });
    };
    return DiffBuilder;
}());
exports.DiffBuilder = DiffBuilder;
