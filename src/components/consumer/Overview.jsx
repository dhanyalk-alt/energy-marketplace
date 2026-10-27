import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import {
  buildPeriodAnalytics,
  TimeRangeSelect,
} from "../overview/TransactionAnalytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ------------------------------------------------------------
// DESIGN TOKENS (LIGHT COOL SKY BLUE THEME)
// ------------------------------------------------------------

const colors = {
  bg: "#f0f7ff",
  bgGradient: "linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 55%, #f8fafc 100%)",
  surface: "rgba(255, 255, 255, 0.88)",
  surfaceAlt: "#ffffff",
  border: "#bae6fd",
  borderSubtle: "rgba(2, 132, 199, 0.16)",
  text: "#0f172a",          // Dark slate blue (Primary Text)
  textNavy: "#1e3a8a",      // Cool navy
  textMuted: "#475569",     // Subtitles & Secondary Text
  textDim: "#64748b",       // Subtle indicators
  sky: "#0284c7",           // Primary Sky Blue Accent
  cyan: "#06b6d4",          // Cyan Accent
  amber: "#d97706",         // Energy Amber
  violet: "#7c3aed",        // Money Violet
  green: "#10b981",         // Green Accent
  red: "#ef4444",           // Error Red
};

const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

@keyframes pulseCyan {
  0% {
    box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.6);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(2, 132, 199, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(2, 132, 199, 0);
  }
}

.ov-container {
  min-height: 100%;
  background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 55%, #f8fafc 100%);
  padding: 32px 30px 48px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  border-radius: 20px;
  box-sizing: border-box;
}

.ov-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.ov-split {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 22px;
  margin-top: 24px;
  align-items: stretch;
}

.ov-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid #bae6fd;
  border-radius: 18px;
  box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 4px 6px -4px rgba(2, 132, 199, 0.04);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.ov-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px -4px rgba(2, 132, 199, 0.14), 0 6px 12px -4px rgba(2, 132, 199, 0.06);
}

