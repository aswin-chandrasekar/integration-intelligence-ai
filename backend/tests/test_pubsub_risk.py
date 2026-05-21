"""
Regression tests for pub/sub inclusion in architecture risk analysis.
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from classifier.risk_engine import calculate_risk


def test_pubsub_edges_are_included_in_risk_analysis():
    edges = [
        {"source": "ServiceA", "target": "Redis Pub/Sub", "type": "PUB_SUB"},
        {"source": "ServiceB", "target": "Redis Pub/Sub", "type": "PUB_SUB"},
    ]

    risk = calculate_risk(edges)

    assert isinstance(risk, list)
    assert any(item["system"] == "ServiceA" for item in risk)
    assert any(item["system"] == "ServiceB" for item in risk)
    assert any(item["system"] == "Redis Pub/Sub" for item in risk)
    assert all("riskScore" in item for item in risk)
