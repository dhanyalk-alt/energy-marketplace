import React, { useEffect, useState } from "react";
import axios from "axios";
import BuyEnergyModal from "./BuyEnergyModal";

// ---- Design tokens (shared with the rest of the app) ------------------
const colors = {
  bg: "#0B1420",
  surface: "#131F30",
  border: "rgba(255,255,255,0.07)",
  text: "#EDF1F7",
  textMuted: "#7C8BA3",
  green: "#5FD98A",
  violet: "#B98CF2",
};

const styleSheet = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.mk-table th {
  background: #182742 !important;
  color: #9FB0C9 !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  text-align: center !important;
  border: none !important;
  border-bottom: 2px solid #B98CF2 !important;
  padding: 12px 10px !important;
}
.mk-table th:first-child { border-top-left-radius: 8px; }
.mk-table th:last-child { border-top-right-radius: 8px; }
.mk-table td {
  text-align: center;
  padding: 12px 10px;
  color: #EDF1F7;
  font-size: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.mk-table tbody tr:hover { background: rgba(255,255,255,0.025); }

.mk-buy-btn {
  background: linear-gradient(135deg, #5FD98A, #2FAE63);
  color: #08210F;
  border: none;
  padding: 9px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 13px;
  transition: transform 0.12s, box-shadow 0.12s;
}
.mk-buy-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(95,217,138,0.28); }
.mk-buy-btn:active { transform: translateY(0); }
`;

export default function ProducerMarketplace() {
  const [producers, setProducers] = useState([]);
  const [selectedProducer, setSelectedProducer] = useState(null);

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/trading/all");
      setProducers(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 15% 0%, #16233A 0%, ${colors.bg} 55%)`,
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{styleSheet}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            color: colors.violet,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Consumer · Market
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
          Producer Marketplace
        </h1>
        <p style={{ color: colors.textMuted, marginTop: 6, fontSize: 14 }}>
          Browse live listings and send a buy request to a producer.
        </p>
      </div>

      {/* Listings table */}
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "22px 24px",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            className="mk-table"
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <thead>
              <tr>
                <th>Producer</th>
                <th>Available Energy</th>
                <th>Price / kWh</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {producers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{ padding: "36px 10px", color: colors.textMuted }}
                  >
                    No listings available right now — check back soon.
                  </td>
                </tr>
              ) : (
                producers.map((item) => (
                  <tr key={item.id}>
                    <td>{item.producer}</td>
                    <td>{item.energy} kWh</td>
                    <td>₹{item.price}</td>
                    <td>
                      <button
                        className="mk-buy-btn"
                        onClick={() => setSelectedProducer(item)}
                      >
                        Buy Energy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProducer && (
        <BuyEnergyModal
          producer={selectedProducer}
          onClose={() => setSelectedProducer(null)}
          onSuccess={() => {
            loadMarketplace();
          }}
        />
      )}
    </div>
  );
}