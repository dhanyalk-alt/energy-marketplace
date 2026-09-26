import unittest
from unittest.mock import patch

from app.ai_config import GeminiSettings
from app.assistant_service import AssistantServiceError, generate_assistant_response


class _FakeResponse:
    text = "Hello from the Gemini test assistant."
    function_calls = []


class _FakeModels:
    def __init__(self):
        self.payload = None

    def generate_content(self, **payload):
        self.payload = payload
        return _FakeResponse()


class _ToolCall:
    name = "get_market_info"
    args = {}


class _ToolResponse:
    function_calls = [_ToolCall()]
    candidates = [type("Candidate", (), {"content": object()})()]
    text = ""


class _ToolThenTextModels:
    def __init__(self):
        self.payloads = []

    def generate_content(self, **payload):
        self.payloads.append(payload)
        return _ToolResponse() if len(self.payloads) == 1 else _FakeResponse()


class _FakeClient:
    def __init__(self, *args, **kwargs):
        self.models = _FakeModels()


async def _unused_tool(_name, _arguments):
    return {"available": False}


class AssistantServiceTests(unittest.IsolatedAsyncioTestCase):
    def test_socket_block_is_reported_as_a_network_error(self):
        from app.assistant_service import _provider_error

        error = _provider_error(Exception(
            "ConnectError: [WinError 10013] An attempt was made to access a socket in a way forbidden by its access permissions"
        ))

        self.assertEqual(error.category, "network_api_error")

    async def test_missing_key_has_a_safe_category(self):
        with patch(
            "app.assistant_service.get_gemini_settings",
            return_value=GeminiSettings(api_key=None, model="gemini-3.8-flash"),
        ), patch("app.assistant_service.get_ai_provider", return_value="gemini"):
            with self.assertRaises(AssistantServiceError) as raised:
                await generate_assistant_response("Hello", [], _unused_tool)

        self.assertEqual(raised.exception.category, "missing_api_key")
        self.assertNotIn("GEMINI_API_KEY", raised.exception.public_detail)

    async def test_server_side_sdk_receives_model_and_history(self):
        fake_client = _FakeClient()
        with patch(
            "app.assistant_service.get_gemini_settings",
            return_value=GeminiSettings(api_key="test-key", model="gemini-3.8-flash"),
        ), patch("app.assistant_service.get_ai_provider", return_value="gemini"), patch("app.assistant_service.genai.Client", return_value=fake_client):
            answer = await generate_assistant_response(
                "Hello",
                [{"role": "user", "content": "Earlier question"}],
                _unused_tool,
            )

        self.assertEqual(answer, "Hello from the Gemini test assistant.")
        self.assertEqual(fake_client.models.payload["model"], "gemini-3.8-flash")
        self.assertEqual(len(fake_client.models.payload["contents"]), 2)

    async def test_tool_call_is_executed_before_final_response(self):
        fake_client = _FakeClient()
        fake_client.models = _ToolThenTextModels()
        tool_calls = []

        async def execute_tool(name, arguments):
            tool_calls.append((name, arguments))
            return {"available": True, "lowest_price_per_kwh": 10}

        with patch(
            "app.assistant_service.get_gemini_settings",
            return_value=GeminiSettings(api_key="test-key", model="gemini-3.8-flash"),
        ), patch("app.assistant_service.get_ai_provider", return_value="gemini"), patch("app.assistant_service.genai.Client", return_value=fake_client):
            answer = await generate_assistant_response("Who is cheapest?", [], execute_tool)

        self.assertEqual(answer, "Hello from the Gemini test assistant.")
        self.assertEqual(tool_calls, [("get_market_info", {})])
        self.assertEqual(len(fake_client.models.payloads), 2)


if __name__ == "__main__":
    unittest.main()
