import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import BuyEnergyModal from "./BuyEnergyModal";

const API = API_BASE_URL;

// ------------------------------------------------------------
// DESIGN TOKENS
// ------------------------------------------------------------

const colors = {
  bg: "#f0f7ff",
  surface: "rgba(255, 255, 255, 0.88)",
  border: "#bae6fd",
  text: "#0f172a",
  textMuted: "#475569",
  green: "#10b981",
  violet: "#7c3aed",
  yellow: "#FBBF24",
};

// ------------------------------------------------------------
// STYLES
// ------------------------------------------------------------

const styleSheet = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.mk-table th {
  background: #e0f2fe !important;
  color: #0284c7 !important;
  font-weight: 700 !important;
  font-size: 13px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  text-align: center !important;
  border: none !important;
  border-bottom: 2px solid #0284c7 !important;
  padding: 14px 12px !important;
}

.mk-table th:first-child {
  border-top-left-radius: 8px;
}

.mk-table th:last-child {
  border-top-right-radius: 8px;
}

.mk-table td {
  text-align: center;
  padding: 14px 12px;
  color: #0f172a;
  font-size: 16px;
  border-bottom: 1px solid #e0f2fe;
}

.mk-table tbody tr:hover {
  background: rgba(2, 132, 199, 0.04);
}

.mk-buy-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 14px;
  transition: transform 0.12s, box-shadow 0.12s;
}

.mk-buy-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.28);
}

.mk-review-btn {
  background: rgba(124, 58, 237, 0.08);
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.25);
  padding: 9px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.15s ease;
}

