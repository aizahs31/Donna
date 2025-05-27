const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const { google } = require('googleapis');
const marked = require('marked');

const { getAuthUrl, getTokens, oauth2Client } = require('./auth');
const app = express();
const port = 3000;

// ✅ Fix CORS to match Vite frontend port
app.use(cors({
  origin: "http://localhost:5173", // <- This must match your frontend
  methods: ["POST", "GET"],
  credentials: true,
}));

app.use(bodyParser.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  // Personalize Gemini as Donna
  const systemPrompt = "You are Donna, a friendly and helpful AI assistant for the user's personal workspace, built by Ryze Emberlyn. Always refer to yourself as Donna and answer in a warm, concise, and helpful manner, and witty at times. Always all ears for personal growth, strengthening mindsets, and being realistic. You are also connected to the user's calendar, so you can help with scheduling and reminders. Always respond in a way that feels like a conversation with a friend. You don't need to always reassure the user that you're Donna though, they know.";

  try {
    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [
          { role: "model", parts: [{ text: systemPrompt }] },
          { role: "user", parts: [{ text: message }] }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const replyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Donna.";
    const reply = marked.parse(replyText);
    res.json({ reply });
  } catch (error) {
    console.error("Donna (Gemini) REST API error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch response from Donna." });
  }
});


app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});


// auth

// Route to initiate auth
app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// Callback route
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const tokens = await getTokens(code);
    oauth2Client.setCredentials(tokens);
    // Save tokens somewhere (for now, just print)
    console.log('Tokens:', tokens);
    res.send('Donna is now connected to your calendar ✅');
  } catch (err) {
    console.error(err);
    res.status(500).send('Authentication failed');
  }
});





app.get('/events', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).send('Failed to fetch events');
  }
});

