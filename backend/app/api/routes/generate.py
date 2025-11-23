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
    """Clean up the completion text - remove markdown, excessive whitespace"""
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


@router.post("/", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    """Generate code completion (non-streaming)"""
    prompt_text = req.prompt.strip()
    suffix_text = req.suffix.strip()

    if not prompt_text:
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    # Get access token
    try:
        access_token = get_access_token()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Build the prompt - Codestral FIM format
    if suffix_text:
        # FIM: Fill-in-middle with context
        final_prompt = f"<fim_prefix>{prompt_text}<fim_suffix>{suffix_text}<fim_middle>"
    else:
        # Regular completion
        final_prompt = prompt_text

    # API endpoint
    url = f"https://{settings.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/{settings.VERTEX_PROJECT_NUMBER}/locations/{settings.VERTEX_LOCATION}/publishers/mistralai/models/codestral-2501:rawPredict"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "codestral-2501",
        "prompt": final_prompt,
        "max_tokens": req.max_tokens,
        "temperature": req.temperature,
        "stop": [
            "\n\n\n",
            "endmodule",
            "endfunction",
            "endtask",
        ],  # Stop at logical boundaries
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        resp_json = response.json()

        # Extract completion
        generated_text = resp_json["choices"][0]["message"]["content"]

        # Clean up the completion
        generated_text = clean_completion(generated_text)

        return GenerateResponse(text=generated_text)

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"API request failed: {str(e)}")
    except (KeyError, IndexError) as e:
        raise HTTPException(
            status_code=500, detail=f"Unexpected response format: {resp_json}"
        )


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
