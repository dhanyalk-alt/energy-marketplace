import asyncio
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


SYSTEM_INSTRUCTIONS = """
You are the Energy Marketplace assistant. Answer concisely and only from the
marketplace context supplied by the application. Do not invent prices, battery
readings, listings, negotiation statuses, or actions. You cannot accept,
reject, or create a trade: instruct the user to use the explicit marketplace
controls for those actions.
""".strip()


def _request_response(api_key: str, payload: dict) -> dict:
    request = Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


async def generate_assistant_response(message: str, context: dict) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("AI assistant is not configured.")

    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-5"),
        "instructions": SYSTEM_INSTRUCTIONS,
        "input": (
            f"Marketplace context:\n{json.dumps(context)}\n\n"
            f"User question:\n{message}"
        ),
        "store": False,
    }

    try:
        response = await asyncio.to_thread(
            _request_response,
            api_key,
            payload,
        )
    except (HTTPError, URLError) as error:
        raise RuntimeError("The AI provider request failed.") from error

    answer = str(response.get("output_text", "")).strip()
    if not answer:
        raise RuntimeError("The AI provider returned an empty response.")

    return answer
