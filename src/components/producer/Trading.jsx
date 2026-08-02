import { useState, useEffect } from "react";
import axios from "axios";

// ---- Design tokens (shared with Overview pages) ----------------------
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

const styleSheet = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.tr-input {
  width: 100%;
  background: #0F1826;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 8px;
  padding: 12px 14px;
  color: #EDF1F7;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.tr-input::placeholder { color: #5A6A83; }
.tr-input:focus {
  border-color: #F2A93B;
  box-shadow: 0 0 0 3px rgba(242,169,59,0.15);
}

.tr-btn-primary {
  width: 100%;
  padding: 13px 14px;
  border-radius: 8px;
  border: none;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  background: linear-gradient(135deg, #F2A93B, #D9860F);
  color: #1A1305;
  transition: transform 0.12s, box-shadow 0.12s;
}
.tr-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(242,169,59,0.28); }
.tr-btn-primary:active { transform: translateY(0); }

.tr-btn-accept, .tr-btn-reject {
  border: none;
  border-radius: 6px;
  padding: 7px 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
  transition: opacity 0.12s;
}
.tr-btn-accept { background: rgba(95,217,138,0.15); color: #5FD98A; }
.tr-btn-accept:hover { opacity: 0.75; }
.tr-btn-reject { background: rgba(255,107,107,0.15); color: #FF6B6B; }
.tr-btn-reject:hover { opacity: 0.75; }

.tr-table th {
  background: #182742 !important;
  color: #9FB0C9 !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  text-align: center !important;
  border: none !important;
  border-bottom: 2px solid #F2A93B !important;
  padding: 12px 10px !important;
}
.tr-table th:first-child { border-top-left-radius: 8px; }
.tr-table th:last-child { border-top-right-radius: 8px; }
.tr-table td {
  text-align: center;
  padding: 12px 10px;
  color: #EDF1F7;
  font-size: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.tr-table tbody tr:hover { background: rgba(255,255,255,0.025); }

.tr-grid { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
@media (max-width: 860px) {
  .tr-grid { grid-template-columns: 1fr; }
}
`;

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
    ? colors.red
    : colors.orange;

export default function Trading() {
  const [availableEnergy, setAvailableEnergy] = useState("");
  const [price, setPrice] = useState("");
  const [requests, setRequests] = useState([]);

  // ----------------------------
  // Load Buy Requests
  // ----------------------------
  const loadRequests = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/trading/requests"
      );
      setRequests(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // ----------------------------
  // Add Energy Listing
  // ----------------------------
  const updateListing = async () => {
    try {
      const username = localStorage.getItem("username");

      const response = await axios.post("http://127.0.0.1:8000/trading/add", {
        producer: username,
        energy: Number(availableEnergy),
        price: Number(price),
      });

      alert("Listing Added Successfully!");
      console.log(response.data);

      setAvailableEnergy("");
      setPrice("");
    } catch (err) {
      console.error(err);
      alert("Failed to add listing.");
    }
  };

  // ----------------------------
  // Accept / Reject Request
  // ----------------------------
  const acceptRequest = async (id) => {
    try {
      await axios.put(`http://127.0.0.1:8000/trading/accept/${id}`);
      loadRequests();
    } catch (err) {
      console.log(err);
    }
  };

  const rejectRequest = async (id) => {
    try {
      await axios.put(`http://127.0.0.1:8000/trading/reject/${id}`);
      loadRequests();
    } catch (err) {
      console.log(err);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 85% 0%, #16233A 0%, ${colors.bg} 55%)`,
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{styleSheet}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
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
          Producer · Trading
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
          Trading
        </h1>
        <p style={{ color: colors.textMuted, marginTop: 6, fontSize: 14 }}>
          Set your selling price and manage incoming buy requests.
        </p>
      </div>

      <div className="tr-grid">
        {/* Sell Energy form */}
        <Panel>
          <h2
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: colors.text,
              margin: "0 0 18px",
            }}
          >
            ⚡ Sell Energy
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: colors.textMuted,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Available Energy (kWh)
              </label>
              <input
                className="tr-input"
                type="number"
                placeholder="e.g. 50"
                value={availableEnergy}
                onChange={(e) => setAvailableEnergy(e.target.value)}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: colors.textMuted,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Price per kWh (₹)
              </label>
              <input
                className="tr-input"
                type="number"
                placeholder="e.g. 8.35"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <button
              className="tr-btn-primary"
              onClick={updateListing}
              style={{ marginTop: 6 }}
            >
              Update Listing
            </button>
          </div>
        </Panel>

        {/* Incoming requests */}
        <Panel>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <h2
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 17,
                fontWeight: 600,
                color: colors.text,
                margin: 0,
              }}
            >
              Incoming Buy Requests
            </h2>

            {pendingCount > 0 && (
              <span
                style={{
                  background: "rgba(255,138,101,0.15)",
                  color: colors.orange,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "5px 12px",
                  borderRadius: 20,
                }}
              >
                {pendingCount} pending
              </span>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              className="tr-table"
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Consumer</th>
                  <th>Producer</th>
                  <th>Energy</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: "28px 10px", color: colors.textMuted }}
                    >
                      No buy requests yet.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.id}</td>
                      <td>{req.consumer}</td>
                      <td>{req.producer}</td>
                      <td>{req.energy} kWh</td>
                      <td>₹{req.total_price}</td>
                      <td
                        style={{
                          color: statusColor(req.status),
                          fontWeight: 700,
                        }}
                      >
                        {req.status}
                      </td>
                      <td>
                        {req.status === "Pending" ? (
                          <>
                            <button
                              className="tr-btn-accept"
                              onClick={() => acceptRequest(req.id)}
                            >
                              Accept
                            </button>
                            <button
                              className="tr-btn-reject"
                              onClick={() => rejectRequest(req.id)}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span style={{ color: colors.textMuted, fontSize: 13 }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}