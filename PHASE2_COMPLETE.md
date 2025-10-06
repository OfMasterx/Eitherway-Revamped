# Phase 2 Complete: Stack Contract Enforcement

## ✅ Completed Tasks

### 1. Stack Conformance Check in Verifier

**File**: `packages/runtime/src/verifier.ts`

**Added Components**:

#### StackRules Interface
```typescript
interface StackRules {
  disallowDeps: string[];
  requireDeps: Record<string, string>;
  requireFiles: string[];
}
```

#### checkReactViteStack() Function
- Validates package.json for required/forbidden dependencies
- Checks presence of required scaffold files
- Supports automatic file fixing (autofix mode)
- Returns detailed failure messages with actionable instructions

**Verification Flow**:
```
VerifierRunner.run()
  ↓
1. Load configs/agent.json
  ↓
2. Run Stack Conformance Check (FIRST, before any other checks)
  ↓
   a. Check required files (package.json, vite.config.ts, etc.)
   b. Attempt autofix for missing files (copy from scaffold)
   c. Check required dependencies (react>=18, vite>=7, etc.)
   d. Check forbidden dependencies (next, vue, angular, etc.)
  ↓
3. If FAIL → Stop immediately, return error details
  ↓
4. If PASS → Continue with typecheck, lint, test, build
```

**Example Output**:
```
✓ Stack Conformance (React+Vite) (25ms)
  ✓ Stack conforms to React 18 + TypeScript + Vite + Tailwind
```

**Failure Example**:
```
✗ Stack Conformance (React+Vite) (30ms)
  ✓ Auto-fixed 2 missing file(s):
    • vite.config.ts
    • tailwind.config.ts

  Missing required dependencies: react, vite - Add these to package.json

  Forbidden dependencies found: next - Remove these and use React+Vite instead
```

### 2. Autofix Capability

**File**: `packages/runtime/src/stack-autofix.ts`

**Features**:
- `autofixMissingFiles()` - Copies missing scaffold files from template
- `formatAutofixResult()` - Formats results for display
- Creates directories recursively as needed
- Reports success/failure for each file

**Autofix Logic**:
```
Missing files detected
  ↓
For each missing file:
  1. Locate file in templates/react-vite-starter/
  2. Read content
  3. Create target directory (if needed)
  4. Write to workspace
  5. Track success/failure
  ↓
Update verification result
```

**Path Resolution**:
- Scaffold: `{projectRoot}/templates/react-vite-starter/`
- Working dir: Agent's workspace (varies per session)
- Relative paths preserved (e.g., `src/main.tsx` → `workspace/src/main.tsx`)

### 3. Agent System Prompt Updates

**File**: `packages/runtime/src/agent.ts`

**Added Section** (top of prompt, marked CRITICAL):
```
STACK ENFORCEMENT (CRITICAL):
  - ALL apps MUST be React 18 + TypeScript + Vite 7 + Tailwind CSS 3 + shadcn/ui
  - DO NOT add Next.js, Vue, Nuxt, Angular, Svelte, or Solid-js - these are FORBIDDEN
  - DO NOT create alternative build tools or frameworks
  - Every app starts with the standard scaffold
  - Edit components WITHIN the scaffold structure, do not recreate it
  - If verification fails due to stack violations, fix them immediately
```

**Effect**: Agent is explicitly instructed to:
1. Only use React+Vite stack
2. Never add competing frameworks
3. Work within existing scaffold
4. Self-correct when verification fails

## 🎯 Definition of Done (Phase 2)

✅ **Stack violations fail verification early**
- Forbidden deps detected before typecheck/build
- Missing files auto-fixed or reported
- Clear, actionable error messages

✅ **Typecheck/lint/build only run if stack passes**
- Stack Conformance check is FIRST step
- Immediate failure if non-conformant
- Prevents wasted time on broken stacks

✅ **Agent guardrails in place**
- System prompt enforces React+Vite only
- Verification loop forces compliance
- Autofix reduces friction for minor issues

## 📋 File Changes

### Created Files (2):
1. `packages/runtime/src/stack-autofix.ts` - Autofix utility
2. `PHASE2_COMPLETE.md` - This file

### Modified Files (2):
1. `packages/runtime/src/verifier.ts`
   - Added StackRules interface
   - Added checkReactViteStack() function
   - Modified run() to check stack conformance first
   - Integrated autofix capability

2. `packages/runtime/src/agent.ts`
   - Added STACK ENFORCEMENT section to system prompt
   - Positioned as CRITICAL (before other instructions)

### Compiled Files:
- `packages/runtime/dist/verifier.js` ✓
- `packages/runtime/dist/verifier.d.ts` ✓
- `packages/runtime/dist/stack-autofix.js` ✓
- `packages/runtime/dist/stack-autofix.d.ts` ✓

## 🧪 Testing Scenarios

### Scenario 1: Conformant App (Pass)
**Setup**:
- App has React 18, Vite 7, TypeScript 5, Tailwind 3
- All required files present
- No forbidden dependencies

