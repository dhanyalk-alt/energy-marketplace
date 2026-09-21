import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

const API = API_BASE_URL;

export default function RecentSales() {
  const [sales, setSales] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(true);

  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");

  const username = localStorage.getItem("username");

  // ============================================================
  // FETCH SALES + REVIEWS
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      if (!username) {
        setError("Producer username not found.");
        setReviewError("Producer username not found.");
        setLoading(false);
        setReviewLoading(false);
        return;
      }

      // --------------------------------------------------------
      // FETCH SALES
      // --------------------------------------------------------

      try {
        setLoading(true);

        const response = await fetch(
          `${API}/trading/transactions/producer/${encodeURIComponent(
            username
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sales.");
        }

        const data = await response.json();

        setSales(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Sales fetch error:", err);
        setError("Unable to load sales.");
      } finally {
        setLoading(false);
      }

      // --------------------------------------------------------
      // FETCH REVIEWS
      // --------------------------------------------------------

      try {
        setReviewLoading(true);

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

    fetchData();
  }, [username]);

  // ============================================================
  // CALCULATIONS
  // ============================================================

  const totalEnergySold = sales.reduce(
    (total, sale) =>
      total + Number(sale.energy || 0),
    0
  );

  const totalRevenue = sales.reduce(
    (total, sale) =>
      total + Number(sale.total_amount || 0),
    0
  );

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
      }}
    >
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#2563eb",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: "6px",
          }}
        >
          Producer Dashboard
        </div>

        <h3
          style={{
            margin: 0,
            color: "#111827",
            fontSize: "28px",
            fontWeight: "750",
          }}
        >
          Recent Sales & Reviews
        </h3>

        <p
          style={{
            margin: "7px 0 0",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Track your completed energy sales and see what
          consumers think about your service.
        </p>
      </div>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        {/* Energy Sold */}

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>
            Energy Sold
          </div>

          <div style={summaryValueStyle}>
            {totalEnergySold.toFixed(2)}
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginLeft: "5px",
                color: "#6b7280",
              }}
            >
              kWh
            </span>
          </div>
        </div>

        {/* Revenue */}

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>
            Total Revenue
          </div>

          <div style={summaryValueStyle}>
            ₹{totalRevenue.toFixed(2)}
          </div>
        </div>

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

      {/* ======================================================
          COMPLETED SALES
      ====================================================== */}

      <div style={sectionCardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <h4
              style={{
                margin: 0,
                color: "#111827",
                fontSize: "18px",
              }}
            >
              Completed Sales
            </h4>

            <p
              style={{
                margin: "4px 0 0",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              Your completed energy transactions.
            </p>
          </div>

          <div
            style={{
              padding: "6px 11px",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            {sales.length} Sales
          </div>
        </div>

        {loading && (
          <div style={emptyStyle}>
            Loading sales...
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: "15px",
              borderRadius: "8px",
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          sales.length === 0 && (
            <div style={emptyStyle}>
              No completed sales yet.
            </div>
          )}

        {!loading &&
          !error &&
          sales.length > 0 && (
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "700px",
                }}
              >
                <thead>
                  <tr>
                    <th style={headerStyle}>
                      Consumer
                    </th>

                    <th style={headerStyle}>
                      Energy
                    </th>

                    <th style={headerStyle}>
                      Price/kWh
                    </th>

                    <th style={headerStyle}>
                      Total
                    </th>

                    <th style={headerStyle}>
                      Date
                    </th>

                    <th style={headerStyle}>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td style={cellStyle}>
                        {sale.consumer}
                      </td>

                      <td style={cellStyle}>
                        {Number(
                          sale.energy || 0
                        ).toFixed(2)}{" "}
                        kWh
                      </td>

                      <td style={cellStyle}>
                        ₹
                        {Number(
                          sale.price || 0
                        ).toFixed(2)}
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          fontWeight: "700",
                        }}
                      >
                        ₹
                        {Number(
                          sale.total_amount || 0
                        ).toFixed(2)}
                      </td>

                      <td style={cellStyle}>
                        {sale.created_at
                          ? new Date(
                              sale.created_at
                            ).toLocaleString()
                          : "-"}
                      </td>

                      <td style={cellStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding:
                              "5px 9px",
                            borderRadius: "7px",
                            background:
                              "#dcfce7",
                            color:
                              "#15803d",
                            fontSize:
                              "11px",
                            fontWeight:
                              "700",
                          }}
                        >
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* ======================================================
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
                color: "#111827",
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
                background: "#f8fafc",
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
                          color: "#111827",
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
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const summaryCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  padding: "18px",
  boxShadow:
    "0 3px 12px rgba(15,23,42,0.04)",
};

const summaryLabelStyle = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
};

const summaryValueStyle = {
  marginTop: "6px",
  fontSize: "24px",
  fontWeight: "750",
  color: "#111827",
};

const sectionCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  padding: "20px",
  boxShadow:
    "0 3px 12px rgba(15,23,42,0.04)",
};

const emptyStyle = {
  padding: "30px 20px",
  backgroundColor: "#f8fafc",
  borderRadius: "9px",
  color: "#6b7280",
  textAlign: "center",
  fontSize: "13px",
};

const headerStyle = {
  textAlign: "left",
  padding: "12px",
  backgroundColor: "#f3f4f6",
  color: "#374151",
  fontSize: "12px",
  fontWeight: "700",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const cellStyle = {
  padding: "12px",
  color: "#374151",
  fontSize: "13px",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};