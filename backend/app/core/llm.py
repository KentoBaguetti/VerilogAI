import json
import traceback
import requests
from typing import Generator, Dict, List

from google.auth import default
from google.auth.transport.requests import Request
from google.auth.exceptions import DefaultCredentialsError

from app.core.config import settings

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

def stream_vertex_ai(messages: List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1000) -> Generator[str, None, None]:
    token = get_access_token()
    
    # Using the Publisher Model URL
    # Note: We use streamRawPredict for streaming responses.
    url = f"https://{settings.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/{settings.VERTEX_PROJECT_NUMBER}/locations/{settings.VERTEX_LOCATION}/publishers/mistralai/models/codestral-2501:streamRawPredict"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "codestral-2501",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True 
    }
    
    try:
        with requests.post(url, json=payload, headers=headers, stream=True) as response:
            response.raise_for_status()
            # Vertex AI streamRawPredict returns a stream of JSON objects.
            # Note: requests.iter_lines() splits by newline.
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8').strip()
                    if not decoded_line:
                        continue
                        
                    # Remove "data: " prefix if present (SSE format)
                    if decoded_line.startswith("data: "):
                        decoded_line = decoded_line[6:]
                    
                    if decoded_line == "[DONE]":
                        break
                        
                    try:
                        # Sometimes the response might be wrapped in an array or just raw JSON objects
                        if decoded_line.startswith("[") and decoded_line.endswith("]"):
                             # It might be a list of objects, but stream usually sends one object at a time
                             # or a list containing one object.
                             data_list = json.loads(decoded_line)
                             for data in data_list:
                                 yield _extract_content(data)
                        else:
                             data = json.loads(decoded_line)
                             yield _extract_content(data)
                    except json.JSONDecodeError:
                        print(f"Failed to decode JSON line: {decoded_line}")
                        continue
    except Exception as e:
        print(f"Streaming error: {e}")
        yield f"\n[Error during generation: {str(e)}]"

def _extract_content(data: Dict) -> str:
    """Helper to extract content from Vertex AI response chunk"""
    # Adjust structure based on observed response
    # Common Mistral format: choices[0].delta.content or choices[0].message.content
    choices = data.get("choices", [])
    if not choices:
        return ""
        
    delta = choices[0].get("delta", {})
    content = delta.get("content", "")
    
    # Fallback if not delta (sometimes it sends full message in non-streaming mode or different format)
    if not content:
        message = choices[0].get("message", {})
        content = message.get("content", "")
        
    return content

