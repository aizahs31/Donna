# Donna – Low Level Design (LLD)

| Field | Value |
|---|---|
| Scope | Module internals, API contracts, data models, algorithms |
| Last updated | 2026-11-24 |
| Related docs | [PRD.md](PRD.md), [HLD.md](HLD.md) |

---

## 1. Repository layout

```
Donna/
├── backend/
│   ├── index.js          # Express app, routes, Gemini + Calendar logic
│   ├── auth.js           # OAuth2 client helpers
│   └── package.json
└── frontend/
    ├── public/_redirects # SPA fallback
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── context/ThemeContext.jsx
        ├── data/quotes.js
        ├── pages/landing.jsx, workspace.jsx (+ .module.css)
        └── components/
            Donna.jsx  Task.jsx  Calendar.jsx  Pomodoro.jsx
            Spotify.jsx  Time.jsx  ThemeToggle.jsx
            Stars.jsx  ScrollReveal.jsx  Footer.jsx
```

## 2. Backend

### 2.1 Configuration

| Env var | Used in | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | `index.js` | Builds `GEMINI_URL` |
| `GOOGLE_CLIENT_ID` | `auth.js` | OAuth2 client |
| `GOOGLE_CLIENT_SECRET` | `auth.js` | OAuth2 client |
| `REDIRECT_URI` | `auth.js` | OAuth callback (`/auth/callback`) |
| `FRONTEND_URL` | `index.js` | CORS origin, post-auth redirect |

Constants: `port = 3000`, `TOKEN_PATH = './token.json'`, model `gemini-2.0-flash` (v1beta `generateContent`), `timeZone = "Asia/Kolkata"`.

Middleware: `cors({ origin: FRONTEND_URL, methods: [POST, GET, DELETE], credentials: true })`, `bodyParser.json()`.

### 2.2 `auth.js`

```js
oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

getAuthUrl(): string
  // access_type: 'offline', scope: ['https://www.googleapis.com/auth/calendar']

getTokens(code): Promise<Credentials>
  // oauth2Client.getToken(code) → setCredentials → return tokens
```

### 2.3 Token lifecycle

| Event | Action |
|---|---|
| Server start | If `token.json` exists, parse and `oauth2Client.setCredentials(tokens)` |
| `GET /auth/callback` | Exchange code, `setCredentials`, overwrite `token.json` |
| `oauth2Client.on('tokens')` | Merge new tokens into existing `token.json` and write (keeps `refresh_token` when Google omits it) |

### 2.4 API contracts

#### `POST /chat`

Request:
```json
{
  "message": "string",
  "context": [{ "role": "user|model", "parts": [{ "text": "string" }] }],
  "tasks":   [{ "text": "string", "completed": false }]
}
```

Responses (all `200` unless noted):

| Case | Body |
|---|---|
| Conversation | `{ "reply": "<html from marked>" }` |
| Event created | `{ "reply": "...", "action": "calendar_created" }` |
| Event updated | `{ "reply": "...", "action": "calendar_updated" }` |
| Event deleted | `{ "reply": "...", "action": "calendar_deleted" }` |
| Event not found / failed | `{ "reply": "I couldn't find..." }` or `{ "reply": "Sorry, I couldn't..." }` |
| Task add | `{ "reply", "action": "task_added", "taskData": { "text", "completed" } }` |
| Task update | `{ "reply", "action": "task_updated", "taskData": { "query", "updates": { "text?", "completed?" } } }` |
| Task delete | `{ "reply", "action": "task_deleted", "query": "string" }` |
| Unexpected error | `500 { "error": "Donna encountered an issue processing your request." }` |

#### `GET /events`
- Query: `range=today|week|month` (sent by client; **currently ignored** by server).
- Calls `events.list({ calendarId: 'primary', timeMin: now, maxResults: 10, singleEvents: true, orderBy: 'startTime' })`.
- `200` → array of Google Calendar `Event` objects. `500 { error: 'Failed to fetch events' }`.

#### `POST /events`
Request:
```json
{ "summary": "string", "start": "ISO", "end": "ISO",
  "repeat": "none|daily|weekly|monthly", "notification": 10 }
```
- `400` if `summary`, `start` or `end` missing.
- Builds popup reminder of `notification` minutes (default 10).
- `repeat` maps to `RRULE:FREQ=DAILY|WEEKLY|MONTHLY;`.
- `201` → created Google `Event`. `500` on failure.

#### `DELETE /events/:eventId`
- `200 { message: 'Event deleted successfully' }`, `500` on failure.

