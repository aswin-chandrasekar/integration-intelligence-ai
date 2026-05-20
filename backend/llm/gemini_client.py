import os
import re
import json
from functools import lru_cache
from google import genai
from google.genai import types
from dotenv import load_dotenv

MODELS = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash"
]

def redact_secrets(text: str) -> str:
    """Basic redaction of credentials/secrets/hostnames before sending to LLM."""
    if not isinstance(text, str):
        return text
    # Redact DB urls
    text = re.sub(r'([A-Za-z0-9_]+)://([^:]+):([^@]+)@', r'\1://***:***@', text)
    # Redact common secrets
    text = re.sub(r'(api[_-]?key|secret|token|password)[\s:=]+[\'"]?([^\'"\s]+)[\'"]?', r'\1=***', text, flags=re.IGNORECASE)
    return text

def get_client():
    # Force load .env from backend directory to ensure keys are loaded
    base_dir = os.path.dirname(os.path.dirname(__file__))
    load_dotenv(os.path.join(base_dir, ".env"))
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    return genai.Client(api_key=api_key)

def generate_content_with_fallback(prompt: str, response_mime_type: str = None) -> str:
    client = get_client()
    if not client:
        raise ValueError("LLM integration is currently disabled (missing GEMINI_API_KEY). Please add it to your .env file.")
        
    last_error = None
    for model_name in MODELS:
        try:
            config = None
            if response_mime_type:
                config = types.GenerateContentConfig(response_mime_type=response_mime_type)
            
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            last_error = e
            continue
            
    # Try with "models/" prefix as fallback if it didn't match the client's internal list
    for model_name in MODELS:
        try:
            config = None
            if response_mime_type:
                config = types.GenerateContentConfig(response_mime_type=response_mime_type)
            
            response = client.models.generate_content(
                model=f"models/{model_name}",
                contents=prompt,
                config=config
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            last_error = e
            continue

    raise last_error if last_error else ValueError("All fallback Gemini models failed.")

@lru_cache(maxsize=128)
def explain_edge(source, target, edge_type, evidence_redacted):
    prompt = f"""You are an expert Software Architect.
Explain the following integration between two systems in 2-3 short sentences.
Source System: {source}
Target System: {target}
Integration Type: {edge_type}
Evidence: {evidence_redacted}

Focus on the architectural purpose and potential risks (e.g., synchronous coupling, database bottlenecks).
Do not use markdown formatting."""

    try:
        explanation = generate_content_with_fallback(prompt)
        return explanation
    except Exception as e:
        return f"Explanation currently unavailable ({str(e)})"

@lru_cache(maxsize=32)
def generate_architect_summary(graph_metrics_json):
    prompt = f"""You are an Enterprise Software Architect reviewing system metrics.
Using the following raw integration data and metrics:
{graph_metrics_json}

Write a professional, rich architecture summary. It should describe:
1. The size and complexity of the integration landscape (total integrations and total systems).
2. The primary driving communication patterns (synchronous integrations, database, and file ops).
3. The coupling hotspot representing the most connected system and its risk.
4. An assessment of overall operational risk based on these metrics.

Rules:
- Do not include recommendations, steps, or suggestions for remediation.
- Do not use bullet points or markdown formatting.
- Make it a single, cohesive narrative paragraph (4-6 sentences).
- Return strictly as JSON with key "summary" (string)."""

    try:
        response_text = generate_content_with_fallback(prompt, response_mime_type="application/json")
        return json.loads(response_text)
    except Exception as e:
        return {"summary": f"Failed to generate architecture summary: {str(e)}"}

def answer_architecture_query(query, graph_summary):
    prompt = f"""You are an Architecture AI Assistant.
A user asked: "{query}"

Here is the current system graph context (sanitized):
{graph_summary}

Answer the query concisely. If the context doesn't have the answer, say so based only on the provided architecture data."""

    try:
        answer = generate_content_with_fallback(prompt)
        return answer
    except Exception as e:
        return f"Query failed: {str(e)}"

def generate_llm_recommendations(edges_json):
    client = get_client()
    if not client:
        return []
        
    prompt = f"""You are a Principal Software Architect.
Analyze these system integration edges:
{edges_json}

Generate a list of 2-3 modernization recommendations to address system coupling, risk, and technical debt.
Return strictly as a JSON array of objects. Each object MUST have keys:
- "system" (string, the system name(s) affected)
- "title" (string, recommendation title)
- "severity" (string, either "LOW", "MEDIUM", "HIGH", or "CRITICAL")
- "why" (string, description of why it matters / integration risks)
- "recommendation" (string, the proposed modernization action)
- "steps" (list of strings, actionable steps to implement the recommendation)

Example:
[
  {{
    "system": "auth-service",
    "title": "Loose coupling for notification dispatch",
    "severity": "MEDIUM",
    "why": "Auth-service calls Notification-service synchronously, causing latency risks.",
    "recommendation": "Introduce a messaging queue (RabbitMQ) for async notifications.",
    "steps": ["Setup RabbitMQ broker", "Add worker service", "Convert auth REST call to message publish"]
  }}
]"""

    try:
        response_text = generate_content_with_fallback(prompt, response_mime_type="application/json")
        return json.loads(response_text)
    except Exception as e:
        print("LLM Recommendations failed:", e)
        return []