**Expected Result**:
```
✓ Stack Conformance (React+Vite)
✓ Type Check
✓ Lint
✓ Build
All checks passed ✓
```

### Scenario 2: Missing Files (Auto-fixed)
**Setup**:
- App missing `vite.config.ts` and `tailwind.config.ts`
- Has correct dependencies

**Expected Result**:
```
✓ Stack Conformance (React+Vite)
  ✓ Auto-fixed 2 missing file(s):
    • vite.config.ts
    • tailwind.config.ts
✓ Type Check
✓ Lint
✓ Build
```

### Scenario 3: Forbidden Dependencies (Fail)
**Setup**:
- App has `next` in dependencies
- Otherwise conformant

**Expected Result**:
```
✗ Stack Conformance (React+Vite)
  Forbidden dependencies found: next - Remove these and use React+Vite instead

Some checks failed ✗
```
*(typecheck/lint/build skipped)*

### Scenario 4: Missing Dependencies (Fail)
**Setup**:
- App missing `react` and `vite`
- Has all files

**Expected Result**:
```
✗ Stack Conformance (React+Vite)
  Missing required dependencies: react, vite - Add these to package.json

Some checks failed ✗
```

## 🔒 Enforcement Layers

**Layer 1: Agent System Prompt**
- Explicit instructions to use React+Vite only
- Forbidden frameworks listed
- Self-correction encouraged

**Layer 2: Stack Conformance Check**
- Runs BEFORE any other verification
- Checks files, required deps, forbidden deps
- Auto-fixes minor issues (missing files)

**Layer 3: Actionable Errors**
- Clear messages: "Remove X", "Add Y to package.json"
- Agent can parse and act on these
- Verification loop ensures compliance

**Layer 4: Config-Driven Rules**
- Rules defined in `configs/agent.json`
- Centralized enforcement policy
- Easy to update without code changes

## 🚀 Integration with Existing Flow

**Before Phase 2**:
```
Agent makes changes
  ↓
Verification runs
  ↓ (typecheck might fail on wrong framework)
  ↓ (lint might fail)
  ↓ (build might fail)
  ↓
Generic errors, hard to diagnose
```

**After Phase 2**:
```
Agent makes changes
  ↓
Stack Conformance Check
  ↓ (PASS: stack is correct)
  ↓
Typecheck, Lint, Build
  ↓
Success ✓

OR

Agent makes changes
  ↓
Stack Conformance Check
  ↓ (FAIL: forbidden framework detected)
  ↓
Stop immediately
  ↓
Return clear error: "Remove 'next', use React+Vite"
  ↓
Agent can auto-correct
```

## 📊 Performance Impact

**Stack Check Timing**:
- File checks: ~5-10ms (depending on file count)
- Autofix: ~20-50ms (if files need copying)
- Dependency checks: <5ms (JSON parsing)
- **Total**: <100ms overhead per verification

**Benefits**:
- Saves minutes by failing fast (vs waiting for build errors)
- Auto-fixes reduce manual intervention
- Clear errors enable agent self-correction

## 🔧 Configuration Reference

**configs/agent.json** (enforcement section):
```json
{
  "enforcement": {
    "disallowDeps": ["next", "vue", "nuxt", "angular", "svelte", "solid-js"],
    "requireDeps": {
      "react": ">=18",
      "react-dom": ">=18",
      "vite": ">=7",
      "typescript": ">=5",
      "tailwindcss": ">=3"
    },
    "requireFiles": [
      "package.json",
      "vite.config.ts",
      "tailwind.config.ts",
      "postcss.config.cjs",
      "tsconfig.json",
      "src/main.tsx",
      "src/App.tsx",
      "src/index.css",
      "index.html"
    ]
  }
}
```

## 🐛 Troubleshooting

### Issue: Stack check always fails
**Solution**: Verify `configs/agent.json` is readable from workspace
- Path resolution: `{workingDir}/../configs/agent.json`
- Check file permissions

### Issue: Autofix not working
**Solution**: Verify scaffold template exists
- Path: `{projectRoot}/templates/react-vite-starter/`
- Check file permissions
- Ensure scaffold is complete (12 files)

### Issue: Agent ignores stack enforcement
**Solution**: Verify system prompt loaded
- Check agent.ts SYSTEM_PROMPT includes STACK ENFORCEMENT section
- Restart agent process after changes

## 📝 Next Steps (Phase 3)

Phase 2 establishes enforcement. Phase 3 will add:
1. **Code-gen helpers** - Component/page/hook templates
2. **ESLint + Prettier** - Linting defaults in scaffold
3. **Stack evaluations** - Automated tests for conformance
4. **CI gate** - Pre-commit stack validation

## ✅ Summary

Phase 2 successfully implements:
- ✅ Stack conformance verification (runs first)
- ✅ Autofix for missing files
- ✅ Agent system prompt enforcement
- ✅ Actionable error messages
- ✅ Hard fail on forbidden frameworks
- ✅ Compiled and ready to use

**The stack contract is now enforced at multiple layers, ensuring all generated apps are React 18 + TypeScript + Vite + Tailwind + shadcn/ui.**