#### `GET /auth` → `302` to Google consent.
#### `GET /auth/callback?code=` → `302` to `${FRONTEND_URL}/workspace`, or `500 'Authentication failed'`.

### 2.5 `/chat` processing pipeline

```
1. Read {message, context = [], tasks = []}
2. Build messageWithContext:
     "[Current date and time: <now in Asia/Kolkata> | Time Zone: Asia/Kolkata]
      <message>
      Here are the user's current tasks:
      1. <text> [✓|✗] ..."
3. contents = [ {role: model, parts: systemPrompt}, ...context, {role: user, parts: messageWithContext} ]
4. POST GEMINI_URL { contents }
5. replyText = candidates[0].content.parts[0].text ?? "No response from Donna."
6. extractJson(replyText)              // §2.6
7. if json → dispatch(json.type)       // §2.7
   else    → res.json({ reply: marked.parse(replyText) })
```

### 2.6 JSON extraction

```
match = /```(?:json)?\s*([\s\S]*?)\s*```/ on replyText
raw   = match ? match[1]
        : replyText includes '"type":' ? first /\{[\s\S]*\}/ match
        : null
json  = raw ? JSON.parse(raw) : undefined     // parse errors are logged and ignored
```

Falls through to conversation when no JSON is found or parse fails.

### 2.7 Intent dispatch

| `type` | Server action |
|---|---|
| `calendar_event` without `event.query` | Validate `start`/`end`; `events.insert` with payload below |
| `calendar_event` with `event.query` | `events.list(q=query, timeMin=now, maxResults=1)`; if found, `events.update` with `{...existing, ...payload}` |
| `delete_calendar_event` | `events.list(q=query, timeMin=now, maxResults=10)`; delete `items[0]` |
| `add_task` / `update_task` / `delete_task` | No server action; echo descriptor to client |
| other | Log warning, fall through to conversation reply |

Event payload:
```js
{
  summary, description,
  start: { dateTime: start, timeZone: tz || "Asia/Kolkata" },
  end:   { dateTime: end,   timeZone: tz || "Asia/Kolkata" },
  reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] }
}
```

### 2.8 System prompt contract

The prompt sets the Donna persona (warm, concise, witty) and requires JSON-only output for actions:

```json
{ "type": "calendar_event",
  "event": { "summary", "start", "end", "description", "timeZone", "query?" } }
{ "type": "delete_calendar_event", "query": "..." }
{ "type": "add_task",    "task": { "text", "completed": false } }
{ "type": "update_task", "task": { "query", "updates": { "text?", "completed?" } } }
{ "type": "delete_task", "query": "..." }
```

The system prompt is sent as the first `model` turn, not as `systemInstruction`.

## 3. Frontend

### 3.1 Routing (`App.jsx`)

| Path | Element |
|---|---|
| `/` | `<Landing />` |
| `/workspace` | `<WorkspaceThemeProvider><Workspace /></WorkspaceThemeProvider>` |

`public/_redirects`: `/* /index.html 200` for deep links.

### 3.2 Data models

```ts
type Task = { text: string; completed: boolean; editing?: boolean };  // localStorage["tasks"]
type ChatMessage = { from: "user" | "bot"; text: string };              // Donna state
type Theme = "cherry" | "blue" | "dark" | "night";                     // localStorage["workspace-theme"]
type Playlist = { name: string; url: string; cover: string };          // Spotify presets
```

### 3.3 `Donna.jsx`

State: `messages`, `input`, `loading`. Props: `calendarRef`.

`sendMessage()`:
1. Guard empty input or in-flight request.
2. Append user message; clear input; `loading = true`.
3. `context` = last 10 messages mapped to Gemini `{role, parts}` (`bot` → `model`).
4. `tasks` = `JSON.parse(localStorage.tasks || '[]')`.
5. `POST https://donna-1677.onrender.com/chat`.
6. Append bot message (`data.reply`, rendered as HTML).
7. Apply action:

| `action` | Client effect |
|---|---|
| `calendar_created`, `calendar_deleted` | `calendarRef.current.reloadEvents()` |
| `calendar_updated` | No reload (gap: should reload too) |
| `task_added` | Push `taskData` to `localStorage.tasks`; dispatch `tasksUpdated` |
| `task_updated` | First task whose `text` contains `query` (case-insensitive): apply `updates.text` / `updates.completed`; dispatch |
| `task_deleted` | Remove **all** tasks whose `text` contains `query`; dispatch |