.mk-review-btn:hover {
  background: rgba(124, 58, 237, 0.14);
  transform: translateY(-1px);
}
`;

// ------------------------------------------------------------
// STAR COMPONENT
// ------------------------------------------------------------

function Stars({ rating = 0 }) {
  const roundedRating = Math.round(Number(rating));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize: "15px",
            color:
              star <= roundedRating
                ? colors.yellow
                : "#475569",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------

export default function ProducerMarketplace() {
  const [producers, setProducers] = useState([]);

  const [selectedProducer, setSelectedProducer] =
    useState(null);

  const [selectedReviews, setSelectedReviews] =
    useState(null);

  const [reviewsLoading, setReviewsLoading] =
    useState(false);

  const [reviewsError, setReviewsError] =
    useState("");

  // ----------------------------------------------------------
  // LOAD MARKETPLACE
  // ----------------------------------------------------------

  useEffect(() => {
    loadMarketplace();

    // 10s silent background polling
    const pollTimer = window.setInterval(loadMarketplace, 10000);
    const refresh = () => loadMarketplace();
    window.addEventListener("energy-trade-updated", refresh);
    return () => {
      window.clearInterval(pollTimer);
      window.removeEventListener("energy-trade-updated", refresh);
    };
  }, []);

  const loadMarketplace = async () => {
    try {
      const response = await axios.get(
        `${API}/trading/all`
      );

      // Client-side defensive deduplication:
      // keep only latest entry (highest id) per producer and purge energy <= 0
      const raw = Array.isArray(response.data)
        ? response.data
        : [];

      // Producer accounts keep the same username when they switch modes.
      // Hide every listing from that account in its consumer marketplace view.
      const username = localStorage.getItem("username")?.trim().toLowerCase();
      const isProsumer = localStorage.getItem("user_role")?.toLowerCase() === "producer";
      const visibleListings = isProsumer
        ? raw.filter((item) => item.producer?.trim().toLowerCase() !== username)
        : raw;

      const balanceResponse = await axios.get(`${API}/trading/balances`);
      const balances = balanceResponse.data || {};

      const seen = new Map();
      for (const item of visibleListings) {
        if (Number(item.energy) <= 0) continue;
        const producerKey = item.producer?.trim().toLowerCase();
        const existing = seen.get(producerKey);
        if (!existing || item.id > existing.id) {
          seen.set(producerKey, {
            ...item,
            availableEnergy: Number(balances[producerKey] ?? item.energy),
          });
        }
      }

      setProducers(Array.from(seen.values()));
    } catch (err) {
      console.error(
        "Marketplace loading error:",
        err
      );
    }
  };

  // ----------------------------------------------------------
  // LOAD PRODUCER REVIEWS
  // ----------------------------------------------------------

  const viewReviews = async (producer) => {
    setReviewsLoading(true);
    setReviewsError("");

    try {
      const response = await axios.get(
        `${API}/trading/reviews/${encodeURIComponent(
          producer
        )}`
      );

      setSelectedReviews({
        producer,
        averageRating:
          Number(response.data.average_rating || 0),
        totalReviews:
          Number(response.data.total_reviews || 0),
        reviews:
          Array.isArray(response.data.reviews)
            ? response.data.reviews
            : [],
      });
    } catch (err) {
      console.error(
        "Review loading error:",
        err
      );

      setReviewsError(
        "Unable to load reviews."
      );

      setSelectedReviews({
        producer,
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  // ----------------------------------------------------------
  // CLOSE REVIEW MODAL
  // ----------------------------------------------------------

  const closeReviews = () => {
    setSelectedReviews(null);
    setReviewsError("");
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          `linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 55%, #f8fafc 100%)`,
        padding: "32px 28px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{styleSheet}</style>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        style={{
          marginBottom: 28,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: colors.violet,
            fontSize: 14,
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
            fontFamily:
              "Space Grotesk, sans-serif",
            fontSize: 36,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
          }}
        >
          Producer Marketplace
        </h1>

        <p
          style={{
            color: colors.textMuted,
            marginTop: 6,
            fontSize: 16,
          }}
        >
          Compare producers, ratings and reviews
          before buying energy.
        </p>
      </div>

      {/* ====================================================
          MARKETPLACE TABLE
      ==================================================== */}

      <div
        style={{
          background: colors.surface,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border:
            `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: "24px 26px",
          boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 4px 6px -4px rgba(2, 132, 199, 0.04)",
        }}
      >
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            className="mk-table"
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

                <th>
                  Available Energy
                </th>

                <th>
                  Price / kWh
                </th>

                <th>
                  Rating
                </th>

                <th>
                  Reviews
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {producers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding:
                        "36px 10px",
                      color:
                        colors.textMuted,
                    }}
                  >
                    No listings available
                    right now — check back
                    soon.
                  </td>
                </tr>
              ) : (
                producers.map((item) => (
                  <ProducerRow
                    key={item.id}
                    item={item}
                    onBuy={() =>
                      setSelectedProducer(
                        item
                      )
                    }
                    onViewReviews={
                      viewReviews
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================
          BUY ENERGY MODAL
      ==================================================== */}

      {selectedProducer && (
        <BuyEnergyModal
          producer={selectedProducer}
          onClose={() =>
            setSelectedProducer(null)
          }
          onSuccess={() => {
            setSelectedProducer(null);
            loadMarketplace();
          }}
        />
      )}

      {/* ====================================================
          REVIEWS MODAL
      ==================================================== */}

      {selectedReviews && (
        <div
          onClick={closeReviews}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 20, 60, 0.45)",
            backdropFilter:
              "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              background:
                "#ffffff",
              border:
                "1px solid #bae6fd",
              borderRadius: "18px",
              padding: "28px",
              boxShadow:
                "0 25px 70px rgba(2, 132, 199, 0.15)",
            }}
          >
            {/* Modal Header */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color:
                      colors.violet,
                    fontWeight: "700",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.1em",
                    marginBottom:
                      "5px",
                  }}
                >
                  Producer Reviews
                </div>

                <h2
                  style={{
                    margin: 0,
                    color:
                      colors.text,
                    fontFamily:
                      "Space Grotesk, sans-serif",
                    fontSize:
                      "24px",
                  }}
                >
                  {selectedReviews.producer}
                </h2>
              </div>

              <button
                onClick={closeReviews}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius:
                    "50%",
                  border:
                    "none",
                  background:
                    "rgba(2, 132, 199, 0.08)",
                  color:
                    colors.textMuted,
                  cursor:
                    "pointer",
                  fontSize:
                    "20px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Rating Summary */}

            <div
              style={{
                background:
                  "rgba(251,191,36,0.08)",
                border:
                  "1px solid rgba(251,191,36,0.18)",
                borderRadius:
                  "12px",
                padding:
                  "16px",
                display: "flex",
                alignItems:
                  "center",
                gap: "18px",
                marginBottom:
                  "20px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "32px",
                  fontWeight:
                    "700",
                  color:
                    colors.text,
                }}
              >
                {selectedReviews.averageRating.toFixed(
                  1
                )}
              </div>

              <div>
                <Stars
                  rating={
                    selectedReviews.averageRating
                  }

                />

                <div
                  style={{
                    marginTop:
                      "5px",
                    color:
                      colors.textMuted,
                    fontSize:
                      "12px",
                  }}
                >
                  {
                    selectedReviews.totalReviews
                  }{" "}
                  review
                  {selectedReviews.totalReviews !==
                  1
                    ? "s"
                    : ""}
                </div>
              </div>
            </div>

            {/* Loading */}

            {reviewsLoading && (
              <div
                style={{
                  textAlign:
                    "center",
                  padding:
                    "30px",
                  color:
                    colors.textMuted,
                }}
              >
                Loading reviews...
              </div>
            )}

            {/* Error */}

            {!reviewsLoading &&
              reviewsError && (
                <div
                  style={{
                    padding:
                      "14px",
                    background:
                      "rgba(239,68,68,0.1)",
                    color:
                      "#F87171",
                    borderRadius:
                      "8px",
                    fontSize:
                      "13px",
                  }}
                >
                  {reviewsError}
                </div>
              )}

            {/* No Reviews */}

            {!reviewsLoading &&
              !reviewsError &&
              selectedReviews
                .reviews
                .length === 0 && (
                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "35px 20px",
                    color:
                      colors.textMuted,
                    background:
                      "#f0f7ff",
                    borderRadius:
                      "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "30px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    ⭐
                  </div>

                  <div
                    style={{
                      color:
                        colors.text,
                      fontWeight:
                        "600",
                    }}
                  >
                    No reviews yet
                  </div>

                  <div
                    style={{
                      marginTop:
                        "5px",
                      fontSize:
                        "12px",
                    }}
                  >
                    Be one of the first
                    consumers to review
                    this producer.
                  </div>
                </div>
              )}

            {/* Review List */}

            {!reviewsLoading &&
              !reviewsError &&
              selectedReviews
                .reviews
                .length > 0 && (
                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: "12px",
                  }}
                >
                  {selectedReviews.reviews.map(
                    (review) => (
                      <div
                        key={review.id}
                        style={{
                          background:
                            "#f8fafc",
                          border:
                            "1px solid #e0f2fe",
                          borderRadius:
                            "11px",
                          padding:
                            "15px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color:
                                  colors.text,
                                fontWeight:
                                  "700",
                                fontSize:
                                  "14px",
                                marginBottom:
                                  "5px",
                              }}
                            >
                              {review.consumer}
                            </div>

                            <Stars
                              rating={
                                review.rating
                              }
                            />
                          </div>

                          <div
                            style={{
                              color:
                                colors.textMuted,
                              fontSize:
                                "11px",
                            }}
                          >
                            {review.created_at
                              ? new Date(
                                  review.created_at
                                ).toLocaleDateString()
                              : ""}
                          </div>
                        </div>

                        {review.comment && (
                          <div
                            style={{
                              marginTop:
                                "12px",
                              color:
                                "#334155",
                              fontSize:
                                "13px",
                              lineHeight:
                                "1.6",
                            }}
                          >
                            "{review.comment}"
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

            {/* Close */}

            <button
              onClick={closeReviews}
              style={{
                width: "100%",
                marginTop:
                  "20px",
                padding:
                  "12px",
                border:
                  "1px solid #e2e8f0",
                borderRadius:
                  "10px",
                background:
                  "#f1f5f9",
                color:
                  colors.textMuted,
                cursor:
                  "pointer",
                fontWeight:
                  "600",
                fontSize:
                  "15px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PRODUCER ROW
// ============================================================

function ProducerRow({
  item,
  onBuy,
  onViewReviews,
}) {
  const [ratingData, setRatingData] =
    useState({
      averageRating: 0,
      totalReviews: 0,
      loaded: false,
    });

  useEffect(() => {
    const loadRating = async () => {
      try {
        const response =
          await axios.get(
            `${API}/trading/reviews/${encodeURIComponent(
              item.producer
            )}`
          );

        setRatingData({
          averageRating:
            Number(
              response.data
                .average_rating || 0
            ),
          totalReviews:
            Number(
              response.data
                .total_reviews || 0
            ),
          loaded: true,
        });
      } catch (err) {
        console.error(
          `Rating error for ${item.producer}:`,
          err
        );

        setRatingData({
          averageRating: 0,
          totalReviews: 0,
          loaded: true,
        });
      }
    };

    loadRating();
  }, [item.producer]);

  return (
    <tr>
      {/* Producer */}

      <td>
        <div
          style={{
            fontWeight: "600",
          }}
        >
          {item.producer}
        </div>
      </td>

      {/* Energy */}

      <td>
        {Number(item.availableEnergy ?? item.energy).toFixed(2)} kWh
      </td>

      {/* Price */}

      <td>
        ₹{item.price}
      </td>

      {/* Rating */}

      <td>
        {!ratingData.loaded ? (
          <span
            style={{
              color:
                colors.textMuted,
              fontSize:
                "12px",
            }}
          >
            Loading...
          </span>
        ) : ratingData.totalReviews ===
          0 ? (
          <span
            style={{
              color:
                colors.textMuted,
              fontSize:
                "12px",
            }}
          >
            No ratings
          </span>
        ) : (
          <div>
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "center",
                alignItems:
                  "center",
                gap: "5px",
              }}
            >
              <span
                style={{
                  color:
                    colors.yellow,
                  fontWeight:
                    "700",
                }}
              >
                ★
              </span>

              <span
                style={{
                  fontWeight:
                    "700",
                }}
              >
                {ratingData.averageRating.toFixed(
                  1
                )}
              </span>
            </div>

            <div
              style={{
                color:
                  colors.textMuted,
                fontSize:
                  "12px",
                marginTop:
                  "2px",
              }}
            >
              {ratingData.totalReviews} review
              {ratingData.totalReviews !==
              1
                ? "s"
                : ""}
            </div>
          </div>
        )}
      </td>

      {/* Reviews */}

      <td>
        <button
          className="mk-review-btn"
          onClick={() =>
            onViewReviews(
              item.producer
            )
          }
        >
          💬 View Reviews
        </button>
      </td>

      {/* Buy */}

      <td>
        <button
          className="mk-buy-btn"
          onClick={onBuy}
        >
          Buy Energy
        </button>
      </td>
    </tr>
  );
}
