import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config";

const API = API_BASE_URL;
const eligibleStatuses = new Set(["completed", "accepted"]);

const colors = {
  bg: "#faf7f2",
  surface: "#fefcf9",
  border: "#e6decb",
  borderStrong: "#d8c8b0",
  text: "#2c221e",
  textMuted: "#6e6056",
  warmBrown: "#4a3525",
  gold: "#859b32",
  goldLight: "rgba(133,155,50,0.15)",
  amber: "#d97706",
  red: "#991b1b",
};

const flowStyles = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

@keyframes warmFlow {
  from { stroke-dashoffset: 48; }
  to   { stroke-dashoffset: 0; }
}
`;

function formatEnergy(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
}

function shortenLabel(value, maxLength = 22) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}\u2026` : value;
}

export default function EnergyFlowMap() {
  const username = localStorage.getItem("username");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(async (silent = false) => {
    if (!username) {
      setTransactions([]);
      setError("Producer username not found.");
      if (!silent) setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      setError("");
      const response = await fetch(
        `${API}/trading/transactions/producer/${encodeURIComponent(username)}`
      );
      if (!response.ok) throw new Error("Failed to fetch producer transactions.");
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Energy flow fetch error:", err);
      setTransactions([]);
      setError("Unable to load energy distribution data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadTransactions(false);
    const timer = window.setInterval(() => loadTransactions(true), 10000);
    return () => window.clearInterval(timer);
  }, [loadTransactions]);

  // ── Aggregate consumer flows, mark latest accepted tx as active ─────────
  const { consumerFlows, latestConsumer } = useMemo(() => {
    const eligible = transactions.filter((tx) =>
      eligibleStatuses.has(String(tx.status || "").toLowerCase())
    );

    // Sort descending by created_at to find the latest tx
    const sorted = [...eligible].sort((a, b) =>
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    const latest = sorted[0]
      ? String(sorted[0].consumer || "").trim().toLocaleLowerCase()
      : null;

    const map = new Map();
    eligible.forEach((tx) => {
      const energy = Number(tx.energy || 0);
      const consumer = String(tx.consumer || "Unknown").trim();
      if (!Number.isFinite(energy) || energy <= 0) return;
      const key = consumer.toLocaleLowerCase();
      const cur = map.get(key);
      map.set(key, {
        consumer: cur?.consumer || consumer,
        energy: (cur?.energy || 0) + energy,
      });
    });

    const flows = [...map.values()].sort((a, b) => b.energy - a.energy);
    return { consumerFlows: flows, latestConsumer: latest };
  }, [transactions]);

  const totalDistributed = useMemo(
    () => consumerFlows.reduce((s, f) => s + f.energy, 0),
    [consumerFlows]
  );
  const eligibleCount = transactions.filter((t) =>
    eligibleStatuses.has(String(t.status || "").toLowerCase())
  ).length;

  // ── SVG geometry ────────────────────────────────────────────────────────
  const nodeHeight = 72;
  const laneGap = 20;
  const topPad = 44;
  const diagramH = Math.max(
    280,
    topPad * 2 +
      consumerFlows.length * nodeHeight +
      Math.max(0, consumerFlows.length - 1) * laneGap
  );
  const producerY = diagramH / 2 - nodeHeight / 2;

  return (
    <section
      style={{
        minHeight: "100%",
        background: `linear-gradient(135deg, #faf7f2 0%, #f5f0eb 60%, #efe9de 100%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        color: colors.text,
        borderRadius: 20,
        padding: "26px 28px 48px",
        boxSizing: "border-box",
      }}
    >
      <style>{flowStyles}</style>

      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              color: colors.gold,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: colors.gold,
                display: "inline-block",
                boxShadow: `0 0 8px ${colors.gold}`,
              }}
            />
            Producer · Energy Distribution
          </div>
          <h1
            style={{
              margin: "0 0 6px",
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 38,
              fontWeight: 800,
              color: colors.text,
              letterSpacing: "-0.02em",
            }}
          >
            Energy Flow Map
          </h1>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: 15 }}>
            Accepted energy distributed from your listings to each consumer.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadTransactions(false)}
          disabled={loading}
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: "10px 18px",
            background: colors.surface,
            color: colors.gold,
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 2px 8px rgba(74,53,37,0.08)",
          }}
        >
          {loading ? "Refreshing\u2026" : "\u21bb Refresh"}
        </button>
      </div>

      {/* ── KPI CARDS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <SummaryCard label="Energy Distributed" value={`${formatEnergy(totalDistributed)} kWh`} accent={colors.gold} />
        <SummaryCard label="Consumers Reached" value={String(consumerFlows.length)} accent={colors.warmBrown} />
        <SummaryCard label="Eligible Transactions" value={String(eligibleCount)} accent={colors.amber} />
      </div>

      {/* ── TRANSMISSION CANVAS ── */}
      <div
        style={{
          background: "#ffffff",
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: 24,
          overflowX: "auto",
          boxShadow: "0 4px 18px rgba(74,53,37,0.07)",
        }}
      >
        {/* Legend */}
        <div style={{ display: "flex", gap: 18, marginBottom: 16, flexWrap: "wrap" }}>
          <LegendItem color={colors.gold} label="Active Stream (Latest)" solid />
          <LegendItem color={colors.borderStrong} label="Historical Flows" dashed />
        </div>

        {loading ? (
          <StateMessage text="Loading energy transactions\u2026" color={colors.textMuted} />
        ) : error ? (
          <StateMessage text={error} color={colors.red} />
        ) : consumerFlows.length === 0 ? (
          <StateMessage
            text="No completed or accepted energy transactions yet. Sales will appear here once confirmed."
            color={colors.textMuted}
          />
        ) : (
          <svg
            role="img"
            aria-label={`Energy distributed from ${username} to ${consumerFlows.length} consumers`}
            viewBox={`0 0 1000 ${diagramH}`}
            width="100%"
            style={{ minWidth: 650, height: "auto", display: "block", overflow: "visible" }}
          >
            <defs>
              {/* Warm gold gradient for active flow */}
              <linearGradient id="warm-flow-gradient" x1="0" x2="1">
                <stop offset="0%" stopColor="#859b32" />
                <stop offset="100%" stopColor="#a3923d" />
              </linearGradient>
              {/* Glow filter for active flow */}
              <filter id="warm-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Column labels */}
            <text x="64" y="24" fill={colors.textMuted} fontSize="12" fontWeight="800" letterSpacing="0.08em">SOURCE (PRODUCER)</text>
            <text x="690" y="24" fill={colors.textMuted} fontSize="12" fontWeight="800" letterSpacing="0.08em">CONSUMERS</text>

            {/* Flow lines */}
            {consumerFlows.map((flow, index) => {
              const y = topPad + index * (nodeHeight + laneGap);
              const centerY = y + nodeHeight / 2;
              const isActive = flow.consumer.toLocaleLowerCase() === latestConsumer;
              const pathD = `M 360 ${producerY + nodeHeight / 2} C 480 ${producerY + nodeHeight / 2}, 540 ${centerY}, 670 ${centerY}`;

              return (
                <g key={`line-${flow.consumer}`}>
                  {/* Glow track */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isActive ? "rgba(133,155,50,0.12)" : "rgba(216,200,176,0.08)"}
                    strokeWidth={isActive ? 8 : 5}
                    strokeLinecap="round"
                  />
                  {/* Active: animated warm gold solid / Historical: dashed taupe */}
                  {isActive ? (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="url(#warm-flow-gradient)"
                      strokeWidth="3.5"
                      strokeDasharray="8 12"
                      strokeLinecap="round"
                      filter="url(#warm-glow)"
                      style={{ animation: "warmFlow 1.8s linear infinite" }}
                    />
                  ) : (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#d8c8b0"
                      strokeWidth="2"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                  )}
                  {/* Endpoint dot */}
                  <circle
                    cx="670"
                    cy={centerY}
                    r="5"
                    fill={isActive ? colors.gold : "#d8c8b0"}
                    stroke="#ffffff"
                    strokeWidth="2"
                    opacity={isActive ? 1 : 0.5}
                  />
                </g>
              );
            })}

            {/* Consumer nodes */}
            {consumerFlows.map((flow, index) => {
              const y = topPad + index * (nodeHeight + laneGap);
              const centerY = y + nodeHeight / 2;
              const isActive = flow.consumer.toLocaleLowerCase() === latestConsumer;

              return (
                <g key={`node-${flow.consumer}`}>
                  <rect
                    x="690" y={y}
                    width="270" height={nodeHeight}
                    rx="12"
                    fill={isActive ? "#fefcf9" : "#faf7f2"}
                    stroke={isActive ? colors.gold : colors.border}
                    strokeWidth={isActive ? 1.5 : 1}
                    filter={isActive ? "drop-shadow(0 4px 12px rgba(133,155,50,0.12))" : "none"}
                  />
                  {/* Avatar circle */}
                  <circle cx="720" cy={centerY} r="16" fill={isActive ? colors.goldLight : "rgba(110,96,86,0.08)"} />
                  <text x="720" y={centerY + 6} textAnchor="middle" fontSize="15">🏠</text>
                  {/* Consumer name */}
                  <text x="748" y={y + 28} fill={colors.text} fontSize="16" fontWeight="700" fontFamily="Space Grotesk, sans-serif">
                    {shortenLabel(flow.consumer)}
                  </text>
                  {/* Energy value */}
                  <text x="748" y={y + 50} fill={isActive ? colors.gold : colors.textMuted} fontSize="14" fontWeight="700">
                    {formatEnergy(flow.energy)} kWh
                  </text>
                  {/* Active badge */}
                  {isActive && (
                    <text x="748" y={y + 65} fill={colors.gold} fontSize="10" fontWeight="700" letterSpacing="0.06em">
                      ● ACTIVE STREAM
                    </text>
                  )}
                </g>
              );
            })}

            {/* Producer source node */}
            <rect
              x="60" y={producerY}
              width="300" height={nodeHeight}
              rx="14"
              fill={colors.surface}
              stroke={colors.warmBrown}
              strokeWidth="2"
              filter="drop-shadow(0 6px 16px rgba(74,53,37,0.12))"
            />
            <circle cx="95" cy={producerY + nodeHeight / 2} r="18" fill="rgba(74,53,37,0.10)" />
            <text x="95" y={producerY + nodeHeight / 2 + 6} textAnchor="middle" fill={colors.warmBrown} fontSize="18">⚡</text>
            <text x="125" y={producerY + 28} fill={colors.text} fontSize="17" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
              {shortenLabel(username || "Producer")}
            </text>
            <text x="125" y={producerY + 50} fill={colors.gold} fontSize="14" fontWeight="700">
              {formatEnergy(totalDistributed)} kWh distributed
            </text>
          </svg>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: "#fefcf9",
        border: "1px solid #e6decb",
        borderLeft: `5px solid ${accent}`,
        borderRadius: 14,
        padding: "18px 20px",
        boxShadow: "0 2px 10px rgba(74,53,37,0.06)",
      }}
    >
      <div
        style={{
          color: "#6e6056",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          color: "#2c221e",
          fontSize: 26,
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function LegendItem({ color, label, solid, dashed }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#6e6056" }}>
      <svg width="28" height="6" style={{ overflow: "visible" }}>
        <line
          x1="0" y1="3" x2="28" y2="3"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={dashed ? "5 4" : "none"}
          strokeLinecap="round"
        />
      </svg>
      {label}
    </span>
  );
}

function StateMessage({ text, color }) {
  return (
    <div
      style={{
        minHeight: 240,
        display: "grid",
        placeItems: "center",
        padding: 28,
        textAlign: "center",
        color,
        lineHeight: 1.6,
        fontSize: 15,
      }}
    >
      {text}
    </div>
  );
}
