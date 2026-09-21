import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
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
// DESIGN TOKENS
// ------------------------------------------------------------

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
  red: "#F87171",
};

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

.ov-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.ov-split {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  margin-top: 20px;
}

@media (max-width: 1100px) {
  .ov-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ov-split {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
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
        <span style={{ fontSize: 15 }}>
          {icon}
        </span>

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

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------

export default function Overview() {
  const username = localStorage.getItem("username");

  const [transactions, setTransactions] = useState([]);
  const [marketListings, setMarketListings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----------------------------------------------------------
  // FETCH DATA
  // ----------------------------------------------------------

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!username) {
        setError("Consumer username not found.");
        setLoading(false);
        return;
      }

      try {
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
        setLoading(false);
      }
    };

    fetchOverviewData();
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
  // PRICE HISTORY
  // ----------------------------------------------------------

  const priceData = [
    ...completedTransactions,
  ]
    .reverse()
    .slice(-7)
    .map((transaction, index) => ({
      purchase: `Purchase ${index + 1}`,
      price: Number(transaction.price || 0),
    }));

  const chartData =
    priceData.length > 0
      ? priceData
      : [
          {
            purchase: "No data",
            price: 0,
          },
        ];

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
  // LOADING
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at 15% 0%, #16233A 0%, #0B1420 55%)",
          padding: "32px 28px",
          fontFamily: "Inter, sans-serif",
          color: colors.text,
        }}
      >
        <style>{fontImport}</style>

        <h1
          style={{
            fontFamily:
              "Space Grotesk, sans-serif",
          }}
        >
          Loading Overview...
        </h1>

        <p
          style={{
            color: colors.textMuted,
          }}
        >
          Fetching your marketplace activity.
        </p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at 15% 0%, #16233A 0%, #0B1420 55%)",
          padding: "32px 28px",
          fontFamily: "Inter, sans-serif",
          color: colors.text,
        }}
      >
        <style>{fontImport}</style>

        <h1
          style={{
            fontFamily:
              "Space Grotesk, sans-serif",
          }}
        >
          Consumer Overview
        </h1>

        <div
          style={{
            marginTop: 20,
            padding: 18,
            borderRadius: 10,
            background:
              "rgba(248,113,113,0.08)",
            border:
              "1px solid rgba(248,113,113,0.25)",
            color: colors.red,
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
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 15% 0%, #16233A 0%, #0B1420 55%)",
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{fontImport}</style>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: 28,
        }}
      >
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
            fontFamily:
              "Space Grotesk, sans-serif",
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
          Welcome back,{" "}
          <strong
            style={{
              color: colors.text,
            }}
          >
            {username || "Consumer"}
          </strong>
          . Here's your marketplace activity.
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
          accent={colors.cyan}
          icon="🔋"
        />

      </div>

      {/* ======================================================
          CHART + MARKET STATUS
      ====================================================== */}

      <div className="ov-split">

        {/* PRICE CHART */}

        <div
          style={{
            background: colors.surface,
            border:
              `1px solid ${colors.border}`,
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
                animation:
                  "pulse 1.8s infinite",
              }}
            />

            <h2
              style={{
                fontFamily:
                  "Space Grotesk, sans-serif",
                fontSize: 17,
                fontWeight: 600,
                color: colors.text,
                margin: 0,
              }}
            >
              Purchase Price History
            </h2>
          </div>

          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <LineChart data={chartData}>

              <CartesianGrid
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />

              <XAxis
                dataKey="purchase"
                stroke={colors.textMuted}
                tick={{
                  fill: colors.textMuted,
                  fontSize: 11,
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
                  background:
                    colors.surfaceAlt,
                  border:
                    `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                }}
                labelStyle={{
                  color: colors.textMuted,
                }}
                formatter={(value) => [
                  `₹${Number(value).toFixed(2)}`,
                  "Price / kWh",
                ]}
              />

              <Line
                type="monotone"
                dataKey="price"
                stroke={colors.cyan}
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: colors.cyan,
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 6,
                }}
              />

            </LineChart>
          </ResponsiveContainer>

          {completedTransactions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: colors.textMuted,
                fontSize: 13,
                marginTop: -15,
              }}
            >
              Your purchase price history will
              appear here after your first
              completed purchase.
            </div>
          )}
        </div>

        {/* MARKET STATUS */}

        <div
          style={{
            background: colors.surface,
            border:
              `1px solid ${colors.border}`,
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
              fontFamily:
                "Space Grotesk, sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: colors.text,
              margin: 0,
            }}
          >
            Marketplace
          </h2>

          {/* STATUS SEGMENTS */}

          <div
            style={{
              display: "flex",
              gap: 4,
              marginTop: 26,
            }}
          >
            {Array.from({
              length: totalSegments,
            }).map((_, index) => (
              <div
                key={index}
                style={{
                  width: 10,
                  height: 28,
                  borderRadius: 2,
                  background:
                    index < litSegments
                      ? colors.cyan
                      : "rgba(255,255,255,0.08)",
                  boxShadow:
                    index < litSegments
                      ? `0 0 8px ${colors.cyan}66`
                      : "none",
                }}
              />
            ))}
          </div>

          <div
            style={{
              fontFamily:
                "Space Grotesk, sans-serif",
              fontWeight: 700,
              fontSize: 26,
              color: colors.cyan,
              marginTop: 22,
            }}
          >
            {marketStatus.toUpperCase()}
          </div>

          <p
            style={{
              color: colors.textMuted,
              marginTop: 4,
              fontSize: 13,
            }}
          >
            {marketListingsCount} active listing
            {marketListingsCount !== 1
              ? "s"
              : ""}
          </p>

          <div
            style={{
              marginTop: 14,
              color: colors.textMuted,
              fontSize: 12,
            }}
          >
            {availableEnergy.toFixed(2)} kWh
            currently available
          </div>
        </div>

      </div>

      {/* ======================================================
          RECENT PURCHASES
      ====================================================== */}

      <div
        style={{
          marginTop: 20,
          background: colors.surface,
          border:
            `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "22px 24px",
        }}
      >
        <h2
          style={{
            fontFamily:
              "Space Grotesk, sans-serif",
            fontSize: 17,
            fontWeight: 600,
            color: colors.text,
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          Recent Purchases
        </h2>

        {completedTransactions.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: colors.textMuted,
              background:
                "rgba(255,255,255,0.02)",
              borderRadius: 8,
            }}
          >
            No completed purchases yet.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>

                  <th style={headerStyle}>
                    Producer
                  </th>

                  <th style={headerStyle}>
                    Energy
                  </th>

                  <th style={headerStyle}>
                    Price / kWh
                  </th>

                  <th style={headerStyle}>
                    Total
                  </th>

                  <th style={headerStyle}>
                    Date
                  </th>

                  <th style={headerStyle}>
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {completedTransactions
                  .slice(0, 5)
                  .map((transaction) => (
                    <tr key={transaction.id}>

                      <td style={cellStyle}>
                        {transaction.producer}
                      </td>

                      <td style={cellStyle}>
                        {Number(
                          transaction.energy
                        ).toFixed(2)}{" "}
                        kWh
                      </td>

                      <td style={cellStyle}>
                        ₹
                        {Number(
                          transaction.price
                        ).toFixed(2)}
                      </td>

                      <td style={cellStyle}>
                        ₹
                        {Number(
                          transaction.total_amount
                        ).toFixed(2)}
                      </td>

                      <td style={cellStyle}>
                        {transaction.created_at
                          ? new Date(
                              transaction.created_at
                            ).toLocaleString()
                          : "-"}
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          color: colors.green,
                          fontWeight: 600,
                        }}
                      >
                        {transaction.status}
                      </td>

                    </tr>
                  ))}

              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ------------------------------------------------------------
// TABLE STYLES
// ------------------------------------------------------------

const headerStyle = {
  textAlign: "left",
  padding: "12px",
  backgroundColor: "#182742",
  color: "#9FB0C9",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom:
    "1px solid rgba(255,255,255,0.07)",
};

const cellStyle = {
  padding: "12px",
  color: "#EDF1F7",
  fontSize: "13px",
  borderBottom:
    "1px solid rgba(255,255,255,0.06)",
};