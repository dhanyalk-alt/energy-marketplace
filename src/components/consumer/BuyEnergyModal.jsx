import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const API = API_BASE_URL;

export default function BuyEnergyModal({
    producer,
    onClose,
    onSuccess
}) {

    // =====================================================
    // STATE
    // =====================================================

    const [energy, setEnergy] = useState("1");

    const [consumerOffer, setConsumerOffer] =
        useState("");

    const [reason, setReason] =
        useState("");

    const [urgency, setUrgency] =
        useState("Normal");

    const [mode, setMode] =
        useState("buy");

    const [loading, setLoading] =
        useState(false);

    const [aiQuote, setAiQuote] =
        useState(null);

    // =====================================================
    // CURRENT USER
    // =====================================================

    const consumer =
        localStorage.getItem("username");

    // =====================================================
    // VALUES
    // =====================================================

    const energyValue =
        Number(energy);

    const producerPrice =
        Number(producer?.price || 0);

    const offerValue =
        Number(consumerOffer);

    const total =
        energyValue > 0
            ? energyValue * producerPrice
            : 0;

    const recommendedPrice =
        mode === "negotiate" &&
        Number.isFinite(offerValue) &&
        offerValue > 0 &&
        Number.isFinite(producerPrice) &&
        producerPrice > 0
            ? Math.min(
                producerPrice,
                Math.max(
                    offerValue,
                    Number(((producerPrice + offerValue) / 2).toFixed(2))
                )
              )
            : 0;

    // =====================================================
    // VALIDATE ENERGY
    // =====================================================

    const validateEnergy = () => {

        if (!consumer) {
            alert(
                "Consumer username not found."
            );

            return false;
        }

        if (!producer?.id) {
            alert(
                "Energy listing not found."
            );

            return false;
        }

        if (
            !Number.isFinite(energyValue) ||
            energyValue <= 0
        ) {
            alert(
                "Please enter a valid amount of energy."
            );

            return false;
        }

        if (
            energyValue >
            Number(producer.energy)
        ) {
            alert(
                `Only ${producer.energy} kWh is available.`
            );

            return false;
        }

        if (reason.trim().length < 3) {
            alert("Please briefly explain why you need this energy.");
            return false;
        }

        return true;
    };

    // =====================================================
    // NORMAL BUY
    // =====================================================

    const sendBuyRequest = async () => {

        if (!validateEnergy()) {
            return;
        }

        try {

            setLoading(true);

            const response =
                await axios.post(

                    `${API}/trading/buy/${producer.id}`,

                    {
                        consumer:
                            consumer,

                        energy:
                            energyValue,

                        reason: reason.trim(),

                        urgency: urgency,
                    }
                );

            console.log(
                "Buy request created:",
                response.data
            );

            alert(
                "Buy Request Sent Successfully!"
            );

            if (onSuccess) {
                await onSuccess();
            }

            onClose();

        } catch (err) {

            console.error(
                "Failed to send buy request:",
                err
            );

            alert(
                err.response?.data?.detail ||
                "Unable to send buy request."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // AI NEGOTIATION
    // =====================================================

    const sendNegotiation = async () => {

        if (!validateEnergy()) {
            return;
        }

        if (
            !Number.isFinite(offerValue) ||
            offerValue <= 0
        ) {
            alert(
                "Please enter a valid offer price."
            );

            return;
        }

        if (energyValue > Number(producer.energy)) {
            alert(
                `Requested energy exceeds available energy (${producer.energy} kWh).`
            );
            return;
        }

        if (offerValue > producerPrice) {
            alert(
                `Offer must be less than or equal to producer price â‚¹${producerPrice.toFixed(2)}.`
            );
            return;
        }

        try {

            setLoading(true);

            const token = localStorage.getItem("energy_marketplace_jwt");
            const response =
                await axios.post(
                    `${API}/trading/negotiate`,
                    {
                        listing_id:
                            producer.id,
                        consumer:
                            consumer,
                        energy:
                            energyValue,
                        consumer_offer:
                            offerValue,

                        reason: reason.trim(),

                        urgency: urgency,
                    },
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                    }
                );

            console.log(
                "Negotiation created:",
                response.data
            );

            setAiQuote(response.data);

        } catch (err) {

            console.error(
                "Failed to create negotiation:",
                err
            );

            alert(
                err.response?.data?.detail ||
                "Unable to start negotiation."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // ACCEPT AI PRICE AND CREATE PENDING BUY REQUEST
    // =====================================================

    const acceptAiQuote = async () => {
        if (!aiQuote?.id) return;

        try {
            setLoading(true);

            const token = localStorage.getItem("energy_marketplace_jwt");
            await axios.put(
                `${API}/trading/negotiate/${aiQuote.id}/accept`,
                {},
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                }
            );

            alert(
                "Buy request sent at the AI-recommended price. It is now waiting for the producer to accept or reject it."
            );

            if (onSuccess) await onSuccess();

            onClose();
        } catch (err) {
            alert(
                err.response?.data?.detail ||
                "Unable to send the buy request."
            );
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
    // UI
    // =====================================================

    return (

        <div
            style={{
                position: "fixed",

                inset: 0,

                background:
                    "rgba(0,0,0,0.65)",

                display: "flex",

                justifyContent:
                    "center",

                alignItems:
                    "center",

                zIndex: 1000,

                padding: "20px"
            }}
        >

            <div
                style={{
                    width: "500px",

                    maxWidth: "100%",

                    background:
                        "#131F30",

                    color:
                        "#EDF1F7",

                    border:
                        "1px solid rgba(255,255,255,0.08)",

                    borderRadius:
                        "14px",

                    padding:
                        "30px",

                    boxShadow:
                        "0 20px 60px rgba(0,0,0,0.45)"
                }}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    style={{
                        display: "flex",

                        justifyContent:
                            "space-between",

                        alignItems:
                            "center",

                        marginBottom:
                            "24px"
                    }}
                >

                    <div>

                        <h2
                            style={{
                                margin: 0,

                                fontFamily:
                                    "Space Grotesk, sans-serif",

                                fontSize:
                                    "22px"
                            }}
                        >
                            âš¡ Energy Purchase
                        </h2>

                        <p
                            style={{
                                margin:
                                    "6px 0 0",

                                color:
                                    "#7C8BA3",

                                fontSize:
                                    "13px"
                            }}
                        >
                            Buy directly or negotiate
                            with the producer.
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            border: "none",

                            background:
                                "rgba(255,255,255,0.06)",

                            color:
                                "#9FB0C9",

                            width: "34px",

                            height: "34px",

                            borderRadius:
                                "50%",

                            cursor:
                                loading
                                    ? "not-allowed"
                                    : "pointer",

                            fontSize:
                                "18px"
                        }}
                    >
                        Ã—
                    </button>

                </div>

                <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: "#7C8BA3", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Reason for Energy Request
                    </label>
                    <textarea
                        value={reason}
                        disabled={loading}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="For example: home backup during an outage"
                        maxLength="500"
                        rows="3"
                        style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", background: "#0F1826", color: "#EDF1F7", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", outline: "none", fontSize: "14px", resize: "vertical" }}
                    />
                </div>

                <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: "#7C8BA3", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Request urgency
                    </label>
                    <select
                        value={urgency}
                        disabled={loading}
                        onChange={(event) => setUrgency(event.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", background: "#0F1826", color: "#EDF1F7", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", outline: "none", fontSize: "14px" }}
                    >
                        <option value="Critical">Critical</option>
                        <option value="Essential">Essential</option>
                        <option value="Normal">Normal</option>
                        <option value="Flexible">Flexible</option>
                    </select>
                </div>

                {/* =================================================
                    PRODUCER INFORMATION
                ================================================= */}

                <div
                    style={{
                        background:
                            "#182742",

                        borderRadius:
                            "10px",

                        padding:
                            "16px",

                        marginBottom:
                            "20px"
                    }}
                >

                    <div
                        style={{
                            display:
                                "grid",

                            gridTemplateColumns:
                                "1fr 1fr",

                            gap:
                                "14px"
                        }}
                    >

                        <div>

                            <div
                                style={{
                                    color:
                                        "#7C8BA3",

                                    fontSize:
                                        "11px",

                                    textTransform:
                                        "uppercase",

                                    marginBottom:
                                        "4px"
                                }}
                            >
                                Producer
                            </div>

                            <div
                                style={{
                                    fontWeight:
                                        700
                                }}
                            >
                                {producer?.producer ||
                                    "Unknown"}
                            </div>

                        </div>

                        <div>

                            <div
                                style={{
                                    color:
                                        "#7C8BA3",

                                    fontSize:
                                        "11px",

                                    textTransform:
                                        "uppercase",

                                    marginBottom:
                                        "4px"
                                }}
                            >
                                Available
                            </div>

                            <div
                                style={{
                                    fontWeight:
                                        700,

                                    color:
                                        "#5FD98A"
                                }}
                            >
                                {producer?.energy ??
                                    0}{" "}
                                kWh
                            </div>

                        </div>

                        <div>

                            <div
                                style={{
                                    color:
                                        "#7C8BA3",

                                    fontSize:
                                        "11px",

                                    textTransform:
                                        "uppercase",

                                    marginBottom:
                                        "4px"
                                }}
                            >
                                Producer Price
                            </div>

                            <div
                                style={{
                                    fontWeight:
                                        700,

                                    color:
                                        "#F2A93B"
                                }}
                            >
                                â‚¹
                                {producerPrice.toFixed(
                                    2
                                )}{" "}
                                / kWh
                            </div>

                        </div>

                        <div>

                            <div
                                style={{
                                    color:
                                        "#7C8BA3",

                                    fontSize:
                                        "11px",

                                    textTransform:
                                        "uppercase",

                                    marginBottom:
                                        "4px"
                                }}
                            >
                                Listing
                            </div>

                            <div
                                style={{
                                    fontWeight:
                                        700
                                }}
                            >
                                #{producer?.id}
                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    MODE SELECTOR
                ================================================= */}

                <div
                    style={{
                        display:
                            "grid",

                        gridTemplateColumns:
                            "1fr 1fr",

                        gap:
                            "10px",

                        marginBottom:
                            "22px"
                    }}
                >

                    {/* BUY */}

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            setMode("buy")
                        }
                        style={{
                            padding:
                                "12px",

                            borderRadius:
                                "8px",

                            border:
                                mode === "buy"
                                    ? "1px solid #5FD98A"
                                    : "1px solid rgba(255,255,255,0.08)",

                            background:
                                mode === "buy"
                                    ? "rgba(95,217,138,0.12)"
                                    : "rgba(255,255,255,0.03)",

                            color:
                                mode === "buy"
                                    ? "#5FD98A"
                                    : "#9FB0C9",

                            fontWeight:
                                700,

                            cursor:
                                loading
                                    ? "not-allowed"
                                    : "pointer"
                        }}
                    >
                        ðŸ›’ Buy Directly
                    </button>

                    {/* NEGOTIATE */}

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            setMode("negotiate")
                        }
                        style={{
                            padding:
                                "12px",

                            borderRadius:
                                "8px",

                            border:
                                mode === "negotiate"
                                    ? "1px solid #B98CF2"
                                    : "1px solid rgba(255,255,255,0.08)",

                            background:
                                mode === "negotiate"
                                    ? "rgba(185,140,242,0.12)"
                                    : "rgba(255,255,255,0.03)",

                            color:
                                mode === "negotiate"
                                    ? "#B98CF2"
                                    : "#9FB0C9",

                            fontWeight:
                                700,

                            cursor:
                                loading
                                    ? "not-allowed"
                                    : "pointer"
                        }}
                    >
                        ðŸ¤– Negotiate
                    </button>

                </div>

                {/* =================================================
                    ENERGY INPUT
                ================================================= */}

                <div
                    style={{
                        marginBottom:
                            "18px"
                    }}
                >

                    <label
                        style={{
                            display:
                                "block",

                            fontSize:
                                "12px",

                            color:
                                "#7C8BA3",

                            marginBottom:
                                "7px",

                            textTransform:
                                "uppercase",

                            letterSpacing:
                                "0.05em"
                        }}
                    >
                        Energy Required (kWh)
                    </label>

                    <input
                        type="number"
                        min="0.01"
                        max={
                            producer?.energy
                        }
                        step="0.01"
                        value={energy}
                        disabled={loading}
                        onChange={(e) =>
                            {
                                setEnergy(e.target.value);
                                setAiQuote(null);
                            }
                        }
                        style={{
                            width:
                                "100%",

                            boxSizing:
                                "border-box",

                            padding:
                                "12px 14px",

                            background:
                                "#0F1826",

                            color:
                                "#EDF1F7",

                            border:
                                "1px solid rgba(255,255,255,0.09)",

                            borderRadius:
                                "8px",

                            outline:
                                "none",

                            fontSize:
                                "14px"
                        }}
                    />

                </div>

                {/* =================================================
                    NEGOTIATION OFFER
                ================================================= */}

                {mode ===
                    "negotiate" && (

                    <div
                        style={{
                            marginBottom:
                                "18px"
                        }}
                    >

                        <label
                            style={{
                                display:
                                    "block",

                                fontSize:
                                    "12px",

                                color:
                                    "#7C8BA3",

                                marginBottom:
                                    "7px",

                                textTransform:
                                    "uppercase",

                                letterSpacing:
                                    "0.05em"
                            }}
                        >
                            Your Offer (â‚¹ / kWh)
                        </label>

                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="e.g. 15"
                            value={
                                consumerOffer
                            }
                            disabled={loading}
                            onChange={(e) =>
                                {
                                    setConsumerOffer(e.target.value);
                                    setAiQuote(null);
                                }
                            }
                            style={{
                                width:
                                    "100%",

                                boxSizing:
                                    "border-box",

                                padding:
                                    "12px 14px",

                                background:
                                    "#0F1826",

                                color:
                                    "#EDF1F7",

                                border:
                                    "1px solid rgba(185,140,242,0.35)",

                                borderRadius:
                                    "8px",

                                outline:
                                    "none",

                                fontSize:
                                    "14px"
                            }}
                        />

                        <div
                            style={{
                                marginTop:
                                    "7px",

                                color:
                                    "#7C8BA3",

                                fontSize:
                                    "12px"
                            }}
                        >
                            The producer will review
                            your offer.
                        </div>

                    </div>

                )}

                {/* =================================================
                    TOTAL
                ================================================= */}

                <div
                    style={{
                        background:
                            "#182742",

                        borderRadius:
                            "9px",

                        padding:
                            "14px",

                        marginBottom:
                            "22px",

                        textAlign:
                            "center"
                    }}
                >

                    {mode === "buy" ? (

                        <>
                            <div
                                style={{
                                    color:
                                        "#7C8BA3",

                                    fontSize:
                                        "12px",

                                    marginBottom:
                                        "4px"
                                }}
                            >
                                Estimated Total
                            </div>

                            <div
                                style={{
                                    color:
                                        "#5FD98A",

                                    fontSize:
                                        "22px",

                                    fontWeight:
                                        700
                                }}
                            >
                                â‚¹
                                {total.toFixed(
                                    2
                                )}
                            </div>
                        </>

                    ) : (

                        <>
                            <div
                                style={{
                                    color:
                                        "#7C8BA3",

                                    fontSize:
                                        "12px",

                                    marginBottom:
                                        "4px"
                                }}
                            >
                                {aiQuote
                                    ? "Final AI Recommended Price"
                                    : "Estimated AI Price"}
                            </div>

                            <div
                                style={{
                                    color:
                                        "#B98CF2",

                                    fontSize:
                                        "22px",

                                    fontWeight:
                                        700
                                }}
                            >
                                {aiQuote
                                    ? `₹${Number(aiQuote.negotiated_price || 0).toFixed(2)}`
                                    : recommendedPrice > 0
                                    ? `₹${recommendedPrice.toFixed(2)}`
                                    : "â‚¹0.00"}
                            </div>

                            <div
                                style={{
                                    color: "#7C8BA3",
                                    fontSize: "12px",
                                    marginTop: "6px",
                                }}
                            >
                                {aiQuote
                                    ? `Final total: ₹${(Number(aiQuote.negotiated_price || 0) * energyValue).toFixed(2)}`
                                    : "Tap Get AI Price to receive the final recommendation."}
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={aiQuote ? acceptAiQuote : sendNegotiation}
                                style={{ width: "100%", marginTop: "14px", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", background: aiQuote ? "linear-gradient(135deg, #5FD98A, #2EAD65)" : "linear-gradient(135deg, #B98CF2, #8055C7)", color: "#07110B" }}
                            >
                                {loading
                                    ? (aiQuote ? "Confirming Request..." : "Getting AI Price...")
                                    : aiQuote
                                    ? "✓ Confirm Negotiation Request"
                                    : "✦ Get Final AI Price"}
                            </button>

                        </>

                    )}

                </div>

                {/* =================================================
                    BUTTONS
                ================================================= */}

                <div
                    style={{
                        display:
                            "flex",

                        gap:
                            "12px"
                    }}
                >

                    {/* CANCEL */}

                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            flex:
                                1,

                            padding:
                                "12px",

                            background:
                                "rgba(255,255,255,0.07)",

                            color:
                                "#9FB0C9",

                            border:
                                "1px solid rgba(255,255,255,0.08)",

                            borderRadius:
                                "8px",

                            cursor:
                                loading
                                    ? "not-allowed"
                                    : "pointer",

                            fontWeight:
                                700
                        }}
                    >
                        Cancel
                    </button>

                    {/* SUBMIT */}

                    <button
                        onClick={
                            handleSubmit
                        }
                        disabled={
                            loading ||
                            (mode === "negotiate" && aiQuote)
                        }
                        style={{
                            flex:
                                2,

                            padding:
                                "12px",

                            border:
                                "none",

                            borderRadius:
                                "8px",

                            cursor:
                                loading ||
                                (mode === "negotiate" && aiQuote)
                                    ? "not-allowed"
                                    : "pointer",

                            fontWeight:
                                700,

                            background:
                                mode === "buy"
                                    ? "linear-gradient(135deg, #5FD98A, #2EAD65)"
                                    : "linear-gradient(135deg, #B98CF2, #8055C7)",

                            color:
                                "#07110B",

                            opacity:
                                loading ||
                                (mode === "negotiate" && aiQuote)
                                    ? 0.65
                                    : 1
                        }}
                    >
                        {loading
                            ? "Sending..."
                            : mode === "buy"
                            ? "Confirm Purchase"
                            : aiQuote
                            ? "AI price ready above"
                            : "Get AI Price"}
                    </button>

                </div>

            </div>

        </div>

    );
}





