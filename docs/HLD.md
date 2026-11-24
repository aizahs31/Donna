# Donna – High Level Design (HLD)

| Field | Value |
|---|---|
| Scope | System architecture of the Donna workspace |
| Last updated | 2026-11-24 |
| Related docs | [PRD.md](PRD.md), [LLD.md](LLD.md) |

---

## 1. Purpose

This document describes Donna's major components, how they interact, where data lives, and how the system is deployed. Component internals, API schemas and algorithms are in [LLD.md](LLD.md).

## 2. System context

```
                    ┌──────────────────────────┐
                    │          User            │
                    │   (desktop / mobile)     │
                    └────────────┬─────────────┘
                                 │ HTTPS
                                 ▼
┌───────────────────────────────────────────────────────────────┐
│               Frontend SPA (React 19 + Vite)                  │
│  Landing  │  Workspace: Donna chat · Tasks · Calendar ·       │
│           │  Pomodoro · Spotify · Time · Theme                │
│  localStorage: tasks, workspace-theme                         │
└───────┬───────────────────────────────┬───────────────────────┘
        │ REST (JSON)                   │ iframe embed
        ▼                               ▼
┌───────────────────────────┐    ┌─────────────────────┐
│ Backend API               │    │ Spotify Embed       │
│ Node.js + Express 5       │    │ open.spotify.com    │
│ /chat /events /auth       │    └─────────────────────┘
│ token.json (OAuth tokens) │
└──────┬──────────────┬─────┘
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────────────────┐
│ Gemini API   │  │ Google OAuth 2.0 +       │
│ 2.0 Flash    │  │ Google Calendar API v3   │
└──────────────┘  └──────────────────────────┘
```

## 3. Architecture style

- **Client-heavy SPA + thin API gateway.** The browser owns UI state and task data. The backend exists to hold secrets (Gemini key, OAuth client secret), call Google APIs, and turn LLM output into actions.
- **LLM as intent parser.** Gemini gets a system prompt that forces JSON output for 5 intents. The backend parses the JSON and runs the matching action. Any other reply is plain conversation.
- **Split action execution.**
  - Calendar actions run **server-side**, because they need OAuth tokens.
  - Task actions run **client-side**, because tasks live in `localStorage`. The backend only returns an action descriptor.

## 4. Components

### 4.1 Frontend (`frontend/`)

| Component | Responsibility |
|---|---|
| `App.jsx` | Router: `/` Landing, `/workspace` Workspace |
| `pages/landing.jsx` | Marketing page, feature cards, "Connect" button that starts OAuth |
| `pages/workspace.jsx` | Grid layout, theme settings panel, Donna floating button |
| `components/Donna.jsx` | Chat UI, sends `/chat`, applies returned task actions, triggers calendar reload |
| `components/Task.jsx` | Task CRUD, drag reorder, `localStorage` persistence, listens for `tasksUpdated` |
| `components/Calendar.jsx` | Fetches `/events`, client-side Today/Week/Month filter, exposes `reloadEvents()` via ref |
| `components/Pomodoro.jsx` | Session / short / long break timer, custom durations, session counter |
| `components/Spotify.jsx` | Spotify iframe, preset and custom playlists, random quote |
| `components/Time.jsx` | Live clock |
| `components/ThemeToggle.jsx`, `context/ThemeContext.jsx` | Theme state, persisted to `localStorage`, applied as `body` class |
| `Stars`, `ScrollReveal`, `Footer` | Visual effects on landing page |

### 4.2 Backend (`backend/`)

| Module | Responsibility |
|---|---|
| `index.js` | Express app, CORS, routes, Gemini call, intent dispatch, Calendar calls, token persistence |
| `auth.js` | OAuth2 client, auth URL builder, code-to-token exchange |

### 4.3 External services

| Service | Use | Auth |
|---|---|---|
| Google Gemini 2.0 Flash (`generateContent`) | Intent parsing + conversation | API key (env) |
| Google OAuth 2.0 | User consent, scope `calendar` | Client ID / secret (env) |
| Google Calendar API v3 | List, insert, update, delete events on `primary` | OAuth access/refresh token |
| Spotify Embed | Music playback in iframe | None (public embed) |

## 5. Key flows

### 5.1 Connect Google Calendar

```
User ──click "Connect"──▶ Backend GET /auth
Backend ──302──▶ Google consent screen (scope: calendar, access_type: offline)
Google ──302 ?code=──▶ Backend GET /auth/callback
Backend ──exchange code──▶ Google token endpoint
Backend: setCredentials + write token.json
Backend ──302──▶ FRONTEND_URL/workspace
```

### 5.2 Chat with calendar intent

