import React, { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function AIAssistant({ username }) {
  const [market, setMarket] = useState(null);
  const [producerMarket, setProducerMarket] = useState(null);

  const [insight, setInsight] = useState(
    "Loading your energy insights..."
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadAssistantData = async () => {
    if (!username) {
      setInsight("Waiting for producer information...");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // -----------------------------------------------------
      // 1. IEX MARKET DATA
      // -----------------------------------------------------

      const marketResponse = await fetch(
        `${API_URL}/market/iex/latest`
      );

      if (!marketResponse.ok) {
        throw new Error(
          "Unable to load IEX market data."
        );
      }

      const marketResult =
        await marketResponse.json();

      const marketData =
        marketResult.record;

      // -----------------------------------------------------
      // 2. PRODUCER MARKET DATA
      // -----------------------------------------------------

      const producerResponse = await fetch(
        `${API_URL}/trading/market/${encodeURIComponent(
          username
        )}`
      );

      if (!producerResponse.ok) {
        throw new Error(
          "Unable to load producer market data."
        );
      }

      const producerData =
        await producerResponse.json();


      // -----------------------------------------------------
      // SAVE DATA
      // -----------------------------------------------------

      setMarket(marketData);
      setProducerMarket(producerData);


      // -----------------------------------------------------
      // GENERATE INSIGHT
      // -----------------------------------------------------

      generateInsight(
        marketData,
        producerData
      );

    } catch (err) {

      console.error(
        "AI Assistant Error:",
        err
      );

      setError(err.message);

      setInsight(
        "I couldn't load the latest energy information."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // GENERATE AI INSIGHT
  // =========================================================

  const generateInsight = (
    marketData,
    producerData
  ) => {

    if (!marketData) {

      setInsight(
        "IEX market data is currently unavailable."
      );

      return;
    }


    const marketPrice =
      Number(marketData.mcp_rs_kwh);


    const listings =
      producerData?.listings || [];


    // -------------------------------------------------------
    // NO OTHER PRODUCERS
    // -------------------------------------------------------

    if (listings.length === 0) {

      setInsight(
        `The current IEX market price is ₹${marketPrice}/kWh. ` +
        `There are currently no other active producer listings ` +
        `available for comparison.`
      );

      return;
    }


    // -------------------------------------------------------
    // GET VALID PRICES
    // -------------------------------------------------------

    const prices = listings
      .map(
        listing => Number(listing.price)
      )
      .filter(
        price => !Number.isNaN(price)
      );


    if (prices.length === 0) {

      setInsight(
        `The current IEX market price is ₹${marketPrice}/kWh. ` +
        `No valid producer prices are currently available.`
      );

      return;
    }


    // -------------------------------------------------------
    // CALCULATE MARKET STATISTICS
    // -------------------------------------------------------

    const lowestPrice =
      Math.min(...prices);

    const highestPrice =
      Math.max(...prices);

    const averagePrice =
      prices.reduce(
        (sum, price) => sum + price,
        0
      ) / prices.length;


    // -------------------------------------------------------
    // GENERATE RECOMMENDATION
    // -------------------------------------------------------

    if (marketPrice < lowestPrice) {

      setInsight(
        `The current IEX market price is ₹${marketPrice}/kWh. ` +
        `Other producers are selling from ` +
        `₹${lowestPrice.toFixed(2)} to ` +
        `₹${highestPrice.toFixed(2)}/kWh. ` +
        `The IEX price is currently below their listed prices.`
      );

    } else if (marketPrice > highestPrice) {

      setInsight(
        `The current IEX market price is ₹${marketPrice}/kWh. ` +
        `Other producers are selling between ` +
        `₹${lowestPrice.toFixed(2)} and ` +
        `₹${highestPrice.toFixed(2)}/kWh. ` +
        `The current market price is above their listings.`
      );

    } else {

      setInsight(
        `The current IEX market price is ₹${marketPrice}/kWh. ` +
        `Other producers are selling between ` +
        `₹${lowestPrice.toFixed(2)} and ` +
        `₹${highestPrice.toFixed(2)}/kWh. ` +
        `Their average selling price is ` +
        `₹${averagePrice.toFixed(2)}/kWh.`
      );

    }
  };


  // =========================================================
  // LOAD WHEN USERNAME CHANGES
  // =========================================================

  useEffect(() => {

    loadAssistantData();

  }, [username]);


  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "500px",
        padding: "22px",
        borderRadius: "20px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        boxShadow:
          "0 8px 30px rgba(0,0,0,0.08)",
        boxSizing: "border-box"
      }}
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "20px"
        }}
      >

        {/* Robot */}

        <div
          style={{
            width: "58px",
            height: "58px",
            borderRadius: "50%",
            background: "#dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            flexShrink: 0
          }}
        >
          🤖
        </div>


        {/* Title */}

        <div>

          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              color: "#111827"
            }}
          >
            Energy AI Assistant
          </h2>

          <p
            style={{
              margin: "5px 0 0",
              fontSize: "13px",
              color: "#6b7280"
            }}
          >
            Live market intelligence
          </p>

        </div>

      </div>


      {/* =====================================================
          USER
      ===================================================== */}

      {username && (

        <div
          style={{
            marginBottom: "16px",
            fontSize: "13px",
            color: "#4b5563"
          }}
        >
          👋 Hello, <strong>{username}</strong>
        </div>

      )}


      {/* =====================================================
          MARKET CARDS
      ===================================================== */}

      {market && (

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "10px",
            marginBottom: "18px"
          }}
        >

          <InfoCard
            title="IEX Market Price"
            value={
              `₹${market.mcp_rs_kwh}/kWh`
            }
          />

          <InfoCard
            title="Cleared Volume"
            value={
              `${market.mcv_mw} MW`
            }
          />

          <InfoCard
            title="Purchase Bid"
            value={
              `${market.purchase_bid_mw} MW`
            }
          />

          <InfoCard
            title="Sell Bid"
            value={
              `${market.sell_bid_mw} MW`
            }
          />

        </div>

      )}


      {/* =====================================================
          PRODUCER MARKET SUMMARY
      ===================================================== */}

      {producerMarket?.market_summary && (

        <div
          style={{
            padding: "14px",
            marginBottom: "18px",
            borderRadius: "14px",
            background: "#ffffff",
            border: "1px solid #e5e7eb"
          }}
        >

          <div
            style={{
              fontSize: "13px",
              fontWeight: "700",
              marginBottom: "10px",
              color: "#111827"
            }}
          >
            📊 Producer Market
          </div>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, 1fr)",
              gap: "8px"
            }}
          >

            <SmallStat
              label="Lowest Price"
              value={
                `₹${producerMarket.market_summary.lowest_price}`
              }
            />

            <SmallStat
              label="Highest Price"
              value={
                `₹${producerMarket.market_summary.highest_price}`
              }
            />

            <SmallStat
              label="Average Price"
              value={
                `₹${producerMarket.market_summary.average_price}`
              }
            />

            <SmallStat
              label="Energy Available"
              value={
                `${producerMarket.market_summary.total_energy_available} kWh`
              }
            />

          </div>

        </div>

      )}


      {/* =====================================================
          AI INSIGHT
      ===================================================== */}

      <div
        style={{
          padding: "16px",
          borderRadius: "15px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          marginBottom: "16px"
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px"
          }}
        >

          <span
            style={{
              fontSize: "18px"
            }}
          >
            💡
          </span>

          <strong
            style={{
              color: "#111827"
            }}
          >
            AI Insight
          </strong>

        </div>


        <p
          style={{
            margin: 0,
            fontSize: "13px",
            lineHeight: "1.7",
            color: "#4b5563"
          }}
        >
          {loading
            ? "Analyzing the latest energy market..."
            : insight}
        </p>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div
          style={{
            marginBottom: "14px",
            padding: "10px",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "12px"
          }}
        >
          {error}
        </div>

      )}


      {/* =====================================================
          REFRESH BUTTON
      ===================================================== */}

      <button
        onClick={loadAssistantData}
        disabled={loading}
        style={{
          width: "100%",
          padding: "11px",
          border: "none",
          borderRadius: "10px",
          background:
            loading
              ? "#93c5fd"
              : "#2563eb",
          color: "#ffffff",
          fontWeight: "600",
          cursor:
            loading
              ? "not-allowed"
              : "pointer"
        }}
      >

        {loading
          ? "Analyzing..."
          : "🔄 Refresh Insight"}

      </button>

    </div>
  );
}


// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  title,
  value
}) {

  return (
    <div
      style={{
        padding: "13px",
        borderRadius: "12px",
        background: "#ffffff",
        border: "1px solid #e5e7eb"
      }}
    >

      <div
        style={{
          fontSize: "11px",
          color: "#6b7280",
          marginBottom: "5px"
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "15px",
          fontWeight: "700",
          color: "#111827"
        }}
      >
        {value}
      </div>

    </div>
  );
}


// ============================================================
// SMALL STAT
// ============================================================

function SmallStat({
  label,
  value
}) {

  return (
    <div>

      <div
        style={{
          fontSize: "10px",
          color: "#6b7280"
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "13px",
          fontWeight: "600",
          color: "#111827"
        }}
      >
        {value}
      </div>

    </div>
  );
}