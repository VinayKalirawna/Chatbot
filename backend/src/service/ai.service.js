const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateResponse({ userPrompt, memoryTurns = [] }) {
    const systemPreamble =
        "You are a concise, helpful chatbot your name is Khin. Keep replies friendly. Use the provided chat history for context.";

    // Build role-aware contents as recommended for multi-turn conversations
    const contents = [];

    // System-style instruction as first turn
    contents.push({ role: "user", parts: [{ text: systemPreamble }] });

    // Prior turns in chronological order
    for (const t of memoryTurns) {
        contents.push({
            role: t.role === "user" ? "user" : "model",
            parts: [{ text: t.text }],
        });
    }

    // Current user prompt
    contents.push({ role: "user", parts: [{ text: userPrompt }] });

    const resp = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
    });

    return resp && resp.text ? resp.text : "";
}

module.exports = generateResponse;
