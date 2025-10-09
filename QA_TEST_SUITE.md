# Phase 3 QA Test Suite

## Overview
This document outlines the comprehensive QA test suite for the integrated EitherWay application, covering all Phase 3 functionality including streaming, file operations, session management, and preview capabilities.

## Test Environment Setup

### Prerequisites
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] PostgreSQL database connected
- [ ] ANTHROPIC_API_KEY configured in `.env`
- [ ] Feature flags enabled in `.env`:
  - `FEATURE_STREAMING_WS=true`
  - `FEATURE_FILE_OP_EVENTS=true`

### Optional: HTTPS Setup
```bash
cd integrated/backend
npm run setup:https
```

---

## Test 1: Basic Chat & Streaming

### Objective
Verify that the chat interface works correctly with WebSocket streaming protocol.

### Test Steps

#### 1.1 Initial Chat State
- [ ] Open browser to `http://localhost:5173`
- [ ] Verify landing page shows with example prompts
- [ ] Verify textarea is enabled and responsive

#### 1.2 Send First Message
- [ ] Type a simple prompt: "Hello, can you help me?"
- [ ] Press Enter or click Send button
- [ ] **Expected**:
  - Animation transitions from landing to chat view
  - WebSocket connection established (check DevTools Network → WS)
  - Message appears in chat history as user message

#### 1.3 Streaming Response
- [ ] Observe assistant response appearing
- [ ] **Expected**:
  - `assistant_started` event received (check WS frames)
  - Response text streams in via `assistant_delta` events
  - `assistant_complete` event marks end of stream
  - Loading indicator shown during streaming
  - Response appears in chat with proper formatting

#### 1.4 Multiple Messages
- [ ] Send 2-3 more messages in succession
- [ ] **Expected**:
  - Each message follows streaming protocol
  - Chat history preserves all messages
  - Scrolling works correctly
  - No memory leaks or UI lag

### Success Criteria
✅ WebSocket connection stable
✅ Streaming protocol events fire correctly
✅ UI updates in real-time
✅ Message history persists

---

## Test 2: File Operations Progress

### Objective
Verify that file operations emit progress events and UI displays them correctly.

### Test Steps

#### 2.1 File Creation
- [ ] Send prompt: "Create a file called test.txt with 'Hello World'"
- [ ] **Expected**:
  - FileOperationsProgress component appears (bottom-right)
  - Shows "Creating test.txt" with loading spinner
  - Progress completes with checkmark
  - Files tree updates with new file

#### 2.2 File Modification
- [ ] Send prompt: "Update test.txt to say 'Hello EitherWay'"
- [ ] **Expected**:
  - Progress shows "Writing test.txt"
  - Completes successfully
  - File content updates in workbench

#### 2.3 File Rename
- [ ] Send prompt: "Rename test.txt to greeting.txt"
- [ ] **Expected**:
  - Progress shows "Renaming test.txt → greeting.txt"
  - File renamed in tree
  - No errors

#### 2.4 File Deletion
- [ ] Send prompt: "Delete greeting.txt"
- [ ] **Expected**:
  - Progress shows "Deleting greeting.txt"
  - File removed from tree
  - Operation completes

#### 2.5 Error Handling
- [ ] Manually trigger an error (e.g., insufficient permissions)
- [ ] **Expected**:
  - Progress shows error state with red X icon
  - Error message displayed
  - Operation fails gracefully

### Success Criteria
✅ file_op events emit correctly (start/complete/error)
✅ FileOperationsProgress component displays all states
✅ Files tree syncs with operations
✅ Error states handled gracefully

---

## Test 3: Session Management

### Objective
Verify that session switching works without page reload and preserves workspace state.

### Test Steps

#### 3.1 Create Initial Session
- [ ] Start chat and create a few files
- [ ] Note the sessionId from localStorage: `currentSessionId`
- [ ] **Expected**: Files persist to database

#### 3.2 Create Second Session
- [ ] Open DevTools Console
- [ ] Run: `localStorage.setItem('currentSessionId', 'session-' + Date.now())`
- [ ] Refresh page
- [ ] **Expected**:
  - New session loads
  - Empty workspace
  - No files from previous session

#### 3.3 Switch Back to Original Session
- [ ] Set sessionId back to original
- [ ] Refresh page
- [ ] **Expected**:
  - Original files reappear
  - Chat history loads (if implemented)
  - No page reload required for session change

#### 3.4 Session Isolation
- [ ] Verify files from session A don't appear in session B
- [ ] Verify database stores files per session.app_id
- [ ] **Expected**: Complete isolation between sessions

### Success Criteria
✅ Session switching without reload works
✅ Workspace files isolated per session
✅ Files persist to database correctly
✅ WebSocket reconnects with new sessionId

