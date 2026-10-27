import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  buildPeriodAnalytics,
  TimeRangeSelect,
} from "../overview/TransactionAnalytics";

const API = API_BASE_URL;

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// -------------------------------------------------------------
// Design tokens — Warm Earth-Tone Palette
// -------------------------------------------------------------
const C = {
  bg:          "#faf7f2",
  surface:     "#fefcf9",
  surfaceAlt:  "#efe9de",
  border:      "#e6decb",
  borderAlt:   "#d8c8b0",
  text:        "#2c221e",
  textMuted:   "#6e6056",
  warmBrown:   "#4a3525",
  gold:        "#859b32",
  amber:       "#d97706",
  cyan:        "#2f8196",
  green:       "#859b32",
  orange:      "#b85c28",
  red:         "#991b1b",
};

// -------------------------------------------------------------
// Fonts + responsive layout
// -------------------------------------------------------------
const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

@keyframes pulse {
  0%   { box-shadow: 0 0 0 0   rgba(133,155,50,0.55); }
  70%  { box-shadow: 0 0 0 8px rgba(133,155,50,0); }
  100% { box-shadow: 0 0 0 0   rgba(133,155,50,0); }
}

.pv-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.pv-split {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  margin-top: 22px;
}

@media (max-width: 900px) {
  .pv-grid  { grid-template-columns: repeat(2, 1fr); }
  .pv-split { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .pv-grid { grid-template-columns: 1fr; }
}
`;

// -------------------------------------------------------------
// Stat Card
// -------------------------------------------------------------
function StatCard({ label, value, unit, accent, icon }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `5px solid ${accent}`,
        borderRadius: 14,
        padding: "22px 24px",
        boxShadow: "0 4px 16px rgba(74,53,37,0.07)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: C.textMuted,
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>

      <div
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontWeight: 800,
          fontSize: 38,
          color: C.text,
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      <p
        style={{
          color: C.textMuted,
          fontSize: 14,
          marginTop: 10,
          marginBottom: 0,
          fontWeight: 500,
        }}
      >
        {unit}
      </p>
    </div>
  );
}

// -------------------------------------------------------------
// Panel
// -------------------------------------------------------------
function Panel({ children, style = {} }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "24px 26px",
        boxShadow: "0 4px 16px rgba(74,53,37,0.07)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// -------------------------------------------------------------
// Producer Overview
// -------------------------------------------------------------
export default function ProducerOverview() {
  // Dashboard statistics
  const [stats, setStats] = useState({
    availableEnergy: 0,
    earnings: 0,
    energySold: 0,
    pendingRequests: 0,
  });

  // Battery data
  const [battery, setBattery] = useState(null);
  const [batteryLoading, setBatteryLoading] = useState(true);
  const [batteryError, setBatteryError] = useState("");

  // Revenue chart
  const [revenueTransactions, setRevenueTransactions] = useState([]);
  const [revenueRange, setRevenueRange] = useState("Month");
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState("");

  const revenueAnalytics = buildPeriodAnalytics(revenueTransactions, revenueRange);
  const revenueData = revenueAnalytics.chartData;

  // Load on mount + 10s silent polling
  useEffect(() => {
    loadDashboard();
    loadBattery();
    loadRevenueAnalytics();
    const refreshEnergy = () => {
      loadDashboard(true);
      loadBattery(true);
    };
    window.addEventListener("energy-trade-updated", refreshEnergy);
    const timer = window.setInterval(() => {
      loadDashboard(true);
      loadBattery(true);
      loadRevenueAnalytics(true);
    }, 10000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("energy-trade-updated", refreshEnergy);
    };
  }, []);

  const loadRevenueAnalytics = async (silent = false) => {
    const username = localStorage.getItem("username");
    if (!username) {
      setRevenueError("Producer username not found.");
      if (!silent) setRevenueLoading(false);
      return;
    }
    try {
      if (!silent) setRevenueLoading(true);
      setRevenueError("");
      const response = await axios.get(
        `${API}/trading/transactions/producer/${encodeURIComponent(username)}`
      );
      setRevenueTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load producer revenue analytics:", err);
      if (!silent) setRevenueError("Unable to load revenue analytics.");
    } finally {
      if (!silent) setRevenueLoading(false);
    }
  };

  const loadDashboard = async (silent = false) => {
    try {
      const username = localStorage.getItem("username");
      const isProducerAccount = localStorage.getItem("user_role")?.toLowerCase() === "producer";
      const [requestResponse, balancesResponse] = await Promise.all([
        axios.get(`${API}/trading/requests`),
        isProducerAccount ? axios.get(`${API}/trading/balances`) : Promise.resolve({ data: {} }),
      ]);
      const requestData = Array.isArray(requestResponse.data) ? requestResponse.data : [];
      const userKey = username?.trim().toLowerCase();
      const myRequests = requestData.filter((item) => item.producer?.trim().toLowerCase() === userKey);
      const availableEnergy = Number(balancesResponse.data?.[userKey] || 0);

      const accepted = myRequests.filter((item) => item.status === "Accepted");
      const pending  = myRequests.filter((item) => item.status === "Pending");

      const earnings = accepted.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
      const sold     = accepted.reduce((sum, item) => sum + Number(item.energy || 0), 0);

      setStats({ availableEnergy, earnings, energySold: sold, pendingRequests: pending.length });
    } catch (err) {
      console.error("Failed to load producer dashboard:", err);
    }
  };

  const loadBattery = async (silent = false) => {
    try {
      if (!silent) setBatteryLoading(true);
      setBatteryError("");
      const response = await axios.get(`${API}/battery/status`);
      setBattery(response.data);
    } catch (err) {
      console.error("Failed to load battery data:", err);
      if (!silent) setBatteryError("Unable to load battery data");
    } finally {
      if (!silent) setBatteryLoading(false);
    }
  };

  // Battery derived values
  const batterySoc    = Number(battery?.soc ?? 0);
  const batteryState  = battery?.state   ?? "Unavailable";
  const batteryHealth = battery?.health  ?? "Unavailable";
  const batteryVoltage = Number(battery?.voltage ?? 0);
  const batteryPower   = Number(battery?.battery_power ?? 0);

  const getBatteryColor = () => {
    if (batterySoc <= 20) return C.red;
    if (batterySoc <= 40) return C.orange;
    return C.gold;
  };
  const batteryColor = getBatteryColor();

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #faf7f2 0%, #f5f0eb 60%, #efe9de 100%)",
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{fontImport}</style>

      {/* ===================================================== */}
      {/* HEADER                                                */}
      {/* ===================================================== */}
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
              color: C.gold,
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
                background: C.gold,
                display: "inline-block",
                boxShadow: `0 0 8px ${C.gold}`,
              }}
            />
            Producer · Live Grid
          </div>

          <h1
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 42,
              fontWeight: 800,
              color: C.text,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Overview
          </h1>

          <p style={{ color: C.textMuted, marginTop: 6, fontSize: 16 }}>
            Monitor your energy production and trading activity.
          </p>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #4a3525 0%, #5c4033 100%)",
            color: "#ffffff",
            padding: "13px 22px",
            borderRadius: 12,
            fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 15,
            boxShadow: "0 8px 20px rgba(74,53,37,0.28)",
            cursor: "default",
          }}
        >
          ⚡ Smart Energy Dashboard
        </div>
      </div>

      {/* ===================================================== */}
      {/* STAT CARDS                                            */}
      {/* ===================================================== */}
      <div className="pv-grid">
        <StatCard
          label="Available Energy"
          value={stats.availableEnergy}
          unit="kWh available"
          accent={C.amber}
          icon="⚡"
        />
        <StatCard
          label="Revenue"
          value={`₹${stats.earnings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          unit="total revenue"
          accent={C.gold}
          icon="💰"
        />
        <StatCard
          label="Energy Sold"
          value={stats.energySold.toLocaleString("en-IN")}
          unit="total energy sold"
          accent={C.cyan}
          icon="📦"
        />
        <StatCard
          label="Pending Requests"
          value={stats.pendingRequests}
          unit="waiting for approval"
          accent={C.orange}
          icon="⏳"
        />
      </div>

      {/* ===================================================== */}
      {/* REVENUE + BATTERY                                     */}
      {/* ===================================================== */}
      <div className="pv-split">

        {/* =================================================== */}
        {/* REVENUE ANALYTICS                                   */}
        {/* =================================================== */}
        <Panel style={{ minHeight: 420 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.text,
                  margin: 0,
                }}
              >
                Revenue Analytics
              </h2>
              <p style={{ color: C.textMuted, fontSize: 14, margin: "5px 0 0" }}>
                {revenueRange === "Month" ? "Completed sales in the last 30 days." : `Completed sales in the current ${revenueRange.toLowerCase()}.`}
              </p>
            </div>
            <TimeRangeSelect
              value={revenueRange}
              onChange={setRevenueRange}
              accent={C.gold}
              text={C.text}
              muted={C.textMuted}
              border={C.border}
              surface={C.surfaceAlt}
            />
          </div>

          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={{ color: C.textMuted, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Revenue
              </div>
              <strong style={{ color: C.gold, fontFamily: "Space Grotesk, sans-serif", fontSize: 24 }}>
                ₹{revenueAnalytics.summary.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div>
              <div style={{ color: C.textMuted, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Energy Sold
              </div>
              <strong style={{ color: C.cyan, fontFamily: "Space Grotesk, sans-serif", fontSize: 24 }}>
                {revenueAnalytics.summary.energy.toFixed(2)} kWh
              </strong>
            </div>
          </div>

          {revenueLoading ? (
            <div style={{ height: 320, display: "grid", placeItems: "center", color: C.textMuted, fontSize: 14 }}>
              Loading revenue analytics...
            </div>
          ) : revenueError ? (
            <div style={{ height: 320, display: "grid", placeItems: "center", color: C.red, fontSize: 14, textAlign: "center" }}>
              {revenueError}
            </div>
          ) : revenueData.length === 0 ? (
            <div style={{ height: 320, display: "grid", placeItems: "center", color: C.textMuted, fontSize: 14, textAlign: "center" }}>
              No data available for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={revenueData}>
                <CartesianGrid stroke="rgba(110,96,86,0.12)" vertical={false} />

                <XAxis
                  dataKey="label"
                  stroke={C.textMuted}
                  tick={{ fill: C.textMuted, fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  stroke={C.textMuted}
                  tick={{ fill: C.textMuted, fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                  }}
                  labelStyle={{ color: C.textMuted }}
                  formatter={(value, name) => {
                    if (name === "Revenue") return [`₹${Number(value).toFixed(2)}`, name];
                    return [value, name];
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Revenue"
                  stroke={C.gold}
                  strokeWidth={3}
                  dot={{ r: 3, fill: C.gold, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* =================================================== */}
        {/* RIGHT SIDE — BATTERY                                */}
        {/* =================================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* BATTERY STATUS */}
          <Panel style={{ minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.text,
                }}
              >
                🔋 Battery Status
              </h3>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: batteryLoading ? C.amber : batteryError ? C.red : batteryColor,
                  boxShadow: `0 0 6px ${batteryLoading ? C.amber : batteryError ? C.red : batteryColor}`,
                }}
              />
            </div>

            {/* Battery bar */}
            <div style={{ width: "100%", height: 14, background: C.surfaceAlt, borderRadius: 8, overflow: "hidden" }}>
              <div
                style={{
                  width: `${batterySoc}%`,
                  height: "100%",
                  background: `linear-gradient(to right, ${batteryColor}, ${batteryColor})`,
                  boxShadow: `0 0 10px ${batteryColor}66`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>

            {/* Battery % + state */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <span
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 800,
                  fontSize: 34,
                  color: batteryColor,
                }}
              >
                {batteryLoading ? "..." : `${batterySoc}%`}
              </span>
              <span style={{ color: C.textMuted, fontSize: 14, fontWeight: 600, textAlign: "right" }}>
                {batteryLoading
                  ? "Loading..."
                  : batteryError
                  ? "Unavailable"
                  : `${batteryState} · ${batteryHealth}`}
              </span>
            </div>

            {/* Technical info */}
            {!batteryLoading && !batteryError && battery && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 8, color: C.textMuted, fontSize: 13, fontWeight: 500 }}>
                <span>{batteryVoltage} V</span>
                <span>{batteryPower} W</span>
                <span>{battery.source}</span>
              </div>
            )}

            {batteryError && (
              <button
                onClick={() => loadBattery(false)}
                style={{
                  marginTop: 8,
                  background: "rgba(153,27,27,0.08)",
                  border: "1px solid rgba(153,27,27,0.25)",
                  color: C.red,
                  borderRadius: 7,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            )}
          </Panel>

          {/* BATTERY POWER */}
          <Panel style={{ minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: C.gold,
                  animation: "pulse 1.8s infinite",
                }}
              />
              <h3
                style={{
                  margin: 0,
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.text,
                }}
              >
                Battery Power
              </h3>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 800,
                  fontSize: 44,
                  color: C.gold,
                }}
              >
                {batteryLoading ? "..." : battery ? `${batteryPower} W` : "--"}
              </div>
              <p style={{ color: C.textMuted, fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                Current battery power
              </p>
            </div>

            <div
              style={{
                background: battery ? "rgba(133,155,50,0.10)" : C.surfaceAlt,
                color: battery ? C.gold : C.textMuted,
                border: `1px solid ${battery ? "rgba(133,155,50,0.25)" : C.border}`,
                padding: "10px 12px",
                borderRadius: 10,
                textAlign: "center",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {batteryLoading
                ? "Loading battery data..."
                : battery
                ? `${batteryState} · ${batteryVoltage} V`
                : "Battery data unavailable"}
            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
}
