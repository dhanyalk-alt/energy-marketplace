# =========================================================
# NEGOTIATION SERVICE
# =========================================================


def calculate_negotiation_price(
    producer_price: float,
    consumer_offer: float,
    market_price: float,
    available_energy: float,
    requested_energy: float,
):
    """
    AI-style energy negotiation engine.

    IMPORTANT WORKFLOW:

    Consumer makes an offer
            ↓
    AI calculates a negotiated/counter price
            ↓
    Negotiation remains PENDING
            ↓
    Producer decides ACCEPT / REJECT
            ↓
    Only after ACCEPT:
        - BuyRequest is created
        - Transaction is created
        - Energy is deducted

    This function ONLY calculates the price.
    It does NOT create a transaction.
    It does NOT deduct energy.
    """

    # =====================================================
    # 1. VALIDATION
    # =====================================================

    if producer_price < 0:
        raise ValueError(
            "Producer price cannot be negative."
        )

    if consumer_offer < 0:
        raise ValueError(
            "Consumer offer cannot be negative."
        )

    if market_price < 0:
        raise ValueError(
            "Market price cannot be negative."
        )

    if available_energy < 0:
        raise ValueError(
            "Available energy cannot be negative."
        )

    if requested_energy <= 0:
        raise ValueError(
            "Requested energy must be greater than zero."
        )

    # =====================================================
    # 2. CHECK ENERGY AVAILABILITY
    # =====================================================

    if requested_energy > available_energy:

        return {
            "negotiated_price": None,
            "decision": "Rejected",
            "reason": (
                "The requested energy is greater than "
                "the available energy."
            ),
        }

    if available_energy == 0:

        return {
            "negotiated_price": None,
            "decision": "Rejected",
            "reason": (
                "No energy is currently available."
            ),
        }

    # =====================================================
    # 3. CONSUMER OFFER MEETS PRODUCER PRICE
    # =====================================================
    #
    # Example:
    #
    # Producer price = ₹20
    # Consumer offer = ₹20
    #
    # AI price = ₹20
    #
    # BUT:
    #
    # The negotiation is STILL PENDING.
    #
    # The producer must explicitly accept it.
    #
    # =====================================================

    if consumer_offer >= producer_price:

        return {
            "negotiated_price": round(
                producer_price,
                2,
            ),

            "decision": "Pending",

            "reason": (
                "The consumer's offer meets or exceeds "
                "the producer's asking price. The AI "
                "suggests the producer's asking price. "
                "Producer approval is still required."
            ),
        }

    if consumer_offer > producer_price:
        return {
            "negotiated_price": round(
                producer_price,
                2,
            ),
            "decision": "Pending",
            "reason": "Consumer offer exceeds producer price; AI aligns to producer price.",
        }

    # =====================================================
    # 4. CALCULATE ENERGY PRESSURE
    # =====================================================

    energy_pressure = (
        requested_energy
        / available_energy
    )

    # =====================================================
    # 5. BASIC MIDPOINT
    # =====================================================

    midpoint = (
        producer_price
        + consumer_offer
    ) / 2

    negotiated_price = midpoint

    # =====================================================
    # 6. MARKET-AWARE NEGOTIATION
    # =====================================================
    #
    # Example:
    #
    # Producer = ₹20
    # Consumer = ₹15
    # Market   = ₹18
    #
    # AI counter offer = ₹18
    #
    # =====================================================

    if (
        consumer_offer
        <= market_price
        <= producer_price
    ):

        negotiated_price = market_price

    # =====================================================
    # 7. HIGH ENERGY DEMAND
    # =====================================================
    #
    # If consumer wants a large portion of the listing,
    # move the price closer to producer price.
    #
    # =====================================================

    if energy_pressure >= 0.80:

        negotiated_price = (
            negotiated_price * 0.50
            + producer_price * 0.50
        )

    elif energy_pressure >= 0.50:

        negotiated_price = (
            negotiated_price * 0.75
            + producer_price * 0.25
        )

    # =====================================================
    # 8. KEEP PRICE INSIDE VALID RANGE
    # =====================================================
    #
    # AI counter offer must never be:
    #
    # lower than consumer offer
    #
    # OR
    #
    # higher than producer price
    #
    # =====================================================

    negotiated_price = max(
        consumer_offer,
        negotiated_price,
    )

    negotiated_price = min(
        producer_price,
        negotiated_price,
    )

    negotiated_price = round(
        negotiated_price,
        2,
    )

    # =====================================================
    # 9. FINAL AI DECISION
    # =====================================================
    #
    # IMPORTANT:
    #
    # Never mark the negotiation as "Accepted" here.
    #
    # Producer must make the final decision.
    #
    # Therefore:
    #
    # decision = "Pending"
    #
    # =====================================================

    if negotiated_price == producer_price:

        reason = (
            "The AI considered the producer's asking "
            "price, consumer offer, market price and "
            "energy availability. The suggested price "
            "is the producer's asking price. Producer "
            "approval is required."
        )

    elif negotiated_price == consumer_offer:

        reason = (
            "The AI calculated a price based on the "
            "consumer's offer, producer's asking price, "
            "market conditions and available energy. "
            "Producer approval is required."
        )

    else:

        reason = (
            "The AI calculated a counter offer using "
            "the producer's asking price, consumer's "
            "offer, current market price and available "
            "energy. Producer approval is required."
        )

    # =====================================================
    # 10. RETURN RESULT
    # =====================================================

    return {
        "negotiated_price": negotiated_price,

        # VERY IMPORTANT:
        # This must remain Pending.
        "decision": "Pending",

        "reason": reason,
    }