---

## Test 4: WebContainer Preview

### Objective
Verify that WebContainer live preview works with HTTPS, CDN proxy, and COEP credentialless.

### Test Steps

#### 4.1 Boot WebContainer
- [ ] Send prompt: "Create a simple HTML page with 'Hello WebContainer'"
- [ ] Open Workbench (right panel)
- [ ] Switch to Preview tab
- [ ] **Expected**:
  - WebContainer boots (shows "Booting WebContainer..." overlay)
  - Preview iframe loads
  - HTML content displays

#### 4.2 CDN Proxy (External Resources)
- [ ] Send prompt: "Create HTML with an image from https://via.placeholder.com/150"
- [ ] Check Preview tab
- [ ] **Expected**:
  - Image loads successfully via `/api/proxy-cdn`
  - No CORS errors in console
  - COEP headers allow resource

#### 4.3 API Proxy (CoinGecko Example)
- [ ] Send prompt: "Fetch crypto price from https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
- [ ] **Expected**:
  - API request proxied via `/api/proxy-api`
  - Response data displays
  - CORS headers correct

#### 4.4 YouTube Embed
- [ ] Send prompt: "Create HTML with YouTube embed for dQw4w9WgXcQ"
- [ ] **Expected**:
  - Iframe uses `youtube-nocookie.com` (CDN rewriter)
  - Video embeds and plays
  - No mixed content errors

#### 4.5 Port Switching (Multiple Previews)
- [ ] Run a Vite dev server in WebContainer on port 5173
- [ ] Run another server on port 3000
- [ ] **Expected**:
  - Port dropdown shows both ports
  - Can switch between previews
  - URL updates correctly

#### 4.6 HTTPS Compatibility
- [ ] If HTTPS enabled, verify:
  - Preview loads without mixed content warnings
  - WebSocket to WebContainer works
  - Service Worker registers correctly

### Success Criteria
✅ WebContainer boots successfully
✅ CDN proxy handles external resources
✅ API proxy works with CORS
✅ YouTube embeds use nocookie domain
✅ Port switching functional
✅ HTTPS/COEP credentialless works

---

## Test 5: Error Handling

### Objective
Verify that errors are handled gracefully and displayed to users.

### Test Steps

#### 5.1 WebSocket Disconnection
- [ ] Kill backend server while chat is active
- [ ] **Expected**:
  - Toast notification: "Not connected to server"
  - Reconnect attempt when server restarts
  - No UI crash

#### 5.2 Invalid API Key
- [ ] Set invalid `ANTHROPIC_API_KEY` in `.env`
- [ ] Send a message
- [ ] **Expected**:
  - Error message shows: "Anthropic API Error: Invalid API key"
  - User notified via toast or chat
  - App doesn't crash

#### 5.3 Rate Limiting
- [ ] Send 51+ messages in one session (exceeds `DAILY_MESSAGE_LIMIT=50`)
- [ ] **Expected**:
  - Error message: "Rate limit exceeded: You have reached your daily limit of 50 messages"
  - Shows reset time
  - Prevents further messages

#### 5.4 Database Connection Loss
- [ ] Stop PostgreSQL database
- [ ] Attempt file operations
- [ ] **Expected**:
  - Graceful fallback or error message
  - App continues to function in degraded mode
  - No crashes

#### 5.5 File Operation Failures
- [ ] Attempt to write to invalid path (e.g., `/../../etc/passwd`)
- [ ] **Expected**:
  - Path traversal blocked (403 Forbidden)
  - Error logged
  - User notified

### Success Criteria
✅ All errors display user-friendly messages
✅ No unhandled exceptions in console
✅ App recovers gracefully from failures
✅ Security validations work (path traversal, etc.)

---

## Test 6: Rate Limiting

### Objective
Verify that rate limiting works correctly per session.

### Test Steps

#### 6.1 Check Initial Limit
- [ ] Fresh session starts
- [ ] Send 1 message
- [ ] Check database: `SELECT * FROM message_counts WHERE session_id = 'session-xxx'`
- [ ] **Expected**: count = 1

#### 6.2 Approach Limit
- [ ] Send 49 more messages (total 50)
- [ ] **Expected**:
  - All messages process successfully
  - count = 50 in database

#### 6.3 Exceed Limit
- [ ] Send 51st message
- [ ] **Expected**:
  - Error: "Rate limit exceeded"
  - Message not processed
  - count remains 50

#### 6.4 Reset After 24 Hours
- [ ] Manually update `last_reset` in database to 25 hours ago
- [ ] Send new message
- [ ] **Expected**:
  - Rate limit resets
  - count = 1 (new day)
  - Message processes

