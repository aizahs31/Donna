# Donna – AI Productivity Assistant
Donna is a smart, AI-powered workspace that helps you manage tasks, calendar events, and focus time — all in one clean, interactive interface.

## ✨ Features
🤖 AI Chat Assistance: Add/update/delete tasks & events via natural language

✅ Task Manager: Voice* + UI control, rearrange task order, persistent storage

📅 Calendar Sync: Google Calendar integration (create, modify, delete events directly)

🎯 Focus Tools: Pomodoro timer, break times, progress reports* & Donna's integration*

🎵 Ambient Workspace: Optional Spotify music, quotes, responsive design

🌈 Themes: Preset themes for customisation

*_to be implimented_

## 🛠 Tech Stack
Frontend: React, Vite, Framer Motion

Backend: Node.js, Express, Google APIs

API Integrations: Gemini, Google Calendar, Spotify

## 🚀 Setup
```
git clone <repo>
cd backend && npm install
cd ../frontend && npm install
```

Create a .env in /backend with:
```
GEMINI_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
REDIRECT_URI=http://localhost:3000/auth/callback
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=...   # long random string, e.g. `openssl rand -hex 32`
```
Each user connects their own Google Calendar. Their refresh token is encrypted with `SESSION_SECRET` into a session token kept in their browser; the server stores no tokens. Changing `SESSION_SECRET` signs everyone out.
Optional: create a .env in /frontend to point at a local backend (defaults to the hosted one):
```
VITE_API_URL=http://localhost:3000
```
Run the app:
```
# Backend
cd backend && npm run dev

# Frontend
cd ../frontend && npm run dev
```

## 💬 Sample Commands
“Add a task to review PRs”

“Cancel my 2 PM meeting”

Built with ❤️ by the Ryze.