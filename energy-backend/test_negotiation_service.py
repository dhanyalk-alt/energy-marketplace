import unittest

from app.services.negotiation_service import calculate_negotiation_price


class NegotiationServiceTests(unittest.TestCase):
    def test_rejects_when_requested_energy_exceeds_available(self):
        result = calculate_negotiation_price(
            producer_price=20,
            consumer_offer=18,
            market_price=19,
            available_energy=4,
            requested_energy=5,
        )

        self.assertEqual(result["decision"], "Rejected")
        self.assertIsNone(result["negotiated_price"])

    def test_offer_at_asking_price_stays_pending_for_producer(self):
        result = calculate_negotiation_price(
            producer_price=20,
            consumer_offer=20,
            market_price=19,
            available_energy=10,
            requested_energy=5,
        )

        self.assertEqual(result["decision"], "Pending")
        self.assertEqual(result["negotiated_price"], 20)

    def test_counter_offer_stays_within_consumer_and_producer_prices(self):
        result = calculate_negotiation_price(
            producer_price=20,
            consumer_offer=14,
            market_price=18,
            available_energy=10,
            requested_energy=5,
        )

        self.assertEqual(result["decision"], "Pending")
        self.assertGreaterEqual(result["negotiated_price"], 14)
        self.assertLessEqual(result["negotiated_price"], 20)

    def test_high_energy_request_moves_price_toward_producer_price(self):
        low_demand = calculate_negotiation_price(
            producer_price=20,
            consumer_offer=14,
            market_price=17,
            available_energy=10,
            requested_energy=2,
        )
        high_demand = calculate_negotiation_price(
            producer_price=20,
            consumer_offer=14,
            market_price=17,
            available_energy=10,
            requested_energy=9,
        )

        self.assertGreaterEqual(
            high_demand["negotiated_price"],
            low_demand["negotiated_price"],
        )


if __name__ == "__main__":
    unittest.main()
