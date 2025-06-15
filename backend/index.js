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

const TOKEN_PATH = '/tmp/token.json';

// Load tokens from disk if available
if (fs.existsSync(TOKEN_PATH)) {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);
    console.log('✅ Loaded Google OAuth tokens from /temp.');
  } catch (e) {
    console.error('Failed to load tokens from /temp', e);
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Enhanced system prompt with calendar and task capabilities
const systemPrompt = `You are Donna, a friendly and helpful AI assistant for the user's personal workspace, built by Ryze. Always refer to yourself as Donna and answer in a warm, concise, and helpful manner, and witty at times. Always all ears for personal growth, strengthening mindsets, and being realistic. You are connected to the user's calendar and task management system, so you can help with scheduling, reminders, and task organization.

When processing requests, you can handle:

1. CALENDAR EVENTS - For creating/scheduling events, respond with ONLY this JSON format:
{
  "type": "calendar_event",
  "event": {
    "summary": "Event title",
    "start": "Local date time string (e.g., 2024-03-20T14:00:00)",
    "end": "Local date time string (e.g., 2024-03-20T15:00:00)",
    "description": "Optional event description",
    "timeZone": "User's time zone (from context)"
  }
}

2. DELETE CALENDAR EVENTS - For deleting events, respond with ONLY this JSON format:
{
  "type": "delete_calendar_event",
  "query": "search terms to find the event to delete"
}

3. TASK MANAGEMENT - For task operations, respond with ONLY this JSON format:

For adding tasks:
{
  "type": "add_task",
  "task": {
    "text": "Task description",
    "completed": false
  }
}

For updating tasks:
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

For deleting tasks:
{
  "type": "delete_task",
  "query": "search terms to find the task to delete"
}

Use the current date and time (provided in the user's message) as context for relative times like "tomorrow", "next week", etc.

For non-calendar/task requests, respond normally as a helpful assistant.
Always respond in a way that feels like a conversation with a friend.`;

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    // Add current date/time context to the user's message with timezone
    const now = new Date();
    const timeZone = "Asia/Kolkata";
    const messageWithContext = `[Current date and time: ${now.toLocaleString("en-US", { timeZone })} | Time Zone: ${timeZone}] ${message}`;

    console.log("Sending to Gemini:", messageWithContext);

    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [
          { role: "model", parts: [{ text: systemPrompt }] },
          { role: "user", parts: [{ text: messageWithContext }] }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const replyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Donna.";
    console.log("Gemini Response:", replyText);
    
    // Try to parse the response as JSON
    let jsonResponse;
    try {
      // First, try to extract JSON from markdown code blocks
      const codeBlockMatch = replyText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        // Found JSON in code block
        jsonResponse = JSON.parse(codeBlockMatch[1]);
        console.log("Extracted JSON from code block:", jsonResponse);
      } else if (replyText.includes('"type":')) {
        // Try direct JSON parsing if no code block but contains type signature
        const jsonMatch = replyText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[0]);
          console.log("Extracted direct JSON:", jsonResponse);
        }
      }
    } catch (e) {
      console.log("JSON parsing error:", e);
      // Not a JSON response or invalid JSON, send the normal text response
      const reply = marked.parse(replyText);
      res.json({ reply });
      return;
    }

    // Handle different types of JSON responses
    if (jsonResponse) {
      switch (jsonResponse.type) {
        case "calendar_event":
          try {
            console.log("Creating calendar event with data:", jsonResponse.event);
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            
            if (!jsonResponse.event.start || !jsonResponse.event.end) {
              throw new Error("Missing start or end time");
            }

            const event = {
              summary: jsonResponse.event.summary,
              start: { 
                dateTime: jsonResponse.event.start,
                timeZone: jsonResponse.event.timeZone || timeZone
              },
              end: { 
                dateTime: jsonResponse.event.end,
                timeZone: jsonResponse.event.timeZone || timeZone
              },
              description: jsonResponse.event.description,
              reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 10 }],
              },
            };
            
            const calendarResponse = await calendar.events.insert({
              calendarId: 'primary',
              resource: event,
            });
            
            console.log("Calendar event created:", calendarResponse.data);
            res.json({ reply: "Done! The event has been scheduled.", action: "calendar_created" });
          } catch (calendarError) {
            console.error("Failed to create calendar event:", calendarError);
            res.json({ reply: "Sorry, I couldn't schedule the event. Please try again." });
          }
          break;

        case "delete_calendar_event":
          try {
            console.log("Deleting calendar event with query:", jsonResponse.query);
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            
            // Search for events matching the query
            const searchResponse = await calendar.events.list({
              calendarId: 'primary',
              q: jsonResponse.query,
              timeMin: new Date().toISOString(),
              maxResults: 10,
              singleEvents: true,
              orderBy: 'startTime',
            });

            const events = searchResponse.data.items;
            if (events && events.length > 0) {
              // Delete the first matching event
              await calendar.events.delete({
                calendarId: 'primary',
                eventId: events[0].id,
              });
              
              console.log("Calendar event deleted:", events[0].summary);
              res.json({ reply: `Done! I've deleted the event "${events[0].summary}".`, action: "calendar_deleted" });
            } else {
              res.json({ reply: "I couldn't find any matching events to delete." });
            }
          } catch (calendarError) {
            console.error("Failed to delete calendar event:", calendarError);
            res.json({ reply: "Sorry, I couldn't delete the event. Please try again." });
          }
          break;

        case "add_task":
          try {
            console.log("Adding task:", jsonResponse.task);
            res.json({ 
              reply: `Done! I've added "${jsonResponse.task.text}" to your tasks.`, 
              action: "task_added",
              taskData: jsonResponse.task
            });
          } catch (taskError) {
            console.error("Failed to add task:", taskError);
            res.json({ reply: "Sorry, I couldn't add the task. Please try again." });
          }
          break;

        case "update_task":
          try {
            console.log("Updating task:", jsonResponse.task);
            res.json({ 
              reply: `Done! I've updated your task.`, 
              action: "task_updated",
              taskData: jsonResponse.task
            });
          } catch (taskError) {
            console.error("Failed to update task:", taskError);
            res.json({ reply: "Sorry, I couldn't update the task. Please try again." });
          }
          break;

        case "delete_task":
          try {
            console.log("Deleting task with query:", jsonResponse.query);
            res.json({ 
              reply: `Done! I've deleted the task.`, 
              action: "task_deleted",
              query: jsonResponse.query
            });
          } catch (taskError) {
            console.error("Failed to delete task:", taskError);
            res.json({ reply: "Sorry, I couldn't delete the task. Please try again." });
          }
          break;

        default:
          console.log("Unknown JSON response type:", jsonResponse.type);
          const reply = marked.parse(replyText);
          res.json({ reply });
      }
    } else {
      // Not a structured response
      console.log("Not a structured response, sending normal response");
      const reply = marked.parse(replyText);
      res.json({ reply });
    }
  } catch (error) {
    console.error("Donna (Gemini) REST API error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch response from Donna." });
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
