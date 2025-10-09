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
exports.IntegrityChecker = void 0;
var sharp_1 = require("sharp");
var crypto_1 = require("crypto");
var IntegrityChecker = /** @class */ (function () {
    function IntegrityChecker(db) {
        this.db = db;
    }
    IntegrityChecker.prototype.verifyFileChecksums = function (appId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.verify_file_checksums($1)", [appId !== null && appId !== void 0 ? appId : null])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                fileId: row.file_id,
                                path: row.path,
                                storedChecksum: row.stored_checksum.toString('hex'),
                                computedChecksum: row.computed_checksum.toString('hex'),
                                matches: row.matches
                            }); })];
                }
            });
        });
    };
    IntegrityChecker.prototype.verifyImageIntegrity = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, results, _i, _a, row, assetResult, asset, dimensionsValid, metadata, _b, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.verify_image_integrity($1)", [jobId !== null && jobId !== void 0 ? jobId : null])];
                    case 1:
                        result = _c.sent();
                        results = [];
                        _i = 0, _a = result.rows;
                        _c.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                        row = _a[_i];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 9, , 10]);
                        return [4 /*yield*/, this.db.query("SELECT bytes, width, height FROM core.image_assets WHERE id = $1", [row.asset_id])];
                    case 4:
                        assetResult = _c.sent();
                        asset = assetResult.rows[0];
                        dimensionsValid = false;
                        if (!(asset && asset.bytes)) return [3 /*break*/, 8];
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, (0, sharp_1.default)(asset.bytes).metadata()];
                    case 6:
                        metadata = _c.sent();
                        dimensionsValid = metadata.width === asset.width && metadata.height === asset.height;
                        return [3 /*break*/, 8];
                    case 7:
                        _b = _c.sent();
                        dimensionsValid = false;
                        return [3 /*break*/, 8];
                    case 8:
                        results.push({
                            assetId: row.asset_id,
                            jobId: row.job_id,
                            mimeType: row.mime_type,
                            hasValidMagicBytes: row.has_valid_magic_bytes,
                            hasValidEOF: row.has_valid_eof,
                            checksumValid: row.checksum_valid,
                            dimensionsValid: dimensionsValid
                        });
                        return [3 /*break*/, 10];
                    case 9:
                        error_1 = _c.sent();
                        results.push({
                            assetId: row.asset_id,
                            jobId: row.job_id,
                            mimeType: row.mime_type,
                            hasValidMagicBytes: row.has_valid_magic_bytes,
                            hasValidEOF: row.has_valid_eof,
                            checksumValid: row.checksum_valid,
                            dimensionsValid: false,
                            error: error_1.message
                        });
                        return [3 /*break*/, 10];
                    case 10:
                        _i++;
                        return [3 /*break*/, 2];
                    case 11: return [2 /*return*/, results];
                }
            });
        });
    };
    IntegrityChecker.prototype.runFullIntegrityCheck = function (appId) {
        return __awaiter(this, void 0, void 0, function () {
            var files, images, validFiles, validImages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.verifyFileChecksums(appId)];
                    case 1:
                        files = _a.sent();
                        return [4 /*yield*/, this.verifyImageIntegrity()];
                    case 2:
                        images = _a.sent();
                        validFiles = files.filter(function (f) { return f.matches; }).length;
                        validImages = images.filter(function (i) {
                            return i.hasValidMagicBytes && i.hasValidEOF && i.checksumValid && i.dimensionsValid;
                        }).length;
                        return [2 /*return*/, {
                                files: files,
                                images: images,
                                summary: {
                                    totalFiles: files.length,
                                    validFiles: validFiles,
                                    totalImages: images.length,
                                    validImages: validImages
                                }
                            }];
                }
            });
        });
    };
    IntegrityChecker.prototype.repairFileChecksum = function (fileId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, version, content, correctChecksum;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT fv.content_text, fv.content_bytes\n       FROM core.files f\n       JOIN core.file_versions fv ON f.head_version_id = fv.id\n       WHERE f.id = $1", [fileId])];
                    case 1:
                        result = _a.sent();
                        version = result.rows[0];
                        if (!version)
                            return [2 /*return*/, false];
                        content = version.content_text
                            ? Buffer.from(version.content_text, 'utf-8')
                            : version.content_bytes;
                        if (!content)
                            return [2 /*return*/, false];
                        correctChecksum = (0, crypto_1.createHash)('sha256').update(content).digest();
                        return [4 /*yield*/, this.db.query("UPDATE core.files SET sha256 = $2 WHERE id = $1", [fileId, correctChecksum])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    return IntegrityChecker;
}());
exports.IntegrityChecker = IntegrityChecker;
