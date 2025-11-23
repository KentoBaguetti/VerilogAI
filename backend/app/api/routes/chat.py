from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from openai import OpenAI

from app.core.config import settings

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
    isAgentic: Optional[bool] = False

def stream_openai(messages: List[Dict[str, str]]):
    import json
    
    if not settings.OPENAI_API_KEY:
        error_msg = json.dumps({"error": "OPENAI_API_KEY is not set in the backend environment. Please add it to your .env file."})
        yield f"data: {error_msg}\n\n"
        yield "data: [DONE]\n\n"
        return

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    try:
        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                data = json.dumps({"content": content})
                yield f"data: {data}\n\n"
        
        yield "data: [DONE]\n\n"

    except Exception as e:
        error_msg = json.dumps({"error": str(e)})
        yield f"data: {error_msg}\n\n"
        yield "data: [DONE]\n\n"

@router.post("/stream")
def chat_stream(req: ChatRequest):
    # Build the messages list
    final_messages = []
    
    # Add System / Context message
    if req.isAgentic:
        # Agentic mode: focus on code changes with formatted description
        system_content = """You are an expert Verilog code editor assistant. When the user requests code changes, you should:

1. Provide a brief description of what you're changing and why (2-4 sentences)
2. Then provide the complete modified code in a verilog code block

FORMATTING GUIDELINES:
- Use markdown formatting for emphasis (bold, italic, bullet points, etc.)
- Keep the description concise and focused on WHAT changed and WHY
- Use bullet points (•) to list multiple changes clearly
- Then provide the full modified code in a ```verilog code block

Example response format:
"I've added an **active-low reset signal** to your module. The reset will asynchronously clear the output when asserted low.

Key changes:
• Added `rst_n` input port
• Modified assign statement with ternary operator
• Output clears to 0 on reset

```verilog
[full code here]
```"

Keep descriptions clear and professional. Use markdown to highlight important terms.
"""
    else:
        # Normal chat mode: conversational assistant
        system_content = "You are an expert Verilog hardware engineering assistant. You help users write, debug, and simulate Verilog code.\n"
    
    if req.context:
        system_content += f"\nContext:\nFile: {req.context.filePath or 'Unknown'}\n"
        if req.context.cursorLine is not None:
            system_content += f"Cursor Line: {req.context.cursorLine}\n"
        
        system_content += f"\nCurrent Code Content:\n```verilog\n{req.context.code}\n```\n"
        
        if req.context.selection:
            system_content += f"\nSelected Code:\n```verilog\n{req.context.selection}\n```\n"
    
    final_messages.append({"role": "system", "content": system_content})
    
    for msg in req.messages:
        final_messages.append(msg.model_dump())

    return StreamingResponse(
        stream_openai(final_messages),
        media_type="text/event-stream"
    )

