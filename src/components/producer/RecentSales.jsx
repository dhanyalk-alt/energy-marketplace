import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

const API = API_BASE_URL;

export default function RecentSales() {
  const [sales, setSales] = useState([]);
  const [buyRequests, setBuyRequests] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [selectedPurchaser, setSelectedPurchaser] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [reviewLoading, setReviewLoading] = useState(true);

  const [reviewError, setReviewError] = useState("");

  const username = localStorage.getItem("username");

  // ============================================================
  // FETCH SALES + REVIEWS
  // ============================================================

  useEffect(() => {
    const fetchData = async (silent = false) => {
      if (!username) {
        setReviewError("Producer username not found.");
        setReviewLoading(false);
        return;
      }

      try {
        if (!silent) setReviewLoading(true);

        const response = await fetch(
          `${API}/trading/reviews/${encodeURIComponent(
            username
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch reviews.");
        }

        const data = await response.json();

        setReviews(
          Array.isArray(data.reviews)
            ? data.reviews
            : []
        );

        setAverageRating(
          Number(data.average_rating || 0)
        );

        setTotalReviews(
          Number(data.total_reviews || 0)
        );
      } catch (err) {
        console.error("Review fetch error:", err);
        setReviewError("Unable to load reviews.");
      } finally {
        setReviewLoading(false);
      }
    };

    fetchData(false);
    const refreshTimer = window.setInterval(() => fetchData(true), 10000);
    return () => window.clearInterval(refreshTimer);
  }, [username]);

  // Keep purchaser analytics current after a producer accepts or rejects a
  // request. Reviews deliberately remain on their existing load path.
  useEffect(() => {
    if (!username) return undefined;

    let cancelled = false;
    const loadPurchaserData = async () => {
      const token = localStorage.getItem("energy_marketplace_jwt");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const [salesResponse, requestsResponse, negotiationsResponse] = await Promise.all([
          fetch(`${API}/trading/transactions/producer/${encodeURIComponent(username)}`),
          fetch(`${API}/trading/requests`),
          fetch(`${API}/trading/negotiations/producer/${encodeURIComponent(username)}`, { headers }),
        ]);

        if (cancelled) return;
        if (salesResponse.ok) setSales(await salesResponse.json());
        if (requestsResponse.ok) {
          const allRequests = await requestsResponse.json();
          setBuyRequests((Array.isArray(allRequests) ? allRequests : []).filter(
            (request) => String(request.producer).toLowerCase() === String(username).toLowerCase(),
          ));
        }
        if (negotiationsResponse.ok) setNegotiations(await negotiationsResponse.json());
      } catch (err) {
        // Keep the last successful analytics visible during a temporary network failure.
        console.error("Purchaser analytics refresh error:", err);
      }
    };

    loadPurchaserData();
    const refreshTimer = window.setInterval(() => loadPurchaserData(), 10000);
    window.addEventListener("energy-trade-updated", loadPurchaserData);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener("energy-trade-updated", loadPurchaserData);
    };
  }, [username]);

  // ============================================================
  // CALCULATIONS
  // ============================================================

  const visibleReviews = [...reviews]
    .sort((first, second) => new Date(second.created_at || 0) - new Date(first.created_at || 0))
    .slice(0, 20);

  const formatINR = (value) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

  const formatDateTime = (value) => {
    if (!value) return "Not recorded";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString("en-IN");
  };

  const hasNegotiationHistory = (request) => Boolean(request.negotiation_id) || negotiations.some((negotiation) =>
    String(negotiation.consumer) === String(request.consumer)
    && Number(negotiation.listing_id) === Number(request.listing_id)
    && Number(negotiation.energy) === Number(request.energy)
    && Math.abs(Number(request.total_price || 0) - (Number(negotiation.energy || 0) * Number(negotiation.negotiated_price ?? negotiation.consumer_offer ?? 0))) < 0.01,
  );

  const purchaserNames = Array.from(new Set([
    ...sales.map((sale) => sale.consumer),
    ...buyRequests.map((request) => request.consumer),
    ...negotiations.map((negotiation) => negotiation.consumer),
  ].filter(Boolean)));

  const getPurchaserDetails = (consumer) => {
    const consumerSales = sales.filter((sale) => sale.consumer === consumer);
    const consumerNegotiations = negotiations.filter((negotiation) => negotiation.consumer === consumer);
    const directRequests = buyRequests.filter((request) => request.consumer === consumer && !hasNegotiationHistory(request));
    const acceptedDirect = directRequests.filter((request) => request.status === "Accepted");
    const rejectedDirect = directRequests.filter((request) => request.status === "Rejected");
    const acceptedNegotiations = consumerNegotiations.filter((negotiation) => negotiation.status === "Accepted");
    const rejectedNegotiations = consumerNegotiations.filter((negotiation) => negotiation.status === "Rejected");
    const activityDates = [
      ...consumerSales.map((sale) => sale.created_at),
      ...directRequests.map((request) => request.created_at),
      ...consumerNegotiations.map((negotiation) => negotiation.created_at),
    ].map((value) => new Date(value || 0).getTime());

    return {
      consumer,
      sales: consumerSales,
      acceptedDirect,
      rejectedDirect,
      rejectedRequests: [
        ...rejectedDirect.map((request) => ({ ...request, requestType: "Direct buying" })),
        ...rejectedNegotiations.map((negotiation) => ({
          ...negotiation,
          requestType: "Negotiated",
          offered_price: negotiation.consumer_offer,
        })),
      ],
      acceptedNegotiations,
      totalEnergy: consumerSales.reduce((total, sale) => total + Number(sale.energy || 0), 0),
      totalAmount: consumerSales.reduce((total, sale) => total + Number(sale.total_amount || 0), 0),
      acceptedCount: acceptedDirect.length + acceptedNegotiations.length,
      rejectedCount: rejectedDirect.length + rejectedNegotiations.length,
      lastActivity: Math.max(0, ...activityDates),
    };
  };

  const purchasers = purchaserNames
    .map(getPurchaserDetails)
    .sort((first, second) => second.lastActivity - first.lastActivity);
  const selectedPurchaserDetails = selectedPurchaser ? getPurchaserDetails(selectedPurchaser) : null;

  // ============================================================
  // STAR RENDERER
  // ============================================================

  const renderStars = (rating) => {
    const numericRating = Number(rating || 0);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: "19px",
              color:
                star <= numericRating
                  ? "#f59e0b"
                  : "#d1d5db",
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        boxSizing: "border-box",
        padding: "28px",
        background: "#faf7f2",
      }}
    >
      <style>{`
        .recent-sales-purchaser-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 768px) { .recent-sales-purchaser-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      `}</style>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#2c221e",
            fontSize: "28px",
            fontWeight: "750",
          }}
        >
          Recent Sales & Reviews
        </h3>

      </div>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        {/* Average Rating */}

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>
            Average Rating
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "5px",
            }}
          >
            <span style={summaryValueStyle}>
              {averageRating.toFixed(1)}
            </span>

            <span
              style={{
                fontSize: "24px",
                color: "#f59e0b",
              }}
            >
              ★
            </span>
          </div>
        </div>

        {/* Total Reviews */}

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>
            Total Reviews
          </div>

          <div style={summaryValueStyle}>
            {totalReviews}
          </div>
        </div>
      </div>

      <ReviewsSection
        reviews={visibleReviews}
        totalReviews={totalReviews}
        averageRating={averageRating}
        loading={reviewLoading}
        error={reviewError}
        renderStars={renderStars}
      />

      {/* ======================================================
          PURCHASERS
      ====================================================== */}

      <div style={{ ...sectionCardStyle, marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div>
            <h4 style={{ margin: 0, color: "#2c221e", fontSize: "18px" }}>Purchasers</h4>
          </div>
          <span style={{ padding: "6px 11px", borderRadius: "8px", background: "#efe9de", color: "#859b32", fontSize: "12px", fontWeight: 700 }}>{purchasers.length} purchasers</span>
        </div>

        {purchasers.length === 0 ? (
          <div style={emptyStyle}>No purchaser activity yet.</div>
        ) : (
          <div className="recent-sales-purchaser-grid">
            {purchasers.map((purchaser) => (
              <button
                type="button"
                key={purchaser.consumer}
                onClick={() => setSelectedPurchaser(purchaser.consumer)}
                style={{ minHeight: 150, textAlign: "left", cursor: "pointer", border: "1px solid #dbe4f0", borderRadius: 16, padding: 24, background: "linear-gradient(135deg, #f8fbff, #ffffff)", color: "#2c221e", boxShadow: "0 5px 16px rgba(15,23,42,.05)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 21 }}>{purchaser.consumer}</strong>
                  <span style={{ color: "#859b32", fontSize: 13, fontWeight: 700 }}>View details →</span>
                </div>
                <div style={{ marginTop: 28, display: "flex", gap: 16, color: "#6e6056", fontSize: 14 }}>
                  <span>{purchaser.totalEnergy.toFixed(2)} kWh sold</span>
                  <span>{purchaser.acceptedCount} accepted</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {reviews === null && (<>{/* ======================================================
          REVIEWS
      ====================================================== */}

      <div
        style={{
          ...sectionCardStyle,
          marginTop: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <div>
            <h4
              style={{
                margin: 0,
                color: "#2c221e",
                fontSize: "18px",
              }}
            >
              Customer Reviews
            </h4>

            <p
              style={{
                margin: "4px 0 0",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              Feedback from consumers who purchased
              your energy.
            </p>
          </div>

          {/* Rating summary */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding:
                "8px 12px",
              background:
                "#fffbeb",
              border:
                "1px solid #fde68a",
              borderRadius: "10px",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: "750",
                color: "#92400e",
              }}
            >
              {averageRating.toFixed(1)}
            </span>

            <span
              style={{
                color: "#f59e0b",
                fontSize: "18px",
              }}
            >
              ★
            </span>

            <span
              style={{
                color: "#92400e",
                fontSize: "11px",
              }}
            >
              ({totalReviews})
            </span>
          </div>
        </div>

        {/* Review Loading */}

        {reviewLoading && (
          <div style={emptyStyle}>
            Loading reviews...
          </div>
        )}

        {/* Review Error */}

        {!reviewLoading && reviewError && (
          <div
            style={{
              padding: "15px",
              borderRadius: "8px",
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: "13px",
            }}
          >
            {reviewError}
          </div>
        )}

        {/* No Reviews */}

        {!reviewLoading &&
          !reviewError &&
          reviews.length === 0 && (
            <div
              style={{
                padding: "35px 20px",
                background: "#faf7f2",
                borderRadius: "10px",
                border:
                  "1px dashed #d1d5db",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  marginBottom: "8px",
                }}
              >
                ⭐
              </div>

              <div
                style={{
                  color: "#374151",
                  fontSize: "15px",
                  fontWeight: "700",
                }}
              >
                No reviews yet
              </div>

              <div
                style={{
                  marginTop: "5px",
                  color: "#9ca3af",
                  fontSize: "12px",
                }}
              >
                Reviews from consumers will
                appear here after completed
                purchases.
              </div>
            </div>
          )}

        {/* Reviews List */}

        {!reviewLoading &&
          !reviewError &&
          reviews.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: "16px",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: "12px",
                    background:
                      "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      gap: "15px",
                    }}
                  >
                    {/* Consumer */}

                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#2c221e",
                          marginBottom:
                            "5px",
                        }}
                      >
                        {review.consumer}
                      </div>

                      {renderStars(
                        review.rating
                      )}
                    </div>

                    {/* Date */}

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                      }}
                    >
                      {review.created_at
                        ? new Date(
                            review.created_at
                          ).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>

                  {/* Comment */}

                  {review.comment && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding:
                          "11px 13px",
                        background:
                          "#f8fafc",
                        borderRadius:
                          "8px",
                        color:
                          "#4b5563",
                        fontSize:
                          "13px",
                        lineHeight:
                          "1.5",
                      }}
                    >
                      "{review.comment}"
                    </div>
                  )}

                  {/* Transaction */}

                  <div
                    style={{
                      marginTop: "9px",
                      fontSize: "10px",
                      color: "#9ca3af",
                    }}
                  >
                    Transaction #
                    {review.transaction_id}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div></>)}
      {selectedPurchaserDetails && (
        <div role="dialog" aria-modal="true" aria-label={`${selectedPurchaserDetails.consumer} purchaser analytics`} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(44,34,30,.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <aside style={{ width: "min(1120px, 96vw)", maxHeight: "90vh", overflowY: "auto", padding: "28px", borderRadius: 18, background: "#faf7f2", boxShadow: "0 24px 60px rgba(15,23,42,.28)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: "#859b32", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".08em" }}>Purchaser analytics</div>
                <h2 style={{ margin: "6px 0 0", color: "#2c221e", fontSize: 28 }}>{selectedPurchaserDetails.consumer}</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>Request and finalized-trade data for this purchaser.</p>
              </div>
              <button type="button" onClick={() => setSelectedPurchaser(null)} aria-label="Close purchaser analytics" style={{ border: "none", background: "transparent", color: "#334155", cursor: "pointer", fontSize: 32, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 12, marginTop: 24 }}>
              {[
                ["Total Energy Sold", `${selectedPurchaserDetails.totalEnergy.toFixed(2)} kWh`, "#2563eb"],
                ["Total Amount Received", formatINR(selectedPurchaserDetails.totalAmount), "#15803d"],
                ["Accepted Requests", selectedPurchaserDetails.acceptedCount, "#7c3aed"],
                ["Rejected Requests", selectedPurchaserDetails.rejectedCount, "#dc2626"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ padding: 17, borderRadius: 12, border: "1px solid #e6decb", background: "#faf7f2" }}>
                  <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>{label}</div>
                  <strong style={{ display: "block", marginTop: 7, color, fontSize: 23 }}>{value}</strong>
                </div>
              ))}
            </div>

            <PurchaserTable
              title="Accepted Direct Requests"
              emptyText="No accepted direct buy requests for this purchaser."
              columns={["Date / Time", "Energy Required", "Unit Price", "Total Price"]}
              rows={selectedPurchaserDetails.acceptedDirect.map((request) => [
                formatDateTime(request.created_at), `${Number(request.energy || 0).toFixed(2)} kWh`,
                formatINR(request.offered_price ?? (Number(request.total_price || 0) / Number(request.energy || 1))), formatINR(request.total_price),
              ])}
            />
            <PurchaserTable
              title="Rejected Requests"
              emptyText="No rejected requests for this purchaser."
              columns={["Date / Time", "Requested Energy", "Offered Price", "Status"]}
              rows={selectedPurchaserDetails.rejectedRequests.map((request) => [
                formatDateTime(request.created_at), `${Number(request.energy || 0).toFixed(2)} kWh`,
                formatINR(request.offered_price ?? request.consumer_offer ?? (Number(request.total_price || 0) / Number(request.energy || 1))), `${request.status} · ${request.requestType}`,
              ])}
            />
            <PurchaserTable
              title="Accepted Negotiated Trades"
              emptyText="No accepted negotiated trades for this purchaser."
              columns={["Date / Time", "Initial Price", "Counter-offer History", "Final Agreed Price", "Final Energy"]}
              rows={selectedPurchaserDetails.acceptedNegotiations.map((negotiation) => [
                formatDateTime(negotiation.created_at), formatINR(negotiation.producer_price),
                `${formatINR(negotiation.consumer_offer)} consumer offer`, formatINR(negotiation.negotiated_price), `${Number(negotiation.energy || 0).toFixed(2)} kWh`,
              ])}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function PurchaserTable({ title, columns, rows, emptyText }) {
  return (
    <section style={{ marginTop: 24, padding: 20, border: "1px solid #d8c8b0", borderRadius: 14, background: "#fefcf9" }}>
      <h3 style={{ margin: 0, color: "#2c221e", fontSize: 17 }}>{title}</h3>
      {rows.length === 0 ? <p style={{ margin: "14px 0 0", color: "#64748b", fontSize: 13 }}>{emptyText}</p> : (
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead><tr>{columns.map((column) => <th key={column} style={headerStyle}>{column}</th>)}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={`${title}-${index}`}>{row.map((value, cellIndex) => <td key={`${title}-${index}-${cellIndex}`} style={cellStyle}>{value}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ReviewsSection({ reviews, totalReviews, averageRating, loading, error, renderStars }) {
  return (
    <section style={{ ...sectionCardStyle, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <h4 style={{ margin: 0, color: "#2c221e", fontSize: 18 }}>Customer Reviews</h4>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#faf7f2", border: "1px solid #e6decb", borderRadius: 10 }}>
          <strong style={{ color: "#92400e" }}>{averageRating.toFixed(1)} ★</strong>
          <span style={{ color: "#92400e", fontSize: 12 }}>({totalReviews})</span>
        </div>
      </div>
      {loading ? <div style={emptyStyle}>Loading reviews...</div> : error ? (
        <div style={{ padding: 15, borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13 }}>{error}</div>
      ) : reviews.length === 0 ? <div style={emptyStyle}>No reviews yet.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((review) => (
            <article key={review.id} style={{ padding: 16, border: "1px solid #e6decb", borderRadius: 12, background: "#faf7f2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 15, alignItems: "flex-start" }}>
                <div><strong style={{ display: "block", color: "#2c221e", fontSize: 14, marginBottom: 5 }}>{review.consumer}</strong>{renderStars(review.rating)}</div>
                <time style={{ color: "#9ca3af", fontSize: 11 }}>{review.created_at ? new Date(review.created_at).toLocaleDateString() : "-"}</time>
              </div>
              {review.comment && <p style={{ margin: "12px 0 0", padding: "11px 13px", background: "#faf7f2", borderRadius: 8, color: "#4b5563", fontSize: 13, lineHeight: 1.5 }}>“{review.comment}”</p>}
              <div style={{ marginTop: 9, color: "#9ca3af", fontSize: 10 }}>Transaction #{review.transaction_id}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================
// STYLES
// ============================================================

const summaryCardStyle = {
  backgroundColor: "#fefcf9",
  borderRadius: "14px",
  border: "1px solid #d8c8b0",
  padding: "18px",
  boxShadow: "0 3px 12px rgba(74,53,37,0.04)",
};

const summaryLabelStyle = {
  color: "#6e6056",
  fontSize: "12px",
  fontWeight: "600",
};

const summaryValueStyle = {
  marginTop: "6px",
  fontSize: "24px",
  fontWeight: "750",
  color: "#2c221e",
};

const sectionCardStyle = {
  backgroundColor: "#fefcf9",
  borderRadius: "14px",
  border: "1px solid #d8c8b0",
  padding: "20px",
  boxShadow: "0 3px 12px rgba(74,53,37,0.04)",
};

const emptyStyle = {
  padding: "30px 20px",
  backgroundColor: "#faf7f2",
  borderRadius: "9px",
  color: "#6e6056",
  textAlign: "center",
  fontSize: "13px",
};

const headerStyle = {
  textAlign: "left",
  padding: "12px",
  backgroundColor: "#efe9de",
  color: "#4a3525",
  fontSize: "12px",
  fontWeight: "700",
  borderBottom: "1px solid #d8c8b0",
  whiteSpace: "nowrap",
};

const cellStyle = {
  padding: "12px",
  color: "#2c221e",
  fontSize: "13px",
  borderBottom: "1px solid #e6decb",
  whiteSpace: "nowrap",
};
