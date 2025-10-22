/**
 * JSON Schema definitions for all tools
 * These match Anthropic's Messages API tool schema format
 */

import { ToolDefinition } from './types.js';

export const TOOL_SCHEMAS: Record<string, ToolDefinition> = {
  'either-view': {
    name: 'either-view',
    description: 'Read a file (or small list) to understand current code before changing it.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path to a file.',
        },
        max_bytes: {
          type: 'integer',
          minimum: 1,
          maximum: 1048576,
          description: 'Maximum bytes to read (default: 1MB)',
        },
        encoding: {
          type: 'string',
          description: 'File encoding (default: utf-8)',
          default: 'utf-8',
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },

  'either-search-files': {
    name: 'either-search-files',
    description: 'Search code for patterns to understand usage and dependencies.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search pattern or text to find',
        },
        glob: {
          type: 'string',
          description: 'File pattern to search in',
          default: 'src/**/*',
        },
        max_results: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          description: 'Maximum number of results to return',
          default: 100,
        },
        regex: {
          type: 'boolean',
          description: 'Treat query as a regex pattern (default: false)',
          default: false,
        },
        context_lines: {
          type: 'integer',
          minimum: 0,
          description: 'Number of context lines to show before/after matches',
          default: 0,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },

  'either-write': {
    name: 'either-write',
    description: 'Create a NEW file with provided content. Fails if file exists unless overwrite=true.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path for the new file',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
        overwrite: {
          type: 'boolean',
          description: 'Allow overwriting existing file',
          default: false,
        },
        create_dirs: {
          type: 'boolean',
          description: 'Create parent directories if needed',
          default: true,
        },
      },
      required: ['path', 'content'],
      additionalProperties: false,
    },
  },

  'either-line-replace': {
    name: 'either-line-replace',
    description: 'Targeted edits in EXISTING files. Prefer this over rewriting entire files.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to edit',
        },
        locator: {
          type: 'object',
          description: 'Location specification for the edit',
          properties: {
            start_line: {
              type: 'integer',
              minimum: 1,
              description: 'Starting line number (1-indexed)',
            },
            end_line: {
              type: 'integer',
              minimum: 1,
              description: 'Ending line number (inclusive)',
            },
            needle: {
              type: 'string',
              description: 'Optional exact text to verify you are editing the intended block',
            },
          },
          required: ['start_line', 'end_line'],
          additionalProperties: false,
        },
        replacement: {
          type: 'string',
          description: 'New content to replace the specified lines',
        },
        verify_after: {
          type: 'boolean',
          description: 'Verify the edit was applied correctly',
          default: true,
        },
      },
      required: ['path', 'locator', 'replacement'],
      additionalProperties: false,
    },
  },

  'eithergen--generate_image': {
    name: 'eithergen--generate_image',
    description:
      'Generate high-quality images using GPT-Image-1 (OpenAI) and save to database-backed VFS. Images are automatically saved to /public/generated/ and auto-injected into your app. This tool WAITS for generation to complete and validates the image before returning. Generation takes 10-30 seconds. The image will be automatically inserted into index.html or src/App.jsx if found.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed image generation prompt. Be specific about style, composition, colors, and content.',
        },
        path: {
          type: 'string',
          description:
            'Desired filename for the image (e.g., "hero.png" or "logo"). Images are automatically saved to /public/generated/ directory. Extension will be added automatically if missing. The tool will auto-inject the image into your app.',
        },
        size: {
          type: 'string',
          pattern: '^[0-9]+x[0-9]+$',
          description:
            'Image size. Supports: "1024x1024" (square), "1792x1024" (landscape), "1024x1792" (portrait). Default: "1024x1024"',
          default: '1024x1024',
        },
        quality: {
          type: 'string',
          enum: ['standard', 'hd'],
          description: 'Image quality. "hd" creates finer details and greater consistency. Default: "standard"',
          default: 'standard',
        },
      },
      required: ['prompt', 'path'],
      additionalProperties: false,
    },
  },

  'deploy-smart-contract': {
    name: 'deploy-smart-contract',
    description: 'Deploy an ERC-20 token or ERC-721 NFT smart contract to Ethereum testnet. This tool compiles and deploys a smart contract to a blockchain testnet (Sepolia, Base Sepolia, or Arbitrum Sepolia). Returns the deployed contract\'s address, transaction hash, and block explorer URL. Use this when the user wants to create a cryptocurrency/token, build an NFT collection, deploy any blockchain-based asset, or create a decentralized application (dApp). After deployment, you MUST call generate-contract-code to get the TypeScript/React code for interacting with the contract.',
    input_schema: {
      type: 'object',
      properties: {
        contractType: {
          type: 'string',
          enum: ['erc20', 'erc721'],
          description: 'Type of smart contract to deploy. "erc20" for fungible tokens (currencies), "erc721" for non-fungible tokens (NFTs)'
        },
        name: {
          type: 'string',
          description: 'Full name of the token/NFT collection (e.g., "My Gaming Token", "Awesome NFT Collection")'
        },
        symbol: {
          type: 'string',
          description: 'Short symbol/ticker for the token (2-5 uppercase letters, e.g., "GAME", "ANFT")'
        },
        totalSupply: {
          type: 'string',
          description: 'Total supply of tokens (required for ERC-20 only). Use large numbers like "1000000" for one million tokens'
        },
        chainId: {
          type: 'number',
          enum: [11155111, 84532, 421614],
          description: 'Blockchain to deploy to: 11155111 (Sepolia - default), 84532 (Base Sepolia), 421614 (Arbitrum Sepolia). Always use Sepolia unless user specifically requests another chain'
        },
        userId: {
          type: 'string',
          description: 'User ID (required for tracking)'
        },
        appId: {
          type: 'string',
          description: 'App ID to link this contract to (optional)'
        },
        sessionId: {
          type: 'string',
          description: 'Session ID (optional)'
        }
      },
      required: ['contractType', 'name', 'symbol', 'userId'],
      additionalProperties: false
    }
  },

  'generate-contract-code': {
    name: 'generate-contract-code',
    description: 'Generate TypeScript/React code for interacting with a deployed smart contract. This tool generates production-ready, type-safe code including: (1) Contract ABI defining contract functions, (2) Contract addresses where deployed, (3) React hooks for reading/writing data (useTokenName, useTokenBalance, useTransfer, etc.), (4) Ready-to-use React components with UI, (5) Wagmi configuration for wallet connection. You MUST call this immediately after deploy-smart-contract to get the code needed to build the app UI. The generated files should be written to the project using either-write. After writing these files, you must also update package.json to include wagmi dependencies and create/modify the app layout to wrap components in WagmiProvider.',
    input_schema: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'The contract ID returned from deploy-smart-contract tool'
        }
      },
      required: ['contractId'],
      additionalProperties: false
    }
  },
};

// Export individual schemas for direct access
export const EITHER_VIEW_SCHEMA = TOOL_SCHEMAS['either-view'];
export const EITHER_SEARCH_FILES_SCHEMA = TOOL_SCHEMAS['either-search-files'];
export const EITHER_WRITE_SCHEMA = TOOL_SCHEMAS['either-write'];
export const EITHER_LINE_REPLACE_SCHEMA = TOOL_SCHEMAS['either-line-replace'];
export const IMAGEGEN_SCHEMA = TOOL_SCHEMAS['eithergen--generate_image'];
export const DEPLOY_SMART_CONTRACT_SCHEMA = TOOL_SCHEMAS['deploy-smart-contract'];
export const GENERATE_CONTRACT_CODE_SCHEMA = TOOL_SCHEMAS['generate-contract-code'];

// Get all tool definitions as array for Claude API
export function getAllToolDefinitions(): ToolDefinition[] {
  return Object.values(TOOL_SCHEMAS);
}
