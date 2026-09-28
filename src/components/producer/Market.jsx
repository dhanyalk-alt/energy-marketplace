import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const API = API_BASE_URL;

const colors = {
  bg: "#faf7f2",
  surface: "#fefcf9",
  surfaceAlt: "#efe9de",
  border: "#d8c8b0",
  text: "#2c221e",
  textMuted: "#6e6056",
  cyan: "#859b32",
  green: "#859b32",
  orange: "#d97706",
  violet: "#859b32",
  red: "#991b1b",
  greenGold: "#859b32",
  warmBrown: "#4a3525",
};

const styleSheet = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.market-table th {
  background: #efe9de !important;
  color: #4a3525 !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  text-align: center !important;
  border: none !important;
  border-bottom: 2px solid #859b32 !important;
  padding: 13px 12px !important;
}

.market-table td {
  text-align: center;
  padding: 15px 12px;
  color: #2c221e;
  font-size: 14px;
  border-bottom: 1px solid #e6decb;
}

.market-table tbody tr:hover {
  background: #f7f3ea;
}

.market-table th:first-child {
  border-top-left-radius: 8px;
}

.market-table th:last-child {
  border-top-right-radius: 8px;
}

.market-refresh {
  transition: all 0.2s ease;
}

.market-refresh:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.market-buy {
  transition: all 0.2s ease;
}

.market-buy:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.market-legacy-macro-cards {
  display: none !important;
}

@media (max-width: 850px) {
  .market-summary {
    grid-template-columns: 1fr !important;
  }

  .iex-market-content {
    flex-direction: column !important;
    align-items: flex-start !important;
  }
}

