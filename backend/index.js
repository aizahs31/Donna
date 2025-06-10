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
  methods: ["POST", "GET"],
  credentials: true,
}));

app.use(bodyParser.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Enhanced system prompt with calendar capabilities
const systemPrompt = `You are Donna, a friendly and helpful AI assistant for the user's personal workspace, built by Ryze. Always refer to yourself as Donna and answer in a warm, concise, and helpful manner, and witty at times. Always all ears for personal growth, strengthening mindsets, and being realistic. You are connected to the user's calendar, so you can help with scheduling and reminders.

When processing calendar-related requests:
1. If the user wants to create/schedule an event, ONLY respond with a valid JSON object, nothing else.
2. Use the current date and time (provided in the user's message) as context for relative times like "tomorrow", "next week", etc.
3. For calendar event requests, the response must be EXACTLY in this format with no additional text:
{
  "type": "calendar_event",
  "event": {
    "summary": "",
    "start": "",
    "end": "",
    "description": "",
    "timeZone": ""
  }
}

Example calendar event JSON (no other text):
{
  "type": "calendar_event",
  "event": {
    "summary": "Team Meeting",
    "start": "2024-03-20T14:00:00",
    "end": "2024-03-20T15:00:00",
    "description": "Weekly team sync",
    "timeZone": "Asia/Kolkata"
  }
}

For non-calendar requests, respond normally as a helpful assistant.
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
      } else if (replyText.includes('"type":"calendar_event"')) {
        // Try direct JSON parsing if no code block but contains calendar event signature
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

    // If we got here and have valid JSON for a calendar event
    if (jsonResponse && jsonResponse.type === "calendar_event") {
      try {
        console.log("Creating calendar event with data:", jsonResponse.event);
        // Create calendar event
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // Ensure we have valid start and end times
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
        // Send success message
        res.json({ reply: "Done! The meeting has been scheduled." });
      } catch (calendarError) {
        console.error("Failed to create calendar event:", calendarError);
        res.json({ reply: "Sorry, I couldn't schedule the event. Please try again." });
      }
    } else {
      // Not a calendar event response
      console.log("Not a calendar event, sending normal response");
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
    res.redirect('http://localhost:5173/workspace');
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

const TOKEN_PATH = './token.json';

// Load tokens from disk if available
if (fs.existsSync(TOKEN_PATH)) {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);
    console.log('✅ Loaded Google OAuth tokens from disk.');
  } catch (e) {
    console.error('Failed to load tokens from disk:', e);
  }
}

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
