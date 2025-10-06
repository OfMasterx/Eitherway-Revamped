/**
 * VerifierRunner: Automatic verification of workspace changes
 * Runs tests, linting, and builds to ensure changes are valid
 */

import { spawn } from 'child_process';
import { readFile, access } from 'fs/promises';
import { resolve, dirname, join } from 'path';
import { autofixMissingFiles, formatAutofixResult } from './stack-autofix.js';

export interface VerifyStep {
  name: string;
  ok: boolean;
  output?: string;
  duration?: number;
}

export interface VerifyResult {
  steps: VerifyStep[];
  passed: boolean;
  totalDuration: number;
}

interface StackRules {
  disallowDeps: string[];
  requireDeps: Record<string, string>;
  requireFiles: string[];
}

/**
 * Check React + Vite stack conformance with optional autofix
 */
async function checkReactViteStack(
  workingDir: string,
  rules: StackRules,
  autofix: boolean = true
): Promise<VerifyStep> {
  try {
    const pkgPath = resolve(workingDir, 'package.json');
    const pkgContent = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);

    // Check for missing required files
    const missingFiles: string[] = [];
    for (const rel of rules.requireFiles) {
      try {
        await access(resolve(workingDir, rel));
      } catch {
        missingFiles.push(rel);
      }
    }

    // Attempt to autofix missing files
    let autofixOutput = '';
    if (autofix && missingFiles.length > 0) {
      // Scaffold path: ../../../../templates/react-vite-starter (from runtime/dist)
      const scaffoldPath = join(dirname(workingDir), '..', 'templates', 'react-vite-starter');
      const fixResult = await autofixMissingFiles(workingDir, missingFiles, scaffoldPath);
      autofixOutput = formatAutofixResult(fixResult);

      // Remove successfully fixed files from missing list
      for (const fixed of fixResult.filesFixed) {
        const index = missingFiles.indexOf(fixed);
        if (index > -1) {
          missingFiles.splice(index, 1);
        }
      }
    }

    // Check for missing required dependencies
    const missingDeps = Object.entries(rules.requireDeps)
      .filter(([name, _]) => !pkg.dependencies?.[name] && !pkg.devDependencies?.[name])
      .map(([name]) => name);

    // Check for forbidden dependencies
    const forbidden = (dep: string) =>
      pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];

    const badDeps = rules.disallowDeps.filter(forbidden);

    // Determine if stack is conformant
    const ok = missingFiles.length === 0 && missingDeps.length === 0 && badDeps.length === 0;

    // Build detailed output
    const details = [
      autofixOutput,
      missingFiles.length ? `Missing required files: ${missingFiles.join(', ')}` : '',
      missingDeps.length ? `Missing required dependencies: ${missingDeps.join(', ')} - Add these to package.json` : '',
      badDeps.length ? `Forbidden dependencies found: ${badDeps.join(', ')} - Remove these and use React+Vite instead` : ''
    ].filter(Boolean).join('\n\n');

    return {
      name: 'Stack Conformance (React+Vite)',
      ok,
      output: ok ? '✓ Stack conforms to React 18 + TypeScript + Vite + Tailwind' : details
    };
  } catch (e: any) {
    return {
      name: 'Stack Conformance (React+Vite)',
      ok: false,
      output: `Error checking stack conformance: ${e.message}`
    };
  }
}

export class VerifierRunner {
  constructor(private workingDir: string) {}

