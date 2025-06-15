from typing import Any, Dict
import subprocess
import json
import traceback
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from google.auth import default
from google.auth.transport.requests import Request
from google.auth.exceptions import DefaultCredentialsError

PROJECT_NUMBER = "556201303018"
LOCATION       = "us-central1"
ENDPOINT_ID    = "6095566020552949760"

# Dedicated DNS for your endpoint
DEDICATED_DNS = f"{ENDPOINT_ID}.{LOCATION}-{PROJECT_NUMBER}.prediction.vertexai.goog"
REST_URL = (
    f"https://{DEDICATED_DNS}/"
    f"v1/projects/{PROJECT_NUMBER}/locations/{LOCATION}/"
    f"endpoints/{ENDPOINT_ID}:predict"
)

router = APIRouter(prefix="/tb", tags=["tb"])


class GenerateRequest(BaseModel):
    prompt: str


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


@router.post("/", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    # 1) Validate prompt
    prompt_text = ("You are hardware engineering expert, Give a testbench in Verilog for this verilog code and make sure to use this"+"initial begin $dumpfile test.vcd;$dumpvars 0,test, to generate vcd file for gtkwave" + req.prompt.strip())
    if not prompt_text:
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")
    # 2) Get access token
    try:
        access_token = get_access_token()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 4) Confirm that 'curl' is on PATH
    which_result = subprocess.run(["which", "curl"], capture_output=True, text=True)
    if which_result.returncode != 0:
        raise HTTPException(status_code=500, detail="curl not found on PATH")

    # 5) Build JSON payload
    payload_dict: Dict[str, Any] = { "model" : "codestral-2501", 
                                     "messages" : [{"role": "user", "content": prompt_text}],
                                     "temperature" : 0.6}
    payload_json = json.dumps(payload_dict)

    # 6) Build the curl command
    curl_cmd = [
        "curl",
        "-v",               # verbose so we see request/response in logs
        "-X", "POST",
        "-H", f"Authorization: Bearer {access_token}",
        "-H", "Content-Type: application/json",
        "https://us-central1-aiplatform.googleapis.com/v1/projects/556201303018/locations/us-central1/publishers/mistralai/models/codestral-2501:rawPredict",
        "-d", payload_json,
    ]
    # 7) Run curl and capture output
    try:
        result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=30)
    except subprocess.TimeoutExpired as e:
        raise HTTPException(status_code=500, detail="curl request timed out")

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"curl failed (exit code {result.returncode}): {result.stderr.strip()}"
        )

    # 8) Parse JSON response
    try:
        resp_json = json.loads(result.stdout)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON response from Vertex AI: {result.stdout}"
        )
    print(resp_json)
    # 9) Extract generated text
    try:
        generated_text = resp_json["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected response format: {resp_json}"
        )
    #marker = "\nOutput:\n"
    #if marker in generated_text:
        #generated_text = generated_text.split(marker, 1)[1]

    # 10) Return it
    return GenerateResponse(text=generated_text)
