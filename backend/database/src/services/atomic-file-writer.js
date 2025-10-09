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
exports.AtomicFileWriter = void 0;
var crypto_1 = require("crypto");
var AtomicFileWriter = /** @class */ (function () {
    function AtomicFileWriter(db) {
        this.db = db;
    }
    AtomicFileWriter.prototype.writeFile = function (appId, path, content, userId, mimeType) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.db.transaction(function (client) { return __awaiter(_this, void 0, void 0, function () {
                        var isBuffer, isBinary, bytes, sha256, sizeBytes, lockResult, existingFile, file, updateResult, insertResult, versionCountResult, nextVersion, contentText, contentBytes, versionResult, version, impactResult, impactedFileIds;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    isBuffer = Buffer.isBuffer(content);
                                    isBinary = isBuffer || (mimeType === null || mimeType === void 0 ? void 0 : mimeType.startsWith('image/')) || (mimeType === null || mimeType === void 0 ? void 0 : mimeType.startsWith('application/'));
                                    bytes = isBuffer ? content : Buffer.from(content, 'utf-8');
                                    sha256 = (0, crypto_1.createHash)('sha256').update(bytes).digest();
                                    sizeBytes = bytes.length;
                                    return [4 /*yield*/, client.query("SELECT * FROM core.files\n         WHERE app_id = $1 AND path = $2\n         FOR UPDATE", [appId, path])];
                                case 1:
                                    lockResult = _a.sent();
                                    existingFile = lockResult.rows[0];
                                    if (!existingFile) return [3 /*break*/, 3];
                                    return [4 /*yield*/, client.query("UPDATE core.files\n           SET is_binary = $3,\n               mime_type = $4,\n               size_bytes = $5,\n               sha256 = $6,\n               updated_at = now()\n           WHERE id = $1 AND app_id = $2\n           RETURNING *", [existingFile.id, appId, isBinary, mimeType !== null && mimeType !== void 0 ? mimeType : null, sizeBytes, sha256])];
                                case 2:
                                    updateResult = _a.sent();
                                    file = updateResult.rows[0];
                                    return [3 /*break*/, 5];
                                case 3: return [4 /*yield*/, client.query("INSERT INTO core.files (app_id, path, is_binary, mime_type, size_bytes, sha256)\n           VALUES ($1, $2, $3, $4, $5, $6)\n           RETURNING *", [appId, path, isBinary, mimeType !== null && mimeType !== void 0 ? mimeType : null, sizeBytes, sha256])];
                                case 4:
                                    insertResult = _a.sent();
                                    file = insertResult.rows[0];
                                    _a.label = 5;
                                case 5: return [4 /*yield*/, client.query("SELECT COUNT(*) as count FROM core.file_versions WHERE file_id = $1", [file.id])];
                                case 6:
                                    versionCountResult = _a.sent();
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
                                case 7:
                                    versionResult = _a.sent();
                                    version = versionResult.rows[0];
                                    return [4 /*yield*/, client.query("UPDATE core.files SET head_version_id = $1 WHERE id = $2", [version.id, file.id])];
                                case 8:
                                    _a.sent();
                                    return [4 /*yield*/, client.query("WITH RECURSIVE impact AS (\n          SELECT f.dest_file_id\n          FROM core.file_references f\n          WHERE f.app_id = $1 AND f.src_file_id = $2\n\n          UNION\n\n          SELECT f.dest_file_id\n          FROM impact i\n          JOIN core.file_references f ON f.app_id = $1 AND f.src_file_id = i.dest_file_id\n          WHERE (SELECT COUNT(*) FROM impact) < 100\n        )\n        SELECT DISTINCT dest_file_id FROM impact", [appId, file.id])];
                                case 9:
                                    impactResult = _a.sent();
                                    impactedFileIds = impactResult.rows.map(function (r) { return r.dest_file_id; });
                                    return [2 /*return*/, {
                                            file: __assign(__assign({}, file), { head_version_id: version.id }),
                                            version: version,
                                            impactedFileIds: impactedFileIds
                                        }];
                            }
                        });
                    }); })];
            });
        });
    };
    AtomicFileWriter.prototype.batchWrite = function (appId, files, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, files_1, f, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        _i = 0, files_1 = files;
                        _a.label = 1;
                    case 1:
                        if (!(_i < files_1.length)) return [3 /*break*/, 4];
                        f = files_1[_i];
                        return [4 /*yield*/, this.writeFile(appId, f.path, f.content, userId, f.mimeType)];
                    case 2:
                        result = _a.sent();
                        results.push(result);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    return AtomicFileWriter;
}());
exports.AtomicFileWriter = AtomicFileWriter;
