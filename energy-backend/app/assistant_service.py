import asyncio
import json
import logging

try:
    from openai import (
        APIConnectionError,
        APIError,
        APITimeoutError,
        AuthenticationError,
        BadRequestError,
        NotFoundError,
        OpenAI,
        PermissionDeniedError,
        RateLimitError,
    )
except ModuleNotFoundError:  # Optional dependency for AI features.
    APIConnectionError = APIError = APITimeoutError = AuthenticationError = BadRequestError = NotFoundError = Exception
    PermissionDeniedError = RateLimitError = Exception
    OpenAI = None

from app.ai_config import get_openai_settings


logger = logging.getLogger(__name__)


SYSTEM_INSTRUCTIONS = """
You are a helpful, natural-language Energy Marketplace assistant. Understand
ordinary conversational phrasing, follow-up questions, incomplete sentences,
and requests in English or Indian English. Answer general energy, renewable
energy, trading, battery, negotiation, and marketplace-use questions naturally.

For live marketplace facts, use only the authenticated server context below.
If the supplied context has no data to answer a live question, say so plainly;
never invent prices, battery readings, listings, transaction history, or
statuses. Clearly label recommendations as recommendations. You cannot accept,
reject, create, or alter a trade, listing, negotiation, or battery: tell the
user which visible marketplace control they can use instead. Do not reveal
private data belonging to another user.
""".strip()


class AssistantServiceError(RuntimeError):
    """Safe browser detail with a categorized server-side failure."""

    def __init__(self, category: str, public_detail: str):
        super().__init__(public_detail)
        self.category = category
        self.public_detail = public_detail


def _provider_error(error: Exception) -> AssistantServiceError:
    if isinstance(error, AuthenticationError):
        return AssistantServiceError("invalid_api_key", "AI authentication failed. Check the server API key.")
    if isinstance(error, PermissionDeniedError):
        return AssistantServiceError("insufficient_api_access", "The server API key does not have access to this AI service.")
    if isinstance(error, RateLimitError):
        code = str(getattr(error, "code", "") or "")
        category = "insufficient_credits" if any(token in code for token in ("credit", "spend", "usage")) else "rate_limited"
        detail = "The AI account has insufficient credits or API access." if category == "insufficient_credits" else "The AI service is temporarily rate limited."
        return AssistantServiceError(category, detail)
    if isinstance(error, (NotFoundError, BadRequestError)):
        return AssistantServiceError("invalid_model", "The configured AI model is unavailable for this API project.")
    if isinstance(error, (APIConnectionError, APITimeoutError)):
        return AssistantServiceError("network_api_error", "The server could not reach the AI service.")
    if isinstance(error, APIError):
        return AssistantServiceError("openai_api_error", "The AI service is temporarily unavailable.")
    return AssistantServiceError("application_error", "The AI assistant encountered an application error.")


async def generate_assistant_response(message: str, context: dict, history: list[dict] | None = None) -> str:
    settings = get_openai_settings()
    if not settings.api_key:
        raise AssistantServiceError("missing_api_key", "AI service is unavailable. The server administrator must configure it.")
    if OpenAI is None:
        raise AssistantServiceError("missing_api_library", "AI service is unavailable because the optional OpenAI dependency is not installed.")

    conversation = [
        {"role": turn["role"], "content": turn["content"]}
        for turn in (history or [])
    ]
    conversation.append({"role": "user", "content": message})

    payload = {
        "model": settings.model,
        "instructions": SYSTEM_INSTRUCTIONS,
        "input": (
            f"Authenticated live marketplace context (JSON):\n{json.dumps(context)}\n\n"
            f"Conversation:\n{json.dumps(conversation)}"
        ),
        "store": False,
    }

    try:
        client = OpenAI(api_key=settings.api_key, timeout=20.0, max_retries=1)
        response = await asyncio.to_thread(
            lambda: client.responses.create(**payload),
        )
    except Exception as error:
        categorized = _provider_error(error)
        logger.warning("OpenAI assistant request failed: category=%s type=%s", categorized.category, type(error).__name__)
        raise categorized from error

    answer = str(response.output_text or "").strip()
    if not answer:
        logger.warning("OpenAI assistant request failed: category=empty_response")
        raise AssistantServiceError("empty_response", "The AI service returned an empty response.")

    return answer
