"use client";
import { useEffect, useState } from "react";

const MISSIONS = [
  { id: "M-01", label: "Ship AI security research output", status: "ACTIVE", progress: 25, priority: "CRITICAL" },
  { id: "M-02", label: "4× LinkedIn posts on adversarial ML / LLM security", status: "ACTIVE", progress: 0, priority: "HIGH" },
  { id: "M-03", label: "Read + summarize 3 adversarial ML papers", status: "ACTIVE", progress: 33, priority: "HIGH" },
  { id: "M-04", label: "Portfolio site deployed to Vercel", status: "IN PROGRESS", progress: 80, priority: "HIGH" },
  { id: "M-05", label: "Connect with 2 senior AI security professionals", status: "PENDING", progress: 0, priority: "MEDIUM" },
  { id: "M-06", label: "presales-automation MCP server + Apify integration", status: "COMPLETE", progress: 100, priority: "HIGH" },
  { id: "M-07", label: "Security hardening pass on all backend APIs", status: "COMPLETE", progress: 100, priority: "CRITICAL" },
];

const STATUS_COLOR: Record<string, string> = {
  "COMPLETE":     "var(--j-green)",
  "IN PROGRESS":  "var(--j-blue)",
  "ACTIVE":       "var(--j-gold)",
  "PENDING":      "var(--muted)",
};

const PRIORITY_COLOR: Record<string, string> = {
  "CRITICAL": "var(--j-red)",
  "HIGH":     "var(--j-gold)",
  "MEDIUM":   "var(--j-blue)",
};

export default function MissionBoard() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 300); }, []);

  return (
    <div className="panel scan-container" style={{ padding: "20px 24px", height: "100%" }}>
      <div className="label" style={{ marginBottom: 16 }}>◈ Q2 2026 — MISSION OBJECTIVES</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MISSIONS.map((m, i) => (
          <div
            key={m.id}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "none" : "translateX(-8px)",
              transition: `all 0.4s ease ${i * 0.08}s`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>{m.id}</span>
                <span style={{ fontSize: "0.78rem", color: m.progress === 100 ? "var(--muted)" : "var(--text)" }}>
                  {m.label}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                <span style={{ fontSize: "0.6rem", color: PRIORITY_COLOR[m.priority], border: `1px solid ${PRIORITY_COLOR[m.priority]}40`, padding: "1px 5px", borderRadius: 2 }}>
                  {m.priority}
                </span>
                <span style={{ fontSize: "0.6rem", color: STATUS_COLOR[m.status], border: `1px solid ${STATUS_COLOR[m.status]}40`, padding: "1px 5px", borderRadius: 2 }}>
                  {m.status}
                </span>
              </div>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: visible ? `${m.progress}%` : "0%",
                  background: m.progress === 100
                    ? "linear-gradient(90deg, var(--j-green), rgba(0,255,136,0.6))"
                    : undefined,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