  /**
   * Run verification checks based on project type
   */
  async run(): Promise<VerifyResult> {
    const startTime = Date.now();
    const pkgPath = resolve(this.workingDir, 'package.json');

    let pkg: any = null;
    try {
      const content = await readFile(pkgPath, 'utf-8');
      pkg = JSON.parse(content);
    } catch {
      // No package.json - likely a static project
    }

    const steps: VerifyStep[] = [];

    // Check stack conformance FIRST (before any other checks)
    if (pkg) {
      try {
        const agentCfgPath = resolve(this.workingDir, '../configs/agent.json');
        const agentCfgContent = await readFile(agentCfgPath, 'utf-8');
        const agentCfg = JSON.parse(agentCfgContent);

        if (agentCfg?.enforcement) {
          const stepStart = Date.now();
          const stackCheck = await checkReactViteStack(this.workingDir, agentCfg.enforcement);
          stackCheck.duration = Date.now() - stepStart;
          steps.push(stackCheck);

          // If stack check fails, stop verification immediately
          if (!stackCheck.ok) {
            return {
              steps,
              passed: false,
              totalDuration: Date.now() - startTime
            };
          }
        }
      } catch (e: any) {
        // If we can't load agent config, log warning but continue
        console.warn(`Could not load agent config for stack verification: ${e.message}`);
      }
    }

    if (pkg) {
      // Node.js project - run available scripts in order
      const scriptChecks = [
        { script: 'typecheck', name: 'Type Check' },
        { script: 'lint', name: 'Lint' },
        { script: 'test', name: 'Test' },
        { script: 'build', name: 'Build' }
      ];

      for (const check of scriptChecks) {
        if (pkg.scripts?.[check.script]) {
          const stepStartTime = Date.now();
          const result = await this.runCommand(['npm', 'run', check.script]);
          const duration = Date.now() - stepStartTime;

          steps.push({
            name: check.name,
            ok: result.ok,
            output: result.output,
            duration
          });

          // If a critical step fails, stop verification
          if (!result.ok && (check.script === 'typecheck' || check.script === 'test')) {
            break;
          }
        }
      }
    } else {
      // Static project - basic sanity checks
      steps.push(await this.runStaticChecks());
    }

    const totalDuration = Date.now() - startTime;
    const passed = steps.length > 0 ? steps.every(s => s.ok) : true;

    return {
      steps,
      passed,
      totalDuration
    };
  }

  /**
   * Run basic sanity checks for static projects
   */
  private async runStaticChecks(): Promise<VerifyStep> {
    const indexPath = resolve(this.workingDir, 'index.html');

    try {
      const content = await readFile(indexPath, 'utf-8');

      // Basic HTML validation
      const hasDoctype = content.trim().toLowerCase().startsWith('<!doctype html');
      const hasClosingHtml = content.includes('</html>');

      if (hasDoctype && hasClosingHtml) {
        return {
          name: 'Static Validation',
          ok: true,
          output: 'index.html appears well-formed',
          duration: 0
        };
      } else {
        return {
          name: 'Static Validation',
          ok: false,
          output: 'index.html may be malformed (missing doctype or closing tag)',
          duration: 0
        };
      }
    } catch {
      return {
        name: 'Static Validation',
        ok: true,
        output: 'No index.html found - skipping validation',
        duration: 0
      };
    }
  }

  /**
   * Execute a shell command and return result
   */
  private runCommand(cmd: string[]): Promise<{ ok: boolean; output: string }> {
    return new Promise((resolve) => {
      const proc = spawn(cmd[0], cmd.slice(1), {
        cwd: this.workingDir,
        shell: process.platform === 'win32',
        env: { ...process.env, CI: 'true', NODE_ENV: 'test' }
      });

      let output = '';
      const outputLimit = 5000; // Limit output to 5000 chars

      proc.stdout.on('data', (data) => {
        if (output.length < outputLimit) {
          output += data.toString();
        }
      });

      proc.stderr.on('data', (data) => {
        if (output.length < outputLimit) {
          output += data.toString();
        }
      });

      proc.on('close', (code) => {
        if (output.length >= outputLimit) {
          output = output.slice(0, outputLimit) + '\n... (output truncated)';
        }

        resolve({
          ok: code === 0,
          output: output.trim()
        });
      });

      proc.on('error', (error) => {
        resolve({
          ok: false,
          output: `Failed to execute command: ${error.message}`
        });
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        proc.kill();
        resolve({
          ok: false,
          output: 'Command timed out after 60 seconds'
        });
      }, 60000);
    });
  }

  /**
   * Format verification result as a concise summary
   */
  static formatSummary(result: VerifyResult): string {
    if (result.steps.length === 0) {
      return '✓ No verification steps configured';
    }

    const lines: string[] = ['\n**Verification Results:**'];

    for (const step of result.steps) {
      const icon = step.ok ? '✓' : '✗';
      const time = step.duration ? ` (${step.duration}ms)` : '';
      lines.push(`  ${icon} ${step.name}${time}`);

      // Include brief error output for failed steps
      if (!step.ok && step.output) {
        const errorLines = step.output.split('\n').slice(0, 5); // First 5 lines
        for (const line of errorLines) {
          if (line.trim()) {
            lines.push(`    ${line.trim()}`);
          }
        }
      }
    }

    const summary = result.passed ? 'All checks passed ✓' : 'Some checks failed ✗';
    lines.push(`\n${summary} (${result.totalDuration}ms total)`);

    return lines.join('\n');
  }
}
