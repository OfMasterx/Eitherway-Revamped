#!/usr/bin/env node
/**
 * Evaluation runner for all acceptance tests
 */

import { runCalculatorEval } from './calculator-eval.js';
import { runStackEval } from './stack-eval.js';

async function main() {
  console.log('=== EitherWay Acceptance Tests ===\n');

  let allPassed = true;

  // Test 1: Calculator evaluation (Dry Run)
  console.log('Test 1: Calculator Request (Dry Run)');
  console.log('Request: "Build me a calculator"');
  console.log('Expected: Analyze and Plan stages complete\n');

  const calcResult = await runCalculatorEval(true);

  console.log('Results:');
  for (const check of calcResult.checks) {
    const icon = check.passed ? '✅' : '❌';
    console.log(`  ${icon} ${check.name}`);
    if (check.details) {
      console.log(`     ${check.details}`);
    }
  }

  console.log(`\nTest 1: ${calcResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  allPassed = allPassed && calcResult.passed;

  // Test 2: Stack conformance evaluation
  console.log('Test 2: Stack Conformance (Todo App)');
  console.log('Request: "Build a todo app with add, delete, and toggle features"');
  console.log('Expected: React + Vite + TypeScript + Tailwind stack\n');

  const stackResult = await runStackEval();

  console.log('Results:');
  for (const check of stackResult.checks) {
    const icon = check.passed ? '✅' : '❌';
    console.log(`  ${icon} ${check.name}`);
    if (check.details) {
      console.log(`     ${check.details}`);
    }
  }

  console.log(`\nTest 2: ${stackResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  allPassed = allPassed && stackResult.passed;

  console.log('\n' + '='.repeat(60));
  console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(60) + '\n');

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
