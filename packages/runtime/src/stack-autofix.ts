/**
 * Stack autofix utility
 * Automatically fixes missing required files by copying from scaffold template
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';

export interface AutofixResult {
  filesFixed: string[];
  errors: string[];
}

/**
 * Autofix missing scaffold files
 */
export async function autofixMissingFiles(
  workingDir: string,
  missingFiles: string[],
  scaffoldPath: string
): Promise<AutofixResult> {
  const filesFixed: string[] = [];
  const errors: string[] = [];

  for (const file of missingFiles) {
    try {
      const sourcePath = resolve(scaffoldPath, file);
      const targetPath = resolve(workingDir, file);

      // Ensure target directory exists
      const targetDir = dirname(targetPath);
      await mkdir(targetDir, { recursive: true });

      // Copy file from scaffold
      const content = await readFile(sourcePath, 'utf-8');
      await writeFile(targetPath, content, 'utf-8');

      filesFixed.push(file);
    } catch (error: any) {
      errors.push(`Failed to fix ${file}: ${error.message}`);
    }
  }

  return { filesFixed, errors };
}

/**
 * Format autofix result for display
 */
export function formatAutofixResult(result: AutofixResult): string {
  const lines: string[] = [];

  if (result.filesFixed.length > 0) {
    lines.push(`✓ Auto-fixed ${result.filesFixed.length} missing file(s):`);
    for (const file of result.filesFixed) {
      lines.push(`  • ${file}`);
    }
  }

  if (result.errors.length > 0) {
    lines.push(`✗ Failed to fix ${result.errors.length} file(s):`);
    for (const error of result.errors) {
      lines.push(`  • ${error}`);
    }
  }

  return lines.join('\n');
}
