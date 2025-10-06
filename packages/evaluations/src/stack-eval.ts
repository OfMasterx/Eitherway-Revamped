/**
 * Stack Conformance Evaluation
 * Tests that generated apps conform to React + Vite + TypeScript + Tailwind stack
 */

import { Agent } from '@eitherway/runtime';
import { ConfigLoader } from '@eitherway/runtime';
import { getAllExecutors } from '@eitherway/tools-impl';
import { readFile, access } from 'fs/promises';
import { resolve } from 'path';
import { execSync } from 'child_process';

interface EvalResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    details?: string;
  }>;
}

/**
 * Run stack conformance evaluation
 */
export async function runStackEval(
  prompt: string = 'Build a todo app with add, delete, and toggle features',
  workingDir: string = './workspace-eval'
): Promise<EvalResult> {
  const checks = [];

  try {
    // Load config
    const loader = new ConfigLoader('./configs');
    const { claudeConfig, agentConfig } = await loader.loadAll();

    // Create agent
    const agent = new Agent({
      workingDir,
      claudeConfig,
      agentConfig,
      executors: getAllExecutors(),
      dryRun: false
    });

    // Process request
    console.log(`\n[StackEval] Processing: "${prompt}"\n`);
    await agent.processRequest(prompt);

    // Check 1: package.json exists
    const pkgPath = resolve(workingDir, 'package.json');
    let pkgExists = false;
    let pkg: any = null;

    try {
      await access(pkgPath);
      const pkgContent = await readFile(pkgPath, 'utf-8');
      pkg = JSON.parse(pkgContent);
      pkgExists = true;
    } catch {
      pkgExists = false;
    }

    checks.push({
      name: 'package.json exists',
      passed: pkgExists,
      details: pkgExists ? 'Found' : 'Missing'
    });

    if (!pkg) {
      return { passed: false, checks };
    }

    // Check 2: Required dependencies present
    const requiredDeps = {
      'react': '>=18',
      'react-dom': '>=18',
      'vite': '>=7',
      'typescript': '>=5',
      'tailwindcss': '>=3'
    };

    const missingDeps: string[] = [];
    for (const [dep, _version] of Object.entries(requiredDeps)) {
      const hasDep = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
      if (!hasDep) {
        missingDeps.push(dep);
      }
    }

    checks.push({
      name: 'Required dependencies present',
      passed: missingDeps.length === 0,
      details: missingDeps.length === 0
        ? 'All required deps found'
        : `Missing: ${missingDeps.join(', ')}`
    });

    // Check 3: Forbidden frameworks absent
    const forbiddenDeps = ['next', 'vue', 'nuxt', 'angular', 'svelte', 'solid-js'];
    const foundForbidden: string[] = [];

    for (const dep of forbiddenDeps) {
      if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
        foundForbidden.push(dep);
      }
    }

    checks.push({
      name: 'No forbidden frameworks',
      passed: foundForbidden.length === 0,
      details: foundForbidden.length === 0
        ? 'Clean'
        : `Found: ${foundForbidden.join(', ')}`
    });

    // Check 4: Required files exist
    const requiredFiles = [
      'vite.config.ts',
      'tailwind.config.ts',
      'tsconfig.json',
      'src/main.tsx',
      'src/App.tsx',
      'index.html'
    ];

    const missingFiles: string[] = [];
    for (const file of requiredFiles) {
      try {
        await access(resolve(workingDir, file));
      } catch {
        missingFiles.push(file);
      }
    }

    checks.push({
      name: 'Required scaffold files exist',
      passed: missingFiles.length === 0,
      details: missingFiles.length === 0
        ? 'All files present'
        : `Missing: ${missingFiles.join(', ')}`
    });

    // Check 5: TypeScript check passes (if tsc available)
    try {
      execSync('tsc --noEmit', {
        cwd: workingDir,
        stdio: 'pipe',
        timeout: 30000
      });

      checks.push({
        name: 'TypeScript typecheck passes',
        passed: true,
        details: 'No type errors'
      });
    } catch (error: any) {
      checks.push({
        name: 'TypeScript typecheck passes',
        passed: false,
        details: error.message?.includes('not found')
          ? 'tsc not available'
          : 'Type errors found'
      });
    }

    // Check 6: Build succeeds (if vite available)
    try {
      execSync('npm run build', {
        cwd: workingDir,
        stdio: 'pipe',
        timeout: 60000,
        env: { ...process.env, CI: 'true' }
      });

      checks.push({
        name: 'Vite build succeeds',
        passed: true,
        details: 'Build completed'
      });
    } catch (error: any) {
      checks.push({
        name: 'Vite build succeeds',
        passed: false,
        details: 'Build failed'
      });
    }

    const allPassed = checks.every(c => c.passed);

    return {
      passed: allPassed,
      checks
    };

  } catch (error: any) {
    return {
      passed: false,
      checks: [
        ...checks,
        {
          name: 'Execution',
          passed: false,
          details: `Error: ${error.message}`
        }
      ]
    };
  }
}
