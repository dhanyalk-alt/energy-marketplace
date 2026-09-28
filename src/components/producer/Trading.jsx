import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

// =========================================================
// DESIGN TOKENS
// =========================================================

const colors = {
  bg: "#faf7f2",
  surface: "#fefcf9",
  surfaceAlt: "#efe9de",
  border: "#d8c8b0",
  text: "#2c221e",
  textMuted: "#6e6056",
  amber: "#d97706",
  cyan: "#2f8196",
  green: "#859b32",
  orange: "#d97706",
  red: "#991b1b",
  violet: "#859b32",
  greenGold: "#859b32",
  warmBrown: "#4a3525",
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
  background: #fffdf7;
  border: 1px solid #b8ab92;
  border-radius: 8px;
  padding: 12px 14px;
  color: #20201e;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.tr-input::placeholder {
  color: #857c6d;
}

.tr-input:focus {
  border-color: #859b32;
  box-shadow: 0 0 0 3px rgba(133,155,50,0.18);
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
  background: linear-gradient(135deg, #5c4033, #4a3525);
  color: #fefcf9;
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
  background: rgba(153,27,27,0.15);
  color: #991b1b;
}

.tr-btn-accept {
  background: rgba(133,155,50,0.15);
  color: #859b32;
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
  background: #efe9de !important;
  color: #4a3525 !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  text-align: center !important;
  border: none !important;
  border-bottom: 2px solid #859b32 !important;
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
  color: #2c221e;
  font-size: 14px;
  border-bottom: 1px solid #e6decb;
}

.tr-table tbody tr:hover {
  background: #f7f3ea;
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

.tr-row-recommended {
  background: rgba(133, 155, 50, 0.09) !important;
  border-left: 3px solid #859b32;
}

.ai-recommended-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #55661b;
  background: #f4f6e4;
  border: 1px solid #859b32;
  white-space: nowrap;
}

.ai-sparkle-icon {
  display: inline-block;
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
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [selectedDirectRequest, setSelectedDirectRequest] = useState(null);
  const [actionErrors, setActionErrors] = useState({});

  // =======================================================
  // AI NEGOTIATIONS
  // =======================================================

  const [negotiations, setNegotiations] = useState([]);
  const [negotiationLoading, setNegotiationLoading] = useState(false);

  // =======================================================
  // ACTION LOADING
  // =======================================================

  const [actionLoading, setActionLoading] = useState(null);

  // Tracks the fingerprint of the pending-request batch that last triggered
  // the priority popup so we only auto-show it once per NEW batch.
  const lastPopupBatchKey = useRef(null);

  // =======================================================
  // CURRENT USER
  // =======================================================

  const username = localStorage.getItem("username");

  // =======================================================
  // LOAD NORMAL BUY REQUESTS
  // =======================================================

  const loadRequests = async (silent = false) => {
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
  const loadPriorityRecommendation = async (producerRequests, silent = false) => {
    if (!silent) setPriorityLoading(true);
    const pendingRequests = producerRequests.filter(
      (request) => request.status === "Pending"
    );

    if (!pendingRequests.length) {
      setPriorityRecommendation(null);
      setShowPriorityPopup(false);
      return;
    }

    try {
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
        // Only auto-show popup once per genuinely NEW set of pending requests.
        const batchKey = pendingRequests
          .map((r) => r.id)
          .sort()
          .join(",");
        if (batchKey !== lastPopupBatchKey.current) {
          lastPopupBatchKey.current = batchKey;
          setShowPriorityPopup(true);
        }
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

  const initialNegLoadRef = useRef(true);
  const loadNegotiations = async (silent = false) => {
    if (!silent && initialNegLoadRef.current) setNegotiationLoading(true);
    if (!username) {
      setNegotiations([]);
      return;
    }

    try {
      // silent poll avoids flicker

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
      initialNegLoadRef.current = false;
      setNegotiationLoading(false);
    }
  };

  // =======================================================
  // LOAD ALL TRADING DATA
  // =======================================================

  const loadTradingData = async (silent = false) => {
    const [producerRequests] = await Promise.all([
      loadRequests(silent),
      loadNegotiations(silent),
    ]);
    await loadPriorityRecommendation(producerRequests, silent);
  };

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadTradingData(false);

    // 10s silent background refresh keeps market requests in sync without UI flicker
    const pollTimer = window.setInterval(() => loadTradingData(true), 10000);
    const onTradeUpdate = () => loadTradingData(true);
    window.addEventListener("energy-trade-updated", onTradeUpdate);
    return () => {
      window.clearInterval(pollTimer);
      window.removeEventListener("energy-trade-updated", onTradeUpdate);
    };
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
      window.dispatchEvent(new CustomEvent("energy-trade-updated"));
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
      setActionErrors((current) => ({ ...current, [`request-${id}`]: "" }));

      const response = await axios.put(
        `${API}/trading/accept/${id}`
      );

      console.log(
        "Buy request accepted:",
        response.data
      );

      await loadTradingData();
      window.dispatchEvent(new CustomEvent("energy-trade-updated"));
    } catch (err) {
      console.error(
        "Failed to accept request:",
        err
      );

      setActionErrors((current) => ({ ...current, [`request-${id}`]: err.response?.data?.detail || "Unable to update request. Please try again." }));
    } finally {
      setActionLoading(null);
    }
  };

  const openAcceptRequest = (request) => acceptRequest(request.id);

  // =======================================================
  // REJECT NORMAL BUY REQUEST
  // =======================================================

  const rejectRequest = async (id) => {
    try {
      setActionLoading(`request-reject-${id}`);
      setActionErrors((current) => ({ ...current, [`request-${id}`]: "" }));

      const response = await axios.put(
        `${API}/trading/reject/${id}`
      );

      console.log(
        "Buy request rejected:",
        response.data
      );

      await loadTradingData();
      window.dispatchEvent(new CustomEvent("energy-trade-updated"));
    } catch (err) {
      console.error(
        "Failed to reject request:",
        err
      );

      setActionErrors((current) => ({ ...current, [`request-${id}`]: err.response?.data?.detail || "Unable to update request. Please try again." }));
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
      setActionErrors((current) => ({ ...current, [`negotiation-${negotiationId}`]: "" }));

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

      await loadTradingData();
      window.dispatchEvent(new CustomEvent("energy-trade-updated"));
      setSelectedNegotiation(null);
    } catch (err) {
      console.error(
        "Failed to accept negotiation:",
        err
      );

      setActionErrors((current) => ({ ...current, [`negotiation-${negotiationId}`]: err.response?.data?.detail || "Unable to update negotiation. Please try again." }));
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
      setActionErrors((current) => ({ ...current, [`negotiation-${negotiationId}`]: "" }));

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

      await loadTradingData();
      window.dispatchEvent(new CustomEvent("energy-trade-updated"));
      setSelectedNegotiation(null);
    } catch (err) {
      console.error(
        "Failed to reject negotiation:",
        err
      );

      setActionErrors((current) => ({ ...current, [`negotiation-${negotiationId}`]: err.response?.data?.detail || "Unable to update negotiation. Please try again." }));
    } finally {
      setActionLoading(null);
    }
  };

  // =======================================================
  // COUNTS
  // =======================================================

  const pendingNegotiationCount =
    negotiations.filter(
      (negotiation) =>
        negotiation.status === "Pending"
    ).length;

  const recommendedRequest =
    priorityRecommendation?.recommended_request || null;

  const formatINR = (value) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

  const formatDateTime = (value) => {
    if (!value) return "Not recorded";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Not recorded"
      : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const sameAmount = (first, second) => Math.abs(Number(first || 0) - Number(second || 0)) < 0.01;

  // A negotiation and its linked BuyRequest describe one user request. Keep a
  // single consolidated row, using the BuyRequest ID when one exists. The
  // fallback supports historical records created before negotiation_id existed.
  const usedRequestIds = new Set();
  const negotiatedRows = negotiations.map((negotiation) => {
    const negotiatedTotal = Number(negotiation.energy || 0) * Number(
      negotiation.negotiated_price ?? negotiation.consumer_offer ?? negotiation.producer_price ?? 0,
    );
    const linkedRequests = requests.filter((request) =>
      Number(request.negotiation_id) === Number(negotiation.id),
    );
    const historicalMatches = linkedRequests.length === 0 ? requests.filter((request) =>
      !request.negotiation_id
      && String(request.consumer) === String(negotiation.consumer)
      && String(request.producer) === String(negotiation.producer)
      && Number(request.listing_id) === Number(negotiation.listing_id)
      && sameAmount(request.energy, negotiation.energy)
      && sameAmount(request.total_price, negotiatedTotal),
    ) : [];
    const allMatches = linkedRequests.length ? linkedRequests : historicalMatches;
    const linkedRequest = allMatches.find((request) => request.status === negotiation.status) || allMatches[0];

    // Historical producer-accept logic could leave both the pending request
    // and a later completed request behind. They are one lifecycle, so consume
    // every exact match and render the authoritative negotiated row once.
    allMatches.forEach((request) => usedRequestIds.add(request.id));

    return {
      ...negotiation,
      ...(linkedRequest || {}),
      id: linkedRequest?.id ?? negotiation.id,
      negotiationId: negotiation.id,
      displayId: linkedRequest?.id ?? negotiation.id,
      rowType: "negotiated",
      rowKey: linkedRequest ? `request-${linkedRequest.id}` : `negotiation-${negotiation.id}`,
      status: negotiation.status || linkedRequest?.status,
      totalPrice: linkedRequest ? Number(linkedRequest.total_price || negotiatedTotal) : negotiatedTotal,
      created_at: linkedRequest?.created_at ?? negotiation.created_at,
    };
  });

  const directRows = requests
    .filter((request) => !usedRequestIds.has(request.id))
    .map((request) => ({
      ...request,
      displayId: request.id,
      rowType: "direct",
      rowKey: `request-${request.id}`,
      totalPrice: Number(request.total_price || 0),
    }));

  const unifiedRequests = [...negotiatedRows, ...directRows]
    .sort((first, second) => Number(second.displayId) - Number(first.displayId));
  const activeRequestRows = unifiedRequests.filter((request, index) =>
    index < 20 || !["Accepted", "Rejected"].includes(request.status)
  );
  const consolidatedPendingCount = unifiedRequests.filter((request) => request.status === "Pending").length;

  // =======================================================
  // UI
  // =======================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          `linear-gradient(135deg, #faf7f2 0%, #f5f0eb 55%, #faf7f2 100%)`,
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
              ⚡ Energy Trading Requests
            </h2>

            {consolidatedPendingCount > 0 && (
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
                  {consolidatedPendingCount} pending
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
                  <th>Type</th>
                  <th>Energy</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {negotiationLoading ? (
                  <tr><td colSpan={7} style={{ padding: "28px 10px", color: colors.textMuted }}>Loading trading requests...</td></tr>
                ) : activeRequestRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "28px 10px",
                        color: colors.textMuted,
                      }}
                    >
                      No trading requests yet.
                    </td>
                  </tr>
                ) : (
                  activeRequestRows.map((req) => {
                    const isPending =
                      req.status === "Pending";
                    const isNegotiation = req.rowType === "negotiated";
                    // Use Number() coercion: API may return request_id as a
                    // string while req.id is a number — strict === would silently fail.
                    const isRecommended =
                      isPending &&
                      recommendedRequest != null &&
                      Number(recommendedRequest.request_id) === Number(req.id);

                    return (
                      <tr key={req.rowKey} className={isRecommended ? "tr-row-recommended" : undefined}>
                        <td>{req.displayId}</td>

                        <td>
                          {req.consumer}
                          {isRecommended && (
                            <div className="ai-recommended-badge">
                              <span className="ai-sparkle-icon">✨</span>
                              AI Recommended
                              <span className="ai-sparkle-icon">✨</span>
                            </div>
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() => isNegotiation ? setSelectedNegotiation(req) : setSelectedDirectRequest(req)}
                            style={{
                              border: `1px solid ${isNegotiation ? "rgba(120,88,166,.45)" : "rgba(47,129,150,.42)"}`,
                              borderRadius: 999,
                              padding: "7px 10px",
                              color: isNegotiation ? "#7858a6" : "#2f8196",
                              background: isNegotiation ? "rgba(120,88,166,.10)" : "rgba(47,129,150,.10)",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {isNegotiation ? "🟣 Negotiated" : "🟦 Direct Buying"}
                          </button>
                        </td>

                        <td>
                          {req.energy} kWh
                        </td>

                        <td>
                          {formatINR(req.totalPrice)}
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
                          {isNegotiation && isPending ? (
                            <button className="tr-btn-primary" type="button" onClick={() => setSelectedNegotiation(req)} style={{ width: "auto", padding: "8px 14px", margin: 0 }}>
                              View
                            </button>
                          ) : isNegotiation ? (
                            <span style={{ color: req.status === "Accepted" ? colors.green : colors.red, fontSize: 13, fontWeight: 700 }}>
                              {req.status === "Accepted" ? "Completed" : "Rejected"}
                            </span>
                          ) : isPending ? (
                            <>
                              <button
                                className="tr-btn-accept"
                                disabled={actionLoading !== null}
                                onClick={() =>
                                  openAcceptRequest(req)
                                }
                              >
                                {actionLoading === `request-accept-${req.id}` ? "Processing..." : "Accept"}
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
                                  ? "Processing..."
                                  : "Reject"}
                              </button>
                              {actionErrors[`request-${req.id}`] && <div style={{ color: colors.red, fontSize: 12, marginTop: 6 }}>{actionErrors[`request-${req.id}`]}</div>}
                            </>
                          ) : (
                            <span
                              style={{
                                color:
                                  colors.textMuted,
                                fontSize: 13,
                              }}
                            >
                              {req.status === "Accepted" ? "Completed" : "Rejected"}
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

      {false && (
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
      )}

      {selectedNegotiation && (
        <div role="dialog" aria-modal="true" aria-label="Negotiation Request" style={{ position: "fixed", inset: 0, zIndex: 52, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(44,34,30,.65)" }}>
          <div style={{ width: "min(720px, 92vw)", maxHeight: "90vh", overflowY: "auto", padding: "30px 32px", borderRadius: 18, border: "1px solid #d8c8b0", background: "#fefcf9", color: "#2c221e", boxShadow: "0 24px 75px rgba(44,34,30,.22)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18 }}>
              <div><h2 style={{ margin: 0, fontSize: 27 }}>🟣 Negotiated Request Details</h2><p style={{ margin: "9px 0 0", color: "#6e6056", fontSize: 17 }}><strong style={{ color: "#4A2E18" }}>{selectedNegotiation.consumer}</strong> · Request #{selectedNegotiation.displayId ?? selectedNegotiation.id} · {selectedNegotiation.energy} kWh</p></div>
              <button type="button" onClick={() => setSelectedNegotiation(null)} aria-label="Close" style={{ border: 0, background: "transparent", color: "#1E293B", cursor: "pointer", fontSize: 30, lineHeight: 1 }}>×</button>
            </div>

            <section style={{ marginTop: 25 }}>
              <h3 style={{ margin: "0 0 12px", color: "#859b32", fontSize: 18 }}>💰 Negotiation Audit Trail</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                {[['Initial producer price', selectedNegotiation.producer_price], ['Consumer counter-offer', selectedNegotiation.consumer_offer], ['Final agreed price', selectedNegotiation.negotiated_price]].map(([label, value]) => (
                  <div key={label} style={{ padding: 16, borderRadius: 12, background: "#faf7f2", border: "1px solid #e6decb" }}><div style={{ color: "#6e6056", fontSize: 14 }}>{label}</div><strong style={{ display: "block", marginTop: 6, color: "#859b32", fontSize: 21 }}>{formatINR(value)}/kWh</strong></div>
                ))}
              </div>
            </section>

            <section style={{ marginTop: 18, padding: 18, borderRadius: 12, background: "#faf7f2" }}>
              <h3 style={{ margin: 0, color: "#4A2E18", fontSize: 18 }}>🕒 Recorded negotiation events</h3>
              <div style={{ marginTop: 13, display: "grid", gap: 9, color: "#6e6056", fontSize: 16, lineHeight: 1.45 }}>
                <div><strong style={{ color: "#4A2E18" }}>Negotiation created:</strong> {formatDateTime(selectedNegotiation.created_at)}</div>
                <div><strong style={{ color: "#4A2E18" }}>Current/final status:</strong> {selectedNegotiation.status || "Pending"}</div>
                <div style={{ fontSize: 14 }}>This request stores its initial price, consumer counter-offer, and final agreed price above. No separate per-message negotiation logs were recorded for this request.</div>
              </div>
            </section>

            <section style={{ marginTop: 24, padding: 18, borderRadius: 12, background: "#faf7f2" }}>
              <h3 style={{ margin: 0, color: "#4A2E18", fontSize: 18 }}>👤 Consumer Information</h3>
              <p style={{ margin: "13px 0 0", color: "#6e6056", fontSize: 16 }}>Urgency: <strong style={{ color: selectedNegotiation.urgency === "Critical" ? "#ff9b93" : selectedNegotiation.urgency === "Essential" ? "#ffbd75" : "#80d89c" }}>{selectedNegotiation.urgency || "Normal"}</strong></p>
              <p style={{ margin: "10px 0 0", color: "#6e6056", fontSize: 16, lineHeight: 1.55 }}>Consumer&apos;s Reason: <span style={{ color: "#4A2E18" }}>{selectedNegotiation.reason || "Not provided"}</span></p>
            </section>

            {actionErrors[`negotiation-${selectedNegotiation.negotiationId ?? selectedNegotiation.id}`] && <p style={{ margin: "16px 0 0", color: "#ff9b93", fontSize: 15 }}>{actionErrors[`negotiation-${selectedNegotiation.negotiationId ?? selectedNegotiation.id}`]}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 26 }}>
              <button type="button" className="tr-btn-reject" disabled={actionLoading !== null} onClick={() => rejectNegotiation(selectedNegotiation.negotiationId ?? selectedNegotiation.id)} style={{ margin: 0, padding: "13px 18px", fontSize: 17 }}>{actionLoading === `negotiation-reject-${selectedNegotiation.negotiationId ?? selectedNegotiation.id}` ? "Processing..." : "Reject"}</button>
              <button type="button" className="tr-btn-accept" disabled={actionLoading !== null} onClick={() => acceptNegotiation(selectedNegotiation.negotiationId ?? selectedNegotiation.id)} style={{ margin: 0, padding: "13px 18px", fontSize: 17 }}>{actionLoading === `negotiation-accept-${selectedNegotiation.negotiationId ?? selectedNegotiation.id}` ? "Processing..." : "Accept"}</button>
            </div>
          </div>
        </div>
      )}

      {selectedDirectRequest && (
        <div role="dialog" aria-modal="true" aria-label="Direct Buying Request" style={{ position: "fixed", inset: 0, zIndex: 52, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(44,34,30,.65)" }}>
          <div style={{ width: "min(650px, 92vw)", padding: "28px 30px", borderRadius: 18, border: "1px solid #d8c8b0", background: "#fefcf9", color: "#2c221e", boxShadow: "0 24px 75px rgba(44,34,30,.22)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18 }}>
              <div><h2 style={{ margin: 0, fontSize: 25 }}>🟦 Direct Buying Request</h2><p style={{ margin: "9px 0 0", color: "#6e6056", fontSize: 16 }}>Request details only. Use the table action buttons to accept or reject.</p></div>
              <button type="button" onClick={() => setSelectedDirectRequest(null)} aria-label="Close" style={{ border: 0, background: "transparent", color: "#1E293B", cursor: "pointer", fontSize: 30, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18, marginTop: 24 }}>
              <div><div style={{ color: "#6e6056", fontSize: 14 }}>Consumer</div><strong style={{ display: "block", marginTop: 5, fontSize: 20 }}>{selectedDirectRequest.consumer}</strong></div>
              <div><div style={{ color: "#6e6056", fontSize: 14 }}>Energy Required</div><strong style={{ display: "block", marginTop: 5, fontSize: 20 }}>{selectedDirectRequest.energy} kWh</strong></div>
              <div><div style={{ color: "#6e6056", fontSize: 14 }}>Fixed Price / kWh</div><strong style={{ display: "block", marginTop: 5, fontSize: 20 }}>{formatINR(selectedDirectRequest.offered_price ?? (Number(selectedDirectRequest.total_price || 0) / Number(selectedDirectRequest.energy || 1)))}</strong></div>
              <div><div style={{ color: "#6e6056", fontSize: 14 }}>Total Price</div><strong style={{ display: "block", marginTop: 5, fontSize: 20 }}>{formatINR(selectedDirectRequest.total_price)}</strong></div>
              <div><div style={{ color: "#6e6056", fontSize: 14 }}>Submitted</div><strong style={{ display: "block", marginTop: 5, fontSize: 16 }}>{formatDateTime(selectedDirectRequest.created_at)}</strong></div>
              <div><div style={{ color: "#6e6056", fontSize: 14 }}>Final Status</div><strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>{selectedDirectRequest.status || "Pending"}</strong></div>
              {selectedDirectRequest.urgency && <div><div style={{ color: "#6e6056", fontSize: 14 }}>Urgency</div><strong style={{ display: "block", marginTop: 5, color: selectedDirectRequest.urgency === "Critical" ? "#ff9b93" : "#ffbd75", fontSize: 18 }}>{selectedDirectRequest.urgency}</strong></div>}
            </div>
            <div style={{ marginTop: 22, padding: 18, borderRadius: 12, background: "#393228" }}><div style={{ color: "#6e6056", fontSize: 14 }}>Reason</div><p style={{ margin: "8px 0 0", color: "#fff", fontSize: 17, lineHeight: 1.55 }}>{selectedDirectRequest.reason || "Not provided"}</p></div>
          </div>
        </div>
      )}

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
            padding: 24,
            background: "rgba(44, 34, 30, 0.65)",
          }}
        >
          <div style={{ width: "min(820px, 92vw)", maxHeight: "90vh", overflowY: "auto", background: "#fefcf9", border: "1px solid #d8c8b0", borderRadius: 18, padding: "30px 32px", boxShadow: "0 24px 75px rgba(44,34,30,0.22)", color: "#2c221e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
              <div>
                <div style={{ color: "#859b32", fontSize: 27, fontWeight: 700 }}>🎯 AI Priority Recommendation</div>
                <p style={{ margin: "9px 0 0", color: "#6e6056", fontSize: 17, lineHeight: 1.5 }}>
                  Compared across all {priorityRecommendation?.requests?.length || 0} pending request{priorityRecommendation?.requests?.length === 1 ? "" : "s"}. Your decision remains final.
                </p>
              </div>
              <button type="button" onClick={() => setShowPriorityPopup(false)} style={{ border: "none", background: "transparent", color: "#1E293B", fontSize: 30, lineHeight: 1, cursor: "pointer" }} aria-label="Close">×</button>
            </div>

            <div style={{ marginTop: 24, padding: "22px 24px", background: "#faf7f2", border: "1px solid #e6decb", borderRadius: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 18 }}>
                <div><div style={{ color: "#6e6056", fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recommended consumer</div><strong style={{ color: "#1E293B", fontSize: 25 }}>{recommendedRequest.consumer}</strong></div>
                <div style={{ textAlign: "right" }}><div style={{ color: "#6e6056", fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Priority level</div><strong style={{ color: "#859b32", fontSize: 24 }}>{recommendedRequest.priority_level} · {recommendedRequest.score}/100</strong></div>
              </div>
              <p style={{ margin: "18px 0 0", color: "#1E293B", lineHeight: 1.6, fontSize: 18 }}><strong>Why: </strong>{recommendedRequest.explanation}</p>
            </div>

            <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "20px 28px", fontSize: 16, lineHeight: 1.5 }}>
              <div style={{ color: "#6e6056" }}>Reason<br /><span style={{ color: "#1E293B", fontSize: 18, fontWeight: 600 }}>{recommendedRequest.reason}</span></div>
              <div style={{ color: "#6e6056" }}>Urgency<br /><span style={{ color: "#ffbd75", fontSize: 18, fontWeight: 600 }}>{recommendedRequest.urgency}</span></div>
              <div style={{ color: "#6e6056" }}>Energy required<br /><span style={{ color: "#1E293B", fontSize: 18, fontWeight: 600 }}>{recommendedRequest.energy} kWh</span></div>
              <div style={{ color: "#6e6056" }}>Offered price<br /><span style={{ color: "#859b32", fontSize: 18, fontWeight: 600 }}>₹{recommendedRequest.offered_price}/kWh</span></div>
              <div style={{ color: "#6e6056" }}>Consumer reliability<br /><span style={{ color: "#1E293B", fontSize: 17, fontWeight: 600 }}>{recommendedRequest.reliability?.score}/100 — {recommendedRequest.reliability?.explanation}</span></div>
              <div style={{ color: "#6e6056" }}>Available producer energy<br /><span style={{ color: "#1E293B", fontSize: 18, fontWeight: 600 }}>{priorityRecommendation?.available_energy ?? 0} kWh</span></div>
            </div>

            <button type="button" className="tr-btn-primary" onClick={() => setShowPriorityPopup(false)} style={{ marginTop: 28, minHeight: 54, fontSize: 19 }}>Review Requests</button>
          </div>
        </div>
      )}

      {requestToAccept && (
        <div role="dialog" aria-modal="true" aria-label="Accept Buy Request" style={{ position: "fixed", inset: 0, zIndex: 51, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(44, 34, 30, 0.65)" }}>
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





