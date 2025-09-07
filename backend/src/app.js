const express = require("express");
const cors = require("cors");

const app = express();

// Basic JSON parsing and CORS for REST endpoints (Socket.IO CORS is set separately)
app.use(express.json());
app.use(cors());

app.get("/", (_req, res) => {
    res.json({ ok: true, service: "chat-backend", ts: Date.now() });
});

module.exports = app;
