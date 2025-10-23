/**
 * AI-Powered Code Validation and Auto-Fixing
 * Uses Claude to intelligently detect and fix code issues
 */

import { createScopedLogger } from './logger';
import { BACKEND_URL } from '~/config/api';

const logger = createScopedLogger('AICodeValidator');

export interface AIValidationIssue {
  file: string;
  line?: number;
  column?: number;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  autoFixed?: boolean;
}

export interface AIValidationResult {
  issues: AIValidationIssue[];
  fixedFiles: Record<string, string>; // filePath -> fixed content (plain object from JSON)
  success: boolean;
}

/**
 * Validate code files using AI
 * This sends code to Claude for intelligent validation
 */
export async function validateCodeWithAI(
  files: Map<string, string>, // filePath -> content
  sessionId: string,
): Promise<AIValidationResult> {
  try {
    logger.info(`Validating ${files.size} files with AI...`);

    const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/validate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: Object.fromEntries(files),
      }),
    });

    if (!response.ok) {
      throw new Error(`AI validation failed: ${response.statusText}`);
    }

    const result: AIValidationResult = await response.json();

    const fixedCount = Object.keys(result.fixedFiles || {}).length;
    logger.info(
      `AI validation complete: ${result.issues.length} issues found, ${fixedCount} files auto-fixed`,
    );

    return result;
  } catch (error: any) {
    logger.error('AI validation error:', error);
    return {
      issues: [
        {
          file: 'system',
          issue: `AI validation service unavailable: ${error.message}`,
          severity: 'warning',
        },
      ],
      fixedFiles: {},
      success: false,
    };
  }
}

/**
 * Apply AI-suggested fixes to WebContainer files
 */
export async function applyAIFixes(
  webcontainer: any,
  sessionRoot: string,
  fixedFiles: Record<string, string>,
): Promise<number> {
  let applied = 0;
  const total = Object.keys(fixedFiles).length;

  for (const [filePath, content] of Object.entries(fixedFiles)) {
    try {
      const fullPath = filePath.startsWith(sessionRoot) ? filePath : `${sessionRoot}/${filePath}`;
      await webcontainer.fs.writeFile(fullPath, content);
      logger.debug(`Applied AI fix to ${filePath}`);
      applied++;
    } catch (error) {
      logger.error(`Failed to apply fix to ${filePath}:`, error);
    }
  }

  logger.info(`Applied ${applied}/${total} AI fixes`);
  return applied;
}
