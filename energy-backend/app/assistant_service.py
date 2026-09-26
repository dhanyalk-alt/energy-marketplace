"""Gemini-backed natural-language assistant with controlled server-side tools."""

import asyncio
import json
import logging
from typing import Awaitable, Callable

import httpx

try:
    from google import genai
    from google.genai import types
except ModuleNotFoundError:
    genai = types = None

from app.ai_config import get_ai_provider, get_gemini_settings, get_ollama_settings
from app.assistant_tools import TOOL_DECLARATIONS


logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTIONS = """
You are the Energy Marketplace's natural-language assistant. Be conversational,
clear, and helpful for general questions about renewable energy, solar power,
smart grids, battery storage, and this marketplace.

Use a tool whenever the user asks for current marketplace facts, their requests,
battery status, weather, nearby solar businesses, or current news. Never invent
dynamic values, names, prices, locations, weather, businesses, sources, or
news. If a tool says information is unavailable, explain that plainly. Respect
the authenticated user's role and private data. You may explain how to use
visible controls, but you must never accept, reject, create, alter, or execute
trades, negotiations, requests, or battery actions.

When responding to a current-news tool result, include the provided article
source and URL. Only request location tools when relevant. If location is not
available, tell the user to select Share location; never request or infer a
location yourself.
""".strip()

ToolExecutor = Callable[[str, dict], Awaitable[dict]]


class AssistantServiceError(RuntimeError):
    def __init__(self, category: str, public_detail: str):
        super().__init__(public_detail)
        self.category = category
        self.public_detail = public_detail


def _provider_error(error: Exception) -> AssistantServiceError:
    text = str(error).lower()
    if "api key" in text or "unauthenticated" in text or "authentication" in text:
        return AssistantServiceError("invalid_api_key", "Gemini authentication failed. Check the server API key.")
    if "quota" in text or "billing" in text or "resource exhausted" in text:
        return AssistantServiceError("insufficient_credits", "The Gemini API account has insufficient quota or access.")
    if "model" in text and ("not found" in text or "unsupported" in text):
        return AssistantServiceError("invalid_model", "The configured Gemini model is unavailable for this API key.")
    if any(token in text for token in (
        "connection", "connecterror", "network", "timeout", "winerror 10013",
        "forbidden by its access permissions",
    )):
        return AssistantServiceError(
            "network_api_error",
            "The server cannot reach Gemini. Check internet access, firewall, proxy, or antivirus settings.",
        )
    return AssistantServiceError("gemini_api_error", "The Gemini service is temporarily unavailable.")


def _tool_config():
    declarations = [
        types.FunctionDeclaration(
            name=item["name"],
            description=item["description"],
            parametersJsonSchema=item["parametersJsonSchema"],
        )
        for item in TOOL_DECLARATIONS
    ]
    return types.GenerateContentConfig(
        systemInstruction=SYSTEM_INSTRUCTIONS,
        tools=[types.Tool(functionDeclarations=declarations)],
        automaticFunctionCalling=types.AutomaticFunctionCallingConfig(disable=True),
    )


def _contents(message: str, history: list[dict]):
    items = []
    for turn in history[-12:]:
        role = "model" if turn["role"] == "assistant" else "user"
        items.append(types.Content(role=role, parts=[types.Part.from_text(text=turn["content"])]))
    items.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))
    return items


def _ollama_tools() -> list[dict]:
    """Convert the shared safe tool schemas to Ollama's local API format."""
    return [
        {
            "type": "function",
            "function": {
                "name": item["name"],
                "description": item["description"],
                "parameters": item["parametersJsonSchema"],
            },
        }
        for item in TOOL_DECLARATIONS
    ]


