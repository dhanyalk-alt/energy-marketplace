
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const API_BASE = API_BASE_URL;

const colors = {
  bg: "#0B1420",
  surface: "#131F30",
  surfaceAlt: "#182742",
  border: "rgba(255,255,255,0.08)",
  text: "#EDF1F7",
  textMuted: "#7C8BA3",
  green: "#5FD98A",
  violet: "#B98CF2",
  cyan: "#3FD0E0",
  orange: "#FF8A65",
  red: "#FF6B6B",
};

const styleSheet = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

  .energy-ai-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .energy-ai-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .energy-ai-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.12);
    border-radius: 10px;
  }

  .energy-ai-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.2);
  }

  .energy-ai-quick-button:hover {
    border-color: rgba(185,140,242,0.5) !important;
    color: #EDF1F7 !important;
    background: rgba(185,140,242,0.08) !important;
  }

  .energy-ai-input:focus {
    border-color: rgba(185,140,242,0.5) !important;
  }
`;

export default function AIAssistant() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      type: "ai",
      text:
        'Hi! I\'m your Energy Assistant. I can help you find energy, compare producers, prices and ratings. You can also make a natural-language energy offer such as: "I need 5 kWh from a producer at ₹18 per kWh."',
    },
  ]);

  const [producers, setProducers] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharedLocation, setSharedLocation] = useState(null);
  const negotiationStatuses = useRef(new Map());
  const hasLoadedNegotiations = useRef(false);

  // ============================================================
  // LOGGED-IN CONSUMER
  // ============================================================

  const consumerUsername =
    localStorage.getItem("username") || "";

  const token =
    localStorage.getItem("energy_marketplace_jwt") || "";

  // ============================================================
  // LOAD MARKETPLACE
  // ============================================================

  // The account identifiers come from localStorage and are refreshed on sign-in.
  // This subscription is intentionally established once per assistant mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadMarketplace();
    loadNegotiations();

    const intervalId = window.setInterval(
      () => loadNegotiations({ notifyOnChange: true }),
      30000
    );

    return () => window.clearInterval(intervalId);
  }, []);

  const loadMarketplace = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/trading/all`
      );

      if (Array.isArray(response.data)) {
        setProducers(response.data);
      } else {
        setProducers([]);
      }
    } catch (error) {
      console.error(
        "AI marketplace fetch error:",
        error
      );

      setProducers([]);
    }
  };

  const loadNegotiations = async (
    { notifyOnChange = false } = {}
  ) => {
    if (!consumerUsername || !token) {
      setNegotiations([]);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE}/trading/negotiations/consumer/${encodeURIComponent(
          consumerUsername
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const latest = Array.isArray(response.data)
        ? response.data
        : [];

      if (notifyOnChange && hasLoadedNegotiations.current) {
        latest.forEach((negotiation) => {
          const previousStatus = negotiationStatuses.current.get(
            negotiation.id
          );

          if (
            previousStatus &&
            previousStatus !== negotiation.status
          ) {
            addMessage(
              "ai",
              `🔔 Negotiation #${negotiation.id} has been ${String(
                negotiation.status
              ).toLowerCase()} by ${negotiation.producer}.`
            );
          }
        });
      }

      negotiationStatuses.current = new Map(
        latest.map((negotiation) => [
          negotiation.id,
          negotiation.status,
        ])
      );
      hasLoadedNegotiations.current = true;
      setNegotiations(latest);
    } catch (error) {
      console.error("AI negotiation status fetch error:", error);
    }
  };

  const getModelResponse = async (question) => {
    if (!token) {
      throw new Error("Authentication is required for AI chat.");
    }

    const response = await axios.post(
      `${API_BASE}/assistant/chat`,
      {
        message: question,
        location: sharedLocation || undefined,
        history: messages
          .slice(-8)
          .filter((item) => item.type === "user" || item.type === "ai")
          .map((item) => ({
            role: item.type === "ai" ? "assistant" : "user",
            content: item.text,
          })),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.answer;
  };

  const shareLocation = () => {
    if (!navigator.geolocation) {
      addMessage("ai", "Location sharing is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSharedLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        addMessage("ai", "📍 Location shared for this chat. I can now check local weather and nearby solar businesses.");
      },
      () => addMessage("ai", "I could not access your location. You can still ask marketplace questions without it."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  // ============================================================
  // ADD MESSAGE
  // ============================================================

  const addMessage = (
    type,
    text,
    extra = null
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        type,
        text,
        extra,
      },
    ]);
  };

  // ============================================================
  // EXTRACT ENERGY
  // Examples:
  // 5 kWh
  // 5 kw
  // 5 units
  // 5 units of energy
  // ============================================================

  const extractEnergy = (question) => {
    const energyMatch = question.match(
      /(\d+(?:\.\d+)?)\s*(?:kwh|kw|units?(?:\s+of)?\s+energy|units?)/i
    );

    if (!energyMatch) {
      return null;
    }

    const energy = Number(energyMatch[1]);

    if (
      !Number.isFinite(energy) ||
      energy <= 0
    ) {
      return null;
    }

    return energy;
  };

  // ============================================================
  // EXTRACT CONSUMER OFFER
  //
  // Examples:
  // ₹18
  // ₹18 per kWh
  // 18 per kWh
  // offer 18
  // pay 18
  // budget 18
  // ============================================================

  const extractOffer = (question) => {
    const rupeeMatch = question.match(
      /₹\s*(\d+(?:\.\d+)?)/i
    );

    if (rupeeMatch) {
      const value = Number(rupeeMatch[1]);

      if (
        Number.isFinite(value) &&
        value >= 0
      ) {
        return value;
      }
    }

    const perKwhMatch = question.match(
      /(\d+(?:\.\d+)?)\s*(?:₹\s*)?(?:per|\/)\s*kwh/i
    );

    if (perKwhMatch) {
      const value = Number(perKwhMatch[1]);

      if (
        Number.isFinite(value) &&
        value >= 0
      ) {
        return value;
      }
    }

    const offerMatch = question.match(
      /(?:offer|pay|paying|budget|for)\s*(?:₹\s*)?(\d+(?:\.\d+)?)/i
    );

    if (offerMatch) {
      const value = Number(offerMatch[1]);

      if (
        Number.isFinite(value) &&
        value >= 0
      ) {
        return value;
      }
    }

    return null;
  };

  // ============================================================
  // FIND PRODUCER
  // ============================================================

  const findProducer = (question) => {
    if (!Array.isArray(producers)) {
      return null;
    }

    const normalizedQuestion =
      question.toLowerCase();

    // ----------------------------------------------------------
    // First try complete producer name
    // ----------------------------------------------------------

    const directMatch = producers.find(
      (listing) => {
        const producerName =
          String(
            listing.producer || ""
          ).trim();

        if (!producerName) {
          return false;
        }

        return normalizedQuestion.includes(
          producerName.toLowerCase()
        );
      }
    );

    if (directMatch) {
      return directMatch.producer;
    }

    // ----------------------------------------------------------
    // Try individual producer words
    // ----------------------------------------------------------

    const words =
      normalizedQuestion
        .split(/[^a-zA-Z0-9_]+/)
        .filter(Boolean);

    const producerMatch =
      producers.find(
        (listing) => {
          const producerName =
            String(
              listing.producer || ""
            )
              .trim()
              .toLowerCase();

          if (!producerName) {
            return false;
          }

          const producerWords =
            producerName.split(
              /[^a-zA-Z0-9_]+/
            );

          return producerWords.some(
            (word) =>
              word.length > 1 &&
              words.includes(word)
          );
        }
      );

    return producerMatch
      ? producerMatch.producer
      : null;
  };

  // ============================================================
  // FIND LISTING
  // ============================================================

  const findListing = (
    producerName,
    requestedEnergy
  ) => {
    if (!producerName) {
      return null;
    }

    const matchingListings =
      producers.filter(
        (listing) =>
          String(
            listing.producer || ""
          ).toLowerCase() ===
          String(
            producerName
          ).toLowerCase()
      );

    if (
      matchingListings.length === 0
    ) {
      return null;
    }

    // Find a listing with enough energy
    if (
      requestedEnergy !== null
    ) {
      const sufficientListing =
        matchingListings.find(
          (listing) =>
            Number(
              listing.energy || 0
            ) >= requestedEnergy
        );

      if (sufficientListing) {
        return sufficientListing;
      }
    }

    return matchingListings[0];
  };

  // ============================================================
  // ACCEPT COUNTER OFFER
  // ============================================================

  const acceptCounterOffer = async (
    negotiationId
  ) => {
    if (!negotiationId) {
      return;
    }

    if (!window.confirm(
      "Accept this counter offer? It will be sent to the producer for final approval."
    )) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await axios.put(
          `${API_BASE}/trading/negotiate/${negotiationId}/accept`,
          {},
          {
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

      const result =
        response.data;

      addMessage(
        "ai",
        `✅ Counter offer accepted.

Producer: ${result.producer || "Unknown"}

Consumer: ${result.consumer || consumerUsername}

Energy: ${Number(
          result.energy || 0
        ).toFixed(2)} kWh

Agreed price: ₹${Number(
          result.negotiated_price || 0
        ).toFixed(2)}/kWh

Status: ${result.status || "Pending"}

Your request is now waiting for the producer to accept or reject it. No transaction is created and no listing energy is deducted until the producer accepts.`
      );

      // The backend preserves listing energy until the producer decides.
      await Promise.all([
        loadMarketplace(),
        loadNegotiations(),
      ]);
    } catch (error) {
      console.error(
        "Accept counter offer error:",
        error
      );

      const detail =
        error?.response?.data?.detail;

      addMessage(
        "ai",
        `❌ Could not accept the counter offer.

${
          detail ||
          "Please try again."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REJECT COUNTER OFFER
  // ============================================================

  const rejectCounterOffer = async (
    negotiationId
  ) => {
    if (!negotiationId) {
      return;
    }

    if (!window.confirm(
      "Reject this counter offer? This cannot be undone."
    )) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await axios.put(
          `${API_BASE}/trading/negotiate/${negotiationId}/consumer-reject`,
          {},
          {
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

      const result =
        response.data;

      addMessage(
        "ai",
        `❌ Counter offer rejected.

Negotiation ID: ${
          result.negotiation_id ||
          negotiationId
        }

The negotiation has been cancelled.`
      );

      await loadNegotiations();
    } catch (error) {
      console.error(
        "Reject counter offer error:",
        error
      );

      const detail =
        error?.response?.data?.detail;

      addMessage(
        "ai",
        `❌ Could not reject the counter offer.

${
          detail ||
          "Please try again."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // NEGOTIATION
  // ============================================================

  const handleNegotiation = async (
    question
  ) => {
    const energy =
      extractEnergy(question);

    const consumerOffer =
      extractOffer(question);

    // ----------------------------------------------------------
    // Validate energy
    // ----------------------------------------------------------

    if (energy === null) {
      return {
        text:
          "I understood that you want to negotiate, but I could not determine how much energy you need.\n\n" +
          'Please specify the amount, for example:\n"I need 5 kWh from Gokul at ₹18 per kWh."',
      };
    }

    // ----------------------------------------------------------
    // Validate offer
    // ----------------------------------------------------------

    if (consumerOffer === null) {
      return {
        text:
          `I understood that you need ${energy.toFixed(
            2
          )} kWh, but I could not determine your offer price.\n\n` +
          'Please include your offer, for example:\n"I need 5 kWh from Gokul at ₹18 per kWh."',
      };
    }

    // ----------------------------------------------------------
    // Check marketplace
    // ----------------------------------------------------------

    if (
      !Array.isArray(producers) ||
      producers.length === 0
    ) {
      return {
        text:
          "There are currently no active energy listings available for negotiation.",
      };
    }

    // ----------------------------------------------------------
    // Find producer
    // ----------------------------------------------------------

    const producer =
      findProducer(question);

    if (!producer) {
      return {
        text:
          "I couldn't identify the producer from your message.\n\n" +
          "Please mention the producer's name exactly as it appears in the marketplace.\n\n" +
          `Currently available producers: ${producers
            .map(
              (item) =>
                item.producer
            )
            .filter(Boolean)
            .join(", ")}`,
      };
    }

    // ----------------------------------------------------------
    // Find listing
    // ----------------------------------------------------------

    const listing =
      findListing(
        producer,
        energy
      );

    if (!listing) {
      return {
        text:
          `I couldn't find an active listing for ${producer}.`,
      };
    }

    // ----------------------------------------------------------
    // Listing ID
    // ----------------------------------------------------------

    const listingId =
      Number(listing.id);

    if (
      !Number.isInteger(
        listingId
      )
    ) {
      return {
        text:
          "The producer listing was found, but it does not contain a valid listing ID.",
      };
    }

    // ----------------------------------------------------------
    // Producer price
    // ----------------------------------------------------------

    const producerPrice =
      Number(listing.price);

    if (
      !Number.isFinite(
        producerPrice
      ) ||
      producerPrice < 0
    ) {
      return {
        text:
          "The producer listing does not contain a valid energy price.",
      };
    }

    // ----------------------------------------------------------
    // Listing energy
    // ----------------------------------------------------------

    const listingEnergy =
      Number(listing.energy);

    if (
      Number.isFinite(
        listingEnergy
      ) &&
      listingEnergy < energy
    ) {
      return {
        text:
          `${producer} currently has only ${listingEnergy.toFixed(
            2
          )} kWh available in the selected listing, while you requested ${energy.toFixed(
            2
          )} kWh.`,
      };
    }

    // ----------------------------------------------------------
    // Consumer validation
    // ----------------------------------------------------------

    if (!consumerUsername) {
      return {
        text:
          "I couldn't identify the logged-in consumer. Please sign in again before starting a negotiation.",
      };
    }

    // ----------------------------------------------------------
    // Negotiation payload
    // ----------------------------------------------------------

    const payload = {
      listing_id: listingId,
      producer: producer,
      consumer: consumerUsername,
      energy: energy,
      producer_price: producerPrice,
      consumer_offer: consumerOffer,
    };

    console.log(
      "Negotiation payload:",
      payload
    );

    try {
      const response =
        await axios.post(
          `${API_BASE}/trading/negotiate`,
          payload,
          {
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

      const result =
        response.data;

      console.log(
        "Negotiation response:",
        result
      );

      await loadNegotiations();

      const negotiatedPrice =
        result.negotiated_price;

      const status =
        String(
          result.status || ""
        ).trim();

      const normalizedStatus =
        status.toLowerCase();

      // --------------------------------------------------------
      // ACCEPTED
      // --------------------------------------------------------

      if (
        normalizedStatus ===
        "accepted"
      ) {
        return {
          text:
            `🤝 Negotiation accepted!\n\n` +
            `Producer: ${producer}\n` +
            `Energy: ${energy.toFixed(
              2
            )} kWh\n` +
            `Producer asking price: ₹${producerPrice.toFixed(
              2
            )}/kWh\n` +
            `Your offer: ₹${consumerOffer.toFixed(
              2
            )}/kWh\n` +
            `Agreed price: ₹${Number(
              negotiatedPrice
            ).toFixed(
              2
            )}/kWh\n\n` +
            `The negotiation agent accepted the offer.`,
        };
      }

      // --------------------------------------------------------
      // COUNTER OFFER
      // --------------------------------------------------------

      if (
        normalizedStatus ===
          "counter offer" ||
        normalizedStatus ===
          "counter_offer"
      ) {
        return {
          text:
            `🤝 Counter offer received!\n\n` +
            `Producer: ${producer}\n` +
            `Energy: ${energy.toFixed(
              2
            )} kWh\n` +
            `Producer asking price: ₹${producerPrice.toFixed(
              2
            )}/kWh\n` +
            `Your offer: ₹${consumerOffer.toFixed(
              2
            )}/kWh\n` +
            `AI negotiated price: ₹${Number(
              negotiatedPrice
            ).toFixed(
              2
            )}/kWh\n\n` +
            `The negotiation agent generated this counter offer based on the available market information.`,
          negotiationId:
            result.id ||
            result.negotiation_id,
          negotiatedPrice:
            negotiatedPrice,
          showActions: true,
        };
      }

      // --------------------------------------------------------
      // REJECTED
      // --------------------------------------------------------

      if (
        normalizedStatus ===
        "rejected"
      ) {
        return {
          text:
            `❌ Negotiation rejected.\n\n` +
            `Producer: ${producer}\n` +
            `Requested energy: ${energy.toFixed(
              2
            )} kWh\n` +
            `Your offer: ₹${consumerOffer.toFixed(
              2
            )}/kWh\n\n` +
            `The requested trade could not be accepted with the current energy availability or negotiation conditions.`,
        };
      }

      if (normalizedStatus === "pending") {
        return {
          text:
            `🤝 Offer sent to ${producer}.\n\n` +
            `Energy: ${energy.toFixed(2)} kWh\n` +
            `Proposed price: ₹${Number(negotiatedPrice).toFixed(2)}/kWh\n\n` +
            `The offer is waiting for the producer to accept or reject it. No transaction has been created yet.`,
        };
      }

      // --------------------------------------------------------
      // OTHER STATUS
      // --------------------------------------------------------

      return {
        text:
          `Negotiation result received.\n\n` +
          `Producer: ${producer}\n` +
          `Energy: ${energy.toFixed(
            2
          )} kWh\n` +
          `Your offer: ₹${consumerOffer.toFixed(
            2
          )}/kWh\n` +
          `Negotiated price: ${
            negotiatedPrice !== null &&
            negotiatedPrice !== undefined
              ? `₹${Number(
                  negotiatedPrice
                ).toFixed(
                  2
                )}/kWh`
              : "Not available"
          }\n` +
          `Status: ${
            status || "Unknown"
          }`,
      };
    } catch (error) {
      console.error(
        "Negotiation error:",
        error
      );

      const detail =
        error?.response?.data?.detail;

      return {
        text:
          `The negotiation could not be completed.\n\n${
            detail ||
            "The negotiation request could not reach the backend."
          }`,
      };
    }
  };

  // ============================================================
  // DETECT NEGOTIATION REQUEST
  // ============================================================

  const isNegotiationRequest = (
    question
  ) => {
    const q =
      question.toLowerCase();

    const negotiationWords = [
      "negotiate",
      "negotiation",
      "offer",
      "counter",
      "pay",
      "buy",
      "purchase",
      "deal",
      "can i get",
      "i need",
      "i want",
    ];

    const hasNegotiationWord =
      negotiationWords.some(
        (word) =>
          q.includes(word)
      );

    const hasEnergy =
      extractEnergy(question) !==
      null;

    const hasPrice =
      extractOffer(question) !==
      null;

    return (
      hasNegotiationWord &&
      hasEnergy &&
      hasPrice
    );
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const handleSend = async () => {
    const trimmed =
      message.trim();

    if (
      !trimmed ||
      loading
    ) {
      return;
    }

    addMessage(
      "user",
      trimmed
    );

    setMessage("");
    setLoading(true);

    try {
      let response;

      if (
        isNegotiationRequest(
          trimmed
        )
      ) {
        response =
          await handleNegotiation(
            trimmed
          );
      } else {
        response = {
          text: await getModelResponse(trimmed),
        };
      }

      addMessage(
        "ai",
        response.text,
        response
      );
    } catch (error) {
      console.error(
        "Assistant error:",
        error
      );

      addMessage(
        "ai",
        error.response?.data?.detail ||
          "The AI assistant could not generate a response. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // QUICK QUESTIONS
  // ============================================================

  const askQuestion = async (
    question
  ) => {
    if (loading) {
      return;
    }

    addMessage(
      "user",
      question
    );

    setLoading(true);

    try {
      const response = await getModelResponse(question);

      addMessage(
        "ai",
        response
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "500px",
        display: "flex",
        flexDirection: "column",
        background:
          colors.surface,
        borderRadius: "12px",
        border:
          `1px solid ${colors.border}`,
        overflow: "hidden",
        fontFamily:
          "Inter, sans-serif",
      }}
    >
      <style>
        {styleSheet}
      </style>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          padding: "16px",
          borderBottom:
            `1px solid ${colors.border}`,
          background:
            colors.surfaceAlt,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #B98CF2, #3FD0E0)",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              fontSize: "19px",
            }}
          >
            🤖
          </div>

          <div>
            <div
              style={{
                color:
                  colors.text,
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              Energy Assistant
            </div>

            <div
              style={{
                color:
                  colors.green,
                fontSize: "11px",
                marginTop: "2px",
              }}
            >
              ● Online
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      <div
        className="energy-ai-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px",
          display: "flex",
          flexDirection:
            "column",
          gap: "10px",
        }}
      >
        {messages.map(
          (msg, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection:
                  "column",
                alignItems:
                  msg.type ===
                  "user"
                    ? "flex-end"
                    : "flex-start",
                gap: "8px",
              }}
            >
              <div
                style={{
                  maxWidth: "88%",
                  padding:
                    "10px 12px",
                  borderRadius:
                    msg.type ===
                    "user"
                      ? "12px 12px 3px 12px"
                      : "12px 12px 12px 3px",
                  background:
                    msg.type ===
                    "user"
                      ? "linear-gradient(135deg, #B98CF2, #8B63C7)"
                      : colors.surfaceAlt,
                  color:
                    colors.text,
                  fontSize: "12px",
                  lineHeight:
                    "1.5",
                  whiteSpace:
                    "pre-line",
                }}
              >
                {msg.text}
              </div>

              {/* =================================================
                  COUNTER OFFER BUTTONS
              ================================================= */}

              {msg.type ===
                "ai" &&
                msg.extra?.showActions &&
                msg.extra
                  ?.negotiationId && (
                  <div
                    style={{
                      display:
                        "flex",
                      gap: "8px",
                      maxWidth:
                        "88%",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <button
                      onClick={() =>
                        acceptCounterOffer(
                          msg.extra
                            .negotiationId
                        )
                      }
                      disabled={
                        loading
                      }
                      style={{
                        border:
                          "none",
                        borderRadius:
                          "7px",
                        padding:
                          "9px 13px",
                        background:
                          "linear-gradient(135deg, #5FD98A, #2FAE63)",
                        color:
                          "#08210F",
                        fontWeight:
                          "700",
                        fontSize:
                          "11px",
                        cursor:
                          loading
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          loading
                            ? 0.6
                            : 1,
                      }}
                    >
                      ✅ Confirm Negotiation Request
                    </button>

                    <button
                      onClick={() =>
                        rejectCounterOffer(
                          msg.extra
                            .negotiationId
                        )
                      }
                      disabled={
                        loading
                      }
                      style={{
                        border:
                          `1px solid ${colors.border}`,
                        borderRadius:
                          "7px",
                        padding:
                          "9px 13px",
                        background:
                          "rgba(255,255,255,0.04)",
                        color:
                          colors.text,
                        fontWeight:
                          "600",
                        fontSize:
                          "11px",
                        cursor:
                          loading
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          loading
                            ? 0.6
                            : 1,
                      }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
            </div>
          )
        )}

        {loading && (
          <div
            style={{
              color:
                colors.textMuted,
              fontSize: "12px",
            }}
          >
            Assistant is thinking...
          </div>
        )}
      </div>

      {/* =====================================================
          QUICK QUESTIONS
      ===================================================== */}

      <div
        style={{
          padding:
            "10px 12px",
          borderTop:
            `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            color:
              colors.textMuted,
            fontSize: "10px",
            marginBottom: "7px",
            textTransform:
              "uppercase",
            letterSpacing:
              "0.08em",
          }}
        >
          Quick questions
        </div>

        <div
          className="energy-ai-scroll"
          style={{
            display: "flex",
            gap: "6px",
            overflowX:
              "auto",
          }}
        >
          {[
            "Cheapest energy?",
            "Available energy?",
            "Current price?",
            "Who is selling?",
            "My negotiations",
          ].map(
            (question) => (
              <button
                key={question}
                className="energy-ai-quick-button"
                onClick={() =>
                  askQuestion(
                    question
                  )
                }
                disabled={loading}
                style={{
                  flexShrink: 0,
                  border:
                    `1px solid ${colors.border}`,
                  background:
                    "rgba(255,255,255,0.03)",
                  color:
                    colors.textMuted,
                  padding:
                    "6px 9px",
                  borderRadius:
                    "6px",
                  fontSize: "10px",
                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    loading
                      ? 0.6
                      : 1,
                }}
              >
                {question}
              </button>
            )
          )}
        </div>
      </div>

      {/* =====================================================
          INPUT
      ===================================================== */}

      <div
        style={{
          padding: "10px",
          display: "flex",
          gap: "7px",
          borderTop:
            `1px solid ${colors.border}`,
          background:
            colors.surfaceAlt,
        }}
      >
        <button
          type="button"
          onClick={shareLocation}
          disabled={loading}
          title={sharedLocation ? "Location shared for this chat" : "Share location for local weather and nearby businesses"}
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: "7px",
            padding: "0 9px",
            background: sharedLocation ? "rgba(95,217,138,0.14)" : colors.surface,
            color: sharedLocation ? colors.green : colors.textMuted,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "12px",
          }}
        >
          📍
        </button>
        <input
          className="energy-ai-input"
          value={message}
          onChange={(e) =>
            setMessage(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey
            ) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask or negotiate energy..."
          disabled={loading}
          style={{
            flex: 1,
            minWidth: 0,
            background:
              colors.surface,
            border:
              `1px solid ${colors.border}`,
            borderRadius:
              "7px",
            padding: "9px",
            color:
              colors.text,
            outline: "none",
            fontSize: "11px",
            opacity:
              loading
                ? 0.7
                : 1,
          }}
        />

        <button
          onClick={
            handleSend
          }
          disabled={
            loading ||
            !message.trim()
          }
          style={{
            border: "none",
            borderRadius:
              "7px",
            padding:
              "0 12px",
            background:
              "linear-gradient(135deg, #5FD98A, #2FAE63)",
            color: "#08210F",
            fontWeight: "700",
            cursor:
              loading ||
              !message.trim()
                ? "not-allowed"
                : "pointer",
            opacity:
              loading ||
              !message.trim()
                ? 0.6
                : 1,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
