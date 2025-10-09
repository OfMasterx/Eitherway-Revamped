# 🚀 EitherWay Integrated - Complete Setup Guide

## Prerequisites

- ✅ **Node.js** v18+ (you have v22.14.0)
- ✅ **pnpm** v8+ (you have v9.4.0)
- ✅ **Docker** (for PostgreSQL)
- ⚠️ **Anthropic API Key** - Get from https://console.anthropic.com

---

## 📋 Setup Steps

### 1. Start PostgreSQL Database

```bash
cd /home/kevin/H8-able/integrated

# Start PostgreSQL container
docker compose up -d

# Verify it's running
docker ps | grep postgres

# Expected output: eitherway-integrated-postgres running on port 5432
```

**Troubleshooting**:
- If port 5432 is already in use, edit `docker-compose.yml` and change `POSTGRES_PORT`
- Check logs: `docker logs eitherway-integrated-postgres`

---

### 2. Configure Environment Variables

```bash
cd /home/kevin/H8-able/integrated/backend

# Edit .env and add your Anthropic API key
nano .env  # or use your preferred editor
```

**Update this line**:
```bash
# Change from:
# ANTHROPIC_API_KEY=

# To:
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**Verify your .env looks like**:
```bash
# Server Configuration
PORT=3001
WORKSPACE_DIR=./workspace

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eitherway
USE_LOCAL_FS=false

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here

# Feature Flags (Phase 3)
FEATURE_STREAMING_WS=true
FEATURE_FILE_OP_EVENTS=true

# Rate Limiting
DAILY_MESSAGE_LIMIT=50
```

---

### 3. Install All Dependencies

```bash
cd /home/kevin/H8-able/integrated

# Install all workspace dependencies (backend + frontend + all packages)
pnpm install

# This will install dependencies for:
# - Root workspace
# - backend/
# - backend/database/
# - backend/runtime/
# - backend/tools-core/
# - backend/tools-impl/
# - frontend/
```

**Expected output**:
```
Packages: +XXX
Progress: resolved XXX, reused XXX, downloaded XXX, added XXX
```

---

### 4. Build Backend Packages

The backend has several internal packages that need to be compiled before the main server can run.

```bash
cd /home/kevin/H8-able/integrated

# Build all backend TypeScript packages (database, runtime, tools)
pnpm run build:packages

# This compiles:
# - backend/database (PostgresFileStore, SessionsRepository, etc.)
# - backend/runtime (Agent, DatabaseAgent, ConfigLoader)
# - backend/tools-core (Base tool definitions)
# - backend/tools-impl (Actual tool implementations)
```

**Expected output**:
```
> @eitherway/database@1.0.0 build
> tsc

> @eitherway/runtime@1.0.0 build
> tsc

> @eitherway/tools-core@1.0.0 build
> tsc

> @eitherway/tools-impl@1.0.0 build
> tsc
```

---

### 5. Run Database Migrations

Now that the database package is built, initialize the database schema.

```bash
cd /home/kevin/H8-able/integrated/backend/database

# Run all migrations (creates tables, indexes, etc.)
pnpm run migrate

# This will execute:
# - 001_initial_schema.sql (apps, sessions, files, file_versions)
# - 002_phase2_schema.sql (events, message_counts)
# - 003_phase3_performance.sql (performance indexes)
# - 004_vfs_optimizations.sql (VFS optimizations)
# - 005_fix_index_size.sql (index improvements)
# - 006_rate_limiting.sql (rate limiting tables)
```

**Expected output**:
```
Running migration: 001_initial_schema.sql
✓ Migration completed successfully

Running migration: 002_phase2_schema.sql
✓ Migration completed successfully

... (all migrations)

All migrations completed successfully!
```

**Troubleshooting**:
- If migrations fail, check PostgreSQL is running: `docker ps`
- Verify DATABASE_URL in .env is correct
- Check database logs: `docker logs eitherway-integrated-postgres`

---

### 6. Optional: Enable HTTPS (Recommended for WebContainer)

WebContainer works best with HTTPS to avoid mixed content issues.

```bash
cd /home/kevin/H8-able/integrated

