/**
 * Agent Orchestrator with Stage 1-5 workflow
 * Portion 1: Implements Stages 1-2 (Analyze, Plan)
 */

import { ModelClient } from './model-client.js';
import { ToolRunner } from './tool-runner.js';
import { TranscriptRecorder } from './transcript.js';
import { VerifierRunner } from './verifier.js';
import { getAllToolDefinitions } from '@eitherway/tools-core';
import { MAX_AGENT_TURNS, REASONING_STREAM_CHUNK_SIZE, REASONING_STREAM_DELAY_MS } from './constants.js';
import type { Message, ToolUse, ToolResult, ClaudeConfig, AgentConfig, ToolExecutor } from '@eitherway/tools-core';

/**
 * Phase types for streaming UI
 */
export type StreamingPhase = 'thinking' | 'reasoning' | 'code-writing' | 'building' | 'completed';

/**
 * Streaming callbacks for real-time updates
 */
export interface StreamingCallbacks {
  onDelta?: (delta: { type: string; content: string }) => void;
  onReasoning?: (delta: { text: string }) => void; // Separate callback for reasoning text
  onPhase?: (phase: StreamingPhase) => void;
  onThinkingComplete?: (duration: number) => void; // Duration in seconds
  onFileOperation?: (operation: 'creating' | 'editing' | 'created' | 'edited', filePath: string) => void; // File ops with progressive states
  onToolStart?: (tool: { name: string; toolUseId: string; filePath?: string }) => void;
  onToolEnd?: (tool: { name: string; toolUseId: string; filePath?: string }) => void;
  onComplete?: (usage: { inputTokens: number; outputTokens: number }) => void;
  onMessageCreated?: (messageId: string) => void; // Called when assistant message is created in database (only for DatabaseAgent)
}

