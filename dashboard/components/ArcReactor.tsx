"use client";
import { useEffect, useState } from "react";

export default function ArcReactor({ size = 80 }: { size?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const s = size;
  const center = s / 2;

  return (
    <div style={{ width: s, height: s, position: "relative", flexShrink: 0 }}>
      {/* Outer glow */}
      <div style={{
        position: "absolute", inset: -4,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)",
        animation: "pulse 2s ease-in-out infinite",
      }} />

      {/* Ring 1 — slowest */}
      <div className="arc-ring" style={{
        width: s * 0.95, height: s * 0.95,
        borderColor: "rgba(0,212,255,0.6)",
        borderTopColor: "var(--j-cyan)",
        borderWidth: 1,
        animationDuration: "8s",
      }} />

      {/* Ring 2 */}
      <div className="arc-ring spin-rev" style={{
        width: s * 0.75, height: s * 0.75,
        borderColor: "rgba(0,212,255,0.4)",
        borderRightColor: "var(--j-blue)",
        borderWidth: 1,
        animationDuration: "5s",
      }} />

      {/* Ring 3 — fastest */}
      <div className="arc-ring" style={{
        width: s * 0.55, height: s * 0.55,
        borderColor: "rgba(0,255,136,0.3)",
        borderTopColor: "var(--j-green)",
        borderBottomColor: "transparent",
        borderWidth: 1,
        animationDuration: "3s",
      }} />

      {/* Ring 4 */}
      <div className="arc-ring spin-rev" style={{
        width: s * 0.38, height: s * 0.38,
        borderColor: "rgba(0,212,255,0.5)",
        borderLeftColor: "var(--j-cyan)",
        borderRightColor: "transparent",
        borderWidth: 1,
        animationDuration: "2s",
      }} />

      {/* Core */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: s * 0.22, height: s * 0.22,
        borderRadius: "50%",
        background: "radial-gradient(circle, #ffffff 0%, var(--j-cyan) 40%, var(--j-blue) 100%)",
        boxShadow: `0 0 ${s * 0.15}px var(--j-cyan), 0 0 ${s * 0.3}px var(--j-glow)`,
        animation: mounted ? "corePulse 2s ease-in-out infinite" : "none",
      }} />

      <style>{`
        @keyframes corePulse {
          0%,100% { box-shadow: 0 0 ${s*0.15}px var(--j-cyan), 0 0 ${s*0.3}px var(--j-glow); }
          50%      { box-shadow: 0 0 ${s*0.25}px var(--j-cyan), 0 0 ${s*0.5}px var(--j-glow); }
        }
      `}</style>
    </div>
  );
}
