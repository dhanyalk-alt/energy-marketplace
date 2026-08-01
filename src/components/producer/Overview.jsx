import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ---- Design tokens (shared with Consumer Overview) ------------------
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
  orange: "#FF8A65",
  violet: "#B98CF2",
};

const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(63,208,224,0.55); }
  70% { box-shadow: 0 0 0 8px rgba(63,208,224,0); }
  100% { box-shadow: 0 0 0 0 rgba(63,208,224,0); }
}

.pv-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.pv-split { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; margin-top: 22px; }
.pv-table th, .pv-table td { padding: 12px 14px; text-align: center; }
.pv-table tbody tr:hover { background: rgba(255,255,255,0.03); }
.pv-table thead th {
  background: #182742 !important;
  color: #9FB0C9 !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  text-align: center !important;
  border: none !important;
  border-bottom: 2px solid #3FD0E0 !important;
  padding: 12px 14px !important;
}
.pv-table thead th:first-child { border-top-left-radius: 8px; }
.pv-table thead th:last-child { border-top-right-radius: 8px; }

@media (max-width: 900px) {
  .pv-grid { grid-template-columns: repeat(2, 1fr); }
  .pv-split { grid-template-columns: 1fr; }
}
@media (max-width: 520px) {
  .pv-grid { grid-template-columns: 1fr; }
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
          justifyContent: "space-between",
          alignItems: "center",
          color: colors.textMuted,
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
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
      </div>
      <p style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>
        {unit}
      </p>
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "22px 24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const statusColor = (status) =>
  status === "Accepted"
    ? colors.green
    : status === "Rejected"
    ? "#FF6B6B"
    : colors.orange;

export default function ProducerOverview() {
  const [stats, setStats] = useState({
    availableEnergy: 0,
    earnings: 0,
    energySold: 0,
    pendingRequests: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  const revenueData = [
    { day: "Mon", revenue: 2200 },
    { day: "Tue", revenue: 3100 },
    { day: "Wed", revenue: 1800 },
    { day: "Thu", revenue: 4500 },
    { day: "Fri", revenue: 3900 },
    { day: "Sat", revenue: 5200 },
    { day: "Sun", revenue: stats.earnings },
  ];

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const username = localStorage.getItem("username");

      const tradingResponse = await axios.get(
        "http://127.0.0.1:8000/trading/all"
      );

      const requestResponse = await axios.get(
        "http://127.0.0.1:8000/trading/requests"
      );

      const myListings = tradingResponse.data.filter(
        (item) => item.producer === username
      );

      const myRequests = requestResponse.data.filter(
        (item) => item.producer === username
      );

      setRecentTransactions(
        myRequests.sort((a, b) => b.id - a.id).slice(0, 5)
      );

      const availableEnergy = myListings.reduce(
        (sum, item) => sum + item.energy,
        0
      );

      const accepted = myRequests.filter((item) => item.status === "Accepted");
      const pending = myRequests.filter((item) => item.status === "Pending");

      const earnings = accepted.reduce(
        (sum, item) => sum + item.total_price,
        0
      );
      const sold = accepted.reduce((sum, item) => sum + item.energy, 0);

      setStats({
        availableEnergy,
        earnings,
        energySold: sold,
        pendingRequests: pending.length,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 85% 0%, #16233A 0%, ${colors.bg} 55%)`,
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{fontImport}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              color: colors.amber,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Producer · Live Grid
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
            Monitor your energy production and trading activity.
          </p>
        </div>

        <div
          style={{
            background: `linear-gradient(135deg, ${colors.amber}, #D9860F)`,
            color: "#1A1305",
            padding: "13px 22px",
            borderRadius: 12,
            fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 14,
            boxShadow: `0 10px 24px ${colors.amber}33`,
          }}
        >
          ⚡ Smart Energy Dashboard
        </div>
      </div>

      {/* Stat cards */}
      <div className="pv-grid">
        <StatCard
          label="Available Energy"
          value={stats.availableEnergy}
          unit="kWh available"
          accent={colors.amber}
          icon="⚡"
        />
        <StatCard
          label="Revenue"
          value={`₹${stats.earnings.toLocaleString()}`}
          unit="total earnings"
          accent={colors.green}
          icon="💰"
        />
        <StatCard
          label="Energy Sold"
          value={stats.energySold}
          unit="kWh sold"
          accent={colors.cyan}
          icon="📦"
        />
        <StatCard
          label="Pending Requests"
          value={stats.pendingRequests}
          unit="waiting for approval"
          accent={colors.orange}
          icon="⏳"
        />
      </div>

      {/* Chart + side panels */}
      <div className="pv-split">
        <Panel style={{ minHeight: 420 }}>
          <h2
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: colors.text,
              margin: "0 0 18px",
            }}
          >
            Revenue Analytics
          </h2>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={revenueData}>
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
                dataKey="revenue"
                stroke={colors.green}
                strokeWidth={3}
                dot={{ r: 3, fill: colors.green, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Battery status */}
          <Panel style={{ height: 200, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h3
              style={{
                margin: 0,
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: colors.text,
              }}
            >
              🔋 Battery Status
            </h3>

            <div
              style={{
                width: "100%",
                height: 12,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "82%",
                  height: "100%",
                  background: `linear-gradient(to right, ${colors.green}, #3BB86A)`,
                  boxShadow: `0 0 10px ${colors.green}66`,
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: 26,
                  color: colors.green,
                }}
              >
                82%
              </span>
              <span style={{ color: colors.textMuted, fontSize: 13, fontWeight: 600 }}>
                Healthy Battery
              </span>
            </div>
          </Panel>

          {/* Live price */}
          <Panel style={{ height: 200, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: colors.cyan,
                  animation: "pulse 1.8s infinite",
                }}
              />
              <h3
                style={{
                  margin: 0,
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: colors.text,
                }}
              >
                Live Electricity Price
              </h3>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: 36,
                  color: colors.cyan,
                }}
              >
                ₹8.35
              </div>
              <p style={{ color: colors.textMuted, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                per kWh
              </p>
            </div>

            <div
              style={{
                background: "rgba(95,217,138,0.12)",
                color: colors.green,
                padding: "8px",
                borderRadius: 8,
                textAlign: "center",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ▲ +3.2% Today
            </div>
          </Panel>
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ marginTop: 18 }}>
        <Panel>
          <h2
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: colors.text,
              margin: "0 0 6px",
            }}
          >
            Recent Transactions
          </h2>

          <table
            className="pv-table"
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              marginTop: 18,
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th>Consumer</th>
                <th>Energy</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "24px 14px", textAlign: "center", color: colors.textMuted }}>
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((item) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ color: colors.text }}>{item.consumer}</td>
                    <td style={{ color: colors.text }}>{item.energy} kWh</td>
                    <td style={{ color: colors.text }}>₹{item.total_price}</td>
                    <td style={{ color: statusColor(item.status), fontWeight: 700 }}>
                      {item.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}