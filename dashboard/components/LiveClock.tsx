"use client";
import { useEffect, useState } from "react";

export default function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-GB", { hour12: false }));
      setDate(now.toLocaleDateString("en-GB", { weekday: "short", year: "numeric", month: "short", day: "numeric" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ textAlign: "right" }}>
      <div className="glow" style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1 }}>
        {time || "00:00:00"}
      </div>
      <div className="label" style={{ marginTop: 4 }}>{date || "..."}</div>
    </div>
  );
}
