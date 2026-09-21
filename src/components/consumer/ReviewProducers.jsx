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
      loadTransactions();
    } else {
      setLoading(false);
      setError("Unable to identify the logged-in consumer.");
    }
  }, [username]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
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
    padding: "10px 8px 90px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#EDF1F7",
    background:
      "radial-gradient(circle at 15% 0%, #16233A 0%, #0B1420 55%)",
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
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.14em",
    color: "#B98CF2",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
    fontWeight: "700",
    color: "#EDF1F7",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#7C8BA3",
    maxWidth: "650px",
  },

  summaryCard: {
    minWidth: "170px",
    padding: "16px 20px",
    borderRadius: "14px",
    background: "#131F30",
    border: "1px solid rgba(255,255,255,0.07)",
    textAlign: "center",
  },

  summaryNumber: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#5FD98A",
  },

  summaryLabel: {
    marginTop: "4px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#7C8BA3",
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
    background: "rgba(220,38,38,0.10)",
    border: "1px solid rgba(248,113,113,0.25)",
    color: "#FCA5A5",
    fontSize: "13px",
  },

  errorIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#DC2626",
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
    background: "#131F30",
    border: "1px solid rgba(255,255,255,0.07)",
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
    background: "rgba(185,140,242,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    color: "#B98CF2",
    marginBottom: "18px",
  },

  emptyTitle: {
    margin: 0,
    color: "#EDF1F7",
    fontSize: "20px",
  },

  emptyText: {
    maxWidth: "480px",
    margin: "8px 0 0",
    color: "#7C8BA3",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  // --------------------------------------------------------------
  // TRANSACTION GRID
  // --------------------------------------------------------------

  transactionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(390px, 1fr))",
    gap: "20px",
    width: "100%",
  },

  transactionCard: {
    background: "#131F30",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "22px",
    boxSizing: "border-box",
    transition: "transform 0.2s ease",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    paddingBottom: "18px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  producerLabel: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    color: "#7C8BA3",
    marginBottom: "5px",
  },

  producerName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#EDF1F7",
  },

  completedBadge: {
    padding: "6px 9px",
    borderRadius: "7px",
    background: "rgba(95,217,138,0.10)",
    color: "#5FD98A",
    fontSize: "10px",
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
    marginTop: "18px",
  },

  detailBox: {
    padding: "12px",
    borderRadius: "9px",
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.045)",
  },

  detailLabel: {
    fontSize: "9px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    color: "#7C8BA3",
    marginBottom: "5px",
  },

  detailValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#EDF1F7",
  },

  transactionId: {
    marginTop: "16px",
    fontSize: "11px",
    color: "#526176",
  },

  cardBottom: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },

  reviewButton: {
    width: "100%",
    height: "44px",
    border: "none",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #5FD98A, #2FAE63)",
    color: "#08210F",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 6px 16px rgba(95,217,138,0.15)",
  },

  reviewedBadge: {
    width: "100%",
    height: "44px",
    borderRadius: "9px",
    background: "rgba(95,217,138,0.08)",
    border: "1px solid rgba(95,217,138,0.18)",
    color: "#5FD98A",
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
    background: "#5FD98A",
    color: "#08210F",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
  },

  // --------------------------------------------------------------
  // MODAL
  // --------------------------------------------------------------

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    background: "rgba(3,8,15,0.72)",
    backdropFilter: "blur(7px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  modal: {
    width: "100%",
    maxWidth: "560px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#131F30",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "18px",
    padding: "26px",
    boxSizing: "border-box",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },

  modalEyebrow: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    color: "#B98CF2",
    marginBottom: "7px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#EDF1F7",
  },

  modalSubtitle: {
    margin: "5px 0 0",
    fontSize: "12px",
    color: "#7C8BA3",
  },

  closeButton: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#9FB0C9",
    fontSize: "23px",
    lineHeight: 1,
    cursor: "pointer",
  },

  // --------------------------------------------------------------
  // RATING
  // --------------------------------------------------------------

  ratingSection: {
    textAlign: "center",
    padding: "26px 0",
  },

  ratingTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#EDF1F7",
    marginBottom: "14px",
  },

  stars: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },

  starButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "38px",
    lineHeight: 1,
    padding: "2px",
    transition: "transform 0.12s ease",
  },

  ratingText: {
    marginTop: "10px",
    fontSize: "12px",
    color: "#7C8BA3",
  },

  // --------------------------------------------------------------
  // COMMENT
  // --------------------------------------------------------------

  commentSection: {
    position: "relative",
  },

  commentLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#EDF1F7",
    marginBottom: "8px",
  },

  optional: {
    fontSize: "10px",
    color: "#7C8BA3",
    fontWeight: "500",
  },

  textarea: {
    width: "100%",
    minHeight: "130px",
    resize: "vertical",
    boxSizing: "border-box",
    padding: "13px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0B1420",
    color: "#EDF1F7",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  characterCount: {
    textAlign: "right",
    marginTop: "5px",
    fontSize: "10px",
    color: "#526176",
  },

  modalError: {
    marginTop: "14px",
    padding: "11px 13px",
    borderRadius: "8px",
    background: "rgba(220,38,38,0.10)",
    border: "1px solid rgba(248,113,113,0.20)",
    color: "#FCA5A5",
    fontSize: "12px",
  },

  modalSuccess: {
    marginTop: "14px",
    padding: "11px 13px",
    borderRadius: "8px",
    background: "rgba(95,217,138,0.10)",
    border: "1px solid rgba(95,217,138,0.20)",
    color: "#5FD98A",
    fontSize: "12px",
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
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#9FB0C9",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },

  submitButton: {
    height: "42px",
    padding: "0 22px",
    borderRadius: "9px",
    border: "none",
    background:
      "linear-gradient(135deg, #5FD98A, #2FAE63)",
    color: "#08210F",
    fontSize: "13px",
    fontWeight: "700",
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
    background: "#131F30",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
  },

  loadingIcon: {
    fontSize: "30px",
    color: "#B98CF2",
    marginBottom: "14px",
  },

  loadingTitle: {
    margin: 0,
    fontSize: "19px",
    color: "#EDF1F7",
  },

  loadingText: {
    margin: "8px 0 0",
    fontSize: "13px",
    color: "#7C8BA3",
  },
};