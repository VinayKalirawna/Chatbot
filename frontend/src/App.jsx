import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
    const socket = useMemo(
        () =>
            io(apiUrl, {
                transports: ["websocket", "polling"],
            }),
        []
    );

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const inputRef = useRef(null);
    const listRef = useRef(null);
    const endRef = useRef(null);

    // Auto-scroll to bottom whenever messages change
    useEffect(() => {
        // Prefer scrolling the bottom anchor into view for reliability
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    useEffect(() => {
        function onReply(payload) {
            if (payload?.error) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", text: `Error: ${payload.error}` },
                ]);
                setLoading(false);
                return;
            }
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: payload.response || "" },
            ]);
            setLoading(false);
            inputRef.current?.focus();
        }
        socket.on("ai-message-response", onReply);
        return () => {
            socket.off("ai-message-response", onReply);
            socket.disconnect();
        };
    }, [socket]);

    async function send() {
        const prompt = input.trim();
        if (!prompt) return;
        setMessages((prev) => [...prev, { role: "user", text: prompt }]);
        setInput("");
        setLoading(true);
        socket.emit("ai-message", { prompt });
    }

    function onKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }

    return (
        <div className="chat-wrap">
            <header className="topbar">Chatbot</header>

            <div className="messages" ref={listRef}>
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        className={`bubble ${
                            m.role === "user" ? "user" : "assistant"
                        }`}
                    >
                        {m.text}
                    </div>
                ))}
                {loading && <div className="bubble assistant">Thinking…</div>}
                <div ref={endRef} /> {/* anchor for scroll-to-bottom */}
            </div>

            <div className="composer">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Ask something…"
                    rows={2}
                />
                <button onClick={send} disabled={loading || !input.trim()}>
                    Send
                </button>
            </div>
        </div>
    );
}
