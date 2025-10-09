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
exports.ImageGenerationService = void 0;
var openai_1 = require("openai");
var sharp_1 = require("sharp");
var crypto_1 = require("crypto");
var images_js_1 = require("../repositories/images.js");
var ImageGenerationService = /** @class */ (function () {
    function ImageGenerationService(db, openaiApiKey) {
        this.openai = new openai_1.default({
            apiKey: openaiApiKey || process.env.OPENAI_API_KEY,
        });
        this.jobsRepo = new images_js_1.ImageJobsRepository(db);
        this.assetsRepo = new images_js_1.ImageAssetsRepository(db);
    }
    ImageGenerationService.prototype.generateImage = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.jobsRepo.create(options.prompt, options.model || 'dall-e-3', {
                            sessionId: options.sessionId,
                            appId: options.appId,
                            size: options.size || '1024x1024',
                            n: options.n || 1,
                        })];
                    case 1:
                        job = _a.sent();
                        this.processJobAsync(job.id, options).catch(function (error) {
                            console.error("Background image generation failed for job ".concat(job.id, ":"), error);
                        });
                        return [2 /*return*/, job.id];
                }
            });
        });
    };
    ImageGenerationService.prototype.processJobAsync = function (jobId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response, assets, i, imageData, bytes, _a, mimeType, isValid, width, height, metadata, error_1, checksum, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 13, , 15]);
                        return [4 /*yield*/, this.jobsRepo.markStarted(jobId)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.openai.images.generate({
                                model: options.model || 'dall-e-3',
                                prompt: options.prompt,
                                n: options.n || 1,
                                size: options.size || '1024x1024',
                                quality: options.quality || 'standard',
                                response_format: 'b64_json',
                            })];
                    case 2:
                        response = _b.sent();
                        if (!response.data || response.data.length === 0) {
                            throw new Error('No image data returned from OpenAI');
                        }
                        assets = [];
                        i = 0;
                        _b.label = 3;
                    case 3:
                        if (!(i < response.data.length)) return [3 /*break*/, 11];
                        imageData = response.data[i];
                        if (!imageData.b64_json) {
                            throw new Error("No b64_json data for image ".concat(i));
                        }
                        bytes = Buffer.from(imageData.b64_json, 'base64');
                        _a = this.sniffImageMimeType(bytes), mimeType = _a.mimeType, isValid = _a.isValid;
                        if (!isValid) {
                            throw new Error("Invalid image data for position ".concat(i, ": unrecognized format"));
                        }
                        width = void 0;
                        height = void 0;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 7, , 8]);
                        return [4 /*yield*/, (0, sharp_1.default)(bytes).metadata()];
                    case 5:
                        metadata = _b.sent();
                        if (!metadata.width || !metadata.height) {
                            throw new Error('Failed to extract image dimensions');
                        }
                        width = metadata.width;
                        height = metadata.height;
                        return [4 /*yield*/, (0, sharp_1.default)(bytes).toBuffer()];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _b.sent();
                        throw new Error("Image validation failed for position ".concat(i, ": ").concat(error_1.message));
                    case 8:
                        checksum = (0, crypto_1.createHash)('sha256').update(bytes).digest();
                        return [4 /*yield*/, this.assetsRepo.create(jobId, i, mimeType, bytes, {
                                checksum: checksum,
                                width: width,
                                height: height,
                            })];
                    case 9:
                        _b.sent();
                        assets.push({
                            bytes: bytes,
                            mimeType: mimeType,
                            width: width,
                            height: height,
                        });
                        _b.label = 10;
                    case 10:
                        i++;
                        return [3 /*break*/, 3];
                    case 11: return [4 /*yield*/, this.jobsRepo.markSucceeded(jobId)];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 15];
                    case 13:
                        error_2 = _b.sent();
                        console.error("Image generation failed for job ".concat(jobId, ":"), error_2);
                        return [4 /*yield*/, this.jobsRepo.markFailed(jobId, {
                                message: error_2.message,
                                stack: error_2.stack,
                                code: error_2.code,
                            })];
                    case 14:
                        _b.sent();
                        throw error_2;
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    ImageGenerationService.prototype.sniffImageMimeType = function (bytes) {
        if (bytes.length < 4) {
            return { mimeType: 'application/octet-stream', isValid: false };
        }
        var isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
        if (isPNG) {
            return { mimeType: 'image/png', isValid: true };
        }
        var isJPEG = bytes[0] === 0xff && bytes[1] === 0xd8;
        if (isJPEG) {
            var hasJPEGEnd = bytes.length >= 2 &&
                bytes[bytes.length - 2] === 0xff &&
                bytes[bytes.length - 1] === 0xd9;
            return { mimeType: 'image/jpeg', isValid: hasJPEGEnd };
        }
        var isWEBP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
        if (isWEBP) {
            return { mimeType: 'image/webp', isValid: true };
        }
        return { mimeType: 'application/octet-stream', isValid: false };
    };
    ImageGenerationService.prototype.getJobStatus = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var job, assets;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.jobsRepo.findById(jobId)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            throw new Error("Image job ".concat(jobId, " not found"));
                        }
                        return [4 /*yield*/, this.assetsRepo.findByJobWithoutBytes(jobId)];
                    case 2:
                        assets = _a.sent();
                        return [2 /*return*/, { job: job, assets: assets }];
                }
            });
        });
    };
    ImageGenerationService.prototype.getAsset = function (assetId) {
        return __awaiter(this, void 0, void 0, function () {
            var asset;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.assetsRepo.findById(assetId)];
                    case 1:
                        asset = _a.sent();
                        if (!asset || !asset.bytes) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, {
                                bytes: asset.bytes,
                                mimeType: asset.mime_type,
                            }];
                }
            });
        });
    };
    ImageGenerationService.prototype.pollJobUntilComplete = function (jobId_1) {
        return __awaiter(this, arguments, void 0, function (jobId, timeoutMs, pollIntervalMs) {
            var startTime, status_1;
            if (timeoutMs === void 0) { timeoutMs = 60000; }
            if (pollIntervalMs === void 0) { pollIntervalMs = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        if (!(Date.now() - startTime < timeoutMs)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getJobStatus(jobId)];
                    case 2:
                        status_1 = _a.sent();
                        if (status_1.job.state === 'succeeded' || status_1.job.state === 'failed') {
                            return [2 /*return*/, status_1];
                        }
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, pollIntervalMs); })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 4: throw new Error("Image generation timed out after ".concat(timeoutMs, "ms"));
                }
            });
        });
    };
    return ImageGenerationService;
}());
exports.ImageGenerationService = ImageGenerationService;
