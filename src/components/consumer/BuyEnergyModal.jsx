import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const API = API_BASE_URL;

// =====================================================
// TOAST NOTIFICATION COMPONENT
// =====================================================

function Toast({ message, type, onDismiss }) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3500);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const bgMap = {
        success: "linear-gradient(135deg, #10b981, #059669)",
        error: "linear-gradient(135deg, #ef4444, #dc2626)",
        info: "linear-gradient(135deg, #0284c7, #0369a1)",
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 100002,
                background: bgMap[type] || bgMap.info,
                color: "#ffffff",
                padding: "12px 20px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                maxWidth: "380px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "toastSlideIn 0.25s ease-out",
            }}
        >
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(30px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
            <span>{type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
            <span>{message}</span>
        </div>
    );
}

// =====================================================
// INLINE ERROR COMPONENT
// =====================================================

function FieldError({ message }) {
    if (!message) return null;
    return (
        <div
            style={{
                color: "#ef4444",
                fontSize: "12px",
                fontWeight: 500,
                marginTop: "3px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
            }}
        >
            <span style={{ fontSize: "13px" }}>⚠</span> {message}
        </div>
    );
}

// =====================================================
// MAIN MODAL COMPONENT
// =====================================================

export default function BuyEnergyModal({
    producer,
    onClose,
    onSuccess
}) {

    // =====================================================
    // STATE
    // =====================================================

    const [energy, setEnergy] = useState("1");
    const [consumerOffer, setConsumerOffer] = useState("");
    const [reason, setReason] = useState("");
    const [urgency, setUrgency] = useState("Normal");
    const [mode, setMode] = useState("buy");
    const [loading, setLoading] = useState(false);
    const [aiQuote, setAiQuote] = useState(null);

    // Completed success state (for in-modal feedback before auto-close)
    const [completed, setCompleted] = useState(false);
    const [completedMessage, setCompletedMessage] = useState("");

    // Inline validation errors
    const [errors, setErrors] = useState({});

    // Toast notification
    const [toast, setToast] = useState(null);

    // =====================================================
    // ESCAPE KEY HANDLER
    // =====================================================

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // =====================================================
    // HELPERS & CALCULATIONS
    // =====================================================

    const consumer = localStorage.getItem("username");

    const energyValue = Number(energy);
    const producerPrice = Number(producer?.price || 0);
    const offerValue = Number(consumerOffer);
    const total = energyValue > 0 ? energyValue * producerPrice : 0;

    const recommendedPrice =
        mode === "negotiate" &&
        Number.isFinite(offerValue) && offerValue > 0 &&
        Number.isFinite(producerPrice) && producerPrice > 0
            ? Math.min(producerPrice, Math.max(offerValue, Number(((producerPrice + offerValue) / 2).toFixed(2))))
            : 0;

    const clearError = (field) => setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
    });

    const showToast = useCallback((message, type = "info") => {
        setToast({ message, type });
    }, []);

    const dismissToast = useCallback(() => setToast(null), []);

    // =====================================================
    // VALIDATE
    // =====================================================

    const validate = (isNegotiate = false) => {
        const errs = {};

        if (!consumer) {
            errs.general = "Consumer username not found. Please log in again.";
        }

        if (!producer?.id) {
            errs.general = "Energy listing not found.";
        }

        if (reason.trim().length < 3) {
            errs.reason = "Reason is required before submitting.";
        }

        if (!Number.isFinite(energyValue) || energyValue <= 0) {
            errs.energy = "Please enter a valid energy amount.";
        } else if (energyValue > Number(producer?.energy || 0)) {
            errs.energy = `Only ${producer?.energy ?? 0} kWh is available.`;
        }

        if (isNegotiate) {
            if (!Number.isFinite(offerValue) || offerValue <= 0) {
                errs.offer = "Please enter a valid offer price.";
            } else if (offerValue > producerPrice) {
                errs.offer = `Offer must be ≤ producer price ₹${producerPrice.toFixed(2)}.`;
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // =====================================================
    // NORMAL BUY
    // =====================================================

    const sendBuyRequest = async () => {
        if (!validate(false)) return;

        try {
            setLoading(true);
            await axios.post(`${API}/trading/buy/${producer.id}`, {
                consumer,
                energy: energyValue,
                reason: reason.trim(),
                urgency,
            });

            setCompleted(true);
            setCompletedMessage(`Purchase request of ${energyValue} kWh sent to ${producer?.producer || "producer"}.`);
            showToast("Request Completed Successfully!", "success");

            if (onSuccess) await onSuccess();
            setTimeout(() => {
                onClose();
            }, 1800);
        } catch (err) {
            showToast(err.response?.data?.detail || "Unable to send buy request.", "error");
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // AI NEGOTIATION
    // =====================================================

    const sendNegotiation = async () => {
        if (!validate(true)) return;

        try {
            setLoading(true);
            const token = localStorage.getItem("energy_marketplace_jwt");
            const response = await axios.post(`${API}/trading/negotiate`, {
                listing_id: producer.id,
                consumer,
                energy: energyValue,
                consumer_offer: offerValue,
                reason: reason.trim(),
                urgency,
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            setAiQuote(response.data);
            showToast("AI price recommendation received!", "success");
        } catch (err) {
            showToast(err.response?.data?.detail || "Unable to start negotiation.", "error");
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // ACCEPT AI QUOTE
    // =====================================================

    const acceptAiQuote = async () => {
        if (!aiQuote?.id) return;

        try {
            setLoading(true);
            const token = localStorage.getItem("energy_marketplace_jwt");
            await axios.put(`${API}/trading/negotiate/${aiQuote.id}/accept`, {}, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            setCompleted(true);
            setCompletedMessage(`Negotiation request sent at ₹${Number(aiQuote.negotiated_price || 0).toFixed(2)} / kWh.`);
            showToast("Request Completed Successfully!", "success");

            if (onSuccess) await onSuccess();
            setTimeout(() => {
                onClose();
            }, 1800);
        } catch (err) {
            showToast(err.response?.data?.detail || "Unable to send the buy request.", "error");
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async () => {
        if (mode === "buy") {
            await sendBuyRequest();
        } else {
            await sendNegotiation();
        }
    };

    // =====================================================
    // DESIGN THEME TOKENS
    // =====================================================

    const t = {
        modalBg: "#ffffff",
        border: "#bae6fd",
        text: "#0f172a",
        textMuted: "#475569",
        textDim: "#64748b",
        label: "#334155",
        inputBg: "#f8fafc",
        inputBorder: "#cbd5e1",
        sectionBg: "#f0f7ff",
        green: "#10b981",
        violet: "#7c3aed",
        amber: "#d97706",
        sky: "#0284c7",
    };

    const inputStyle = {
        width: "100%",
        boxSizing: "border-box",
        padding: "8px 12px",
        background: t.inputBg,
        color: t.text,
        border: `1px solid ${t.inputBorder}`,
        borderRadius: "8px",
        outline: "none",
        fontSize: "14px",
        fontFamily: "Inter, sans-serif",
        lineHeight: 1.4,
    };

    const labelStyle = {
        display: "block",
        fontSize: "12px",
        color: t.label,
        marginBottom: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontWeight: 600,
    };

    // =====================================================
    // MODAL CONTENT
    // =====================================================

    const modalContent = (
        <>
            {/* TOAST NOTIFICATION */}
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}

            {/* BACKDROP OVERLAY - zIndex 100000 ensures it's above bottom nav bar (zIndex 1500) */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.5)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 100000,
                    padding: "16px",
                    boxSizing: "border-box",
                }}
            >
                {/* CSS MEDIA QUERY FOR MOBILE STACKING */}
                <style>{`
                    @media (max-width: 720px) {
                        .buy-energy-grid {
                            grid-template-columns: 1fr !important;
                            gap: 16px !important;
                        }
                        .buy-energy-modal-box {
                            padding: 16px 18px !important;
                        }
                    }
                `}</style>

                {/* MODAL CONTAINER - Wide Horizontal (w-[850px] / max-w-4xl) with compact vertical padding (py-4) */}
                <div
                    className="buy-energy-modal-box"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "100%",
                        maxWidth: "850px",
                        maxHeight: "92vh",
                        overflowY: "auto",
                        background: t.modalBg,
                        color: t.text,
                        border: `1px solid ${t.border}`,
                        borderRadius: "16px",
                        padding: "16px 24px",
                        boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(2, 132, 199, 0.08)",
                        fontFamily: "Inter, sans-serif",
                        boxSizing: "border-box",
                        position: "relative",
                    }}
                >
                    {/* =================================================
                        COMPLETED SUCCESS STATE VIEW
                    ================================================= */}
                    {completed ? (
                        <div
                            style={{
                                padding: "28px 16px",
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "50%",
                                    background: "rgba(16, 185, 129, 0.12)",
                                    border: "2px solid #10b981",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "26px",
                                    color: "#10b981",
                                    marginBottom: "14px",
                                }}
                            >
                                ✓
                            </div>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "22px",
                                    fontFamily: "Space Grotesk, sans-serif",
                                    color: t.text,
                                    fontWeight: 700,
                                }}
                            >
                                Request Completed Successfully!
                            </h3>
                            <p
                                style={{
                                    margin: "8px 0 16px",
                                    color: t.textMuted,
                                    fontSize: "14px",
                                    maxWidth: "460px",
                                }}
                            >
                                {completedMessage}
                            </p>
                            <button
                                onClick={onClose}
                                style={{
                                    border: "none",
                                    background: "linear-gradient(135deg, #10b981, #059669)",
                                    color: "#ffffff",
                                    padding: "8px 20px",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* =================================================
                                HEADER
                            ================================================= */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "14px",
                                    paddingBottom: "10px",
                                    borderBottom: "1px solid #e0f2fe",
                                }}
                            >
                                <div>
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontFamily: "Space Grotesk, sans-serif",
                                            fontSize: "22px",
                                            fontWeight: 700,
                                            color: t.text,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <span>⚡</span> Energy Purchase
                                    </h2>
                                    <p
                                        style={{
                                            margin: "2px 0 0",
                                            color: t.textMuted,
                                            fontSize: "13px",
                                        }}
                                    >
                                        Buy directly or negotiate with the producer.
                                    </p>
                                </div>

                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    aria-label="Close"
                                    style={{
                                        border: "none",
                                        background: "rgba(2, 132, 199, 0.08)",
                                        color: t.textDim,
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        cursor: loading ? "not-allowed" : "pointer",
                                        fontSize: "18px",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            {/* General Error Banner */}
                            {errors.general && (
                                <div
                                    style={{
                                        background: "rgba(239, 68, 68, 0.08)",
                                        border: "1px solid rgba(239, 68, 68, 0.25)",
                                        borderRadius: "8px",
                                        padding: "8px 12px",
                                        marginBottom: "12px",
                                        color: "#dc2626",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                    }}
                                >
                                    ⚠ {errors.general}
                                </div>
                            )}

                            {/* =================================================
                                TWO-COLUMN HORIZONTAL GRID SYSTEM
                            ================================================= */}
                            <div
                                className="buy-energy-grid"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "20px",
                                    alignItems: "start",
                                }}
                            >
                                {/* =============================================
                                    LEFT COLUMN: REQUEST INPUTS
                                ============================================= */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                    }}
                                >
                                    {/* 1. Reason for Energy Request */}
                                    <div>
                                        <label style={labelStyle}>
                                            Reason for Energy Request <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <textarea
                                            value={reason}
                                            disabled={loading}
                                            onChange={(e) => {
                                                setReason(e.target.value);
                                                clearError("reason");
                                            }}
                                            placeholder="e.g. home backup during an outage"
                                            maxLength="500"
                                            rows="2"
                                            style={{
                                                ...inputStyle,
                                                resize: "none",
                                                borderColor: errors.reason ? "#ef4444" : t.inputBorder,
                                            }}
                                        />
                                        <FieldError message={errors.reason} />
                                    </div>

                                    {/* 2. Request Urgency Dropdown */}
                                    <div>
                                        <label style={labelStyle}>Request Urgency</label>
                                        <select
                                            value={urgency}
                                            disabled={loading}
                                            onChange={(e) => setUrgency(e.target.value)}
                                            style={inputStyle}
                                        >
                                            <option value="Normal">Normal</option>
                                            <option value="Critical">Critical</option>
                                            <option value="Essential">Essential</option>
                                            <option value="Flexible">Flexible</option>
                                        </select>
                                    </div>

                                    {/* 3. Energy Required (kWh) Input */}
                                    <div>
                                        <label style={labelStyle}>
                                            Energy Required (kWh) <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            max={producer?.energy}
                                            value={energy}
                                            disabled={loading}
                                            onChange={(e) => {
                                                setEnergy(e.target.value);
                                                setAiQuote(null);
                                                clearError("energy");
                                            }}
                                            style={{
                                                ...inputStyle,
                                                borderColor: errors.energy ? "#ef4444" : t.inputBorder,
                                            }}
                                        />
                                        <FieldError message={errors.energy} />
                                    </div>

                                    {/* Optional Negotiate Offer Input */}
                                    {mode === "negotiate" && (
                                        <div
                                            style={{
                                                background: "rgba(124, 58, 237, 0.04)",
                                                border: "1px dashed rgba(124, 58, 237, 0.3)",
                                                borderRadius: "8px",
                                                padding: "10px",
                                            }}
                                        >
                                            <label style={{ ...labelStyle, color: t.violet }}>
                                                Your Offer (₹ / kWh) <span style={{ color: "#ef4444" }}>*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                placeholder={`e.g. ${(producerPrice * 0.9).toFixed(2)}`}
                                                value={consumerOffer}
                                                disabled={loading}
                                                onChange={(e) => {
                                                    setConsumerOffer(e.target.value);
                                                    setAiQuote(null);
                                                    clearError("offer");
                                                }}
                                                style={{
                                                    ...inputStyle,
                                                    borderColor: errors.offer ? "#ef4444" : "rgba(124, 58, 237, 0.4)",
                                                }}
                                            />
                                            <FieldError message={errors.offer} />
                                            <div style={{ marginTop: "4px", color: t.textDim, fontSize: "11px" }}>
                                                Producer asking price: ₹{producerPrice.toFixed(2)}/kWh
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* =============================================
                                    RIGHT COLUMN: PRODUCER SUMMARY & ACTIONS
                                ============================================= */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                    }}
                                >
                                    {/* 1. Producer Details Card */}
                                    <div
                                        style={{
                                            background: t.sectionBg,
                                            borderRadius: "10px",
                                            padding: "10px 14px",
                                            border: `1px solid ${t.border}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "8px 12px",
                                            }}
                                        >
                                            {[
                                                { label: "Producer", value: producer?.producer || "Unknown", color: t.text },
                                                { label: "Available", value: `${producer?.energy ?? 0} kWh`, color: t.green },
                                                { label: "Price / kWh", value: `₹${producerPrice.toFixed(2)}`, color: t.amber },
                                                { label: "Listing ID", value: `#${producer?.id}`, color: t.text },
                                            ].map((item) => (
                                                <div key={item.label}>
                                                    <div
                                                        style={{
                                                            color: t.textMuted,
                                                            fontSize: "10px",
                                                            textTransform: "uppercase",
                                                            fontWeight: 600,
                                                            letterSpacing: "0.05em",
                                                        }}
                                                    >
                                                        {item.label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontWeight: 700,
                                                            fontSize: "14px",
                                                            color: item.color,
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                        }}
                                                    >
                                                        {item.value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Mode Toggle ("Buy Directly" vs. "Negotiate") */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "8px",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => setMode("buy")}
                                            style={{
                                                padding: "8px 12px",
                                                borderRadius: "8px",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                cursor: loading ? "not-allowed" : "pointer",
                                                transition: "all 0.15s ease",
                                                border: mode === "buy" ? `1px solid ${t.green}` : "1px solid #e2e8f0",
                                                background: mode === "buy" ? "rgba(16, 185, 129, 0.1)" : "#fafbfc",
                                                color: mode === "buy" ? t.green : t.textDim,
                                            }}
                                        >
                                            🛒 Buy Directly
                                        </button>
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => setMode("negotiate")}
                                            style={{
                                                padding: "8px 12px",
                                                borderRadius: "8px",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                cursor: loading ? "not-allowed" : "pointer",
                                                transition: "all 0.15s ease",
                                                border: mode === "negotiate" ? `1px solid ${t.violet}` : "1px solid #e2e8f0",
                                                background: mode === "negotiate" ? "rgba(124, 58, 237, 0.1)" : "#fafbfc",
                                                color: mode === "negotiate" ? t.violet : t.textDim,
                                            }}
                                        >
                                            🤖 Negotiate
                                        </button>
                                    </div>

                                    {/* 3. Estimated Total Display */}
                                    <div
                                        style={{
                                            background: t.sectionBg,
                                            borderRadius: "10px",
                                            padding: "10px 14px",
                                            textAlign: "center",
                                            border: `1px solid ${t.border}`,
                                        }}
                                    >
                                        {mode === "buy" ? (
                                            <>
                                                <div
                                                    style={{
                                                        color: t.textMuted,
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.05em",
                                                        marginBottom: "2px",
                                                    }}
                                                >
                                                    Estimated Total
                                                </div>
                                                <div
                                                    style={{
                                                        color: t.green,
                                                        fontSize: "24px",
                                                        fontWeight: 700,
                                                        fontFamily: "Space Grotesk, sans-serif",
                                                        lineHeight: 1.1,
                                                    }}
                                                >
                                                    ₹{total.toFixed(2)}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div
                                                    style={{
                                                        color: t.textMuted,
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.05em",
                                                        marginBottom: "2px",
                                                    }}
                                                >
                                                    {aiQuote ? "AI Recommended Price" : "Estimated AI Price"}
                                                </div>
                                                <div
                                                    style={{
                                                        color: t.violet,
                                                        fontSize: "24px",
                                                        fontWeight: 700,
                                                        fontFamily: "Space Grotesk, sans-serif",
                                                        lineHeight: 1.1,
                                                    }}
                                                >
                                                    {aiQuote
                                                        ? `₹${Number(aiQuote.negotiated_price || 0).toFixed(2)}/kWh`
                                                        : recommendedPrice > 0
                                                        ? `₹${recommendedPrice.toFixed(2)}/kWh`
                                                        : "₹0.00"}
                                                </div>
                                                <div
                                                    style={{
                                                        color: t.textMuted,
                                                        fontSize: "11px",
                                                        marginTop: "3px",
                                                    }}
                                                >
                                                    {aiQuote
                                                        ? `Total: ₹${(Number(aiQuote.negotiated_price || 0) * energyValue).toFixed(2)}`
                                                        : "Click below to get AI quote"}
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={aiQuote ? acceptAiQuote : sendNegotiation}
                                                    style={{
                                                        width: "100%",
                                                        marginTop: "8px",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        padding: "8px 12px",
                                                        fontWeight: 700,
                                                        fontSize: "13px",
                                                        cursor: loading ? "not-allowed" : "pointer",
                                                        background: aiQuote
                                                            ? "linear-gradient(135deg, #10b981, #059669)"
                                                            : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                                                        color: "#ffffff",
                                                    }}
                                                >
                                                    {loading
                                                        ? (aiQuote ? "Confirming..." : "Getting Quote...")
                                                        : aiQuote
                                                        ? "✓ Confirm AI Offer"
                                                        : "✦ Get Final AI Price"}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* 4. Action Buttons ("Confirm Purchase" / "Cancel") */}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            marginTop: "auto",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={loading}
                                            style={{
                                                flex: 1,
                                                padding: "10px 14px",
                                                background: "#f1f5f9",
                                                color: t.textMuted,
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "8px",
                                                cursor: loading ? "not-allowed" : "pointer",
                                                fontWeight: 600,
                                                fontSize: "14px",
                                                transition: "background 0.15s ease",
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={loading || (mode === "negotiate" && aiQuote)}
                                            style={{
                                                flex: 2,
                                                padding: "10px 14px",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: (loading || (mode === "negotiate" && aiQuote))
                                                    ? "not-allowed"
                                                    : "pointer",
                                                fontWeight: 700,
                                                fontSize: "14px",
                                                background: mode === "buy"
                                                    ? "linear-gradient(135deg, #10b981, #059669)"
                                                    : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                                                color: "#ffffff",
                                                opacity: (loading || (mode === "negotiate" && aiQuote)) ? 0.6 : 1,
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            {loading
                                                ? "Sending..."
                                                : mode === "buy"
                                                ? "Confirm Purchase"
                                                : aiQuote
                                                ? "Offer Ready Above"
                                                : "Get AI Price"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );

    // Mount using React Portal to document.body to ensure it renders above all page stacking contexts
    return typeof document !== "undefined"
        ? createPortal(modalContent, document.body)
        : modalContent;
}
