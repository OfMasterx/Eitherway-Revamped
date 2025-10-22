# Web3 Agent Integration Strategy

**Date:** 2025-10-22
**Status:** Design Phase
**Goal:** Enable the EitherWay agent to build Web3-enabled applications through intent detection

---

## 🎯 Executive Summary

EitherWay is an **AI agent-powered app builder**. The agent (Claude) generates React applications in real-time based on user prompts. To enable Web3 capabilities, we need to:

1. **Teach the agent** about Web3 (extend system prompt)
2. **Give the agent tools** to deploy contracts and generate code
3. **Provide templates** for Web3 app patterns

**Result:** When a user says *"Build me an ERC-20 token marketplace"*, the agent will:
- Detect Web3 intent
- Deploy the smart contract
- Generate typed contract code
- Build a complete React UI with wallet connection
- Create a fully functional Web3 app

---

## 🏗️ Current Architecture

### How EitherWay Works Now

```
User: "Build me a todo app"
  ↓
Agent reads SYSTEM_PROMPT (packages/runtime/src/agent.ts:34)
  ↓
Agent decides to use tools:
  - either-write-file (create new React components)
  - either-line-replace (edit files)
  - either-view (read files)
  ↓
Files are written to PostgreSQL VFS (FileStore)
  ↓
User previews in browser (WebContainer)
  ↓
User deploys to Netlify/Vercel/GitHub
```

### Current Tools Available

**Location:** `packages/tools-impl/src/`

- `either-write.ts` - Create new files
- `either-line-replace.ts` - Edit existing files (line-by-line replacement)
- `either-view.ts` - Read file contents
- `either-search-files.ts` - Search for files/content
- `imagegen.ts` - Generate images with AI

### Current System Prompt Structure

**Location:** `packages/runtime/src/agent.ts:34-500+`

The `SYSTEM_PROMPT` is a ~500 line prompt that instructs the agent on:
- Technology stack (React 18, Vite, Tailwind CSS)
- Completeness requirements (all imports must exist, no partial apps)
- React architecture (functional components, hooks)
- Tailwind CSS patterns
- File structure conventions
- Error handling

---

## 🚀 Web3 Integration Strategy

### Overview

Instead of automatically injecting code during export, we make the **agent itself capable** of building Web3 apps by extending its knowledge and tools.

### Three-Part Integration

#### 1. **Web3 Tools** (New Tools for Agent)

**Location:** `packages/tools-impl/src/`

**New Tool 1: `deploy-smart-contract.ts`**
```typescript
// Tool Definition
{
  "name": "deploy-smart-contract",
  "description": "Deploy an ERC-20 token or ERC-721 NFT to Ethereum testnet",
  "input_schema": {
    "type": "object",
    "properties": {
      "contractType": {
        "type": "string",
        "enum": ["erc20", "erc721"],
        "description": "Type of contract to deploy"
      },
      "name": {
        "type": "string",
        "description": "Contract name (e.g. 'My Token')"
      },
      "symbol": {
        "type": "string",
        "description": "Token symbol (e.g. 'MTK')"
      },
      "totalSupply": {
        "type": "string",
        "description": "Total supply (ERC-20 only)"
      },
      "chainId": {
        "type": "number",
        "enum": [11155111, 84532, 421614],
        "description": "Chain to deploy to (Sepolia, Base, Arbitrum)"
      }
    },
    "required": ["contractType", "name", "symbol"]
  }
}

// Implementation
export async function deploySmartContract(input: DeployInput): Promise<DeployResult> {
  // Call existing API: POST /api/contracts/create-and-deploy
  const response = await fetch('https://localhost:3001/api/contracts/create-and-deploy', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      ...input
    })
  });

  // Return contract ID, address, explorer URL
  return {
    success: true,
    contractId: data.contractId,
    contractAddress: data.data.contractAddress,
    explorerUrl: data.data.explorerUrl
  };
}
```

