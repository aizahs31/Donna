const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const { google } = require('googleapis');
const marked = require('marked');
const fs = require('fs');

const { getAuthUrl, getTokens, oauth2Client } = require('./auth');
const app = express();
const port =  3000;

// Fix CORS to match Vite frontend port
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["POST", "GET", "DELETE"],
  credentials: true,
}));

app.use(bodyParser.json());

const TOKEN_PATH = './token.json';

// Load tokens from disk if available
if (fs.existsSync(TOKEN_PATH)) {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);
    console.log('✅ Loaded Google OAuth tokens from /tmp.');
  } catch (e) {
    console.error('Failed to load tokens from /tmp', e);
  }
}

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
    "timeZone": "Asia/Kolkata",
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

app.post("/chat", async (req, res) => {
  const { message, context = [], tasks = [] } = req.body;

  try {
    const now = new Date();
    const timeZone = "Asia/Kolkata";
    const messageWithContext = `[Current date and time: ${now.toLocaleString("en-US", { timeZone })} | Time Zone: ${timeZone}]
${message}

Here are the user's current tasks:
${tasks.map((t, i) => `${i + 1}. ${t.text} [${t.completed ? "✓" : "✗"}]`).join("\n")}`;

    const contents = [
      { role: "model", parts: [{ text: systemPrompt }] },
      ...context,
      { role: "user", parts: [{ text: messageWithContext }] }
    ];

    console.log("Sending to Gemini:", contents);

    const response = await axios.post(
      GEMINI_URL,
      { contents },
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

    if (jsonResponse) {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      switch (jsonResponse.type) {
        case "calendar_event":
          try {
            const { summary, start, end, description, timeZone: tz, query } = jsonResponse.event;
            if (!start || !end) throw new Error("Missing start or end time");

            const eventPayload = {
              summary,
              description,
              start: { dateTime: start, timeZone: tz || timeZone },
              end: { dateTime: end, timeZone: tz || timeZone },
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
                console.log("Event updated:", updated.data);
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
              console.log("Calendar event created:", created.data);
              return res.json({ reply: "Done! The event has been scheduled.", action: "calendar_created" });
            }

          } catch (calendarError) {
            console.error("Calendar creation/update failed:", calendarError);
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

            const events = search.data.items;
            if (events.length > 0) {
              await calendar.events.delete({ calendarId: 'primary', eventId: events[0].id });
              return res.json({ reply: `Done! I deleted \"${events[0].summary}\".`, action: "calendar_deleted" });
            } else {
              return res.json({ reply: "Couldn't find any matching events." });
            }
          } catch (calendarError) {
            console.error("Delete failed:", calendarError);
            return res.json({ reply: "Sorry, I couldn't delete the event." });
          }

        case "add_task":
          return res.json({
            reply: `Done! I’ve added “${jsonResponse.task.text}” to your tasks.`,
            action: "task_added",
            taskData: jsonResponse.task
          });

        case "update_task":
          return res.json({
            reply: "Done! I’ve updated your task.",
            action: "task_updated",
            taskData: jsonResponse.task
          });

        case "delete_task":
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
app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const tokens = await getTokens(code);
    oauth2Client.setCredentials(tokens);
    // Always update token.json with the latest tokens
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    // Redirect to frontend workspace after successful auth
    res.redirect(`${process.env.FRONTEND_URL}/workspace`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Authentication failed');
  }
});

// Also update token.json if tokens are refreshed automatically
oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token || tokens.access_token) {
    try {
      // Merge with existing tokens if needed
      let current = {};
      if (fs.existsSync(TOKEN_PATH)) {
        current = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      }
      const updated = { ...current, ...tokens };
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated));
      console.log('✅ Google OAuth tokens updated on disk.');
    } catch (e) {
      console.error('Failed to update tokens on disk:', e);
    }
  }
});

// Calendar routes
app.get('/events', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const now = new Date();
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Add event to Google Calendar
app.post('/events', async (req, res) => {
  try {
    const { summary, start, end, repeat, notification } = req.body;
    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const event = {
      summary,
      start: { dateTime: start },
      end: { dateTime: end },
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
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Delete calendar event
app.delete('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
