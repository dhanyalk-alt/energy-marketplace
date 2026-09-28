import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

export default function ReviewProducers() {
  const username = localStorage.getItem("username");

  const [transactions, setTransactions] = useState([]);
  const [reviewedTransactions, setReviewedTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD CONSUMER TRANSACTIONS
  // ============================================================

  useEffect(() => {
    if (username) {
      loadTransactions(false);

      // 10s silent background polling
      const pollTimer = window.setInterval(() => loadTransactions(true), 10000);
      return () => window.clearInterval(pollTimer);
    } else {
      setLoading(false);
      setError("Unable to identify the logged-in consumer.");
    }
  }, [username]);

  const loadTransactions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/trading/transactions/consumer/${encodeURIComponent(
          username
        )}`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      // Only completed transactions can be reviewed
      const completedTransactions = data.filter(
        (transaction) =>
          transaction.status?.toLowerCase() === "completed"
      );

      setTransactions(completedTransactions);

      // ----------------------------------------------------------
      // Check which transactions already have reviews
      // ----------------------------------------------------------

      const producerNames = [
        ...new Set(
          completedTransactions
            .map((transaction) => transaction.producer)
            .filter(Boolean)
        ),
      ];

      const reviewRequests = producerNames.map((producer) =>
        axios
          .get(
            `${API_BASE_URL}/trading/reviews/${encodeURIComponent(
              producer
            )}`
          )
          .then((response) => response.data)
          .catch(() => null)
      );

      const reviewResponses = await Promise.all(reviewRequests);

      const reviewedIds = [];

      reviewResponses.forEach((data) => {
        if (!data || !Array.isArray(data.reviews)) {
          return;
        }

        data.reviews.forEach((review) => {
          if (
            review.consumer === username &&
            review.transaction_id
          ) {
            reviewedIds.push(review.transaction_id);
          }
        });
      });

      setReviewedTransactions(reviewedIds);
    } catch (err) {
      console.error("Transaction loading error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OPEN REVIEW FORM
  // ============================================================

  const openReview = (transaction) => {
    setSelectedTransaction(transaction);

    setRating(0);
    setHoverRating(0);
    setComment("");

    setError("");
    setSuccess("");
  };

  // ============================================================
  // CLOSE REVIEW FORM
  // ============================================================

  const closeReview = () => {
    if (submitting) {
      return;
    }

    setSelectedTransaction(null);
    setRating(0);
    setHoverRating(0);
    setComment("");
    setError("");
  };

  // ============================================================
  // SUBMIT REVIEW
  // ============================================================

  const submitReview = async () => {
    if (!selectedTransaction) {
      return;
    }

    if (!rating) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Rating must be between 1 and 5.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await axios.post(
        `${API_BASE_URL}/trading/review`,
        {
          transaction_id: selectedTransaction.id,
          rating: rating,
          comment: comment.trim() || null,
        },
        {
          params: {
            consumer: username,
          },
        }
      );

      // Add transaction to reviewed list immediately
      setReviewedTransactions((previous) => [
        ...previous,
        selectedTransaction.id,
      ]);

      setSuccess("Your review has been submitted successfully.");

      // Close form after a short delay
      setTimeout(() => {
        setSelectedTransaction(null);
        setRating(0);
        setHoverRating(0);
        setComment("");
        setSuccess("");
      }, 1200);
    } catch (err) {
      console.error("Review submission error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to submit your review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // CHECK REVIEWED
  // ============================================================

  const hasReviewed = (transactionId) => {
    return reviewedTransactions.includes(transactionId);
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "Date unavailable";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>★</div>

          <h2 style={styles.loadingTitle}>
            Loading your purchases...
          </h2>

          <p style={styles.loadingText}>
            Please wait while we load your completed transactions.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div style={styles.page}>
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            CONSUMER · REVIEWS
          </div>

          <h1 style={styles.title}>
            Review Producers
          </h1>

          <p style={styles.subtitle}>
            Share your experience with producers you've purchased
            energy from.
          </p>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryNumber}>
            {transactions.length}
          </div>

          <div style={styles.summaryLabel}>
            Completed Purchases
          </div>
        </div>
      </div>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && !selectedTransaction && (
        <div style={styles.errorBanner}>
          <span style={styles.errorIcon}>!</span>
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          NO TRANSACTIONS
      ======================================================== */}

      {transactions.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>★</div>

          <h2 style={styles.emptyTitle}>
            No completed purchases yet
          </h2>

          <p style={styles.emptyText}>
            Once you complete an energy purchase, you can come
            here and review the producer.
          </p>
        </div>
      ) : (
        /* ======================================================
           TRANSACTION CARDS
        ====================================================== */

        <div style={styles.transactionGrid}>
          {transactions.map((transaction) => {
            const reviewed = hasReviewed(transaction.id);

            return (
              <div
                key={transaction.id}
                style={styles.transactionCard}
              >
                {/* CARD HEADER */}

                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.producerLabel}>
                      PRODUCER
                    </div>

                    <div style={styles.producerName}>
                      {transaction.producer}
                    </div>
                  </div>

                  <div style={styles.completedBadge}>
                    ● Completed
                  </div>
                </div>

                {/* DETAILS */}

                <div style={styles.detailsGrid}>
                  <div style={styles.detailBox}>
                    <div style={styles.detailLabel}>
                      ENERGY
                    </div>

                    <div style={styles.detailValue}>
                      {transaction.energy} kWh
                    </div>
                  </div>

                  <div style={styles.detailBox}>
                    <div style={styles.detailLabel}>
                      PRICE / kWh
                    </div>

                    <div style={styles.detailValue}>
                      ₹{transaction.price}
                    </div>
                  </div>

                  <div style={styles.detailBox}>
                    <div style={styles.detailLabel}>
                      TOTAL
                    </div>

                    <div style={styles.detailValue}>
                      ₹{transaction.total_amount}
                    </div>
                  </div>

                  <div style={styles.detailBox}>
                    <div style={styles.detailLabel}>
                      PURCHASED
                    </div>

                    <div style={styles.detailValue}>
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                </div>

                {/* TRANSACTION ID */}

                <div style={styles.transactionId}>
                  Transaction #{transaction.id}
                </div>

                {/* ACTION */}

                <div style={styles.cardBottom}>
                  {reviewed ? (
                    <div style={styles.reviewedBadge}>
                      <span style={styles.checkMark}>✓</span>
                      Review Submitted
                    </div>
                  ) : (
                    <button
                      onClick={() => openReview(transaction)}
                      style={styles.reviewButton}
                    >
                      <span>★</span>
                      Review Producer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          REVIEW MODAL
      ======================================================== */}

      {selectedTransaction && (
        <div
          style={styles.modalOverlay}
          onClick={closeReview}
        >
          <div
            style={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalEyebrow}>
                  YOUR EXPERIENCE
                </div>

                <h2 style={styles.modalTitle}>
                  Review {selectedTransaction.producer}
                </h2>

                <p style={styles.modalSubtitle}>
                  Transaction #{selectedTransaction.id}
                </p>
              </div>

              <button
                onClick={closeReview}
                disabled={submitting}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            {/* RATING */}

            <div style={styles.ratingSection}>
              <div style={styles.ratingTitle}>
                How was your experience?
              </div>

              <div style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const active =
                    star <= (hoverRating || rating);

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() =>
                        setHoverRating(star)
                      }
                      onMouseLeave={() =>
                        setHoverRating(0)
                      }
                      style={{
                        ...styles.starButton,
                        color: active
                          ? "#F6C453"
                          : "#526176",
                      }}
                    >
                      ★
                    </button>
                  );
                })}
              </div>

              <div style={styles.ratingText}>
                {rating === 0
                  ? "Select a rating"
                  : `${rating} out of 5`}
              </div>
            </div>

            {/* COMMENT */}

            <div style={styles.commentSection}>
              <label style={styles.commentLabel}>
                Comment
                <span style={styles.optional}>
                  Optional
                </span>
              </label>

              <textarea
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                placeholder="Tell us about your experience with this producer..."
                maxLength={500}
                disabled={submitting}
                style={styles.textarea}
              />

              <div style={styles.characterCount}>
                {comment.length}/500
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div style={styles.modalError}>
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div style={styles.modalSuccess}>
                ✓ {success}
              </div>
            )}

            {/* ACTIONS */}

            <div style={styles.modalActions}>
              <button
                onClick={closeReview}
                disabled={submitting}
                style={styles.cancelButton}
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                disabled={submitting || rating === 0}
                style={{
                  ...styles.submitButton,
                  opacity:
                    submitting || rating === 0 ? 0.55 : 1,
                  cursor:
                    submitting || rating === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = {
  page: {
    width: "100%",
    minHeight: "100%",
    boxSizing: "border-box",
    padding: "30px 28px 60px",
    borderRadius: "20px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#0f172a",
    background:
      "linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 55%, #f8fafc 100%)",
  },

  // --------------------------------------------------------------
  // HEADER
  // --------------------------------------------------------------

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.14em",
    color: "#0284c7",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: "Space Grotesk, sans-serif",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#475569",
    maxWidth: "650px",
  },

  summaryCard: {
    minWidth: "170px",
    padding: "16px 20px",
    borderRadius: "14px",
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid #bae6fd",
    boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.08)",
    textAlign: "center",
  },

  summaryNumber: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#10b981",
    fontFamily: "Space Grotesk, sans-serif",
  },

  summaryLabel: {
    marginTop: "4px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  // --------------------------------------------------------------
  // ERROR
  // --------------------------------------------------------------

  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "13px 16px",
    marginBottom: "20px",
    borderRadius: "10px",
    background: "rgba(220,38,38,0.08)",
    border: "1px solid rgba(248,113,113,0.3)",
    color: "#dc2626",
    fontSize: "13px",
  },

  errorIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#dc2626",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
  },

  // --------------------------------------------------------------
  // EMPTY
  // --------------------------------------------------------------

  emptyCard: {
    minHeight: "320px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid #bae6fd",
    boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px",
  },

  emptyIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    background: "rgba(2, 132, 199, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    color: "#0284c7",
    marginBottom: "18px",
  },

  emptyTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: "700",
    fontFamily: "Space Grotesk, sans-serif",
  },

  emptyText: {
    maxWidth: "480px",
    margin: "8px 0 0",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  // --------------------------------------------------------------
  // TRANSACTION GRID
  // --------------------------------------------------------------

  transactionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "20px",
    width: "100%",
  },

  transactionCard: {
    background: "rgba(255, 255, 255, 0.92)",
    border: "1px solid #bae6fd",
    borderRadius: "16px",
    padding: "22px",
    boxSizing: "border-box",
    boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e0f2fe",
  },

  producerLabel: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    color: "#64748b",
    marginBottom: "4px",
  },

  producerName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "Space Grotesk, sans-serif",
  },

  completedBadge: {
    padding: "6px 10px",
    borderRadius: "20px",
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    color: "#10b981",
    fontSize: "11px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  // --------------------------------------------------------------
  // DETAILS
  // --------------------------------------------------------------

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "16px",
  },

  detailBox: {
    padding: "12px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e0f2fe",
  },

  detailLabel: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: "4px",
    textTransform: "uppercase",
  },

  detailValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },

  transactionId: {
    marginTop: "14px",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },

  cardBottom: {
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #e0f2fe",
  },

  reviewButton: {
    width: "100%",
    height: "44px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 6px 16px rgba(16, 185, 129, 0.2)",
    transition: "transform 0.15s ease",
  },

  reviewedBadge: {
    width: "100%",
    height: "44px",
    borderRadius: "10px",
    background: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    color: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "700",
    boxSizing: "border-box",
  },

  checkMark: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#10b981",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
  },

  // --------------------------------------------------------------
  // MODAL
  // --------------------------------------------------------------

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100000,
    background: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  modal: {
    width: "100%",
    maxWidth: "540px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    border: "1px solid #bae6fd",
    borderRadius: "18px",
    padding: "26px",
    boxSizing: "border-box",
    boxShadow: "0 25px 70px rgba(15, 23, 42, 0.18)",
    color: "#0f172a",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e0f2fe",
  },

  modalEyebrow: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    color: "#0284c7",
    marginBottom: "5px",
    textTransform: "uppercase",
  },

  modalTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "Space Grotesk, sans-serif",
  },

  modalSubtitle: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#475569",
  },

  closeButton: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    borderRadius: "50%",
    border: "none",
    background: "rgba(2, 132, 199, 0.08)",
    color: "#64748b",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // --------------------------------------------------------------
  // RATING
  // --------------------------------------------------------------

  ratingSection: {
    textAlign: "center",
    padding: "22px 0 16px",
  },

  ratingTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "12px",
  },

  stars: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },

  starButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "36px",
    lineHeight: 1,
    padding: "2px",
    transition: "transform 0.12s ease",
  },

  ratingText: {
    marginTop: "10px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },

  // --------------------------------------------------------------
  // COMMENT
  // --------------------------------------------------------------

  commentSection: {
    position: "relative",
    marginTop: "10px",
  },

  commentLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  optional: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "500",
    textTransform: "none",
  },

  textarea: {
    width: "100%",
    minHeight: "110px",
    resize: "vertical",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  characterCount: {
    textAlign: "right",
    marginTop: "5px",
    fontSize: "11px",
    color: "#64748b",
  },

  modalError: {
    marginTop: "14px",
    padding: "11px 14px",
    borderRadius: "8px",
    background: "rgba(220,38,38,0.08)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#dc2626",
    fontSize: "13px",
    fontWeight: "500",
  },

  modalSuccess: {
    marginTop: "14px",
    padding: "11px 14px",
    borderRadius: "8px",
    background: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    color: "#10b981",
    fontSize: "13px",
    fontWeight: "600",
  },

  // --------------------------------------------------------------
  // MODAL ACTIONS
  // --------------------------------------------------------------

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "22px",
  },

  cancelButton: {
    height: "42px",
    padding: "0 18px",
    borderRadius: "9px",
    border: "1px solid #e2e8f0",
    background: "#f1f5f9",
    color: "#475569",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },

  submitButton: {
    height: "42px",
    padding: "0 22px",
    borderRadius: "9px",
    border: "none",
    background:
      "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
  },

  // --------------------------------------------------------------
  // LOADING
  // --------------------------------------------------------------

  loadingCard: {
    minHeight: "350px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid #bae6fd",
    borderRadius: "16px",
  },

  loadingIcon: {
    fontSize: "30px",
    color: "#0284c7",
    marginBottom: "14px",
  },

  loadingTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "Space Grotesk, sans-serif",
  },

  loadingText: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#475569",
  },
};