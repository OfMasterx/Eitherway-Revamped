/**
 * Code Validation Routes
 * AI-powered code validation and auto-fixing using Claude
 */

import type { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const VALIDATION_PROMPT = `You are a code validator for React/Vite applications. Your job is to find issues and provide fixes.

Analyze the provided code files and identify:

1. **Syntax Errors** (CRITICAL):
   - Unescaped quotes in JSX attributes
   - Missing/extra braces, parentheses, brackets
   - Invalid JSX syntax
   - Malformed expressions

2. **Runtime Errors** (CRITICAL):
   - Missing React imports (useState, useEffect, etc.)
   - Incorrect API calls
   - Type mismatches
   - Undefined variables

3. **API/CORS Issues** (CHECK VITE CONFIG):
   - Direct external API calls (fetch('https://api.coingecko.com/...')) are ALLOWED
   - Vite handles CORS with proper server headers - no proxy needed
   - IMPORTANT: Check that vite.config.js has proper CORS configuration:
     * server.cors: true
     * server.headers with COEP: 'credentialless' and CORS: '*'
   - If vite.config is missing or doesn't have server.headers, flag as error
   - External API calls are fine as long as Vite config is correct

4. **Configuration Issues**:
   - Wrong COEP headers (require-corp should be credentialless)
   - Missing vite proxy configuration
   - Invalid package.json

5. **Best Practices** (WARNINGS):
   - Missing keys in array .map()
   - Unused imports
   - Console.log statements

For each issue you find:
- Provide the exact file path, line, and column
- Classify severity: error, warning, or info
- If you can auto-fix it, provide the COMPLETE fixed file content

Return JSON in this format:
{
  "issues": [
    {
      "file": "src/App.jsx",
      "line": 15,
      "column": 120,
      "issue": "Unescaped quotes in JSX attribute",
      "severity": "error",
      "canAutoFix": true
    }
  ],
  "fixes": {
    "src/App.jsx": "...complete fixed file content..."
  }
}

Be thorough but fast. Focus on critical errors first.`;

interface ValidationRequest {
  files: Record<string, string>; // filePath -> content
}

interface ValidationResponse {
  issues: Array<{
    file: string;
    line?: number;
    column?: number;
    issue: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
    autoFixed?: boolean;
  }>;
  fixedFiles: Map<string, string>;
  success: boolean;
}

export function registerCodeValidationRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/sessions/:id/validate-code
   * AI-powered code validation
   */
  fastify.post<{
    Params: { id: string };
    Body: ValidationRequest;
  }>('/api/sessions/:id/validate-code', async (request, reply) => {
    const { id: sessionId } = request.params;
    const { files } = request.body;

    if (!files || Object.keys(files).length === 0) {
      return reply.code(400).send({ error: 'No files provided for validation' });
    }

    try {
      // Build context for Claude
      const filesContext = Object.entries(files)
        .map(([path, content]) => {
          const lines = content.split('\n');
          const numberedLines = lines.map((line, idx) => `${idx + 1}:${line}`).join('\n');
          return `File: ${path}\n\`\`\`\n${numberedLines}\n\`\`\``;
        })
        .join('\n\n');

      const userPrompt = `Validate these React/Vite application files and find issues:\n\n${filesContext}`;

      // Call Claude for validation
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0,
        system: VALIDATION_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Parse Claude's response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Extract JSON from response (Claude might wrap it in markdown)
      let jsonText = content.text;
      const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/) || jsonText.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const result = JSON.parse(jsonText);

      // Transform to our response format
      const issues = result.issues.map((issue: any) => ({
        ...issue,
        autoFixed: result.fixes && result.fixes[issue.file] !== undefined,
      }));

      // Send fixes as plain object (Maps don't serialize to JSON properly)
      const fixedFiles = result.fixes || {};

      return reply.send({
        issues,
        fixedFiles, // Plain object, not Map
        success: true,
      });
    } catch (error: any) {
      console.error('[Code Validation] Error:', error);
      return reply.code(500).send({
        error: 'Code validation failed',
        message: error.message,
      });
    }
  });
}
