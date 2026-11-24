# Donna – Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Product | Donna – AI Productivity Workspace |
| Status | MVP live (frontend on static host, backend on Render) |
| Last updated | 2026-11-24 |
| Related docs | [HLD.md](HLD.md), [LLD.md](LLD.md) |

---

## 1. Overview

Donna is a single-page productivity workspace. It puts an AI assistant, a task list, a Google Calendar view, a Pomodoro timer and ambient music in one screen. Users can manage tasks and calendar events by talking to Donna in plain language ("Add a task to review PRs", "Cancel my 2 PM meeting").

## 2. Problem statement

Knowledge workers switch between many tools to plan a day: a to-do app, a calendar, a focus timer, a music player. Each switch costs attention. Creating or moving a calendar event takes several clicks and form fields.

Donna removes that friction:
- One workspace holds the tools needed for a focused work session.
- A conversational assistant turns a sentence into a task or calendar change.

## 3. Goals and non-goals

### 3.1 Goals
1. Let users create, update and delete tasks and calendar events through natural language.
2. Show today's, this week's and this month's Google Calendar events in the workspace.
3. Provide focus tools: Pomodoro timer with session and break modes.
4. Provide an ambient workspace: Spotify playlists, motivational quotes, themes.
5. Keep the UI calm, responsive and personalisable.

### 3.2 Non-goals (current release)
- Multi-user accounts and per-user data isolation (see §9, Known gaps).
- Team or shared workspaces.
- Native mobile apps.
- Full calendar editing UI (month grid, drag-to-reschedule).
- Offline sync of tasks across devices.

## 4. Target users and personas

| Persona | Description | Key need |
|---|---|---|
| Student | Studies in long sessions, uses Pomodoro and lo-fi music | Focus + simple task tracking |
| Developer / knowledge worker | Juggles meetings and deep-work blocks | Fast calendar changes, task list |
| Freelancer | Self-manages schedule | One place to plan the day |

## 5. User stories

### 5.1 AI assistant
- **US-1** As a user, I can type a request to Donna and get a friendly reply.
- **US-2** As a user, I can say "add a task to X" and the task appears in my task list.
- **US-3** As a user, I can say "mark X as done" or "rename X to Y" and the matching task updates.
- **US-4** As a user, I can say "delete task X" and the matching task is removed.
- **US-5** As a user, I can say "schedule a meeting tomorrow at 3 PM" and an event is created in Google Calendar.
- **US-6** As a user, I can say "move my standup to 11 AM" and the matching upcoming event is updated.
- **US-7** As a user, I can say "cancel my 2 PM meeting" and the matching upcoming event is deleted.
- **US-8** As a user, Donna remembers the last 10 messages of the current session for follow-ups.

### 5.2 Tasks
- **US-9** As a user, I can add a task by clicking the task panel and typing.
- **US-10** As a user, I can edit, complete, delete and drag-reorder tasks.
- **US-11** As a user, my tasks persist after a page reload on the same browser.

### 5.3 Calendar
- **US-12** As a user, I can connect my Google account from the landing page.
- **US-13** As a user, I can view upcoming events filtered by Today / This week / This month.
- **US-14** As a user, I can refresh the event list manually; it also refreshes after Donna changes an event.

### 5.4 Focus tools
- **US-15** As a user, I can start, pause and reset a Pomodoro timer.
- **US-16** As a user, I can switch between session (25 min), short break (5 min) and long break (15 min).
- **US-17** As a user, I can customise the three durations.
- **US-18** As a user, I see how many sessions I completed.

### 5.5 Ambient workspace
- **US-19** As a user, I can play a Spotify playlist embedded in the workspace.
- **US-20** As a user, I can pick a preset playlist or paste my own playlist URL.
- **US-21** As a user, I see a random motivational quote.
- **US-22** As a user, I can toggle light/dark mode and pick from 4 themes (Cherry, Blue, Dark, Night); the choice persists.
- **US-23** As a user, I see the current time and day.

## 6. Functional requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-1 | Chat endpoint accepts message, last 10 turns of context and current tasks | P0 | Done |
| FR-2 | LLM returns structured JSON for 5 intents: `calendar_event`, `delete_calendar_event`, `add_task`, `update_task`, `delete_task` | P0 | Done |
| FR-3 | Non-intent replies render as Markdown | P1 | Done |
| FR-4 | Calendar create / update / delete via Google Calendar API | P0 | Done |
| FR-5 | Google OAuth 2.0 connect flow with offline refresh token | P0 | Done |
| FR-6 | Task CRUD + reorder, persisted in `localStorage` | P0 | Done |
| FR-7 | Calendar list filtered by Today / Week / Month | P1 | Done |
| FR-8 | Pomodoro with 3 modes, custom durations, session counter | P1 | Done |
| FR-9 | Spotify embed with presets and custom playlist URL | P2 | Done |
| FR-10 | 4 themes + quick light/dark toggle, persisted | P2 | Done |
| FR-11 | Voice input for tasks | P2 | Planned |
| FR-12 | Focus progress reports | P2 | Planned |
| FR-13 | Donna ↔ Pomodoro integration (e.g. "start a focus session") | P2 | Planned |
| FR-14 | Manual event creation with repeat + reminder (`POST /events`) exposed in UI | P2 | API done, UI pending |

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Chat reply p95 < 5 s (bound by Gemini latency). Workspace first paint < 2 s on broadband. |
| Availability | Best-effort; backend on Render free tier may cold-start (~30–60 s). |
| Usability | Works on desktop and mobile widths; Donna opens as a floating panel on small screens. |
| Accessibility | Buttons carry `aria-label`s; themes keep readable contrast. |
| Privacy | Tasks stay in the browser. Calendar data is fetched on demand and not stored server-side. |
| Security | OAuth secrets and Gemini key live only in backend env vars. |

## 8. Success metrics

| Metric | Target |
|---|---|
| Intent success rate (structured action executed correctly) | ≥ 90 % |
| Weekly active users | Track baseline post-launch |
| Avg. Pomodoro sessions per active day | ≥ 2 |
| Calendar connect rate (landing visitors → OAuth done) | ≥ 40 % |

## 9. Known gaps and risks

| # | Gap / risk | Impact | Mitigation |
|---|---|---|---|
| R-1 | One shared Google token (`token.json`) for all visitors | Every user sees and edits the same calendar | Add per-user sessions and token store (see HLD §8) |
| R-2 | Bot HTML is injected with `dangerouslySetInnerHTML` | XSS risk if LLM output contains script | Sanitise with DOMPurify |
| R-3 | Backend URL hardcoded in frontend | Hard to run locally or stage | Move to `VITE_API_URL` |
| R-4 | Timezone fixed to `Asia/Kolkata` | Wrong times for users elsewhere | Send browser timezone with each request |
| R-5 | Fuzzy match picks first hit for task/event update and delete | Wrong item may change | Confirm with user when several match |
| R-6 | `/events` returns max 10 upcoming events; `range` param ignored | Week/month views may be incomplete | Honour `range` with `timeMin`/`timeMax` |
| R-7 | Render free tier cold start | Slow first request | Keep-alive ping or paid tier |
| R-8 | No automated tests | Regressions | Add API and component tests |

## 10. Release plan

| Phase | Scope |
|---|---|
| MVP (current) | FR-1 … FR-10 |
| v1.1 | Fix R-1 … R-6; expose FR-14 in UI |
| v1.2 | FR-11 voice input, FR-13 Donna ↔ Pomodoro |
| v1.3 | FR-12 progress reports, cloud task sync |