async def _ollama_response(message: str, history: list[dict], tool_executor: ToolExecutor) -> str:
    settings = get_ollama_settings()
    messages = [{"role": "system", "content": SYSTEM_INSTRUCTIONS}]
    messages.extend({"role": turn["role"], "content": turn["content"]} for turn in history[-12:])
    messages.append({"role": "user", "content": message})
    url = f"{settings.base_url}/api/chat"

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            for _ in range(3):
                response = await client.post(
                    url,
                    json={
                        "model": settings.model,
                        "messages": messages,
                        "tools": _ollama_tools(),
                        "stream": False,
                    },
                )
                response.raise_for_status()
                assistant_message = response.json().get("message", {})
                messages.append(assistant_message)
                calls = assistant_message.get("tool_calls") or []
                if not calls:
                    answer = str(assistant_message.get("content") or "").strip()
                    if answer:
                        return answer
                    raise AssistantServiceError("empty_response", "The local AI returned an empty response.")

                for call in calls:
                    function = call.get("function", {})
                    name = str(function.get("name") or "")
                    arguments = function.get("arguments") or {}
                    result = await tool_executor(name, dict(arguments))
                    messages.append({
                        "role": "tool",
                        "tool_name": name,
                        "content": json.dumps(result),
                    })
    except httpx.ConnectError as error:
        logger.warning("Ollama fallback failed: category=ollama_not_running")
        raise AssistantServiceError(
            "ollama_not_running",
            "Gemini is unavailable and the local AI is not running. Install Ollama, run 'ollama pull qwen3:4b', then start Ollama.",
        ) from error
    except httpx.HTTPStatusError as error:
        logger.warning("Ollama fallback failed: status=%s", error.response.status_code)
        raise AssistantServiceError(
            "ollama_model_error",
            f"The local AI model '{settings.model}' is unavailable. Run 'ollama pull {settings.model}'.",
        ) from error
    except httpx.HTTPError as error:
        logger.warning("Ollama fallback failed: category=ollama_network_error type=%s", type(error).__name__)
        raise AssistantServiceError("ollama_network_error", "The local AI service could not be reached.") from error

    raise AssistantServiceError("tool_loop_limit", "The local AI could not complete its tool request.")


async def _gemini_response(message: str, history: list[dict], tool_executor: ToolExecutor) -> str:
    settings = get_gemini_settings()
    if not settings.api_key:
        raise AssistantServiceError("missing_api_key", "AI service is unavailable. The server administrator must configure Gemini.")
    if genai is None or types is None:
        raise AssistantServiceError("missing_api_library", "AI service is unavailable because the Gemini dependency is not installed.")

    client = genai.Client(api_key=settings.api_key)
    contents = _contents(message, history)
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.model,
            contents=contents,
            config=_tool_config(),
        )

        for _ in range(3):
            calls = list(getattr(response, "function_calls", None) or [])
            if not calls:
                break
            contents.append(response.candidates[0].content)
            tool_parts = []
            for call in calls:
                name = str(getattr(call, "name", ""))
                arguments = dict(getattr(call, "args", {}) or {})
                result = await tool_executor(name, arguments)
                tool_parts.append(types.Part.from_function_response(name=name, response={"result": result}))
            contents.append(types.Content(role="tool", parts=tool_parts))
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=settings.model,
                contents=contents,
                config=_tool_config(),
            )
    except Exception as error:
        categorized = _provider_error(error)
        logger.warning("Gemini assistant request failed: category=%s type=%s", categorized.category, type(error).__name__)
        raise categorized from error

    answer = str(getattr(response, "text", "") or "").strip()
    if not answer:
        raise AssistantServiceError("empty_response", "The AI service returned an empty response.")
    return answer


async def generate_assistant_response(message: str, history: list[dict], tool_executor: ToolExecutor) -> str:
    """Use Gemini by default and transparently fall back to local Ollama."""
    provider = get_ai_provider()
    if provider == "ollama":
        return await _ollama_response(message, history, tool_executor)

    try:
        return await _gemini_response(message, history, tool_executor)
    except AssistantServiceError as error:
        if provider == "gemini" or error.category not in {
            "missing_api_key", "missing_api_library", "network_api_error", "gemini_api_error",
        }:
            raise
        logger.info("Gemini unavailable (%s); trying local Ollama fallback", error.category)
        return await _ollama_response(message, history, tool_executor)
