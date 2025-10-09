"use strict";
/**
 * Transcript capture and logging
 */
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
exports.TranscriptRecorder = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var TranscriptRecorder = /** @class */ (function () {
    function TranscriptRecorder(config) {
        this.currentTranscript = null;
        this.config = config;
    }
    /**
     * Start a new transcript
     */
    TranscriptRecorder.prototype.startTranscript = function (request) {
        var id = this.generateId();
        var startTime = new Date().toISOString();
        this.currentTranscript = {
            id: id,
            startTime: startTime,
            entries: [],
            request: request
        };
        this.log('info', "Started transcript ".concat(id));
        return id;
    };
    /**
     * Add an entry to the current transcript
     */
    TranscriptRecorder.prototype.addEntry = function (entry) {
        if (!this.currentTranscript) {
            this.log('warn', 'Attempted to add entry without active transcript');
            return;
        }
        this.currentTranscript.entries.push(entry);
    };
    /**
     * End the current transcript
     */
    TranscriptRecorder.prototype.endTranscript = function (id, result) {
        if (!this.currentTranscript || this.currentTranscript.id !== id) {
            this.log('warn', "Transcript ".concat(id, " not found or mismatch"));
            return;
        }
        this.currentTranscript.endTime = new Date().toISOString();
        this.currentTranscript.result = result;
        this.log('info', "Ended transcript ".concat(id));
    };
    /**
     * Save current transcript to disk
     */
    TranscriptRecorder.prototype.saveCurrentTranscript = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dir, filename, filepath, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.currentTranscript) {
                            return [2 /*return*/];
                        }
                        if (!this.config.logging.captureTranscripts) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        dir = this.config.logging.transcriptDir;
                        return [4 /*yield*/, (0, promises_1.mkdir)(dir, { recursive: true })];
                    case 2:
                        _a.sent();
                        filename = "transcript-".concat(this.currentTranscript.id, ".json");
                        filepath = (0, path_1.resolve)(dir, filename);
                        return [4 /*yield*/, (0, promises_1.writeFile)(filepath, JSON.stringify(this.currentTranscript, null, 2), 'utf-8')];
                    case 3:
                        _a.sent();
                        this.log('info', "Saved transcript to ".concat(filepath));
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        this.log('error', "Failed to save transcript: ".concat(error_1.message));
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get current transcript
     */
    TranscriptRecorder.prototype.getCurrentTranscript = function () {
        return this.currentTranscript ? __assign({}, this.currentTranscript) : null;
    };
    /**
     * Log a message
     */
    TranscriptRecorder.prototype.log = function (level, message) {
        var levels = { debug: 0, info: 1, warn: 2, error: 3 };
        var configLevel = levels[this.config.logging.level];
        var messageLevel = levels[level];
        if (messageLevel >= configLevel) {
            var timestamp = new Date().toISOString();
            var logMessage = "[".concat(timestamp, "] [").concat(level.toUpperCase(), "] ").concat(message);
            if (level === 'error') {
                console.error(logMessage);
            }
            else {
                console.log(logMessage);
            }
        }
    };
    /**
     * Generate unique ID for transcript
     */
    TranscriptRecorder.prototype.generateId = function () {
        var timestamp = Date.now().toString(36);
        var random = Math.random().toString(36).substring(2, 9);
        return "".concat(timestamp, "-").concat(random);
    };
    return TranscriptRecorder;
}());
exports.TranscriptRecorder = TranscriptRecorder;
