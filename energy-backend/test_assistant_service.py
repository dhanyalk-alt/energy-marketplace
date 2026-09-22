import unittest
from unittest.mock import patch

from app.ai_config import OpenAISettings
from app.assistant_service import AssistantServiceError, generate_assistant_response


class _FakeResponse:
    output_text = "Hello from the test assistant."


class _FakeResponses:
    def __init__(self):
        self.payload = None

    def create(self, **payload):
        self.payload = payload
        return _FakeResponse()


class _FakeClient:
    def __init__(self, *args, **kwargs):
        self.responses = _FakeResponses()


class AssistantServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_missing_key_has_a_safe_category(self):
        with patch(
            "app.assistant_service.get_openai_settings",
            return_value=OpenAISettings(api_key=None, model="gpt-5.6-luna"),
        ):
            with self.assertRaises(AssistantServiceError) as raised:
                await generate_assistant_response("Hello", {}, [])

        self.assertEqual(raised.exception.category, "missing_api_key")
        self.assertNotIn("OPENAI_API_KEY", raised.exception.public_detail)

    async def test_server_side_sdk_receives_model_and_context(self):
        fake_client = _FakeClient()
        with patch(
            "app.assistant_service.get_openai_settings",
            return_value=OpenAISettings(api_key="test-key", model="gpt-5.6-luna"),
        ), patch("app.assistant_service.OpenAI", return_value=fake_client):
            answer = await generate_assistant_response(
                "Hello",
                {"role": "producer", "my_listings": []},
                [{"role": "user", "content": "Earlier question"}],
            )

        self.assertEqual(answer, "Hello from the test assistant.")
        self.assertEqual(fake_client.responses.payload["model"], "gpt-5.6-luna")
        self.assertIn("my_listings", fake_client.responses.payload["input"])


if __name__ == "__main__":
    unittest.main()
