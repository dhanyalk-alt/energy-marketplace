import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

// =========================================================
// API
// =========================================================

const API = API_BASE_URL;

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
  cyan: "#3FD0E0",
  green: "#5FD98A",
  orange: "#FF8A65",
  red: "#FF6B6B",
  violet: "#B98CF2",
  amber: "#F2A93B",
};

// =========================================================
// STYLES
// =========================================================

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

.rb-table th:first-child {
  border-top-left-radius: 8px;
}

.rb-table th:last-child {
  border-top-right-radius: 8px;
}

.rb-table td {
  text-align: center;
  padding: 12px 10px;
  color: #EDF1F7;
  font-size: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.rb-table tbody tr:hover {
  background: rgba(255,255,255,0.025);
}

.rb-status {
  font-weight: 700;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 20px;
  display: inline-block;
}
`;

// =========================================================
// STATUS HELPERS
// =========================================================

const statusColor = (status) => {
  switch (status) {
    case "Accepted":
      return colors.green;

    case "Rejected":
      return colors.red;

    case "Pending":
      return colors.amber;

    case "Completed":
      return colors.green;

    default:
      return colors.orange;
  }
};

const statusBg = (status) => {
  switch (status) {
    case "Accepted":
      return "rgba(95,217,138,0.14)";

    case "Rejected":
      return "rgba(255,107,107,0.14)";

    case "Pending":
      return "rgba(242,169,59,0.14)";

    case "Completed":
      return "rgba(95,217,138,0.14)";

    default:
      return "rgba(255,138,101,0.14)";
  }
};

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function RequestBuying() {

  // =======================================================
  // STATE
  // =======================================================

  const [requests, setRequests] = useState([]);

  const [transactions, setTransactions] = useState([]);

  const [negotiations, setNegotiations] = useState([]);

  const [loadingRequests, setLoadingRequests] = useState(false);

  const [loadingTransactions, setLoadingTransactions] =
    useState(false);

  const [loadingNegotiations, setLoadingNegotiations] =
    useState(false);

  const [acceptingNegotiationId, setAcceptingNegotiationId] =
    useState(null);

  // =======================================================
  // CURRENT USER
  // =======================================================

  const username =
    localStorage.getItem("username");

  // =======================================================
  // LOAD NORMAL BUY REQUESTS
  // =======================================================

  const loadRequests = async () => {

    if (!username) {
      setRequests([]);
      return;
    }

    try {

      setLoadingRequests(true);

      const response = await axios.get(
        `${API}/trading/requests`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const myRequests = data.filter(
        (item) =>
          item.consumer?.toLowerCase() ===
          username.toLowerCase()
      );

      setRequests(myRequests);

    } catch (err) {

      console.error(
        "Failed to load buy requests:",
        err
      );

      setRequests([]);

    } finally {

      setLoadingRequests(false);

    }
  };

  // =======================================================
  // LOAD CONSUMER TRANSACTIONS
  // =======================================================

  const loadTransactions = async () => {

    if (!username) {
      setTransactions([]);
      return;
    }

    try {

      setLoadingTransactions(true);

      const response = await axios.get(
        `${API}/trading/transactions/consumer/${encodeURIComponent(
          username
        )}`
      );

      setTransactions(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (err) {

      console.error(
        "Transaction history error:",
        err
      );

      setTransactions([]);

    } finally {

      setLoadingTransactions(false);

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

      setLoadingNegotiations(true);

      const response = await axios.get(
        `${API}/trading/negotiations/consumer/${encodeURIComponent(
          username
        )}`,
        {
          headers: localStorage.getItem("energy_marketplace_jwt")
            ? { Authorization: `Bearer ${localStorage.getItem("energy_marketplace_jwt")}` }
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
        "Failed to load AI negotiations:",
        err
      );

      setNegotiations([]);

    } finally {

      setLoadingNegotiations(false);

    }
  };

  const acceptAiPrice = async (negotiationId) => {
    try {
      setAcceptingNegotiationId(negotiationId);
      const token = localStorage.getItem("energy_marketplace_jwt");
      await axios.put(
        `${API}/trading/negotiate/${negotiationId}/accept`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await loadAllData();
    } catch (error) {
      alert(error.response?.data?.detail || "Unable to send the buy request.");
    } finally {
      setAcceptingNegotiationId(null);
    }
  };

  // =======================================================
  // LOAD EVERYTHING
  // =======================================================

  const loadAllData = async () => {

    await Promise.all([
      loadRequests(),
      loadTransactions(),
      loadNegotiations(),
    ]);

  };

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    loadAllData();

  }, []);

  // =======================================================
  // COUNTS
  // =======================================================

  const pendingCount =
    requests.filter(
      (request) =>
        request.status === "Pending"
    ).length;

  const pendingNegotiationCount =
    negotiations.filter(
      (negotiation) =>
        negotiation.status === "Pending"
    ).length;

  // =======================================================
  // UI
  // =======================================================

  return (

    <div
      style={{
        minHeight: "100vh",

        background:
          `radial-gradient(
            circle at 15% 0%,
            #16233A 0%,
            ${colors.bg} 55%
          )`,

        padding: "32px 28px 60px",

        fontFamily:
          "Inter, sans-serif",
      }}
    >

      <style>
        {styleSheet}
      </style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",

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

              letterSpacing:
                "0.14em",

              textTransform:
                "uppercase",

              marginBottom: 6,
            }}
          >
            Consumer · Trading
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
            My Energy Activity
          </h1>

          <p
            style={{
              color:
                colors.textMuted,

              marginTop: 6,

              fontSize: 14,
            }}
          >
            Track your buy requests,
            AI negotiations, and
            completed energy purchases.
          </p>

        </div>

      </div>

      {/* =================================================
          NORMAL BUY REQUESTS
      ================================================= */}

      <div
        style={{
          background:
            colors.surface,

          border:
            `1px solid ${colors.border}`,

          borderRadius: 12,

          padding:
            "22px 24px",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            marginBottom: 18,

            flexWrap: "wrap",

            gap: 10,
          }}
        >

          <div>

            <h2
              style={{
                fontFamily:
                  "Space Grotesk, sans-serif",

                fontSize: 20,

                color:
                  colors.text,

                margin: 0,
              }}
            >
              My Buy Requests
            </h2>

            <p
              style={{
                color:
                  colors.textMuted,

                margin:
                  "6px 0 0",

                fontSize: 13,
              }}
            >
              Track energy requests
              sent to producers.
            </p>

          </div>

          {pendingCount > 0 && (

            <span
              style={{
                background:
                  "rgba(255,138,101,0.15)",

                color:
                  colors.orange,

                fontSize: 12,

                fontWeight: 700,

                padding:
                  "8px 16px",

                borderRadius: 20,
              }}
            >
              {pendingCount} pending
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
            className="rb-table"
            style={{
              width: "100%",

              borderCollapse:
                "separate",

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

              {loadingRequests ? (

                <tr>

                  <td
                    colSpan={5}
                    style={{
                      padding: 36,

                      color:
                        colors.textMuted,
                    }}
                  >
                    Loading buy requests...
                  </td>

                </tr>

              ) : requests.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    style={{
                      padding: 36,

                      color:
                        colors.textMuted,
                    }}
                  >
                    No buy requests yet.
                    <br />

                    Head to the Market
                    page to send one.
                  </td>

                </tr>

              ) : (

                requests.map(
                  (item) => (

                    <tr
                      key={item.id}
                    >

                      <td>
                        {item.id}
                      </td>

                      <td>
                        {item.producer}
                      </td>

                      <td>
                        {Number(
                          item.energy
                        ).toFixed(2)}{" "}
                        kWh
                      </td>

                      <td>
                        ₹
                        {Number(
                          item.total_price
                        ).toFixed(2)}
                      </td>

                      <td>

                        <span
                          className="rb-status"
                          style={{
                            color:
                              statusColor(
                                item.status
                              ),

                            background:
                              statusBg(
                                item.status
                              ),
                          }}
                        >
                          {item.status}
                        </span>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          AI NEGOTIATIONS
      ================================================= */}

      <div
        style={{
          background:
            colors.surface,

          border:
            `1px solid ${colors.border}`,

          borderRadius: 12,

          padding:
            "22px 24px",

          marginTop: 20,
        }}
      >

        {/* HEADER */}

        <div
          style={{
            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            marginBottom: 18,

            flexWrap: "wrap",

            gap: 12,
          }}
        >

          <div>

            <h2
              style={{
                fontFamily:
                  "Space Grotesk, sans-serif",

                fontSize: 20,

                color:
                  colors.text,

                margin: 0,
              }}
            >
              🤖 AI Negotiations
            </h2>

            <p
              style={{
                color:
                  colors.textMuted,

                margin:
                  "6px 0 0",

                fontSize: 13,
              }}
            >
              Track offers and negotiated
              energy prices with producers.
            </p>

          </div>

          {pendingNegotiationCount > 0 && (

            <span
              style={{
                background:
                  "rgba(242,169,59,0.15)",

                color:
                  colors.amber,

                fontSize: 12,

                fontWeight: 700,

                padding:
                  "8px 16px",

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
            className="rb-table"
            style={{
              width: "100%",

              borderCollapse:
                "separate",

              borderSpacing: 0,
            }}
          >

            <thead>

              <tr>

                <th>ID</th>

                <th>Producer</th>

                <th>Energy</th>

                <th>Producer Price</th>

                <th>Your Offer</th>

                <th>AI Price</th>

                <th>Status</th>

                <th>Transaction</th>

                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {loadingNegotiations ? (

                <tr>

                  <td
                    colSpan={9}
                    style={{
                      padding: 36,

                      color:
                        colors.textMuted,
                    }}
                  >
                    Loading AI negotiations...
                  </td>

                </tr>

              ) : negotiations.length === 0 ? (

                <tr>

                  <td
                    colSpan={9}
                    style={{
                      padding: 36,

                      color:
                        colors.textMuted,
                    }}
                  >
                    No AI negotiations yet.
                    <br />

                    Start a negotiation
                    from the Market page.
                  </td>

                </tr>

              ) : (

                negotiations.map(
                  (item) => (

                    <tr
                      key={item.id}
                    >

                      {/* ID */}

                      <td>
                        {item.id}
                      </td>

                      {/* PRODUCER */}

                      <td>
                        {item.producer}
                      </td>

                      {/* ENERGY */}

                      <td>
                        {Number(
                          item.energy
                        ).toFixed(2)}{" "}
                        kWh
                      </td>

                      {/* PRODUCER PRICE */}

                      <td>
                        ₹
                        {Number(
                          item.producer_price
                        ).toFixed(2)}
                      </td>

                      {/* CONSUMER OFFER */}

                      <td
                        style={{
                          color:
                            colors.cyan,

                          fontWeight: 700,
                        }}
                      >
                        ₹
                        {Number(
                          item.consumer_offer
                        ).toFixed(2)}
                      </td>

                      {/* AI NEGOTIATED PRICE */}

                      <td
                        style={{
                          color:
                            colors.violet,

                          fontWeight: 700,
                        }}
                      >

                        {item.negotiated_price !==
                          null &&
                        item.negotiated_price !==
                          undefined
                          ? `₹${Number(
                              item.negotiated_price
                            ).toFixed(2)}`
                          : "—"}

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className="rb-status"
                          style={{
                            color:
                              statusColor(
                                item.status
                              ),

                            background:
                              statusBg(
                                item.status
                              ),
                          }}
                        >
                          {item.status}
                        </span>

                      </td>

                      {/* TRANSACTION */}

                      <td>

                        {item.status ===
                        "Accepted" ? (

                          <span
                            style={{
                              color:
                                colors.green,

                              fontSize: 12,

                              fontWeight: 700,
                            }}
                          >
                            ✓ Completed
                          </span>

                        ) : item.status ===
                          "Rejected" ? (

                          <span
                            style={{
                              color:
                                colors.red,

                              fontSize: 12,

                              fontWeight: 700,
                            }}
                          >
                            Rejected
                          </span>

                        ) : (

                          <span
                            style={{
                              color:
                                colors.textMuted,

                              fontSize: 12,
                            }}
                          >
                            Waiting for producer
                          </span>

                        )}

                      </td>

                      <td>
                        {item.status === "Counter Offer" ? (
                          <button
                            onClick={() => acceptAiPrice(item.id)}
                            disabled={acceptingNegotiationId === item.id}
                            style={{ border: "none", borderRadius: 7, padding: "8px 10px", background: "#5FD98A", color: "#07110B", fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                          >
                            {acceptingNegotiationId === item.id
                              ? "Sending..."
                              : "Confirm Negotiation Request"}
                          </button>
                        ) : (
                          <span style={{ color: colors.textMuted, fontSize: 12 }}>—</span>
                        )}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          COMPLETED PURCHASES
      ================================================= */}

      <div
        style={{
          background:
            colors.surface,

          border:
            `1px solid ${colors.border}`,

          borderRadius: 12,

          padding:
            "22px 24px",

          marginTop: 20,
        }}
      >

        {/* HEADER */}

        <div
          style={{
            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            marginBottom: 18,

            flexWrap: "wrap",

            gap: 12,
          }}
        >

          <div>

            <h2
              style={{
                fontFamily:
                  "Space Grotesk, sans-serif",

                fontSize: 20,

                color:
                  colors.text,

                margin: 0,
              }}
            >
              Completed Purchases
            </h2>

            <p
              style={{
                color:
                  colors.textMuted,

                margin:
                  "6px 0 0",

                fontSize: 13,
              }}
            >
              Your completed energy
              purchases from producers.
            </p>

          </div>

          <div
            style={{
              background:
                "rgba(95,217,138,0.12)",

              color:
                colors.green,

              padding:
                "8px 14px",

              borderRadius: 20,

              fontSize: 12,

              fontWeight: 700,
            }}
          >
            {transactions.length} completed
          </div>

        </div>

        {/* TABLE */}

        <div
          style={{
            overflowX: "auto",
          }}
        >

          <table
            className="rb-table"
            style={{
              width: "100%",

              borderCollapse:
                "separate",

              borderSpacing: 0,
            }}
          >

            <thead>

              <tr>

                <th>ID</th>

                <th>Producer</th>

                <th>Energy</th>

                <th>Price/kWh</th>

                <th>Total Amount</th>

                <th>Date</th>

                <th>Status</th>

              </tr>

            </thead>

            <tbody>

              {loadingTransactions ? (

                <tr>

                  <td
                    colSpan={7}
                    style={{
                      padding: 36,

                      color:
                        colors.textMuted,
                    }}
                  >
                    Loading transactions...
                  </td>

                </tr>

              ) : transactions.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    style={{
                      padding: 36,

                      color:
                        colors.textMuted,
                    }}
                  >
                    No completed purchases yet.
                  </td>

                </tr>

              ) : (

                transactions.map(
                  (item) => (

                    <tr
                      key={item.id}
                    >

                      {/* ID */}

                      <td>
                        {item.id}
                      </td>

                      {/* PRODUCER */}

                      <td>
                        {item.producer}
                      </td>

                      {/* ENERGY */}

                      <td>
                        {Number(
                          item.energy
                        ).toFixed(2)}{" "}
                        kWh
                      </td>

                      {/* PRICE */}

                      <td>
                        ₹
                        {Number(
                          item.price
                        ).toFixed(2)}
                      </td>

                      {/* TOTAL */}

                      <td>
                        ₹
                        {Number(
                          item.total_amount
                        ).toFixed(2)}
                      </td>

                      {/* DATE */}

                      <td>
                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleString()
                          : "—"}
                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className="rb-status"
                          style={{
                            color:
                              colors.green,

                            background:
                              "rgba(95,217,138,0.14)",
                          }}
                        >
                          {item.status}
                        </span>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
