import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ---- Design tokens -------------------------------------------------
const colors = {
  bg: "#0B1420",
  surface: "#131F30",
  surfaceAlt: "#182742",
  border: "rgba(255,255,255,0.07)",
  text: "#EDF1F7",
  textMuted: "#7C8BA3",
  amber: "#F2A93B",
  cyan: "#3FD0E0",
  green: "#5FD98A",
  violet: "#B98CF2",
};

const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(63,208,224,0.55); }
  70% { box-shadow: 0 0 0 8px rgba(63,208,224,0); }
  100% { box-shadow: 0 0 0 0 rgba(63,208,224,0); }
}

.ov-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.ov-split { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; margin-top: 20px; }

@media (max-width: 900px) {
  .ov-grid { grid-template-columns: repeat(2, 1fr); }
  .ov-split { grid-template-columns: 1fr; }
}
@media (max-width: 520px) {
  .ov-grid { grid-template-columns: 1fr; }
}
`;

function StatCard({ label, value, unit, accent, icon }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 10,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: colors.textMuted,
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        {label}
      </div>
      <div
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontWeight: 700,
          fontSize: 30,
          color: colors.text,
          lineHeight: 1,
        }}
      >
        {value}
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: colors.textMuted,
            marginLeft: 6,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function Overview() {
  const [stats] = useState({
    energyUsed: 245,
    moneySpent: 1720,
    moneySaved: 420,
    priority: "High",
    priorityPct: 75,
  });

  const priceData = [
    { day: "Mon", price: 6.5 },
    { day: "Tue", price: 6.8 },
    { day: "Wed", price: 7.0 },
    { day: "Thu", price: 6.7 },
    { day: "Fri", price: 7.2 },
    { day: "Sat", price: 7.5 },
    { day: "Sun", price: 7.1 },
  ];

  const totalSegments = 10;
  const litSegments = Math.round((stats.priorityPct / 100) * totalSegments);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 15% 0%, #16233A 0%, ${colors.bg} 55%)`,
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{fontImport}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            color: colors.cyan,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Consumer · Live Grid
        </div>
        <h1
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 30,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
          }}
        >
          Overview
        </h1>
        <p style={{ color: colors.textMuted, marginTop: 6, fontSize: 14 }}>
          Monitor your electricity usage and spending in real time.
        </p>
      </div>

      {/* Stat cards */}
      <div className="ov-grid">
        <StatCard
          label="Energy Used"
          value={stats.energyUsed}
          unit="kWh"
          accent={colors.amber}
          icon="⚡"
        />
        <StatCard
          label="Money Spent"
          value={`₹${stats.moneySpent.toLocaleString()}`}
          unit="today"
          accent={colors.violet}
          icon="💳"
        />
        <StatCard
          label="Savings"
          value={`₹${stats.moneySaved.toLocaleString()}`}
          unit="vs. grid"
          accent={colors.green}
          icon="📉"
        />
        <StatCard
          label="Priority"
          value={stats.priority}
          unit="tier"
          accent={colors.cyan}
          icon="⭐"
        />
      </div>

      {/* Chart + priority meter */}
      <div className="ov-split">
        {/* Price chart */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: colors.cyan,
                animation: "pulse 1.8s infinite",
              }}
            />
            <h2
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 17,
                fontWeight: 600,
                color: colors.text,
                margin: 0,
              }}
            >
              Live Electricity Price
            </h2>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={priceData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="day"
                stroke={colors.textMuted}
                tick={{ fill: colors.textMuted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={colors.textMuted}
                tick={{ fill: colors.textMuted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: colors.surfaceAlt,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                }}
                labelStyle={{ color: colors.textMuted }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={colors.cyan}
                strokeWidth={3}
                dot={{ r: 3, fill: colors.cyan, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Buying priority gauge */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: colors.text,
              margin: 0,
            }}
          >
            Buying Priority
          </h2>

          <div style={{ display: "flex", gap: 4, marginTop: 26 }}>
            {Array.from({ length: totalSegments }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 28,
                  borderRadius: 2,
                  background:
                    i < litSegments ? colors.violet : "rgba(255,255,255,0.08)",
                  boxShadow:
                    i < litSegments ? `0 0 8px ${colors.violet}66` : "none",
                }}
              />
            ))}
          </div>

          <div
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700,
              fontSize: 26,
              color: colors.violet,
              marginTop: 22,
            }}
          >
            {stats.priority.toUpperCase()}
          </div>
          <p style={{ color: colors.textMuted, marginTop: 4, fontSize: 13 }}>
            Preferred Consumer
          </p>
        </div>
      </div>
    </div>
  );
}