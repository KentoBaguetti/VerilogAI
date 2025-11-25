# app/api/routes/generate.py

from typing import Any, Dict
import json
import traceback
import requests
import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from google.auth import default
from google.auth.transport.requests import Request
from google.auth.exceptions import DefaultCredentialsError
from app.core.config import settings

router = APIRouter(prefix="/generate", tags=["generate"])


class GenerateRequest(BaseModel):
    prompt: str
    suffix: str = ""
    max_tokens: int = 150
    temperature: float = 0.4


class GenerateResponse(BaseModel):
    text: str


def get_access_token() -> str:
    """
    Load ADC and return a fresh OAuth2 token with cloud-platform scope.
    """
    try:
        creds, _ = default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    except DefaultCredentialsError as e:
        raise RuntimeError(
            "Could not load Application Default Credentials.  Ensure that either:\n"
            "  • GOOGLE_APPLICATION_CREDENTIALS is set to a service-account JSON file\n"
            "  • or you ran `gcloud auth application-default login` inside this container.\n"
            f"Underlying error: {e}"
        ) from e

    try:
        creds.refresh(Request())
    except Exception as e:
        traceback.print_exc()
        raise RuntimeError("Failed to refresh ADC; see logs for details.") from e

    if not creds.token:
        raise RuntimeError("Failed to obtain a valid access token from ADC.")
    return creds.token


def clean_completion(text: str) -> str:
    """Clean up the completion text - remove markdown, excessive whitespace, ensure proper closure"""
    # Remove code fences
    text = re.sub(r"^```(?:verilog)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)

    # Remove common AI commentary
    text = re.sub(r"^(Here\'s|Here is|This is).*?:\s*", "", text, flags=re.IGNORECASE)

    # If the completion is just commentary without code, return empty
    if text.strip() and not any(
        keyword in text
        for keyword in [
            "module",
            "begin",
            "end",
            "always",
            "assign",
            "reg",
            "wire",
            "input",
            "output",
            "//",
            "/*",
        ]
    ):
        return ""

    return text


def ensure_proper_closure(text: str, prefix: str) -> str:
    """Ensure that blocks opened in prefix are properly closed in completion"""
    combined = prefix + text
    
    # Count module/endmodule
    module_count = len(re.findall(r'\bmodule\s+\w+', combined))
    endmodule_count = combined.count('endmodule')
    
    # If we have unclosed modules, add endmodule
    if module_count > endmodule_count:
        # Check if the completion already tried to close but was cut off
        if not text.strip().endswith('endmodule'):
            text = text.rstrip() + '\nendmodule'
    
    # Count function/endfunction
    function_count = len(re.findall(r'\bfunction\s+', combined))
    endfunction_count = combined.count('endfunction')
    
    if function_count > endfunction_count:
        if not text.strip().endswith('endfunction'):
            text = text.rstrip() + '\nendfunction'
    
    # Count task/endtask
    task_count = len(re.findall(r'\btask\s+', combined))
    endtask_count = combined.count('endtask')
    
    if task_count > endtask_count:
        if not text.strip().endswith('endtask'):
            text = text.rstrip() + '\nendtask'
    
    # Count begin/end blocks
    begin_count = combined.count('begin')
    end_count = len(re.findall(r'\bend\b', combined))
    
    if begin_count > end_count:
        # Add missing 'end' statements
        for _ in range(begin_count - end_count):
            text = text.rstrip() + '\n    end'
    
    return text


@router.post("/", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    """Generate code completion (non-streaming) using OpenAI"""
    from openai import OpenAI
    
    prompt_text = req.prompt.strip()

    if not prompt_text:
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    # Check for OpenAI API key
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured. Please add it to your .env file."
        )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Build a completion-focused prompt
        system_prompt = """You are a Verilog code completion assistant. Complete the code naturally and concisely.
Only return the completion code, no explanations or markdown.
Focus on syntactically correct Verilog that fits the context.
Always close blocks properly (endmodule, endfunction, endtask, end)."""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Complete this Verilog code:\n\n{prompt_text}"}
            ],
            max_tokens=req.max_tokens * 2,  # Increased to ensure we can fit closing statements
            temperature=req.temperature,
            stop=["\n\n\n\n"],  # Only stop on excessive blank lines (4+ newlines)
        )

        generated_text = response.choices[0].message.content or ""
        
        # Clean up the completion
        generated_text = clean_completion(generated_text)
        
        # Ensure proper closure of any blocks
        generated_text = ensure_proper_closure(generated_text, prompt_text)

        return GenerateResponse(text=generated_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")


@router.post("/stream")
async def generate_stream(req: GenerateRequest):
    """Generate code completion with streaming for real-time feedback"""
    prompt_text = req.prompt.strip()
    suffix_text = req.suffix.strip()

    if not prompt_text:
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    try:
        access_token = get_access_token()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Build FIM prompt
    if suffix_text:
        final_prompt = f"<fim_prefix>{prompt_text}<fim_suffix>{suffix_text}<fim_middle>"
    else:
        final_prompt = prompt_text

    url = f"https://{settings.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/{settings.VERTEX_PROJECT_NUMBER}/locations/{settings.VERTEX_LOCATION}/publishers/mistralai/models/codestral-2501:streamRawPredict"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "codestral-2501",
        "prompt": final_prompt,
        "max_tokens": req.max_tokens,
        "temperature": req.temperature,
        "stream": True,
        "stop": ["\n\n\n", "endmodule", "endfunction", "endtask"],
    }

    def stream_generator():
        try:
            with requests.post(
                url, json=payload, headers=headers, stream=True, timeout=15
            ) as response:
                response.raise_for_status()
                accumulated = ""

                for line in response.iter_lines():
                    if not line:
                        continue

                    decoded = line.decode("utf-8").strip()
                    if decoded.startswith("data: "):
                        decoded = decoded[6:]

                    if decoded == "[DONE]":
                        break

                    try:
                        data = json.loads(decoded)
                        choices = data.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                accumulated += content
                                # Clean and yield incrementally
                                cleaned = clean_completion(accumulated)
                                yield f"data: {json.dumps({'text': cleaned})}\n\n"
                    except json.JSONDecodeError:
                        continue

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")
