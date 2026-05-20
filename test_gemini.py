import json
from backend.llm.gemini_client import generate_llm_recommendations

edges = [
    {"source": "Auth", "target": "DB", "type": "DB", "confidence": "HIGH", "evidence": "db_connection_url"}
]
res = generate_llm_recommendations(json.dumps(edges))
print(type(res))
print(res)
