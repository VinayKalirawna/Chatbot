// backend/server.js
require("dotenv").config();

const app = require("./src/app");
const { createServer } = require("http");
const { Server } = require("socket.io");
const generateResponse = require("./src/service/ai.service");

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    const memory = [];
    const MAX_MESSAGES = 40;

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });

    socket.on("ai-message", async (data) => {
        try {
            const userPrompt = data && data.prompt ? String(data.prompt) : "";
            if (!userPrompt.trim()) {
                return socket.emit("ai-message-response", {
                    error: "Empty prompt",
                });
            }

            // Generate with memory
            const reply = await generateResponse({
                userPrompt,
                memoryTurns: memory,
            });

            memory.push({ role: "user", text: userPrompt });
            memory.push({ role: "model", text: reply });

            while (memory.length > MAX_MESSAGES) memory.shift();

            socket.emit("ai-message-response", { response: reply });
        } catch (err) {
            console.error("AI error:", err);
            socket.emit("ai-message-response", { error: "Generation failed" });
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
