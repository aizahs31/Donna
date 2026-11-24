const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const { google } = require('googleapis');
const marked = require('marked');
const rateLimit = require('express-rate-limit');

const {
  getAuthUrl, exchangeCode, createSessionToken, issueLoginCode, redeemLoginCode,
  attachGoogleAuth, requireGoogleAuth, isAuthError, forgetToken, revokeToken,
} = require('./auth');
const app = express();
const port = process.env.PORT || 3000;
const DEFAULT_TIME_ZONE = "Asia/Kolkata";

// Accept only valid IANA zones from clients; fall back to the default.
const resolveTimeZone = (tz) => {
  if (typeof tz !== 'string' || !tz) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
};

// Behind Render's proxy, use X-Forwarded-For for client IPs (rate limiting)
app.set('trust proxy', 1);

// Only the frontend may call the API. Auth travels in the Authorization header, not cookies.
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["POST", "GET", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(bodyParser.json({ limit: '100kb' }));

// Resolve the caller's Google session (if any) on every request
app.use(attachGoogleAuth);

const AUTH_REQUIRED_REPLY = {
  reply: "I need access to your Google Calendar for that. Click <strong>Connect Google Calendar</strong> in the Calendar panel, then ask me again.",
  action: "auth_required",
};

// Google rejected this user's refresh token: drop the cached client and ask them to reconnect.
const sendAuthExpired = (req, res, asChat = false) => {
  if (req.sessionToken) forgetToken(req.sessionToken);
  return asChat
    ? res.json(AUTH_REQUIRED_REPLY)
    : res.status(401).json({ error: 'Google session expired. Please reconnect.', code: 'auth_required' });
};

// Throttle login attempts per IP
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });

// Protect the Gemini quota: 20 chat requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { reply: "You're going a bit fast for me. Give me a moment and try again." },
});


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Enhanced system prompt with calendar and task capabilities
const systemPrompt = `You are Donna, a friendly and helpful AI assistant for the user's personal workspace, built by Shazia. Always refer to yourself as Donna and answer in a warm, concise, helpful, and witty manner. Always all ears for personal growth, strengthening mindsets, and being realistic. You are connected to the user's calendar and task management system, so you can help with scheduling, reminders, and task organization.

When processing requests, respond ONLY in the following JSON formats:

1. CALENDAR EVENTS
{
  "type": "calendar_event",
  "event": {
    "summary": "Event title",
    "start": "2024-03-20T14:00:00",
    "end": "2024-03-20T15:00:00",
    "description": "",
    "timeZone": "<the user's time zone given in the message context>",
    "query": "Optional search term if updating an existing event"
  }
}

2. DELETE CALENDAR EVENTS
{
  "type": "delete_calendar_event",
  "query": "search terms to find the event to delete"
}

3. TASK MANAGEMENT
- Add:
{
  "type": "add_task",
  "task": { "text": "Task description", "completed": false }
}
- Update:
{
  "type": "update_task",
  "task": {
    "query": "search terms to find the task",
    "updates": {
      "text": "new task description (optional)",
      "completed": true/false (optional)
    }
  }
}
- Delete:
{
  "type": "delete_task",
  "query": "search terms to find the task to delete"
}

Use current date/time context for terms like "tomorrow". For all other questions, respond conversationally like a warm friend.`

