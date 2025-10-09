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
exports.MemoryPreludeService = void 0;
var index_js_1 = require("../repositories/index.js");
var MemoryPreludeService = /** @class */ (function () {
    function MemoryPreludeService(db) {
        this.sessionsRepo = new index_js_1.SessionsRepository(db);
        new index_js_1.MessagesRepository(db);
        this.memoryRepo = new index_js_1.SessionMemoryRepository(db);
        this.workingSetRepo = new index_js_1.WorkingSetRepository(db);
        this.eventsRepo = new index_js_1.EventsRepository(db);
        this.appsRepo = new index_js_1.AppsRepository(db);
    }
    MemoryPreludeService.prototype.buildPrelude = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var session, app, _a, memory, workingSet, recentEvents, decisionEvents, recentDecisions, pinnedFiles, keyFacts, constraints;
            var _this = this;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.sessionsRepo.findById(sessionId)];
                    case 1:
                        session = _d.sent();
                        if (!session) {
                            throw new Error("Session ".concat(sessionId, " not found"));
                        }
                        if (!session.app_id) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.appsRepo.findById(session.app_id)];
                    case 2:
                        _a = _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = null;
                        _d.label = 4;
                    case 4:
                        app = _a;
                        return [4 /*yield*/, this.memoryRepo.findBySession(sessionId)];
                    case 5:
                        memory = _d.sent();
                        return [4 /*yield*/, this.workingSetRepo.findBySessionWithFiles(sessionId)];
                    case 6:
                        workingSet = _d.sent();
                        return [4 /*yield*/, this.eventsRepo.findBySession(sessionId, 20)];
                    case 7:
                        recentEvents = _d.sent();
                        decisionEvents = recentEvents.filter(function (e) {
                            return e.kind && ['file.upserted', 'session.created', 'image.job.created'].includes(e.kind);
                        });
                        recentDecisions = decisionEvents.map(function (e) { return ({
                            kind: e.kind || 'unknown',
                            summary: _this.summarizeEvent(e),
                            timestamp: e.created_at
                        }); });
                        pinnedFiles = workingSet.map(function (ws) { return ({
                            path: ws.file_path,
                            reason: ws.reason
                        }); });
                        keyFacts = (memory === null || memory === void 0 ? void 0 : memory.facts) || {};
                        constraints = this.deriveConstraints(app === null || app === void 0 ? void 0 : app.name, keyFacts);
                        return [2 /*return*/, {
                                sessionTitle: session.title,
                                appName: (_b = app === null || app === void 0 ? void 0 : app.name) !== null && _b !== void 0 ? _b : null,
                                workingDirectory: app ? "/app/".concat(app.name) : null,
                                pinnedFiles: pinnedFiles,
                                recentDecisions: recentDecisions,
                                rollingSummary: (_c = memory === null || memory === void 0 ? void 0 : memory.rolling_summary) !== null && _c !== void 0 ? _c : null,
                                keyFacts: keyFacts,
                                constraints: constraints
                            }];
                }
            });
        });
    };
    MemoryPreludeService.prototype.formatAsSystemMessage = function (prelude) {
        var sections = [];
        sections.push("Session: ".concat(prelude.sessionTitle));
        if (prelude.appName) {
            sections.push("App: ".concat(prelude.appName));
        }
        if (prelude.workingDirectory) {
            sections.push("Working Directory: ".concat(prelude.workingDirectory));
        }
        if (prelude.rollingSummary) {
            sections.push("\nContext: ".concat(prelude.rollingSummary));
        }
        if (Object.keys(prelude.keyFacts).length > 0) {
            sections.push('\nKey Facts:');
            Object.entries(prelude.keyFacts).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                sections.push("  - ".concat(key, ": ").concat(JSON.stringify(value)));
            });
        }
        if (prelude.pinnedFiles.length > 0) {
            sections.push('\nPinned Files:');
            prelude.pinnedFiles.forEach(function (f) {
                sections.push("  - ".concat(f.path).concat(f.reason ? " (".concat(f.reason, ")") : ''));
            });
        }
        if (prelude.recentDecisions.length > 0) {
            sections.push('\nRecent Actions:');
            prelude.recentDecisions.slice(0, 5).forEach(function (d) {
                sections.push("  - ".concat(d.summary));
            });
        }
        if (prelude.constraints.length > 0) {
            sections.push('\nConstraints:');
            prelude.constraints.forEach(function (c) {
                sections.push("  - ".concat(c));
            });
        }
        return sections.join('\n');
    };
    MemoryPreludeService.prototype.summarizeEvent = function (event) {
        var payload = event.payload || {};
        switch (event.kind) {
            case 'file.upserted':
                return "Updated ".concat(payload.path || 'file');
            case 'image.job.created':
                return "Generated image: ".concat((payload.prompt || '').substring(0, 50), "...");
            case 'session.created':
                return "Started session: ".concat(payload.title || 'untitled');
            default:
                return event.kind || 'unknown action';
        }
    };
    MemoryPreludeService.prototype.deriveConstraints = function (_appName, facts) {
        var constraints = [
            'Tests must pass before completion',
            'Follow existing code style and patterns',
            'Preserve backward compatibility where possible'
        ];
        if (facts.framework === 'react') {
            constraints.push('Use React hooks, avoid class components');
        }
        if (facts.typescript) {
            constraints.push('Maintain type safety, no any types without justification');
        }
        if (facts.linter) {
            constraints.push('Code must pass linter checks');
        }
        return constraints;
    };
    return MemoryPreludeService;
}());
exports.MemoryPreludeService = MemoryPreludeService;
