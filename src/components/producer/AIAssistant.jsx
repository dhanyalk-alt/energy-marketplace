import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config";

const API = API_BASE_URL;

export default function AIAssistant() {

  // =========================================================
  // LOGGED-IN PRODUCER
  // =========================================================

  const username =
    localStorage.getItem("username") || "";

  // =========================================================
  // UI STATE
  // =========================================================

  const [showBriefing, setShowBriefing] =
    useState(true);

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [input, setInput] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [isNegotiating, setIsNegotiating] =
    useState(false);

  const [isChatLoading, setIsChatLoading] =
    useState(false);

  const [sharedLocation, setSharedLocation] =
    useState(null);

  // =========================================================
  // REAL BACKEND DATA
  // =========================================================

  const [battery, setBattery] =
    useState(null);

  const [requests, setRequests] =
    useState([]);

  const [market, setMarket] =
    useState(null);

  const [listings, setListings] =
    useState([]);

  const [insights, setInsights] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // FETCH BATTERY
  // =========================================================

  const fetchBattery = async () => {

    const response = await fetch(
      `${API}/battery/status`
    );

    if (!response.ok) {
      throw new Error(
        "Unable to load battery status."
      );
    }

    return await response.json();
  };

  // =========================================================
  // FETCH BUY REQUESTS
  // =========================================================

  const fetchRequests = async () => {

    const response = await fetch(
      `${API}/trading/requests`
    );

    if (!response.ok) {
      throw new Error(
        "Unable to load buying requests."
      );
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
  };

  // =========================================================
  // FETCH MARKET
  // =========================================================

  const fetchMarket = async () => {

    if (!username) {
      return null;
    }

    const response = await fetch(
      `${API}/trading/market/${encodeURIComponent(
        username
      )}`
    );

    if (!response.ok) {
      throw new Error(
        "Unable to load market information."
      );
    }

    return await response.json();
  };

  // =========================================================
  // FETCH ALL LISTINGS
  // =========================================================

  const fetchListings = async () => {

    const response = await fetch(
      `${API}/trading/all`
    );

    if (!response.ok) {
      throw new Error(
        "Unable to load energy listings."
      );
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
  };

  const fetchInsights = async () => {
    const token = localStorage.getItem("energy_marketplace_jwt");
    if (!token) {
      throw new Error("Producer authentication is required for AI insights.");
    }

    let weather = {};
    try {
      weather = JSON.parse(
        localStorage.getItem("energy_marketplace_weather") || "{}"
      );
    } catch {
      weather = {};
    }

    const response = await fetch(`${API}/producer/insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ weather }),
    });

    if (!response.ok) {
      throw new Error("Unable to load AI recommendations.");
    }

    return response.json();
  };

  // =========================================================
  // LOAD ALL REAL DATA
  // =========================================================

  const loadAssistantData = async () => {

    try {

      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        fetchBattery(),
        fetchRequests(),
        fetchMarket(),
        fetchListings(),
        fetchInsights()
      ]);

      const [
        batteryResult,
        requestsResult,
        marketResult,
        listingsResult,
        insightsResult,
      ] = results;

      const successfulSources = results.filter(
        (result) => result.status === "fulfilled"
      ).length;

      if (successfulSources === 0) {
        throw new Error(
          "The energy service could not be reached. Please try again in a moment."
        );
      }

      const batteryData =
        batteryResult.status === "fulfilled"
          ? batteryResult.value
          : null;

      const requestData =
        requestsResult.status === "fulfilled"
          ? requestsResult.value
          : [];

      const marketData =
        marketResult.status === "fulfilled"
          ? marketResult.value
          : null;

      const listingData =
        listingsResult.status === "fulfilled"
          ? listingsResult.value
          : [];

      const insightData =
        insightsResult.status === "fulfilled"
          ? insightsResult.value
          : null;

      setBattery(batteryData);

      // Only requests belonging to this producer
      const producerRequests =
        requestData.filter(
          (request) =>
            request.producer === username
        );

      setRequests(producerRequests);

      setMarket(marketData);

      setListings(listingData);

      setInsights(insightData);

    } catch (err) {

      console.error(
        "AI Assistant data error:",
        err
      );

      setError(
        "The energy service could not be reached. Please try again in a moment."
      );

    } finally {

      setLoading(false);
    }
  };

  // =========================================================
  // LOAD DATA WHEN PAGE OPENS
  // =========================================================

  useEffect(() => {

    if (!username) {

      setLoading(false);

      setError(
        "Producer username was not found."
      );

      return;
    }

    loadAssistantData();

    return () => {
      window.speechSynthesis.cancel();
    };

  }, [username]);

  // =========================================================
  // PRODUCER'S ACTIVE LISTINGS
  // =========================================================

  const producerListings = useMemo(() => {

    return listings.filter(
      (listing) =>
        listing.producer === username &&
        Number(listing.energy || 0) > 0
    );

  }, [listings, username]);

  // =========================================================
  // PRODUCER'S CURRENT ASKING PRICE
  // =========================================================

  const producerPrice = useMemo(() => {

    if (
      producerListings.length === 0
    ) {
      return null;
    }

    const prices =
      producerListings
        .map(
          (listing) =>
            Number(listing.price)
        )
        .filter(
          (price) =>
            Number.isFinite(price)
        );

    if (prices.length === 0) {
      return null;
    }

    return (
      prices.reduce(
        (sum, price) =>
          sum + price,
        0
      ) / prices.length
    );

  }, [producerListings]);

  // =========================================================
  // PENDING REQUESTS
  // =========================================================

  const pendingRequests =
    requests.filter(
      (request) =>
        request.status === "Pending"
    );

  // =========================================================
  // TOTAL REQUESTED ENERGY
  // =========================================================

  const totalRequestedEnergy =
    pendingRequests.reduce(
      (sum, request) =>
        sum +
        Number(
          request.energy || 0
        ),
      0
    );

  // =========================================================
  // MARKET DATA
  // =========================================================

  const marketSummary =
    market?.market_summary || {};

  const marketPrice =
    Number(
      marketSummary.average_price
    );

  const lowestMarketPrice =
    Number(
      marketSummary.lowest_price
    );

  const highestMarketPrice =
    Number(
      marketSummary.highest_price
    );

  const marketEnergy =
    Number(
      marketSummary.total_energy_available
    );

  const activeListings =
    Number(
      marketSummary.active_listings
    );

  // =========================================================
  // BATTERY DATA
  // =========================================================

  const batterySoc =
    Number(
      battery?.soc || 0
    );

  const availableEnergy =
    Number(
      battery?.available_energy_kwh || 0
    );

  const batteryCapacity =
    Number(
      battery?.capacity_kwh || 0
    );

  const pvPower =
    Number(
      battery?.pv_power || 0
    );

  const batteryState =
    battery?.state ||
    "Unknown";

  const batteryHealth =
    battery?.health ||
    "Unknown";

  const recommendedRequest =
    insights?.request_priority?.recommended_request || null;

  const nowRecommendation =
    insights?.what_to_do_now || null;

  const displayName = username
    ? `${username.charAt(0).toUpperCase()}${username.slice(1)}`
    : "Producer";

  const weatherSnapshot = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("energy_marketplace_weather") || "{}"
      );
    } catch {
      return {};
    }
  }, [showBriefing]);

  const weatherCondition =
    weatherSnapshot?.current?.condition?.text ||
    weatherSnapshot?.current?.condition ||
    "Weather information unavailable";

  const weatherIcon = useMemo(() => {
    const condition = String(weatherCondition).toLowerCase();
    if (condition.includes("thunder") || condition.includes("storm")) return "⛈️";
    if (condition.includes("rain") || condition.includes("drizzle")) return "🌧️";
    if (condition.includes("cloud") || condition.includes("overcast")) return "☁️";
    if (condition.includes("partly")) return "🌤️";
    if (condition.includes("sun") || condition.includes("clear")) return "☀️";
    return "🌤️";
  }, [weatherCondition]);

  const conciseRecommendationReason = useMemo(() => {
    const explanation = nowRecommendation?.explanation || "";
    const firstSentence = explanation.match(/^.*?[.!?](?:\s|$)/)?.[0];
    return firstSentence || "Live energy and market information is still being evaluated.";
  }, [nowRecommendation]);

  // =========================================================
  // ENERGY AFTER ALL PENDING REQUESTS
  // =========================================================

  const remainingAfterRequests =
    availableEnergy -
    totalRequestedEnergy;

  // =========================================================
  // AUTOMATIC BRIEFING
  // =========================================================

  const createBriefingText = () => {

    if (loading) {

      return `
I'm checking your latest energy information.

Give me a moment while I collect your battery, trading and market data.
`;
    }

    if (error) {

      return `
I couldn't load all of your live energy information right now.

${error}

Please check that the backend is running and try again.
`;
    }

    const requestNames =
      pendingRequests.length > 0
        ? pendingRequests
            .map(
              (request) =>
                request.consumer
            )
            .join(", ")
        : "no pending requests";

    let remainingMessage = "";

    if (
      remainingAfterRequests < 0
    ) {

      remainingMessage = `
Your pending requests add up to ${totalRequestedEnergy.toFixed(
        2
      )} kWh, which is more than your currently available ${availableEnergy.toFixed(
        2
      )} kWh. So you should not accept all of them at once.
`;

    } else {

      remainingMessage = `
If you supplied all the currently pending requests, you'd have about ${remainingAfterRequests.toFixed(
        2
      )} kWh left.
`;
    }

    let marketMessage = "";

    if (
      Number.isFinite(
        marketPrice
      ) &&
      marketPrice > 0
    ) {

      marketMessage = `
The current market is averaging around ₹${marketPrice.toFixed(
        2
      )} per kWh. Prices currently range from ₹${lowestMarketPrice.toFixed(
        2
      )} to ₹${highestMarketPrice.toFixed(
        2
      )} per kWh.
`;

    } else {

      marketMessage = `
There isn't enough active market data right now to calculate a reliable average price.
`;
    }

    let producerPriceMessage = "";

    if (
      Number.isFinite(
        producerPrice
      )
    ) {

      producerPriceMessage = `
Your active listings are currently averaging around ₹${producerPrice.toFixed(
        2
      )} per kWh.
`;

    } else {

      producerPriceMessage = `
You don't currently have an active energy listing.
`;
    }

    return `
Hello ${username}.

Here is your latest energy update.

Your battery is at ${batterySoc.toFixed(
      1
    )} percent, with about ${availableEnergy.toFixed(
      2
    )} kWh available out of ${batteryCapacity.toFixed(
      2
    )} kWh.

The battery is currently ${String(
      batteryState
    ).toLowerCase()}, and its health is ${String(
      batteryHealth
    ).toLowerCase()}.

Your solar system is currently showing ${pvPower.toFixed(
      2
    )} watts of PV power.

You have ${pendingRequests.length} pending buying request${
      pendingRequests.length === 1
        ? ""
        : "s"
    }.

They are ${requestNames}.

The pending requests together are asking for about ${totalRequestedEnergy.toFixed(
      2
    )} kWh.

${remainingMessage}

${marketMessage}

${producerPriceMessage}

There are currently ${activeListings} active market listing${
      activeListings === 1
        ? ""
        : "s"
    }, with about ${marketEnergy.toFixed(
      2
    )} kWh available in the market.

I'll keep these numbers based on the live data available from your system.
`;
  };

  // =========================================================
  // BRIEFING TEXT
  // =========================================================

  const briefingText =
    createBriefingText();

  // =========================================================
  // FIRST AI MESSAGE
  // =========================================================

  useEffect(() => {

    if (loading) {
      return;
    }

    const text =
      createBriefingText();

    setMessages([
      {
        id: Date.now(),
        sender: "ai",
        text,
      }
    ]);

  }, [
    loading,
    error,
    username,
    batterySoc,
    availableEnergy,
    batteryCapacity,
    batteryState,
    batteryHealth,
    pvPower,
    pendingRequests.length,
    totalRequestedEnergy,
    remainingAfterRequests,
    marketPrice,
    lowestMarketPrice,
    highestMarketPrice,
    marketEnergy,
    activeListings,
    producerPrice
  ]);

  // =========================================================
  // SPEAK
  // =========================================================

  const handleSpeak = (
    text = briefingText
  ) => {

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(
        text
      );

    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;

    speech.onstart = () => {
      setIsSpeaking(true);
    };

    speech.onend = () => {
      setIsSpeaking(false);
    };

    speech.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(
      speech
    );
  };

  // =========================================================
  // STOP SPEAKING
  // =========================================================

  const handleStop = () => {

    window.speechSynthesis.cancel();

    setIsSpeaking(false);
  };

  // =========================================================
  // CLOSE BRIEFING
  // =========================================================

  const handleCloseBriefing = () => {

    window.speechSynthesis.cancel();

    setIsSpeaking(false);

    setShowBriefing(false);
  };

  const handleOpenBriefing = () => {
    setShowBriefing(true);
    loadAssistantData();
  };

  // =========================================================
  // FIND SPECIFIC BUYER
  // =========================================================

  const findBuyer = (question) => {

    return pendingRequests.find(
      (request) =>
        question.includes(
          String(
            request.consumer
          ).toLowerCase()
        )
    );
  };

  // =========================================================
  // NATURAL LANGUAGE NEGOTIATION
  // =========================================================

  const isNegotiationMessage = (question) => {

    const q = question
      .toLowerCase()
      .trim();

    const negotiationWords = [
      "negotiate",
      "negotiation",
      "bargain",
      "counter offer",
      "counteroffer",
      "make an offer",
      "make offer",
      "offer",
      "deal"
    ];

    return negotiationWords.some(
      (word) => q.includes(word)
    );
  };

  // ---------------------------------------------------------
  // EXTRACT ENERGY FROM NATURAL LANGUAGE
  // ---------------------------------------------------------

  const extractNegotiationEnergy = (question) => {

    const patterns = [
      /(\d+(?:\.\d+)?)\s*kwh\b/i,
      /(\d+(?:\.\d+)?)\s*kw\s*h\b/i,
      /(\d+(?:\.\d+)?)\s*units?\b/i
    ];

    for (const pattern of patterns) {

      const match = question.match(pattern);

      if (match) {
        const value = Number(match[1]);

        if (Number.isFinite(value) && value > 0) {
          return value;
        }
      }
    }

    return null;
  };

  // ---------------------------------------------------------
  // EXTRACT OFFER FROM NATURAL LANGUAGE
  // ---------------------------------------------------------

  const extractNegotiationOffer = (question) => {

    const patterns = [
      /₹\s*(\d+(?:\.\d+)?)/i,
      /(?:rs\.?|rupees?)\s*(\d+(?:\.\d+)?)/i,
      /(?:pay|offer|at|for)\s*₹?\s*(\d+(?:\.\d+)?)/i
    ];

    for (const pattern of patterns) {

      const match = question.match(pattern);

      if (match) {
        const value = Number(match[1]);

        if (Number.isFinite(value) && value >= 0) {
          return value;
        }
      }
    }

    return null;
  };

  // ---------------------------------------------------------
  // FIND THE REAL PENDING CONSUMER
  // ---------------------------------------------------------

  const findNegotiationConsumer = (question) => {

    const q = question.toLowerCase();

    return pendingRequests.find((request) => {

      const consumer = String(
        request.consumer || ""
      ).toLowerCase();

      return consumer && q.includes(consumer);
    });
  };

  // ---------------------------------------------------------
  // FIND A REAL PRODUCER LISTING
  // ---------------------------------------------------------

  const findNegotiationListing = (requestedEnergy) => {

    const candidates = producerListings.filter(
      (listing) => {

        const energy = Number(listing.energy);
        const price = Number(listing.price);

        return (
          Number.isFinite(energy) &&
          energy > 0 &&
          Number.isFinite(price) &&
          price >= 0 &&
          energy >= requestedEnergy
        );
      }
    );

    if (candidates.length === 0) {
      return null;
    }

    return [...candidates].sort(
      (a, b) => Number(a.price) - Number(b.price)
    )[0];
  };

  // ---------------------------------------------------------
  // RUN REAL NEGOTIATION
  // ---------------------------------------------------------

  const runNaturalLanguageNegotiation = async (question) => {

    const energy = extractNegotiationEnergy(question);
    const offer = extractNegotiationOffer(question);
    const consumerRequest = findNegotiationConsumer(question);

    if (energy === null) {
      return `
I can negotiate the energy price for you.

How much energy should I negotiate? Please include the amount in kWh.

For example:

"Negotiate 5 kWh with gokul at ₹18 per kWh."
`;
    }

    if (offer === null) {
      return `
I understand that you want to negotiate ${energy.toFixed(2)} kWh.

What price should I offer per kWh?

For example:

"Offer ₹18 per kWh."
`;
    }

    if (pendingRequests.length === 0) {
      return `
I don't have any pending buyer request to negotiate against right now.

I won't invent a consumer or a transaction. A real pending buyer request is required for this producer-side negotiation.
`;
    }

    if (!consumerRequest) {
      const names = pendingRequests
        .map((request) => request.consumer)
        .filter(Boolean)
        .join(", ");

      return `
I understand the request: ${energy.toFixed(2)} kWh at ₹${offer.toFixed(2)} per kWh.

Which pending buyer should I negotiate with?

Current pending buyers: ${names || "none"}

You can say, for example:
"Negotiate ${energy.toFixed(2)} kWh with ${names || "the buyer"} at ₹${offer.toFixed(2)} per kWh."
`;
    }

    const listing = findNegotiationListing(energy);

    if (!listing) {
      return `
I couldn't find one of your active listings with at least ${energy.toFixed(2)} kWh available.

I won't invent a listing or available energy amount.
`;
    }

    try {

      setIsNegotiating(true);

      const response = await fetch(
        `${API}/trading/negotiate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            listing_id: listing.id,
            producer: username,
            consumer: consumerRequest.consumer,
            energy,
            producer_price: Number(listing.price),
            consumer_offer: offer
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "The negotiation request was rejected by the backend."
        );
      }

      await loadAssistantData();

      if (data.status === "Accepted") {
        return `
Negotiation accepted.

Buyer: ${data.consumer}
Energy: ${Number(data.energy).toFixed(2)} kWh
Producer asking price: ₹${Number(data.producer_price).toFixed(2)} per kWh
Buyer offer: ₹${Number(data.consumer_offer).toFixed(2)} per kWh
Agreed price: ₹${Number(data.negotiated_price).toFixed(2)} per kWh

The negotiation agent accepted the offer because it meets or exceeds the producer's asking price.
`;
      }

      if (data.status === "Counter Offer") {
        return `
Counter-offer generated.

Buyer: ${data.consumer}
Energy: ${Number(data.energy).toFixed(2)} kWh
Producer asking price: ₹${Number(data.producer_price).toFixed(2)} per kWh
Buyer offer: ₹${Number(data.consumer_offer).toFixed(2)} per kWh
Counter-offer: ₹${Number(data.negotiated_price).toFixed(2)} per kWh

The negotiation agent compared the real listing price, the buyer's offer and the current market conditions.
`;
      }

      return `
Negotiation result: ${data.status}.

Buyer: ${data.consumer}
Energy: ${Number(data.energy).toFixed(2)} kWh
Buyer offer: ₹${Number(data.consumer_offer).toFixed(2)} per kWh

No fabricated price or transaction was created.
`;

    } catch (err) {

      console.error(
        "Natural language negotiation error:",
        err
      );

      return `
I couldn't complete the negotiation.

${err.message}
`;

    } finally {
      setIsNegotiating(false);
    }
  };

  const getModelResponse = async (question, chatHistory) => {
    const token = localStorage.getItem("energy_marketplace_jwt");
    if (!token) {
      throw new Error("Please sign in again to use the AI assistant.");
    }

    const response = await fetch(`${API}/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: question,
        location: sharedLocation || undefined,
        history: chatHistory.slice(-8).map((item) => ({
          role: item.sender === "ai" ? "assistant" : "user",
          content: item.text,
        })),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.answer) {
      throw new Error(data.detail || "The AI service could not answer right now.");
    }
    return data.answer;
  };

  const shareLocation = () => {
    if (!navigator.geolocation) {
      setMessages((previous) => [
        ...previous,
        { id: Date.now(), sender: "ai", text: "Location sharing is not supported by this browser." },
      ]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSharedLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setMessages((previous) => [
          ...previous,
          { id: Date.now(), sender: "ai", text: "📍 Location shared for this chat. I can now check local weather and nearby solar businesses." },
        ]);
      },
      () => setMessages((previous) => [
        ...previous,
        { id: Date.now(), sender: "ai", text: "I could not access your location. Marketplace questions still work without it." },
      ]),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSend = async () => {

    const question = input.trim();

    if (!question || isNegotiating || isChatLoading) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: question
    };

    const chatHistory = messages;
    setMessages((previous) => [
      ...previous,
      userMessage
    ]);

    setInput("");

    try {
      setIsChatLoading(true);
      const answer = isNegotiationMessage(question)
        ? await runNaturalLanguageNegotiation(question)
        : await getModelResponse(question, chatHistory);

      setMessages((previous) => [
        ...previous,
        { id: Date.now() + 1, sender: "ai", text: answer }
      ]);
    } catch (error) {
      console.error("Producer AI chat error:", error);
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: error.message || "The AI service could not answer right now.",
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // =========================================================
  // ENTER KEY
  // =========================================================

  const handleKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSend();
    }
  };

  // =========================================================
  // FORMAT MESSAGE
  // =========================================================

  const formatMessage = (
    text
  ) => {

    return text
      .split("\n")
      .filter(
        (line) =>
          line.trim() !== ""
      )
      .map(
        (line, index) => (
          <p key={index}>
            {line}
          </p>
        )
      );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        .ai-section {
          width: 100%;
          min-height: 620px;

          background:
            radial-gradient(
              circle at 20% 0%,
              rgba(67, 213, 230, 0.08),
              transparent 35%
            ),
            #0d1828;

          border:
            1px solid rgba(255,255,255,0.08);

          border-radius: 18px;

          overflow: hidden;

          color: #edf1f7;

          font-family:
            Inter,
            sans-serif;

          display: flex;
          flex-direction: column;
        }

        .ai-chat-header {
          height: 70px;

          padding:
            14px 20px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          border-bottom:
            1px solid rgba(
              255,
              255,
              255,
              0.07
            );

          background:
            rgba(
              255,
              255,
              255,
              0.015
            );
        }

        .ai-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .ai-logo {
          width: 40px;
          height: 40px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #45d7e8,
              #8d6cf0
            );

          color: white;

          font-size: 19px;

          box-shadow:
            0 0 25px
            rgba(
              69,
              215,
              232,
              0.18
            );
        }

        .ai-name {
          font-size: 15px;
          font-weight: 700;
        }

        .ai-status {
          color: #6f8199;
          font-size: 10px;
          margin-top: 3px;
        }

        .ai-online {
          display: inline-block;

          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #5fd98a;

          margin-right: 5px;
        }

        .ai-chat-body {
          flex: 1;

          padding:
            25px 22px;

          overflow-y: auto;

          display: flex;
          flex-direction: column;

          gap: 18px;
        }

        .ai-welcome {
          text-align: center;

          padding:
            20px 10px 8px;
        }

        .ai-welcome-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .ai-welcome-title {
          font-size: 17px;
          font-weight: 700;
        }

        .ai-welcome-text {
          color: #7d8da4;
          font-size: 12px;
          margin-top: 5px;
        }

        .message-row {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-avatar {
          flex-shrink: 0;

          width: 30px;
          height: 30px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #17283e;

          font-size: 13px;
        }

        .message-content {
          max-width: 78%;
        }

        .message-bubble {
          padding:
            13px 15px;

          border-radius: 14px;

          font-size: 13px;

          line-height: 1.65;
        }

        .message-bubble p {
          margin:
            0 0 9px;
        }

        .message-bubble p:last-child {
          margin-bottom: 0;
        }

        .ai-message-bubble {
          background: #142337;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );

          color: #dce5ef;

          border-top-left-radius: 4px;
        }

        .user-message-bubble {
          background:
            linear-gradient(
              135deg,
              #245066,
              #39406c
            );

          color: white;

          border-top-right-radius: 4px;
        }

        .message-time {
          color: #64758b;

          font-size: 9px;

          margin-top: 5px;
        }

        .user .message-time {
          text-align: right;
        }

        .briefing-actions {
          display: flex;

          gap: 8px;

          margin-top: 12px;

          flex-wrap: wrap;
        }

        .briefing-button {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );

          background: #17283c;

          color: #9cabbf;

          padding:
            8px 12px;

          border-radius: 8px;

          font-size: 10px;

          font-weight: 600;

          cursor: pointer;
        }

        .briefing-button:hover {
          background: #20344d;
          color: white;
        }

        .briefing-button.speak {
          color: #55d9e5;
        }

        .ai-input-area {
          padding:
            15px 18px 18px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );

          background:
            rgba(
              8,
              15,
              25,
              0.5
            );
        }

        .ai-input-box {
          display: flex;
          align-items: flex-end;

          gap: 8px;

          background: #142236;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );

          border-radius: 13px;

          padding: 7px;
        }

        .ai-input {
          flex: 1;

          min-height: 40px;
          max-height: 100px;

          resize: none;

          border: none;
          outline: none;

          background: transparent;

          color: #edf1f7;

          font-family:
            Inter,
            sans-serif;

          font-size: 12px;

          padding: 10px;
        }

        .ai-input::placeholder {
          color: #61738a;
        }

        .send-button {
          width: 38px;
          height: 38px;

          border: none;

          border-radius: 9px;

          background:
            linear-gradient(
              135deg,
              #45d7e8,
              #8d6cf0
            );

          color: white;

          cursor: pointer;

          font-size: 15px;
        }

        .send-button:hover {
          transform:
            translateY(-1px);
        }

        .send-button:disabled {
          opacity: 0.35;

          cursor:
            not-allowed;

          transform: none;
        }

        .input-hint {
          color: #52647b;

          font-size: 9px;

          margin-top: 7px;

          padding-left: 4px;
        }

        .briefing-overlay {
          position: fixed;

          inset: 0;

          background:
            rgba(
              0,
              0,
              0,
              0.58
            );

          backdrop-filter:
            blur(5px);

          display: flex;

          align-items: center;
          justify-content: center;

          padding: 20px;

          z-index: 9999;
        }

        .briefing-popup {
          width:
            min(
              720px,
              94vw
            );

          max-height: 85vh;

          overflow-y: auto;

          background: #101c2d;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.10
            );

          border-radius: 20px;

          box-shadow:
            0 30px 90px
            rgba(
              0,
              0,
              0,
              0.60
            );

          animation:
            popupIn
            0.25s
            ease-out;
        }

        @keyframes popupIn {

          from {
            opacity: 0;

            transform:
              translateY(15px)
              scale(0.98);
          }

          to {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);
          }
        }

        .briefing-header {
          padding:
            18px 21px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        .briefing-title {
          display: flex;

          align-items: center;

          gap: 10px;
        }

        .briefing-icon {
          width: 38px;
          height: 38px;

          border-radius: 50%;

          display: flex;

          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #45d7e8,
              #8d6cf0
            );

          font-size: 18px;
        }

        .briefing-title-text {
          font-size: 15px;

          font-weight: 700;
        }

        .briefing-subtitle {
          color: #71839a;

          font-size: 10px;

          margin-top: 3px;
        }

        .close-button {
          width: 33px;
          height: 33px;

          border: none;

          border-radius: 50%;

          background:
            rgba(
              255,
              255,
              255,
              0.06
            );

          color: #a1aec0;

          font-size: 19px;

          cursor: pointer;
        }

        .close-button:hover {
          background:
            rgba(
              255,
              255,
              255,
              0.12
            );

          color: white;
        }

        .briefing-content {
          padding: 25px;
        }

        .briefing-greeting {
          font-size: 21px;

          font-weight: 700;

          margin-bottom: 16px;
        }

        .briefing-text {
          color: #dce5ef;

          font-size: 13px;

          line-height: 1.75;
        }

        .briefing-text p {
          margin:
            0 0 14px;
        }

        .briefing-cards {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              1fr
            );

          gap: 10px;

          margin:
            20px 0;
        }

        .briefing-card {
          background: #162438;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );

          border-radius: 12px;

          padding: 14px;
        }

        .briefing-card-label {
          color: #75869c;

          font-size: 9px;

          text-transform:
            uppercase;

          letter-spacing:
            0.08em;
        }

        .briefing-card-value {
          font-size: 19px;

          font-weight: 700;

          margin-top: 6px;
        }

        .briefing-card-small {
          color: #74859b;

          font-size: 10px;

          margin-top: 3px;
        }

        .request-list {
          background: #162438;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );

          border-radius: 12px;

          overflow: hidden;

          margin-top: 18px;
        }

        .request-heading {
          padding:
            13px 15px;

          font-size: 11px;

          font-weight: 700;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );
        }

        .request-item {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          padding:
            11px 15px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.05
            );
        }

        .request-item:last-child {
          border-bottom: none;
        }

        .request-name {
          font-size: 12px;

          font-weight: 600;
        }

        .request-purpose {
          color: #72849b;

          font-size: 10px;

          margin-top: 2px;
        }

        .request-energy {
          color: #55d9e5;

          font-size: 11px;

          font-weight: 700;
        }

        .briefing-footer {
          display: flex;

          justify-content:
            flex-end;

          gap: 8px;

          padding:
            15px 20px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        .voice-button {
          border: none;

          border-radius: 8px;

          padding:
            10px 15px;

          background: #193c4c;

          color: #55d9e5;

          font-size: 11px;

          font-weight: 700;

          cursor: pointer;
        }

        .voice-button.stop {
          background: #3c2931;

          color: #ff9aaa;
        }

        /* Energix briefing: display-only styling; live data and chat APIs stay unchanged. */
        .briefing-overlay {
          background: rgba(45, 40, 30, 0.42);
          backdrop-filter: blur(7px);
        }

        .briefing-popup {
          width: min(1040px, calc(100vw - 48px));
          max-height: min(88vh, 900px);
          color: #25231e;
          background: #f7f0df;
          border: 2px solid #25231e;
          border-radius: 26px;
          box-shadow: 10px 11px 0 rgba(37, 35, 30, 0.28), 0 28px 75px rgba(37, 35, 30, 0.28);
        }

        .briefing-header, .briefing-footer {
          border-color: #d5c9af;
          background: #efe5ce;
        }

        .briefing-header { padding: 19px 25px; }
        .briefing-icon { color: #25231e; background: #f7c843; border: 1px solid #25231e; box-shadow: 2px 2px 0 #25231e; }
        .briefing-title-text { font-size: 18px; color: #25231e; }
        .briefing-subtitle { color: #625d53; font-size: 12px; }
        .close-button { color: #25231e; background: #f7f0df; border: 1px solid #9e927d; }
        .close-button:hover { color: #25231e; background: #f7c843; }
        .briefing-content { padding: 28px; }
        .briefing-greeting { max-width: 760px; color: #25231e; font-size: clamp(23px, 2.4vw, 31px); line-height: 1.28; margin-bottom: 23px; }
        .briefing-greeting span { display: block; font-size: .72em; font-weight: 500; margin-top: 5px; }
        .briefing-cards { margin: 0 0 22px; gap: 13px; }
        .briefing-card, .request-list {
          background: #fffcf4;
          border: 1.5px solid #c7baa0;
          border-radius: 16px;
          box-shadow: 2px 3px 0 rgba(37, 35, 30, 0.10);
        }
        .briefing-card { padding: 17px; }
        .briefing-card-label { color: #6a604f; font-size: 11px; font-weight: 800; letter-spacing: .1em; }
        .briefing-card-value { color: #25231e !important; font-size: 24px !important; line-height: 1.25; margin-top: 7px; }
        .briefing-card-small { color: #625d53; font-size: 13px; line-height: 1.45; margin-top: 5px; }
        .briefing-section { margin-top: 18px; }
        .briefing-section-title { color: #25231e; font-size: 16px; font-weight: 800; letter-spacing: .03em; margin: 0 0 10px; }
        .briefing-highlight { border-color: #b3922c; background: #fff5d5; }
        .briefing-action { color: #6c4e00 !important; font-size: 28px !important; }
        .briefing-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
        .briefing-detail-grid .briefing-card { min-height: 150px; }
        .recommended-request { border-color: #c89c2d; background: #fff7df; }
        .recommended-request .briefing-card-value { font-size: 21px !important; }
        .request-facts { display: grid; gap: 4px; margin-top: 9px; color: #514a3d; font-size: 13px; line-height: 1.4; }
        .weather-condition { display: flex; align-items: center; gap: 8px; color: #25231e; font-size: 18px; font-weight: 800; margin-top: 7px; }
        .weather-condition span { font-size: 24px; }
        .request-list { margin-top: 10px; }
        .request-heading { color: #25231e; background: #efe5ce; border-color: #d5c9af; font-size: 15px; padding: 14px 17px; }
        .request-item { align-items: flex-start; gap: 14px; border-color: #e5dcc9; padding: 14px 17px; }
        .request-name { color: #25231e; font-size: 15px; font-weight: 800; }
        .request-purpose { color: #625d53; font-size: 13px; line-height: 1.4; margin-top: 4px; }
        .request-energy { color: #6c4e00; font-size: 15px; white-space: nowrap; }
        .briefing-footer { padding: 15px 25px; }
        .voice-button { color: #25231e; background: #f7c843; border: 1px solid #25231e; border-radius: 10px; font-size: 13px; }
        .voice-button.stop { color: #7c221d; background: #fbe1dc; border-color: #b95c50; }
        .assistant-reopen-button {
          position: fixed; right: 24px; bottom: 24px; z-index: 9998;
          display: inline-flex; align-items: center; gap: 9px; padding: 13px 18px;
          color: #25231e; background: #f7c843; border: 2px solid #25231e; border-radius: 999px;
          box-shadow: 4px 4px 0 #25231e; cursor: pointer; font-size: 15px; font-weight: 800;
        }
        .assistant-reopen-button:hover { background: #ffda60; transform: translate(-1px, -1px); box-shadow: 5px 5px 0 #25231e; }

        @media(max-width:650px) {

          .ai-section {
            min-height: 550px;
          }

          .briefing-cards {
            grid-template-columns:
              1fr;
          }

          .briefing-detail-grid { grid-template-columns: 1fr; }

          .briefing-popup { width: calc(100vw - 24px); max-height: calc(100vh - 24px); }

          .briefing-header, .briefing-footer { padding-left: 17px; padding-right: 17px; }

          .briefing-content {
            padding: 18px;
          }

          .assistant-reopen-button { right: 16px; bottom: 16px; font-size: 14px; }

          .message-content {
            max-width: 88%;
          }
        }

      `}</style>

      {/* =====================================================
          NORMAL CHAT
      ===================================================== */}

      <div className="ai-section">

        <div className="ai-chat-header">

          <div className="ai-brand">

            <div
              className="ai-logo"
              style={{
                animation:
                  isSpeaking
                    ? "aiPulse 1.2s infinite"
                    : "none"
              }}
            >
              ✦
            </div>

            <div>

              <div className="ai-name">
                Energy Assistant
              </div>

              <div className="ai-status">

                <span className="ai-online"></span>

                Your personal energy secretary

              </div>

            </div>

          </div>

        </div>

        <div className="ai-chat-body">

          {!showBriefing &&
            messages.length === 1 && (
              <div className="ai-welcome">

                <div className="ai-welcome-icon">
                  ✦
                </div>

                <div className="ai-welcome-title">
                  How can I help you,{" "}
                  {username}?
                </div>

                <div className="ai-welcome-text">
                  Ask me anything about your
                  energy system.
                </div>

              </div>
            )}

          {messages.map(
            (message) => (

              <div
                key={message.id}
                className={
                  `message-row ${
                    message.sender ===
                    "user"
                      ? "user"
                      : ""
                  }`
                }
              >

                {message.sender ===
                  "ai" && (
                    <div className="message-avatar">
                      ✦
                    </div>
                  )}

                <div className="message-content">

                  <div
                    className={
                      `message-bubble ${
                        message.sender ===
                        "ai"
                          ? "ai-message-bubble"
                          : "user-message-bubble"
                      }`
                    }
                  >

                    {formatMessage(
                      message.text
                    )}

                    {message.sender ===
                      "ai" && (
                      <div className="briefing-actions">

                        <button
                          className="briefing-button speak"
                          onClick={() =>
                            handleSpeak(
                              message.text
                            )
                          }
                        >
                          🔊 Speak
                        </button>

                        {isSpeaking && (
                          <button
                            className="briefing-button"
                            onClick={
                              handleStop
                            }
                          >
                            ⏹ Stop
                          </button>
                        )}

                      </div>
                    )}

                  </div>

                  <div className="message-time">

                    {message.sender ===
                    "ai"
                      ? "Energy Assistant"
                      : "You"}

                  </div>

                </div>

              </div>

            )
          )}

        </div>

        <div className="ai-input-area">

          <div className="ai-input-box">

            <button
              className="send-button"
              type="button"
              onClick={shareLocation}
              disabled={isChatLoading}
              title={sharedLocation ? "Location shared for this chat" : "Share location for local weather and nearby businesses"}
              style={{
                background: sharedLocation ? "#1d8054" : undefined,
                fontSize: "14px",
              }}
            >
              📍
            </button>

            <textarea
              className="ai-input"
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Ask anything about your energy..."
              rows={1}
            />

            <button
              className="send-button"
              onClick={handleSend}
              disabled={
                !input.trim() ||
                isNegotiating
              }
              title={
                isNegotiating
                  ? "Negotiating..."
                  : "Send"
              }
            >
              {isNegotiating ? "…" : "➤"}
            </button>

          </div>

          <div className="input-hint">
            {isNegotiating
              ? "Negotiation agent is processing the live market data..."
              : "Press Enter to send"}
          </div>

        </div>

      </div>

      {/* =====================================================
          AUTOMATIC BRIEFING POPUP
      ===================================================== */}

      {showBriefing && (

        <div className="briefing-overlay">

          <div className="briefing-popup">

            <div className="briefing-header">

              <div className="briefing-title">

                <div className="briefing-icon">
                  ✦
                </div>

                <div>

                  <div className="briefing-title-text">
                    Energy Assistant
                  </div>

                  <div className="briefing-subtitle">
                    Your personal energy secretary
                  </div>

                </div>

              </div>

              <button
                className="close-button"
                onClick={
                  handleCloseBriefing
                }
                title="Close briefing"
              >
                ×
              </button>

            </div>

            <div className="briefing-content">

              <div className="briefing-greeting">

                {loading
                  ? "Checking your energy system..."
                  : <>
                      Hello, {displayName} 👋 I’m your personal energy assistant.
                      <span>Here’s a quick summary of your latest energy updates.</span>
                    </>}

              </div>

              {!loading &&
                !error && (
                  <>
                    <div className="briefing-cards">
                      <div className="briefing-card">
                        <div className="briefing-card-label">
                          Battery
                        </div>
                        <div className="briefing-card-value">{batterySoc.toFixed(1)}%</div>
                        <div className="briefing-card-small">
                          {availableEnergy.toFixed(2)} kWh available
                        </div>
                      </div>
                      <div className="briefing-card">
                        <div className="briefing-card-label">
                          PV Power
                        </div>
                        <div className="briefing-card-value">{pvPower.toFixed(2)} W</div>
                        <div className="briefing-card-small">
                          Current output
                        </div>
                      </div>
                      <div className="briefing-card">
                        <div className="briefing-card-label">
                          Market Price
                        </div>
                        <div className="briefing-card-value">
                          {Number.isFinite(
                            marketPrice
                          )
                            ? `₹${marketPrice.toFixed(
                                2
                              )}/kWh`
                            : "—"}
                        </div>
                        <div className="briefing-card-small">
                          Current market
                        </div>
                      </div>
                      <div className="briefing-card">
                        <div className="briefing-card-label">
                          Pending Requests
                        </div>
                        <div className="briefing-card-value">{pendingRequests.length}</div>
                        <div className="briefing-card-small">
                          {totalRequestedEnergy.toFixed(2)} kWh requested
                        </div>
                      </div>
                    </div>


                    <section className="briefing-section">
                      <h3 className="briefing-section-title">AI: What should I do now?</h3>
                      <div className="briefing-card briefing-highlight">
                        <div className="briefing-card-value briefing-action">{nowRecommendation?.action || "HOLD"}</div>
                        <div className="briefing-card-small">Why? {conciseRecommendationReason}</div>
                      </div>
                    </section>

                    <div className="briefing-detail-grid briefing-section">
                      <section className="briefing-card">
                        <h3 className="briefing-section-title">Suggested Selling Price</h3>
                        <div className="briefing-card-value">₹{Number(insights?.selling_price?.suggested_price || 0).toFixed(2)}/kWh</div>
                        <div className="briefing-card-small">{insights?.selling_price?.explanation || "Recommendation only; your listing price is never changed automatically."}</div>
                      </section>

                      <section className="briefing-card recommended-request">
                        <h3 className="briefing-section-title">Recommended Request</h3>
                        {recommendedRequest ? (
                          <>
                            <div className="briefing-card-value">{recommendedRequest.consumer}</div>
                            <div className="request-facts">
                              <span><strong>Reason:</strong> {recommendedRequest.reason || "No reason provided"}</span>
                              <span><strong>Energy:</strong> {Number(recommendedRequest.energy || 0).toFixed(2)} kWh</span>
                              <span><strong>Offer:</strong> ₹{Number(recommendedRequest.offered_price || 0).toFixed(2)}/kWh · {recommendedRequest.priority_level} priority</span>
                            </div>
                          </>
                        ) : <div className="briefing-card-small">No pending request is available to prioritize.</div>}
                      </section>
                    </div>

                    <div className="briefing-detail-grid briefing-section">
                      <section className="briefing-card">
                        <h3 className="briefing-section-title">Weather &amp; Solar</h3>
                        <div className="weather-condition"><span>{weatherIcon}</span>{weatherCondition}</div>
                        <div className="briefing-card-small">{insights?.weather_trading?.explanation || "Weather insight is unavailable until a current forecast is received."}</div>
                      </section>

                      <section className="briefing-card">
                        <h3 className="briefing-section-title">Market Price Prediction</h3>
                        <div className="briefing-card-value">₹{Number(insights?.market_prediction?.current_price || 0).toFixed(2)} → ₹{Number(insights?.market_prediction?.predicted_price || 0).toFixed(2)}</div>
                        <div className="briefing-card-small">{String(insights?.market_prediction?.direction || "stable").replace(/^./, (letter) => letter.toUpperCase())} · {insights?.market_prediction?.limited ? "Limited estimate. " : ""}{insights?.market_prediction?.explanation || "Prediction will appear when enough live data is available."}</div>
                      </section>
                    </div>

                    <div className="request-list">
                      <div className="request-heading">
                        Pending Buying Requests
                      </div>
                      {pendingRequests.length ===
                      0 ? (
                        <div className="request-item">
                          <div>
                            <div className="request-name">
                              No pending requests
                            </div>

                            <div className="request-purpose">
                              Your trading data currently
                              has no pending buyer requests.
                            </div>
                          </div>

                        </div>

                      ) : (
                        pendingRequests.map(
                          (request) => (
                            <div className="request-item" key={request.id}>
                              <div>
                                <div className="request-name">{request.consumer}</div>
                                <div className="request-purpose">
                                  {request.urgency || "Normal"} priority · {request.reason || "No reason provided"}
                                  {insights?.request_priority?.requests
                                    ?.find((item) => item.request_id === request.id)
                                    ?.reliability && (
                                    <> · Reliability {Number(insights.request_priority.requests.find((item) => item.request_id === request.id).reliability.score).toFixed(0)}/100</>
                                  )}
                                </div>
                              </div>
                              <div className="request-energy">
                                {Number(request.energy || 0).toFixed(2)} kWh
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>

                  </>
                )}

              {error && (

                <div
                  className="briefing-text"
                  style={{
                    color:
                      "#ff9aaa"
                  }}
                >

                  <p>
                    {error}
                  </p>

                  <p>
                    Make sure your FastAPI
                    backend is running and
                    then retry the connection.
                  </p>

                  <button
                    type="button"
                    className="briefing-button"
                    onClick={loadAssistantData}
                    disabled={loading}
                    style={{ marginTop: 8 }}
                  >
                    {loading ? "Retrying..." : "Retry connection"}
                  </button>

                </div>

              )}

              {loading && (

                <div className="briefing-text">

                  <p>
                    I'm collecting your
                    latest battery,
                    trading and market
                    information...
                  </p>

                </div>

              )}

            </div>

            <div className="briefing-footer">

              <button
                className="voice-button"
                onClick={() =>
                  handleSpeak(
                    briefingText
                  )
                }
                disabled={loading}
              >
                🔊{" "}
                {isSpeaking
                  ? "Speaking..."
                  : "Speak"}
              </button>

              <button
                className="voice-button stop"
                onClick={
                  handleStop
                }
              >
                ⏹ Stop
              </button>

            </div>

          </div>

        </div>

      )}

      {!showBriefing && (
        <button
          type="button"
          className="assistant-reopen-button"
          onClick={handleOpenBriefing}
          aria-label="Open Energy Assistant"
        >
          ✦ Energy Assistant
        </button>
      )}

    </>
  );
}