# Run HTTPS setup script (uses mkcert)
pnpm run setup:https

# If mkcert isn't installed:
# Linux: See script output for instructions
# macOS: brew install mkcert
# Windows: choco install mkcert OR scoop install mkcert
```

**Expected output**:
```
🔐 Setting up HTTPS for local development...
📝 Installing local CA...
✓ Local CA installed successfully
🔑 Generating certificates for localhost...
✅ HTTPS setup complete!

Certificates stored in: /home/kevin/H8-able/integrated/.certs
```

**Note**: You can skip this for now and run HTTP mode. HTTPS is only required for advanced WebContainer features.

---

### 7. Start the Application

Now you're ready to run the integrated app!

#### Option A: Run Both Backend + Frontend Together (Recommended)

```bash
cd /home/kevin/H8-able/integrated

# Start both servers concurrently
pnpm run dev

# This starts:
# - Backend on http://localhost:3001 (or https if certs installed)
# - Frontend on http://localhost:5173
```

#### Option B: Run Backend and Frontend Separately

**Terminal 1 - Backend**:
```bash
cd /home/kevin/H8-able/integrated
pnpm run dev:backend

# Expected output:
# 🚀 EitherWay UI Server running on http://localhost:3001
# 📁 Workspace: ./workspace
# ✓ Database connected - using DB-backed VFS
```

**Terminal 2 - Frontend**:
```bash
cd /home/kevin/H8-able/integrated
pnpm run dev:frontend

# Expected output:
# VITE v5.x.x  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

---

### 8. Open the App

Open your browser to:
```
http://localhost:5173
```

You should see the EitherWay chat interface with example prompts!

---

## ✅ Verify Everything Works

### Test 1: Chat Streaming
1. Type a message: "Hello, can you help me?"
2. Press Enter
3. ✅ You should see:
   - Animation transitions to chat view
   - Assistant response streams in real-time
   - No errors in browser console

### Test 2: File Operations
1. Send: "Create a file called test.txt with 'Hello World'"
2. ✅ You should see:
   - File operation progress in bottom-right corner
   - "Creating test.txt" → ✓ Complete
   - Workbench panel opens with file tree showing test.txt

### Test 3: Preview
1. Send: "Create a simple HTML page with 'Hello WebContainer'"
2. Click the Workbench panel (right side)
3. Switch to "Preview" tab
4. ✅ You should see:
   - "Booting WebContainer..." overlay
   - Preview loads with your HTML content
   - No COEP errors in console

### Test 4: Database Persistence
1. Create a few files via chat
2. Stop the servers (Ctrl+C)
3. Restart: `pnpm run dev`
4. Refresh browser
5. ✅ Files should still be there (stored in PostgreSQL)

---

## 🛠️ Useful Commands

```bash
# From /home/kevin/H8-able/integrated:

# Development
pnpm run dev              # Start both backend + frontend
pnpm run dev:backend      # Start backend only
pnpm run dev:frontend     # Start frontend only

# Building
pnpm run build            # Build everything for production
pnpm run build:packages   # Build backend packages only
pnpm run build:frontend   # Build frontend only

# Database
cd backend/database
pnpm run migrate          # Run all migrations
pnpm run migrate:create   # Create a new migration

# Utilities
pnpm run setup:https      # Setup HTTPS certificates
pnpm run clean            # Remove all node_modules and dist folders

# Docker
docker compose up -d      # Start PostgreSQL
docker compose down       # Stop PostgreSQL
docker compose logs       # View PostgreSQL logs
docker compose ps         # Check PostgreSQL status
```

---

## 🐛 Troubleshooting

### PostgreSQL Connection Errors

**Error**: `connection refused` or `database does not exist`

**Fix**:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker compose up -d