**New Tool 2: `generate-contract-code.ts`**
```typescript
// Tool Definition
{
  "name": "generate-contract-code",
  "description": "Generate TypeScript/React code for a deployed smart contract",
  "input_schema": {
    "type": "object",
    "properties": {
      "contractId": {
        "type": "string",
        "description": "Contract ID from deploy-smart-contract"
      }
    },
    "required": ["contractId"]
  }
}

// Implementation
export async function generateContractCode(contractId: string): Promise<GeneratedFiles> {
  // Call existing API: GET /api/contracts/:id/generate-code
  const response = await fetch(`https://localhost:3001/api/contracts/${contractId}/generate-code`);

  // Returns 5 files:
  // - ABI file
  // - Addresses file
  // - Hooks file
  // - Component file
  // - Wagmi config file
  return {
    files: {
      abiFile: { filename: 'MyToken.abi.ts', content: '...' },
      addressesFile: { filename: 'MyToken.addresses.ts', content: '...' },
      hooksFile: { filename: 'useMyToken.ts', content: '...' },
      componentFile: { filename: 'MyTokenPanel.tsx', content: '...' },
      wagmiConfigFile: { filename: 'wagmi.config.ts', content: '...' }
    }
  };
}
```

#### 2. **System Prompt Extension** (Web3 Knowledge)

**Location:** `packages/runtime/src/agent.ts:34`

**Add after existing prompt sections:**

```markdown
WEB3 & SMART CONTRACT CAPABILITIES:
  - You can deploy ERC-20 tokens and ERC-721 NFTs to Ethereum testnets
  - When user requests blockchain/Web3 functionality, follow the Web3 workflow
  - Use deploy-smart-contract and generate-contract-code tools

WEB3 INTENT DETECTION:
  Recognize these keywords as Web3 requests:
  - "token", "ERC-20", "cryptocurrency", "coin"
  - "NFT", "ERC-721", "collectible", "non-fungible"
  - "smart contract", "blockchain", "Ethereum", "Web3"
  - "mint", "transfer", "wallet", "MetaMask"
  - "DeFi", "dApp", "decentralized"

WEB3 WORKFLOW (CRITICAL):
  When user requests a Web3 app, follow these steps IN ORDER:

  STEP 1: Deploy Smart Contract
    Use deploy-smart-contract tool:
    - contractType: 'erc20' or 'erc721'
    - name: User's desired name
    - symbol: 3-5 character symbol
    - chainId: 11155111 (Sepolia testnet - default)

    Example:
    <tool_use>
      <tool_name>deploy-smart-contract</tool_name>
      <parameters>
        {
          "contractType": "erc20",
          "name": "My Gaming Token",
          "symbol": "GAME",
          "totalSupply": "1000000",
          "chainId": 11155111
        }
      </parameters>
    </tool_use>

    You will receive: contractId, contractAddress, explorerUrl

  STEP 2: Generate Contract Code
    Use generate-contract-code tool with the contractId:

    <tool_use>
      <tool_name>generate-contract-code</tool_name>
      <parameters>
        {
          "contractId": "uuid-from-step-1"
        }
      </parameters>
    </tool_use>

    You will receive 5 files with generated TypeScript/React code

  STEP 3: Write Generated Files
    Use either-write-file to create each generated file:
    - src/contracts/[ContractName].abi.ts
    - src/contracts/[ContractName].addresses.ts
    - src/hooks/use[ContractName].ts
    - src/components/[ContractName]Panel.tsx
    - src/wagmi.config.ts (only once, shared across all contracts)

  STEP 4: Update package.json
    Use either-line-replace to add wagmi dependencies:
    {
      "dependencies": {
        "wagmi": "^2.0.0",
        "viem": "^2.0.0",
        "@tanstack/react-query": "^5.0.0"
      }
    }

  STEP 5: Create App Layout with WagmiProvider
    Create src/App.tsx or modify existing layout:

    import { WagmiProvider } from 'wagmi';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
    import { config } from './wagmi.config';

    const queryClient = new QueryClient();

    function App() {
      return (
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {/* Your app components */}
          </QueryClientProvider>
        </WagmiProvider>
      );
    }

  STEP 6: Build UI Components
    Create user-facing components that use the generated hooks:
    - Wallet connection button (import from wagmi)
    - Token balance display
    - Transfer/mint forms
    - Transaction history

  STEP 7: Inform User
    Tell user:
    - Contract deployed to Sepolia testnet
    - Contract address and Etherscan link
    - How to get testnet ETH (Alchemy faucet)
    - How to connect MetaMask to Sepolia

