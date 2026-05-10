"use client";
import ArcReactor from "@/components/ArcReactor";
import LiveClock from "@/components/LiveClock";
import SystemStats from "@/components/SystemStats";
import MissionBoard from "@/components/MissionBoard";
import ActiveProjects from "@/components/ActiveProjects";
import ThreatIntel from "@/components/ThreatIntel";
import JarvisChat from "@/components/JarvisChat";

export default function Dashboard() {
  return (
    <div className="hud-bg" style={{ minHeight: "100vh", padding: "0 0 32px 0" }}>

      {/* Scan line overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* Corner decorations */}
      {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
        <div key={i} style={{
          position: "fixed",
          ...(pos.includes("top") ? { top: 16 } : { bottom: 16 }),
          ...(pos.includes("left") ? { left: 16 } : { right: 16 }),
          width: 24, height: 24,
          borderTop: pos.includes("top") ? "2px solid var(--j-blue)" : "none",
          borderBottom: pos.includes("bottom") ? "2px solid var(--j-blue)" : "none",
          borderLeft: pos.includes("left") ? "2px solid var(--j-blue)" : "none",
          borderRight: pos.includes("right") ? "2px solid var(--j-blue)" : "none",
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 51,
        }} />
      ))}

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 20px" }}>

        {/* ── HEADER ── */}
        <header style={{
          display: "flex", alignItems: "center", gap: 24,
          padding: "20px 0 16px",
          borderBottom: "1px solid var(--border-bright)",
          marginBottom: 20,
          position: "relative",
        }}>
          {/* Sweep line */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, var(--j-blue), var(--j-cyan), var(--j-blue), transparent)",
            animation: "headerGlow 3s ease-in-out infinite",
          }} />
          <style>{`@keyframes headerGlow{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>

          <ArcReactor size={72} />

          <div style={{ flex: 1 }}>
            <div className="label" style={{ marginBottom: 4 }}>J.A.R.V.I.S. — PERSONAL AI SYSTEM v4.2.1</div>
            <h1 className="glow glitch" style={{
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight: 1,
              marginBottom: 6,
            }}>
              SANJAY R K SHETTY
            </h1>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--j-cyan)", letterSpacing: "0.06em" }}>
                AI SECURITY RESEARCHER · SISA INFORMATION SECURITY
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.65rem", color: "var(--j-green)" }}>
                <span className="pulse" style={{ width: 6, height: 6 }} />
                SYSTEM ONLINE
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
                MIT BENGALURU &apos;26 · CLEARANCE: LEVEL 5
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
            <LiveClock />
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "THREAT", val: "LOW", color: "var(--j-green)" },
                { label: "SYSTEM", val: "99.8%", color: "var(--j-blue)" },
              ].map((s) => (
                <div key={s.label} style={{
                  border: `1px solid ${s.color}40`,
                  borderRadius: 3, padding: "3px 10px", textAlign: "center",
                }}>
                  <div className="label">{s.label}</div>
                  <div style={{ color: s.color, fontSize: "0.75rem", fontWeight: 700 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── ROW 1: System stats ── */}
        <SystemStats />

        {/* ── ROW 2: Mission board + Threat intel ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginTop: 16 }}>
          <MissionBoard />
          <ThreatIntel />
        </div>

        {/* ── ROW 3: Active projects + JARVIS chat ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, marginTop: 16 }}>
          <ActiveProjects />
          <JarvisChat />
        </div>

        {/* ── Footer ── */}
        <footer style={{
          marginTop: 20,
          padding: "12px 0",
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span className="label">J.A.R.V.I.S. · JUST A RATHER VERY INTELLIGENT SYSTEM · CONFIDENTIAL</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "GITHUB", url: "https://github.com/sanjayrkshetty" },
              { label: "LINKEDIN", url: "https://linkedin.com/in/sanjay-r-k-shetty-1048ba245" },
              { label: "EMAIL", url: "mailto:sanjaybehaves@gmail.com" },
            ].map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener"
                style={{ fontSize: "0.65rem", color: "var(--muted)", textDecoration: "none", letterSpacing: "0.1em" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--j-blue)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                {l.label}
              </a>
            ))}
          </div>
        </footer>

      </div>
    </div>
  );
}
