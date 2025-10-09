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
exports.ImageAssetsRepository = exports.ImageJobsRepository = void 0;
var ImageJobsRepository = /** @class */ (function () {
    function ImageJobsRepository(db) {
        this.db = db;
    }
    ImageJobsRepository.prototype.create = function (prompt_1, model_1) {
        return __awaiter(this, arguments, void 0, function (prompt, model, options) {
            var result;
            var _a, _b, _c, _d;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.db.query("INSERT INTO core.image_jobs\n       (session_id, app_id, prompt, model, size, n, state)\n       VALUES ($1, $2, $3, $4, $5, $6, 'queued')\n       RETURNING *", [
                            (_a = options.sessionId) !== null && _a !== void 0 ? _a : null,
                            (_b = options.appId) !== null && _b !== void 0 ? _b : null,
                            prompt,
                            model,
                            (_c = options.size) !== null && _c !== void 0 ? _c : null,
                            (_d = options.n) !== null && _d !== void 0 ? _d : 1
                        ])];
                    case 1:
                        result = _e.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    ImageJobsRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.image_jobs WHERE id = $1", [id])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null];
                }
            });
        });
    };
    ImageJobsRepository.prototype.findBySession = function (sessionId_1) {
        return __awaiter(this, arguments, void 0, function (sessionId, limit) {
            var result;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.image_jobs\n       WHERE session_id = $1\n       ORDER BY requested_at DESC\n       LIMIT $2", [sessionId, limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    ImageJobsRepository.prototype.findByState = function (state_1) {
        return __awaiter(this, arguments, void 0, function (state, limit) {
            var result;
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.image_jobs\n       WHERE state = $1\n       ORDER BY requested_at ASC\n       LIMIT $2", [state, limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    ImageJobsRepository.prototype.updateState = function (id, state, error) {
        return __awaiter(this, void 0, void 0, function () {
            var now, startedAt, finishedAt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        startedAt = state === 'generating' ? now : undefined;
                        finishedAt = ['succeeded', 'failed', 'canceled'].includes(state) ? now : undefined;
                        return [4 /*yield*/, this.db.query("UPDATE core.image_jobs\n       SET state = $2,\n           started_at = COALESCE($3, started_at),\n           finished_at = COALESCE($4, finished_at),\n           error = COALESCE($5, error)\n       WHERE id = $1\n       RETURNING *", [id, state, startedAt !== null && startedAt !== void 0 ? startedAt : null, finishedAt !== null && finishedAt !== void 0 ? finishedAt : null, error ? JSON.stringify(error) : null])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    ImageJobsRepository.prototype.markStarted = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateState(id, 'generating')];
            });
        });
    };
    ImageJobsRepository.prototype.markSucceeded = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateState(id, 'succeeded')];
            });
        });
    };
    ImageJobsRepository.prototype.markFailed = function (id, error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateState(id, 'failed', error)];
            });
        });
    };
    ImageJobsRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("DELETE FROM core.image_jobs WHERE id = $1", [id])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ImageJobsRepository;
}());
exports.ImageJobsRepository = ImageJobsRepository;
var ImageAssetsRepository = /** @class */ (function () {
    function ImageAssetsRepository(db) {
        this.db = db;
    }
    ImageAssetsRepository.prototype.create = function (jobId_1, position_1, mimeType_1, bytes_1) {
        return __awaiter(this, arguments, void 0, function (jobId, position, mimeType, bytes, options) {
            var result;
            var _a, _b, _c, _d;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.db.query("INSERT INTO core.image_assets\n       (job_id, position, mime_type, bytes, storage_url, checksum, width, height)\n       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n       RETURNING *", [
                            jobId,
                            position,
                            mimeType,
                            bytes,
                            (_a = options.storageUrl) !== null && _a !== void 0 ? _a : null,
                            (_b = options.checksum) !== null && _b !== void 0 ? _b : null,
                            (_c = options.width) !== null && _c !== void 0 ? _c : null,
                            (_d = options.height) !== null && _d !== void 0 ? _d : null
                        ])];
                    case 1:
                        result = _e.sent();
                        return [2 /*return*/, result.rows[0]];
                }
            });
        });
    };
    ImageAssetsRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.image_assets WHERE id = $1", [id])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null];
                }
            });
        });
    };
    ImageAssetsRepository.prototype.findByJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT * FROM core.image_assets\n       WHERE job_id = $1\n       ORDER BY position ASC", [jobId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    ImageAssetsRepository.prototype.findByJobWithoutBytes = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("SELECT id, job_id, position, mime_type, storage_url, checksum, width, height, created_at\n       FROM core.image_assets\n       WHERE job_id = $1\n       ORDER BY position ASC", [jobId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    ImageAssetsRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("DELETE FROM core.image_assets WHERE id = $1", [id])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ImageAssetsRepository;
}());
exports.ImageAssetsRepository = ImageAssetsRepository;