```
Donna.jsx ──POST /chat {message, context[≤10], tasks}──▶ Backend
Backend: prepend date/time + tasks, add system prompt
Backend ──generateContent──▶ Gemini
Gemini ──JSON {type: calendar_event | delete_calendar_event}──▶ Backend
Backend ──events.list / insert / update / delete──▶ Google Calendar
Backend ──{reply, action: calendar_*}──▶ Donna.jsx
Donna.jsx ──calendarRef.reloadEvents()──▶ Calendar.jsx ──GET /events──▶ Backend
```

### 5.3 Chat with task intent

```
Donna.jsx ──POST /chat──▶ Backend ──▶ Gemini
Gemini ──JSON {type: add_task | update_task | delete_task}──▶ Backend
Backend ──{reply, action: task_*, taskData | query}──▶ Donna.jsx
Donna.jsx: mutate localStorage["tasks"], dispatch window "tasksUpdated"
Task.jsx: reload from localStorage, re-render
```

### 5.4 Plain conversation

Gemini replies with text. Backend converts Markdown to HTML with `marked`. Frontend renders the HTML in the bot bubble.

## 6. Data architecture

| Data | Location | Owner | Lifetime |
|---|---|---|---|
| Tasks `[{text, completed}]` | Browser `localStorage["tasks"]` | Frontend | Until browser data cleared |
| Theme | Browser `localStorage["workspace-theme"]` | Frontend | Same |
| Chat history | React state in `Donna.jsx` | Frontend | Page session |
| Pomodoro state, Spotify URL | React state | Frontend | Page session |
| OAuth tokens | `backend/token.json` + in-memory `oauth2Client` | Backend | Until revoked; ephemeral on Render redeploy |
| Calendar events | Google Calendar | Google | Source of truth; not cached |
| Quotes | Static `data/quotes.js` | Frontend bundle | Build time |

No database. The backend is stateless except for `token.json`.

## 7. Deployment

| Tier | Platform | Notes |
|---|---|---|
| Frontend | Static host (Netlify-style; `public/_redirects` rewrites `/*` to `index.html`) | Built by `vite build` |
| Backend | Render web service (`https://donna-1677.onrender.com`) | `node index.js`, port 3000 |
| Config | Backend env: `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REDIRECT_URI`, `FRONTEND_URL` | Frontend has backend URL hardcoded |

## 8. Cross-cutting concerns

### 8.1 Security
- Secrets are backend-only. CORS allows only `FRONTEND_URL`.
- **Gap:** one global OAuth credential. All visitors act on the same Google account. Target design: per-user session cookie, token store keyed by user ID (e.g. Redis or Postgres), encrypted refresh tokens.
- **Gap:** LLM HTML is rendered unsanitised. Target: DOMPurify on the client, or sanitise after `marked` on the server.
- **Gap:** no rate limiting on `/chat`. Target: per-IP limiter to protect the Gemini quota.

### 8.2 Reliability
- Gemini or Calendar errors return a friendly message; `/chat` returns 500 only on unexpected failures.
- Token refresh is automatic via the `oauth2Client` `tokens` event, which rewrites `token.json`.
- Render free tier sleeps; the first request may take 30–60 s.

### 8.3 Scalability
- Backend is stateless apart from the token file, so it can scale horizontally once tokens move to a shared store.
- Main bottleneck is Gemini latency and quota.

### 8.4 Observability
- `console.log` only. Target: structured logs, request IDs, and an intent-success metric (PRD §8).

### 8.5 Timezone
- Hardcoded `Asia/Kolkata` in the prompt and event payloads. Target: client sends `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## 9. Technology choices

| Choice | Reason |
|---|---|
| React 19 + Vite | Fast dev loop, simple SPA |
| Framer Motion / GSAP | Landing and UI animations |
| CSS Modules + CSS variables | Scoped styles, runtime theming via `body` class |
| Express 5 | Minimal API layer |
| Gemini 2.0 Flash | Low latency, low cost, good JSON compliance |
| `googleapis` | Official client, handles token refresh |
| `localStorage` for tasks | Zero backend storage for MVP |

## 10. Target architecture (v1.1+)

```
SPA ──▶ API (Express) ──▶ Session store / DB (users, tokens, tasks)
              │
              ├──▶ Gemini (structured output / function calling)
              └──▶ Google Calendar (per-user OAuth client)
```

Changes:
1. Per-user auth and token storage.
2. Tasks move server-side, with optional sync from `localStorage`.
3. Gemini function calling or JSON schema mode replaces regex JSON extraction.
4. `VITE_API_URL` env var replaces the hardcoded backend URL.
5. Client timezone sent with each chat and event request.
