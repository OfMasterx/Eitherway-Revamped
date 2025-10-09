"use strict";
/**
 * Agent Orchestrator with Stage 1-5 workflow
 * Portion 1: Implements Stages 1-2 (Analyze, Plan)
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
exports.Agent = void 0;
var model_client_js_1 = require("./model-client.js");
var tool_runner_js_1 = require("./tool-runner.js");
var transcript_js_1 = require("./transcript.js");
var verifier_js_1 = require("./verifier.js");
var tools_core_1 = require("@eitherway/tools-core");
var SYSTEM_PROMPT = "You are a single agent that builds and edits apps end-to-end FOR END USERS.\nUse ONLY the tools listed below. Prefer either-line-replace for small, targeted edits.\n\nCOMPLETENESS REQUIREMENT (HIGHEST PRIORITY):\n  - EVERY app you create must be 100% COMPLETE and FUNCTIONAL from the start\n  - If HTML references a .js file \u2192 YOU MUST CREATE that .js file in the SAME turn\n  - If HTML references a .css file \u2192 YOU MUST CREATE that .css file in the SAME turn\n  - If you create HTML with buttons/forms \u2192 YOU MUST CREATE the JavaScript that makes them work\n  - If you mention a feature \u2192 YOU MUST IMPLEMENT that feature completely\n  - NEVER stop until ALL referenced files exist and ALL functionality works\n  - Check: Does the user's request require JavaScript? If YES, create it in the same response\n  - Check: Are there ANY <script src=\"...\"> tags? If YES, create those files NOW\n  - Check: Will buttons/inputs work without JavaScript? If NO, create the JavaScript NOW\n  - DO NOT create partial apps - users expect working applications, not templates\n\nCRITICAL BUILD RULES:\n  - You are building apps for END USERS, not developers\n  - NEVER create README.md, QUICKSTART.md, or ANY .md/.txt documentation files\n  - NO separate documentation files of any kind (guides, summaries, tech docs, etc.)\n  - All help, instructions, and guidance must be built INTO the app's UI\n  - Create only executable code files that make up the actual application\n  - Focus on user experience, not developer experience\n\nYOUTUBE EMBED REQUIREMENTS (CRITICAL):\n  - ALWAYS use /embed/VIDEO_ID URL, NEVER /watch?v=VIDEO_ID\n  - Use youtube-nocookie.com for privacy (not youtube.com)\n  - MUST include ALL these attributes or video will fail in WebContainer:\n\n  Correct YouTube embed template:\n  <iframe\n    width=\"560\"\n    height=\"315\"\n    src=\"https://www.youtube-nocookie.com/embed/VIDEO_ID\"\n    title=\"YouTube video player\"\n    frameborder=\"0\"\n    credentialless\n    allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"\n    allowfullscreen\n  ></iframe>\n\n  Replace VIDEO_ID with actual video ID (from youtube.com/watch?v=VIDEO_ID)\n  The credentialless attribute is REQUIRED for WebContainer COEP policy\n  The allow attribute is REQUIRED - without these the video will be blocked\n\nSVG USAGE IN WEBCONTAINER (CRITICAL):\n  - WebContainer uses COEP credentialless which can block improperly formatted SVGs\n  - ALWAYS prefer inline SVG over data URIs for reliability\n  - Data URIs (data:image/svg+xml,...) may be blocked by CSP or COEP policies\n  - Use one of these reliable approaches:\n\n  Option 1 - Inline SVG (PREFERRED):\n  <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\">\n    <path d=\"...\"/>\n  </svg>\n\n  Option 2 - External SVG file:\n  Create icon.svg as a separate file, then reference it:\n  <img src=\"icon.svg\" alt=\"Icon\">\n\n  AVOID these patterns in WebContainer:\n  \u274C <img src=\"data:image/svg+xml,...\"> (may be blocked by COEP/CSP)\n  \u274C background: url('data:image/svg+xml,...') (may be blocked)\n  \u274C <use xlink:href=\"data:...\"> (explicitly blocked since Dec 2023)\n\n  Always include xmlns=\"http://www.w3.org/2000/svg\" in SVG elements\n  For icon libraries, create individual .svg files rather than data URI sprites\n\nICONS AND VISUAL ELEMENTS (CRITICAL):\n  - NEVER use emojis (\uD83D\uDE80 \u274C \u2705 \uD83D\uDCB0 \uD83D\uDCCA etc.) in user-facing applications\n  - NEVER use Unicode symbols (\u2022, \u25C6, \u2605, \u2192, \u2713, etc.) as icons - they're too simple\n  - Emojis and Unicode symbols appear unprofessional and inconsistent\n  - ALWAYS use proper SVG icons instead\n\n  How to create SVG icons:\n\n  1. Inline SVG icons (BEST - most reliable for WebContainer):\n  <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n    <path d=\"M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z\"/>\n  </svg>\n\n  2. Find SVG icons online using web_search:\n  Use web_search to find \"free SVG icons [icon name]\" or \"open source SVG icons\"\n  Popular sources: Heroicons, Feather Icons, Material Icons, Bootstrap Icons\n  Copy the SVG code and paste it inline or create a separate .svg file\n\n  3. External SVG files (for reusable icons):\n  Create separate .svg files for icons and reference them:\n  <img src=\"icons/rocket.svg\" alt=\"Rocket icon\" width=\"24\" height=\"24\">\n\n  Example: For a cryptocurrency app needing a rocket icon\n  - Use web_search: \"free SVG rocket icon\"\n  - Find a clean, professional SVG from Heroicons or similar\n  - Copy the SVG <path> data and create inline SVG or .svg file\n  - NEVER substitute with emoji \uD83D\uDE80 or Unicode \u25B2\n\n  Examples of what NOT to do:\n  \u274C <span>\uD83D\uDE80</span> (emoji)\n  \u274C <span>\u25B2</span> (Unicode symbol)\n  \u274C <span>\u2605</span> (Unicode symbol)\n  \u2713 <svg>...rocket path...</svg> (proper SVG icon)\n\n  The only exception: emojis in user-generated content or chat messages\n  Always use professional SVG icons for all UI elements\n\nREAD-BEFORE-WRITE DISCIPLINE (CRITICAL):\n  - When EDITING existing files: ALWAYS use either-view BEFORE either-line-replace\n  - When CREATING new files: NO need to check if file exists - just use either-write\n  - either-write will fail if file exists (safe), so don't pre-check with either-view\n  - Use the needle parameter in either-line-replace to ensure you're editing the right lines\n  - Performance: Avoid unnecessary reads - only read files you're about to modify\n\nFor execution:\n  Stage 1: Analyze request (intent, scope, constraints).\n  Stage 2: Plan architecture (design system, components, files).\n           CRITICAL: List ALL files needed (HTML, CSS, JS, etc.) - create them ALL in one turn.\n  Stage 3: Select tools (name each planned call, READ first for edits).\n           CRITICAL: If HTML references script.js \u2192 add either-write for script.js to your plan.\n  Stage 4: Execute in parallel (emit multiple tool_use blocks that do not conflict).\n           CRITICAL: Create ALL files in this single turn - don't leave any for later.\n  Stage 5: Verify & Respond (self-check: did I create ALL referenced files? Are all features working?)\n           CRITICAL: Before responding, confirm every <script src=\"...\"> file was created.\n\nDeterminism:\n  - Default temperature low (0.2); fix seeds where supported.\n  - Use the smallest change that works; avoid rewrites.\n  - Always prefer either-line-replace over either-write for existing files.\n\nSafety:\n  - File operations restricted to allowed workspaces and globs.\n  - Web search is server-side with automatic rate limiting and citations.\n  - All tool calls are logged with metrics (latency, sizes, file counts).\n\nExternal API & CORS Handling:\n  - WebContainer environment automatically proxies ALL external API requests\n  - NO need to worry about CORS - the proxy handles it transparently\n  - Simply use standard fetch() calls to any external API\n  - The runtime automatically intercepts and routes through /api/proxy-api endpoint\n  - CDN resources (images, fonts, scripts) are proxied through /api/proxy-cdn\n  - This system works seamlessly - write code as if CORS doesn't exist\n  - Example: fetch('https://api.example.com/data') just works, no configuration needed\n\nAPI Best Practices:\n  - Choose reliable, well-documented public APIs for your use case\n  - Always implement client-side caching (30-60 seconds minimum) to respect rate limits\n  - Handle API errors gracefully with try/catch and user-friendly error messages\n  - Display loading states while fetching data\n  - Consider fallback data or cached responses when APIs are unavailable\n  - For crypto data: CoinGecko, CoinCap, or similar reputable sources\n  - For weather: OpenWeather, WeatherAPI, or government APIs\n  - For images: Use CDNs that allow hotlinking and work with our proxy\n  - Avoid services that block external embedding or require authentication\n\nOutput contract:\n  - When executing, emit parallel tool_use blocks grouped by task.\n  - After tools, review diffs and summarize what changed and why.\n\nTools available:\n  - either-view: Read files (returns sha256, line_count, encoding)\n  - either-search-files: Search code (supports regex, context lines)\n  - either-line-replace: Edit lines (returns unified diff, verifies with sha256)\n  - either-write: Create files (returns diff summary)\n  - web_search: Search the web for up-to-date information (server-side, automatic citations)\n  - eithergen--generate_image: Generate images (OpenAI/custom provider, saves to disk)";
var Agent = /** @class */ (function () {
    function Agent(options) {
        this.options = options;
        this.modelClient = new model_client_js_1.ModelClient(options.claudeConfig);
        this.toolRunner = new tool_runner_js_1.ToolRunner(options.executors, options.workingDir, options.agentConfig);
        this.recorder = new transcript_js_1.TranscriptRecorder(options.agentConfig);
        this.conversationHistory = [];
    }
    /**
     * Load conversation history (for restoring state)
     */
    Agent.prototype.loadConversationHistory = function (messages) {
        this.conversationHistory = messages;
    };
    /**
     * Process a user request through the agent workflow
     */
    Agent.prototype.processRequest = function (userMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var transcriptId, finalResponse, turnCount, maxTurns, changedFiles, hasExecutedTools, response, textBlocks, _a, enforcedAssistantBlocks, toolUses, verificationSummary, toolResults, createdFilesThisTurn, _i, toolResults_1, result, metadata, missingRefs, warningMessage, lastResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        transcriptId = this.recorder.startTranscript(userMessage);
                        // Add user message to history (content must be array for Claude API)
                        this.conversationHistory.push({
                            role: 'user',
                            content: [{ type: 'text', text: userMessage }]
                        });
                        this.recorder.addEntry({
                            timestamp: new Date().toISOString(),
                            role: 'user',
                            content: userMessage
                        });
                        finalResponse = '';
                        turnCount = 0;
                        maxTurns = 20;
                        changedFiles = new Set();
                        hasExecutedTools = false;
                        _b.label = 1;
                    case 1:
                        if (!(turnCount < maxTurns)) return [3 /*break*/, 10];
                        turnCount++;
                        // Validate conversation history before sending to Claude
                        this.validateConversationHistory();
                        return [4 /*yield*/, this.modelClient.sendMessage(this.conversationHistory, SYSTEM_PROMPT, (0, tools_core_1.getAllToolDefinitions)(), {
                                onDelta: function (delta) {
                                    if (delta.type === 'text') {
                                        process.stdout.write(delta.content);
                                    }
                                },
                                webSearchConfig: this.options.webSearch
                            })];
                    case 2:
                        response = _b.sent();
                        // Record assistant response
                        this.recorder.addEntry({
                            timestamp: new Date().toISOString(),
                            role: 'assistant',
                            content: response.content,
                            metadata: {
                                model: this.options.claudeConfig.model,
                                tokenUsage: {
                                    input: response.usage.inputTokens,
                                    output: response.usage.outputTokens
                                },
                                stopReason: response.stopReason || undefined
                            }
                        });
                        textBlocks = response.content
                            .filter(function (c) { return c.type === 'text'; })
                            .map(function (c) { return c.text; })
                            .join('\n');
                        _a = this.injectReadBeforeWriteBlocks(response.content), enforcedAssistantBlocks = _a.contentBlocks, toolUses = _a.toolUses;
                        // Only add assistant message if it has content (Anthropic API requirement)
                        if (enforcedAssistantBlocks.length > 0) {
                            this.conversationHistory.push({
                                role: 'assistant',
                                content: enforcedAssistantBlocks
                            });
                        }
                        else {
                            // Edge case: empty response - add placeholder to maintain conversation flow
                            console.warn('[Agent] Warning: Assistant response had no content blocks, adding placeholder');
                            this.conversationHistory.push({
                                role: 'assistant',
                                content: [{ type: 'text', text: '...' }]
                            });
                        }
                        if (!(toolUses.length === 0)) return [3 /*break*/, 5];
                        finalResponse = textBlocks;
                        if (!(hasExecutedTools && !this.options.dryRun)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.runVerification(changedFiles)];
                    case 3:
                        verificationSummary = _b.sent();
                        finalResponse += verificationSummary;
                        _b.label = 4;
                    case 4: return [3 /*break*/, 10];
                    case 5:
                        toolResults = void 0;
                        if (!this.options.dryRun) return [3 /*break*/, 6];
                        toolResults = toolUses.map(function (tu) { return ({
                            type: 'tool_result',
                            tool_use_id: tu.id,
                            content: "[DRY RUN] Would execute: ".concat(tu.name, " with input: ").concat(JSON.stringify(tu.input, null, 2))
                        }); });
                        return [3 /*break*/, 9];
                    case 6: return [4 /*yield*/, this.toolRunner.executeTools(toolUses)];
                    case 7:
                        toolResults = _b.sent();
                        hasExecutedTools = true;
                        createdFilesThisTurn = new Set();
                        for (_i = 0, toolResults_1 = toolResults; _i < toolResults_1.length; _i++) {
                            result = toolResults_1[_i];
                            metadata = result.metadata;
                            if ((metadata === null || metadata === void 0 ? void 0 : metadata.path) && !result.is_error) {
                                changedFiles.add(metadata.path);
                                createdFilesThisTurn.add(metadata.path);
                            }
                        }
                        return [4 /*yield*/, this.checkMissingFileReferences(toolUses, createdFilesThisTurn, toolResults)];
                    case 8:
                        missingRefs = _b.sent();
                        if (missingRefs.length > 0) {
                            warningMessage = "\n\n\u26A0\uFE0F WARNING: Missing file references detected:\n".concat(missingRefs.map(function (ref) { return "  - ".concat(ref.htmlFile, " references <").concat(ref.tag, " ").concat(ref.attr, "=\"").concat(ref.file, "\"> but ").concat(ref.file, " was not created"); }).join('\n'), "\n\nYou MUST create these files in your next response to make the app functional.");
                            // Append warning to the last tool result
                            if (toolResults.length > 0) {
                                lastResult = toolResults[toolResults.length - 1];
                                lastResult.content = (lastResult.content || '') + warningMessage;
                                console.warn('[Agent]' + warningMessage);
                            }
                        }
                        _b.label = 9;
                    case 9:
                        // Record tool results
                        this.recorder.addEntry({
                            timestamp: new Date().toISOString(),
                            role: 'user',
                            content: toolResults
                        });
                        // Add tool results to conversation
                        this.conversationHistory.push({
                            role: 'user',
                            content: toolResults
                        });
                        // If stop reason was end_turn, continue conversation
                        if (response.stopReason === 'end_turn') {
                            return [3 /*break*/, 1];
                        }
                        return [3 /*break*/, 1];
                    case 10:
                        // End transcript
                        this.recorder.endTranscript(transcriptId, finalResponse);
                        return [2 /*return*/, finalResponse];
                }
            });
        });
    };
    /**
     * Get conversation history
     */
    Agent.prototype.getHistory = function () {
        return __spreadArray([], this.conversationHistory, true);
    };
    /**
     * Reset conversation
     */
    Agent.prototype.reset = function () {
        this.conversationHistory = [];
        this.toolRunner.clearCache();
    };
    /**
     * Save transcript to disk
     */
    Agent.prototype.saveTranscript = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.recorder.saveCurrentTranscript()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set database context for file operations
     */
    Agent.prototype.setDatabaseContext = function (fileStore, appId, sessionId) {
        this.toolRunner.setDatabaseContext(fileStore, appId, sessionId);
    };
    /**
     * Run verification and create summary
     */
    Agent.prototype.runVerification = function (changedFiles) {
        return __awaiter(this, void 0, void 0, function () {
            var verifier, changeSummary, verifyResult, verifySummary, metrics, metricsSummary;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        verifier = new verifier_js_1.VerifierRunner(this.options.workingDir);
                        changeSummary = this.createChangeSummary(changedFiles);
                        return [4 /*yield*/, verifier.run()];
                    case 1:
                        verifyResult = _a.sent();
                        verifySummary = verifier_js_1.VerifierRunner.formatSummary(verifyResult);
                        metrics = this.toolRunner.getMetrics();
                        metricsSummary = metrics.getSummaryString();
                        return [2 /*return*/, "\n\n---\n".concat(changeSummary).concat(verifySummary, "\n\n**Metrics:**\n").concat(metricsSummary)];
                }
            });
        });
    };
    /**
     * Create a summary of changed files
     */
    Agent.prototype.createChangeSummary = function (changedFiles) {
        if (changedFiles.size === 0) {
            return '';
        }
        var files = Array.from(changedFiles).sort();
        var summary = files.length === 1
            ? "**Changed:** ".concat(files[0], "\n")
            : "**Changed (".concat(files.length, " files):**\n").concat(files.map(function (f) { return "  - ".concat(f); }).join('\n'), "\n");
        return summary;
    };
    /**
     * Validate conversation history format and content
     * Prevents API errors by ensuring all messages follow Claude API requirements
     */
    Agent.prototype.validateConversationHistory = function () {
        var _this = this;
        this.conversationHistory.forEach(function (msg, idx) {
            // Validate that content is always an array (Claude API requirement)
            if (!Array.isArray(msg.content)) {
                console.error("\n\u274C CONVERSATION HISTORY VALIDATION ERROR:");
                console.error("   Message [".concat(idx, "] (role: ").concat(msg.role, ") has non-array content"));
                console.error("   Content type: ".concat(typeof msg.content));
                console.error("   Content value:", msg.content);
                console.error("\n   Claude API requires content to be an array of content blocks.");
                console.error('');
                throw new Error("Conversation history validation failed: " +
                    "Message ".concat(idx, " has invalid content format (expected array, got ").concat(typeof msg.content, "). ") +
                    "This will cause Claude API to reject the request with \"Input should be a valid list\" error.");
            }
            // Validate that content array is not empty (except for optional final assistant message)
            if (msg.content.length === 0) {
                var isFinalAssistant = idx === _this.conversationHistory.length - 1 && msg.role === 'assistant';
                if (!isFinalAssistant) {
                    console.error("\n\u274C CONVERSATION HISTORY VALIDATION ERROR:");
                    console.error("   Message [".concat(idx, "] (role: ").concat(msg.role, ") has empty content array"));
                    console.error("\n   Claude API requires all messages to have non-empty content,");
                    console.error("   except for the optional final assistant message.");
                    console.error('');
                    throw new Error("Conversation history validation failed: " +
                        "Message ".concat(idx, " has empty content array. ") +
                        "This will cause Claude API to reject the request with \"all messages must have non-empty content\" error.");
                }
            }
            // Validate server_tool_use blocks are properly paired with web_search_tool_result
            if (msg.role === 'assistant' && Array.isArray(msg.content)) {
                var serverToolUses = msg.content.filter(function (b) { return b.type === 'server_tool_use'; });
                var webSearchResults_1 = msg.content.filter(function (b) { return b.type === 'web_search_tool_result'; });
                if (serverToolUses.length > 0) {
                    // Verify each server_tool_use has a corresponding web_search_tool_result
                    serverToolUses.forEach(function (stu) {
                        var hasMatchingResult = webSearchResults_1.some(function (wsr) { return wsr.tool_use_id === stu.id; });
                        if (!hasMatchingResult) {
                            console.error("\n\u274C CONVERSATION HISTORY VALIDATION ERROR:");
                            console.error("   Message [".concat(idx, "] has server_tool_use (").concat(stu.id, ") without web_search_tool_result"));
                            console.error("   This will cause Claude API to reject the request.");
                            console.error("\n   Message content blocks:");
                            if (Array.isArray(msg.content)) {
                                msg.content.forEach(function (block, blockIdx) {
                                    console.error("     [".concat(blockIdx, "] ").concat(block.type));
                                });
                            }
                            console.error('');
                            throw new Error("Conversation history validation failed: " +
                                "Message ".concat(idx, " has server_tool_use \"").concat(stu.name, "\" (").concat(stu.id, ") ") +
                                "without corresponding web_search_tool_result. " +
                                "This indicates a bug in the streaming or content block handling.");
                        }
                    });
                }
            }
        });
    };
    /**
     * Injects `either-view` reads before any write/edit tool calls that lack a
     * preceding read for the same `path` within the same assistant turn.
     * Also returns the final list of tool_uses to execute (in order).
     */
    Agent.prototype.injectReadBeforeWriteBlocks = function (contentBlocks) {
        var _a, _b, _c;
        var out = [];
        var toolUsesCollected = [];
        var seenReadForPath = new Set();
        var pushAndCollect = function (blk) {
            out.push(blk);
            if (blk && blk.type === 'tool_use') {
                toolUsesCollected.push({
                    type: 'tool_use',
                    id: blk.id,
                    name: blk.name,
                    input: blk.input
                });
            }
        };
        for (var _i = 0, contentBlocks_1 = contentBlocks; _i < contentBlocks_1.length; _i++) {
            var blk = contentBlocks_1[_i];
            // Track explicit reads
            if ((blk === null || blk === void 0 ? void 0 : blk.type) === 'tool_use' && blk.name === Agent.READ_TOOL) {
                var path = (_a = blk.input) === null || _a === void 0 ? void 0 : _a.path;
                if (typeof path === 'string' && path.length > 0) {
                    seenReadForPath.add(path);
                }
                pushAndCollect(blk);
                continue;
            }
            // Before either-line-replace (EDIT), ensure we've read the target file
            // NO injection for either-write (CREATE) - it handles file existence checks internally
            if ((blk === null || blk === void 0 ? void 0 : blk.type) === 'tool_use' && blk.name === 'either-line-replace') {
                var path = (_b = blk.input) === null || _b === void 0 ? void 0 : _b.path;
                if (typeof path === 'string' && path.length > 0 && !seenReadForPath.has(path)) {
                    // Inject a synthetic read tool_use directly before the edit
                    var injectedId = "enforcer-view-".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 10));
                    var injected = {
                        type: 'tool_use',
                        id: injectedId,
                        name: Agent.READ_TOOL,
                        input: { path: path }
                    };
                    pushAndCollect(injected);
                    seenReadForPath.add(path);
                }
                // Optionally annotate missing needle (soft warning)
                if (!((_c = blk.input) === null || _c === void 0 ? void 0 : _c.needle)) {
                    blk.input = __assign(__assign({}, blk.input), { _enforcerWarning: 'No `needle` provided; injected a read to reduce risk.' });
                }
                pushAndCollect(blk);
                continue;
            }
            // For eithergen--generate_image or other WRITE tools, no read injection needed
            if ((blk === null || blk === void 0 ? void 0 : blk.type) === 'tool_use' && Agent.WRITE_TOOLS.has(blk.name)) {
                pushAndCollect(blk);
                continue;
            }
            // passthrough others
            pushAndCollect(blk);
        }
        // Only return *tool_use* blocks as executable tool uses, in order
        var executableToolUses = toolUsesCollected.filter(function (b) { return b.type === 'tool_use'; });
        return { contentBlocks: out, toolUses: executableToolUses };
    };
    /**
     * Check for missing file references in newly created HTML files
     * Detects <script src="..."> and <link href="..."> that reference non-existent files
     */
    Agent.prototype.checkMissingFileReferences = function (toolUses, createdFiles, toolResults) {
        return __awaiter(this, void 0, void 0, function () {
            var missing, htmlWrites, _i, htmlWrites_1, htmlWrite, htmlPath, resultIdx, result, htmlContent, scriptMatches, _a, scriptMatches_1, match, scriptPath, normalizedPath, linkMatches, _b, linkMatches_1, match, fullTag, linkPath, normalizedPath;
            var _c, _d;
            return __generator(this, function (_e) {
                missing = [];
                htmlWrites = toolUses.filter(function (tu) {
                    var _a, _b;
                    return (tu.name === 'either-write' || tu.name === 'either-line-replace') &&
                        ((_b = (_a = tu.input) === null || _a === void 0 ? void 0 : _a.path) === null || _b === void 0 ? void 0 : _b.toLowerCase().endsWith('.html'));
                });
                for (_i = 0, htmlWrites_1 = htmlWrites; _i < htmlWrites_1.length; _i++) {
                    htmlWrite = htmlWrites_1[_i];
                    htmlPath = (_c = htmlWrite.input) === null || _c === void 0 ? void 0 : _c.path;
                    if (!htmlPath)
                        continue;
                    resultIdx = toolUses.indexOf(htmlWrite);
                    result = toolResults[resultIdx];
                    if (!result || result.is_error)
                        continue;
                    htmlContent = htmlWrite.name === 'either-write'
                        ? (_d = htmlWrite.input) === null || _d === void 0 ? void 0 : _d.content
                        : null;
                    if (!htmlContent || typeof htmlContent !== 'string')
                        continue;
                    scriptMatches = htmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
                    for (_a = 0, scriptMatches_1 = scriptMatches; _a < scriptMatches_1.length; _a++) {
                        match = scriptMatches_1[_a];
                        scriptPath = match[1];
                        normalizedPath = scriptPath.replace(/^\.?\//, '');
                        if (!createdFiles.has(normalizedPath) && !createdFiles.has(scriptPath)) {
                            missing.push({
                                htmlFile: htmlPath,
                                tag: 'script',
                                attr: 'src',
                                file: scriptPath
                            });
                        }
                    }
                    linkMatches = htmlContent.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi);
                    for (_b = 0, linkMatches_1 = linkMatches; _b < linkMatches_1.length; _b++) {
                        match = linkMatches_1[_b];
                        fullTag = match[0];
                        // Only check stylesheets, not other links
                        if (fullTag.includes('stylesheet')) {
                            linkPath = match[1];
                            normalizedPath = linkPath.replace(/^\.?\//, '');
                            if (!createdFiles.has(normalizedPath) && !createdFiles.has(linkPath)) {
                                missing.push({
                                    htmlFile: htmlPath,
                                    tag: 'link',
                                    attr: 'href',
                                    file: linkPath
                                });
                            }
                        }
                    }
                }
                return [2 /*return*/, missing];
            });
        });
    };
    // --- READ-before-WRITE enforcement constants ---
    Agent.WRITE_TOOLS = new Set(['either-line-replace', 'either-write']);
    Agent.READ_TOOL = 'either-view';
    return Agent;
}());
exports.Agent = Agent;
