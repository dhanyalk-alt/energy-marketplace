import React, { useEffect, useState } from "react";
import axios from "axios";

const colors = {
  bg: "#0B1420",
  surface: "#131F30",
  surfaceAlt: "#182742",
  border: "rgba(255,255,255,0.08)",
  text: "#EDF1F7",
  textMuted: "#7C8BA3",
  green: "#5FD98A",
  violet: "#B98CF2",
  cyan: "#3FD0E0",
};

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: "Hi! I'm your Energy Assistant. I can help you find energy, compare producers, prices and ratings.",
    },
  ]);

  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // Load marketplace data
  // --------------------------------------------------

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/trading/all"
      );

      setProducers(response.data);
    } catch (error) {
      console.error("AI marketplace fetch error:", error);
    }
  };

  // --------------------------------------------------
  // Add message
  // --------------------------------------------------

  const addMessage = (type, text) => {
    setMessages((prev) => [
      ...prev,
      {
        type,
        text,
      },
    ]);
  };

  // --------------------------------------------------
  // AI response logic
  // --------------------------------------------------

  const generateResponse = (question) => {
    const q = question.toLowerCase();

    if (producers.length === 0) {
      return "There are currently no active energy listings available.";
    }

    // -----------------------------------------------
    // Cheapest producer
    // -----------------------------------------------

    if (
      q.includes("cheap") ||
      q.includes("cheapest") ||
      q.includes("lowest price")
    ) {
      const cheapest = [...producers].sort(
        (a, b) => Number(a.price) - Number(b.price)
      )[0];

      return `The cheapest available energy is from ${cheapest.producer} at ₹${Number(
        cheapest.price
      ).toFixed(2)} per kWh, with ${Number(
        cheapest.energy
      ).toFixed(2)} kWh available.`;
    }

    // -----------------------------------------------
    // Highest available energy
    // -----------------------------------------------

    if (
      q.includes("most energy") ||
      q.includes("highest energy") ||
      q.includes("more energy")
    ) {
      const producer = [...producers].sort(
        (a, b) => Number(b.energy) - Number(a.energy)
      )[0];

      return `${producer.producer} currently has the highest available energy: ${Number(
        producer.energy
      ).toFixed(2)} kWh at ₹${Number(
        producer.price
      ).toFixed(2)} per kWh.`;
    }

    // -----------------------------------------------
    // Available energy
    // -----------------------------------------------

    if (
      q.includes("available energy") ||
      q.includes("energy available") ||
      q.includes("how much energy")
    ) {
      const totalEnergy = producers.reduce(
        (sum, producer) => sum + Number(producer.energy || 0),
        0
      );

      return `There are currently ${totalEnergy.toFixed(
        2
      )} kWh of energy available across ${producers.length} active listings.`;
    }

    // -----------------------------------------------
    // Current price
    // -----------------------------------------------

    if (
      q.includes("price") ||
      q.includes("cost") ||
      q.includes("rate")
    ) {
      const prices = producers.map((p) => Number(p.price));

      const lowest = Math.min(...prices);
      const highest = Math.max(...prices);

      const average =
        prices.reduce((sum, price) => sum + price, 0) /
        prices.length;

      return `Current marketplace prices range from ₹${lowest.toFixed(
        2
      )} to ₹${highest.toFixed(
        2
      )} per kWh. The average price is approximately ₹${average.toFixed(
        2
      )} per kWh.`;
    }

    // -----------------------------------------------
    // Producer list
    // -----------------------------------------------

    if (
      q.includes("producer") ||
      q.includes("seller") ||
      q.includes("who is selling")
    ) {
      const names = producers
        .map((producer) => producer.producer)
        .join(", ");

      return `Currently available producers are: ${names}.`;
    }

    // -----------------------------------------------
    // Buy recommendation
    // -----------------------------------------------

    if (
      q.includes("should i buy") ||
      q.includes("recommend") ||
      q.includes("which should i buy")
    ) {
      const cheapest = [...producers].sort(
        (a, b) => Number(a.price) - Number(b.price)
      )[0];

      return `Based on the current price alone, ${cheapest.producer} is the best option at ₹${Number(
        cheapest.price
      ).toFixed(2)} per kWh. You can also check the producer's rating and reviews before buying.`;
    }

    // -----------------------------------------------
    // Greeting
    // -----------------------------------------------

    if (
      q.includes("hello") ||
      q.includes("hi") ||
      q.includes("hey")
    ) {
      return "Hello! 👋 I can help you compare energy prices, find producers and check available energy.";
    }

    // -----------------------------------------------
    // Default
    // -----------------------------------------------

    return `I can help with things like:

• Cheapest energy
• Available energy
• Current prices
• Producers selling energy
• Which producer to consider

Try asking: "Which producer has the cheapest energy?"`;
  };

  // --------------------------------------------------
  // Send message
  // --------------------------------------------------

  const handleSend = async () => {
    const trimmed = message.trim();

    if (!trimmed || loading) return;

    addMessage("user", trimmed);

    setMessage("");
    setLoading(true);

    // Small delay for natural assistant behaviour
    setTimeout(() => {
      const response = generateResponse(trimmed);

      addMessage("ai", response);

      setLoading(false);
    }, 500);
  };

  // --------------------------------------------------
  // Quick question
  // --------------------------------------------------

  const askQuestion = (question) => {
    setMessage(question);

    setTimeout(() => {
      const response = generateResponse(question);

      setMessages((prev) => [
        ...prev,
        {
          type: "user",
          text: question,
        },
        {
          type: "ai",
          text: response,
        },
      ]);
    }, 300);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "500px",
        display: "flex",
        flexDirection: "column",
        background: colors.surface,
        borderRadius: "12px",
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* --------------------------------------------- */}
      {/* Header */}
      {/* --------------------------------------------- */}

      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surfaceAlt,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #B98CF2, #3FD0E0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "19px",
            }}
          >
            🤖
          </div>

          <div>
            <div
              style={{
                color: colors.text,
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              Energy Assistant
            </div>

            <div
              style={{
                color: colors.green,
                fontSize: "11px",
                marginTop: "2px",
              }}
            >
              ● Online
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------- */}
      {/* Messages */}
      {/* --------------------------------------------- */}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                msg.type === "user"
                  ? "flex-end"
                  : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "88%",
                padding: "10px 12px",
                borderRadius:
                  msg.type === "user"
                    ? "12px 12px 3px 12px"
                    : "12px 12px 12px 3px",
                background:
                  msg.type === "user"
                    ? "linear-gradient(135deg, #B98CF2, #8B63C7)"
                    : colors.surfaceAlt,
                color: colors.text,
                fontSize: "12px",
                lineHeight: "1.5",
                whiteSpace: "pre-line",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div
            style={{
              color: colors.textMuted,
              fontSize: "12px",
            }}
          >
            Assistant is thinking...
          </div>
        )}
      </div>

      {/* --------------------------------------------- */}
      {/* Quick questions */}
      {/* --------------------------------------------- */}

      <div
        style={{
          padding: "10px 12px",
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            color: colors.textMuted,
            fontSize: "10px",
            marginBottom: "7px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Quick questions
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
          }}
        >
          {[
            "Cheapest energy?",
            "Available energy?",
            "Current price?",
          ].map((question) => (
            <button
              key={question}
              onClick={() => askQuestion(question)}
              style={{
                flexShrink: 0,
                border: `1px solid ${colors.border}`,
                background: "rgba(255,255,255,0.03)",
                color: colors.textMuted,
                padding: "6px 9px",
                borderRadius: "6px",
                fontSize: "10px",
                cursor: "pointer",
              }}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------------------------- */}
      {/* Input */}
      {/* --------------------------------------------- */}

      <div
        style={{
          padding: "10px",
          display: "flex",
          gap: "7px",
          borderTop: `1px solid ${colors.border}`,
          background: colors.surfaceAlt,
        }}
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="Ask about energy..."
          style={{
            flex: 1,
            minWidth: 0,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "7px",
            padding: "9px",
            color: colors.text,
            outline: "none",
            fontSize: "11px",
          }}
        />

        <button
          onClick={handleSend}
          style={{
            border: "none",
            borderRadius: "7px",
            padding: "0 12px",
            background:
              "linear-gradient(135deg, #5FD98A, #2FAE63)",
            color: "#08210F",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}