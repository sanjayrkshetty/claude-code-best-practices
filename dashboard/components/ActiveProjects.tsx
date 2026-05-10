"use client";

const PROJECTS = [
  {
    id: "PRJ-001",
    name: "presales-automation",
    status: "DEPLOYED",
    statusColor: "var(--j-green)",
    stack: ["React", "Express", "SQLite", "Claude API", "MCP"],
    description: "DFIR pre-sales pipeline. Opportunity tracking, AI DOCX proposals, GAM contacts, Apify prospect research.",
    threat: "LOW",
    uptime: 99.8,
    url: "github.com/sanjayrkshetty/presales-automation",
  },
  {
    id: "PRJ-002",
    name: "portfolio",
    status: "BUILDING",
    statusColor: "var(--j-gold)",
    stack: ["Next.js 15", "Vercel AI SDK", "Groq", "Claude", "Edge"],
    description: "Personal portfolio with multi-model AI chat. Groq → Claude → OpenRouter fallback chain.",
    threat: "LOW",
    uptime: 94.0,
    url: "github.com/sanjayrkshetty/portfolio",
  },
  {
    id: "PRJ-003",
    name: "claude-code-best-practices",
    status: "ACTIVE",
    statusColor: "var(--j-blue)",
    stack: ["Node.js", "Claude API", "Markdown"],
    description: "Production patterns reference + README generator CLI. This dashboard lives here.",
    threat: "MINIMAL",
    uptime: 100,
    url: "github.com/sanjayrkshetty/claude-code-best-practices",
  },
  {
    id: "PRJ-004",
    name: "J.A.R.V.I.S. Dashboard",
    status: "ONLINE",
    statusColor: "var(--j-cyan)",
    stack: ["Next.js 15", "Framer Motion", "Claude API", "Groq"],
    description: "This system. Personal AI dashboard with live metrics, mission tracking, and JARVIS interface.",
    threat: "CLASSIFIED",
    uptime: 100,
    url: "current",
  },
];

export default function ActiveProjects() {
  return (
    <div className="panel" style={{ padding: "20px 24px" }}>
      <div className="label" style={{ marginBottom: 16 }}>◈ ACTIVE PROJECTS — SYSTEM REGISTRY</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PROJECTS.map((p) => (
          <div
            key={p.id}
            style={{
              background: "rgba(0,0,0,0.3)",
              border: `1px solid ${p.statusColor}30`,
              borderLeft: `3px solid ${p.statusColor}`,
              borderRadius: 4,
              padding: "12px 14px",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="pulse" style={{ background: p.statusColor, boxShadow: `0 0 6px ${p.statusColor}` }} />
                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: p.statusColor }}>{p.name}</span>
                <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{p.id}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: "0.6rem", color: p.statusColor, border: `1px solid ${p.statusColor}40`, padding: "1px 6px", borderRadius: 2 }}>
                  {p.status}
                </span>
                <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>UP {p.uptime}%</span>
              </div>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>{p.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {p.stack.map((s) => (
                <span key={s} style={{ fontSize: "0.62rem", padding: "2px 6px", background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 2, color: "var(--j-blue)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
