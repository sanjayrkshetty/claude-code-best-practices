"use client";
import { useState, useEffect } from "react";

const RESEARCH = [
  { label: "Adversarial ML", level: 88, color: "var(--j-red)" },
  { label: "LLM Threat Modelling", level: 82, color: "var(--j-red)" },
  { label: "Prompt Injection Analysis", level: 76, color: "var(--j-gold)" },
  { label: "AI Zero-Day Research", level: 70, color: "var(--j-gold)" },
  { label: "Model Extraction", level: 62, color: "var(--j-blue)" },
  { label: "Jailbreak Techniques", level: 68, color: "var(--j-blue)" },
];

const ALERTS = [
  { time: "09:14", msg: "New paper: 'Gradient-based LLM attacks on RLHF'", level: "INFO" },
  { time: "08:52", msg: "presales-automation: 11 deals in pipeline", level: "STATUS" },
  { time: "08:30", msg: "Groq API: 14,400 req/day limit — 0.2% used", level: "OK" },
  { time: "07:45", msg: "MCP server: all 5 tools operational", level: "OK" },
  { time: "Yesterday", msg: "Portfolio build: clean — Edge runtime ready", level: "OK" },
];

const LEVEL_COLOR: Record<string, string> = {
  "INFO": "var(--j-blue)",
  "STATUS": "var(--j-cyan)",
  "OK": "var(--j-green)",
  "WARN": "var(--j-gold)",
  "ALERT": "var(--j-red)",
};

export default function ThreatIntel() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 500); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      {/* AI Security Research Depth */}
      <div className="panel panel-cut" style={{ padding: "18px 20px", flex: 1 }}>
        <div className="label" style={{ marginBottom: 14 }}>◈ AI SECURITY DEPTH ANALYSIS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RESEARCH.map((r, i) => (
            <div key={r.label} style={{ opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${i * 0.1}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text)" }}>{r.label}</span>
                <span style={{ fontSize: "0.7rem", color: r.color, fontWeight: 700 }}>{r.level}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: visible ? `${r.level}%` : "0%",
                    background: `linear-gradient(90deg, ${r.color}80, ${r.color})`,
                    boxShadow: `0 0 6px ${r.color}60`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="panel" style={{ padding: "18px 20px" }}>
        <div className="label" style={{ marginBottom: 12 }}>◈ ACTIVITY FEED</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {ALERTS.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.62rem", color: "var(--muted)", flexShrink: 0, paddingTop: 1 }}>{a.time}</span>
              <span style={{
                fontSize: "0.6rem", padding: "1px 5px", borderRadius: 2, flexShrink: 0,
                color: LEVEL_COLOR[a.level], border: `1px solid ${LEVEL_COLOR[a.level]}30`,
              }}>{a.level}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text)", lineHeight: 1.4 }}>{a.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