WEB3 TECHNOLOGY STACK:
  - wagmi: React hooks for Ethereum
  - viem: TypeScript Ethereum library
  - @tanstack/react-query: Data fetching
  - RainbowKit (optional): Wallet connection UI

WEB3 EXAMPLE PROMPTS:
  User: "Create an ERC-20 token called Gaming Coin"

  You should:
  1. Deploy ERC-20 with name="Gaming Coin", symbol="GAME"
  2. Generate contract code files
  3. Write all files to src/
  4. Create UI with wallet connect, balance display, transfer form
  5. Show user the Etherscan link

  User: "Build an NFT marketplace"

  You should:
  1. Deploy ERC-721 contract
  2. Generate contract code
  3. Build marketplace UI with:
     - Mint NFT form
     - NFT gallery (display owned NFTs)
     - Transfer functionality
     - Wallet connection
  4. Style with Tailwind CSS

WEB3 BEST PRACTICES:
  - Always deploy to Sepolia testnet (chainId: 11155111) unless user specifies
  - Use the generated hooks (useTokenName, useTokenBalance, etc.)
  - Handle wallet connection state (connected/disconnected)
  - Show loading states during transactions
  - Display transaction hashes and Etherscan links
  - Handle errors gracefully (no wallet, wrong network, etc.)
  - Include clear user instructions in the UI
```

#### 3. **Web3 Templates** (Example Code Patterns)

**Location:** `packages/database/src/templates/web3-patterns/`

Create example files the agent can reference:

**`wallet-connect-button.tsx.template`**
```tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
    >
      Connect Wallet
    </button>
  );
}
```

**`token-balance-display.tsx.template`**
```tsx
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { use{{CONTRACT_NAME}}Balance } from '../hooks/use{{CONTRACT_NAME}}';

export function TokenBalance() {
  const { address } = useAccount();
  const { data: balance, isLoading } = use{{CONTRACT_NAME}}Balance(address);

  if (!address) {
    return <p>Connect wallet to see balance</p>;
  }

  if (isLoading) {
    return <p>Loading balance...</p>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold">Your Balance</h3>
      <p className="text-2xl">{formatUnits(balance || 0n, 18)} {{SYMBOL}}</p>
    </div>
  );
}
```

---

## 📊 Agent Workflow Examples

### Example 1: Simple ERC-20 Token

**User:** "Create an ERC-20 token called MyToken with symbol MTK"

**Agent Execution:**

```
[Agent Thinking]
- User wants Web3/token → this is an ERC-20 request
- I need to: deploy contract, generate code, build UI

[Agent Action 1: Deploy Contract]
<tool_use>
  <tool_name>deploy-smart-contract</tool_name>
  <parameters>
    {
      "contractType": "erc20",
      "name": "MyToken",
      "symbol": "MTK",
      "totalSupply": "1000000",
      "chainId": 11155111
    }
  </parameters>
</tool_use>

[Result]
contractId: "abc-123"
contractAddress: "0x1234..."
explorerUrl: "https://sepolia.etherscan.io/address/0x1234..."

