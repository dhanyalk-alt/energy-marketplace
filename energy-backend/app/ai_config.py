"""Server-only OpenAI configuration loaded from energy-backend/.env."""

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
class OpenAISettings:
    api_key: str | None
    model: str


def get_openai_settings() -> OpenAISettings:
    return OpenAISettings(
        api_key=os.getenv("OPENAI_API_KEY", "").strip() or None,
        model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna").strip() or "gpt-5.6-luna",
    )


def validate_openai_configuration() -> OpenAISettings:
    """Log a safe startup result without ever logging credentials."""
    settings = get_openai_settings()
    if not settings.api_key:
        logger.warning("OPENAI_API_KEY is missing from energy-backend/.env")
    else:
        logger.info("OpenAI configuration loaded")
    return settings
