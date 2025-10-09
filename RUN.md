# 🚀 Running EitherWay Integrated

## Quick Start (Both Together)

```bash
cd /home/kevin/H8-able/integrated
pnpm run dev
```

This starts:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

Then open **http://localhost:5173** in your browser.

---

## Run Backend & Frontend Separately

### Option 1: Using pnpm scripts

**Terminal 1 - Backend**:
```bash
cd /home/kevin/H8-able/integrated
pnpm run dev:backend
```

**Terminal 2 - Frontend**:
```bash
cd /home/kevin/H8-able/integrated
pnpm run dev:frontend
```

### Option 2: Using shell scripts

**Terminal 1 - Backend**:
```bash
/home/kevin/H8-able/integrated/run-backend.sh
```

**Terminal 2 - Frontend**:
```bash
/home/kevin/H8-able/integrated/run-frontend.sh
```

---

## What's Running

### Backend (Port 3001)
- ✅ WebSocket server for real-time streaming
- ✅ Database connected (PostgreSQL on port 5433)
- ✅ Agent runtime with all tools
- ✅ CDN proxy endpoints
- ✅ Session API
- ⚠️ HTTP mode (run `pnpm run setup:https` for HTTPS)

### Frontend (Port 5173)
- ✅ Vite dev server with HMR
- ✅ Remix app with React
- ✅ WebSocket client
- ✅ WebContainer ready

---

## Database Commands

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# View PostgreSQL logs
docker logs -f eitherway-integrated-postgres

# Check PostgreSQL status
docker ps | grep postgres

# Run migrations (if needed)
cd backend/database && pnpm run migrate
```

---

## Useful Dev Commands

```bash
# Rebuild backend packages (if you change code)
pnpm run build:packages

# Clean everything
pnpm run clean

# Reinstall all dependencies
pnpm install

# Setup HTTPS (optional, for WebContainer)
pnpm run setup:https
```

---

## Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3001 | http://localhost:3001 |
| Frontend | 5173 | http://localhost:5173 |
| PostgreSQL | 5433 | localhost:5433 |
| WebSocket | 3001 | ws://localhost:3001/api/agent |

---

## Quick Tests

### 1. Test Backend Health
```bash
curl http://localhost:3001/api/health
```

Expected:
```json
{
  "status": "ok",
  "workspace": "./workspace",
  "database": "connected"
}
```

### 2. Test Chat
1. Open http://localhost:5173
2. Type: "Hello, can you help me?"
3. ✅ See streaming response

### 3. Test File Operations
1. Send: "Create a file test.txt with 'Hello World'"
2. ✅ See progress indicator (bottom-right)
3. ✅ See file in workbench

### 4. Test Preview
1. Send: "Create an HTML page"
2. Click Workbench panel (right)
3. Switch to Preview tab
4. ✅ WebContainer boots and shows preview

---

## Environment Variables

All configured in `/home/kevin/H8-able/integrated/backend/.env`:

- ✅ `ANTHROPIC_API_KEY` - Set
- ✅ `DATABASE_URL` - postgresql://localhost:5433/eitherway
- ✅ `FEATURE_STREAMING_WS` - true
- ✅ `FEATURE_FILE_OP_EVENTS` - true
- ✅ `COINGECKO_DEMO_API_KEY` - Set

---

## Troubleshooting

### Backend won't start

**Check workspace packages are built**:
```bash
pnpm run build:packages
```

**Check configs exist**:
```bash
ls -la configs/
# Should see: anthropic.json, agent.json
```

**Check PostgreSQL is running**:
```bash
docker ps | grep postgres
```

### Frontend can't connect to backend

**Verify backend is running**:
```bash
curl http://localhost:3001/api/health
```

**Check WebSocket connection** in browser DevTools:
- Network tab → WS filter
- Should see connection to `ws://localhost:3001/api/agent`

### Database errors

**Restart PostgreSQL**:
```bash
docker compose restart
```

**Check database exists**:
```bash
docker exec -it eitherway-integrated-postgres psql -U postgres -l
```

---

## Stop Everything

```bash
# Stop backend + frontend (Ctrl+C in terminal)

# Stop PostgreSQL
docker compose down
```

---

**Ready to code!** 🚀

Open http://localhost:5173 and start chatting!