8. On error, append "Sorry, something went wrong."; always `loading = false`.

Auto-scroll to the newest message via `messagesEndRef`.

### 3.4 `Task.jsx`

State: `tasks`, `isAdding`, `draggedIndex`.

| Behaviour | Implementation |
|---|---|
| Load | On mount, read `localStorage.tasks` |
| Persist | Effect writes `tasks` when `tasks.length > 0`; delete handler also writes directly (covers empty list) |
| Sync from Donna | `window` listener on `tasksUpdated` reloads from storage |
| Add | Click on panel → append `{text: '', completed: false}` in edit mode |
| Finalise | Blur / Enter: empty text removes row, else saves text |
| Edit | Click on an incomplete row sets `editing: true` |
| Toggle | Checkbox flips `completed` |
| Reorder | HTML5 drag: on `dragOver`, splice dragged item into hover index |
| Delete | Hover-revealed trash button |

### 3.5 `Calendar.jsx`

- `forwardRef`; exposes `reloadEvents` via `useImperativeHandle`.
- State: `activeTab` (`Today | This week | This month`), `events`, `loading`, `error`.
- `fetchEvents` (memoised on `activeTab`): `GET /events?range=<today|week|month>`.
- `filterEvents` (client-side):
  - Today: `start.toDateString() === now.toDateString()`.
  - Week: Sunday 00:00 to Saturday 23:59:59.999 of current week.
  - Month: same year and month as now.
- Start uses `event.start.dateTime || event.start.date` (all-day support).
- Card shows summary, short date, time range, optional description.

### 3.6 `Pomodoro.jsx`

Props: `sessionTime = 25`, `shortBreak = 5`, `longBreak = 15` (minutes).

State: `mode` (`session | short | long`), `seconds`, `isRunning`, `completedSessions`, `justCompleted`, custom and temp durations for the edit popup.

Logic:
- `setInterval` every 1 s while `isRunning`, decrementing `seconds`.
- At 0: stop, mark `justCompleted`, increment `completedSessions` when a session ends.
- Switching mode or applying custom durations resets `seconds` to `duration * 60`.
- Reset button restores the current mode's full duration.

### 3.7 `Spotify.jsx`

- Default embed: `https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn`.
- 4 presets: Lo-fi Chill, Noise cancelling, Binaural beats, Deep focus.
- `getEmbedUrl(url)`: `/playlist\/([a-zA-Z0-9]+)/` → `https://open.spotify.com/embed/playlist/<id>?utm_source=generator&theme=0`; invalid URLs are rejected.
- Popup with Apply / Cancel; `showPlayer` toggles between quote card and iframe.
- Quote picked once per mount at random from `data/quotes.js`.

### 3.8 Theming

`ThemeContext.jsx`:
- `THEMES = ['cherry','blue','dark','night']`; defaults light `cherry`, dark `night`.
- Initial: saved value, else `prefers-color-scheme`.
- Effect: swap `body` class `<theme>-theme`, persist to `localStorage`.
- `toggleTheme()`: dark/night → cherry, else → night.

`workspace.jsx` settings panel:
- `pendingTheme` previews by swapping `body` class without persisting.
- Apply → `setTheme(pendingTheme)`; close → revert to saved theme.

CSS variables used across components: `--color-bg-panel`, `--color-border`, `--color-border-dark`, `--color-accent-muted`, `--color-accent-input`, `--color-accent-dark`, `--color-text-main`, `--color-text-bot`, `--color-text-light`, `--color-btn-dark`.

### 3.9 Workspace layout

CSS grid areas in `workspace.module.css`: `timerArea`, `spotifyArea`, `taskArea`, `timeArea`, `calendarArea`, `donnaArea`. On small screens `donnaArea` hides and the 💬 FAB toggles `donnaVisible`.

## 4. Sequence: "Move my standup to 11 AM"

```
User → Donna.jsx: type + Enter
Donna.jsx → POST /chat {message, context, tasks}
index.js → Gemini: [systemPrompt, ...context, user(msg + time + tasks)]
Gemini → index.js: ```json {"type":"calendar_event","event":{"summary":"Standup",
                    "start":"2026-11-25T11:00:00","end":"2026-11-25T11:15:00",
                    "query":"standup"}} ```
index.js → Calendar: events.list(q="standup", timeMin=now, maxResults=1)
index.js → Calendar: events.update(id, {...existing, ...payload})
index.js → Donna.jsx: {reply:"Done! I've updated the event.", action:"calendar_updated"}
Donna.jsx: render reply
```