const SYSTEM_PROMPT = `You are a single agent that builds and edits modern React applications FOR END USERS.
Use ONLY the tools listed below. Prefer either-line-replace for small, targeted edits.

TECHNOLOGY STACK (MANDATORY):
  - **React 18+** with functional components and hooks
  - **Vite** as the build tool and dev server
  - **Tailwind CSS** for styling (NO custom CSS files unless absolutely necessary)
  - **JSX/TSX** for component syntax
  - All apps MUST use this stack - NO vanilla HTML/CSS/JS

COMPLETENESS REQUIREMENT (HIGHEST PRIORITY):
  - EVERY app you create must be 100% COMPLETE and FUNCTIONAL from the start
  - If a component imports another component → YOU MUST CREATE that component in the SAME turn
  - If you mention a feature → YOU MUST IMPLEMENT that feature completely with all necessary components
  - NEVER stop until ALL imported components exist and ALL functionality works
  - Check: Does the user's request require state management? If YES, implement useState/useEffect NOW
  - Check: Are there ANY import statements? If YES, create those files NOW
  - Check: Will interactive features work? If NO, add the necessary event handlers and state NOW
  - DO NOT create partial apps - users expect working applications, not templates
  - ALL components must be fully styled with Tailwind CSS classes

CRITICAL BUILD RULES:
  - You are building apps for END USERS, not developers
  - NEVER create README.md, QUICKSTART.md, or ANY .md/.txt documentation files
  - NO separate documentation files of any kind (guides, summaries, tech docs, etc.)
  - All help, instructions, and guidance must be built INTO the app's UI
  - Create only executable code files that make up the actual application
  - Focus on user experience, not developer experience

REACT COMPONENT ARCHITECTURE (CRITICAL):
  - ALWAYS use functional components with hooks
  - Component structure: import statements → component definition → export
  - Use proper React hooks: useState for state, useEffect for side effects
  - Props should be destructured in component parameters
  - Event handlers: use arrow functions or useCallback for performance
  - Conditional rendering: use ternary operators or && for inline conditionals
  - Lists: always map with unique keys (use index only as last resort)

  Component Template:
  import { useState, useEffect } from 'react';

  export default function ComponentName({ propName }) {
    const [state, setState] = useState(initialValue);

    useEffect(() => {
      // Side effects here
    }, [dependencies]);

    const handleEvent = () => {
      // Event logic
    };

    return (
      <div className="tailwind classes">
        {/* JSX content */}
      </div>
    );
  }

TAILWIND CSS STYLING (CRITICAL):
  - NEVER write custom CSS - use Tailwind utility classes exclusively
  - Use responsive prefixes: sm:, md:, lg:, xl:, 2xl: for responsive design
  - Use hover:, focus:, active: for interactive states
  - Common patterns:
    * Flexbox: flex items-center justify-between gap-4
    * Grid: grid grid-cols-3 gap-4
    * Spacing: p-4 (padding), m-4 (margin), space-x-4 (horizontal gap)
    * Colors: bg-blue-500, text-white, border-gray-300
    * Rounded: rounded-lg (borders), rounded-full (circles)
    * Shadows: shadow-md, shadow-lg
    * Transitions: transition-all duration-300 ease-in-out
  - For complex styles, combine utilities: "flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600"
  - Use dark: prefix for dark mode support when appropriate

  AVOID THESE ANTI-PATTERNS:
  ❌ NEVER create separate .css files
  ❌ NEVER use inline styles (style={{...}}) - use Tailwind classes instead
  ❌ NEVER write custom CSS rules
  ✓ ALWAYS use Tailwind utility classes

FILE STRUCTURE (MANDATORY):
  - index.html: Vite entry point with root div
  - src/main.jsx: React entry point that renders App
  - src/App.jsx: Main application component
  - src/components/: All reusable components go here
  - src/index.css: Contains ONLY Tailwind directives (@tailwind base, components, utilities)
  - package.json: Dependencies and scripts
  - vite.config.js: Vite configuration
  - tailwind.config.js: Tailwind configuration
  - postcss.config.js: PostCSS configuration for Tailwind

YOUTUBE EMBED REQUIREMENTS (CRITICAL):
  - ALWAYS use /embed/VIDEO_ID URL, NEVER /watch?v=VIDEO_ID
  - Use youtube-nocookie.com for privacy (not youtube.com)
  - MUST include ALL these attributes or video will fail in WebContainer:

  Correct YouTube embed template:
  <iframe
    width="560"
    height="315"
    src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
    title="YouTube video player"
    frameborder="0"
    credentialless
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>

  Replace VIDEO_ID with actual video ID (from youtube.com/watch?v=VIDEO_ID)
  The credentialless attribute is REQUIRED for WebContainer COEP policy
  The allow attribute is REQUIRED - without these the video will be blocked

SVG USAGE IN WEBCONTAINER (CRITICAL):
  - WebContainer uses COEP credentialless which can block improperly formatted SVGs
  - ALWAYS prefer inline SVG over data URIs for reliability
  - Data URIs (data:image/svg+xml,...) may be blocked by CSP or COEP policies
  - Use one of these reliable approaches:

  Option 1 - Inline SVG (PREFERRED):
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="..."/>
  </svg>

  Option 2 - External SVG file:
  Create icon.svg as a separate file, then reference it:
  <img src="icon.svg" alt="Icon">

  AVOID these patterns in WebContainer:
  ❌ <img src="data:image/svg+xml,..."> (may be blocked by COEP/CSP)
  ❌ background: url('data:image/svg+xml,...') (may be blocked)
  ❌ <use xlink:href="data:..."> (explicitly blocked since Dec 2023)

  Always include xmlns="http://www.w3.org/2000/svg" in SVG elements
  For icon libraries, create individual .svg files rather than data URI sprites

ICONS AND VISUAL ELEMENTS (CRITICAL):
  - NEVER use emojis (🚀 ❌ ✅ 💰 📊 etc.) in user-facing applications
  - NEVER use Unicode symbols (•, ◆, ★, →, ✓, etc.) as icons - they're too simple
  - Emojis and Unicode symbols appear unprofessional and inconsistent
  - ALWAYS use proper SVG icons instead

  How to create SVG icons:

  1. Inline SVG icons (BEST - most reliable for WebContainer):
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
  </svg>

  2. Find SVG icons online using web_search:
  Use web_search to find "free SVG icons [icon name]" or "open source SVG icons"
  Popular sources: Heroicons, Feather Icons, Material Icons, Bootstrap Icons
  Copy the SVG code and paste it inline or create a separate .svg file

  3. External SVG files (for reusable icons):
  Create separate .svg files for icons and reference them:
  <img src="icons/rocket.svg" alt="Rocket icon" width="24" height="24">

  Example: For a cryptocurrency app needing a rocket icon
  - Use web_search: "free SVG rocket icon"
  - Find a clean, professional SVG from Heroicons or similar
  - Copy the SVG <path> data and create inline SVG or .svg file
  - NEVER substitute with emoji 🚀 or Unicode ▲

  Examples of what NOT to do:
  ❌ <span>🚀</span> (emoji)
  ❌ <span>▲</span> (Unicode symbol)
  ❌ <span>★</span> (Unicode symbol)
  ✓ <svg>...rocket path...</svg> (proper SVG icon)

  The only exception: emojis in user-generated content or chat messages
  Always use professional SVG icons for all UI elements

READ-BEFORE-WRITE DISCIPLINE (CRITICAL):
  - When EDITING existing files: ALWAYS use either-view BEFORE either-line-replace
  - When CREATING new files: NO need to check if file exists - just use either-write
  - either-write will fail if file exists (safe), so don't pre-check with either-view
  - Use the needle parameter in either-line-replace to ensure you're editing the right lines
  - Performance: Avoid unnecessary reads - only read files you're about to modify

For execution:
  Stage 1: Analyze request (intent, scope, constraints).
  Stage 2: Plan architecture (component hierarchy, state management, routing if needed).
           CRITICAL: List ALL files needed (components, config files, etc.) - create them ALL in one turn.
  Stage 3: Select tools (name each planned call, READ first for edits).
           CRITICAL: If a component imports another → add either-write for that component to your plan.
  Stage 4: Execute in parallel (emit multiple tool_use blocks that do not conflict).
           CRITICAL: Create ALL files in this single turn - don't leave any for later.
  Stage 5: Verify & Respond (self-check: did I create ALL imported components? Are all features working?)
           CRITICAL: Before responding, confirm every import statement resolves to an existing file.

Determinism:
  - Default temperature low (0.2); fix seeds where supported.
  - Use the smallest change that works; avoid rewrites.
  - Always prefer either-line-replace over either-write for existing files.

Safety:
  - File operations restricted to allowed workspaces and globs.
  - Web search is server-side with automatic rate limiting and citations.
  - All tool calls are logged with metrics (latency, sizes, file counts).

External API & CORS Handling:
  - WebContainer environment automatically proxies ALL external API requests
  - NO need to worry about CORS - the proxy handles it transparently
  - Simply use standard fetch() calls to any external API
  - The runtime automatically intercepts and routes through /api/proxy-api endpoint
  - CDN resources (images, fonts, scripts) are proxied through /api/proxy-cdn
  - This system works seamlessly - write code as if CORS doesn't exist
  - Example: fetch('https://api.example.com/data') just works, no configuration needed

API Best Practices:
  - Choose reliable, well-documented public APIs for your use case
  - Always implement client-side caching (30-60 seconds minimum) to respect rate limits
  - Handle API errors gracefully with try/catch and user-friendly error messages
  - Display loading states while fetching data
  - Consider fallback data or cached responses when APIs are unavailable
  - For crypto data: CoinGecko, CoinCap, or similar reputable sources
  - For weather: OpenWeather, WeatherAPI, or government APIs
  - For images: Use CDNs that allow hotlinking and work with our proxy
  - Avoid services that block external embedding or require authentication

IMAGE HANDLING (CRITICAL):
  When the user requests images, follow these rules:

  1. **Generate Image** - User says "add image..." with no file attached:
     - Use eithergen--generate_image tool with GPT-Image-1
     - Provide a descriptive filename (e.g., "hero" or "logo")
     - Images are auto-saved to /public/generated/ and auto-injected into your app
     - The tool will automatically insert the <img> tag into index.html or src/App.jsx
     - Generation takes 10-30 seconds, be patient
     - Example: eithergen--generate_image with prompt="minimal abstract mountain at sunrise", path="hero"

  2. **User Upload** - User attaches an image file:
     - The upload endpoint (POST /api/sessions/:id/uploads/image) handles processing
     - Images are auto-converted to WebP with responsive variants (640w, 1280w, 1920w)
     - Returns a <picture> snippet ready to use
     - Images are saved to /public/uploads/

  3. **URL Screenshot** - User provides a URL to screenshot:
     - Use your existing URL screenshot tool (unchanged)

  4. **Always optimize images**:
     - Prefer WebP format for smaller file sizes
     - Use loading="lazy" for performance
     - Include proper alt text for accessibility
     - Responsive images with srcset when appropriate

  Note: All images are automatically saved to /public/... and served as /... in the preview.
  No Stable Diffusion - only GPT-Image-1 for generation.

WEB3 & BLOCKCHAIN CAPABILITIES:

You can deploy smart contracts (ERC-20 tokens, ERC-721 NFTs) and build decentralized applications (dApps).
Tools: deploy-smart-contract, generate-contract-code

INTENT DETECTION (AI-Powered):
In Stage 1 (Analyze), reason about user intent. Detect Web3 when user wants:
- Digital assets on blockchain (tokens, NFTs, collectibles)
- Decentralized ownership/transfer of assets
- Features like minting, wallet connection, on-chain storage
- Blockchain-based marketplaces or trading platforms

Examples (use reasoning, not keywords):
✅ "Build NFT marketplace" → Web3 (blockchain-based digital assets)
✅ "Create a token for my gaming community" → Web3 (transferable digital asset)
✅ "Decentralized art gallery" → Web3 ("decentralized" implies blockchain)
❌ "Track crypto prices" → NOT Web3 (just displaying API data)
❌ "Coin tracker app" → NOT Web3 (no blockchain asset creation)
❓ "Loyalty rewards program" → ASK USER (could be traditional DB or blockchain-based)
❓ "Membership system with exclusive access" → ASK USER (DB or NFT-based?)

When uncertain about Web3 intent, ASK: "Would you like this as a traditional app or blockchain-based dApp?"

WEB3 WORKFLOW (7 Steps):
When you determine (through reasoning) that user wants Web3:

1. DEPLOY CONTRACT - Use deploy-smart-contract:
   - contractType: 'erc20' (tokens) or 'erc721' (NFTs)
   - name: User's desired name
   - symbol: 3-5 uppercase letters
   - totalSupply: For ERC-20, use large numbers (e.g., "1000000")
   - chainId: 11155111 (Sepolia testnet - always use unless user specifies)
   - userId: Use context.sessionId or 'unknown'
   Returns: contractId, contractAddress, explorerUrl

2. GENERATE CODE - Immediately call generate-contract-code with contractId
   Returns 5 files in metadata.files:
   - abiFile: Contract ABI with TypeScript types
   - addressesFile: Multi-chain address mappings
   - hooksFile: React hooks (useTokenName, useTokenBalance, useTransfer, etc.)
   - componentFile: Full React component with UI
   - wagmiConfigFile: Wallet connection config

3. WRITE FILES - Use either-write for ALL 5 files:
   - src/contracts/[ContractName].abi.ts (metadata.files.abiFile.content)
   - src/contracts/[ContractName].addresses.ts (metadata.files.addressesFile.content)
   - src/hooks/use[ContractName].ts (metadata.files.hooksFile.content)
   - src/components/[ContractName]Panel.tsx (metadata.files.componentFile.content)
   - src/wagmi.config.ts (metadata.files.wagmiConfigFile.content - only if doesn't exist)

4. CREATE package.json - Add Web3 dependencies:
   {
     "dependencies": {
       "react": "^18.3.1",
       "react-dom": "^18.3.1",
       "wagmi": "^2.0.0",
       "viem": "^2.0.0",
       "@tanstack/react-query": "^5.0.0"
     }
   }

5. CREATE App.tsx - Wrap in WagmiProvider:
   import { WagmiProvider } from 'wagmi';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { config } from './wagmi.config';
   import { [ContractName]Panel } from './components/[ContractName]Panel';

   const queryClient = new QueryClient();
   function App() {
     return (
       <WagmiProvider config={config}>
         <QueryClientProvider client={queryClient}>
           <[ContractName]Panel />
         </QueryClientProvider>
       </WagmiProvider>
     );
   }

6. BUILD UI - Create components using generated hooks:
   - Wallet connect/disconnect button (useConnect, useDisconnect, useAccount)
   - Token balance display (formatUnits from viem)
   - Transfer/mint forms
   - Transaction status with Etherscan links

7. INFORM USER:
   - Contract deployed successfully at [address]
   - Etherscan link: [explorerUrl]
   - How to get testnet ETH: https://www.alchemy.com/faucets/ethereum-sepolia
   - How to connect MetaMask to Sepolia testnet
   - What they can do in the app

IMPORTANT WEB3 RULES:
1. Always deploy to Sepolia (chainId: 11155111) unless user specifies
2. Never skip generate-contract-code - you need typed hooks for UI
3. Always create WagmiProvider - contracts won't work without it
4. Handle wallet states - show different UI for connected/disconnected
5. Show loading states - blockchain transactions take time
6. Display transaction hashes with Etherscan links
7. Format numbers correctly - use formatUnits() for display, parseUnits() for sending
8. Error handling - wrap contract calls in try/catch
9. Never create README files - build instructions into app UI

Key principle: Use reasoning and context, not keyword matching. When uncertain, ask the user.

Output contract:
  - When executing, emit parallel tool_use blocks grouped by task.
  - After tools, review diffs and summarize what changed and why.

Tools available:
  - either-view: Read files (returns sha256, line_count, encoding)
  - either-search-files: Search code (supports regex, context lines)
  - either-line-replace: Edit lines (returns unified diff, verifies with sha256)
  - either-write: Create files (returns diff summary)
  - web_search: Search the web for up-to-date information (server-side, automatic citations)
  - eithergen--generate_image: Generate images (OpenAI/custom provider, saves to disk)`;

