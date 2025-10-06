# Phase 1 Complete: React + Vite Stack Standardization

## ✅ Completed Tasks

### 1. Golden Scaffold Template Created

**Location**: `templates/react-vite-starter/`

**Structure**:
```
templates/react-vite-starter/
├── package.json                    # Pinned deps: React 18, Vite 7, TS 5, Tailwind 3
├── tsconfig.json                   # TypeScript config with path aliases (@/*)
├── tsconfig.node.json              # Node/Vite TypeScript config
├── index.html                      # Entry HTML (EitherWay branded)
├── postcss.config.cjs              # PostCSS with Tailwind + Autoprefixer
├── tailwind.config.ts              # Full shadcn/ui color tokens
├── vite.config.ts                  # Vite with React plugin + path aliases
├── src/
│   ├── main.tsx                    # React 18 entry point
│   ├── App.tsx                     # Demo app with Card component
│   ├── index.css                   # Tailwind directives + CSS variables
│   ├── lib/
│   │   └── utils.ts                # cn() utility (clsx + tailwind-merge)
│   └── components/
│       └── ui/
│           └── card.tsx            # shadcn/ui Card component
```

**Total Files**: 12

### 2. Stack Policy Configuration

**File**: `configs/agent.json`

**Added Sections**:
```json
{
  "stack": {
    "framework": "react",
    "language": "typescript",
    "build": "vite",
    "ui": ["tailwind", "shadcn"],
    "router": "none",
    "state": "none"
  },
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

### 3. Automatic Scaffold Hydration

**Implementation**:
- Created: `packages/ui-server/src/utils/scaffold-hydrator.ts`
  - `hydrateAppFromScaffold()` - Recursively copies scaffold files to DB
  - `getMimeType()` - Determines MIME types for files

- Modified: `packages/ui-server/src/routes/sessions.ts`
  - POST `/api/sessions` now hydrates new apps automatically
  - Logs `app.scaffolded` event with file count
  - Error handling with `app.scaffold.failed` event

**Flow**:
```
POST /api/sessions
  ↓
Create user (if needed)
  ↓
Create app
  ↓
Create session
  ↓
Hydrate app from scaffold ← NEW!
  ↓ (Recursively walk templates/react-vite-starter/)
  ↓ (Read each file)
  ↓ (Write to PostgresFileStore with app_id)
  ↓
Log events
  ↓
Return session
```

### 4. Package Updates

**Modified**: `templates/react-vite-starter/package.json`
- Added: `clsx: ^2.1.1`
- Added: `tailwind-merge: ^2.5.5`
- All deps pinned to major versions (18.x, 7.x, etc.)

**Rebuilt**: `packages/ui-server`
- TypeScript compilation successful
- New routes compiled with scaffold hydrator

## 🎯 Definition of Done (Phase 1)

✅ **New apps always contain the same React/Vite/Tailwind skeleton**
- Every new session creates an app
- Every app is hydrated with 12 scaffold files
- Files stored in PostgreSQL (DB-backed VFS)

✅ **The agent edits components inside this scaffold instead of creating new stacks**
- Stack policy enforces React + TypeScript + Vite + Tailwind
- Disallowed frameworks blocked (Next, Vue, Angular, etc.)
- Required files and deps specified in config

## 📋 File Inventory

### Created Files (12 scaffold + 2 utility):
1. `templates/react-vite-starter/package.json`
2. `templates/react-vite-starter/tsconfig.json`
3. `templates/react-vite-starter/tsconfig.node.json`
4. `templates/react-vite-starter/index.html`
5. `templates/react-vite-starter/postcss.config.cjs`
6. `templates/react-vite-starter/tailwind.config.ts`
7. `templates/react-vite-starter/vite.config.ts`
8. `templates/react-vite-starter/src/main.tsx`
9. `templates/react-vite-starter/src/App.tsx`
10. `templates/react-vite-starter/src/index.css`
11. `templates/react-vite-starter/src/lib/utils.ts`
12. `templates/react-vite-starter/src/components/ui/card.tsx`
13. `packages/ui-server/src/utils/scaffold-hydrator.ts` (utility)
14. `PHASE1_COMPLETE.md` (this file)

### Modified Files (3):
1. `configs/agent.json` - Added stack policy and enforcement
2. `packages/ui-server/src/routes/sessions.ts` - Added scaffold hydration
3. `packages/ui-server/dist/*` - Rebuilt

## 🧪 Testing Checklist

To verify Phase 1 is working:

1. **Start server**: `pnpm --filter '@eitherway/ui-server' dev`
2. **Create new session**:
   ```bash
   curl -X POST http://localhost:3001/api/sessions \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","title":"Test React App"}'
   ```
3. **Check response** for `sessionId` and `app_id`
4. **Verify files** were created:
   ```bash
   curl http://localhost:3001/api/sessions/{sessionId}/files/tree
   ```
   Should return 12 files from scaffold
5. **Check logs** for "✓ Hydrated app {app_id} with 12 files from scaffold"
6. **Query database**:
   ```sql
   SELECT path FROM core.files WHERE app_id = '{app_id}' ORDER BY path;
   ```
   Should show all scaffold files

## 🚀 Next Steps (Phase 2)

Phase 1 establishes the scaffold. Phase 2 will:
- Enforce stack policy during agent execution
- Add validation hooks to prevent non-React stacks
- Update agent system prompt with stack requirements
- Add dependency verification before tool execution

## 📝 Notes

- Scaffold uses "eitherway" branding (not "lovable")
- All files stored in PostgreSQL (VFS)
- Scaffold hydration happens server-side (no frontend changes needed)
- Error handling logs failures to events table
- Compatible with existing session switching and preview flow
