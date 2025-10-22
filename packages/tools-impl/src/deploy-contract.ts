/**
 * deploy-smart-contract tool
 *
 * Deploys ERC-20 tokens or ERC-721 NFTs to Ethereum testnets
 */

import type { ToolExecutor, ExecutionContext, ToolExecutorResult } from '@eitherway/tools-core';

export class DeploySmartContractExecutor implements ToolExecutor {
  name = 'deploy-smart-contract';

  async execute(
    input: Record<string, any>,
    context: ExecutionContext
  ): Promise<ToolExecutorResult> {
    const {
      contractType,
      name,
      symbol,
      totalSupply,
      chainId = 11155111, // Default to Sepolia
      userId,
      appId,
      sessionId
    } = input;

    // Validate inputs
    if (!contractType || !name || !symbol) {
      return {
        content: 'Error: Missing required parameters. contractType, name, and symbol are required.',
        isError: true
      };
    }

    if (!['erc20', 'erc721'].includes(contractType)) {
      return {
        content: 'Error: Invalid contractType. Must be "erc20" or "erc721".',
        isError: true
      };
    }

    if (contractType === 'erc20' && !totalSupply) {
      return {
        content: 'Error: totalSupply is required for ERC-20 tokens.',
        isError: true
      };
    }

    try {
      // Prefer direct database access if available (more efficient)
      if (context.db) {
        // Import dynamically to avoid circular dependencies
        const { ContractService, UsersRepository } = await import('@eitherway/database');
        const contractService = new ContractService(context.db);

        // Ensure we have a valid userId - create/find demo user if needed
        let validUserId = userId;
        if (!validUserId || validUserId === 'unknown') {
          const usersRepo = new UsersRepository(context.db);
          const demoUser = await usersRepo.findByEmail('demo-user@eitherway.local')
            || await usersRepo.create('demo-user@eitherway.local', 'Demo User');
          validUserId = demoUser.id;
        }

        // Step 1: Create and compile
        const compileResult = await contractService.createAndCompile(
          validUserId,
          {
            contractType,
            name,
            symbol,
            totalSupply,
            appId: appId || context.appId,
            sessionId: sessionId || context.sessionId
          }
        );

        if (!compileResult.compileResult.success || !compileResult.contractId) {
          return {
            content: `Error: Compilation failed. ${compileResult.compileResult.error || 'Unknown error'}`,
            isError: true
          };
        }

        // Step 2: Deploy
        const deployResult = await contractService.deployContract({
          contractId: compileResult.contractId,
          chainId,
          deployerPrivateKey: undefined // Use default deployer
        });

        if (!deployResult.success) {
          return {
            content: `Error: Deployment failed. ${deployResult.error || 'Unknown error'}`,
            isError: true
          };
        }

        // Combine results
        const result = {
          contractId: compileResult.contractId,
          data: {
            contractAddress: deployResult.contractAddress,
            transactionHash: deployResult.transactionHash,
            explorerUrl: deployResult.explorerUrl
          }
        };

        return this.formatSuccessResponse(result, contractType, name, symbol, totalSupply, chainId);
      }

      // Fallback to HTTP API if database not available
      const apiUrl = process.env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/contracts/create-and-deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || context.sessionId || 'unknown',
          appId: appId || context.appId,
          sessionId: sessionId || context.sessionId,
          contractType,
          name,
          symbol,
          totalSupply,
          chainId
        }),
      });

      const data = await response.json() as any;

      if (!data.success) {
        return {
          content: `Error deploying contract: ${data.error || 'Unknown error'}`,
          isError: true
        };
      }

      return this.formatSuccessResponse(data, contractType, name, symbol, totalSupply, chainId);

    } catch (error: any) {
      console.error('[deploy-smart-contract] Error:', error);
      return {
        content: `Error: Failed to deploy contract. ${error.message || 'Unknown error'}`,
        isError: true
      };
    }
  }

  private formatSuccessResponse(
    result: any,
    contractType: string,
    name: string,
    symbol: string,
    totalSupply: string | undefined,
    chainId: number
  ): ToolExecutorResult {
    // Get chain name
    const chainNames: Record<number, string> = {
      11155111: 'Sepolia',
      84532: 'Base Sepolia',
      421614: 'Arbitrum Sepolia'
    };

    const chainName = chainNames[chainId] || `Chain ${chainId}`;

    // Handle both direct service response and API response formats
    const contractId = result.contractId || result.id;
    const contractAddress = result.data?.contractAddress || result.contract_address;
    const transactionHash = result.data?.transactionHash || result.transaction_hash;
    const explorerUrl = result.data?.explorerUrl || result.explorer_url;

    const formattedResult = {
      success: true,
      contractId,
      contractAddress,
      transactionHash,
      explorerUrl,
      chainName
    };

    const content = `✅ Smart contract deployed successfully!

Contract Details:
- Type: ${contractType.toUpperCase()}
- Name: ${name}
- Symbol: ${symbol}
${contractType === 'erc20' ? `- Total Supply: ${totalSupply}` : ''}
- Chain: ${chainName}
- Address: ${formattedResult.contractAddress}
- Transaction: ${formattedResult.transactionHash}
- Explorer: ${formattedResult.explorerUrl}

**IMPORTANT - NEXT STEPS:**
1. Call generate-contract-code with contractId: "${formattedResult.contractId}"
2. Write the generated files to src/contracts/, src/hooks/, src/components/
3. Update package.json to add wagmi dependencies
4. Create/update App.tsx to wrap components in WagmiProvider

Contract ID for code generation: ${formattedResult.contractId}`;

    return {
      content,
      isError: false,
      metadata: formattedResult
    };
  }
}