@media (max-width: 1200px) {
  .ov-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .ov-split {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .ov-container {
    padding: 20px 16px;
  }
  .ov-grid {
    grid-template-columns: 1fr;
  }
}
`;

// ------------------------------------------------------------
// STAT CARD
// ------------------------------------------------------------

function StatCard({
  label,
  value,
  unit,
  accent,
  icon,
}) {
  return (
    <div
      className="ov-card"
      style={{
        borderLeft: `4px solid ${accent}`,
        padding: "22px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: colors.textMuted,
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 18 }}>
          {icon}
        </span>

        {label}
      </div>

      <div
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontWeight: 700,
          fontSize: 32,
          color: colors.text,
          lineHeight: 1.1,
        }}
      >
        {value}

        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: colors.textDim,
            marginLeft: 8,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------

export default function Overview() {
  const username = localStorage.getItem("username");

  const [transactions, setTransactions] = useState([]);
  const [marketListings, setMarketListings] = useState([]);
  const [analyticsRange, setAnalyticsRange] = useState("Month");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----------------------------------------------------------
  // FETCH DATA
  // ----------------------------------------------------------

  useEffect(() => {
    const fetchOverviewData = async (silent = false) => {
      if (!username) {
        setError("Consumer username not found.");
        setLoading(false);
        return;
      }

      try {
        if (!silent) setLoading(true);
        const transactionResponse = await fetch(
          `${API_BASE_URL}/trading/transactions/consumer/${encodeURIComponent(
            username
          )}`
        );

        const marketResponse = await fetch(
          `${API_BASE_URL}/trading/all`
        );

        if (!transactionResponse.ok) {
          throw new Error(
            "Failed to fetch consumer transactions."
          );
        }

        if (!marketResponse.ok) {
          throw new Error(
            "Failed to fetch marketplace data."
          );
        }

        const transactionData =
          await transactionResponse.json();

        const marketData =
          await marketResponse.json();

        setTransactions(
          Array.isArray(transactionData)
            ? transactionData
            : []
        );

        setMarketListings(
          Array.isArray(marketData)
            ? marketData
            : []
        );
      } catch (err) {
        console.error(
          "Consumer overview error:",
          err
        );

        setError(
          "Unable to load overview data."
        );
      } finally {
        if (!silent) setLoading(false);
      }
    };

    fetchOverviewData(false);

    // 10s silent background polling
    const pollTimer = window.setInterval(() => fetchOverviewData(true), 10000);
    return () => window.clearInterval(pollTimer);
  }, [username]);

  // ----------------------------------------------------------
  // COMPLETED TRANSACTIONS
  // ----------------------------------------------------------

  const completedTransactions =
    transactions.filter(
      (transaction) =>
        transaction.status === "Completed"
    );

  // ----------------------------------------------------------
  // CALCULATE STATISTICS
  // ----------------------------------------------------------

  const energyPurchased =
    completedTransactions.reduce(
      (total, transaction) =>
        total +
        Number(transaction.energy || 0),
      0
    );

  const moneySpent =
    completedTransactions.reduce(
      (total, transaction) =>
        total +
        Number(transaction.total_amount || 0),
      0
    );

  const purchaseCount =
    completedTransactions.length;

  const availableEnergy =
    marketListings.reduce(
      (total, listing) =>
        total +
        Number(listing.energy || 0),
      0
    );

  // ----------------------------------------------------------
  // SPENDING ANALYTICS
  // ----------------------------------------------------------

  const spendingAnalytics = buildPeriodAnalytics(
    completedTransactions,
    analyticsRange
  );
  const chartData = spendingAnalytics.chartData;

  // ----------------------------------------------------------
  // MARKET STATUS
  // ----------------------------------------------------------

  const marketListingsCount =
    marketListings.length;

  const marketStatus =
    marketListingsCount > 0
      ? "Active"
      : "No Listings";

  const marketPercentage =
    Math.min(
      100,
      marketListingsCount * 10
    );

  const totalSegments = 10;

  const litSegments = Math.round(
    (marketPercentage / 100) *
      totalSegments
  );

  // ----------------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div className="ov-container">
        <style>{fontImport}</style>

        <h1
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "2rem",
            fontWeight: 700,
            color: colors.text,
          }}
        >
          Loading Overview...
        </h1>

        <p
          style={{
            color: colors.textMuted,
            fontSize: "15px",
          }}
        >
          Fetching your marketplace activity.
        </p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR STATE
  // ----------------------------------------------------------

  if (error) {
    return (
      <div className="ov-container">
        <style>{fontImport}</style>

        <h1
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "2rem",
            fontWeight: 700,
            color: colors.text,
          }}
        >
          Consumer Overview
        </h1>

        <div
          style={{
            marginTop: 20,
            padding: 18,
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: colors.red,
            fontSize: "15px",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // MAIN UI
  // ----------------------------------------------------------

  return (
    <div className="ov-container">
      <style>{fontImport}</style>

      {/* ======================================================
          HEADER SECTION
      ====================================================== */}

      <div style={{ marginBottom: 30 }}>
        <div
          style={{
            color: colors.sky,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Consumer · Live Microgrid
        </div>

        <h1
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "2.25rem", // text-4xl
            fontWeight: 800,
            color: colors.text,
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          Overview
        </h1>

        <p
          style={{
            color: colors.textMuted,
            marginTop: 8,
            fontSize: 16, // text-base
            lineHeight: 1.5,
          }}
        >
          Welcome back,{" "}
          <strong
            style={{
              color: colors.textNavy,
              fontWeight: 700,
            }}
          >
            {username || "Consumer"}
          </strong>
          . Here's your real-time clean power and marketplace activity.
        </p>
      </div>

      {/* ======================================================
          STAT CARDS
      ====================================================== */}

      <div className="ov-grid">
        <StatCard
          label="Energy Purchased"
          value={energyPurchased.toFixed(2)}
          unit="kWh"
          accent={colors.amber}
          icon="⚡"
        />

        <StatCard
          label="Money Spent"
          value={`₹${moneySpent.toFixed(2)}`}
          unit="total"
          accent={colors.violet}
          icon="💳"
        />

        <StatCard
          label="Purchases"
          value={purchaseCount}
          unit="completed"
          accent={colors.green}
          icon="📦"
        />

        <StatCard
          label="Market Energy"
          value={availableEnergy.toFixed(2)}
          unit="kWh available"
          accent={colors.sky}
          icon="🔋"
        />
      </div>

      {/* ======================================================
          EXPANDED ANALYTICS & MARKET STATUS (CLEAN VIEWPORT FILL)
      ====================================================== */}

      <div className="ov-split">
        {/* SPENDING CHART */}
        <div
          className="ov-card"
          style={{
            padding: "26px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: colors.cyan,
                    animation: "pulseCyan 1.8s infinite",
                  }}
                />

                <div>
                  <h2
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontSize: 24, // text-2xl
                      fontWeight: 700,
                      color: colors.text,
                      margin: 0,
                    }}
                  >
                    Spending Analytics
                  </h2>
                  <p style={{ color: colors.textMuted, fontSize: 15, margin: "4px 0 0" }}>
                    {analyticsRange === "Month" ? "Completed purchases in the last 30 days." : `Completed purchases in the current ${analyticsRange.toLowerCase()}.`}
                  </p>
                </div>
              </div>

              <TimeRangeSelect
                value={analyticsRange}
                onChange={setAnalyticsRange}
                accent={colors.cyan}
                text={colors.text}
                muted={colors.textMuted}
                border={colors.border}
                surface={colors.surfaceAlt}
                fontSize={13}
              />
            </div>

            <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 22 }}>
              <div>
                <div style={{ color: colors.textDim, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Money Spent
                </div>
                <strong style={{ color: colors.violet, fontFamily: "Space Grotesk, sans-serif", fontSize: 30, fontWeight: 800 }}>
                  ₹{spendingAnalytics.summary.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <div style={{ color: colors.textDim, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Energy Purchased
                </div>
                <strong style={{ color: colors.cyan, fontFamily: "Space Grotesk, sans-serif", fontSize: 30, fontWeight: 800 }}>
                  {spendingAnalytics.summary.energy.toFixed(2)} kWh
                </strong>
              </div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid
                  stroke="rgba(2, 132, 199, 0.08)"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  stroke={colors.textMuted}
                  tick={{
                    fill: colors.textMuted,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  stroke={colors.textMuted}
                  tick={{
                    fill: colors.textMuted,
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background:
                      colors.surfaceAlt,
                    border:
                      `1px solid ${colors.border}`,
                    borderRadius: 10,
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: 500,
                    boxShadow: "0 8px 24px rgba(2, 132, 199, 0.12)",
                  }}
                  labelStyle={{
                    color: colors.textMuted,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  formatter={(value) => [
                    `₹${Number(value).toFixed(2)}`,
                    "Spending",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Spending"
                  stroke={colors.sky}
                  strokeWidth={3.5}
                  dot={{
                    r: 5,
                    fill: colors.sky,
                    strokeWidth: 2,
                    stroke: "#ffffff",
                  }}
                  activeDot={{
                    r: 7,
                    fill: colors.sky,
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 280,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                color: colors.textMuted,
                fontSize: 13,
              }}
            >
              No data available for this period.
            </div>
          )}

          {completedTransactions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: colors.textMuted,
                fontSize: 13,
                marginTop: -15,
              }}
            >
              Your spending analytics will appear
              here after your first completed purchase.
            </div>
          )}
        </div>

        {/* MARKET STATUS */}
        <div
          className="ov-card"
          style={{
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 24, // text-2xl
                fontWeight: 700,
                color: colors.text,
                margin: 0,
              }}
            >
              Marketplace Status
            </h2>
            <p style={{ color: colors.textMuted, fontSize: 15, margin: "4px 0 0" }}>
              Live microgrid trading activity
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "24px 0" }}>
            {/* STATUS SEGMENTS */}
            <div
              style={{
                display: "flex",
                gap: 5,
              }}
            >
              {Array.from({
                length: totalSegments,
              }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: 10,
                    height: 32,
                    borderRadius: 3,
                    background:
                      index < litSegments
                        ? colors.sky
                        : "#e0f2fe",
                    boxShadow:
                      index < litSegments
                        ? `0 0 10px ${colors.sky}77`
                        : "none",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>

            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 800,
                fontSize: 32, // text-3xl
                color: colors.sky,
                marginTop: 22,
                letterSpacing: "-0.01em",
              }}
            >
              {marketStatus.toUpperCase()}
            </div>

            <p
              style={{
                color: colors.textNavy,
                fontWeight: 600,
                marginTop: 8,
                fontSize: 16, // text-base
              }}
            >
              {marketListingsCount} active listing
              {marketListingsCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div
            style={{
              width: "100%",
              background: "rgba(2, 132, 199, 0.08)",
              border: "1px solid #bae6fd",
              borderRadius: 999,
              padding: "10px 18px",
              color: colors.sky,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            🔋 {availableEnergy.toFixed(2)} kWh available
          </div>
        </div>
      </div>
    </div>
  );
}
