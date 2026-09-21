import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import BuyEnergyModal from "./BuyEnergyModal";

const API = API_BASE_URL;

// ------------------------------------------------------------
// DESIGN TOKENS
// ------------------------------------------------------------

const colors = {
  bg: "#0B1420",
  surface: "#131F30",
  border: "rgba(255,255,255,0.07)",
  text: "#EDF1F7",
  textMuted: "#7C8BA3",
  green: "#5FD98A",
  violet: "#B98CF2",
  yellow: "#FBBF24",
};

// ------------------------------------------------------------
// STYLES
// ------------------------------------------------------------

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

.mk-table th:first-child {
  border-top-left-radius: 8px;
}

.mk-table th:last-child {
  border-top-right-radius: 8px;
}

.mk-table td {
  text-align: center;
  padding: 12px 10px;
  color: #EDF1F7;
  font-size: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.mk-table tbody tr:hover {
  background: rgba(255,255,255,0.025);
}

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

.mk-buy-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(95,217,138,0.28);
}

.mk-review-btn {
  background: rgba(185,140,242,0.12);
  color: #B98CF2;
  border: 1px solid rgba(185,140,242,0.3);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.15s ease;
}

.mk-review-btn:hover {
  background: rgba(185,140,242,0.2);
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
          â˜…
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
  }, []);

  const loadMarketplace = async () => {
    try {
      const response = await axios.get(
        `${API}/trading/all`
      );

      setProducers(response.data);
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
          `radial-gradient(circle at 15% 0%, #16233A 0%, ${colors.bg} 55%)`,
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
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Consumer Â· Market
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
          Producer Marketplace
        </h1>

        <p
          style={{
            color: colors.textMuted,
            marginTop: 6,
            fontSize: 14,
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
          border:
            `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "22px 24px",
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
                    right now â€” check back
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
              "rgba(2,6,23,0.75)",
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
                "#131F30",
              border:
                "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow:
                "0 25px 70px rgba(0,0,0,0.45)",
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
                  width: "34px",
                  height: "34px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid rgba(255,255,255,0.1)",
                  background:
                    "rgba(255,255,255,0.04)",
                  color:
                    colors.text,
                  cursor:
                    "pointer",
                  fontSize:
                    "18px",
                }}
              >
                Ã—
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
                      "rgba(255,255,255,0.025)",
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
                    â­
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
                            "rgba(255,255,255,0.035)",
                          border:
                            "1px solid rgba(255,255,255,0.07)",
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
                                "#CBD5E1",
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
                  "11px",
                border:
                  "1px solid rgba(255,255,255,0.1)",
                borderRadius:
                  "8px",
                background:
                  "rgba(255,255,255,0.05)",
                color:
                  colors.text,
                cursor:
                  "pointer",
                fontWeight:
                  "600",
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
        {item.energy} kWh
      </td>

      {/* Price */}

      <td>
        â‚¹{item.price}
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
                â˜…
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
                  "10px",
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
          ðŸ’¬ View Reviews
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