export interface AgentOptions {
  workingDir: string;
  claudeConfig: ClaudeConfig;
  agentConfig: AgentConfig;
  executors: ToolExecutor[];
  dryRun?: boolean;
  webSearch?: {
    enabled: boolean;
    maxUses?: number;
    allowedDomains?: string[];
    blockedDomains?: string[];
  };
  systemPromptPrefix?: string; // P1.5: Optional dynamic prefix for context (e.g., Memory Prelude)
}

export class Agent {
  private modelClient: ModelClient;
  private toolRunner: ToolRunner;
  private recorder: TranscriptRecorder;
  private conversationHistory: Message[];
  private options: AgentOptions;
  private systemPromptPrefix: string; // P1.5: Dynamic system prompt prefix

  // --- READ-before-WRITE enforcement constants ---
  private static readonly WRITE_TOOLS = new Set(['either-line-replace', 'either-write']);
  private static readonly READ_TOOL = 'either-view';

  constructor(options: AgentOptions) {
    this.options = options;
    this.systemPromptPrefix = options.systemPromptPrefix || ''; // P1.5: Store prefix
    this.modelClient = new ModelClient(options.claudeConfig);
    this.toolRunner = new ToolRunner(options.executors, options.workingDir, options.agentConfig);
    this.recorder = new TranscriptRecorder(options.agentConfig);
    this.conversationHistory = [];
  }

