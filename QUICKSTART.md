# ⚡ Quick Start Guide

Your environment is already configured! Follow these steps to get running.

## 🎯 TL;DR - Get Running in 5 Minutes

```bash
cd /home/kevin/H8-able/integrated

# 1. Start PostgreSQL (port 5433)
docker compose up -d

# 2. Install all dependencies
pnpm install

# 3. Build backend packages
pnpm run build:packages

# 4. Run database migrations
cd backend/database && pnpm run migrate && cd ../..

# 5. Start the app!
pnpm run dev

# 6. Open browser to http://localhost:5173
```

---

## 📝 Detailed Steps

### Step 1: Start PostgreSQL Database

Your PostgreSQL is configured to run on **port 5433** (not the default 5432).

```bash
cd /home/kevin/H8-able/integrated

# Start PostgreSQL container
docker compose up -d

# Verify it's running
docker ps | grep postgres

# Expected: eitherway-integrated-postgres running on 0.0.0.0:5433
```

### Step 2: Install Dependencies with pnpm

```bash
# Install all workspace packages
pnpm install

# This installs:
# - Root workspace (concurrently, etc.)
# - backend + all sub-packages (database, runtime, tools)
# - frontend (Remix, React, WebContainer, etc.)
```

**Expected**: ~1-2 minutes, hundreds of packages installed.

### Step 3: Build Backend Packages

The backend has TypeScript packages that must be compiled first:

```bash
pnpm run build:packages

# Compiles:
# - @eitherway/database → dist/ (PostgresFileStore, repositories)
# - @eitherway/runtime → dist/ (Agent, DatabaseAgent)
# - @eitherway/tools-core → dist/ (Tool base classes)
# - @eitherway/tools-impl → dist/ (Actual tools: file, shell, etc.)
```

**Expected**: ~30 seconds, no errors.

### Step 4: Run Database Migrations

Initialize the database schema with all tables and indexes:

```bash
cd backend/database
pnpm run migrate

# This runs 6 migrations:
# - 001_initial_schema.sql (apps, sessions, files, file_versions)
# - 002_phase2_schema.sql (events, message_counts)
# - 003_phase3_performance.sql (performance indexes)
# - 004_vfs_optimizations.sql (VFS optimizations)
# - 005_fix_index_size.sql (index size fixes)
# - 006_rate_limiting.sql (rate limiting)
```

**Expected**:
```
Running migration: 001_initial_schema.sql
✓ Migration completed successfully
...
All migrations completed successfully!
```

**Troubleshooting**:
- If it fails, check PostgreSQL is running: `docker ps`
- Check DATABASE_URL matches port 5433 in `backend/.env`

### Step 5: Start the Application

```bash
# From integrated root
cd /home/kevin/H8-able/integrated

# Start both backend + frontend
pnpm run dev
```

**Expected**:
```
[backend] 🚀 EitherWay UI Server running on http://localhost:3001
[backend] 📁 Workspace: ./workspace
[backend] ✓ Database connected - using DB-backed VFS
[frontend] VITE v5.x.x  ready in XXX ms
[frontend] ➜  Local:   http://localhost:5173/
```

### Step 6: Open in Browser

```
http://localhost:5173
```

You should see the EitherWay chat interface! 🎉

---

## ✅ Quick Tests

### Test Chat Streaming
1. Type: "Hello, can you help me create a React app?"
2. Press Enter
3. ✅ Assistant response streams in real-time

### Test File Operations
1. Send: "Create a file test.txt with 'Hello World'"
2. ✅ See progress indicator in bottom-right: "Creating test.txt" → ✓
3. ✅ Workbench opens showing file tree with test.txt

### Test Preview
1. Send: "Create an HTML page that says Hello"
2. Open Workbench panel (right side)
3. Click "Preview" tab
4. ✅ WebContainer boots and displays your HTML

---

## 🔧 Useful Commands

```bash
# Development
pnpm run dev              # Start both backend + frontend
pnpm run dev:backend      # Backend only (http://localhost:3001)
pnpm run dev:frontend     # Frontend only (http://localhost:5173)

# Database
docker compose up -d      # Start PostgreSQL
docker compose down       # Stop PostgreSQL
docker compose logs -f    # View PostgreSQL logs

# Rebuild
pnpm run build:packages   # Rebuild backend packages
pnpm run clean            # Delete all node_modules & dist

# Migrations
cd backend/database
pnpm run migrate          # Run migrations
```

---

## 🐛 Common Issues

### PostgreSQL Connection Failed

**Error**: `connect ECONNREFUSED 127.0.0.1:5433`

**Fix**:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker compose up -d

# Verify port 5433 is exposed
docker port eitherway-integrated-postgres
```

### Build Errors: Cannot find module '@eitherway/...'

**Error**: `Cannot find module '@eitherway/database'`

**Fix**:
```bash
# Rebuild backend packages
pnpm run build:packages

# If still failing, clean and reinstall
pnpm run clean
pnpm install
pnpm run build:packages
```

### WebSocket Connection Failed

**Error**: `WebSocket connection failed`

**Fix**:
1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check backend terminal for errors
3. Ensure DATABASE_URL is correct in `backend/.env`

---

## 📊 Your Configuration

From your root `.env`:

- ✅ **Anthropic API Key**: Configured
- ✅ **PostgreSQL**: Port 5433, database `eitherway`
- ✅ **CoinGecko API**: Demo key configured
- ✅ **Feature Flags**: Streaming + File Ops enabled

**Database Connection String**:
```
postgresql://postgres:postgres@localhost:5433/eitherway
```

---

## 🎯 What's Working

After setup, you'll have:

- ✅ **WebSocket Streaming**: Real-time chat with Claude
- ✅ **File Operations**: Create/edit/delete files with progress UI
- ✅ **Database VFS**: Files persist to PostgreSQL
- ✅ **WebContainer Preview**: Live preview of web apps
- ✅ **CDN Proxy**: External resources proxied for COEP compliance
- ✅ **Rate Limiting**: 50 messages/day per session
- ✅ **Session Management**: Multiple isolated sessions

---

## 📚 Next Steps

1. **Read Phase Docs**:
   - `PHASE1_README.md` - Architecture & protocol
   - `PHASE2_README.md` - UI/UX & streaming
   - `PHASE3_README.md` - Preview integration

2. **Run QA Tests**: Follow `QA_TEST_SUITE.md`

3. **Optional HTTPS**: Run `pnpm run setup:https` for WebContainer HTTPS

---

**Ready to code!** 🚀

For detailed setup info, see `SETUP.md`.
For troubleshooting, check backend/frontend logs or `docker logs eitherway-integrated-postgres`.