#### 6.5 Per-Session Isolation
- [ ] Switch to new session
- [ ] **Expected**:
  - New session has limit = 50
  - Independent from other session

### Success Criteria
✅ Rate limiting enforces 50 messages/day per session
✅ Resets correctly after 24 hours
✅ Isolated per session
✅ Error messages clear and helpful

---

## Acceptance Criteria Checklist

### Phase 3 Requirements

#### ✅ Streaming & Events
- [x] assistant_started/delta/complete events working
- [x] file_op events (start/complete/error) emitted
- [x] FileOperationsProgress UI displays correctly
- [x] Feature flags control event emission

#### ✅ Preview & Hardening
- [x] PreviewPaneCore preserves stable WebContainer internals
- [x] PreviewEnhanced wraps with stripped-fe chrome
- [x] HTTPS setup script available (setup:https)
- [x] CDN proxy routes (/api/proxy-cdn, /api/proxy-api) working
- [x] COEP credentialless configured
- [x] YouTube embeds use nocookie domain

#### ✅ Session Management
- [x] Session-centric API functional
- [x] Session switching without reload
- [x] Files scoped to sessions
- [x] WebSocket connects with sessionId

#### ✅ Security & Error Handling
- [x] Path traversal protection
- [x] Rate limiting per session
- [x] Graceful error handling
- [x] User-friendly error messages

---

## Rollout Checklist

### Pre-Deployment
- [ ] All QA tests passing
- [ ] Feature flags tested (on/off states)
- [ ] Database migrations run
- [ ] Environment variables documented

### Deployment
- [ ] Backend deployed with feature flags enabled
- [ ] Frontend deployed with WebSocket URL configured
- [ ] HTTPS certificates installed (production)
- [ ] Database backup completed

### Post-Deployment
- [ ] Smoke test: Send a message and verify streaming
- [ ] Monitor WebSocket connections for stability
- [ ] Check logs for errors
- [ ] Verify CDN proxy working with real traffic

### Rollback Plan
- [ ] Feature flags can disable streaming if needed
- [ ] Database state rollback script ready
- [ ] Previous version deployment ready

---

## Performance Metrics

### Target Benchmarks
- WebSocket connection time: < 500ms
- First message response time: < 2s (depends on Claude API)
- File operation latency: < 100ms
- Preview boot time: < 3s
- CDN proxy response time: < 1s

### Monitoring
- Track WebSocket connection success rate
- Monitor error rates per endpoint
- Log rate limit hits per day
- Track WebContainer boot failures

---

## Known Limitations

1. **WebContainer Browser Support**: Only works in Chromium-based browsers (Chrome, Edge, Brave)
2. **HTTPS Requirement**: WebContainer requires HTTPS or localhost
3. **Rate Limiting**: Hard limit of 50 messages/day per session (configurable via env)
4. **Session Persistence**: Sessions stored in localStorage (cleared on browser data wipe)

---

## Troubleshooting Guide

### Issue: WebSocket won't connect
- Check backend is running on correct port
- Verify CORS settings
- Check browser console for errors
- Ensure sessionId in URL query

### Issue: Preview won't load
- Verify HTTPS certificates installed
- Check COEP headers in DevTools
- Ensure WebContainer boot completed
- Check for mixed content errors

### Issue: File operations fail
- Verify database connection
- Check PostgreSQL logs
- Ensure session.app_id exists
- Validate file paths (no traversal)

### Issue: Streaming doesn't work
- Check `FEATURE_STREAMING_WS=true` in .env
- Verify WebSocket messages in DevTools
- Ensure backend emitting correct events
- Check useWebSocket hook implementation

---

## Test Report Template

```markdown
# QA Test Report - Phase 3

**Date**: [YYYY-MM-DD]
**Tester**: [Name]
**Environment**: [Dev/Staging/Prod]
**Build Version**: [commit hash]

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Basic Chat & Streaming | ✅ Pass | All streaming events working |
| Test 2: File Operations Progress | ✅ Pass | UI updates correctly |
| Test 3: Session Management | ✅ Pass | Switching works without reload |
| Test 4: WebContainer Preview | ✅ Pass | CDN proxy and COEP working |
| Test 5: Error Handling | ✅ Pass | Graceful failures |
| Test 6: Rate Limiting | ✅ Pass | 50 msg/day enforced |

## Issues Found

1. [Issue description]
   - Severity: [Low/Medium/High/Critical]
   - Steps to reproduce: [...]
   - Expected: [...]
   - Actual: [...]

## Recommendations

[Any suggestions for improvements]

## Sign-off

- [ ] All critical tests passing
- [ ] No blockers for deployment
- [ ] Documentation updated
```

---

**Last Updated**: 2025-10-09
**Phase**: 3 - Preview & Final Assembly
