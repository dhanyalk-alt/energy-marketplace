import React, { useEffect, useState } from "react";
import axios from "axios";

// ---- Design tokens (shared with the rest of the app) ------------------
const colors = {
  bg: "#0B1420",
  surface: "#131F30",
  surfaceAlt: "#182742",
  border: "rgba(255,255,255,0.07)",
  text: "#EDF1F7",
  textMuted: "#7C8BA3",
  cyan: "#3FD0E0",
  green: "#5FD98A",
  orange: "#FF8A65",
  red: "#FF6B6B",
  violet: "#B98CF2",
};

const styleSheet = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.rb-table th {
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
.rb-table th:first-child { border-top-left-radius: 8px; }
.rb-table th:last-child { border-top-right-radius: 8px; }
.rb-table td {
  text-align: center;
  padding: 12px 10px;
  color: #EDF1F7;
  font-size: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.rb-table tbody tr:hover { background: rgba(255,255,255,0.025); }
`;

const statusColor = (status) =>
  status === "Accepted"
    ? colors.green
    : status === "Rejected"
    ? colors.red
    : colors.orange;

const statusBg = (status) =>
  status === "Accepted"
    ? "rgba(95,217,138,0.14)"
    : status === "Rejected"
    ? "rgba(255,107,107,0.14)"
    : "rgba(255,138,101,0.14)";

export default function RequestBuying() {
  const [requests, setRequests] = useState([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/trading/requests"
      );

      // Only show requests belonging to this consumer
      const myRequests = response.data.filter(
        (item) => item.consumer === username
      );

      setRequests(myRequests);
    } catch (err) {
      console.log(err);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
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
            Consumer · Requests
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
            My Buy Requests
          </h1>
          <p style={{ color: colors.textMuted, marginTop: 6, fontSize: 14 }}>
            Track the status of energy you've requested from producers.
          </p>
        </div>

        {pendingCount > 0 && (
          <span
            style={{
              background: "rgba(255,138,101,0.15)",
              color: colors.orange,
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: 20,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Requests table */}
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
            className="rb-table"
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Producer</th>
                <th>Energy</th>
                <th>Total Price</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "36px 10px", color: colors.textMuted }}
                  >
                    No buy requests yet — head to the Market page to send one.
                  </td>
                </tr>
              ) : (
                requests.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.producer}</td>
                    <td>{item.energy} kWh</td>
                    <td>₹{item.total_price}</td>
                    <td>
                      <span
                        style={{
                          color: statusColor(item.status),
                          background: statusBg(item.status),
                          fontWeight: 700,
                          fontSize: 12,
                          padding: "5px 12px",
                          borderRadius: 20,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}