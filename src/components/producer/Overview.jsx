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
// Design tokens
// -------------------------------------------------------------
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
  red: "#FF6B6B",
  violet: "#B98CF2",
};

// -------------------------------------------------------------
// Fonts + responsive layout
// -------------------------------------------------------------
const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(63,208,224,0.55);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(63,208,224,0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(63,208,224,0);
  }
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
  .pv-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pv-split {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .pv-grid {
    grid-template-columns: 1fr;
  }
}
`;

// -------------------------------------------------------------
// Stat Card
// -------------------------------------------------------------
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

        <span style={{ fontSize: 18 }}>
          {icon}
        </span>
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

      <p
        style={{
          color: colors.textMuted,
          fontSize: 13,
          marginTop: 8,
          marginBottom: 0,
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

// -------------------------------------------------------------
// Producer Overview
// -------------------------------------------------------------
export default function ProducerOverview() {
  // -----------------------------------------------------------
  // Dashboard statistics
  // -----------------------------------------------------------
  const [stats, setStats] = useState({
    availableEnergy: 0,
    earnings: 0,
    energySold: 0,
    pendingRequests: 0,
  });

  // -----------------------------------------------------------
  // Real battery data
  // -----------------------------------------------------------
  const [battery, setBattery] = useState(null);

  // -----------------------------------------------------------
  // Loading / error states
  // -----------------------------------------------------------
  const [batteryLoading, setBatteryLoading] = useState(true);
  const [batteryError, setBatteryError] = useState("");

  // -----------------------------------------------------------
  // Revenue chart
  // -----------------------------------------------------------
  const [revenueTransactions, setRevenueTransactions] = useState([]);
  const [revenueRange, setRevenueRange] = useState("Month");
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState("");

  const revenueAnalytics = buildPeriodAnalytics(
    revenueTransactions,
    revenueRange
  );
  const revenueData = revenueAnalytics.chartData;

  // -----------------------------------------------------------
  // Load dashboard when page opens
  // -----------------------------------------------------------
  useEffect(() => {
    loadDashboard();
    loadBattery();
    loadRevenueAnalytics();
  }, []);

  const loadRevenueAnalytics = async () => {
    const username = localStorage.getItem("username");

    if (!username) {
      setRevenueError("Producer username not found.");
      setRevenueLoading(false);
      return;
    }

    try {
      setRevenueLoading(true);
      setRevenueError("");
      const response = await axios.get(
        `${API}/trading/transactions/producer/${encodeURIComponent(username)}`
      );
      setRevenueTransactions(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Failed to load producer revenue analytics:", err);
      setRevenueError("Unable to load revenue analytics.");
    } finally {
      setRevenueLoading(false);
    }
  };

  // -----------------------------------------------------------
  // Load trading dashboard data
  // -----------------------------------------------------------
  const loadDashboard = async () => {
    try {
      const username = localStorage.getItem("username");

      const tradingResponse = await axios.get(
        `${API}/trading/all`
      );

      const requestResponse = await axios.get(
        `${API}/trading/requests`
      );

      const tradingData = Array.isArray(tradingResponse.data)
        ? tradingResponse.data
        : [];

      const requestData = Array.isArray(requestResponse.data)
        ? requestResponse.data
        : [];

      // -------------------------------------------------------
      // Producer's listings
      // -------------------------------------------------------
      const myListings = tradingData.filter(
        (item) => item.producer === username
      );

      // -------------------------------------------------------
      // Producer's buy requests
      // -------------------------------------------------------
      const myRequests = requestData.filter(
        (item) => item.producer === username
      );

      // -------------------------------------------------------
      // Available energy
      // -------------------------------------------------------
      const availableEnergy = myListings
        .filter((item) => item.status === "Available")
        .reduce(
          (sum, item) => sum + Number(item.energy || 0),
          0
        );

      // -------------------------------------------------------
      // Accepted transactions
      // -------------------------------------------------------
      const accepted = myRequests.filter(
        (item) => item.status === "Accepted"
      );

      // -------------------------------------------------------
      // Pending requests
      // -------------------------------------------------------
      const pending = myRequests.filter(
        (item) => item.status === "Pending"
      );

      // -------------------------------------------------------
      // Earnings
      // -------------------------------------------------------
      const earnings = accepted.reduce(
        (sum, item) => sum + Number(item.total_price || 0),
        0
      );

      // -------------------------------------------------------
      // Energy sold
      // -------------------------------------------------------
      const sold = accepted.reduce(
        (sum, item) => sum + Number(item.energy || 0),
        0
      );

      setStats({
        availableEnergy,
        earnings,
        energySold: sold,
        pendingRequests: pending.length,
      });
    } catch (err) {
      console.error("Failed to load producer dashboard:", err);
    }
  };

  // -------------------------------------------------------------
  // Load real battery dataset API
  // -------------------------------------------------------------
  const loadBattery = async () => {
    try {
      setBatteryLoading(true);
      setBatteryError("");

      const response = await axios.get(
        `${API}/battery/status`
      );

      setBattery(response.data);
    } catch (err) {
      console.error("Failed to load battery data:", err);

      setBatteryError(
        "Unable to load battery data"
      );
    } finally {
      setBatteryLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Battery values
  // -------------------------------------------------------------
  const batterySoc = Number(battery?.soc ?? 0);

  const batteryState = battery?.state ?? "Unavailable";

  const batteryHealth = battery?.health ?? "Unavailable";

  const batteryVoltage = Number(
    battery?.voltage ?? 0
  );

  const batteryPower = Number(
    battery?.battery_power ?? 0
  );

  // -------------------------------------------------------------
  // Battery color based on SOC
  // -------------------------------------------------------------
  const getBatteryColor = () => {
    if (batterySoc <= 20) {
      return colors.red;
    }

    if (batterySoc <= 40) {
      return colors.orange;
    }

    return colors.green;
  };

  const batteryColor = getBatteryColor();

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(
          circle at 85% 0%,
          #16233A 0%,
          ${colors.bg} 55%
        )`,
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{fontImport}</style>

      {/* ===================================================== */}
      {/* HEADER */}
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

          <p
            style={{
              color: colors.textMuted,
              marginTop: 6,
              fontSize: 14,
            }}
          >
            Monitor your energy production and trading activity.
          </p>
        </div>

        <div
          style={{
            background: `linear-gradient(
              135deg,
              ${colors.amber},
              #D9860F
            )`,
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

      {/* ===================================================== */}
      {/* STAT CARDS */}
      {/* ===================================================== */}

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

      {/* ===================================================== */}
      {/* REVENUE + BATTERY */}
      {/* ===================================================== */}

      <div className="pv-split">

        {/* =================================================== */}
        {/* REVENUE ANALYTICS */}
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
                  fontSize: 17,
                  fontWeight: 600,
                  color: colors.text,
                  margin: 0,
                }}
              >
                Revenue Analytics
              </h2>
              <p style={{ color: colors.textMuted, fontSize: 12, margin: "5px 0 0" }}>
                Completed sales in the current {revenueRange.toLowerCase()}.
              </p>
            </div>
            <TimeRangeSelect
              value={revenueRange}
              onChange={setRevenueRange}
              accent={colors.green}
              text={colors.text}
              muted={colors.textMuted}
              border={colors.border}
              surface={colors.surfaceAlt}
            />
          </div>

          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={{ color: colors.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Revenue
              </div>
              <strong style={{ color: colors.green, fontFamily: "Space Grotesk, sans-serif", fontSize: 20 }}>
                ₹{revenueAnalytics.summary.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
            <div>
              <div style={{ color: colors.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Energy Sold
              </div>
              <strong style={{ color: colors.cyan, fontFamily: "Space Grotesk, sans-serif", fontSize: 20 }}>
                {revenueAnalytics.summary.energy.toFixed(2)} kWh
              </strong>
            </div>
          </div>

          {revenueLoading ? (
            <div style={{ height: 320, display: "grid", placeItems: "center", color: colors.textMuted, fontSize: 13 }}>
              Loading revenue analytics...
            </div>
          ) : revenueError ? (
            <div style={{ height: 320, display: "grid", placeItems: "center", color: colors.red, fontSize: 13, textAlign: "center" }}>
              {revenueError}
            </div>
          ) : revenueData.length === 0 ? (
            <div style={{ height: 320, display: "grid", placeItems: "center", color: colors.textMuted, fontSize: 13, textAlign: "center" }}>
              No data available for this period.
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={revenueData}>

              <CartesianGrid
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                stroke={colors.textMuted}
                tick={{
                  fill: colors.textMuted,
                  fontSize: 12,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                stroke={colors.textMuted}
                tick={{
                  fill: colors.textMuted,
                  fontSize: 12,
                }}
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
                labelStyle={{
                  color: colors.textMuted,
                }}
                formatter={(value, name, item) => {
                  if (name === "Revenue") {
                    return [`₹${Number(value).toFixed(2)}`, name];
                  }
                  return [value, name];
                }}
              />

              <Line
                type="monotone"
                dataKey="amount"
                name="Revenue"
                stroke={colors.green}
                strokeWidth={3}
                dot={{
                  r: 3,
                  fill: colors.green,
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 5,
                }}
              />

            </LineChart>
          </ResponsiveContainer>
          )}

        </Panel>

        {/* =================================================== */}
        {/* RIGHT SIDE */}
        {/* =================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >

          {/* =============================================== */}
          {/* REAL BATTERY STATUS */}
          {/* =============================================== */}

          <Panel
            style={{
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >

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

              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: batteryLoading
                    ? colors.orange
                    : batteryError
                    ? colors.red
                    : batteryColor,
                }}
              />

            </div>

            {/* Battery bar */}

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
                  width: `${batterySoc}%`,
                  height: "100%",
                  background: `linear-gradient(
                    to right,
                    ${batteryColor},
                    ${batteryColor}
                  )`,
                  boxShadow: `0 0 10px ${batteryColor}66`,
                  transition: "width 0.5s ease",
                }}
              />

            </div>

            {/* Battery percentage + state */}

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 10,
              }}
            >

              <span
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: 26,
                  color: batteryColor,
                }}
              >
                {batteryLoading
                  ? "..."
                  : `${batterySoc}%`}
              </span>

              <span
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                {batteryLoading
                  ? "Loading..."
                  : batteryError
                  ? "Unavailable"
                  : `${batteryState} · ${batteryHealth}`}
              </span>

            </div>

            {/* Battery technical information */}

            {!batteryLoading && !batteryError && battery && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  marginTop: 8,
                  color: colors.textMuted,
                  fontSize: 11,
                }}
              >

                <span>
                  {batteryVoltage} V
                </span>

                <span>
                  {batteryPower} W
                </span>

                <span>
                  {battery.source}
                </span>

              </div>
            )}

            {batteryError && (
              <button
                onClick={loadBattery}
                style={{
                  marginTop: 8,
                  background: "rgba(255,107,107,0.12)",
                  border: "1px solid rgba(255,107,107,0.3)",
                  color: colors.red,
                  borderRadius: 7,
                  padding: "7px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            )}

          </Panel>

          {/* =============================================== */}
          {/* BATTERY DETAILS */}
          {/* =============================================== */}

          <Panel
            style={{
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >

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
                Battery Power
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
                {batteryLoading
                  ? "..."
                  : battery
                  ? `${batteryPower} W`
                  : "--"}
              </div>

              <p
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                Current battery power
              </p>

            </div>

            <div
              style={{
                background: battery
                  ? "rgba(63,208,224,0.10)"
                  : "rgba(255,255,255,0.05)",
                color: battery
                  ? colors.cyan
                  : colors.textMuted,
                padding: "8px",
                borderRadius: 8,
                textAlign: "center",
                fontWeight: 700,
                fontSize: 13,
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
