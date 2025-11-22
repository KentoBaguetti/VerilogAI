from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.core.llm import stream_vertex_ai

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatContext(BaseModel):
    code: str
    filePath: Optional[str] = None
    language: Optional[str] = "verilog"
    selection: Optional[str] = None
    cursorLine: Optional[int] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[ChatContext] = None

@router.post("/stream")
def chat_stream(req: ChatRequest):
    # Build the messages list
    final_messages = []
    
    # Add System / Context message
    system_content = "You are an expert Verilog hardware engineering assistant. You help users write, debug, and simulate Verilog code.\n"
    
    if req.context:
        system_content += f"\nContext:\nFile: {req.context.filePath or 'Unknown'}\n"
        if req.context.cursorLine is not None:
            system_content += f"Cursor Line: {req.context.cursorLine}\n"
        
        system_content += f"\nCurrent Code Content:\n```verilog\n{req.context.code}\n```\n"
        
        if req.context.selection:
             system_content += f"\nSelected Code:\n```verilog\n{req.context.selection}\n```\n"
    
    # Some models prefer system prompt as the first message with role 'system'
    # If the model doesn't support 'system', this might need to be merged into the first user message.
    # We will try 'system' role first.
    final_messages.append({"role": "system", "content": system_content})
    
    for msg in req.messages:
        final_messages.append(msg.model_dump())

    return StreamingResponse(
        stream_vertex_ai(final_messages),
        media_type="text/event-stream"
    )