app.post("/chat", chatLimiter, async (req, res) => {
  const { message, context = [], tasks = [] } = req.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const now = new Date();
    const timeZone = resolveTimeZone(req.body.timeZone);
    const messageWithContext = `[Current date and time: ${now.toLocaleString("en-US", { timeZone })} | Time Zone: ${timeZone}]
${message}

Here are the user's current tasks:
${(Array.isArray(tasks) ? tasks : []).map((t, i) => `${i + 1}. ${t.text} [${t.completed ? "✓" : "✗"}]`).join("\n")}`;

    // Keep only well-formed recent turns from the client
    const history = (Array.isArray(context) ? context : [])
      .filter(c => (c?.role === "user" || c?.role === "model") && Array.isArray(c.parts))
      .slice(-10);

    const contents = [
      ...history,
      { role: "user", parts: [{ text: messageWithContext }] }
    ];

    const response = await axios.post(
      GEMINI_URL,
      { systemInstruction: { parts: [{ text: systemPrompt }] }, contents },
      { headers: { "Content-Type": "application/json" } }
    );

    const replyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Donna.";
    console.log("Gemini Response:", replyText);

    let jsonResponse;
    try {
      const codeBlockMatch = replyText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const rawJson = codeBlockMatch ? codeBlockMatch[1] : (replyText.includes('"type":') ? replyText.match(/\{[\s\S]*\}/)?.[0] : null);
      if (rawJson) {
        jsonResponse = JSON.parse(rawJson);
        console.log("Parsed JSON:", jsonResponse);
      }
    } catch (e) {
      console.warn("Failed JSON parsing:", e);
    }

    const isCalendarIntent = jsonResponse?.type === "calendar_event" || jsonResponse?.type === "delete_calendar_event";
    if (isCalendarIntent && !req.googleAuth) {
      return res.json(AUTH_REQUIRED_REPLY);
    }

    if (jsonResponse) {
      const calendar = req.googleAuth ? google.calendar({ version: 'v3', auth: req.googleAuth }) : null;

      switch (jsonResponse.type) {
        case "calendar_event":
          try {
            const { summary, start, end, description, timeZone: tz, query } = jsonResponse.event || {};
            if (!start || !end) throw new Error("Missing start or end time");
            const eventTimeZone = resolveTimeZone(tz || timeZone);

            const eventPayload = {
              summary,
              description,
              start: { dateTime: start, timeZone: eventTimeZone },
              end: { dateTime: end, timeZone: eventTimeZone },
              reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 10 }]
              }
            };

            if (query) {
              // Update existing event
              const search = await calendar.events.list({
                calendarId: 'primary',
                q: query,
                timeMin: new Date().toISOString(),
                maxResults: 1,
                singleEvents: true,
                orderBy: 'startTime'
              });
              const existingEvent = search.data.items?.[0];
              if (existingEvent) {
                const updated = await calendar.events.update({
                  calendarId: 'primary',
                  eventId: existingEvent.id,
                  resource: { ...existingEvent, ...eventPayload }
                });
                console.log("Event updated:", updated.data.id);
                return res.json({ reply: "Done! I've updated the event.", action: "calendar_updated" });
              } else {
                return res.json({ reply: "I couldn't find the event to update." });
              }
            } else {
              // Create new event
              const created = await calendar.events.insert({
                calendarId: 'primary',
                resource: eventPayload
              });
              console.log("Calendar event created:", created.data.id);
              return res.json({ reply: "Done! The event has been scheduled.", action: "calendar_created" });
            }

          } catch (calendarError) {
            if (isAuthError(calendarError)) return sendAuthExpired(req, res, true);
            console.error("Calendar creation/update failed:", calendarError.message);
            return res.json({ reply: "Sorry, I couldn't schedule or update the event." });
          }

        case "delete_calendar_event":
          try {
            const { query } = jsonResponse;
            const search = await calendar.events.list({
              calendarId: 'primary',
              q: query,
              timeMin: new Date().toISOString(),
              maxResults: 10,
              singleEvents: true,
              orderBy: 'startTime'
            });

            const events = search.data.items || [];
            if (query && events.length > 0) {
              await calendar.events.delete({ calendarId: 'primary', eventId: events[0].id });
              return res.json({ reply: `Done! I deleted \"${events[0].summary}\".`, action: "calendar_deleted" });
            } else {
              return res.json({ reply: "Couldn't find any matching events." });
            }
          } catch (calendarError) {
            if (isAuthError(calendarError)) return sendAuthExpired(req, res, true);
            console.error("Delete failed:", calendarError.message);
            return res.json({ reply: "Sorry, I couldn't delete the event." });
          }

        case "add_task":
          if (!jsonResponse.task?.text) break;
          return res.json({
            reply: `Done! I’ve added “${jsonResponse.task.text}” to your tasks.`,
            action: "task_added",
            taskData: jsonResponse.task
          });

        case "update_task":
          if (!jsonResponse.task?.query) break;
          return res.json({
            reply: "Done! I’ve updated your task.",
            action: "task_updated",
            taskData: jsonResponse.task
          });

        case "delete_task":
          if (!jsonResponse.query) break;
          return res.json({
            reply: "Done! I’ve deleted the task.",
            action: "task_deleted",
            query: jsonResponse.query
          });

        default:
          console.warn("Unknown structured response:", jsonResponse.type);
      }
    }

    const reply = marked.parse(replyText);
    return res.json({ reply });

  } catch (error) {
    console.error("Donna (Gemini) Error:", error?.response?.data || error.message);
    return res.status(500).json({ error: "Donna encountered an issue processing your request." });
  }
});


