import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

// =========================================================
// DESIGN TOKENS
// =========================================================

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

// =========================================================
// API
// =========================================================

const API = API_BASE_URL;

// =========================================================
// STYLES
// =========================================================

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

.tr-input::placeholder {
  color: #5A6A83;
}

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

.tr-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(242,169,59,0.28);
}

.tr-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.tr-btn-accept,
.tr-btn-reject {
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

.tr-btn-accept {
  background: rgba(95,217,138,0.15);
  color: #5FD98A;
}

.tr-btn-accept:hover {
  opacity: 0.75;
}

.tr-btn-reject {
  background: rgba(255,107,107,0.15);
  color: #FF6B6B;
}

.tr-btn-reject:hover {
  opacity: 0.75;
}

.tr-btn-accept:disabled,
.tr-btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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

.tr-table th:first-child {
  border-top-left-radius: 8px;
}

.tr-table th:last-child {
  border-top-right-radius: 8px;
}

.tr-table td {
  text-align: center;
  padding: 12px 10px;
  color: #EDF1F7;
  font-size: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.tr-table tbody tr:hover {
  background: rgba(255,255,255,0.025);
}

.tr-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
  align-items: start;
}

.tr-full {
  margin-top: 20px;
}

@media (max-width: 860px) {
  .tr-grid {
    grid-template-columns: 1fr;
  }
}
`;

// =========================================================
// PANEL
// =========================================================

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

// =========================================================
// STATUS COLOR
// =========================================================

const statusColor = (status) => {
  switch (status) {
    case "Accepted":
      return colors.green;

    case "Rejected":
      return colors.red;

    case "Pending":
      return colors.amber;

    default:
      return colors.textMuted;
  }
};

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function Trading() {
  // =======================================================
  // SELL ENERGY
  // =======================================================

  const [availableEnergy, setAvailableEnergy] = useState("");
  const [price, setPrice] = useState("");
  const [listingLoading, setListingLoading] = useState(false);

  // =======================================================
  // NORMAL BUY REQUESTS
  // =======================================================

  const [requests, setRequests] = useState([]);
  const [priorityRecommendation, setPriorityRecommendation] = useState(null);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [showPriorityPopup, setShowPriorityPopup] = useState(false);
  const [requestToAccept, setRequestToAccept] = useState(null);

  // =======================================================
  // AI NEGOTIATIONS
  // =======================================================

  const [negotiations, setNegotiations] = useState([]);
  const [negotiationLoading, setNegotiationLoading] = useState(false);

  // =======================================================
  // ACTION LOADING
  // =======================================================

  const [actionLoading, setActionLoading] = useState(null);

  // =======================================================
  // CURRENT USER
  // =======================================================

  const username = localStorage.getItem("username");

  // =======================================================
  // LOAD NORMAL BUY REQUESTS
  // =======================================================

  const loadRequests = async () => {
    if (!username) {
      setRequests([]);
      return [];
    }

    try {
      const response = await axios.get(
        `${API}/trading/requests`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const producerRequests = data.filter(
        (request) =>
          String(request.producer).toLowerCase() ===
          String(username).toLowerCase()
      );

      setRequests(producerRequests);
      return producerRequests;
    } catch (err) {
      console.error(
        "Failed to load buy requests:",
        err
      );

      setRequests([]);
      return [];
    }
  };

  // The same server-side analysis powers the Assistant and this request view.
  // It compares the full pending queue; it never accepts a request automatically.
  const loadPriorityRecommendation = async (producerRequests) => {
    const pendingRequests = producerRequests.filter(
      (request) => request.status === "Pending"
    );

    if (!pendingRequests.length) {
      setPriorityRecommendation(null);
      setShowPriorityPopup(false);
      return;
    }

    try {
      setPriorityLoading(true);
      const token = localStorage.getItem("energy_marketplace_jwt");
      const storedWeather = localStorage.getItem("energy_marketplace_weather");
      let weather = null;

      try {
        weather = storedWeather ? JSON.parse(storedWeather) : null;
      } catch {
        // Weather is optional for request prioritization.
      }

      const response = await axios.post(
        `${API}/producer/insights`,
        { weather },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const recommendation = response.data?.request_priority || null;
      setPriorityRecommendation(recommendation);

      if (recommendation?.recommended_request) {
        setShowPriorityPopup(true);
      }
    } catch (err) {
      console.error("Failed to load AI request priority:", err);
      setPriorityRecommendation(null);
    } finally {
      setPriorityLoading(false);
    }
  };

  // =======================================================
  // LOAD AI NEGOTIATIONS
  // =======================================================

  const loadNegotiations = async () => {
    if (!username) {
      setNegotiations([]);
      return;
    }

    try {
      setNegotiationLoading(true);

      const token = localStorage.getItem("energy_marketplace_jwt");
      const response = await axios.get(
        `${API}/trading/negotiations/producer/${encodeURIComponent(
          username
        )}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      setNegotiations(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load negotiations:",
        err
      );

      setNegotiations([]);
    } finally {
      setNegotiationLoading(false);
    }
  };

  // =======================================================
  // LOAD ALL TRADING DATA
  // =======================================================

  const loadTradingData = async () => {
    const [producerRequests] = await Promise.all([
      loadRequests(),
      loadNegotiations(),
    ]);
    await loadPriorityRecommendation(producerRequests);
  };

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadTradingData();
  }, []);

  // =======================================================
  // ADD ENERGY LISTING
  // =======================================================

  const updateListing = async () => {
    const energyValue = Number(availableEnergy);
    const priceValue = Number(price);

    if (!availableEnergy || !Number.isFinite(energyValue) || energyValue <= 0) {
      alert("Please enter a valid amount of energy.");
      return;
    }

    if (!price || !Number.isFinite(priceValue) || priceValue < 0) {
      alert("Please enter a valid selling price.");
      return;
    }

    if (!username) {
      alert("Producer username not found.");
      return;
    }

    try {
      setListingLoading(true);

      const response = await axios.post(
        `${API}/trading/add`,
        {
          producer: username,
          energy: energyValue,
          price: priceValue,
        }
      );

      console.log(
        "Listing created:",
        response.data
      );

      alert("Energy listing added successfully.");

      setAvailableEnergy("");
      setPrice("");

      await loadTradingData();
    } catch (err) {
      console.error(
        "Failed to add listing:",
        err
      );

      alert(
        err.response?.data?.detail ||
          "Failed to add energy listing."
      );
    } finally {
      setListingLoading(false);
    }
  };

  // =======================================================
  // ACCEPT NORMAL BUY REQUEST
  // =======================================================

  const acceptRequest = async (id) => {
    try {
      setActionLoading(`request-accept-${id}`);

      const response = await axios.put(
        `${API}/trading/accept/${id}`
      );

      console.log(
        "Buy request accepted:",
        response.data
      );

      alert("Buy request accepted successfully.");

      await loadTradingData();
    } catch (err) {
      console.error(
        "Failed to accept request:",
        err
      );

      alert(
        err.response?.data?.detail ||
          "Failed to accept buy request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openAcceptRequest = (request) => {
    setRequestToAccept(request);
  };

  // =======================================================
  // REJECT NORMAL BUY REQUEST
  // =======================================================

  const rejectRequest = async (id) => {
    try {
      setActionLoading(`request-reject-${id}`);

      const response = await axios.put(
        `${API}/trading/reject/${id}`
      );

      console.log(
        "Buy request rejected:",
        response.data
      );

      alert("Buy request rejected.");

      await loadTradingData();
    } catch (err) {
      console.error(
        "Failed to reject request:",
        err
      );

      alert(
        err.response?.data?.detail ||
          "Failed to reject buy request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =======================================================
  // ACCEPT AI NEGOTIATION
  // =======================================================

  const acceptNegotiation = async (negotiationId) => {
    try {
      setActionLoading(
        `negotiation-accept-${negotiationId}`
      );

      const token = localStorage.getItem("energy_marketplace_jwt");
      const response = await axios.put(
        `${API}/trading/negotiate/${negotiationId}/producer-accept`,
        {},
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      console.log(
        "Negotiation accepted:",
        response.data
      );

      alert(
        `Negotiation accepted.\nTransaction ID: ${
          response.data?.transaction_id ?? "Created"
        }`
      );

      await loadTradingData();
    } catch (err) {
      console.error(
        "Failed to accept negotiation:",
        err
      );

      alert(
        err.response?.data?.detail ||
          "Failed to accept negotiation."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =======================================================
  // REJECT AI NEGOTIATION
  // =======================================================

  const rejectNegotiation = async (negotiationId) => {
    try {
      setActionLoading(
        `negotiation-reject-${negotiationId}`
      );

      const token = localStorage.getItem("energy_marketplace_jwt");
      const response = await axios.put(
        `${API}/trading/negotiate/${negotiationId}/producer-reject`,
        {},
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      console.log(
        "Negotiation rejected:",
        response.data
      );

      alert("Negotiation rejected.");

      await loadTradingData();
    } catch (err) {
      console.error(
        "Failed to reject negotiation:",
        err
      );

      alert(
        err.response?.data?.detail ||
          "Failed to reject negotiation."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =======================================================
  // COUNTS
  // =======================================================

  const pendingCount = requests.filter(
    (request) =>
      request.status === "Pending"
  ).length;

  const pendingNegotiationCount =
    negotiations.filter(
      (negotiation) =>
        negotiation.status === "Pending"
    ).length;

  const recommendedRequest =
    priorityRecommendation?.recommended_request || null;

  // =======================================================
  // UI
  // =======================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          `radial-gradient(circle at 85% 0%, #16233A 0%, ${colors.bg} 55%)`,
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>
        {styleSheet}
      </style>

      {/* ===================================================
          HEADER
      =================================================== */}

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
          Producer Â· Trading
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
          Trading
        </h1>

        <p
          style={{
            color: colors.textMuted,
            marginTop: 6,
            fontSize: 14,
          }}
        >
          Set your selling price, manage buy requests,
          and review AI-powered energy negotiations.
        </p>
      </div>

      {/* ===================================================
          TOP GRID
      =================================================== */}

      <div className="tr-grid">

        {/* =================================================
            SELL ENERGY
        ================================================= */}

        <Panel>
          <h2
            style={{
              fontFamily:
                "Space Grotesk, sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: colors.text,
              margin: "0 0 18px",
            }}
          >
            âš¡ Sell Energy
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* ENERGY */}

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
                min="0.01"
                step="0.01"
                placeholder="e.g. 50"
                value={availableEnergy}
                disabled={listingLoading}
                onChange={(e) =>
                  setAvailableEnergy(
                    e.target.value
                  )
                }
              />
            </div>

            {/* PRICE */}

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
                Price per kWh (â‚¹)
              </label>

              <input
                className="tr-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 8.35"
                value={price}
                disabled={listingLoading}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
              />
            </div>

            <button
              className="tr-btn-primary"
              onClick={updateListing}
              disabled={listingLoading}
              style={{ marginTop: 6 }}
            >
              {listingLoading
                ? "Adding..."
                : "Add Listing"}
            </button>
          </div>
        </Panel>

        {/* =================================================
            NORMAL BUY REQUESTS
        ================================================= */}

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
                fontFamily:
                  "Space Grotesk, sans-serif",
                fontSize: 17,
                fontWeight: 600,
                color: colors.text,
                margin: 0,
              }}
            >
              Incoming Buy Requests
            </h2>

            {pendingCount > 0 && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                <button
                  type="button"
                  onClick={() => setShowPriorityPopup(true)}
                  disabled={priorityLoading || !recommendedRequest}
                  style={{
                    border: "1px solid rgba(185,140,242,0.75)",
                    borderRadius: 20,
                    padding: "5px 10px",
                    color: colors.violet,
                    background: "rgba(185,140,242,0.1)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {priorityLoading ? "Analysing..." : "🎯 AI Priority"}
                </button>
              </div>
            )}
          </div>

          {recommendedRequest && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 9,
                background: "rgba(185,140,242,0.10)",
                border: "1px solid rgba(185,140,242,0.3)",
                color: colors.text,
                fontSize: 13,
              }}
            >
              <strong style={{ color: colors.violet }}>🎯 AI recommendation: </strong>
              Prioritize <strong>{recommendedRequest.consumer}</strong> — {recommendedRequest.priority_level} priority ({recommendedRequest.score}/100).
              <button
                type="button"
                onClick={() => setShowPriorityPopup(true)}
                style={{ marginLeft: 10, border: "none", background: "transparent", color: colors.cyan, fontWeight: 700, cursor: "pointer" }}
              >
                Why?
              </button>
            </div>
          )}

          <div
            style={{
              overflowX: "auto",
            }}
          >
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
                      style={{
                        padding: "28px 10px",
                        color: colors.textMuted,
                      }}
                    >
                      No buy requests yet.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const isPending =
                      req.status === "Pending";
                    const isRecommended =
                      isPending && recommendedRequest?.request_id === req.id;

                    return (
                      <tr key={req.id}>
                        <td>{req.id}</td>

                        <td>
                          {req.consumer}
                          {isRecommended && (
                            <div style={{ color: colors.violet, fontSize: 11, fontWeight: 700, marginTop: 3 }}>
                              🎯 AI priority
                            </div>
                          )}
                        </td>

                        <td>
                          {req.producer}
                        </td>

                        <td>
                          {req.energy} kWh
                        </td>

                        <td>
                          â‚¹
                          {Number(
                            req.total_price || 0
                          ).toFixed(2)}
                        </td>

                        <td
                          style={{
                            color:
                              statusColor(
                                req.status
                              ),
                            fontWeight: 700,
                          }}
                        >
                          {req.status}
                        </td>

                        <td>
                          {isPending ? (
                            <>
                              <button
                                className="tr-btn-accept"
                                disabled={
                                  actionLoading !== null
                                }
                                onClick={() =>
                                  openAcceptRequest(req)
                                }
                              >
                                Accept
                              </button>

                              <button
                                className="tr-btn-reject"
                                disabled={
                                  actionLoading !== null
                                }
                                onClick={() =>
                                  rejectRequest(
                                    req.id
                                  )
                                }
                              >
                                {actionLoading ===
                                `request-reject-${req.id}`
                                  ? "..."
                                  : "Reject"}
                              </button>
                            </>
                          ) : (
                            <span
                              style={{
                                color:
                                  colors.textMuted,
                                fontSize: 13,
                              }}
                            >
                              â€”
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ===================================================
          AI NEGOTIATIONS
      =================================================== */}

      <div className="tr-full">
        <Panel>
          {/* HEADER */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div>
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
                ðŸ¤– AI Energy Negotiations
              </h2>

              <p
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  margin: "5px 0 0",
                }}
              >
                Review offers generated through
                the energy negotiation agent.
              </p>
            </div>

            {pendingNegotiationCount > 0 && (
              <span
                style={{
                  background:
                    "rgba(255,138,101,0.15)",
                  color: colors.orange,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "5px 12px",
                  borderRadius: 20,
                }}
              >
                {pendingNegotiationCount} pending
              </span>
            )}
          </div>

          {/* TABLE */}

          <div
            style={{
              overflowX: "auto",
            }}
          >
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
                  <th>Energy</th>
                  <th>Your Price</th>
                  <th>Consumer Offer</th>
                  <th>AI Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {negotiationLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "30px",
                        color: colors.textMuted,
                      }}
                    >
                      Loading negotiations...
                    </td>
                  </tr>
                ) : negotiations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "30px",
                        color: colors.textMuted,
                      }}
                    >
                      No AI negotiations yet.
                    </td>
                  </tr>
                ) : (
                  negotiations.map(
                    (negotiation) => {
                      const isPending =
                        negotiation.status ===
                        "Pending";

                      const isAccepted =
                        negotiation.status ===
                        "Accepted";

                      const isRejected =
                        negotiation.status ===
                        "Rejected";

                      return (
                        <tr
                          key={
                            negotiation.id
                          }
                        >
                          <td>
                            {negotiation.id}
                          </td>

                          <td>
                            {
                              negotiation.consumer
                            }
                          </td>

                          <td>
                            {
                              negotiation.energy
                            }{" "}
                            kWh
                          </td>

                          <td>
                            â‚¹
                            {Number(
                              negotiation.producer_price ||
                                0
                            ).toFixed(2)}
                          </td>

                          <td
                            style={{
                              color:
                                colors.cyan,
                              fontWeight: 700,
                            }}
                          >
                            â‚¹
                            {Number(
                              negotiation.consumer_offer ||
                                0
                            ).toFixed(2)}
                          </td>

                          <td
                            style={{
                              color:
                                colors.violet,
                              fontWeight: 700,
                            }}
                          >
                            {negotiation.negotiated_price !==
                              null &&
                            negotiation.negotiated_price !==
                              undefined
                              ? `â‚¹${Number(
                                  negotiation.negotiated_price
                                ).toFixed(2)}`
                              : "â€”"}
                          </td>

                          <td
                            style={{
                              color:
                                statusColor(
                                  negotiation.status
                                ),
                              fontWeight: 700,
                            }}
                          >
                            {
                              negotiation.status
                            }
                          </td>

                          <td>
                            {isPending && (
                              <>
                                <button
                                  className="tr-btn-accept"
                                  disabled={
                                    actionLoading !==
                                    null
                                  }
                                  onClick={() =>
                                    acceptNegotiation(
                                      negotiation.id
                                    )
                                  }
                                >
                                  {actionLoading ===
                                  `negotiation-accept-${negotiation.id}`
                                    ? "Accepting..."
                                    : "Accept"}
                                </button>

                                <button
                                  className="tr-btn-reject"
                                  disabled={
                                    actionLoading !==
                                    null
                                  }
                                  onClick={() =>
                                    rejectNegotiation(
                                      negotiation.id
                                    )
                                  }
                                >
                                  {actionLoading ===
                                  `negotiation-reject-${negotiation.id}`
                                    ? "Rejecting..."
                                    : "Reject"}
                                </button>
                              </>
                            )}

                            {isAccepted && (
                              <span
                                style={{
                                  color:
                                    colors.green,
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              >
                                âœ“ Transaction Created
                              </span>
                            )}

                            {isRejected && (
                              <span
                                style={{
                                  color:
                                    colors.red,
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              >
                                Rejected
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {showPriorityPopup && recommendedRequest && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AI Priority Recommendation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(4, 10, 19, 0.76)",
          }}
        >
          <div style={{ width: "min(560px, 100%)", background: colors.surface, border: "1px solid rgba(185,140,242,0.45)", borderRadius: 14, padding: 24, boxShadow: "0 18px 60px rgba(0,0,0,0.45)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
              <div>
                <div style={{ color: colors.violet, fontSize: 18, fontWeight: 700 }}>🎯 AI Priority Recommendation</div>
                <p style={{ margin: "7px 0 0", color: colors.textMuted, fontSize: 13 }}>
                  Compared across all {priorityRecommendation?.requests?.length || 0} pending request{priorityRecommendation?.requests?.length === 1 ? "" : "s"}. Your decision remains final.
                </p>
              </div>
              <button type="button" onClick={() => setShowPriorityPopup(false)} style={{ border: "none", background: "transparent", color: colors.textMuted, fontSize: 22, cursor: "pointer" }} aria-label="Close">×</button>
            </div>

            <div style={{ marginTop: 18, padding: 16, background: colors.surfaceAlt, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div><div style={{ color: colors.textMuted, fontSize: 11, textTransform: "uppercase" }}>Recommended consumer</div><strong style={{ color: colors.text, fontSize: 18 }}>{recommendedRequest.consumer}</strong></div>
                <div style={{ textAlign: "right" }}><div style={{ color: colors.textMuted, fontSize: 11, textTransform: "uppercase" }}>Priority level</div><strong style={{ color: colors.violet, fontSize: 18 }}>{recommendedRequest.priority_level} · {recommendedRequest.score}/100</strong></div>
              </div>
              <p style={{ margin: "14px 0 0", color: colors.text, lineHeight: 1.55, fontSize: 14 }}><strong>Why: </strong>{recommendedRequest.explanation}</p>
            </div>

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 9, fontSize: 13 }}>
              <div style={{ color: colors.textMuted }}>Reason<br /><span style={{ color: colors.text }}>{recommendedRequest.reason}</span></div>
              <div style={{ color: colors.textMuted }}>Urgency<br /><span style={{ color: colors.text }}>{recommendedRequest.urgency}</span></div>
              <div style={{ color: colors.textMuted }}>Energy required<br /><span style={{ color: colors.text }}>{recommendedRequest.energy} kWh</span></div>
              <div style={{ color: colors.textMuted }}>Offered price<br /><span style={{ color: colors.text }}>₹{recommendedRequest.offered_price}/kWh</span></div>
              <div style={{ color: colors.textMuted }}>Consumer reliability<br /><span style={{ color: colors.text }}>{recommendedRequest.reliability?.score}/100 — {recommendedRequest.reliability?.explanation}</span></div>
              <div style={{ color: colors.textMuted }}>Available producer energy<br /><span style={{ color: colors.text }}>{priorityRecommendation?.available_energy ?? 0} kWh</span></div>
            </div>

            <button type="button" className="tr-btn-primary" onClick={() => setShowPriorityPopup(false)} style={{ marginTop: 20 }}>Review Requests</button>
          </div>
        </div>
      )}

      {requestToAccept && (
        <div role="dialog" aria-modal="true" aria-label="Accept Buy Request" style={{ position: "fixed", inset: 0, zIndex: 51, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(4, 10, 19, 0.76)" }}>
          <div style={{ width: "min(510px, 100%)", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 24, boxShadow: "0 18px 60px rgba(0,0,0,0.45)" }}>
            <h2 style={{ margin: 0, color: colors.text, fontSize: 19 }}>Accept buy request?</h2>
            <p style={{ color: colors.textMuted, lineHeight: 1.55, fontSize: 14 }}>
              You are about to accept {requestToAccept.consumer}'s request for {requestToAccept.energy} kWh. This creates the trade using the existing acceptance flow.
            </p>
            {recommendedRequest && (
              <div style={{ padding: 13, borderRadius: 9, background: requestToAccept.id === recommendedRequest.request_id ? "rgba(95,217,138,0.12)" : "rgba(185,140,242,0.10)", border: `1px solid ${requestToAccept.id === recommendedRequest.request_id ? "rgba(95,217,138,0.35)" : "rgba(185,140,242,0.35)"}`, color: colors.text, fontSize: 13, lineHeight: 1.5 }}>
                {requestToAccept.id === recommendedRequest.request_id ? <><strong style={{ color: colors.green }}>🎯 This is the current AI priority.</strong><br />{recommendedRequest.explanation}</> : <><strong style={{ color: colors.violet }}>🎯 Current AI priority: {recommendedRequest.consumer}</strong><br />{recommendedRequest.explanation}</>}
              </div>
            )}
            <p style={{ color: colors.textMuted, fontSize: 12, marginTop: 14 }}>AI guidance is informational only. You make the final decision.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button type="button" onClick={() => setRequestToAccept(null)} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button type="button" className="tr-btn-accept" disabled={actionLoading !== null} onClick={async () => { await acceptRequest(requestToAccept.id); setRequestToAccept(null); }} style={{ margin: 0, padding: "10px 14px" }}>
                {actionLoading === `request-accept-${requestToAccept.id}` ? "Accepting..." : "Confirm Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





