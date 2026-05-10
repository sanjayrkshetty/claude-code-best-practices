"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState } from "react";

const BOOT_LINES = [
  "Initialising J.A.R.V.I.S. v4.2.1...",
  "Loading Sanjay R K Shetty profile...",
  "Security clearance: VERIFIED",
  "All systems nominal. Standing by.",
];

const QUICK_CMDS = [
  "Status report",
  "What am I working on?",
  "What should I prioritise today?",
  "Analyse my AI security skills",
];

function getTextFromMessage(msg: { parts: Array<{ type: string; text?: string }> }) {
  return msg.parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join("");
}

export default function JarvisChat() {
  const [booted, setBooted] = useState(false);
  const [bootIdx, setBootIdx] = useState(0);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // Boot sequence
  useEffect(() => {
    if (bootIdx < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIdx((i) => i + 1), 500);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setBooted(true), 400);
      return () => clearTimeout(t);
    }
  }, [bootIdx]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, booted]);

  const isLoading = status === "streaming" || status === "submitted";

  function submit(text: string) {
    if (!text.trim() || isLoading) return;
    sendMessage({ text: text.trim() });
    setInput("");
  }

  return (
    <div className="panel scan-container" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 420 }}>
      {/* Header */}
      <div style={{
        padding: "12px 20px",
        borderBottom: "1px solid var(--border-bright)",
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(0,0,0,0.3)",
      }}>
        <div className="pulse pulse-blue" />
        <span className="glow" style={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em" }}>
          J.A.R.V.I.S. INTERFACE
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.62rem", color: "var(--muted)" }}>
          SECURE CHANNEL · AES-256
        </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 10,
        fontFamily: "'Courier New', monospace",
      }}>
        {/* Boot sequence */}
        {BOOT_LINES.slice(0, bootIdx).map((line, i) => (
          <div key={i} style={{
            fontSize: "0.72rem",
            color: i === bootIdx - 1 ? "var(--j-cyan)" : "var(--muted)",
            opacity: i === bootIdx - 1 ? 1 : 0.5,
          }}>
            <span style={{ color: "var(--j-green)", marginRight: 8 }}>▶</span>{line}
          </div>
        ))}

        {/* Quick commands — show after boot, before first message */}
        {booted && messages.length === 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginBottom: 8 }}>
              — QUICK COMMANDS —
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_CMDS.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => submit(cmd)}
                  style={{
                    fontSize: "0.7rem", padding: "5px 10px",
                    background: "rgba(0,212,255,0.07)",
                    border: "1px solid rgba(0,212,255,0.25)",
                    borderRadius: 3, color: "var(--j-blue)", cursor: "pointer",
                    transition: "background 0.15s",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  &gt; {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((m) => {
          const text = getTextFromMessage(m as { parts: Array<{ type: string; text?: string }> });
          const isUser = m.role === "user";
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginBottom: 3, textAlign: isUser ? "right" : "left" }}>
                {isUser ? "MR. SHETTY" : "J.A.R.V.I.S."}
              </div>
              <div className={isUser ? "bubble-user" : "bubble-jarvis"}>
                {!isUser && <span style={{ color: "var(--j-green)", marginRight: 6 }}>▶</span>}
                {text}
              </div>
            </div>
          );
        })}

        {/* Loading */}
        {isLoading && (
          <div className="bubble-jarvis" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "var(--j-green)" }}>▶</span>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "var(--j-green)", display: "inline-block",
                animation: `bounce 1s infinite ${i * 0.2}s`,
              }} />
            ))}
            <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); submit(input); }}
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-bright)",
          display: "flex", gap: 8,
          background: "rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ color: "var(--j-green)", fontSize: "0.85rem", lineHeight: "36px", flexShrink: 0 }}>▶</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Issue command, Mr. Shetty..."
          disabled={isLoading || !booted}
          style={{
            flex: 1, background: "transparent",
            border: "none", outline: "none",
            color: "var(--j-blue)", fontSize: "0.82rem",
            fontFamily: "'Courier New', monospace",
            caretColor: "var(--j-blue)",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim() || !booted}
          style={{
            padding: "6px 14px",
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.4)",
            borderRadius: 3, color: "var(--j-blue)",
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            opacity: isLoading || !input.trim() ? 0.4 : 1,
            fontSize: "0.72rem", fontFamily: "'Courier New', monospace",
            transition: "all 0.15s",
          }}
        >
          SEND
        </button>
      </form>
    </div>
  );
}