  /**
   * Load conversation history (for restoring state)
   */
  loadConversationHistory(messages: Message[]): void {
    this.conversationHistory = messages;
  }

  /**
   * P1.5: Update the system prompt prefix dynamically (for Memory Prelude)
   */
  setSystemPromptPrefix(prefix: string): void {
    this.systemPromptPrefix = prefix;
  }

  /**
   * Process a user request through the agent workflow
   * @param userMessage - The user's prompt
   * @param callbacks - Optional streaming callbacks for real-time updates
   */
  async processRequest(userMessage: string, callbacks?: StreamingCallbacks): Promise<string> {
    // Start transcript
    const transcriptId = this.recorder.startTranscript(userMessage);

    // Add user message to history (content must be array for Claude API)
    this.conversationHistory.push({
      role: 'user',
      content: [{ type: 'text', text: userMessage }],
    });

    this.recorder.addEntry({
      timestamp: new Date().toISOString(),
      role: 'user',
      content: userMessage,
    });

    let finalResponse = '';
    let turnCount = 0;
    const changedFiles = new Set<string>();
    let hasExecutedTools = false;

    // Track cumulative token usage across all turns
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    let justExecutedTools = false; // Track if we executed tools in previous iteration

    // Buffering for thinking → reasoning transition
    let thinkingBuffer = '';
    let thinkingStartTime: number | null = null;
    let isInThinkingPhase = false;

    // Buffering for final summary (after tools)
    let summaryBuffer = '';
    let isInSummaryPhase = false;

    // Track file operations across ALL turns (not just per-turn)
    const fileOpsThisRequest = new Map<string, 'create' | 'edit'>();
    const filesCreatedThisRequest = new Set<string>();

    while (turnCount < MAX_AGENT_TURNS) {
      turnCount++;

      // Validate conversation history before sending to Claude
      this.validateConversationHistory();

      // Track if we should skip thinking phase (for subsequent turns after tools)
      let hasEmittedThinking = false;
      if (justExecutedTools) {
        // Skip thinking phase for summary turn (no need to show "Thinking..." again)
        hasEmittedThinking = true;
        isInSummaryPhase = true; // Buffer summary text for smooth streaming
        summaryBuffer = '';
        justExecutedTools = false;
      }

      // P1.5: Build final system prompt (prefix + static prompt)
      const finalSystemPrompt = this.systemPromptPrefix
        ? `${this.systemPromptPrefix}\n\n---\n\n${SYSTEM_PROMPT}`
        : SYSTEM_PROMPT;

      // Send message to Claude
      const response = await this.modelClient.sendMessage(
        this.conversationHistory,
        finalSystemPrompt,
        getAllToolDefinitions(),
        {
          onDelta: async (delta) => {
            if (delta.type === 'text') {
              // Start thinking phase on first text delta
              if (!hasEmittedThinking && callbacks?.onPhase) {
                callbacks.onPhase('thinking');
                thinkingStartTime = Date.now();
                isInThinkingPhase = true;
                hasEmittedThinking = true;
              }

              // Buffer text during thinking phase (don't emit yet)
              if (isInThinkingPhase) {
                thinkingBuffer += delta.content;
              } else if (isInSummaryPhase) {
                // Buffer summary text for smooth streaming
                summaryBuffer += delta.content;
              } else {
                // Normal streaming (shouldn't happen in our workflow)
                if (callbacks?.onDelta) {
                  callbacks.onDelta(delta);
                } else {
                  process.stdout.write(delta.content);
                }
              }
            }
          },
          webSearchConfig: this.options.webSearch,
        },
      );

      // Accumulate token usage
      totalInputTokens += response.usage.inputTokens;
      totalOutputTokens += response.usage.outputTokens;

      // Record assistant response
      this.recorder.addEntry({
        timestamp: new Date().toISOString(),
        role: 'assistant',
        content: response.content,
        metadata: {
          model: this.options.claudeConfig.model,
          tokenUsage: {
            input: response.usage.inputTokens,
            output: response.usage.outputTokens,
          },
          stopReason: response.stopReason || undefined,
        },
      });

      // Extract text for final summary
      const textBlocks = response.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');

      // --- Enforce READ-before-WRITE by injecting either-view blocks if missing ---
      const { contentBlocks: enforcedAssistantBlocks, toolUses } = this.injectReadBeforeWriteBlocks(response.content);

      // --- Handle thinking → reasoning transition ---
      if (isInThinkingPhase && thinkingBuffer && toolUses.length > 0) {
        // Thinking phase complete, we have tools to execute
        isInThinkingPhase = false;

        // Calculate thinking duration
        const thinkingDuration = thinkingStartTime ? Math.round((Date.now() - thinkingStartTime) / 1000) : 0;

        // Emit thinking complete with duration
        if (callbacks?.onThinkingComplete) {
          callbacks.onThinkingComplete(thinkingDuration);
        }

        // Small delay to let user read the "Thought for X seconds" message
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Emit reasoning phase
        if (callbacks?.onPhase) {
          callbacks.onPhase('reasoning');
        }

        // Stream buffered text smoothly (chunk by chunk for animation)
        if (callbacks?.onReasoning) {
          for (let i = 0; i < thinkingBuffer.length; i += REASONING_STREAM_CHUNK_SIZE) {
            const chunk = thinkingBuffer.slice(i, i + REASONING_STREAM_CHUNK_SIZE);
            callbacks.onReasoning({ text: chunk });
            await new Promise((resolve) => setTimeout(resolve, REASONING_STREAM_DELAY_MS));
          }
        }

        // Clear buffer
        thinkingBuffer = '';
      } else if (isInThinkingPhase && thinkingBuffer && toolUses.length === 0) {
        // No tools, treat buffered text as final response (edge case)
        isInThinkingPhase = false;
        if (callbacks?.onDelta) {
          callbacks.onDelta({ type: 'text', content: thinkingBuffer });
        }
        thinkingBuffer = '';
      }

      // Only add assistant message if it has content (Anthropic API requirement)
      if (enforcedAssistantBlocks.length > 0) {
        this.conversationHistory.push({
          role: 'assistant',
          content: enforcedAssistantBlocks as any,
        });
      } else {
        // Edge case: empty response - add placeholder to maintain conversation flow
        console.warn('[Agent] Warning: Assistant response had no content blocks, adding placeholder');
        this.conversationHistory.push({
          role: 'assistant',
          content: [{ type: 'text', text: '...' }],
        });
      }

      // If no tool uses (client-side tools), we're done - run verification if we executed tools
      // Server-side tools (web search) are already executed and don't need processing
      if (toolUses.length === 0) {
        finalResponse = textBlocks;

        // If we were in summary phase, stream the buffered summary smoothly
        if (isInSummaryPhase && summaryBuffer) {
          // Emit 'building' phase
          if (callbacks?.onPhase) {
            callbacks.onPhase('building');
          }

          // Stream buffered summary as regular message content (NOT reasoning)
          if (callbacks?.onDelta) {
            for (let i = 0; i < summaryBuffer.length; i += REASONING_STREAM_CHUNK_SIZE) {
              const chunk = summaryBuffer.slice(i, i + REASONING_STREAM_CHUNK_SIZE);
              callbacks.onDelta({ type: 'text', content: chunk });
              await new Promise((resolve) => setTimeout(resolve, REASONING_STREAM_DELAY_MS));
            }
          }

          // Clear summary phase
          isInSummaryPhase = false;
          summaryBuffer = '';
        }

        // Run verification if tools were executed this session
        if (hasExecutedTools && !this.options.dryRun) {
          const verificationSummary = await this.runVerification(changedFiles);
          finalResponse += verificationSummary;
        }

        break;
      }

      // Emit 'code-writing' phase when we have tools to execute
      if (toolUses.length > 0 && callbacks?.onPhase) {
        // Add delay before showing "Writing code..." for natural pacing
        await new Promise((resolve) => setTimeout(resolve, 600));
        callbacks.onPhase('code-writing');
      }

      // Mark that we're executing tools so next iteration can emit 'completed'
      if (toolUses.length > 0) {
        justExecutedTools = true;
        hasExecutedTools = true;
      }

      // Execute tools (dry run if specified)
      let toolResults: ToolResult[];
      if (this.options.dryRun) {
        toolResults = toolUses.map((tu: ToolUse) => ({
          type: 'tool_result' as const,
          tool_use_id: tu.id,
          content: `[DRY RUN] Would execute: ${tu.name} with input: ${JSON.stringify(tu.input, null, 2)}`,
        }));
      } else {
        // Track new file operations this turn (for emitting)
        const newFileOpsThisTurn = new Map<string, 'create' | 'edit'>();

        // Emit tool start events and execute tools
        toolResults = [];
        for (const toolUse of toolUses) {
          // Extract file path for file operation tools
          const filePath = (toolUse.input as any)?.path;

          // Track file operations (deduplicate and determine correct operation type)
          if (filePath && (toolUse.name === 'either-write' || toolUse.name === 'either-line-replace')) {
            // Determine operation: 'create' if new file, 'edit' if already exists
            let operation: 'create' | 'edit';
            if (filesCreatedThisRequest.has(filePath)) {
              // File was created earlier in this request, so this is an edit
              operation = 'edit';
            } else if (toolUse.name === 'either-write') {
              // either-write creates a new file
              operation = 'create';
              filesCreatedThisRequest.add(filePath);
            } else {
              // either-line-replace edits existing file
              operation = 'edit';
            }

            // Only track if not already emitted in this request
            if (!fileOpsThisRequest.has(filePath)) {
              fileOpsThisRequest.set(filePath, operation);
              newFileOpsThisTurn.set(filePath, operation);

              // Emit "Creating..." or "Editing..." message before execution
              if (callbacks?.onFileOperation) {
                await new Promise((resolve) => setTimeout(resolve, 200)); // Delay between file operations
                const progressiveState: 'creating' | 'editing' = operation === 'create' ? 'creating' : 'editing';
                callbacks.onFileOperation(progressiveState, filePath);
              }
            }
          }

          // Emit tool start (hidden for file operations, shown for others)
          if (callbacks?.onToolStart && !filePath) {
            callbacks.onToolStart({
              name: toolUse.name,
              toolUseId: toolUse.id,
              filePath,
            });
          }

          // Execute single tool
          const result = await this.toolRunner.executeTools([toolUse]);
          toolResults.push(...result);

          // Emit "Created" or "Edited" message after execution (only for new operations)
          if (filePath && newFileOpsThisTurn.has(filePath)) {
            if (callbacks?.onFileOperation) {
              await new Promise((resolve) => setTimeout(resolve, 300)); // Delay before completion message
              const operation = newFileOpsThisTurn.get(filePath);
              const completedState: 'created' | 'edited' = operation === 'create' ? 'created' : 'edited';
              callbacks.onFileOperation(completedState, filePath);
            }
          }

          // Emit tool end (hidden for file operations, shown for others)
          if (callbacks?.onToolEnd && !filePath) {
            callbacks.onToolEnd({
              name: toolUse.name,
              toolUseId: toolUse.id,
              filePath,
            });
          }
        }

        hasExecutedTools = true;

        // Track changed files and collect created file paths
        const createdFilesThisTurn = new Set<string>();
        for (const result of toolResults) {
          const metadata = (result as any).metadata;
          if (metadata?.path && !result.is_error) {
            changedFiles.add(metadata.path);
            createdFilesThisTurn.add(metadata.path);
          }
        }

        // Check for missing file references in newly created HTML files
        const missingRefs = await this.checkMissingFileReferences(toolUses, createdFilesThisTurn, toolResults);
        if (missingRefs.length > 0) {
          // Add warning to the last tool result to inform the agent
          const warningMessage = `\n\n⚠️ WARNING: Missing file references detected:\n${missingRefs.map((ref) => `  - ${ref.htmlFile} references <${ref.tag} ${ref.attr}="${ref.file}"> but ${ref.file} was not created`).join('\n')}\n\nYou MUST create these files in your next response to make the app functional.`;

          // Append warning to the last tool result
          if (toolResults.length > 0) {
            const lastResult = toolResults[toolResults.length - 1];
            lastResult.content = (lastResult.content || '') + warningMessage;
            console.warn('[Agent]' + warningMessage);
          }
        }
      }

      // Record tool results
      this.recorder.addEntry({
        timestamp: new Date().toISOString(),
        role: 'user',
        content: toolResults,
      });

      // Add tool results to conversation
      this.conversationHistory.push({
        role: 'user',
        content: toolResults,
      });

      // If stop reason was end_turn, continue conversation
      if (response.stopReason === 'end_turn') {
        continue;
      }
    }

    // End transcript
    this.recorder.endTranscript(transcriptId, finalResponse);

    // Emit completed phase (only at the very end, after all turns)
    if (callbacks?.onPhase) {
      callbacks.onPhase('completed');
    }

    // Emit completion with token usage
    if (callbacks?.onComplete) {
      callbacks.onComplete({
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      });
    }

    return finalResponse;
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Reset conversation
   */
  reset(): void {
    this.conversationHistory = [];
    this.toolRunner.clearCache();
  }

  /**
   * Save transcript to disk
   */
  async saveTranscript(): Promise<void> {
    await this.recorder.saveCurrentTranscript();
  }

  /**
   * Set database context for file operations
   */
  setDatabaseContext(fileStore: any, appId: string, sessionId?: string, db?: any): void {
    this.toolRunner.setDatabaseContext(fileStore, appId, sessionId, db);
  }

  /**
   * Run verification and create summary
   */
  private async runVerification(changedFiles: Set<string>): Promise<string> {
    const verifier = new VerifierRunner(this.options.workingDir);

    // Create change summary
    const changeSummary = this.createChangeSummary(changedFiles);

    // Run verification
    const verifyResult = await verifier.run();
    const verifySummary = VerifierRunner.formatSummary(verifyResult);

    // Get metrics summary
    const metrics = this.toolRunner.getMetrics();
    const metricsSummary = metrics.getSummaryString();

    return `\n\n---\n${changeSummary}${verifySummary}\n\n**Metrics:**\n${metricsSummary}`;
  }

  /**
   * Create a summary of changed files
   */
  private createChangeSummary(changedFiles: Set<string>): string {
    if (changedFiles.size === 0) {
      return '';
    }

    const files = Array.from(changedFiles).sort();
    const summary =
      files.length === 1
        ? `**Changed:** ${files[0]}\n`
        : `**Changed (${files.length} files):**\n${files.map((f) => `  - ${f}`).join('\n')}\n`;

    return summary;
  }

  /**
   * Validate conversation history format and content
   * Prevents API errors by ensuring all messages follow Claude API requirements
   */
  private validateConversationHistory(): void {
    this.conversationHistory.forEach((msg, idx) => {
      // Validate that content is always an array (Claude API requirement)
      if (!Array.isArray(msg.content)) {
        console.error(`\n❌ CONVERSATION HISTORY VALIDATION ERROR:`);
        console.error(`   Message [${idx}] (role: ${msg.role}) has non-array content`);
        console.error(`   Content type: ${typeof msg.content}`);
        console.error(`   Content value:`, msg.content);
        console.error(`\n   Claude API requires content to be an array of content blocks.`);
        console.error('');

        throw new Error(
          `Conversation history validation failed: ` +
            `Message ${idx} has invalid content format (expected array, got ${typeof msg.content}). ` +
            `This will cause Claude API to reject the request with "Input should be a valid list" error.`,
        );
      }

      // Validate that content array is not empty (except for optional final assistant message)
      if (msg.content.length === 0) {
        const isFinalAssistant = idx === this.conversationHistory.length - 1 && msg.role === 'assistant';
        if (!isFinalAssistant) {
          console.error(`\n❌ CONVERSATION HISTORY VALIDATION ERROR:`);
          console.error(`   Message [${idx}] (role: ${msg.role}) has empty content array`);
          console.error(`\n   Claude API requires all messages to have non-empty content,`);
          console.error(`   except for the optional final assistant message.`);
          console.error('');

          throw new Error(
            `Conversation history validation failed: ` +
              `Message ${idx} has empty content array. ` +
              `This will cause Claude API to reject the request with "all messages must have non-empty content" error.`,
          );
        }
      }

      // Validate server_tool_use blocks are properly paired with web_search_tool_result
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        const serverToolUses = msg.content.filter((b: any) => b.type === 'server_tool_use');
        const webSearchResults = msg.content.filter((b: any) => b.type === 'web_search_tool_result');

        if (serverToolUses.length > 0) {
          console.log(`\n[DEBUG] Message [${idx}] validation:`);
          console.log(`  server_tool_uses: ${serverToolUses.length}`);
          console.log(`  web_search_tool_results: ${webSearchResults.length}`);
          console.log(`  All blocks in message:`);
          msg.content.forEach((block: any, blockIdx: number) => {
            console.log(
              `    [${blockIdx}] ${block.type}${block.id ? ` (id: ${block.id})` : ''}${block.tool_use_id ? ` (tool_use_id: ${block.tool_use_id})` : ''}`,
            );
          });

          // Verify each server_tool_use has a corresponding web_search_tool_result
          serverToolUses.forEach((stu: any) => {
            const hasMatchingResult = webSearchResults.some((wsr: any) => wsr.tool_use_id === stu.id);

            if (!hasMatchingResult) {
              console.error(
                `\n⚠️  WARNING: Message [${idx}] has server_tool_use (${stu.id}) without web_search_tool_result`,
              );
              console.error(`   This might cause issues, but continuing anyway for debugging...`);
              console.error('');

              // Temporarily disable throwing - just log the warning
              // throw new Error(
              //   `Conversation history validation failed: ` +
              //   `Message ${idx} has server_tool_use "${stu.name}" (${stu.id}) ` +
              //   `without corresponding web_search_tool_result. ` +
              //   `This indicates a bug in the streaming or content block handling.`
              // );
            }
          });
        }
      }
    });
  }

