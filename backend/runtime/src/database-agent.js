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
exports.DatabaseAgent = void 0;
var agent_js_1 = require("./agent.js");
var database_1 = require("@eitherway/database");
var DatabaseAgent = /** @class */ (function () {
    function DatabaseAgent(options) {
        this.db = options.db;
        this.sessionId = options.sessionId;
        this.appId = options.appId;
        this.sessionsRepo = new database_1.SessionsRepository(this.db);
        this.messagesRepo = new database_1.MessagesRepository(this.db);
        this.memoryRepo = new database_1.SessionMemoryRepository(this.db);
        this.workingSetRepo = new database_1.WorkingSetRepository(this.db);
        this.eventsRepo = new database_1.EventsRepository(this.db);
        this.agent = new agent_js_1.Agent({
            workingDir: options.workingDir || process.cwd(),
            claudeConfig: options.claudeConfig,
            agentConfig: options.agentConfig,
            executors: options.executors,
            dryRun: options.dryRun,
            webSearch: options.webSearch
        });
    }
    DatabaseAgent.prototype.processRequest = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var previousMessages, conversationHistory, userMessage, response, tokenCount, estimatedTokens, history_1, lastAssistantMessage, contentToSave, assistantMessage, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventsRepo.log('request.started', { prompt: prompt }, {
                            sessionId: this.sessionId,
                            actor: 'user'
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.messagesRepo.findRecentBySession(this.sessionId, 50)];
                    case 2:
                        previousMessages = _a.sent();
                        conversationHistory = previousMessages
                            .filter(function (msg) { return msg.role === 'user' || msg.role === 'assistant'; })
                            .map(function (msg) {
                            var content = msg.content;
                            // Ensure content is always an array (Claude API requirement)
                            if (typeof content === 'string') {
                                // Plain string - wrap in text block
                                content = [{ type: 'text', text: content }];
                            }
                            else if (typeof content === 'object' && content !== null) {
                                if (Array.isArray(content)) {
                                    // Already an array - keep as-is
                                    content = content;
                                }
                                else if ('text' in content && content.text) {
                                    // Object with text property - wrap in array
                                    content = [{ type: 'text', text: content.text }];
                                }
                                else {
                                    // Other object - stringify and wrap
                                    content = [{ type: 'text', text: JSON.stringify(content) }];
                                }
                            }
                            else {
                                // Fallback for any other type
                                content = [{ type: 'text', text: String(content) }];
                            }
                            return {
                                role: msg.role,
                                content: content
                            };
                        });
                        // Load conversation history into agent
                        this.agent.loadConversationHistory(conversationHistory);
                        return [4 /*yield*/, this.messagesRepo.create(this.sessionId, 'user', { text: prompt }, undefined, undefined)];
                    case 3:
                        userMessage = _a.sent();
                        return [4 /*yield*/, this.sessionsRepo.touchLastMessage(this.sessionId)];
                    case 4:
                        _a.sent();
                        tokenCount = 0;
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 11, , 13]);
                        return [4 /*yield*/, this.agent.processRequest(prompt)];
                    case 6:
                        response = _a.sent();
                        estimatedTokens = Math.ceil(response.length / 4);
                        tokenCount = estimatedTokens;
                        history_1 = this.agent.getHistory();
                        lastAssistantMessage = history_1[history_1.length - 1];
                        contentToSave = (lastAssistantMessage === null || lastAssistantMessage === void 0 ? void 0 : lastAssistantMessage.role) === 'assistant'
                            ? lastAssistantMessage.content
                            : { text: response };
                        return [4 /*yield*/, this.messagesRepo.create(this.sessionId, 'assistant', contentToSave, 'claude-sonnet-4-5', tokenCount)];
                    case 7:
                        assistantMessage = _a.sent();
                        return [4 /*yield*/, this.sessionsRepo.touchLastMessage(this.sessionId)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, this.eventsRepo.log('request.completed', {
                                userMessageId: userMessage.id,
                                assistantMessageId: assistantMessage.id,
                                tokenCount: tokenCount
                            }, {
                                sessionId: this.sessionId,
                                actor: 'assistant'
                            })];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, this.updateMemoryIfNeeded()];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 13];
                    case 11:
                        error_1 = _a.sent();
                        return [4 /*yield*/, this.eventsRepo.log('request.failed', {
                                error: error_1.message,
                                stack: error_1.stack
                            }, {
                                sessionId: this.sessionId,
                                actor: 'system'
                            })];
                    case 12:
                        _a.sent();
                        throw error_1;
                    case 13: return [2 /*return*/, response];
                }
            });
        });
    };
    DatabaseAgent.prototype.updateMemoryIfNeeded = function () {
        return __awaiter(this, void 0, void 0, function () {
            var messageCount, recentMessages, summary;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.messagesRepo.countBySession(this.sessionId)];
                    case 1:
                        messageCount = _b.sent();
                        if (!(messageCount % 10 === 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.messagesRepo.findRecentBySession(this.sessionId, 20)];
                    case 2:
                        recentMessages = _b.sent();
                        summary = this.generateSummary(recentMessages);
                        return [4 /*yield*/, this.memoryRepo.upsert(this.sessionId, {
                                rollingSummary: summary,
                                lastCompactedMessageId: (_a = recentMessages[recentMessages.length - 1]) === null || _a === void 0 ? void 0 : _a.id.toString()
                            })];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseAgent.prototype.generateSummary = function (messages) {
        var userMessages = messages.filter(function (m) { return m.role === 'user'; });
        var topics = userMessages.map(function (m) {
            if (typeof m.content === 'object' && m.content.text) {
                return m.content.text.substring(0, 50);
            }
            return '';
        }).filter(Boolean);
        return "Recent topics: ".concat(topics.join(', '));
    };
    DatabaseAgent.prototype.saveTranscript = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.agent.saveTranscript()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseAgent.prototype.addToWorkingSet = function (fileId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.appId) {
                            throw new Error('Cannot add to working set: no appId');
                        }
                        return [4 /*yield*/, this.workingSetRepo.add(this.sessionId, this.appId, fileId, reason, 'agent')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseAgent.prototype.getWorkingSet = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.workingSetRepo.findBySessionWithFiles(this.sessionId)];
            });
        });
    };
    DatabaseAgent.prototype.getSessionContext = function () {
        return __awaiter(this, void 0, void 0, function () {
            var session, recentMessages, memory, workingSet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sessionsRepo.findById(this.sessionId)];
                    case 1:
                        session = _a.sent();
                        return [4 /*yield*/, this.messagesRepo.findRecentBySession(this.sessionId, 10)];
                    case 2:
                        recentMessages = _a.sent();
                        return [4 /*yield*/, this.memoryRepo.findBySession(this.sessionId)];
                    case 3:
                        memory = _a.sent();
                        return [4 /*yield*/, this.workingSetRepo.findBySessionWithFiles(this.sessionId)];
                    case 4:
                        workingSet = _a.sent();
                        return [2 /*return*/, { session: session, recentMessages: recentMessages, memory: memory, workingSet: workingSet }];
                }
            });
        });
    };
    /**
     * Set database context for file operations
     */
    DatabaseAgent.prototype.setDatabaseContext = function (fileStore, appId, sessionId) {
        this.agent.setDatabaseContext(fileStore, appId, sessionId);
    };
    return DatabaseAgent;
}());
exports.DatabaseAgent = DatabaseAgent;