@media (max-width: 700px) {
  .market-table {
    min-width: 760px;
  }
}
`;

const statusColor = (status) => {
  if (status === "Available") return colors.green;
  if (status === "Sold Out") return colors.red;
  return colors.orange;
};

const statusBackground = (status) => {
  if (status === "Available") {
    return "rgba(95,217,138,0.13)";
  }

  if (status === "Sold Out") {
    return "rgba(255,107,107,0.13)";
  }

  return "rgba(255,138,101,0.13)";
};

export default function Market() {
  const [listings, setListings] = useState([]);
  const [iexMarket, setIexMarket] = useState(null);

  const [loading, setLoading] = useState(true);
  const [iexLoading, setIexLoading] = useState(true);

  const [error, setError] = useState("");

  // Logged-in producer
  const username = localStorage.getItem("username");

  // ==========================================================
  // LOAD MARKET DATA
  // ==========================================================

  const loadMarket = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setIexLoading(true);
      }
      setError("");

      if (!username) {
        setError("Unable to identify the logged-in producer.");
        setListings([]);
        setIexMarket(null);
        return;
      }

      // ======================================================
      // 1. LIVE PRODUCER LISTINGS
      // ======================================================

      const producerResponse = await axios.get(
        `${API}/trading/market/${encodeURIComponent(
          username
        )}`
      );
      const balanceResponse = await axios.get(`${API}/trading/balances`);
      const balances = balanceResponse.data || {};

      const marketListings = Array.isArray(
        producerResponse.data?.listings
      )
        ? producerResponse.data.listings
        : [];

      // The API returns one current offer per producer. Keep this defensive
      // client-side normalization for older data and always render low-to-high.
      const latestByProducer = new Map();
      marketListings.forEach((listing) => {
        const producerKey = listing.producer?.trim().toLowerCase();
        const current = latestByProducer.get(producerKey);
        if (!current || Number(listing.id) > Number(current.id)) {
          latestByProducer.set(producerKey, {
            ...listing,
            availableEnergy: Number(balances[producerKey] ?? listing.energy),
          });
        }
      });
      setListings([...latestByProducer.values()].sort(
        (first, second) => Number(first.price || 0) - Number(second.price || 0),
      ));

      // ======================================================
      // 2. LATEST IEX MARKET DATA
      // ======================================================

      const iexResponse = await axios.get(
        `${API}/market/iex/latest`
      );

      /*
       * Backend response:
       *
       * {
       *   source: "IEX",
       *   record: {
       *      date,
       *      hour,
       *      time_block,
       *      purchase_bid_mw,
       *      sell_bid_mw,
       *      mcv_mw,
       *      scheduled_volume_mw,
       *      mcp_rs_mwh,
       *      mcp_rs_kwh
       *   }
       * }
       *
       * Convert it into the structure
       * used by this page.
       */

      const record = iexResponse.data?.record;

      if (record) {
        setIexMarket({
          available: true,
          source: "IEX Day-Ahead Market",
          date: record.date,
          hour: record.hour,
          time_block: record.time_block,
          purchase_bid_mw: record.purchase_bid_mw,
          sell_bid_mw: record.sell_bid_mw,
          mcv_mw: record.mcv_mw,
          scheduled_volume_mw:
            record.scheduled_volume_mw,
          mcp_rs_mwh: record.mcp_rs_mwh,
          mcp_rs_kwh: record.mcp_rs_kwh,
        });
      } else {
        setIexMarket(null);
      }

    } catch (err) {
      console.error("Market loading error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load market data."
      );

      setIexMarket(null);

    } finally {
      setLoading(false);
      setIexLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadMarket(false);

    // 10s silent background refresh maintains live market rates without page reload
    const pollTimer = window.setInterval(() => loadMarket(true), 10000);
    const refresh = () => loadMarket(true);
    window.addEventListener("energy-trade-updated", refresh);
    return () => {
      window.clearInterval(pollTimer);
      window.removeEventListener("energy-trade-updated", refresh);
    };
  }, [username]);

  // ==========================================================
  // CALCULATIONS
  // ==========================================================

  const lowestListing = listings[0] || null;
  const highestListing = listings[listings.length - 1] || null;
  const lowestPrice = lowestListing ? Number(lowestListing.price || 0) : null;

  // ==========================================================
  // IEX PRICE
  // ==========================================================

  const iexPrice =
    iexMarket?.available
      ? Number(iexMarket.mcp_rs_kwh)
      : null;

  // ==========================================================
  // PRICE COMPARISON
  // ==========================================================

  const priceDifference =
    lowestPrice !== null &&
    iexPrice !== null
      ? lowestPrice - iexPrice
      : null;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          `linear-gradient(135deg, #faf7f2 0%, #f5f0eb 55%, #faf7f2 100%)`,
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <style>{styleSheet}</style>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
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
            Producer · Market
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
            Energy Market
          </h1>

          <p
            style={{
              color: colors.textMuted,
              marginTop: 6,
              fontSize: 14,
              marginBottom: 0,
            }}
          >
            See what other producers are currently
            willing to sell and compare their asking
            prices.
          </p>
        </div>

        <button
          className="market-refresh"
          onClick={loadMarket}
          disabled={loading}
          style={{
            border:
              `1px solid ${colors.border}`,
            background: "linear-gradient(135deg, #5c4033, #4a3525)",
            color: "#fefcf9",
            padding: "10px 16px",
            borderRadius: 8,
            cursor: loading
              ? "not-allowed"
              : "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {loading
            ? "Refreshing..."
            : "↻ Refresh Market"}
        </button>
      </div>

      {/* =====================================================
          LOGGED-IN USER INFO
      ====================================================== */}

      <div
        style={{
          background: "rgba(133,155,50,0.08)", border: "1px solid rgba(133,155,50,0.22)",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 22,
          color: colors.textMuted,
          fontSize: 13,
        }}
      >
        Viewing market offers for{" "}
        <strong
          style={{ color: colors.cyan }}
        >
          {username || "current producer"}
        </strong>
        . Your own listings are excluded.
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          style={{
            background:
              "rgba(255,107,107,0.10)",
            border:
              "1px solid rgba(255,107,107,0.25)",
            color: colors.red,
            padding: "12px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 22,
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          IEX MARKET REFERENCE
      ====================================================== */}

      <div
        style={{
          background: colors.surface,
          border:
            `1px solid ${colors.border}`,
          borderLeft:
            `3px solid ${colors.orange}`,
          borderRadius: 10,
          padding: "20px 22px",
          marginBottom: 22,
        }}
      >
        <div
          className="iex-market-content"
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                color: colors.orange,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              IEX Market Reference
            </div>

            <div
              style={{
                color: colors.text,
                fontFamily:
                  "Space Grotesk, sans-serif",
                fontSize: 28,
                fontWeight: 700,
                marginTop: 7,
              }}
            >
              {iexLoading
                ? "Loading..."
                : iexMarket?.available
                ? `₹${Number(
                    iexMarket.mcp_rs_kwh
                  ).toFixed(2)} / kWh`
                : "Unavailable"}
            </div>

            {iexMarket?.available && (
              <>
                <div
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  MCP: ₹
                  {Number(
                    iexMarket.mcp_rs_mwh
                  ).toFixed(2)}
                  /MWh
                  {" • "}
                  {iexMarket.time_block}
                </div>

                <div
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Date: {iexMarket.date}
                </div>
              </>
            )}
          </div>

          <div
            style={{
              color: colors.orange,
              background:
                "rgba(255,138,101,0.10)",
              border:
                "1px solid rgba(255,138,101,0.20)",
              padding: "9px 13px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Public IEX Data
          </div>
        </div>
      </div>

      {/* =====================================================
          IEX DETAILS
      ====================================================== */}

      {iexMarket?.available && (
        <div
          className="market-legacy-macro-cards"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, 1fr)",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              background: colors.surface,
              border:
                `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: 700,
                textTransform:
                  "uppercase",
              }}
            >
              Purchase Bid
            </div>

            <div
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: 700,
                marginTop: 7,
              }}
            >
              {Number(
                iexMarket.purchase_bid_mw
              ).toFixed(2)}{" "}
              MW
            </div>
          </div>

          <div
            style={{
              background: colors.surface,
              border:
                `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: 700,
                textTransform:
                  "uppercase",
              }}
            >
              Sell Bid
            </div>

            <div
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: 700,
                marginTop: 7,
              }}
            >
              {Number(
                iexMarket.sell_bid_mw
              ).toFixed(2)}{" "}
              MW
            </div>
          </div>

          <div
            style={{
              background: colors.surface,
              border:
                `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: 700,
                textTransform:
                  "uppercase",
              }}
            >
              Market Cleared
            </div>

            <div
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: 700,
                marginTop: 7,
              }}
            >
              {Number(
                iexMarket.mcv_mw
              ).toFixed(2)}{" "}
              MW
            </div>
          </div>

          <div
            style={{
              background: colors.surface,
              border:
                `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: 700,
                textTransform:
                  "uppercase",
              }}
            >
              Scheduled Volume
            </div>

            <div
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: 700,
                marginTop: 7,
              }}
            >
              {Number(
                iexMarket.scheduled_volume_mw
              ).toFixed(2)}{" "}
              MW
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PRICE INSIGHT
      ====================================================== */}

      {lowestPrice !== null &&
        iexPrice !== null && (
          <div
            style={{
              background:
                "rgba(185,140,242,0.07)",
              border:
                "1px solid rgba(185,140,242,0.18)",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 22,
              color: colors.textMuted,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <strong
              style={{
                color: colors.violet,
              }}
            >
              Market comparison:
            </strong>{" "}
            The lowest current producer asking
            price is{" "}
            <strong
              style={{ color: colors.text }}
            >
              ₹{lowestPrice.toFixed(2)}/kWh
            </strong>
            , while the IEX reference is{" "}
            <strong
              style={{ color: colors.orange }}
            >
              ₹{iexPrice.toFixed(2)}/kWh
            </strong>
            .

            {priceDifference > 0
              ? " Current producer offers are above the IEX reference."
              : priceDifference < 0
              ? " A producer offer is below the IEX reference."
              : " The lowest producer offer matches the IEX reference."}
          </div>
        )}

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div
        className="market-summary"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: 18,
          marginBottom: 22,
        }}
      >
        {/* Active Producer Offers */}

        <div
          style={{
            background: colors.surface,
            border:
              `1px solid ${colors.border}`,
            borderLeft:
              `3px solid ${colors.cyan}`,
            borderRadius: 10,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform:
                "uppercase",
            }}
          >
            Active Producer Offers
          </div>

          <div
            style={{
              color: colors.text,
              fontFamily:
                "Space Grotesk, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {listings.length}
          </div>
        </div>

        {/* Lowest Selling Producer */}

        <div
          style={{
            background: colors.surface,
            border:
              `1px solid ${colors.border}`,
            borderLeft:
              `3px solid ${colors.green}`,
            borderRadius: 10,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform:
                "uppercase",
            }}
          >
            Lowest Selling Producer
          </div>

          <div
            style={{
              color: colors.text,
              fontFamily:
                "Space Grotesk, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {lowestListing
              ? `₹${Number(lowestListing.price || 0).toFixed(2)}`
              : "—"}

            <span
              style={{
                fontFamily:
                  "Inter, sans-serif",
                fontSize: 13,
                color: colors.textMuted,
                marginLeft: 5,
              }}
            >
              / kWh
            </span>
          </div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
            {lowestListing ? `By: ${lowestListing.producer}` : "No active offer"}
          </div>
        </div>

        {/* Highest Selling Producer */}

        <div
          style={{
            background: colors.surface,
            border:
              `1px solid ${colors.border}`,
            borderLeft:
              `3px solid ${colors.violet}`,
            borderRadius: 10,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform:
                "uppercase",
            }}
          >
            Highest Selling Producer
          </div>

          <div
            style={{
              color: colors.violet,
              fontFamily:
                "Space Grotesk, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {highestListing
              ? `₹${Number(highestListing.price || 0).toFixed(2)}`
              : "—"}

            {highestListing && (
              <span
                style={{
                  fontFamily:
                    "Inter, sans-serif",
                  fontSize: 13,
                  color: colors.textMuted,
                  marginLeft: 5,
                }}
              >
                / kWh
              </span>
            )}
          </div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
            {highestListing ? `By: ${highestListing.producer}` : "No active offer"}
          </div>
        </div>
      </div>

      {/* =====================================================
          MARKET TABLE
      ====================================================== */}

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
          style={{ marginBottom: 18 }}
        >
          <h2
            style={{
              fontFamily:
                "Space Grotesk, sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: colors.text,
              margin: 0,
            }}
          >
            Current Producer Offers
          </h2>

          <p
            style={{
              color: colors.textMuted,
              fontSize: 13,
              margin: "6px 0 0",
            }}
          >
            Use these live selling prices as
            a reference when deciding your
            own selling price.
          </p>
        </div>

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            className="market-table"
            style={{
              width: "100%",
              borderCollapse:
                "separate",
              borderSpacing: 0,
            }}
          >
            <thead>
              <tr>
                <th>Producer</th>
                <th>Available Energy</th>
                <th>Selling Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding:
                        "40px 12px",
                      color:
                        colors.textMuted,
                    }}
                  >
                    Loading current
                    market offers...
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding:
                        "40px 12px",
                      color:
                        colors.textMuted,
                    }}
                  >
                    No other producers
                    currently have energy
                    listed for sale.
                  </td>
                </tr>
              ) : (
                listings.map((item) => (
                  <tr key={item.id}>

                    {/* Producer */}

                    <td
                      style={{
                        fontWeight: 700,
                        color: colors.text,
                      }}
                    >
                      {item.producer}
                    </td>

                    {/* Energy */}

                    <td>
                      {Number(
                        item.availableEnergy ?? item.energy
                      ).toFixed(3)}{" "}
                      kWh
                    </td>

                    {/* Price */}

                    <td
                      style={{
                        color: colors.cyan,
                        fontWeight: 700,
                      }}
                    >
                      ₹
                      {Number(
                        item.price
                      ).toFixed(2)}

                      <span
                        style={{
                          color:
                            colors.textMuted,
                          fontWeight: 500,
                          fontSize: 12,
                        }}
                      >
                        {" "}
                        / kWh
                      </span>
                    </td>

                    {/* Status */}

                    <td>
                      <span
                        style={{
                          display:
                            "inline-block",
                          color:
                            statusColor(
                              item.status
                            ),
                          background:
                            statusBackground(
                              item.status
                            ),
                          padding:
                            "5px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Action */}

                    <td>
                      <button
                        className="market-buy"
                        onClick={() => {
                          alert(
                            `Selected ${item.producer}'s listing #${item.id}`
                          );
                        }}
                        style={{
                          border: "none",
                          background:
                            colors.cyan,
                          color: "#071018",
                          padding:
                            "8px 14px",
                          borderRadius: 7,
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        View Listing
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          FOOTNOTE
      ====================================================== */}

      <div
        style={{
          marginTop: 16,
          color: colors.textMuted,
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        Live producer prices come from the
        marketplace database. IEX reference
        information comes from the real IEX
        Day-Ahead Market dataset.
      </div>
    </div>
  );
}
