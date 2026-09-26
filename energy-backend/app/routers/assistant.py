from fastapi import APIRouter, Depends, HTTPException

import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.assistant_service import AssistantServiceError, generate_assistant_response
from app.assistant_tools import AssistantToolExecutor
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import AssistantChatRequest, AssistantChatResponse


logger = logging.getLogger(__name__)


router = APIRouter(prefix="/assistant", tags=["Assistant"])


@router.post("/chat", response_model=AssistantChatResponse)
async def chat(
    request: AssistantChatRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    try:
        # The executor exposes a small, safe set of read-only marketplace tools to
        # Gemini.  It deliberately receives only the authenticated user and the
        # location explicitly shared in this chat request.
        location = request.location.model_dump() if request.location else None
        tool_executor = AssistantToolExecutor(db, user, location)
        answer = await generate_assistant_response(
            request.message,
            [turn.model_dump() for turn in request.history],
            tool_executor.execute,
        )
        return {"answer": answer}
    except AssistantServiceError as error:
        logger.warning("AI assistant failed: category=%s", error.category)
        raise HTTPException(status_code=503, detail=error.public_detail)
    except SQLAlchemyError as error:
        logger.exception("AI assistant failed: category=application_database_error type=%s", type(error).__name__)
        raise HTTPException(status_code=503, detail="The assistant could not load marketplace data.")
    except Exception as error:
        logger.exception("AI assistant failed: category=application_error type=%s", type(error).__name__)
        raise HTTPException(
            status_code=502,
            detail="The AI assistant could not generate a response.",
        )
