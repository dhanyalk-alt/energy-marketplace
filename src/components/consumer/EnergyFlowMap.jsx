import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const API = API_BASE_URL;

// =========================================================
// DESIGN TOKENS (LIGHT COOL SKY BLUE THEME)
// =========================================================

const colors = {
  bg: "#f0f7ff",
  bgGradient: "linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 55%, #f8fafc 100%)",
  surface: "#ffffff",
  surfaceFrosted: "rgba(255, 255, 255, 0.92)",
  surfaceAlt: "#f8fafc",
  border: "#bae6fd",
  borderSubtle: "rgba(2, 132, 199, 0.16)",
  text: "#0f172a",          // Dark slate blue
  textNavy: "#1e3a8a",      // Cool navy
  textMuted: "#475569",     // Secondary text
  textDim: "#64748b",       // Subtle indicator
  sky: "#0284c7",           // Primary Sky Blue
  cyan: "#06b6d4",          // Neon Cyan
  green: "#10b981",         // Emerald Green
  amber: "#d97706",         // Amber
  violet: "#7c3aed",        // Violet
  red: "#ef4444",           // Error Red
};




// =========================================================
// STYLESHEET
// =========================================================

const flowStyles = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

@keyframes flowDash {
  from {
    stroke-dashoffset: 48;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes pulseGlow {
  0%, 100% {
    filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.45));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(2, 132, 199, 0.8));
  }
}

@keyframes pulseDot {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.35);
    opacity: 0.6;
  }
}

@keyframes consumerHalo {
  0% {
    box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.5);
  }
  70% {
    box-shadow: 0 0 0 16px rgba(2, 132, 199, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(2, 132, 199, 0);
  }
}

.flow-card {
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid #bae6fd;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 4px 6px -4px rgba(2, 132, 199, 0.04);
}

.flow-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.flow-table th {
  background: #e0f2fe !important;
  color: #0284c7 !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  text-align: left !important;
  padding: 14px 16px !important;
  border: none !important;
  border-bottom: 2px solid #bae6fd !important;
}

.flow-table th:first-child {
  border-top-left-radius: 10px;
}

.flow-table th:last-child {
  border-top-right-radius: 10px;
  text-align: right !important;
}

.flow-table td {
  padding: 14px 16px;
  color: #0f172a;
  font-size: 14px;
  border-bottom: 1px solid #e0f2fe;
  vertical-align: middle;
}

.flow-table tbody tr:hover {
  background: rgba(2, 132, 199, 0.04);
}

