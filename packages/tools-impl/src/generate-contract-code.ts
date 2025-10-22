/**
 * generate-contract-code tool
 *
 * Generates TypeScript/React code for interacting with a deployed smart contract
 */

import type { ToolExecutor, ExecutionContext, ToolExecutorResult } from '@eitherway/tools-core';

export class GenerateContractCodeExecutor implements ToolExecutor {
  name = 'generate-contract-code';

  async execute(
    input: Record<string, any>,
    context: ExecutionContext
  ): Promise<ToolExecutorResult> {
    const { contractId } = input;

    if (!contractId) {
      return {
        content: 'Error: contractId is required',
        isError: true
      };
    }

    try {
      // Prefer direct database access if available (more efficient)
      if (context.db) {
        // Import dynamically to avoid circular dependencies
        const { ContractCodeGenerator } = await import('@eitherway/database');
        const codeGenerator = new ContractCodeGenerator(context.db);

        const files = await codeGenerator.generateContractFiles(contractId);

        return this.formatSuccessResponse(files);
      }

      // Fallback to HTTP API if database not available
      const apiUrl = process.env.API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/api/contracts/${contractId}/generate-code`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json() as any;

      if (!data.success) {
        return {
          content: `Error generating code: ${data.error || 'Unknown error'}`,
          isError: true
        };
      }

      return this.formatSuccessResponse(data.files);

    } catch (error: any) {
      console.error('[generate-contract-code] Error:', error);
      return {
        content: `Error: Failed to generate contract code. ${error.message || 'Unknown error'}`,
        isError: true
      };
    }
  }

  private formatSuccessResponse(files: any): ToolExecutorResult {
    const content = `✅ Contract code generated successfully!

Generated Files:
1. ${files.abiFile.filename} - Contract ABI (Application Binary Interface)
2. ${files.addressesFile.filename} - Contract addresses for each chain
3. ${files.hooksFile.filename} - React hooks for reading/writing contract data
4. ${files.componentFile.filename} - Ready-to-use React component
5. ${files.wagmiConfigFile.filename} - Wagmi configuration (wallet connection)

**NEXT STEPS - Write these files to the project:**

Use either-write for each file:

1. Write ABI file:
   Path: src/contracts/${files.abiFile.filename}
   Content: (use files.abiFile.content from metadata)

2. Write addresses file:
   Path: src/contracts/${files.addressesFile.filename}
   Content: (use files.addressesFile.content from metadata)

3. Write hooks file:
   Path: src/hooks/${files.hooksFile.filename}
   Content: (use files.hooksFile.content from metadata)

4. Write component file:
   Path: src/components/${files.componentFile.filename}
   Content: (use files.componentFile.content from metadata)

5. Write wagmi config (only if it doesn't exist):
   Path: src/${files.wagmiConfigFile.filename}
   Content: (use files.wagmiConfigFile.content from metadata)

**AFTER writing files:**

6. Update package.json dependencies:
   Add: "wagmi": "^2.0.0", "viem": "^2.0.0", "@tanstack/react-query": "^5.0.0"

7. Update/create App.tsx to wrap app in WagmiProvider

Files are available in the metadata object of this result.`;

    return {
      content,
      isError: false,
      metadata: { files }
    };
  }
}