  /**
   * Injects `either-view` reads before any write/edit tool calls that lack a
   * preceding read for the same `path` within the same assistant turn.
   * Also returns the final list of tool_uses to execute (in order).
   */
  private injectReadBeforeWriteBlocks(contentBlocks: any[]): { contentBlocks: any[]; toolUses: ToolUse[] } {
    const out: any[] = [];
    const toolUsesCollected: ToolUse[] = [];
    const seenReadForPath = new Set<string>();

    const pushAndCollect = (blk: any) => {
      out.push(blk);
      if (blk && blk.type === 'tool_use') {
        toolUsesCollected.push({
          type: 'tool_use',
          id: blk.id,
          name: blk.name,
          input: blk.input,
        });
      }
    };

    for (const blk of contentBlocks) {
      // Track explicit reads
      if (blk?.type === 'tool_use' && blk.name === Agent.READ_TOOL) {
        const path = blk.input?.path;
        if (typeof path === 'string' && path.length > 0) {
          seenReadForPath.add(path);
        }
        pushAndCollect(blk);
        continue;
      }

      // Before either-line-replace (EDIT), ensure we've read the target file
      // NO injection for either-write (CREATE) - it handles file existence checks internally
      if (blk?.type === 'tool_use' && blk.name === 'either-line-replace') {
        const path = blk.input?.path;

        if (typeof path === 'string' && path.length > 0 && !seenReadForPath.has(path)) {
          // Inject a synthetic read tool_use directly before the edit
          const injectedId = `enforcer-view-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          const injected = {
            type: 'tool_use',
            id: injectedId,
            name: Agent.READ_TOOL,
            input: { path },
          };
          pushAndCollect(injected);
          seenReadForPath.add(path);
        }

        // Optionally annotate missing needle (soft warning)
        if (!blk.input?.needle) {
          blk.input = {
            ...blk.input,
            _enforcerWarning: 'No `needle` provided; injected a read to reduce risk.',
          };
        }

        pushAndCollect(blk);
        continue;
      }

      // For eithergen--generate_image or other WRITE tools, no read injection needed
      if (blk?.type === 'tool_use' && Agent.WRITE_TOOLS.has(blk.name)) {
        pushAndCollect(blk);
        continue;
      }

      // passthrough others
      pushAndCollect(blk);
    }

    // Only return *tool_use* blocks as executable tool uses, in order
    const executableToolUses = toolUsesCollected.filter((b: any) => b.type === 'tool_use') as ToolUse[];
    return { contentBlocks: out, toolUses: executableToolUses };
  }

  /**
   * Check for missing file references in newly created files
   * Detects:
   * - HTML: <script src="..."> and <link href="..."> that reference non-existent files
   * - React: import statements that reference non-existent components
   */
  private async checkMissingFileReferences(
    toolUses: ToolUse[],
    createdFiles: Set<string>,
    toolResults: ToolResult[],
  ): Promise<Array<{ htmlFile: string; tag: string; attr: string; file: string }>> {
    const missing: Array<{ htmlFile: string; tag: string; attr: string; file: string }> = [];

    // Check HTML files for script/link references
    const htmlWrites = toolUses.filter(
      (tu) =>
        (tu.name === 'either-write' || tu.name === 'either-line-replace') &&
        tu.input?.path?.toLowerCase().endsWith('.html'),
    );

    for (const htmlWrite of htmlWrites) {
      const htmlPath = htmlWrite.input?.path;
      if (!htmlPath) continue;

      const resultIdx = toolUses.indexOf(htmlWrite);
      const result = toolResults[resultIdx];
      if (!result || result.is_error) continue;

      const htmlContent = htmlWrite.name === 'either-write' ? htmlWrite.input?.content : null;

      if (!htmlContent || typeof htmlContent !== 'string') continue;

      // Extract script and link references using simple regex
      const scriptMatches = htmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
      for (const match of scriptMatches) {
        const scriptPath = match[1];
        const normalizedPath = scriptPath.replace(/^\.?\//, '');
        if (!createdFiles.has(normalizedPath) && !createdFiles.has(scriptPath)) {
          missing.push({
            htmlFile: htmlPath,
            tag: 'script',
            attr: 'src',
            file: scriptPath,
          });
        }
      }

      const linkMatches = htmlContent.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi);
      for (const match of linkMatches) {
        const fullTag = match[0];
        if (fullTag.includes('stylesheet')) {
          const linkPath = match[1];
          const normalizedPath = linkPath.replace(/^\.?\//, '');
          if (!createdFiles.has(normalizedPath) && !createdFiles.has(linkPath)) {
            missing.push({
              htmlFile: htmlPath,
              tag: 'link',
              attr: 'href',
              file: linkPath,
            });
          }
        }
      }
    }

    // Check React/JSX/TSX files for import statements
    const reactWrites = toolUses.filter(
      (tu) =>
        (tu.name === 'either-write' || tu.name === 'either-line-replace') &&
        (tu.input?.path?.endsWith('.jsx') ||
          tu.input?.path?.endsWith('.tsx') ||
          tu.input?.path?.endsWith('.js') ||
          tu.input?.path?.endsWith('.ts')),
    );

    for (const reactWrite of reactWrites) {
      const filePath = reactWrite.input?.path;
      if (!filePath) continue;

      const resultIdx = toolUses.indexOf(reactWrite);
      const result = toolResults[resultIdx];
      if (!result || result.is_error) continue;

      const content = reactWrite.name === 'either-write' ? reactWrite.input?.content : null;

      if (!content || typeof content !== 'string') continue;

      // Extract import statements: import ... from './path'
      const importMatches = content.matchAll(
        /import\s+(?:(?:\{[^}]+\}|[\w]+)(?:\s*,\s*(?:\{[^}]+\}|[\w]+))*)\s+from\s+['"]([^'"]+)['"]/g,
      );

      for (const match of importMatches) {
        const importPath = match[1];

        // Skip node_modules and external packages (e.g., 'react', '@vitejs/plugin-react')
        if (!importPath.startsWith('.')) continue;

        // Normalize path (remove leading ./)
        let normalizedPath = importPath.replace(/^\.\//, '');

        // Check multiple possible file paths (with/without extensions, index files)
        const possiblePaths = [
          normalizedPath,
          `${normalizedPath}.jsx`,
          `${normalizedPath}.tsx`,
          `${normalizedPath}.js`,
          `${normalizedPath}.ts`,
          `${normalizedPath}/index.jsx`,
          `${normalizedPath}/index.tsx`,
          `${normalizedPath}/index.js`,
          `${normalizedPath}/index.ts`,
        ];

        // Also check paths relative to src/ directory
        const srcPaths = possiblePaths.map((p) => `src/${p}`);

        // Check if any of the possible paths exist in createdFiles
        const exists = [...possiblePaths, ...srcPaths].some(
          (p) => createdFiles.has(p) || createdFiles.has(`./${p}`) || createdFiles.has(`/${p}`),
        );

        if (!exists) {
          missing.push({
            htmlFile: filePath,
            tag: 'import',
            attr: 'from',
            file: importPath,
          });
        }
      }
    }

    return missing;
  }
}