[Agent Action 2: Generate Code]
<tool_use>
  <tool_name>generate-contract-code</tool_name>
  <parameters>
    { "contractId": "abc-123" }
  </parameters>
</tool_use>

[Result]
files: {
  abiFile: { filename: 'MyToken.abi.ts', content: '...' },
  hooksFile: { filename: 'useMyToken.ts', content: '...' },
  ...
}

[Agent Action 3-7: Write Files]
<tool_use>
  <tool_name>either-write-file</tool_name>
  <parameters>
    {
      "path": "src/contracts/MyToken.abi.ts",
      "content": "export const MyTokenABI = [...]"
    }
  </parameters>
</tool_use>

(Repeat for all 5 generated files)

[Agent Action 8: Update package.json]
<tool_use>
  <tool_name>either-line-replace</tool_name>
  <parameters>
    {
      "path": "package.json",
      "old_line": '  "dependencies": {',
      "new_line": '  "dependencies": {\n    "wagmi": "^2.0.0",\n    "viem": "^2.0.0",'
    }
  </parameters>
</tool_use>

[Agent Action 9-12: Build UI]
- Create src/App.tsx with WagmiProvider
- Create src/components/WalletConnect.tsx
- Create src/components/TokenBalance.tsx
- Create src/components/TransferForm.tsx

[Agent Response to User]
"I've created your MyToken (MTK) ERC-20 token! Here's what I built:

✅ Smart contract deployed to Sepolia testnet
   Address: 0x1234...
   View on Etherscan: https://sepolia.etherscan.io/address/0x1234...

✅ Generated contract code with typed hooks
✅ Built UI with wallet connection, balance display, and transfer form

To test:
1. Install MetaMask browser extension
2. Switch to Sepolia testnet
3. Get free testnet ETH: https://www.alchemy.com/faucets/ethereum-sepolia
4. Connect your wallet in the app
5. You can now view balance and transfer tokens!"
```

### Example 2: NFT Marketplace

**User:** "Build me an NFT marketplace where I can mint and sell NFTs"

**Agent Execution:**

```
[Agent Thinking]
- NFT marketplace → needs ERC-721 contract
- Marketplace features: mint, display collection, transfer
- Need wallet connection, transaction handling

[Step 1: Deploy ERC-721]
deploy-smart-contract({
  contractType: 'erc721',
  name: 'Marketplace NFTs',
  symbol: 'MNFT'
})

[Step 2: Generate contract code]
generate-contract-code(contractId)

[Step 3: Write all contract files]
- MarketplaceNFTs.abi.ts
- useMarketplaceNFTs.ts
- MarketplaceNFTsPanel.tsx
- wagmi.config.ts

[Step 4: Build marketplace UI]
Create components:
- src/components/MintNFTForm.tsx
  → Form with "To Address" and "Token URI" inputs
  → Use useMintNFT() hook
  → Show transaction status

- src/components/NFTGallery.tsx
  → Display grid of user's NFTs
  → Use useTokenBalance() to get total owned
  → Use useTokenURI() for each NFT
  → Show images from IPFS/HTTP URIs

- src/components/TransferNFTModal.tsx
  → Transfer form (tokenId, recipient address)
  → Use useTransferNFT() hook

- src/App.tsx
  → Wallet connection
  → Tab navigation (Mint | My NFTs | Transfer)
  → Dark theme with Tailwind

[Agent Response]
"I've built your NFT marketplace! Features:

📝 Mint NFTs: Create new NFTs with custom metadata
🖼️ Gallery: View all your owned NFTs
🔄 Transfer: Send NFTs to other addresses
💳 Wallet Integration: Connect with MetaMask

