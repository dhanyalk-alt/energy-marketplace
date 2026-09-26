"""Server-only Gemini configuration loaded from energy-backend/.env."""

import logging
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


logger = logging.getLogger(__name__)
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"

# Absolute path: works regardless of the directory from which uvicorn starts.
load_dotenv(dotenv_path=ENV_PATH, override=False)


@dataclass(frozen=True)
class GeminiSettings:
    api_key: str | None
    model: str


@dataclass(frozen=True)
class OllamaSettings:
    base_url: str
    model: str


def get_gemini_settings() -> GeminiSettings:
    # Also pick up a newly created/updated .env in local development without
    # exposing its values. A production service should still be restarted
    # after a credential rotation.
    load_dotenv(dotenv_path=ENV_PATH, override=False)
    return GeminiSettings(
        api_key=os.getenv("GEMINI_API_KEY", "").strip() or None,
        model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip() or "gemini-3.8-flash",
    )


def get_ollama_settings() -> OllamaSettings:
    """Configuration for the optional local Ollama fallback."""
    load_dotenv(dotenv_path=ENV_PATH, override=False)
    return OllamaSettings(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/"),
        model=os.getenv("OLLAMA_MODEL", "qwen3:4b").strip() or "qwen3:4b",
    )


def get_ai_provider() -> str:
    """Return the selected provider; auto means Gemini then local Ollama."""
    load_dotenv(dotenv_path=ENV_PATH, override=False)
    provider = os.getenv("AI_PROVIDER", "auto").strip().lower()
    return provider if provider in {"auto", "gemini", "ollama"} else "auto"


def validate_gemini_configuration() -> GeminiSettings:
    """Log a safe startup result without ever logging credentials."""
    settings = get_gemini_settings()
    if not settings.api_key:
        logger.warning("GEMINI_API_KEY is missing from energy-backend/.env")
    else:
        logger.info("Gemini configuration loaded")
    return settings
