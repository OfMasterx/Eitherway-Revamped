"use strict";
/**
 * eithergen--generate_image: Database-backed image generation
 *
 * CRITICAL: This tool uses the ImageGenerationService which:
 * - Uses response_format: 'b64_json' to avoid TTL expiration
 * - Stores images in PostgreSQL (compatible with VFS)
 * - Validates images with sharp
 * - Polls until completion
 */
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
exports.ImageGenExecutor = void 0;
var security_js_1 = require("./security.js");
var database_1 = require("@eitherway/database");
var ImageGenExecutor = /** @class */ (function () {
    function ImageGenExecutor() {
        this.name = 'eithergen--generate_image';
    }
    ImageGenExecutor.prototype.execute = function (input, context) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, path, _a, size, _b, quality, guard, db, imageService, sessionId, appId, dalleSize, jobId, result, assetId, asset, fileStore, mimeType, extension, finalPath, serverOrigin, assetUrl, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = input.prompt, path = input.path, _a = input.size, size = _a === void 0 ? '1024x1024' : _a, _b = input.quality, quality = _b === void 0 ? 'standard' : _b;
                        guard = new security_js_1.SecurityGuard(context.config.security);
                        if (!guard.isPathAllowed(path)) {
                            return [2 /*return*/, {
                                    content: "Error: Access denied to path '".concat(path, "'. Path is not in allowed workspaces."),
                                    isError: true
                                }];
                        }
                        // Validate OPENAI_API_KEY
                        if (!process.env.OPENAI_API_KEY) {
                            return [2 /*return*/, {
                                    content: "Error: OpenAI API key not configured.\n\nTo enable:\n1. Get API key from https://platform.openai.com/api-keys\n2. Set environment variable: export OPENAI_API_KEY=your_key",
                                    isError: true
                                }];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        db = (0, database_1.createDatabaseClient)();
                        imageService = new database_1.ImageGenerationService(db);
                        sessionId = context.sessionId;
                        appId = context.appId;
                        if (!appId) {
                            // DO NOT close db - it's a singleton shared by all tools
                            return [2 /*return*/, {
                                    content: "Error: No app context found. Image generation requires an active app/session.",
                                    isError: true
                                }];
                        }
                        dalleSize = this.mapSize(size);
                        return [4 /*yield*/, imageService.generateImage({
                                prompt: prompt,
                                model: 'dall-e-3',
                                size: dalleSize,
                                quality: quality,
                                n: 1,
                                sessionId: sessionId,
                                appId: appId
                            })];
                    case 2:
                        jobId = _c.sent();
                        return [4 /*yield*/, imageService.pollJobUntilComplete(jobId, 60000, 500)];
                    case 3:
                        result = _c.sent();
                        if (result.job.state !== 'succeeded') {
                            // DO NOT close db - it's a singleton shared by all tools
                            return [2 /*return*/, {
                                    content: "Error: Image generation failed.\nJob ID: ".concat(jobId, "\nState: ").concat(result.job.state, "\nError: ").concat(JSON.stringify(result.job.error)),
                                    isError: true
                                }];
                        }
                        if (!result.assets || result.assets.length === 0) {
                            // DO NOT close db - it's a singleton shared by all tools
                            return [2 /*return*/, {
                                    content: "Error: No image assets generated.\nJob ID: ".concat(jobId),
                                    isError: true
                                }];
                        }
                        assetId = result.assets[0].id;
                        return [4 /*yield*/, imageService.getAsset(assetId)];
                    case 4:
                        asset = _c.sent();
                        if (!asset) {
                            // DO NOT close db - it's a singleton shared by all tools
                            return [2 /*return*/, {
                                    content: "Error: Failed to retrieve generated image.\nAsset ID: ".concat(assetId),
                                    isError: true
                                }];
                        }
                        fileStore = new database_1.PostgresFileStore(db);
                        mimeType = asset.mimeType;
                        extension = mimeType === 'image/png' ? '.png' : '.jpg';
                        finalPath = path;
                        if (!finalPath.endsWith('.png') && !finalPath.endsWith('.jpg') && !finalPath.endsWith('.jpeg')) {
                            finalPath = path + extension;
                        }
                        return [4 /*yield*/, fileStore.write(appId, finalPath, asset.bytes, mimeType)];
                    case 5:
                        _c.sent();
                        serverOrigin = process.env.SERVER_ORIGIN || 'http://localhost:3001';
                        assetUrl = "".concat(serverOrigin, "/api/images/assets/").concat(assetId);
                        return [2 /*return*/, {
                                content: "\u2705 Image generated and saved successfully!\n\n\uD83D\uDCC1 File Path: ".concat(finalPath, "\n\u26A0\uFE0F  IMPORTANT: Use this EXACT path in your HTML/code: ").concat(finalPath, "\n\nExample usage:\n<img src=\"").concat(finalPath, "\" alt=\"").concat(prompt.substring(0, 50), "...\">\n\nDetails:\n- Prompt: \"").concat(prompt, "\"\n- Size: ").concat(dalleSize, "\n- Quality: ").concat(quality, "\n- Format: ").concat(mimeType, "\n- File size: ").concat((asset.bytes.length / 1024).toFixed(2), " KB\n- Job ID: ").concat(jobId, "\n- Asset ID: ").concat(assetId, "\n\nThe image is now available in the file system and will display in the preview."),
                                isError: false,
                                metadata: {
                                    path: finalPath,
                                    prompt: prompt,
                                    size: dalleSize,
                                    quality: quality,
                                    jobId: jobId,
                                    assetId: assetId,
                                    assetUrl: assetUrl,
                                    mimeType: mimeType,
                                    fileSize: asset.bytes.length,
                                    width: result.assets[0].width,
                                    height: result.assets[0].height
                                }
                            }];
                    case 6:
                        error_1 = _c.sent();
                        return [2 /*return*/, {
                                content: "Image generation error: ".concat(error_1.message, "\n\nStack trace:\n").concat(error_1.stack),
                                isError: true
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    ImageGenExecutor.prototype.mapSize = function (size) {
        // DALL-E 3 supports: 1024x1024, 1024x1792, 1792x1024
        var _a = size.split('x').map(Number), w = _a[0], h = _a[1];
        if (w >= 1024 && h >= 1024) {
            if (w > h)
                return '1792x1024';
            if (h > w)
                return '1024x1792';
            return '1024x1024';
        }
        return '1024x1024'; // Default
    };
    return ImageGenExecutor;
}());
exports.ImageGenExecutor = ImageGenExecutor;