.flow-table tbody tr:last-child td {
  border-bottom: none;
}
`;

// =========================================================
// KPI SUMMARY CARD
// =========================================================

function KPICard({ label, value, unit, subtitle, icon, accent, extra }) {
  return (
    <div
      className="flow-card"
      style={{
        padding: "20px 22px",
        borderLeft: `4px solid ${accent}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: `${accent}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "17px",
          }}
        >
          {icon}
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "28px",
            fontWeight: 800,
            color: colors.text,
            lineHeight: 1.1,
          }}
        >
          {value}
          {unit && (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: colors.textDim,
                marginLeft: "6px",
              }}
            >
              {unit}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: colors.textMuted,
            marginTop: "4px",
            fontWeight: 500,
          }}
        >
          {subtitle}
        </div>
      </div>

      {extra && <div style={{ marginTop: "4px" }}>{extra}</div>}
    </div>
  );
}

// =========================================================
// MAIN COMPONENT: Consumer Energy Flow
// =========================================================

export default function EnergyFlowMap() {
  const username = localStorage.getItem("username") || "Consumer";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // -------------------------------------------------------
  // LOAD TRANSACTIONS
  // -------------------------------------------------------

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(
        `${API}/trading/transactions/consumer/${encodeURIComponent(username)}`
      );

      const data = Array.isArray(res.data) ? res.data : [];
      setTransactions(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn("Could not load consumer transactions:", err);
      setTransactions([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadData(false);

    // 10s silent background polling
    const pollTimer = window.setInterval(() => loadData(true), 10000);
    return () => window.clearInterval(pollTimer);
  }, [loadData]);

  // -------------------------------------------------------
  // AGGREGATE SUPPLIER STREAMS (Producer -> Consumer)
  // -------------------------------------------------------

  const streams = useMemo(() => {
    const completedOrActive = transactions.filter((t) => {
      const s = String(t.status || "").toLowerCase();
      return s === "completed" || s === "accepted" || s === "active";
    });

    if (completedOrActive.length === 0) {
      return [];
    }

    // Find the single most recent transaction (by created_at) to mark as the active stream
    const sorted = [...completedOrActive].sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da; // descending
    });
    const latestProducer = sorted[0]
      ? String(sorted[0].producer || "").trim()
      : null;

    // Group by producer
    const map = new Map();
    completedOrActive.forEach((tx) => {
      const prod = String(tx.producer || "Local Producer").trim();
      const energy = Number(tx.energy || 0);
      const price = Number(tx.price || 0);
      const totalAmount = Number(tx.total_amount || energy * price);
      const isNegotiated = Boolean(tx.negotiated_price || tx.consumer_offer);

      if (!map.has(prod)) {
        map.set(prod, {
          id: `tx-prod-${prod}`,
          producer: prod,
          type: "Microgrid Peer",
          energy: 0,
          totalCost: 0,
          rate: price,
          status: "Active Flowing",
          dealType: isNegotiated ? "Negotiated Deal" : "Direct Purchase",
          icon: "⚡",
          voltage: "230V",
        });
      }

      const cur = map.get(prod);
      cur.energy += energy;
      cur.totalCost += totalAmount;
      if (price > 0) cur.rate = price;
    });

    const list = Array.from(map.values()).map((item) => ({
      ...item,
      energy: Number(item.energy.toFixed(2)),
      rate: Number(item.rate.toFixed(2)),
      // The producer matching the most recent transaction is the active stream
      isLatestActive: item.producer === latestProducer,
    }));

    return list.sort((a, b) => b.energy - a.energy);
  }, [transactions]);

  // -------------------------------------------------------
  // KPI CALCULATIONS
  // -------------------------------------------------------

  const totalReceived = useMemo(() => {
    return streams.reduce((sum, s) => sum + s.energy, 0);
  }, [streams]);

  const activeSupplierCount = streams.length;




  // -------------------------------------------------------
  // SVG DIAGRAM GEOMETRY (PRODUCER [LEFT] -> CONSUMER [RIGHT])
  // -------------------------------------------------------

  const nodeHeight = 84;
  const laneGap = 20;
  const topOffset = 40;
  const diagramHeight = Math.max(340, topOffset * 2 + streams.length * (nodeHeight + laneGap));

  // Consumer node coordinates (Right Side)
  const consumerX = 720;
  const consumerWidth = 240;
  const consumerHeight = 130;
  const consumerY = diagramHeight / 2 - consumerHeight / 2;
  const consumerPortY = consumerY + consumerHeight / 2;

  // Producer nodes (Left Side)
  const producerX = 40;
  const producerWidth = 230;

  return (
    <div
      style={{
        minHeight: "100%",
        background: colors.bgGradient,
        borderRadius: "20px",
        padding: "26px 28px 48px",
        fontFamily: "Inter, sans-serif",
        color: colors.text,
        boxSizing: "border-box",
      }}
    >
      <style>{flowStyles}</style>

      {/* =====================================================
          HEADER SECTION
      ===================================================== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div
            style={{
              color: colors.sky,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: colors.green,
                display: "inline-block",
                boxShadow: `0 0 8px ${colors.green}`,
              }}
            />
            Consumer · Power Reception
          </div>

          <h1
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "2.1rem",
              fontWeight: 800,
              color: colors.text,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Energy Flow
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: colors.textMuted,
              fontSize: "15px",
            }}
          >
            Live Producer-to-Consumer (P2C) transmission and incoming clean power distribution.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "rgba(2, 132, 199, 0.08)",
              border: "1px solid #bae6fd",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              color: colors.sky,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⇄ Direction:</span>
            <strong>Producer → Consumer</strong>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              border: "1px solid #bae6fd",
              borderRadius: "10px",
              padding: "9px 16px",
              background: colors.surface,
              color: colors.sky,
              fontSize: "13px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 2px 6px rgba(2,132,199,0.08)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
          >
            <span>{loading ? "⟳" : "↻"}</span>
            {loading ? "Refreshing..." : "Refresh Flow"}
          </button>
        </div>
      </div>

      {/* =====================================================
          1. TOP KPI METRICS BANNER — 2 cards only
      ===================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "18px",
          marginBottom: "24px",
          maxWidth: "720px",
        }}
      >
        {/* KPI 1: Total Received Energy */}
        <KPICard
          label="Total Received Energy"
          value={totalReceived.toFixed(2)}
          unit="kWh"
          subtitle="Active incoming clean power"
          icon="⚡"
          accent={colors.sky}
        />

        {/* KPI 2: Active Supplier Count */}
        <KPICard
          label="Active Supplier Count"
          value={activeSupplierCount}
          unit="producers"
          subtitle="Direct P2C connections active"
          icon="👥"
          accent={colors.green}
        />
      </div>

      {/* =====================================================
          2. INTERACTIVE FLOW DIAGRAM (PRODUCER [LEFT] -> CONSUMER [RIGHT])
      ===================================================== */}
      <div
        className="flow-card"
        style={{
          padding: "24px",
          marginBottom: "28px",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                color: colors.text,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🌊</span> Real-Time Power Transmission Graph
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: colors.textMuted }}>
              Directional flow vectors indicating active microgrid transmission to your consumer node.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              fontSize: "12px",
              fontWeight: 600,
              color: colors.textMuted,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors.green }} />
              Active Stream
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="22" height="6" style={{ overflow: "visible" }}>
                <line x1="0" y1="3" x2="22" y2="3" stroke={colors.cyan} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Latest Order
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="22" height="6" style={{ overflow: "visible" }}>
                <line x1="0" y1="3" x2="22" y2="3" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
              </svg>
              Historical
            </span>
          </div>
        </div>

        {/* SVG DIAGRAM CANVAS */}
        <svg
          viewBox={`0 0 1000 ${diagramHeight}`}
          width="100%"
          style={{
            minWidth: "750px",
            height: "auto",
            display: "block",
            overflow: "visible",
          }}
          role="img"
          aria-label="P2C Energy Flow Diagram"
        >
          <defs>
            {/* Pulsing Gradient for flow vectors */}
            <linearGradient id="p2c-flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.green} />
              <stop offset="50%" stopColor={colors.cyan} />
              <stop offset="100%" stopColor={colors.sky} />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="p2c-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Flow vector marker (Arrowhead) */}
            <marker
              id="p2c-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill={colors.sky} />
            </marker>
          </defs>

          {/* COLUMN LABELS */}
          <text x={producerX + 10} y="22" fill={colors.textDim} fontSize="11" fontWeight="800" letterSpacing="0.08em">
            ENERGY SOURCES (PRODUCERS)
          </text>
          <text x={consumerX + 10} y="22" fill={colors.textDim} fontSize="11" fontWeight="800" letterSpacing="0.08em">
            DESTINATION (CONSUMER)
          </text>

          {/* ===================================================
              FLOW LINES & STREAM PIPELINES (PRODUCER -> CONSUMER)
          =================================================== */}
          {streams.map((stream, idx) => {
            const startY = topOffset + idx * (nodeHeight + laneGap) + nodeHeight / 2;
            const startX = producerX + producerWidth;
            const endX = consumerX;
            const endY = consumerPortY;

            // Bezier control points for smooth horizontal S-curve
            const cp1X = startX + 180;
            const cp1Y = startY;
            const cp2X = endX - 180;
            const cp2Y = endY;

            const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            return (
              <g key={`flow-${stream.id}`}>
                {/* 1. Underlying soft glow track */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={stream.isLatestActive ? "rgba(2, 132, 199, 0.12)" : "rgba(148, 163, 184, 0.08)"}
                  strokeWidth={stream.isLatestActive ? "8" : "5"}
                  strokeLinecap="round"
                />

                {/* 2. Flow vector line — animated (active) or dashed static (historical) */}
                {stream.isLatestActive ? (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#p2c-flow-gradient)"
                    strokeWidth="3.5"
                    strokeDasharray="8 12"
                    strokeLinecap="round"
                    filter="url(#p2c-glow)"
                    style={{
                      animation: `flowDash ${2 - idx * 0.25}s linear infinite`,
                    }}
                  />
                ) : (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    opacity="0.35"
                  />
                )}

                {/* 3. Stream intake connection dot */}
                <circle
                  cx={endX}
                  cy={endY}
                  r="5"
                  fill={stream.isLatestActive ? colors.cyan : "#94a3b8"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity={stream.isLatestActive ? 1 : 0.4}
                />

                {/* 4. Directional pulse indicator at midpoint — dim if historical */}
                <g
                  transform={`translate(${midX}, ${midY})`}
                  opacity={stream.isLatestActive ? 1 : 0.35}
                >
                  <rect
                    x="-42"
                    y="-12"
                    width="84"
                    height="24"
                    rx="12"
                    fill="#ffffff"
                    stroke={stream.isLatestActive ? "#bae6fd" : "#e2e8f0"}
                    strokeWidth="1.5"
                    filter="drop-shadow(0 2px 5px rgba(2, 132, 199, 0.12))"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={stream.isLatestActive ? colors.sky : "#94a3b8"}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="Inter, sans-serif"
                  >
                    {stream.energy} kWh →
                  </text>
                </g>
              </g>
            );
          })}

          {/* ===================================================
              SOURCE NODES: PRODUCER CARDS (LEFT SIDE)
          =================================================== */}
          {streams.map((stream, idx) => {
            const cardY = topOffset + idx * (nodeHeight + laneGap);

            return (
              <g key={`node-${stream.id}`} transform={`translate(${producerX}, ${cardY})`}>
                {/* Card Background */}
                <rect
                  x="0"
                  y="0"
                  width={producerWidth}
                  height={nodeHeight}
                  rx="14"
                  fill="#ffffff"
                  stroke="#bae6fd"
                  strokeWidth="1.5"
                  filter="drop-shadow(0 4px 10px rgba(2, 132, 199, 0.08))"
                />

                {/* Producer Icon Avatar */}
                <circle cx="34" cy={nodeHeight / 2} r="18" fill="rgba(2, 132, 199, 0.08)" />
                <text x="34" y={nodeHeight / 2 + 6} textAnchor="middle" fontSize="18">
                  {stream.icon}
                </text>

                {/* Producer Name & Type */}
                <text x="62" y="32" fill={colors.text} fontSize="15" fontWeight="700" fontFamily="Space Grotesk, sans-serif">
                  {stream.producer}
                </text>
                <text x="62" y="48" fill={colors.textMuted} fontSize="11" fontWeight="500">
                  {stream.type}
                </text>

                {/* Supply Stats (kWh & Rate) */}
                <text x="62" y="68" fill={colors.green} fontSize="13" fontWeight="800">
                  {stream.energy.toFixed(1)} kWh
                </text>
                <text x="145" y="68" fill={colors.amber} fontSize="12" fontWeight="700">
                  @ ₹{stream.rate.toFixed(2)}
                </text>

                {/* Live Transmission Port Ring */}
                <circle
                  cx={producerWidth}
                  cy={nodeHeight / 2}
                  r="6"
                  fill={colors.green}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* ===================================================
              DESTINATION NODE: ACTIVE CONSUMER CARD (RIGHT SIDE)
          =================================================== */}
          {streams.length > 0 && (
            <g transform={`translate(${consumerX}, ${consumerY})`}>
              {/* Halo pulse effect */}
              <rect
                x="-6"
                y="-6"
                width={consumerWidth + 12}
                height={consumerHeight + 12}
                rx="20"
                fill="none"
                stroke="rgba(2, 132, 199, 0.25)"
                strokeWidth="2"
                strokeDasharray="6 6"
              />

              {/* Consumer Card Box */}
              <rect
                x="0"
                y="0"
                width={consumerWidth}
                height={consumerHeight}
                rx="16"
                fill="#ffffff"
                stroke={colors.sky}
                strokeWidth="2"
                filter="drop-shadow(0 12px 28px rgba(2, 132, 199, 0.16))"
              />

              {/* Header with Avatar & Online Badge */}
              <circle cx="36" cy="38" r="18" fill="rgba(2, 132, 199, 0.12)" />
              <text x="36" y="44" textAnchor="middle" fontSize="18">
                🏠
              </text>

              <text x="64" y="32" fill={colors.text} fontSize="17" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
                {username}
              </text>
              <text x="64" y="48" fill={colors.green} fontSize="11" fontWeight="700">
                ● Live Reception Active
              </text>

              {/* Intake Divider */}
              <line x1="20" y1="62" x2={consumerWidth - 20} y2="62" stroke="#e0f2fe" strokeWidth="1" />

              {/* Live Metrics inside Consumer Node */}
              <text x="24" y="82" fill={colors.textMuted} fontSize="11" fontWeight="600" textTransform="uppercase">
                Incoming Clean Power
              </text>
              <text x="24" y="104" fill={colors.sky} fontSize="20" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
                {totalReceived.toFixed(2)} kWh
              </text>

              <text x="24" y="120" fill={colors.textDim} fontSize="10" fontWeight="500">
                ⚡ Stable 230V · 50Hz Microgrid Load
              </text>

              {/* Intake Reception Port */}
              <circle
                cx="0"
                cy={consumerHeight / 2}
                r="7"
                fill={colors.cyan}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* =====================================================
          3. ACTIVE SOURCE BREAKDOWN TABLE
      ===================================================== */}
      <div className="flow-card" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                color: colors.text,
                margin: 0,
              }}
            >
              Active Source Breakdown
            </h2>
            <p style={{ margin: "2px 0 0", color: colors.textMuted, fontSize: "13px" }}>
              Detailed breakdown of active streams feeding into your consumer premise.
            </p>
          </div>

          <div
            style={{
              background: "rgba(16, 185, 129, 0.08)",
              color: colors.green,
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {streams.length} Stream{streams.length !== 1 ? "s" : ""} Online
          </div>
        </div>

        {/* TABLE */}
        <div style={{ overflowX: "auto" }}>
          <table className="flow-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Source Type</th>
                <th>Supplied Energy</th>
                <th>Agreed Rate</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Transaction Type</th>
              </tr>
            </thead>
            <tbody>
              {streams.map((stream) => {
                const totalCost = stream.energy * stream.rate;
                const sharePercent = totalReceived > 0 ? ((stream.energy / totalReceived) * 100).toFixed(0) : 0;

                return (
                  <tr key={`tbl-${stream.id}`}>
                    {/* Supplier Name */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "20px" }}>{stream.icon}</span>
                        <div>
                          <strong style={{ fontSize: "15px", color: colors.text }}>
                            {stream.producer}
                          </strong>
                          <div style={{ fontSize: "11px", color: colors.textDim }}>
                            ID: {stream.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Source Type */}
                    <td>
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: colors.textMuted,
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {stream.type}
                      </span>
                    </td>

                    {/* Supplied Energy */}
                    <td>
                      <div>
                        <strong style={{ fontSize: "15px", color: colors.text }}>
                          {stream.energy.toFixed(2)} kWh
                        </strong>
                        <div
                          style={{
                            fontSize: "11px",
                            color: colors.sky,
                            fontWeight: 600,
                            marginTop: "2px",
                          }}
                        >
                          {sharePercent}% of total intake
                        </div>
                      </div>
                    </td>

                    {/* Agreed Rate */}
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: colors.amber,
                          fontSize: "14px",
                        }}
                      >
                        ₹{stream.rate.toFixed(2)} / kWh
                      </span>
                    </td>

                    {/* Total Cost */}
                    <td>
                      <strong style={{ fontSize: "15px", color: colors.violet }}>
                        ₹{totalCost.toFixed(2)}
                      </strong>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(16, 185, 129, 0.1)",
                          color: colors.green,
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: colors.green,
                            boxShadow: `0 0 6px ${colors.green}`,
                          }}
                        />
                        {stream.status}
                      </span>
                    </td>

                    {/* Transaction Type */}
                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background:
                            stream.dealType === "Negotiated Deal"
                              ? "rgba(124, 58, 237, 0.1)"
                              : "rgba(2, 132, 199, 0.08)",
                          color:
                            stream.dealType === "Negotiated Deal"
                              ? colors.violet
                              : colors.sky,
                          border: `1px solid ${
                            stream.dealType === "Negotiated Deal"
                              ? "rgba(124, 58, 237, 0.25)"
                              : "#bae6fd"
                          }`,
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {stream.dealType === "Negotiated Deal" ? "🤖 " : "🛒 "}
                        {stream.dealType}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}