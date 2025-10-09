"use strict";
/**
 * Model Client for Claude Sonnet 4.5 with streaming support
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
exports.ModelClient = void 0;
var sdk_1 = require("@anthropic-ai/sdk");
var ModelClient = /** @class */ (function () {
    function ModelClient(config) {
        var _a, _b;
        this.config = config;
        if (config.provider === 'anthropic') {
            this.client = new sdk_1.default({
                apiKey: config.apiKey,
                baseURL: (_b = (_a = config.providerConfig) === null || _a === void 0 ? void 0 : _a.anthropic) === null || _b === void 0 ? void 0 : _b.baseURL
            });
        }
        else {
            throw new Error("Provider ".concat(config.provider, " not yet implemented. Use 'anthropic' for Portion 1."));
        }
    }
    /**
     * Send a message with optional streaming
     */
    ModelClient.prototype.sendMessage = function (messages, systemPrompt, tools, options) {
        return __awaiter(this, void 0, void 0, function () {
            var allTools, webSearchTool, params;
            var _a;
            return __generator(this, function (_b) {
                allTools = __spreadArray([], tools, true);
                if ((_a = options === null || options === void 0 ? void 0 : options.webSearchConfig) === null || _a === void 0 ? void 0 : _a.enabled) {
                    webSearchTool = {
                        type: 'web_search_20250305',
                        name: 'web_search'
                    };
                    if (options.webSearchConfig.maxUses !== undefined) {
                        webSearchTool.max_uses = options.webSearchConfig.maxUses;
                    }
                    if (options.webSearchConfig.allowedDomains && options.webSearchConfig.allowedDomains.length > 0) {
                        webSearchTool.allowed_domains = options.webSearchConfig.allowedDomains;
                    }
                    if (options.webSearchConfig.blockedDomains && options.webSearchConfig.blockedDomains.length > 0) {
                        webSearchTool.blocked_domains = options.webSearchConfig.blockedDomains;
                    }
                    allTools.push(webSearchTool);
                }
                params = {
                    model: this.config.model,
                    max_tokens: this.config.maxTokens,
                    system: systemPrompt,
                    messages: this.convertMessages(messages),
                    tools: allTools,
                };
                // Claude 4.5 doesn't allow both temperature and top_p - only include one
                if (this.config.topP !== undefined) {
                    params.top_p = this.config.topP;
                }
                else {
                    params.temperature = this.config.temperature;
                }
                if (this.config.streaming && (options === null || options === void 0 ? void 0 : options.onDelta)) {
                    return [2 /*return*/, this.streamMessage(params, options.onDelta, options.onComplete)];
                }
                else {
                    return [2 /*return*/, this.nonStreamMessage(params)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Streaming message handling
     */
    ModelClient.prototype.streamMessage = function (params, onDelta, onComplete) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, messageId, stopReason, inputTokens, outputTokens, contentBlocks, currentTextBlock, currentToolUse, _a, stream_1, stream_1_1, event_1, blockType, e_1_1, response;
            var _b, e_1, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.client.messages.create(__assign(__assign({}, params), { stream: true }))];
                    case 1:
                        stream = _e.sent();
                        messageId = '';
                        stopReason = null;
                        inputTokens = 0;
                        outputTokens = 0;
                        contentBlocks = [];
                        currentTextBlock = '';
                        currentToolUse = null;
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 7, 8, 13]);
                        _a = true, stream_1 = __asyncValues(stream);
                        _e.label = 3;
                    case 3: return [4 /*yield*/, stream_1.next()];
                    case 4:
                        if (!(stream_1_1 = _e.sent(), _b = stream_1_1.done, !_b)) return [3 /*break*/, 6];
                        _d = stream_1_1.value;
                        _a = false;
                        event_1 = _d;
                        switch (event_1.type) {
                            case 'message_start':
                                messageId = event_1.message.id;
                                inputTokens = event_1.message.usage.input_tokens;
                                break;
                            case 'content_block_start':
                                blockType = event_1.content_block.type;
                                console.log("[STREAM] content_block_start: ".concat(blockType));
                                if (event_1.content_block.type === 'text') {
                                    currentTextBlock = '';
                                }
                                else if (event_1.content_block.type === 'tool_use') {
                                    currentToolUse = {
                                        type: 'tool_use',
                                        id: event_1.content_block.id,
                                        name: event_1.content_block.name,
                                        inputJson: ''
                                    };
                                }
                                else if (event_1.content_block.type === 'server_tool_use') {
                                    console.log("[STREAM] \uD83D\uDD0D server_tool_use detected: ".concat(event_1.content_block.id));
                                    currentToolUse = {
                                        type: 'server_tool_use',
                                        id: event_1.content_block.id,
                                        name: event_1.content_block.name,
                                        inputJson: ''
                                    };
                                }
                                else if (event_1.content_block.type === 'web_search_tool_result') {
                                    console.log("[STREAM] \u2705 web_search_tool_result detected for: ".concat(event_1.content_block.tool_use_id));
                                    contentBlocks.push({
                                        type: 'web_search_tool_result',
                                        tool_use_id: event_1.content_block.tool_use_id,
                                        content: event_1.content_block.content
                                    });
                                }
                                break;
                            case 'content_block_delta':
                                if (event_1.delta.type === 'text_delta') {
                                    currentTextBlock += event_1.delta.text;
                                    onDelta({ type: 'text', content: event_1.delta.text });
                                }
                                else if (event_1.delta.type === 'input_json_delta') {
                                    // Accumulate tool input JSON (parse only once on content_block_stop)
                                    if (currentToolUse) {
                                        currentToolUse.inputJson += event_1.delta.partial_json;
                                    }
                                }
                                break;
                            case 'content_block_stop':
                                if (currentTextBlock) {
                                    console.log("[STREAM] Pushing text block (".concat(currentTextBlock.length, " chars)"));
                                    contentBlocks.push({ type: 'text', text: currentTextBlock });
                                    currentTextBlock = '';
                                }
                                else if (currentToolUse) {
                                    // Parse accumulated JSON once at the end
                                    try {
                                        currentToolUse.input = JSON.parse(currentToolUse.inputJson || '{}');
                                    }
                                    catch (e) {
                                        console.error('Failed to parse tool input JSON:', e);
                                        currentToolUse.input = {};
                                    }
                                    delete currentToolUse.inputJson;
                                    console.log("[STREAM] Pushing ".concat(currentToolUse.type, ": ").concat(currentToolUse.name, " (").concat(currentToolUse.id, ")"));
                                    contentBlocks.push(currentToolUse);
                                    onDelta({
                                        type: 'tool_use',
                                        content: "[Tool: ".concat(currentToolUse.name, "]"),
                                        toolUseId: currentToolUse.id,
                                        toolName: currentToolUse.name
                                    });
                                    currentToolUse = null;
                                }
                                break;
                            case 'message_delta':
                                if (event_1.delta.stop_reason) {
                                    stopReason = event_1.delta.stop_reason;
                                }
                                if (event_1.usage) {
                                    outputTokens = event_1.usage.output_tokens;
                                }
                                break;
                            case 'message_stop':
                                // Stream complete
                                break;
                        }
                        _e.label = 5;
                    case 5:
                        _a = true;
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _e.trys.push([8, , 11, 12]);
                        if (!(!_a && !_b && (_c = stream_1.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _c.call(stream_1)];
                    case 9:
                        _e.sent();
                        _e.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13:
                        response = {
                            id: messageId,
                            role: 'assistant',
                            content: contentBlocks,
                            stopReason: stopReason,
                            usage: {
                                inputTokens: inputTokens,
                                outputTokens: outputTokens
                            }
                        };
                        // Log final content block summary
                        console.log("\n[STREAM] Response complete. Content blocks:");
                        contentBlocks.forEach(function (block, idx) {
                            console.log("  [".concat(idx, "] ").concat(block.type).concat(block.id ? " (".concat(block.id, ")") : '').concat(block.tool_use_id ? " -> ".concat(block.tool_use_id) : ''));
                        });
                        if (onComplete) {
                            onComplete(response);
                        }
                        return [2 /*return*/, response];
                }
            });
        });
    };
    /**
     * Non-streaming message handling
     */
    ModelClient.prototype.nonStreamMessage = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.messages.create(__assign(__assign({}, params), { stream: false }))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                id: response.id,
                                role: 'assistant',
                                content: response.content.map(function (block) {
                                    if (block.type === 'text') {
                                        return { type: 'text', text: block.text };
                                    }
                                    else if (block.type === 'tool_use') {
                                        return {
                                            type: 'tool_use',
                                            id: block.id,
                                            name: block.name,
                                            input: block.input
                                        };
                                    }
                                    else if (block.type === 'server_tool_use') {
                                        // Explicitly handle server-side tool use
                                        return {
                                            type: 'server_tool_use',
                                            id: block.id,
                                            name: block.name,
                                            input: block.input
                                        };
                                    }
                                    else if (block.type === 'web_search_tool_result') {
                                        // Explicitly handle web search results
                                        return {
                                            type: 'web_search_tool_result',
                                            tool_use_id: block.tool_use_id,
                                            content: block.content
                                        };
                                    }
                                    // Pass through any other block types unchanged
                                    return block;
                                }),
                                stopReason: response.stop_reason,
                                usage: {
                                    inputTokens: response.usage.input_tokens,
                                    outputTokens: response.usage.output_tokens,
                                    serverToolUse: response.usage.server_tool_use
                                }
                            }];
                }
            });
        });
    };
    /**
     * Convert our Message format to Anthropic's format
     */
    ModelClient.prototype.convertMessages = function (messages) {
        return messages.map(function (msg) { return ({
            role: msg.role,
            content: typeof msg.content === 'string'
                ? msg.content
                : msg.content
        }); });
    };
    /**
     * Get current config
     */
    ModelClient.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    return ModelClient;
}());
exports.ModelClient = ModelClient;
