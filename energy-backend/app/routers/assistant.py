from fastapi import APIRouter, Depends, HTTPException

from app.assistant_service import generate_assistant_response
from app.dependencies import get_current_user
from app.schemas import AssistantChatRequest, AssistantChatResponse


router = APIRouter(prefix="/assistant", tags=["Assistant"])


@router.post("/chat", response_model=AssistantChatResponse)
async def chat(
    request: AssistantChatRequest,
    user: dict = Depends(get_current_user),
):
    try:
        answer = await generate_assistant_response(
            request.message,
            request.context,
        )
        return {"answer": answer}
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error))
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="The AI assistant could not generate a response.",
        )