# Verify database exists
docker exec -it eitherway-integrated-postgres psql -U postgres -c "\l"

# Should show 'eitherway' database
```

### Build Errors

**Error**: `Cannot find module '@eitherway/database'`

**Fix**:
```bash
# Rebuild backend packages
cd /home/kevin/H8-able/integrated
pnpm run build:packages
```

### WebSocket Connection Failed

**Error**: `WebSocket connection to 'ws://localhost:3001/api/agent' failed`

**Fix**:
1. Check backend is running: `curl http://localhost:3001/api/health`
2. Verify .env has correct PORT=3001
3. Check backend logs for errors

### Anthropic API Errors

**Error**: `Invalid API key`

**Fix**:
1. Verify ANTHROPIC_API_KEY in `backend/.env` is correct
2. Check you have credits at https://console.anthropic.com
3. Restart backend after changing .env

### HTTPS Certificate Issues

**Error**: Browser shows security warning

**Fix**:
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to localhost (unsafe)"
- Or install mkcert CA: `mkcert -install` (requires sudo)

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Fix**:
```bash
# Check what's using the port
lsof -i :3001  # or :5173

# Kill the process
kill -9 <PID>

# Or change port in .env / vite.config.ts
```

---

## 📁 Project Structure

```
integrated/
├── backend/                    # Backend server
│   ├── src/
│   │   ├── server.ts          # Main Fastify server
│   │   ├── ws-manager.ts      # WebSocket connection manager
│   │   ├── types.ts           # Agent Event Protocol
│   │   ├── cdn-rewriter.ts    # CDN proxy logic
│   │   └── routes/
│   │       ├── sessions.ts    # Session management
│   │       └── session-files.ts  # File operations
│   ├── database/              # Database package
│   │   └── src/
│   │       ├── index.ts       # PostgresFileStore, Repositories
│   │       └── migrations/    # SQL migration files
│   ├── runtime/               # Agent runtime
│   │   └── src/
│   │       └── index.ts       # Agent, DatabaseAgent
│   ├── tools-core/            # Tool definitions
│   ├── tools-impl/            # Tool implementations
│   └── .env                   # Backend configuration
├── frontend/                  # Remix frontend
│   ├── app/
│   │   ├── components/
│   │   │   ├── chat/         # Chat components
│   │   │   └── workbench/    # Workbench + Preview
│   │   └── lib/
│   │       ├── hooks/        # useWebSocket, etc.
│   │       └── stores/       # Nanostores (chat, workbench)
│   └── vite.config.ts
├── scripts/
│   └── setup-https.sh        # HTTPS setup script
├── docker-compose.yml        # PostgreSQL container config
├── pnpm-workspace.yaml       # pnpm workspace config
└── package.json              # Root scripts
```

---

## 🎯 Next Steps

1. **Read the Phase Documentation**:
   - `PHASE1_README.md` - Infrastructure & Protocol
   - `PHASE2_README.md` - UI/UX & Streaming
   - `PHASE3_README.md` - Preview & Final Assembly

2. **Run QA Tests**:
   - Follow `QA_TEST_SUITE.md` for comprehensive testing

3. **Customize Configuration**:
   - Adjust rate limits in .env (DAILY_MESSAGE_LIMIT)
   - Configure CoinGecko API keys if needed
   - Add custom tools in backend/tools-impl

4. **Deploy to Production**:
   - See PHASE3_README.md → "Deployment Instructions"

---

## 📚 Additional Resources

- **WebContainer Docs**: https://webcontainer.io
- **Anthropic Claude API**: https://docs.anthropic.com
- **Remix Framework**: https://remix.run/docs
- **Fastify**: https://fastify.dev

---

**Setup Complete!** 🎉

If you encounter any issues, check the troubleshooting section or review the error logs in:
- Backend: Terminal running `pnpm run dev:backend`
- Frontend: Terminal running `pnpm run dev:frontend`
- Database: `docker logs eitherway-integrated-postgres`