## 5. Error handling

| Layer | Failure | Behaviour |
|---|---|---|
| Frontend `/chat` | Network / JSON error | Bot bubble "Sorry, something went wrong." |
| Frontend `/events` | Non-2xx | `Error: Failed to fetch events` in grid |
| Backend Gemini | HTTP error | `500` generic error |
| Backend JSON parse | Invalid JSON | Treated as conversation |
| Backend Calendar | API error | `200` with apology reply |
| Backend auth | Token exchange fails | `500 'Authentication failed'` |
| Token file | Read/write error | Logged; server continues |

## 6. Known defects and fixes

| # | Location | Defect | Fix | Status |
|---|---|---|---|---|
| D-1 | `index.js` token handling | Single global OAuth client shared by all users | Session cookie + per-user `OAuth2` client and token store | Fixed 2026-11-24 |
| D-2 | `Donna.jsx` bot bubble | `dangerouslySetInnerHTML` with LLM HTML | `DOMPurify.sanitize(msg.text)` | Fixed 2026-11-24 |
| D-3 | `Donna.jsx`, `Calendar.jsx`, `landing.jsx` | Hardcoded `https://donna-1677.onrender.com` | `import.meta.env.VITE_API_URL` | Fixed 2026-11-24 |
| D-4 | `GET /events` | `range` ignored; `maxResults: 10` | Compute `timeMin`/`timeMax` from `range`; raise or paginate | Fixed 2026-11-24 |
| D-5 | `Donna.jsx` | `calendar_updated` does not reload calendar | Add it to the reload case | Fixed 2026-11-24 |
| D-6 | `Donna.jsx` `task_deleted` | Deletes every substring match | Delete best match only (exact text first, then first substring) | Fixed 2026-11-24 |
| D-7 | `index.js` | Timezone fixed to `Asia/Kolkata` | Accept `timeZone` in `/chat` and `/events` bodies | Fixed 2026-11-24 |
| D-8 | `index.js` | Regex JSON extraction | Gemini `responseSchema` / function calling | Open |
| D-9 | `index.js` | System prompt sent as `model` turn | Use `systemInstruction` field | Fixed 2026-11-24 |
| D-10 | `Task.jsx` | `key={index}` with drag reorder | Add stable `id` (e.g. `crypto.randomUUID()`) | Fixed 2026-11-24 |
| D-11 | `index.js` | No rate limit on `/chat` | `express-rate-limit` per IP | Fixed 2026-11-24 |
| D-12 | `backend/package.json` | Unused deps `@google/genai`, `@google/generative-ai` | Use one SDK or remove | Fixed 2026-11-24 |

Also fixed on 2026-11-24: a task stayed in edit mode after editing (`editing` flag never cleared); `/chat` now validates `message` and returns `400` when it is missing.

### 6.1 Per-user Google auth (D-1 fix)

- `GET /auth?state=` (browser-generated, kept in `sessionStorage`) redirects to Google with `access_type=offline`, `prompt=consent`.
- `GET /auth/callback` seals the refresh token with AES-256-GCM (key = SHA-256 of `SESSION_SECRET`). It then redirects to `FRONTEND_URL/workspace#login_code=<one-time, 2 min>&state=`.
- The frontend (`utils/session.js`) checks `state` and calls `POST /auth/session {code}`, which returns `{token}`. The token is stored in `localStorage["donna-session"]`.
- API calls send `Authorization: Bearer <token>`. The `attachGoogleAuth` middleware decrypts the token and builds a per-user OAuth client (LRU cache of 500).
- `/events*` require auth and return `401 {code: "auth_required"}` when it is missing. `/chat` calendar intents reply with `action: "auth_required"`. Google `invalid_grant` is handled the same way.
- `POST /auth/logout` revokes the refresh token at Google. `GET /auth/status` returns `{connected}`.
- `token.json` and the global `oauth2Client` are removed.

## 7. Testing strategy

| Level | Target | Tooling |
|---|---|---|
| Unit | JSON extraction, intent dispatch, `getEmbedUrl`, `filterEvents`, task matching | Vitest / Jest |
| API | `/chat` with mocked Gemini + Calendar, `/events` CRUD | Supertest + nock |
| Component | Task CRUD/reorder, Donna action handling, theme persistence | React Testing Library |
| E2E | OAuth stub → chat → task/event appears | Playwright |
| Prompt eval | Fixed set of utterances → expected intent JSON | Script against Gemini, track success rate (PRD §8) |