// Auth routes
//
// Login flow:
// 1. Frontend makes a random `state`, keeps it in sessionStorage, opens GET /auth?state=...
// 2. Google redirects to /auth/callback?code=...&state=...
// 3. Backend seals the user's refresh token into a session token and redirects to
//    FRONTEND_URL/workspace#login_code=<one-time code>&state=<state>
// 4. Frontend checks `state`, then POSTs the code to /auth/session to receive the session token.

const frontendRedirect = (res, params) => {
  const hash = new URLSearchParams(params).toString();
  res.redirect(`${process.env.FRONTEND_URL}/workspace#${hash}`);
};

app.get('/auth', authLimiter, (req, res) => {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(state)) {
    return res.status(400).send('Missing or invalid state');
  }
  res.redirect(getAuthUrl(state));
});

app.get('/auth/callback', authLimiter, async (req, res) => {
  const { code, state = '', error } = req.query;
  if (error || !code) {
    return frontendRedirect(res, { auth_error: String(error || 'missing_code'), state });
  }
  try {
    const tokens = await exchangeCode(String(code));
    if (!tokens.refresh_token) {
      // Should not happen with prompt=consent, but without it we cannot keep the session.
      return frontendRedirect(res, { auth_error: 'no_refresh_token', state });
    }
    const loginCode = issueLoginCode(createSessionToken(tokens.refresh_token));
    frontendRedirect(res, { login_code: loginCode, state });
  } catch (err) {
    console.error('OAuth code exchange failed:', err?.response?.data || err.message);
    frontendRedirect(res, { auth_error: 'exchange_failed', state });
  }
});

// Swap the one-time login code for the long-lived session token.
app.post('/auth/session', authLimiter, (req, res) => {
  const code = req.body?.code;
  const sessionToken = typeof code === 'string' ? redeemLoginCode(code) : null;
  if (!sessionToken) {
    return res.status(400).json({ error: 'Login code is invalid or expired. Please connect again.' });
  }
  res.json({ token: sessionToken });
});

// Is this browser's session valid? (Does not call Google.)
app.get('/auth/status', (req, res) => {
  res.json({ connected: !!req.googleAuth });
});

// Disconnect: revoke the refresh token at Google so the session token is useless everywhere.
app.post('/auth/logout', async (req, res) => {
  if (req.sessionToken) await revokeToken(req.sessionToken);
  res.json({ connected: false });
});

// Calendar routes

// Window for GET /events. Prefer explicit timeMin/timeMax from the client (computed in the
// user's local time); otherwise derive one from range=today|week|month in server time.
function getEventWindow({ range, timeMin, timeMax } = {}) {
  const isValid = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
  if (isValid(timeMin) && isValid(timeMax) && Date.parse(timeMin) < Date.parse(timeMax)) {
    return { timeMin: new Date(timeMin).toISOString(), timeMax: new Date(timeMax).toISOString() };
  }
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (range === 'week') {
    start.setDate(now.getDate() - now.getDay());
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
  } else if (range === 'month') {
    start.setDate(1);
    end.setMonth(now.getMonth() + 1, 0);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}
app.get('/events', requireGoogleAuth, async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: req.googleAuth });
    const { timeMin, timeMax } = getEventWindow(req.query);
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      timeZone: resolveTimeZone(req.query.timeZone),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items || []);
  } catch (err) {
    if (isAuthError(err)) return sendAuthExpired(req, res);
    console.error('Error fetching events:', err.message);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Add event to Google Calendar
app.post('/events', requireGoogleAuth, async (req, res) => {
  try {
    const { summary, start, end, repeat, notification } = req.body || {};
    const timeZone = resolveTimeZone(req.body?.timeZone);
    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const calendar = google.calendar({ version: 'v3', auth: req.googleAuth });
    const event = {
      summary,
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: Number(notification) || 10 },
        ],
      },
    };
    // Add recurrence if needed
    if (repeat && repeat !== 'none') {
      let rule = 'RRULE:';
      if (repeat === 'daily') rule += 'FREQ=DAILY;';
      if (repeat === 'weekly') rule += 'FREQ=WEEKLY;';
      if (repeat === 'monthly') rule += 'FREQ=MONTHLY;';
      event.recurrence = [rule];
    }
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    res.status(201).json(response.data);
  } catch (err) {
    if (isAuthError(err)) return sendAuthExpired(req, res);
    console.error('Error creating event:', err.message);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Delete calendar event
app.delete('/events/:eventId', requireGoogleAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const calendar = google.calendar({ version: 'v3', auth: req.googleAuth });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    if (isAuthError(err)) return sendAuthExpired(req, res);
    console.error('Error deleting event:', err.message);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
