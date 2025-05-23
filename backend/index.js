const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = 3001;

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

  try {
    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            parts: [{ text: message }]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from model.";
    res.json({ reply });
  } catch (error) {
    console.error("Gemini REST API error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch response from Gemini." });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});