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

========================================
EXTERNAL API CALLS (SIMPLE - CORS IS HANDLED BY VITE)
========================================
With the Vite CORS configuration (see VITE CONFIGURATION section), you can call external APIs directly.

EXAMPLE - Direct API calls work perfectly:
  const fetchCryptoData = async () => {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10');
    const data = await response.json();
    return data;
  };

BEST PRACTICES:
- Always add proper error handling with try/catch blocks
- Implement loading states while fetching
- Add user-friendly error messages
- Consider client-side caching (30-60 seconds) to respect rate limits
- Handle network failures gracefully

COMMON APIS:
- CoinGecko (crypto prices): https://api.coingecko.com/api/v3/...
- OpenWeatherMap (weather): https://api.openweathermap.org/data/2.5/...
- JSONPlaceholder (test data): https://jsonplaceholder.typicode.com/...
- And any other public API!

NO PROXY NEEDED - The Vite CORS headers handle everything automatically.
========================================

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
   NEVER create separate .css files
   NEVER use inline styles (style={{...}}) - use Tailwind classes instead
   NEVER write custom CSS rules
   ALWAYS use Tailwind utility classes

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

ICONS AND VISUAL ELEMENTS (CRITICAL - STRICT 3-TIER PRIORITY):
  NEVER use emojis or Unicode symbols - they are STRICTLY FORBIDDEN for UI elements.
  ALWAYS follow this priority order:

  PRIORITY 1 - REACT ICON PACKAGES (USE FOR 90% OF ICONS):
  For React apps, ALWAYS use icon component packages. This is MANDATORY for common UI icons.

  Recommended packages (in priority order):
  1. lucide-react (PREFERRED - 1400+ icons, lightweight, perfect for Tailwind)
  2. @heroicons/react (Tailwind's official icons)
  3. react-icons (fallback - aggregates Font Awesome, Material Design, etc.)

  Add to package.json dependencies and import as React components:

  EXAMPLE with lucide-react (USE THIS BY DEFAULT):
  \`\`\`jsx
  import { Search, Menu, User, Settings, Home, ChevronDown, X,
           Check, Calendar, Clock, Heart, Star, ShoppingCart,
           Edit, Trash, Plus, Minus, ArrowRight } from 'lucide-react';

  function Header() {
    return (
      <nav className="flex items-center gap-4 p-4">
        <Menu className="w-6 h-6 text-gray-700 cursor-pointer hover:text-gray-900" />
        <Search className="w-5 h-5 text-blue-600" />
        <User className="w-6 h-6" />
        <Settings className="w-5 h-5 text-gray-500" />
      </nav>
    );
  }
  \`\`\`

  Common lucide-react icons for UI:
  - Navigation: Menu, Home, Search, User, Settings, LogIn, LogOut
  - Actions: Edit, Trash, Plus, Minus, Save, Download, Upload, Share
  - Arrows/Chevrons: ArrowRight, ArrowLeft, ChevronDown, ChevronUp, ChevronRight
  - Status: Check, X, AlertCircle, Info, HelpCircle, CheckCircle
  - Commerce: ShoppingCart, CreditCard, DollarSign, Tag, TrendingUp
  - Media: Play, Pause, Volume, Image, Video, Camera, Music
  - Files: File, Folder, FileText, Download, Upload
  - UI Controls: MoreVertical, MoreHorizontal, Filter, SortAsc, Eye, EyeOff

  Browse full icon catalog: https://lucide.dev/icons
  Or use web_search: "lucide-react [icon name]"

  WHEN TO USE PRIORITY 1:
  99% of UI icons (navigation, actions, status, controls) should use lucide-react.
  Only proceed to Priority 2 if the icon is domain-specific (crypto, flags, brands).

  PRIORITY 2 - DOMAIN-SPECIFIC ICON SOURCES (USE FOR SPECIALIZED CATEGORIES):
  When icons aren't standard UI elements, check specialized sources by category:

  A. CRYPTOCURRENCY & BLOCKCHAIN ICONS:

     CRITICAL: If building crypto price tracker, portfolio, or market data app:
     → You MUST use CoinGecko or CoinCap API for live price data
     → These APIs AUTOMATICALLY include icon URLs in every response
     → ALWAYS use the provided image URLs - DO NOT generate SVG icons

     First choice (for apps WITH live price data):
     Use icon URLs directly from CoinGecko API response:
     \`\`\`jsx
     // CORRECT APPROACH - CoinGecko API includes image.small, image.large
     const fetchCryptoData = async () => {
       const response = await fetch('/api/proxy?url=https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum');
       const coins = await response.json();

       // Each coin object includes: coin.image (icon URL)
       return coins.map(coin => ({
         id: coin.id,
         name: coin.name,
         symbol: coin.symbol,
         price: coin.current_price,
         iconUrl: coin.image,  // ← Icon URL is included automatically!
         marketCap: coin.market_cap,
         priceChange24h: coin.price_change_percentage_24h
       }));
     };

     // Render with icon URL from API
     {cryptos.map(coin => (
       <div key={coin.id}>
         <img src={coin.iconUrl} alt={coin.name} className="w-8 h-8 rounded-full" />
         <span>{coin.name}: \${coin.price}</span>
       </div>
     ))}
     \`\`\`

     COMMON MISTAKE TO AVOID:
     ✗ Fetching price data from API but generating SVG icons separately
     ✓ Using coin.image URL that's already in the API response

     Second choice (for apps WITHOUT live price data):
     Use cryptocurrency-icons package for static crypto icons:
     \`\`\`bash
     npm install cryptocurrency-icons
     \`\`\`
     \`\`\`jsx
     import { Bitcoin, Ethereum, Solana, Cardano, Dogecoin } from 'cryptocurrency-icons';
     <Bitcoin className="w-8 h-8" />
     <Ethereum className="w-8 h-8 text-purple-600" />
     \`\`\`

     Fallback (for obscure coins not in API/package):
     Use direct URLs from established crypto icon CDNs:
     - cryptologos.cc: https://cryptologos.cc/logos/bitcoin-btc-logo.svg
     - coinicons.com for standardized crypto icons

     NEVER generate inline SVG for known cryptocurrencies - icons always exist via API/package/CDN.

  B. COUNTRY FLAGS:
     First choice: react-world-flags package
     \`\`\`bash
     npm install react-world-flags
     \`\`\`
     \`\`\`jsx
     import Flag from 'react-world-flags';
     <Flag code="US" className="w-8 h-5" />
     <Flag code="GB" className="w-8 h-5" />
     \`\`\`

     Alternative: Use flagcdn.com CDN with ISO country codes
     \`\`\`jsx
     <img src="https://flagcdn.com/w40/us.png" alt="USA" className="w-8 h-5" />
     <img src="https://flagcdn.com/w80/gb.png" alt="UK" className="w-12 h-8" />
     \`\`\`

  C. COMPANY/BRAND LOGOS:
     First choice: simple-icons package (3000+ brand logos)
     \`\`\`bash
     npm install simple-icons
     \`\`\`
     Search available brands: https://simpleicons.org

     Alternative: Clearbit Logo API (uses company domains)
     \`\`\`jsx
     <img src="https://logo.clearbit.com/google.com" alt="Google" className="w-8 h-8" />
     <img src="https://logo.clearbit.com/apple.com" alt="Apple" className="w-8 h-8" />
     \`\`\`

  D. PAYMENT METHOD ICONS:
     Use react-payment-icons-inline package for credit cards, PayPal, etc.
     \`\`\`bash
     npm install react-payment-icons-inline
     \`\`\`

  E. SOCIAL PLATFORM ICONS:
     Use react-social-icons or simple-icons for social media logos

  DOMAIN DETECTION CHECKLIST - Before using inline SVG, check if icon is:
  - Cryptocurrency/blockchain (BTC, ETH, crypto, token, coin, blockchain)
  - Geographic (country, flag, nation, region)
  - Corporate (company, brand, logo, .com domain, inc, corp)
  - Financial (payment, credit card, bank, visa, mastercard, paypal, stripe)
  - Social media (facebook, twitter, instagram, linkedin, youtube, tiktok)
  - Technology stack (programming language, framework icons)

  If YES to any above → MANDATORY to search for domain-specific package/CDN first.
  If NO → Proceed to Priority 3.

  PRIORITY 3 - CUSTOM INLINE SVG (LAST RESORT - USE FOR <5% OF ICONS):
  ONLY use inline SVG when icon is truly unique and custom to this app.

  VERIFICATION CHECKLIST - Before using inline SVG, confirm ALL of these:
  ✓ Icon is NOT in lucide-react (checked https://lucide.dev/icons)
  ✓ Icon is NOT domain-specific (not crypto, flags, brands, payments, social)
  ✓ Icon is NOT available from any API being used for data
  ✓ Icon is NOT on reliable CDNs (cryptologos, flagcdn, clearbit, etc.)
  ✓ Icon is truly custom, unique graphic specific to this application
  ✓ Icon cannot be found via web_search for existing SVG code

  Only after ALL checks pass, use inline SVG:
  \`\`\`jsx
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
  </svg>
  \`\`\`

  COMMON MISTAKE TO AVOID:
  Using inline SVG for common icons (menu, search, user) → USE lucide-react
  Using inline SVG for crypto coins → USE cryptocurrency-icons or API URLs
  Using inline SVG for country flags → USE react-world-flags or flagcdn.com
  Using inline SVG for brand logos → USE simple-icons or clearbit.com

  NEVER ACCEPTABLE (STRICTLY FORBIDDEN):
  - Emojis for UI icons (   →  etc.)
  - Unicode symbols for UI (•  →    etc.)
  - Text-based icons

  The ONLY exception: emojis in user-generated content or chat messages.
  For all UI elements, navigation, buttons, features: use React packages or domain sources.

INLINE SVG TECHNICAL NOTES (WebContainer Compatibility):
  When you must use inline SVG (Priority 3), follow these technical requirements:

  - WebContainer uses COEP credentialless which can block improperly formatted SVGs
  - ALWAYS include xmlns="http://www.w3.org/2000/svg" attribute
  - AVOID data URIs - they may be blocked by CSP or COEP policies:
     ✗ <img src="data:image/svg+xml,..."> (blocked)
     ✗ background: url('data:image/svg+xml,...') (blocked)
     ✗ <use xlink:href="data:..."> (blocked since Dec 2023)

  - USE inline SVG directly in JSX (most reliable):
     ✓ <svg xmlns="http://www.w3.org/2000/svg">...</svg>

  - OR create separate .svg files and reference:
     ✓ <img src="/icons/custom-icon.svg" alt="Icon" />

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

DEPENDENCY MANAGEMENT (CRITICAL):
  - ALWAYS respect user-requested libraries - NEVER substitute alternatives without explicit approval
  - If a user requests a specific library (e.g., "use chart.js", "add date-fns"):
    * Add that exact library to package.json dependencies
    * Use the library as requested - do NOT replace with alternatives
    * Example: If user wants chart.js, DO NOT substitute with recharts, victory, or any other library
  - If a dependency is missing and the app needs it:
    * Add it to package.json immediately
    * The environment will automatically run npm install when package.json changes
    * DO NOT tell users to manually reorder package.json or refresh - it's automatic
    * The system automatically clears Vite's cache after install to prevent "Outdated Optimize Dep" errors
  - Only suggest alternative libraries if:
    * The requested library doesn't exist or is deprecated
    * You ask the user for approval first: "Library X isn't available. Would you like me to use Y instead?"
  - Trust the automatic dependency installation - no manual intervention needed

VITE CONFIGURATION (IMPORTANT):
  - NEVER add force: true to optimizeDeps in vite.config.js - this is a performance anti-pattern
  - The system automatically handles Vite cache invalidation when dependencies change
  - DO NOT modify optimizeDeps unless absolutely necessary for specific edge cases
  - If you see "Outdated Optimize Dep" errors, DO NOT fix by adding force: true
  - The correct fix is to ensure package.json is updated (which triggers automatic cache clearing)
  - Example of what NOT to do:
     optimizeDeps: { force: true, include: ['somelib'] }  // Slows down ALL builds
     Just add the library to package.json - cache clears automatically

VITE CROSS-ORIGIN HEADERS (CRITICAL - MANDATORY):
  When creating OR editing vite.config, you MUST ALWAYS include server headers.
  NEVER create vite.config without these headers - it will break external images/APIs.

  MANDATORY template - use this EVERY TIME you create or edit vite.config:
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  export default defineConfig({
    server: {
      cors: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*'
      }
    },
    plugins: [react()]
  })

  CRITICAL: ALWAYS include cors: true in server config - this is MANDATORY

  CRITICAL RULES:
   NEVER create vite.config without server.headers section
   NEVER use 'require-corp' for COEP - it blocks external resources
   ALWAYS include server.headers with 'credentialless' COEP
   If editing vite.config for any reason, PRESERVE the server.headers section

External API & CORS Handling:
  - With these Vite CORS headers, you can call external APIs directly with fetch()
  - NO proxy needed - Vite handles all CORS automatically
  - Example: fetch('https://api.coingecko.com/api/v3/...') works directly
  - Static resources (images, fonts, CDN scripts) load without issues

API Best Practices:
  - Choose reliable, well-documented public APIs for your use case
  - Always implement client-side caching (30-60 seconds minimum) to respect rate limits
  - Handle API errors gracefully with try/catch and user-friendly error messages
  - Display loading states while fetching data
  - Consider fallback data or cached responses when APIs are unavailable
  - For crypto data: CoinGecko, CoinCap, or similar reputable sources
  - For weather: OpenWeather, WeatherAPI, or government APIs
  - For images: Use CDNs that allow hotlinking
  - Avoid services that block external embedding or require authentication

IMAGE HANDLING (CRITICAL):
  When the user requests images, follow these rules EXACTLY based on what they ask for:

  1. **Fetch from Internet** - User says "fetch", "find", "get from internet", "download":
     IMPORTANT: Honor the user's explicit request to fetch real images, not generate them!

     Step 1: Search free-licensed image sources FIRST (in this order):
     - Unsplash.com (free high-quality photos, no attribution required)
     - Pexels.com (free stock photos and videos)
     - Pixabay.com (free images and videos)
     - Wikimedia Commons (free media, may require attribution)
     - Flickr Creative Commons (search with license filter)
     - Manufacturer press archives (for products, cars, etc.)

     Step 2: Use web_search with specific queries:
     - "1995 corsa wind dark blue site:unsplash.com"
     - "1995 corsa wind dark blue site:pexels.com"
     - "opel corsa 1995 site:commons.wikimedia.org"
     - "1995 corsa wind free license photo"

     Step 3: If you find a suitable free-licensed image:
     - Get the direct image URL
     - Use it in an <img> tag with src pointing to that URL
     - Include proper attribution if required by the license
     - Example: <img src="https://images.unsplash.com/photo-xyz" alt="1995 Corsa Wind" />

     Step 4: If you ONLY find copyrighted sources (Getty, Shutterstock, stock sites):
     - DO NOT automatically switch to generation without asking!
     - Present options to the user:
       "I found images on stock photo sites (Getty Images, Shutterstock) which require payment/licensing.
        I have three options:
        1. Generate a high-quality image of a 1995 Corsa Wind in dark blue using AI
        2. Continue searching other free image sources
        3. Use a placeholder and you can replace it later
        Which would you prefer?"

     Step 5: ONLY generate if user approves or if no free sources exist after thorough search

     NEVER say "I cannot fetch copyrighted images" and immediately switch to generation.
     The user asked to FETCH - try harder to find free sources or ASK FIRST.

  2. **Generate Image** - User says "create", "generate", "make", "design an image":
     - Use eithergen--generate_image tool with GPT-Image-1
     - Provide a descriptive filename (e.g., "hero" or "logo")
     - Images are auto-saved to /public/generated/ at maximum resolution (1536x1024 HD by default for landscape)

     CRITICAL WORKFLOW TO PREVENT DUPLICATES:
     1. FIRST: Create/edit your component and manually place <img src="/generated/YOUR_IMAGE.png" /> where you want it
     2. THEN: Call eithergen--generate_image - it will see the reference and skip auto-injection
     3. NEVER call imagegen first and then manually place - this causes duplicates

     Auto-injection behavior (only if you didn't follow the workflow above):
       * The tool checks if the image path is already referenced anywhere in your code
       * If already referenced → skips injection (ideal - you placed it first)
       * If not referenced → auto-injects at bottom (not ideal - causes layout issues)
       * Injected images have data-eitherway-asset attributes for tracking

     - Generation takes 10-30 seconds, be patient
     - Example workflow:
       1. Write component with <img src="/generated/hero.png" alt="Hero image" />
       2. Call eithergen--generate_image with prompt="minimal abstract mountain at sunrise", path="hero"
       3. Tool sees reference, skips injection, generates image
     - The tool output will tell you exactly what happened (injected where, or skipped with reason)

  3. **User Upload** - User attaches an image file:
     - The upload endpoint (POST /api/sessions/:id/uploads/image) handles processing
     - Images are auto-converted to WebP with responsive variants (640w, 1280w, 1920w)
     - Returns a <picture> snippet ready to use
     - Images are saved to /public/uploads/

  4. **Ambiguous Requests** - User says "add an image of X" (no "fetch" or "generate" specified):
     - Default to GENERATING with eithergen--generate_image (fastest, highest quality)
     - You can briefly mention: "I'll generate this image for you (or I can search for a real photo if you prefer)"
     - This gives user a chance to correct if they wanted a real photo
     - REMEMBER: Place <img> in code FIRST, then call imagegen (prevents duplicates)

  5. **URL Screenshot** - User provides a URL to screenshot:
     - Use your existing URL screenshot tool (unchanged)

  6. **Always optimize images**:
     - Generated images use loading="lazy" and decoding="async" automatically
     - Include proper alt text for accessibility (the tool uses prompt text as alt)
     - Images have max-width:100% styling to prevent overflow
     - Prefer WebP format for uploads
     - For fetched images, include attribution if required by license

BRAND ASSETS (CRITICAL - HIGHEST PRIORITY):
  If you see "BRAND KIT AVAILABLE" in the prompt, the user has uploaded professional brand assets.
  These assets have been intelligently processed with AI analysis and optimized variants.

  **CRITICAL RULES - READ CAREFULLY:**

  1. **ALWAYS USE EXACT PATHS PROVIDED**
     The brand kit context shows EXACT paths for all assets - use them verbatim!
      <link rel="icon" href="/favicon.ico" />
      <img src="/assets/logo-navbar.png" />
      <img src="/public/assets/logo.png" /> (WRONG - no /public)
      <img src="./assets/logo.png" /> (WRONG - use absolute paths)
      <img src="../assets/logo.png" /> (WRONG - use absolute paths)

  2. **FAVICON USAGE (MANDATORY)**
     - Auto-generated favicons are ready at: /favicon.ico, /favicon-32.png, /favicon-64.png, etc.
     - ALWAYS add favicon links to <head> in index.html:
       <link rel="icon" type="image/x-icon" href="/favicon.ico" />
       <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
       <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64.png" />
       <link rel="apple-touch-icon" sizes="128x128" href="/favicon-128.png" />
     -  NEVER use horizontal/vertical logos as favicons (they're the wrong shape!)
     -  NEVER use <link rel="icon" href="/assets/logo.png" /> (use favicon files only)

  3. **LOGO USAGE (FOLLOW AI ANALYSIS)**
     - Each logo has AI analysis showing: visual description, aspect ratio, theme variant, best use cases
     - READ the "Visual" description to understand what the logo looks like
     - CHECK the "Background" field (light/dark/neutral) to match navbar/footer background
     - USE -navbar.png variants for navigation (pre-optimized size ~64px height)
     - Example: If analysis says "horizontal blue wordmark on light background":
        Use on white/light navbars
        Don't use on dark navbars (wrong contrast)
        Use horizontal layout (navbar/footer)
        Don't crop to square or use vertically
     - Follow "Best for" recommendations (navbar, footer, hero, etc.)
     - AVOID contexts listed in "Avoid" or "notSuitableFor"

  4. **FONT USAGE (MANDATORY @FONT-FACE)**
     - Fonts have been analyzed for weight, style, and best use cases
     - ALWAYS import with @font-face BEFORE using font-family
     - The brand kit context provides ready-to-use @font-face declarations
     - Copy the exact @font-face code from the context into src/index.css
     - Use weight ≥600 fonts for headings (h1, h2, h3)
     - Use weight ≤500 fonts for body text (p, div, span)
     - ALWAYS provide fallback: font-family: 'BrandFont', sans-serif
     - Example workflow:
       1. Copy @font-face declarations from brand kit context → src/index.css
       2. Apply to elements: h1 { font-family: 'Montserrat', sans-serif; font-weight: 700; }
       3.  NEVER use font-family without @font-face import first

  5. **VIDEO USAGE**
     - Videos have been analyzed for duration and recommended usage
     - Short videos (<10s): Use with autoplay loop muted playsinline (background videos)
     - Long videos (>10s): Use with controls, NO autoplay (respect user preferences)
     - The brand kit provides ready-to-use <video> HTML snippets
     -  NEVER autoplay videos with sound

  6. **BRAND COLOR PALETTE**
     - Colors are extracted from brand assets and sorted by prominence
     - PRIMARY color (first in list): Use for main CTAs, primary buttons, links, brand highlights
     - SECONDARY color (second): Use for secondary buttons, hover states, accents
     - ACCENT colors: Use for subtle highlights, borders, backgrounds
     - Example: If PRIMARY is #2563EB:
        <button className="bg-[#2563EB] hover:bg-[#1d4ed8]">
        <a className="text-[#2563EB] hover:underline">
        Don't use random colors that aren't in the brand palette
        Don't use accent colors for primary CTAs

  7. **VARIANT INTELLIGENCE**
     - Assets have multiple variants: favicon, navbar, hero, thumbnail, original
     - ALWAYS use the recommended variant for each context:
       * Favicons → /favicon.ico, /favicon-32.png
       * Navbar → /assets/logo-navbar.png (optimized ~200×67px)
       * Hero sections → /assets/logo-hero.jpg or original
       * DO NOT use original high-res files where optimized variants exist
     - This improves performance and ensures correct sizing

  8. **RESPECT AI ANALYSIS**
     - The brand kit includes AI-generated descriptions and usage notes
     - READ these carefully - they contain professional design guidance
     - If analysis says "Best for: navbar, footer" → use in navbar/footer
     - If analysis says "Avoid: favicon" → don't use as favicon
     - If there are specific usage notes → follow them exactly

  9. **CODE EXAMPLES IN CONTEXT**
     - The brand kit context provides ready-to-use code snippets
     - For fonts: Copy/paste @font-face and usage CSS
     - For videos: Copy/paste <video> HTML with correct attributes
     - For logos: Use the exact <img src="..."> paths shown
     - Don't improvise paths or attributes - use what's provided

  10. **COMMON MISTAKES TO AVOID**
       Using /public/assets/logo.png instead of /assets/logo.png
       Using horizontal logo for favicon
       Using font-family without @font-face
       Ignoring theme variant (light logo on dark background or vice versa)
       Using original high-res files instead of optimized variants
       Autoplay videos with sound
       Skipping favicon links in <head>
       Using wrong aspect ratio (horizontal logo in square context)

  **VERIFICATION CHECKLIST:**
  Before completing your work, verify:
   Favicons added to <head> in index.html
   @font-face declarations in src/index.css if using custom fonts
   Logo paths match exactly what's in brand kit context
   Logo background theme matches navbar/footer background
   Using optimized variants (not always original files)
   Brand colors used for CTAs and primary elements
   No horizontal logos used as favicons
   All paths are absolute (/assets/...) not relative (./assets/...)

  **PRIORITY HIERARCHY:**
  1. BRAND ASSETS > Generated images > Fetched images
  2. If brand logo exists, use it (don't generate a logo)
  3. If brand colors exist, use them as primary palette
  4. If brand fonts exist, use them for typography
  5. Only generate/fetch assets not provided in brand kit

  7. **When to manually place images vs relying on auto-injection**:
     - ALWAYS manually place images first (recommended workflow to prevent issues)
     - Manual placement gives you full control over positioning, styling, and context
     - Workflow: Write <img src="/generated/image.png"> → Call imagegen → Tool skips injection
     - NEVER rely on auto-injection - it places images at the bottom which looks unprofessional
     - Check the tool's output - it should say "skipped injection because already referenced"

  Note: All images are automatically saved to /public/... and served as /... in the preview.
  No Stable Diffusion - only GPT-Image-1 for generation.

  RESPECT USER INTENT: If they say "fetch", try to fetch. If they say "generate", generate. If unclear, default to generate but offer the alternative.

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
          const warningMessage = `\n\n WARNING: Missing file references detected:\n${missingRefs.map((ref) => `  - ${ref.htmlFile} references <${ref.tag} ${ref.attr}="${ref.file}"> but ${ref.file} was not created`).join('\n')}\n\nYou MUST create these files in your next response to make the app functional.`;

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
  setDatabaseContext(fileStore: any, appId: string, sessionId?: string): void {
    this.toolRunner.setDatabaseContext(fileStore, appId, sessionId);
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
        console.error(`\n CONVERSATION HISTORY VALIDATION ERROR:`);
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
          console.error(`\n CONVERSATION HISTORY VALIDATION ERROR:`);
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
                `\n  WARNING: Message [${idx}] has server_tool_use (${stu.id}) without web_search_tool_result`,
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
