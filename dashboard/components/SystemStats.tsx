"use client";
import { useEffect, useState } from "react";

const STATS = [
  { label: "Projects Shipped", value: 4, suffix: "", color: "var(--j-blue)" },
  { label: "Repos Active", value: 3, suffix: "", color: "var(--j-cyan)" },
  { label: "Skills Indexed", value: 24, suffix: "+", color: "var(--j-green)" },
  { label: "Days at SISA", value: Math.floor((Date.now() - new Date("2024-10-01").getTime()) / 86400000), suffix: "", color: "var(--j-gold)" },
];

function Counter({ target, suffix, color }: { target: number; suffix: string; color: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(start);
    }, 40);
    return () => clearInterval(id);
  }, [target]);

  return (
    <span className="stat-num" style={{ color, textShadow: `0 0 12px ${color}` }}>
      {val}{suffix}
    </span>
  );
}

export default function SystemStats() {
  return (
    <div className="panel panel-cut fade-up-1" style={{ padding: "20px 24px" }}>
      <div className="label" style={{ marginBottom: 16 }}>◈ SYSTEM METRICS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ borderLeft: `2px solid ${s.color}30`, paddingLeft: 12 }}>
            <Counter target={s.value} suffix={s.suffix} color={s.color} />
            <div className="label" style={{ marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