Your NFT contract:
Address: 0x5678...
Etherscan: https://sepolia.etherscan.io/address/0x5678..."
```

---

## 🔧 Implementation Steps

### Phase 4A: Create Web3 Tools (2-3h)

**File:** `packages/tools-impl/src/deploy-contract.ts`

1. Create tool definition
2. Implement API call to `/api/contracts/create-and-deploy`
3. Return structured result (contractId, address, explorerUrl)
4. Add error handling (network errors, compilation failures)

**File:** `packages/tools-impl/src/generate-contract-code.ts`

1. Create tool definition
2. Implement API call to `/api/contracts/:id/generate-code`
3. Return all 5 generated files
4. Handle missing contract errors

**File:** `packages/tools-impl/src/index.ts`

1. Export new tools
2. Register in `getAllToolDefinitions()`

### Phase 4B: Extend System Prompt (1h)

**File:** `packages/runtime/src/agent.ts`

1. Add Web3 section after existing sections (line ~500)
2. Include:
   - Intent detection keywords
   - 7-step workflow
   - Technology stack
   - Example prompts
   - Best practices

### Phase 4C: Add Web3 Templates (1-2h)

**Directory:** `packages/database/src/templates/web3-patterns/`

1. Create `wallet-connect-button.tsx.template`
2. Create `token-balance-display.tsx.template`
3. Create `transfer-form.tsx.template`
4. Create `nft-gallery.tsx.template`
5. Create `app-layout-wagmi.tsx.template`

### Phase 4D: Test Agent Web3 Flow (1h)

1. Start agent in development mode
2. Test prompt: "Create an ERC-20 token"
3. Verify:
   - Contract deploys successfully
   - Code generation works
   - Files written to VFS
   - UI components render
   - App builds without errors
4. Test prompt: "Build an NFT marketplace"
5. Verify full marketplace functionality

---

## 🎯 Success Criteria

The integration is successful when:

✅ User can say "Create a token" and get a fully functional Web3 app
✅ Agent deploys contract without manual intervention
✅ Generated code is type-safe and production-ready
✅ UI includes wallet connection and transaction handling
✅ No errors during build/preview
✅ Works across different Web3 prompts (tokens, NFTs, marketplaces)
✅ Agent explains what it did and how to test

---

## 📐 Architecture Diagram

```
User Prompt: "Build token app"
          ↓
    Agent (Claude)
    - Reads SYSTEM_PROMPT (Web3 knowledge)
    - Detects "token" keyword → Web3 intent
          ↓
    Tool: deploy-smart-contract
    - Calls /api/contracts/create-and-deploy
    - Returns contractId, address, explorerUrl
          ↓
    Tool: generate-contract-code
    - Calls /api/contracts/:id/generate-code
    - Returns 5 TypeScript files
          ↓
    Tool: either-write-file (×5)
    - Writes contracts/MyToken.abi.ts
    - Writes hooks/useMyToken.ts
    - Writes components/MyTokenPanel.tsx
    - Writes wagmi.config.ts
    - Writes contracts/MyToken.addresses.ts
          ↓
    Tool: either-line-replace
    - Updates package.json with wagmi deps
          ↓
    Tool: either-write-file (×N)
    - Creates App.tsx with WagmiProvider
    - Creates WalletConnect component
    - Creates UI components using hooks
          ↓
    PostgreSQL VFS (FileStore)
    - All files saved
          ↓
    User Preview (WebContainer)
    - Fully functional Web3 app!
```

---

## 🚦 Next Steps

1. **Review this strategy** - Confirm approach aligns with vision
2. **Implement Phase 4A** - Create Web3 tools
3. **Implement Phase 4B** - Extend system prompt
4. **Test with simple prompt** - "Create an ERC-20 token"
5. **Iterate and refine** - Based on results
6. **Add more patterns** - As we discover common use cases

---

## 📝 Notes

- This approach makes Web3 a **first-class capability** of the agent
- No "magic" auto-injection - agent explicitly builds Web3 apps
- Agent can explain what it's doing at each step
- Flexible enough to handle any Web3 use case
- User gets full transparency and control

**The agent becomes a Web3 app builder, not just an app builder with Web3 bolted on.**
